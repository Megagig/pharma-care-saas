"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardController = exports.AdminDashboardController = void 0;
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const EmailDelivery_1 = require("../models/EmailDelivery");
const mongoose_1 = __importDefault(require("mongoose"));
class AdminDashboardController {
    async getDashboardOverview(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const [totalWorkspaces, activeWorkspaces, trialWorkspaces, expiredWorkspaces, totalSubscriptions, activeSubscriptions, totalUsers, activeUsers, totalPatients, totalInvitations, pendingInvitations, recentWorkspaces, recentUsers, subscriptionsByTier, invitationStats, emailStats,] = await Promise.all([
                Workplace_1.default.countDocuments(),
                Workplace_1.default.countDocuments({ subscriptionStatus: 'active' }),
                Workplace_1.default.countDocuments({ subscriptionStatus: 'trial' }),
                Workplace_1.default.countDocuments({ subscriptionStatus: 'expired' }),
                Subscription_1.default.countDocuments(),
                Subscription_1.default.countDocuments({ status: 'active' }),
                User_1.default.countDocuments(),
                User_1.default.countDocuments({ status: 'active' }),
                Patient_1.default.countDocuments(),
                Invitation_1.default.countDocuments(),
                Invitation_1.default.countDocuments({
                    status: 'active',
                    expiresAt: { $gt: now },
                }),
                Workplace_1.default.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
                User_1.default.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
                Subscription_1.default.aggregate([
                    {
                        $group: {
                            _id: '$tier',
                            count: { $sum: 1 },
                            revenue: { $sum: '$priceAtPurchase' },
                        },
                    },
                ]),
                Invitation_1.default.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ]),
                EmailDelivery_1.EmailDelivery.aggregate([
                    {
                        $match: { createdAt: { $gte: sevenDaysAgo } },
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);
            const workspaceGrowthRate = await this.calculateGrowthRate(Workplace_1.default, thirtyDaysAgo, now);
            const userGrowthRate = await this.calculateGrowthRate(User_1.default, thirtyDaysAgo, now);
            const trialExpiryAlerts = await Workplace_1.default.find({
                subscriptionStatus: 'trial',
                trialEndDate: {
                    $gte: now,
                    $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
            })
                .select('name trialEndDate ownerId')
                .populate('ownerId', 'firstName lastName email')
                .limit(10);
            const failedPayments = await Subscription_1.default.find({
                status: 'past_due',
                updatedAt: { $gte: sevenDaysAgo },
            })
                .populate('workspaceId', 'name')
                .limit(10);
            const overview = {
                summary: {
                    workspaces: {
                        total: totalWorkspaces,
                        active: activeWorkspaces,
                        trial: trialWorkspaces,
                        expired: expiredWorkspaces,
                        growth: workspaceGrowthRate,
                    },
                    subscriptions: {
                        total: totalSubscriptions,
                        active: activeSubscriptions,
                        byTier: subscriptionsByTier,
                    },
                    users: {
                        total: totalUsers,
                        active: activeUsers,
                        growth: userGrowthRate,
                    },
                    patients: {
                        total: totalPatients,
                    },
                    invitations: {
                        total: totalInvitations,
                        pending: pendingInvitations,
                        stats: invitationStats,
                    },
                    emails: {
                        stats: emailStats,
                    },
                },
                recentActivity: {
                    newWorkspaces: recentWorkspaces,
                    newUsers: recentUsers,
                },
                alerts: {
                    trialExpiring: trialExpiryAlerts,
                    failedPayments: failedPayments,
                },
                timestamp: now.toISOString(),
            };
            res.json({
                success: true,
                data: overview,
            });
        }
        catch (error) {
            console.error('Error getting admin dashboard overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard overview',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getWorkspaceManagement(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const { page = 1, limit = 20, search, status, tier, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.subscriptionStatus = status;
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const [workspaces, totalCount] = await Promise.all([
                Workplace_1.default.find(query)
                    .populate('ownerId', 'firstName lastName email')
                    .populate('currentSubscriptionId')
                    .sort(sort)
                    .skip(skip)
                    .limit(Number(limit)),
                Workplace_1.default.countDocuments(query),
            ]);
            const workspacesWithDetails = await Promise.all(workspaces.map(async (workspace) => {
                const subscription = workspace.currentSubscriptionId;
                let plan = null;
                if (subscription?.planId) {
                    plan = await SubscriptionPlan_1.default.findById(subscription.planId);
                }
                return {
                    ...workspace.toObject(),
                    subscription,
                    plan,
                    stats: workspace.stats || { patientsCount: 0, usersCount: 0 },
                };
            }));
            res.json({
                success: true,
                data: {
                    workspaces: workspacesWithDetails,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalCount / Number(limit)),
                        totalItems: totalCount,
                        itemsPerPage: Number(limit),
                    },
                },
            });
        }
        catch (error) {
            console.error('Error getting workspace management data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get workspace management data',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async updateWorkspaceSubscription(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const { workspaceId } = req.params;
            const { planId, status, endDate, notes } = req.body;
            if (!workspaceId || !mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid workspace ID',
                });
            }
            const workspace = await Workplace_1.default.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({
                    success: false,
                    message: 'Workspace not found',
                });
            }
            const subscription = await Subscription_1.default.findOne({ workspaceId });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription not found',
                });
            }
            if (planId) {
                const plan = await SubscriptionPlan_1.default.findById(planId);
                if (!plan) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid plan ID',
                    });
                }
                subscription.planId = planId;
                subscription.tier = plan.tier;
                subscription.features = Object.keys(plan.features).filter(key => plan.features[key] === true ||
                    typeof plan.features[key] === 'number');
                subscription.limits = {
                    patients: plan.features.patientLimit || 0,
                    users: plan.features.teamSize || 1,
                    locations: 1,
                    storage: 1000,
                    apiCalls: 1000
                };
            }
            if (status) {
                subscription.status = status;
                workspace.subscriptionStatus = status;
            }
            if (endDate) {
                subscription.endDate = new Date(endDate);
            }
            await subscription.save();
            await workspace.save();
            console.log(`Admin ${req.user?.email} updated subscription for workspace ${workspace.name}`, {
                workspaceId,
                changes: { planId, status, endDate },
                notes,
                adminId: req.user?._id,
            });
            res.json({
                success: true,
                message: 'Workspace subscription updated successfully',
                data: {
                    workspace: workspace.toObject(),
                    subscription: subscription.toObject(),
                },
            });
        }
        catch (error) {
            console.error('Error updating workspace subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update workspace subscription',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getInvitationManagement(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const { page = 1, limit = 20, search, status, workspaceId, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (search) {
                query.email = { $regex: search, $options: 'i' };
            }
            if (status) {
                query.status = status;
            }
            if (workspaceId) {
                query.workspaceId = workspaceId;
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const [invitations, totalCount] = await Promise.all([
                Invitation_1.default.find(query)
                    .populate('workspaceId', 'name')
                    .populate('invitedBy', 'firstName lastName email')
                    .populate('usedBy', 'firstName lastName email')
                    .sort(sort)
                    .skip(skip)
                    .limit(Number(limit)),
                Invitation_1.default.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    invitations,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalCount / Number(limit)),
                        totalItems: totalCount,
                        itemsPerPage: Number(limit),
                    },
                },
            });
        }
        catch (error) {
            console.error('Error getting invitation management data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get invitation management data',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async cancelInvitation(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const { invitationId } = req.params;
            const { reason } = req.body;
            if (!invitationId || !mongoose_1.default.Types.ObjectId.isValid(invitationId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid invitation ID',
                });
            }
            const invitation = await Invitation_1.default.findById(invitationId);
            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    message: 'Invitation not found',
                });
            }
            if (invitation.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Invitation is not active',
                });
            }
            invitation.status = 'canceled';
            invitation.metadata = {
                ...invitation.metadata,
                canceledBy: 'admin',
                canceledReason: reason,
                canceledAt: new Date(),
            };
            await invitation.save();
            console.log(`Admin ${req.user?.email} canceled invitation ${invitationId}`, {
                invitationId,
                reason,
                adminId: req.user?._id,
            });
            res.json({
                success: true,
                message: 'Invitation canceled successfully',
                data: invitation,
            });
        }
        catch (error) {
            console.error('Error canceling invitation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel invitation',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getSystemHealth(req, res) {
        try {
            if (req.user?.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                });
            }
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const [dbStats, recentErrors, emailDeliveryStats, invitationStats, subscriptionStats,] = await Promise.all([
                mongoose_1.default.connection.db.stats(),
                [],
                EmailDelivery_1.EmailDelivery.aggregate([
                    {
                        $match: { createdAt: { $gte: oneDayAgo } },
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ]),
                Invitation_1.default.aggregate([
                    {
                        $match: { createdAt: { $gte: oneDayAgo } },
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ]),
                Subscription_1.default.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);
            const systemHealth = {
                timestamp: now.toISOString(),
                database: {
                    connected: mongoose_1.default.connection.readyState === 1,
                    stats: dbStats,
                },
                application: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV,
                },
                services: {
                    emailDelivery: emailDeliveryStats,
                    invitations: invitationStats,
                    subscriptions: subscriptionStats,
                },
                recentErrors,
            };
            res.json({
                success: true,
                data: systemHealth,
            });
        }
        catch (error) {
            console.error('Error getting system health:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get system health',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async calculateGrowthRate(Model, startDate, endDate) {
        try {
            const periodLength = endDate.getTime() - startDate.getTime();
            const previousPeriodStart = new Date(startDate.getTime() - periodLength);
            const [currentPeriod, previousPeriod] = await Promise.all([
                Model.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate },
                }),
                Model.countDocuments({
                    createdAt: { $gte: previousPeriodStart, $lt: startDate },
                }),
            ]);
            if (previousPeriod === 0)
                return currentPeriod > 0 ? 100 : 0;
            return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
        }
        catch (error) {
            console.error('Error calculating growth rate:', error);
            return 0;
        }
    }
}
exports.AdminDashboardController = AdminDashboardController;
exports.adminDashboardController = new AdminDashboardController();
//# sourceMappingURL=adminDashboardController.js.map