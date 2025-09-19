"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationCronService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cron = __importStar(require("node-cron"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const emailService_1 = require("../utils/emailService");
class InvitationCronService {
    constructor() {
        this.cronJobs = [];
    }
    start() {
        console.log('Starting invitation cron jobs...');
        const expiredInvitationsJob = cron.schedule('0 * * * *', async () => {
            console.log('Running expired invitations cleanup...');
            const result = await this.markExpiredInvitations();
            console.log(`Expired invitations cleanup completed:`, result);
        });
        const reminderJob = cron.schedule('0 9,18 * * *', async () => {
            console.log('Sending invitation expiry reminders...');
            const result = await this.sendExpiryReminders();
            console.log(`Expiry reminders completed:`, result);
        });
        const cleanupJob = cron.schedule('0 2 * * *', async () => {
            console.log('Running old invitations cleanup...');
            const result = await this.cleanupOldInvitations();
            console.log(`Old invitations cleanup completed:`, result);
        });
        this.cronJobs = [expiredInvitationsJob, reminderJob, cleanupJob];
        console.log('Invitation cron jobs started successfully');
    }
    stop() {
        console.log('Stopping invitation cron jobs...');
        this.cronJobs.forEach(job => job.stop());
        this.cronJobs = [];
        console.log('Invitation cron jobs stopped');
    }
    async markExpiredInvitations() {
        const errors = [];
        let notificationsSent = 0;
        try {
            console.log('Starting expired invitations cleanup...');
            const expiredInvitations = await Invitation_1.default.find({
                status: 'active',
                expiresAt: { $lt: new Date() }
            }).populate('invitedBy', 'firstName lastName email');
            if (expiredInvitations.length === 0) {
                console.log('No expired invitations found');
                return {
                    success: true,
                    expiredCount: 0,
                    notificationsSent: 0,
                    errors: []
                };
            }
            const result = await Invitation_1.default.updateMany({
                status: 'active',
                expiresAt: { $lt: new Date() }
            }, {
                $set: { status: 'expired' }
            });
            console.log(`Marked ${result.modifiedCount} invitations as expired`);
            for (const invitation of expiredInvitations) {
                try {
                    const inviterData = invitation.invitedBy;
                    if (inviterData?.email) {
                        await emailService_1.emailService.sendInvitationExpiredNotification(inviterData.email, {
                            inviterName: `${inviterData.firstName} ${inviterData.lastName}`,
                            invitedEmail: invitation.email,
                            workspaceName: invitation.metadata.workspaceName,
                            role: invitation.role,
                        });
                        notificationsSent++;
                    }
                }
                catch (error) {
                    errors.push(`Failed to send expiry notification for invitation ${invitation._id}: ${error.message}`);
                }
            }
            return {
                success: true,
                expiredCount: result.modifiedCount,
                notificationsSent,
                errors
            };
        }
        catch (error) {
            console.error('Error marking expired invitations:', error);
            return {
                success: false,
                expiredCount: 0,
                notificationsSent,
                errors: [`Failed to mark expired invitations: ${error.message}`]
            };
        }
    }
    async validateInvitationLimits(workspaceId) {
        try {
            const workspace = await Workplace_1.default.findById(workspaceId);
            if (!workspace) {
                throw new Error('Workspace not found');
            }
            const maxPendingInvites = workspace.settings?.maxPendingInvites || 20;
            const currentPendingInvites = await Invitation_1.default.countDocuments({
                workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
                status: 'active'
            });
            const remainingInvites = Math.max(0, maxPendingInvites - currentPendingInvites);
            const canSendMore = remainingInvites > 0;
            const upgradeRequired = !canSendMore && maxPendingInvites <= 20;
            return {
                maxPendingInvites,
                currentPendingInvites,
                remainingInvites,
                canSendMore,
                upgradeRequired,
                nextUpgradeLevel: upgradeRequired ? 'Professional Plan (50 invitations)' : undefined,
            };
        }
        catch (error) {
            console.error('Error validating invitation limits:', error);
            throw error;
        }
    }
    async getInvitationAnalytics(workspaceId) {
        try {
            const workspaceObjectId = new mongoose_1.default.Types.ObjectId(workspaceId);
            const [totalInvitations, statusCounts, roleStats, monthlyStats] = await Promise.all([
                Invitation_1.default.countDocuments({ workspaceId: workspaceObjectId }),
                Invitation_1.default.aggregate([
                    { $match: { workspaceId: workspaceObjectId } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Invitation_1.default.aggregate([
                    { $match: { workspaceId: workspaceObjectId } },
                    { $group: { _id: '$role', count: { $sum: 1 } } }
                ]),
                Invitation_1.default.aggregate([
                    { $match: { workspaceId: workspaceObjectId } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 },
                            accepted: {
                                $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
                            }
                        }
                    },
                    { $sort: { '_id.year': -1, '_id.month': -1 } },
                    { $limit: 12 }
                ])
            ]);
            const statusMap = statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});
            const activeInvitations = statusMap.active || 0;
            const expiredInvitations = statusMap.expired || 0;
            const usedInvitations = statusMap.used || 0;
            const canceledInvitations = statusMap.canceled || 0;
            const totalSentInvitations = totalInvitations - canceledInvitations;
            const acceptanceRate = totalSentInvitations > 0 ? (usedInvitations / totalSentInvitations) * 100 : 0;
            const acceptedInvitations = await Invitation_1.default.find({
                workspaceId: workspaceObjectId,
                status: 'used',
                usedAt: { $exists: true }
            }).select('createdAt usedAt');
            let averageAcceptanceTime = 0;
            if (acceptedInvitations.length > 0) {
                const totalTime = acceptedInvitations.reduce((sum, inv) => {
                    const timeDiff = inv.usedAt.getTime() - inv.createdAt.getTime();
                    return sum + timeDiff;
                }, 0);
                averageAcceptanceTime = totalTime / acceptedInvitations.length / (1000 * 60 * 60);
            }
            const invitationsByRole = roleStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});
            const invitationsByMonth = monthlyStats.map(item => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                count: item.count,
                accepted: item.accepted
            }));
            return {
                totalInvitations,
                activeInvitations,
                expiredInvitations,
                usedInvitations,
                canceledInvitations,
                acceptanceRate: Math.round(acceptanceRate * 100) / 100,
                averageAcceptanceTime: Math.round(averageAcceptanceTime * 100) / 100,
                invitationsByRole,
                invitationsByMonth
            };
        }
        catch (error) {
            console.error('Error getting invitation analytics:', error);
            throw error;
        }
    }
    async getInvitationStats(workspaceId) {
        try {
            if (workspaceId) {
                const workspace = await Workplace_1.default.findById(workspaceId);
                if (!workspace) {
                    throw new Error('Workspace not found');
                }
                const workspaceObjectId = new mongoose_1.default.Types.ObjectId(workspaceId);
                const [totalInvitations, statusCounts] = await Promise.all([
                    Invitation_1.default.countDocuments({ workspaceId: workspaceObjectId }),
                    Invitation_1.default.aggregate([
                        { $match: { workspaceId: workspaceObjectId } },
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ])
                ]);
                const statusMap = statusCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {});
                return {
                    workspace: {
                        id: workspaceId,
                        name: workspace.name,
                        totalInvitations,
                        pendingInvitations: statusMap.active || 0,
                        acceptedInvitations: statusMap.used || 0,
                        expiredInvitations: statusMap.expired || 0,
                    }
                };
            }
            else {
                const [totalWorkspaces, totalInvitations, workspaceStats] = await Promise.all([
                    Workplace_1.default.countDocuments(),
                    Invitation_1.default.countDocuments(),
                    Invitation_1.default.aggregate([
                        {
                            $group: {
                                _id: '$workspaceId',
                                invitationCount: { $sum: 1 },
                                acceptedCount: {
                                    $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
                                }
                            }
                        }
                    ])
                ]);
                const averageInvitationsPerWorkspace = totalWorkspaces > 0 ? totalInvitations / totalWorkspaces : 0;
                const totalAccepted = workspaceStats.reduce((sum, ws) => sum + ws.acceptedCount, 0);
                const globalAcceptanceRate = totalInvitations > 0 ? (totalAccepted / totalInvitations) * 100 : 0;
                return {
                    global: {
                        totalWorkspaces,
                        totalInvitations,
                        averageInvitationsPerWorkspace: Math.round(averageInvitationsPerWorkspace * 100) / 100,
                        globalAcceptanceRate: Math.round(globalAcceptanceRate * 100) / 100,
                    }
                };
            }
        }
        catch (error) {
            console.error('Error getting invitation stats:', error);
            throw error;
        }
    }
    async cleanupOldInvitations() {
        try {
            console.log('Starting cleanup of old expired invitations...');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await Invitation_1.default.deleteMany({
                status: { $in: ['expired', 'canceled'] },
                updatedAt: { $lt: thirtyDaysAgo }
            });
            console.log(`Cleaned up ${result.deletedCount} old invitations`);
            return {
                success: true,
                deletedCount: result.deletedCount
            };
        }
        catch (error) {
            console.error('Error cleaning up old invitations:', error);
            return {
                success: false,
                deletedCount: 0,
                error: error.message
            };
        }
    }
    async sendExpiryReminders() {
        const errors = [];
        let remindersSent = 0;
        try {
            console.log('Sending expiry reminders...');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const expiringInvitations = await Invitation_1.default.find({
                status: 'active',
                expiresAt: { $lte: tomorrow, $gt: new Date() }
            });
            for (const invitation of expiringInvitations) {
                try {
                    await emailService_1.emailService.sendInvitationReminderEmail(invitation);
                    remindersSent++;
                }
                catch (error) {
                    errors.push(`Failed to send reminder for invitation ${invitation._id}: ${error.message}`);
                }
            }
            console.log(`Sent ${remindersSent} expiry reminders`);
            return {
                success: true,
                remindersSent,
                errors
            };
        }
        catch (error) {
            console.error('Error sending expiry reminders:', error);
            return {
                success: false,
                remindersSent,
                errors: [`Failed to send expiry reminders: ${error.message}`]
            };
        }
    }
}
exports.invitationCronService = new InvitationCronService();
exports.default = exports.invitationCronService;
//# sourceMappingURL=InvitationCronService.js.map