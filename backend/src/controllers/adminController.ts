import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import FeatureFlag from '../models/FeatureFlag';
import { uploadService } from '../utils/uploadService';
import { emailService } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

export class AdminController {
  // User Management
  async getAllUsers(req: AuthRequest, res: Response) {
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
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  }

  async getUserById(req: AuthRequest, res: Response) {
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
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  }

  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { role, permissions } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const validRoles = ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'intern_pharmacist'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
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
        updatedBy: req.user.firstName + ' ' + req.user.lastName
      });

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user role',
        error: error.message
      });
    }
  }

  async suspendUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
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
        supportEmail: process.env.SUPPORT_EMAIL
      });

      res.json({
        success: true,
        message: 'User suspended successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error suspending user',
        error: error.message
      });
    }
  }

  async reactivateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.status = 'active';
      await user.save();

      // Reactivate subscriptions if they're still valid
      const validSubscriptions = await Subscription.find({\n        userId: userId,\n        status: 'suspended',\n        endDate: { $gt: new Date() }\n      });\n\n      for (const subscription of validSubscriptions) {\n        subscription.status = 'active';\n        await subscription.save();\n      }\n\n      await emailService.sendAccountReactivationNotification(user.email, {\n        firstName: user.firstName\n      });\n\n      res.json({\n        success: true,\n        message: 'User reactivated successfully'\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error reactivating user',\n        error: error.message\n      });\n    }\n  }\n\n  // License Management\n  async getPendingLicenses(req: AuthRequest, res: Response) {\n    try {\n      const page = parseInt(req.query.page as string) || 1;\n      const limit = parseInt(req.query.limit as string) || 20;\n\n      const users = await User.find({\n        licenseStatus: 'pending',\n        licenseDocument: { $exists: true }\n      })\n        .select('firstName lastName email licenseNumber licenseDocument createdAt')\n        .sort({ createdAt: -1 })\n        .limit(limit * 1)\n        .skip((page - 1) * limit);\n\n      const total = await User.countDocuments({\n        licenseStatus: 'pending',\n        licenseDocument: { $exists: true }\n      });\n\n      res.json({\n        success: true,\n        data: {\n          licenses: users,\n          pagination: {\n            page,\n            limit,\n            total,\n            pages: Math.ceil(total / limit)\n          }\n        }\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error fetching pending licenses',\n        error: error.message\n      });\n    }\n  }\n\n  async approveLicense(req: AuthRequest, res: Response) {\n    try {\n      const { userId } = req.params;\n      const { notes } = req.body;\n\n      const user = await User.findById(userId);\n      if (!user) {\n        return res.status(404).json({\n          success: false,\n          message: 'User not found'\n        });\n      }\n\n      user.licenseStatus = 'approved';\n      user.licenseVerifiedAt = new Date();\n      user.licenseVerifiedBy = req.user._id;\n      user.status = 'active'; // Activate account if license was the only barrier\n\n      await user.save();\n\n      // Send approval email\n      await emailService.sendLicenseApprovalNotification(user.email, {\n        firstName: user.firstName,\n        licenseNumber: user.licenseNumber,\n        notes: notes\n      });\n\n      res.json({\n        success: true,\n        message: 'License approved successfully'\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error approving license',\n        error: error.message\n      });\n    }\n  }\n\n  async rejectLicense(req: AuthRequest, res: Response) {\n    try {\n      const { userId } = req.params;\n      const { reason } = req.body;\n\n      if (!reason) {\n        return res.status(400).json({\n          success: false,\n          message: 'Rejection reason is required'\n        });\n      }\n\n      const user = await User.findById(userId);\n      if (!user) {\n        return res.status(404).json({\n          success: false,\n          message: 'User not found'\n        });\n      }\n\n      user.licenseStatus = 'rejected';\n      user.licenseRejectionReason = reason;\n      user.licenseVerifiedAt = new Date();\n      user.licenseVerifiedBy = req.user._id;\n      user.status = 'license_rejected';\n\n      await user.save();\n\n      // Send rejection email\n      await emailService.sendLicenseRejectionNotification(user.email, {\n        firstName: user.firstName,\n        reason: reason,\n        supportEmail: process.env.SUPPORT_EMAIL\n      });\n\n      res.json({\n        success: true,\n        message: 'License rejected'\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error rejecting license',\n        error: error.message\n      });\n    }\n  }\n\n  // Feature Flag Management\n  async createFeatureFlag(req: AuthRequest, res: Response) {\n    try {\n      const {\n        name,\n        key,\n        description,\n        allowedTiers,\n        allowedRoles,\n        customRules,\n        metadata\n      } = req.body;\n\n      const existingFlag = await FeatureFlag.findOne({ key });\n      if (existingFlag) {\n        return res.status(400).json({\n          success: false,\n          message: 'Feature flag with this key already exists'\n        });\n      }\n\n      const featureFlag = new FeatureFlag({\n        name,\n        key,\n        description,\n        allowedTiers,\n        allowedRoles,\n        customRules,\n        metadata,\n        createdBy: req.user._id,\n        updatedBy: req.user._id\n      });\n\n      await featureFlag.save();\n\n      res.status(201).json({\n        success: true,\n        message: 'Feature flag created successfully',\n        data: featureFlag\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error creating feature flag',\n        error: error.message\n      });\n    }\n  }\n\n  async updateFeatureFlag(req: AuthRequest, res: Response) {\n    try {\n      const { flagId } = req.params;\n      const updates = { ...req.body, updatedBy: req.user._id };\n\n      const featureFlag = await FeatureFlag.findByIdAndUpdate(\n        flagId,\n        updates,\n        { new: true, runValidators: true }\n      );\n\n      if (!featureFlag) {\n        return res.status(404).json({\n          success: false,\n          message: 'Feature flag not found'\n        });\n      }\n\n      res.json({\n        success: true,\n        message: 'Feature flag updated successfully',\n        data: featureFlag\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error updating feature flag',\n        error: error.message\n      });\n    }\n  }\n\n  async getAllFeatureFlags(req: AuthRequest, res: Response) {\n    try {\n      const {\n        category,\n        isActive,\n        tier,\n        role\n      } = req.query;\n\n      const query: any = {};\n      if (category) query['metadata.category'] = category;\n      if (isActive !== undefined) query.isActive = isActive === 'true';\n      if (tier) query.allowedTiers = tier;\n      if (role) query.allowedRoles = role;\n\n      const featureFlags = await FeatureFlag.find(query)\n        .populate('createdBy', 'firstName lastName')\n        .populate('updatedBy', 'firstName lastName')\n        .sort({ 'metadata.priority': -1, createdAt: -1 });\n\n      res.json({\n        success: true,\n        data: featureFlags\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error fetching feature flags',\n        error: error.message\n      });\n    }\n  }\n\n  // System Analytics\n  async getSystemAnalytics(req: AuthRequest, res: Response) {\n    try {\n      const [userStats, subscriptionStats, licenseStats] = await Promise.all([\n        // User statistics\n        User.aggregate([\n          {\n            $group: {\n              _id: '$role',\n              count: { $sum: 1 },\n              active: {\n                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }\n              }\n            }\n          }\n        ]),\n        \n        // Subscription statistics\n        Subscription.aggregate([\n          {\n            $group: {\n              _id: '$tier',\n              count: { $sum: 1 },\n              active: {\n                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }\n              },\n              revenue: { $sum: '$priceAtPurchase' }\n            }\n          }\n        ]),\n        \n        // License statistics\n        User.aggregate([\n          {\n            $match: {\n              licenseStatus: { $ne: 'not_required' }\n            }\n          },\n          {\n            $group: {\n              _id: '$licenseStatus',\n              count: { $sum: 1 }\n            }\n          }\n        ])\n      ]);\n\n      res.json({\n        success: true,\n        data: {\n          users: userStats,\n          subscriptions: subscriptionStats,\n          licenses: licenseStats,\n          generated: new Date()\n        }\n      });\n    } catch (error) {\n      res.status(500).json({\n        success: false,\n        message: 'Error generating analytics',\n        error: error.message\n      });\n    }\n  }\n}\n\nexport const adminController = new AdminController();