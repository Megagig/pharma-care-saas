import { Response } from 'express';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import { AuthRequest } from '../middlewares/auth';
import { User } from '../models/User';
import { WorkspaceInvite } from '../models/WorkspaceInvite';
import { emailService } from '../utils/emailService';
import { workspaceAuditService } from '../services/workspaceAuditService';

/**
 * Workspace Team Management Controller
 * Handles member management operations for workspace owners
 */
class WorkspaceTeamController {
  /**
   * Get all members in the workspace with pagination and filters
   * @route GET /api/workspace/team/members
   */
  async getMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workplaceId = (req as any).workplaceId;
      
      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { workplaceId: new mongoose.Types.ObjectId(workplaceId) };

      // Apply search filter
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ];
      }

      // Apply role filter
      if (req.query.role) {
        query.workplaceRole = req.query.role;
      }

      // Apply status filter
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Get total count
      const total = await User.countDocuments(query);

      // Get members with pagination
      const members = await User.find(query)
        .select('-passwordHash -resetToken -verificationToken -verificationCode')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      // Format response
      const formattedMembers = members.map((member: any) => ({
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        workplaceRole: member.workplaceRole,
        status: member.status,
        joinedAt: member.createdAt,
        lastLoginAt: member.lastLoginAt,
        permissions: member.permissions || [],
        directPermissions: member.directPermissions || [],
      }));

      res.status(200).json({
        success: true,
        members: formattedMembers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching workspace members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workspace members',
        error: error.message,
      });
    }
  }

  /**
   * Update member role
   * @route PUT /api/workspace/team/members/:id
   */
  async updateMemberRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: memberId } = req.params;
      const { workplaceRole, reason } = req.body;
      const workplaceId = (req as any).workplaceId;
      const updatedBy = req.user?._id;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Validate workplaceRole
      const validRoles = ['Owner', 'Staff', 'Pharmacist', 'Cashier', 'Technician', 'Assistant'];
      if (!validRoles.includes(workplaceRole)) {
        res.status(400).json({
          success: false,
          message: 'Invalid workplace role',
        });
        return;
      }

      // Find member in the same workspace
      const member = await User.findOne({
        _id: new mongoose.Types.ObjectId(memberId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!member) {
        res.status(404).json({
          success: false,
          message: 'Member not found in this workspace',
        });
        return;
      }

      // Store old role for audit
      const oldRole = member.workplaceRole;

      // Update role
      member.workplaceRole = workplaceRole as any;
      member.roleLastModifiedBy = updatedBy;
      member.roleLastModifiedAt = new Date();
      await member.save();

      // Log the role change in audit trail
      await workspaceAuditService.logRoleAction(
        new mongoose.Types.ObjectId(workplaceId),
        updatedBy!,
        new mongoose.Types.ObjectId(memberId),
        'role_changed',
        {
          before: oldRole,
          after: workplaceRole,
          reason,
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        member: {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          workplaceRole: member.workplaceRole,
          status: member.status,
        },
        audit: {
          oldRole,
          newRole: workplaceRole,
          reason,
          updatedBy,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role',
        error: error.message,
      });
    }
  }

  /**
   * Remove member from workspace
   * @route DELETE /api/workspace/team/members/:id
   */
  async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: memberId } = req.params;
      const { reason } = req.body;
      const workplaceId = (req as any).workplaceId;
      const removedBy = req.user?._id;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Find member in the same workspace
      const member = await User.findOne({
        _id: new mongoose.Types.ObjectId(memberId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!member) {
        res.status(404).json({
          success: false,
          message: 'Member not found in this workspace',
        });
        return;
      }

      // Prevent removing workspace owner
      if (member.role === 'pharmacy_outlet') {
        res.status(403).json({
          success: false,
          message: 'Cannot remove workspace owner',
        });
        return;
      }

      // Store member info for audit
      const memberInfo = {
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        role: member.workplaceRole,
      };

      // Remove workspace association
      member.workplaceId = undefined;
      member.workplaceRole = undefined;
      member.status = 'suspended';
      member.suspendedAt = new Date();
      member.suspendedBy = removedBy;
      member.suspensionReason = reason || 'Removed from workspace';
      await member.save();

      // Log the member removal in audit trail
      await workspaceAuditService.logMemberAction(
        new mongoose.Types.ObjectId(workplaceId),
        removedBy!,
        new mongoose.Types.ObjectId(memberId),
        'member_removed',
        {
          reason: reason || 'Removed from workspace',
          metadata: memberInfo,
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Member removed from workspace successfully',
        audit: {
          memberId: member._id,
          memberEmail: member.email,
          reason,
          removedBy,
          removedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove member',
        error: error.message,
      });
    }
  }

  /**
   * Suspend a member
   * @route POST /api/workspace/team/members/:id/suspend
   */
  async suspendMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: memberId } = req.params;
      const { reason } = req.body;
      const workplaceId = (req as any).workplaceId;
      const suspendedBy = req.user?._id;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Find member in the same workspace
      const member = await User.findOne({
        _id: new mongoose.Types.ObjectId(memberId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!member) {
        res.status(404).json({
          success: false,
          message: 'Member not found in this workspace',
        });
        return;
      }

      // Prevent suspending workspace owner
      if (member.role === 'pharmacy_outlet') {
        res.status(403).json({
          success: false,
          message: 'Cannot suspend workspace owner',
        });
        return;
      }

      // Check if already suspended
      if (member.status === 'suspended') {
        res.status(400).json({
          success: false,
          message: 'Member is already suspended',
        });
        return;
      }

      // Update member status to suspended
      member.status = 'suspended';
      member.suspendedAt = new Date();
      member.suspendedBy = suspendedBy;
      member.suspensionReason = reason;
      await member.save();

      // Log the suspension in audit trail
      await workspaceAuditService.logMemberAction(
        new mongoose.Types.ObjectId(workplaceId),
        suspendedBy!,
        new mongoose.Types.ObjectId(memberId),
        'member_suspended',
        {
          reason,
          metadata: {
            email: member.email,
            name: `${member.firstName} ${member.lastName}`,
          },
        },
        req
      );

      // Send suspension notification email (don't block response)
      emailService
        .sendAccountSuspensionNotification(member.email, {
          firstName: member.firstName,
          reason,
        })
        .catch((error: any) => {
          console.error('Failed to send suspension notification email:', error);
        });

      res.status(200).json({
        success: true,
        message: 'Member suspended successfully',
        member: {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          status: member.status,
          suspendedAt: member.suspendedAt,
          suspensionReason: member.suspensionReason,
        },
        audit: {
          action: 'member_suspended',
          memberId: member._id,
          memberEmail: member.email,
          reason,
          suspendedBy,
          suspendedAt: member.suspendedAt,
        },
      });
    } catch (error: any) {
      console.error('Error suspending member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend member',
        error: error.message,
      });
    }
  }

  /**
   * Get audit logs for the workspace
   * @route GET /api/workspace/team/audit
   */
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workplaceId = (req as any).workplaceId;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Parse query parameters
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        actorId: req.query.actorId as string,
        targetId: req.query.targetId as string,
        category: req.query.category as string,
        action: req.query.action as string,
        severity: req.query.severity as string,
      };

      // Get audit logs
      const result = await workspaceAuditService.getAuditLogs(
        new mongoose.Types.ObjectId(workplaceId),
        filters
      );

      res.status(200).json({
        success: true,
        logs: result.logs,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message,
      });
    }
  }

  /**
   * Export audit logs to CSV
   * @route GET /api/workspace/team/audit/export
   */
  async exportAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workplaceId = (req as any).workplaceId;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Parse query parameters
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        actorId: req.query.actorId as string,
        targetId: req.query.targetId as string,
        category: req.query.category as string,
        action: req.query.action as string,
        severity: req.query.severity as string,
      };

      // Export audit logs
      const csv = await workspaceAuditService.exportAuditLogs(
        new mongoose.Types.ObjectId(workplaceId),
        filters
      );

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="workspace-audit-logs-${Date.now()}.csv"`
      );

      res.status(200).send(csv);
    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message,
      });
    }
  }

  /**
   * Get audit statistics for the workspace
   * @route GET /api/workspace/team/audit/statistics
   */
  async getAuditStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workplaceId = (req as any).workplaceId;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Parse date range if provided
      let dateRange;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string),
        };
      }

      // Get statistics
      const statistics = await workspaceAuditService.getAuditStatistics(
        new mongoose.Types.ObjectId(workplaceId),
        dateRange
      );

      res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error: any) {
      console.error('Error fetching audit statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit statistics',
        error: error.message,
      });
    }
  }

  /**
   * Activate a suspended member
   * @route POST /api/workspace/team/members/:id/activate
   */
  async activateMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: memberId } = req.params;
      const workplaceId = (req as any).workplaceId;
      const reactivatedBy = req.user?._id;

      if (!workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Workplace ID is required',
        });
        return;
      }

      // Find member in the same workspace
      const member = await User.findOne({
        _id: new mongoose.Types.ObjectId(memberId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!member) {
        res.status(404).json({
          success: false,
          message: 'Member not found in this workspace',
        });
        return;
      }

      // Check if member is suspended
      if (member.status !== 'suspended') {
        res.status(400).json({
          success: false,
          message: 'Member is not suspended',
        });
        return;
      }

      // Store previous suspension info for audit
      const previousSuspensionReason = member.suspensionReason;
      const previousSuspendedAt = member.suspendedAt;

      // Reactivate member
      member.status = 'active';
      member.reactivatedAt = new Date();
      member.reactivatedBy = reactivatedBy;
      // Keep suspension history but clear current suspension fields
      member.suspensionReason = undefined;
      member.suspendedAt = undefined;
      member.suspendedBy = undefined;
      await member.save();

      // Log the activation in audit trail
      await workspaceAuditService.logMemberAction(
        new mongoose.Types.ObjectId(workplaceId),
        reactivatedBy!,
        new mongoose.Types.ObjectId(memberId),
        'member_activated',
        {
          reason: `Reactivated after suspension: ${previousSuspensionReason}`,
          metadata: {
            email: member.email,
            name: `${member.firstName} ${member.lastName}`,
            previousSuspensionReason,
            previousSuspendedAt,
          },
        },
        req
      );

      // Send reactivation notification email (don't block response)
      emailService
        .sendAccountReactivationNotification(member.email, {
          firstName: member.firstName,
        })
        .catch((error: any) => {
          console.error('Failed to send reactivation notification email:', error);
        });

      res.status(200).json({
        success: true,
        message: 'Member activated successfully',
        member: {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          status: member.status,
          reactivatedAt: member.reactivatedAt,
        },
        audit: {
          action: 'member_activated',
          memberId: member._id,
          memberEmail: member.email,
          previousSuspensionReason,
          previousSuspendedAt,
          reactivatedBy,
          reactivatedAt: member.reactivatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error activating member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate member',
        error: error.message,
      });
    }
  }

**
   * Generate a new invite link
);r(lleontroaceTeamCspw Workroller = nemContceTeaonst workspaport c}

ex    }
  }
     });

 sage,esrror.m e  error:    r',
  eject membe to re: 'Failed    messagfalse,
    success:   on({
      s(500).jsatu    res.st
  ', error);ber:memting r rejecr('Errosole.erro   conny) {
   : a (error    } catch  });
           },
e(),
 atw DctedAt: ne     reje   ctedBy,
  je     re        reason,
       .email,
membermail: berEmem       ,
   ember._id: mmberId         medit: {
 
        auessfully',d succr rejectembege: 'Mesaes   me,
     uccess: tru s    
   n({00).jsoatus(2  res.st
    );
       }, error);
 tion email:'icanotifjection d to send relee.error('Fai   consol
       any) => {r: (erro.catch(   
     })
        his time',d at trove not appuest was reqembershipur m'Yo||  reason on:eas    r     
 e',spacme || 'WorkNaworkplace?.e: req.useramaceNworksp          
stName,irmember.fme:    firstNa {
       l,main(member.enNotificatioberRejectio.sendMem   ice
     erv   emailSponse)
   k resbloct mail (don'tification en nond rejectio     // Se     );

   req
 },
      
        fo,erInta: memb   metada       d',
ejectet rip requesbersh || 'Memon: reason    reas      {
 
       ,ected'ej'member_r     ),
   (memberId.ObjectIdgoose.Types  new mony!,
      tedBec     rej
   laceId),workpbjectId(oose.Types.O    new mong    rAction(
ce.logMembeitServiaceAudrkspawait wo      dit trail
on in auecti the rej// Log  ;

    ember.save()t mai aw;
     ctedByy = rejeuspendedBer.s  memb    e();
new DatpendedAt = sus  member.
    d';ejectequest rembership re| 'Meason |n = reasosionRuspen    member.sended';
   = 'susptatus member.sd;
     = undefinele .workplaceRo memberned;
     fiundeplaceId = ber.workd
      memas rejecteand mark association  workspace  // Remove

           };e,
orkplaceRolle: member.wro
        tName}`,as} ${member.lrstNamer.fime: `${membe
        nar.email,ail: membe     em {
   emberInfo =     const maudit
 for o ber infmemtore 
      // S
      }return;

        ;})    e',
    workspacund in this  not fonding member: 'Pemessage  
        ess: false,succ        
  (404).json({tatus res.s    r) {
   (!membe if    });

  g',
      pendins: ' statu       kplaceId),
ObjectId(wore.Types.mongoosaceId: new  workpl
       emberId),(mjectIdes.Obgoose.Typd: new mon       _i
 indOne({ait User.fber = awonst mem
      ce workspacethe sam member in nding/ Find pe /

           } return;

           });,
    required' ID is lacesage: 'Workp   mese,
       fals   success:     
   .json({status(400)es.       rceId) {
 f (!workpla
      i._id;
= req.user?ctedBy  reje   constceId;
   pla).works any aeqd = (raceI workplst condy;
      } = req.boeason{ rst 
      conparams; } = req.berId { id: mem   const{
   
    try ise<void> { Promonse):espst, res: RequeuthRmber(req: AMeeject async r/
 reject
   *tes/:id/ce/team/inviworkspa /api/ @route POST
   *berng memect a pendi * Rej
  /**
  
   }
  }     });
 
 or.message, err error:',
       ember approve m: 'Failed tossage     me   ss: false,
 succen({
       (500).jso.status     resor);
 mber:', errproving meor aprrr('E.erro    consoley) {
   anatch (error:    } c      });
 },
   
    status, member.    status:e,
      rkplaceRol.woer: memborkplaceRole       w  il,
 member.ema    email: 
      r.lastName,bememame:    lastN       Name,
r.firstme: memberstNa      fi,
    : member._id       _id{
   ber: mem       ssfully',
 succeoved apprge: 'Member essa
        mcess: true,suc     json({
   ).s(200s.statu
      re});

        ', error);ation email: notificd approvalailed to senrror('Fonsole.e          c any) => {
(error:catch(       .   })
 Role,
     ce.workplale: member   ro     
  rkspace',|| 'Woe placeNamr?.workreq.usee: spaceNamrk       woe,
   amber.firstNName: mem     first
      {mber.email,(metionotificaalNberApprov .sendMeme
       ervicilSema      se)
responon't block on email (dificati notpproval/ Send a    /
     );
req
          },
         },
   
       e}`,mber.lastNam{metName} $rsember.fiame: `${m       nail,
     r.emmbeail: me       em
     tadata: {me   ,
       kplaceRoleber.worem role: m      {
           d',
r_approvebe 'mem
       d),Id(memberIbjecte.Types.Ooosmong     new 
   edBy!,ov       appr
 eId),workplacs.ObjectId(ose.Typeew mongo
        nction(logMemberAe.ditServicspaceAu  await workl
    rait tudioval in aLog the appr    // );

  er.save(t memb
      awai  }s any;
    eRole aac workple =placeRolmember.work {
        rkplaceRole)    if (woive';
  tus = 'actmber.stave
      me to actiustatmber sdate me
      // Up     }
 return;
          });
  ce',
    is workspa thd in founnotg member age: 'Pendin   mess     alse,
   success: f{
         on(tus(404).js     res.staber) {
   !mem      if (   });

ing',
   endtatus: 'p     s
   aceId),ctId(workple.Types.ObjeongoosaceId: new m  workpl     erId),
 (membs.ObjectIdose.Typengod: new mo
        _indOne({wait User.fi = anst member
      coacekspwore samr in the  membengFind pendi
      //       }
 return;
    });
     
      s required', ice ID: 'Workplasage      mes  se,
  s: fal  succes      on({
  00).js(4status      res.eId) {
  plac(!work
      if er?._id;
.us = reqt approvedBycons
      kplaceId;.worreq as any)ceId = (nst workpla cody;
     .bo= reqlaceRole } workpnst { ;
      comsaraeq.perId } = r memb const { id:
     ry {  toid> {
  omise<ve): Prns, res: RespoAuthRequester(req: embeM approv
  async */
  pprovees/:id/anvitam/irkspace/tePOST /api/wo  * @route er
 mb pending me * Approve a
  /**
   }
  }
      });
  essage,
 error.mor: 
        errpprovals',ng ach pendied to fetil 'Fage:essa,
        mccess: false    su({
    500).json res.status();
     , errorals:'nding approvtching peferor r('Ersole.erro con) {
     or: any} catch (err;
      })th,
    ng.leberspendingMem     count:   })),
       atedAt,
  cre: member.   createdAt
       placeRole,r.workbeeRole: mem  workplac,
        .emailmemberemail:          tName,
 : member.las    lastNameame,
      ember.firstNstName: mir    f      d,
_ier.d: memb         _i> ({
 y) =(member: aners.map(Membng: pendiersendingMemb p     : true,
      success({
    ).json00atus(2.st
      res();
    .lean    1 })
t: -atedArt({ cre        .so')
edAtcreatrkplaceRole ame email woName lastNfirst .select(' })
         ing',
   tatus: 'pend s),
       aceIdrkpl.ObjectId(woose.Types new mongoaceId:orkpl      wfind({
  wait User.= angMembers const pendi     pace
 s worksatus in thiing stndwith pers  // Find use }

       
       return; });
    ,
        required' ID isrkplace'Woessage:    m     
  alse,ess: f   succ
       ).json({00s.status(4        reaceId) {
pl if (!work   

  ceId;any).workpla (req as ceId =la const workp    {
  > {
    tryidromise<voResponse): P res: uthRequest,eq: Avals(rroetPendingAppc g  asynng
   */
es/pendieam/invitworkspace/tte GET /api/* @rous
   proval member aping pendGet  /**
   * 
 }
  }

   );   }essage,
   error.mrror: ,
        ee invite'vokd to reailessage: 'F      me: false,
  cess   suc     00).json({
tatus(5s.sre;
      te:', error)king invir revor('Erronsole.erro     cor: any) {
 tch (erro);
    } ca
      }
        },revokedBy,invite.By: revoked   
       okedAt,e.revvitkedAt: in    revous,
      nvite.stats: itu         staemail,
 invite.:  email,
         vite._id: inid       _: {
       invite  
  ssfully',oked succete rev: 'Invi   message,
     : true  success({
      onatus(200).jss.stre;

        )       req
  },
               },
    
  piresAt,.exesAt: inviteirExpiginal          ord,
  ite._iiteId: invinv         ta: {
    metada       eRole,
  ite.workplac: inv  role,
        maill: invite.e  emai{
             ed',
   invite_revok '       
  undefined,    edBy!,
   revok      d),
 eIacworkplectId(ypes.Obj mongoose.Tew
        nteAction(viice.logInuditServaceAait workspaw    rail
  n in audit the revocatio Log t

      //ve();invite.sa    await   vokedBy!);
te.revoke(re    invite
  oke the invi Rev //

           }rn;
       retu   });
 s}`,
     tue.sta ${invitth status:e winvitoke innot revmessage: `Ca
           false,cess:      suc({
    00).jsontus(4res.sta    {
    pending') tus !== ' (invite.sta    if
  n be revokedite cak if invChec//        }

   ;
  turn  re    
          });kspace',
is worund in thvite not fo: 'Insagees m   lse,
      success: fa       {
   s(404).json(  res.statu) {
      nviteif (!i     

 });  Id),
    cekplaectId(wores.ObjTypew mongoose.ceId: n   workplaId),
     d(inviteObjectIoose.Types.d: new mong
        _ie.findOne({eInvitit Workspac= awavite   const ine
    me workspacthe sa in tevid in/ Fin

      /n;
      }   retur;
           })  equired',
s rID irkplace essage: 'Wo   m
       se,ccess: fal        su
  ({son(400).jtatus    res.sd) {
    placeIf (!work

      iser?._id;dBy = req.ukeevost r   cond;
   placeIork any).w= (req aslaceId rkp wo     constms;
 rareq.pad } = : inviteI const { id    {
  {
    try d>se<voi): Promisponseest, res: RehRequq: AutokeInvite(re  async rev
   */
s/:idinvitee/team/spacork /api/wroute DELETE
   * @nk invite livoke an   * Re

  /**
    }
  }
     });e,
 or.messagrrerror: e        invites',
d to fetch ge: 'Faile      messae,
  uccess: fals
        s).json({00atus(5    res.stor);
  ites:', errhing invfetc'Error .error(console     any) {
  ror:h (er} catc
    });          },
 imit),
   tal / lMath.ceil(tolPages:    tota      total,
       it,
            limage,
     p {
       n:natio    pagi,
    attedInvitestes: form   invi
     : true,   success    .json({
 atus(200)     res.st

 )); }    
 e(), new DatiresAt <nvite.expsExpired: i   i     createdAt,
e.t: invitatedA        creBy,
revokedte.: invi  revokedBy    
  ,revokedAtinvite.kedAt:   revoon,
      tionReaste.rejecon: inviionReasreject  
      ctedBy,nvite.rejedBy: iejecte   redAt,
     rejectAt: invite.rejected     ,
   ceptedBy: invite.acacceptedBy       
 cceptedAt,t: invite.atedA      accep  itedBy,
nvnvite.idBy: ite       invi
 sage,personalMes invite.ge:ersonalMessa    poval,
    iresApprite.requnvsApproval: i require     axUses,
   invite.mmaxUses:   ount,
     e.usedCinvitCount: sed   u  
   iresAt,xpinvite.eAt: pires      ex
  s,vite.statu intus:      staceRole,
  vite.workplainlaceRole: rkp       wo,
 vite.email email: in       id,
nvite._     _id: i   => ({
 invite: any)nvites.map((tes = iedInviormatt  const f     response
ormat   // F
   ();
ean
        .l)-1 }atedAt: sort({ cre)
        .imit(limit
        .lkip)p(s     .ski)
   ame email'me lastNy', 'firstNaevokedBopulate('r
        .p')tName email las'firstNametedBy', te('rejec .popula     mail')
  tName easName l 'firstedBy','acceptpopulate(  .)
      email'e lastName  'firstNamvitedBy',ate('inulop
        .pfind(query)aceInvite.Workspit tes = awa  const invi   gination
 tes with painvi/ Get 
      /s(query);
cumenttDo.counkspaceInviteit Wor total = awaonstunt
      cGet total co // 
     
;
      }tatuseq.query.s.status = rquery
        status) {req.query. (    ifilter
  ly status f/ App
      /d) };
eItId(workplac.Types.Objecnew mongooseorkplaceId: y: any = { wquer    const ld query
   Bui     //imit;

 e - 1) * l = (pagkipst s;
      con|| 20) ngas striery.limit t(req.quseIn= parconst limit  1;
      string) ||.page as .queryInt(req = parset pageons crs
     n parameteionatParse pagi

      //  }
     urn;     ret
      });',
     requiredce ID is kplae: 'Woressag      m
    s: false,      succes  .json({
  tus(400)   res.sta     eId) {
rkplac  if (!woeId;

    lacs any).workp (req aorkplaceId =   const w  try {
 oid> {
     Promise<vonse):es: ResphRequest, r(req: Autc getInvites  asyn
ites
   *//invce/teamkspa/api/worroute GET * @kspace
    the worinvites foret all * G  

  /**
   }
    }

      });ssage,ror.mer: er       erro
 ,nvite'generate ied to  'Fail    message:  alse,
  cess: f       suc({
 500).jsonatus(s.st
      re:', error);iteng invror generatir('Ererro    console.  y) {
or: anh (err   } catc   });
    },
        ,
tedAtte.creavi: increatedAt
          Approval,uiresnvite.reqval: iquiresAppro re
         e.maxUses,xUses: invit ma      sAt,
   nvite.expiret: iiresA exp   ,
      orkplaceRolete.wvi inkplaceRole:       wor
   email,: invite.email      ,
    rl   inviteU      ,
 okennviteT: invite.ieniteTok        invite._id,
  : inv   _id{
       e: it  invy',
       successfulledte generatge: 'Invissa      me
  ess: true,        succ{
json(s(201).s.statu     re;

 })
        ;error):', emailvite end in to sedor('Failrrnsole.e      co> {
    y) =r: ancatch((erro        .   })
sage,
     rsonalMes      pe
    expiresAt,        iteUrl,
    inv
        Role,lacele: workp        ropace',
  rksWo '||rkplaceName ter?.woe: inviceNam  workspa`,
        e}amiter?.lastN} ${invNamestviter?.firme: `${initerNa inv    l, {
     emaimail(eEnvitpaceIorksdW     .sence
    emailServi   q.user;
  inviter = re const nse)
     espo block ron'tte email (dnd invi // Se

     ;
      )     req},
         },
          s,
  te.maxUseinvimaxUses:           ._id,
  vite: innviteId  i        {
  ta: da   meta  val,
     Approquires   re  t,
        expiresA       le,
laceRo workple:        ro  il,
   ema
          {ed',
     enerat   'invite_g
     ned,ndefi   u
     y!,nvitedB    i
    d),ceIrkplabjectId(wooose.Types.Omong  new       on(
Actice.logInviteuditServikspaceA  await wor
     audit trail ine generationthe invit // Log 
     teToken}`;
{inviinvite=$signup?l}/dUr${fronten `eUrl =nvit const i    :3000';
 /localhost| 'http:/TEND_URL |env.FRONprocess.rl = ntendU   const fro
    URLnvitete i/ Genera    /();

  vite.savet in    awai });

  e,
     agrsonalMess
        pe || false,ovaluiresAppral: reqquiresApprov      re
   0,Count:      used1,
   || ses: maxUses   maxUAt,
     xpires   eedBy,
            invitending',
   status: 'p    
  laceRole,      workpCase(),
  er.toLowmail: email        eToken,
    invite,
    rkplaceId)d(wo.ObjectIoose.TypesId: new mong   workplace    Invite({
 Workspace = new inviteconst      te
 ate invi // Cre

      * 1000); * 60 * 60nDays * 24iresI) + expw(te(Date.no new Da =t expiresAt    consate
  ration date expiCalcul   //   'hex');

 ng(oStrites(32).tdomByrypto.ran= cn viteToke    const inoken
  nvite t secure i/ Generate /     

};
      turn re);
        }       },
         ,
 .expiresAtistingInviteiresAt: exexp            vite._id,
tingIn_id: exis         {
    e:      invitail',
    s em for thixistste already enviactive in age: 'A       mess
   ,: false   success{
       400).json(es.status({
        rpired()) sExngInvite.itiexis && !istingInviteif (ex   );

   ',
      }: 'pending   status,
     orkplaceId)ctId(we.Types.Objeoos new mongd:rkplaceI     wo),
   erCase(email.toLow     email: ({
   te.findOneInvit Workspaceite = awaixistingInv const e     mail
or this e invite f a pendingadyhere's alreCheck if t//      
     }
n;
    retur
              });ace',
this workspember of  a m already 'User ise:ssag          mese,
s: fal  succes        ({
.jsons(400) res.statu
       r) {ngMembe (existi      if
    });
laceId),
  orkpjectId(wypes.Obe.T mongooseId: newrkplac
        wose(),rCal.toLowel: emaiai   emne({
     t User.findOwaiember = aistingM  const ex  orkspace
  in this wsts lready exif user ack i // Che }

     ;
     turn      re  });
        ired',
equlace ID is rage: 'Workp       mess false,
   ss:    succen({
      00).jsos(4atu   res.st {
     laceId)  if (!workpid;

    .user?._ = reqByitednv     const i
 aceId;).workplreq as any (Id =st workplace      con.body;
 = reqMessage }personalproval, esApUses, requiraxys, mDasInle, expireaceRol, workpl emai   const {ry {
       t> {
se<voidnse): Promires: Respo, uesteqe(req: AuthRateInvitync gener
  asvites
   */ace/team/inpi/workspute POST /a   * @ro
