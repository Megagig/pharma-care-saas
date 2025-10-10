import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { User } from '../models/User';
import { emailService } from '../utils/emailService';

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

      // Remove workspace association
      member.workplaceId = undefined;
      member.workplaceRole = undefined;
      member.status = 'suspended';
      member.suspendedAt = new Date();
      member.suspendedBy = removedBy;
      member.suspensionReason = reason || 'Removed from workspace';
      await member.save();

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
}

export const workspaceTeamController = new WorkspaceTeamController();
