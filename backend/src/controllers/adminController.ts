import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import FeatureFlag from '../models/FeatureFlag';
import uploadService from '../utils/uploadService';
import { emailService } from '../utils/emailService';

interface AuthRequest extends Request {
   user?: any;
   subscription?: any;
}

export class AdminController {
   // User Management
   async getAllUsers(req: AuthRequest, res: Response): Promise<any> {
      try {
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 20;
         const role = req.query.role as string;
         const status = req.query.status as string;
         const licenseStatus = req.query.licenseStatus as string;

         const query: any = {};
         if (role) query.role = role;
         if (status) query.status = status;
         if (licenseStatus) query.licenseStatus = licenseStatus;

         const users = await User.find(query)
            .populate('currentPlanId', 'name priceNGN')
            .populate('currentSubscriptionId', 'status tier endDate')
            .populate('parentUserId', 'firstName lastName role')
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

         const total = await User.countDocuments(query);

         res.json({
            success: true,
            data: {
               users,
               pagination: {
                  page,
                  limit,
                  total,
                  pages: Math.ceil(total / limit),
               },
            },
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: (error as Error).message,
         });
      }
   }

   async getUserById(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;

         const user = await User.findById(userId)
            .populate('currentPlanId')
            .populate('currentSubscriptionId')
            .populate('parentUserId', 'firstName lastName role')
            .populate('teamMembers', 'firstName lastName role status')
            .select('-passwordHash');

         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         res.json({
            success: true,
            data: user,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: (error as Error).message,
         });
      }
   }

   async updateUserRole(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;
         const { role, permissions } = req.body;

         const user = await User.findById(userId);
         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         const validRoles = [
            'pharmacist',
            'pharmacy_team',
            'pharmacy_outlet',
            'intern_pharmacist',
         ];
         if (!validRoles.includes(role)) {
            return res.status(400).json({
               success: false,
               message: 'Invalid role',
            });
         }

         user.role = role;
         if (permissions) {
            user.permissions = permissions;
         }

         await user.save();

         // Send notification email
         await emailService.sendRoleUpdateNotification(user.email, {
            firstName: user.firstName,
            newRole: role,
            updatedBy: req.user.firstName + ' ' + req.user.lastName,
         });

         res.json({
            success: true,
            message: 'User role updated successfully',
            data: user,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: (error as Error).message,
         });
      }
   }

   async suspendUser(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;
         const { reason } = req.body;

         const user = await User.findById(userId);
         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         user.status = 'suspended';
         await user.save();

         // Suspend all active subscriptions
         await Subscription.updateMany(
            { userId: userId, status: 'active' },
            { status: 'suspended' }
         );

         // Send notification email
         await emailService.sendAccountSuspensionNotification(user.email, {
            firstName: user.firstName,
            reason: reason || 'Administrative action',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@pharmacare.com',
         });

         res.json({
            success: true,
            message: 'User suspended successfully',
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error suspending user',
            error: (error as Error).message,
         });
      }
   }

   async reactivateUser(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;

         const user = await User.findById(userId);
         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         user.status = 'active';
         await user.save();

         // Reactivate subscriptions if they're still valid
         const validSubscriptions = await Subscription.find({
            userId: userId,
            status: 'suspended',
            endDate: { $gt: new Date() },
         });

         for (const subscription of validSubscriptions) {
            subscription.status = 'active';
            await subscription.save();
         }

         await emailService.sendAccountReactivationNotification(user.email, {
            firstName: user.firstName,
         });

         res.json({
            success: true,
            message: 'User reactivated successfully',
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error reactivating user',
            error: (error as Error).message,
         });
      }
   }

   // License Management
   async getPendingLicenses(req: AuthRequest, res: Response): Promise<any> {
      try {
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 20;

         const users = await User.find({
            licenseStatus: 'pending',
            licenseDocument: { $exists: true },
         })
            .select(
               'firstName lastName email licenseNumber licenseDocument createdAt'
            )
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

         const total = await User.countDocuments({
            licenseStatus: 'pending',
            licenseDocument: { $exists: true },
         });

         res.json({
            success: true,
            data: {
               licenses: users,
               pagination: {
                  page,
                  limit,
                  total,
                  pages: Math.ceil(total / limit),
               },
            },
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error fetching pending licenses',
            error: (error as Error).message,
         });
      }
   }

   async approveLicense(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;
         const { notes } = req.body;

         const user = await User.findById(userId);
         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         user.licenseStatus = 'approved';
         user.licenseVerifiedAt = new Date();
         user.licenseVerifiedBy = req.user._id;
         user.status = 'active'; // Activate account if license was the only barrier

         await user.save();

         // Send approval email
         await emailService.sendLicenseApprovalNotification(user.email, {
            firstName: user.firstName,
            licenseNumber: user.licenseNumber || '',
            notes: notes || '',
         });

         res.json({
            success: true,
            message: 'License approved successfully',
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error approving license',
            error: (error as Error).message,
         });
      }
   }

   async rejectLicense(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { userId } = req.params;
         const { reason } = req.body;

         if (!reason) {
            return res.status(400).json({
               success: false,
               message: 'Rejection reason is required',
            });
         }

         const user = await User.findById(userId);
         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         user.licenseStatus = 'rejected';
         user.licenseRejectionReason = reason;
         user.licenseVerifiedAt = new Date();
         user.licenseVerifiedBy = req.user._id;
         user.status = 'license_rejected';

         await user.save();

         // Send rejection email
         await emailService.sendLicenseRejectionNotification(user.email, {
            firstName: user.firstName,
            reason: reason,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@pharmacare.com',
         });

         res.json({
            success: true,
            message: 'License rejected',
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error rejecting license',
            error: (error as Error).message,
         });
      }
   }

   // Feature Flag Management
   async createFeatureFlag(req: AuthRequest, res: Response): Promise<any> {
      try {
         const {
            name,
            key,
            description,
            allowedTiers,
            allowedRoles,
            customRules,
            metadata,
         } = req.body;

         const existingFlag = await FeatureFlag.findOne({ key });
         if (existingFlag) {
            return res.status(400).json({
               success: false,
               message: 'Feature flag with this key already exists',
            });
         }

         const featureFlag = new FeatureFlag({
            name,
            key,
            description,
            allowedTiers,
            allowedRoles,
            customRules,
            metadata,
            createdBy: req.user._id,
            updatedBy: req.user._id,
         });

         await featureFlag.save();

         res.status(201).json({
            success: true,
            message: 'Feature flag created successfully',
            data: featureFlag,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error creating feature flag',
            error: (error as Error).message,
         });
      }
   }

   async updateFeatureFlag(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { flagId } = req.params;
         const updates = { ...req.body, updatedBy: req.user._id };

         const featureFlag = await FeatureFlag.findByIdAndUpdate(
            flagId,
            updates,
            {
               new: true,
               runValidators: true,
            }
         );

         if (!featureFlag) {
            return res.status(404).json({
               success: false,
               message: 'Feature flag not found',
            });
         }

         res.json({
            success: true,
            message: 'Feature flag updated successfully',
            data: featureFlag,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error updating feature flag',
            error: (error as Error).message,
         });
      }
   }

   async getAllFeatureFlags(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { category, isActive, tier, role } = req.query;

         const query: any = {};
         if (category) query['metadata.category'] = category;
         if (isActive !== undefined) query.isActive = isActive === 'true';
         if (tier) query.allowedTiers = tier;
         if (role) query.allowedRoles = role;

         const featureFlags = await FeatureFlag.find(query)
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .sort({ 'metadata.priority': -1, createdAt: -1 });

         res.json({
            success: true,
            data: featureFlags,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error fetching feature flags',
            error: (error as Error).message,
         });
      }
   }

   // System Analytics
   async getSystemAnalytics(req: AuthRequest, res: Response): Promise<any> {
      try {
         const [userStats, subscriptionStats, licenseStats] = await Promise.all(
            [
               // User statistics
               User.aggregate([
                  {
                     $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                        active: {
                           $sum: {
                              $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                           },
                        },
                     },
                  },
               ]),

               // Subscription statistics
               Subscription.aggregate([
                  {
                     $group: {
                        _id: '$tier',
                        count: { $sum: 1 },
                        active: {
                           $sum: {
                              $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                           },
                        },
                        revenue: { $sum: '$priceAtPurchase' },
                     },
                  },
               ]),

               // License statistics
               User.aggregate([
                  {
                     $match: {
                        licenseStatus: { $ne: 'not_required' },
                     },
                  },
                  {
                     $group: {
                        _id: '$licenseStatus',
                        count: { $sum: 1 },
                     },
                  },
               ]),
            ]
         );

         res.json({
            success: true,
            data: {
               users: userStats,
               subscriptions: subscriptionStats,
               licenses: licenseStats,
               generated: new Date(),
            },
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error generating analytics',
            error: (error as Error).message,
         });
      }
   }
}

export const adminController = new AdminController();
