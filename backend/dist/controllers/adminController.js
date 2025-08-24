"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const emailService_1 = require("../utils/emailService");
class AdminController {
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const role = req.query.role;
            const status = req.query.status;
            const licenseStatus = req.query.licenseStatus;
            const query = {};
            if (role)
                query.role = role;
            if (status)
                query.status = status;
            if (licenseStatus)
                query.licenseStatus = licenseStatus;
            const users = await User_1.default.find(query)
                .populate('currentPlanId', 'name priceNGN')
                .populate('currentSubscriptionId', 'status tier endDate')
                .populate('parentUserId', 'firstName lastName role')
                .select('-passwordHash')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);
            const total = await User_1.default.countDocuments(query);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message,
            });
        }
    }
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await User_1.default.findById(userId)
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user',
                error: error.message,
            });
        }
    }
    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role, permissions } = req.body;
            const user = await User_1.default.findById(userId);
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
            await emailService_1.emailService.sendRoleUpdateNotification(user.email, {
                firstName: user.firstName,
                newRole: role,
                updatedBy: req.user.firstName + ' ' + req.user.lastName,
            });
            res.json({
                success: true,
                message: 'User role updated successfully',
                data: user,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating user role',
                error: error.message,
            });
        }
    }
    async suspendUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            user.status = 'suspended';
            await user.save();
            await Subscription_1.default.updateMany({ userId: userId, status: 'active' }, { status: 'suspended' });
            await emailService_1.emailService.sendAccountSuspensionNotification(user.email, {
                firstName: user.firstName,
                reason: reason || 'Administrative action',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@pharmacare.com',
            });
            res.json({
                success: true,
                message: 'User suspended successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error suspending user',
                error: error.message,
            });
        }
    }
    async reactivateUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            user.status = 'active';
            await user.save();
            const validSubscriptions = await Subscription_1.default.find({
                userId: userId,
                status: 'suspended',
                endDate: { $gt: new Date() },
            });
            for (const subscription of validSubscriptions) {
                subscription.status = 'active';
                await subscription.save();
            }
            await emailService_1.emailService.sendAccountReactivationNotification(user.email, {
                firstName: user.firstName,
            });
            res.json({
                success: true,
                message: 'User reactivated successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error reactivating user',
                error: error.message,
            });
        }
    }
    async getPendingLicenses(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const users = await User_1.default.find({
                licenseStatus: 'pending',
                licenseDocument: { $exists: true },
            })
                .select('firstName lastName email licenseNumber licenseDocument createdAt')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);
            const total = await User_1.default.countDocuments({
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching pending licenses',
                error: error.message,
            });
        }
    }
    async approveLicense(req, res) {
        try {
            const { userId } = req.params;
            const { notes } = req.body;
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            user.licenseStatus = 'approved';
            user.licenseVerifiedAt = new Date();
            user.licenseVerifiedBy = req.user._id;
            user.status = 'active';
            await user.save();
            await emailService_1.emailService.sendLicenseApprovalNotification(user.email, {
                firstName: user.firstName,
                licenseNumber: user.licenseNumber || '',
                notes: notes || '',
            });
            res.json({
                success: true,
                message: 'License approved successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error approving license',
                error: error.message,
            });
        }
    }
    async rejectLicense(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
            }
            const user = await User_1.default.findById(userId);
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
            await emailService_1.emailService.sendLicenseRejectionNotification(user.email, {
                firstName: user.firstName,
                reason: reason,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@pharmacare.com',
            });
            res.json({
                success: true,
                message: 'License rejected',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error rejecting license',
                error: error.message,
            });
        }
    }
    async createFeatureFlag(req, res) {
        try {
            const { name, key, description, allowedTiers, allowedRoles, customRules, metadata, } = req.body;
            const existingFlag = await FeatureFlag_1.default.findOne({ key });
            if (existingFlag) {
                return res.status(400).json({
                    success: false,
                    message: 'Feature flag with this key already exists',
                });
            }
            const featureFlag = new FeatureFlag_1.default({
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating feature flag',
                error: error.message,
            });
        }
    }
    async updateFeatureFlag(req, res) {
        try {
            const { flagId } = req.params;
            const updates = { ...req.body, updatedBy: req.user._id };
            const featureFlag = await FeatureFlag_1.default.findByIdAndUpdate(flagId, updates, {
                new: true,
                runValidators: true,
            });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating feature flag',
                error: error.message,
            });
        }
    }
    async getAllFeatureFlags(req, res) {
        try {
            const { category, isActive, tier, role } = req.query;
            const query = {};
            if (category)
                query['metadata.category'] = category;
            if (isActive !== undefined)
                query.isActive = isActive === 'true';
            if (tier)
                query.allowedTiers = tier;
            if (role)
                query.allowedRoles = role;
            const featureFlags = await FeatureFlag_1.default.find(query)
                .populate('createdBy', 'firstName lastName')
                .populate('updatedBy', 'firstName lastName')
                .sort({ 'metadata.priority': -1, createdAt: -1 });
            res.json({
                success: true,
                data: featureFlags,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching feature flags',
                error: error.message,
            });
        }
    }
    async getSystemAnalytics(req, res) {
        try {
            const [userStats, subscriptionStats, licenseStats] = await Promise.all([
                User_1.default.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                            active: {
                                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                            },
                        },
                    },
                ]),
                Subscription_1.default.aggregate([
                    {
                        $group: {
                            _id: '$tier',
                            count: { $sum: 1 },
                            active: {
                                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                            },
                            revenue: { $sum: '$priceAtPurchase' },
                        },
                    },
                ]),
                User_1.default.aggregate([
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
            ]);
            res.json({
                success: true,
                data: {
                    users: userStats,
                    subscriptions: subscriptionStats,
                    licenses: licenseStats,
                    generated: new Date(),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error generating analytics',
                error: error.message,
            });
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=adminController.js.map