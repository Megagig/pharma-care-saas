"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationSchedulerService = exports.NotificationSchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notificationService_1 = require("./notificationService");
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationSchedulerService {
    constructor() {
        this.scheduledJobs = new Map();
        this.isRunning = false;
        this.setupDefaultJobs();
    }
    start() {
        if (this.isRunning) {
            logger_1.default.warn('Notification scheduler is already running');
            return;
        }
        this.scheduledJobs.forEach(job => {
            job.task.start();
        });
        this.isRunning = true;
        logger_1.default.info('Notification scheduler started');
    }
    stop() {
        if (!this.isRunning) {
            logger_1.default.warn('Notification scheduler is not running');
            return;
        }
        this.scheduledJobs.forEach(job => {
            job.task.stop();
        });
        this.isRunning = false;
        logger_1.default.info('Notification scheduler stopped');
    }
    setupDefaultJobs() {
        this.addJob('process-scheduled', '* * * * *', async () => {
            await this.processScheduledNotifications();
        }, 'Process scheduled notifications');
        this.addJob('retry-failed', '*/5 * * * *', async () => {
            await this.retryFailedNotifications();
        }, 'Retry failed notifications');
        this.addJob('daily-digest', '0 8 * * *', async () => {
            await this.sendDailyDigests();
        }, 'Send daily notification digests');
        this.addJob('weekly-digest', '0 9 * * 1', async () => {
            await this.sendWeeklyDigests();
        }, 'Send weekly notification digests');
        this.addJob('cleanup-expired', '0 2 * * *', async () => {
            await this.cleanupExpiredNotifications();
        }, 'Clean up expired notifications');
        this.addJob('archive-old', '0 3 * * 0', async () => {
            await this.archiveOldNotifications();
        }, 'Archive old notifications');
        this.addJob('update-stats', '0 * * * *', async () => {
            await this.updateNotificationStatistics();
        }, 'Update notification statistics');
    }
    addJob(id, cronExpression, taskFunction, description) {
        if (this.scheduledJobs.has(id)) {
            logger_1.default.warn(`Job with id '${id}' already exists`);
            return;
        }
        const task = node_cron_1.default.schedule(cronExpression, async () => {
            try {
                logger_1.default.debug(`Running scheduled job: ${id}`);
                await taskFunction();
                logger_1.default.debug(`Completed scheduled job: ${id}`);
            }
            catch (error) {
                logger_1.default.error(`Error in scheduled job '${id}':`, error);
            }
        }, {
            scheduled: false,
            timezone: process.env.TIMEZONE || 'UTC',
        });
        this.scheduledJobs.set(id, {
            id,
            cronExpression,
            task,
            description,
        });
        logger_1.default.info(`Added scheduled job: ${id} (${cronExpression}) - ${description}`);
    }
    removeJob(id) {
        const job = this.scheduledJobs.get(id);
        if (!job) {
            logger_1.default.warn(`Job with id '${id}' not found`);
            return;
        }
        job.task.stop();
        this.scheduledJobs.delete(id);
        logger_1.default.info(`Removed scheduled job: ${id}`);
    }
    async processScheduledNotifications() {
        try {
            const scheduledNotifications = await Notification_1.default.findScheduledForDelivery();
            if (scheduledNotifications.length === 0) {
                return;
            }
            logger_1.default.debug(`Processing ${scheduledNotifications.length} scheduled notifications`);
            for (const notification of scheduledNotifications) {
                try {
                    await notificationService_1.notificationService.deliverNotification(notification);
                }
                catch (error) {
                    logger_1.default.error(`Failed to deliver scheduled notification ${notification._id}:`, error);
                }
            }
            logger_1.default.info(`Processed ${scheduledNotifications.length} scheduled notifications`);
        }
        catch (error) {
            logger_1.default.error('Error processing scheduled notifications:', error);
        }
    }
    async retryFailedNotifications() {
        try {
            await notificationService_1.notificationService.retryFailedNotifications();
        }
        catch (error) {
            logger_1.default.error('Error retrying failed notifications:', error);
        }
    }
    async sendDailyDigests() {
        try {
            const users = await User_1.default.find({
                'notificationPreferences.batchDigest': true,
                'notificationPreferences.digestFrequency': 'daily',
            }).select('_id email firstName lastName workplaceId notificationPreferences');
            logger_1.default.debug(`Sending daily digests to ${users.length} users`);
            for (const user of users) {
                try {
                    await this.sendDigestToUser(user, 'daily');
                }
                catch (error) {
                    logger_1.default.error(`Failed to send daily digest to user ${user._id}:`, error);
                }
            }
            logger_1.default.info(`Sent daily digests to ${users.length} users`);
        }
        catch (error) {
            logger_1.default.error('Error sending daily digests:', error);
        }
    }
    async sendWeeklyDigests() {
        try {
            const users = await User_1.default.find({
                'notificationPreferences.batchDigest': true,
                'notificationPreferences.digestFrequency': 'weekly',
            }).select('_id email firstName lastName workplaceId notificationPreferences');
            logger_1.default.debug(`Sending weekly digests to ${users.length} users`);
            for (const user of users) {
                try {
                    await this.sendDigestToUser(user, 'weekly');
                }
                catch (error) {
                    logger_1.default.error(`Failed to send weekly digest to user ${user._id}:`, error);
                }
            }
            logger_1.default.info(`Sent weekly digests to ${users.length} users`);
        }
        catch (error) {
            logger_1.default.error('Error sending weekly digests:', error);
        }
    }
    async sendDigestToUser(user, frequency) {
        const now = new Date();
        const startDate = new Date();
        if (frequency === 'daily') {
            startDate.setDate(now.getDate() - 1);
        }
        else {
            startDate.setDate(now.getDate() - 7);
        }
        const notifications = await Notification_1.default.find({
            userId: user._id,
            workplaceId: user.workplaceId,
            status: 'unread',
            createdAt: { $gte: startDate, $lte: now },
        })
            .populate('data.senderId', 'firstName lastName')
            .populate('data.patientId', 'firstName lastName mrn')
            .sort({ priority: -1, createdAt: -1 })
            .limit(20);
        if (notifications.length === 0) {
            return;
        }
        const groupedNotifications = notifications.reduce((groups, notification) => {
            const type = notification.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(notification);
            return groups;
        }, {});
        const digestContent = this.createDigestContent(groupedNotifications, frequency);
        await notificationService_1.notificationService.createNotification({
            userId: user._id,
            type: 'system_notification',
            title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Notification Digest`,
            content: `You have ${notifications.length} unread notifications from the past ${frequency === 'daily' ? 'day' : 'week'}.`,
            data: {
                metadata: {
                    isDigest: true,
                    frequency,
                    notificationCount: notifications.length,
                    digestContent,
                },
            },
            priority: 'normal',
            deliveryChannels: {
                inApp: true,
                email: user.notificationPreferences?.email !== false,
                sms: false,
                push: false,
            },
            workplaceId: user.workplaceId,
            createdBy: user._id,
        });
    }
    createDigestContent(groupedNotifications, frequency) {
        let content = `<h3>${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Notification Summary</h3>`;
        const typeLabels = {
            new_message: '💬 New Messages',
            mention: '🏷️ Mentions',
            patient_query: '🏥 Patient Queries',
            clinical_alert: '⚕️ Clinical Alerts',
            therapy_update: '💊 Therapy Updates',
            urgent_message: '🚨 Urgent Messages',
            conversation_invite: '👥 Conversation Invites',
            file_shared: '📎 Files Shared',
        };
        Object.entries(groupedNotifications).forEach(([type, notifications]) => {
            const label = typeLabels[type] || type.replace('_', ' ').toUpperCase();
            content += `<h4>${label} (${notifications.length})</h4><ul>`;
            notifications.slice(0, 5).forEach(notification => {
                content += `<li>${notification.title} - ${notification.createdAt.toLocaleDateString()}</li>`;
            });
            if (notifications.length > 5) {
                content += `<li>... and ${notifications.length - 5} more</li>`;
            }
            content += '</ul>';
        });
        return content;
    }
    async cleanupExpiredNotifications() {
        try {
            const result = await Notification_1.default.markExpiredAsArchived();
            if (result.modifiedCount > 0) {
                logger_1.default.info(`Marked ${result.modifiedCount} expired notifications as archived`);
            }
        }
        catch (error) {
            logger_1.default.error('Error cleaning up expired notifications:', error);
        }
    }
    async archiveOldNotifications() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            const result = await Notification_1.default.updateMany({
                createdAt: { $lt: cutoffDate },
                status: { $in: ['read', 'dismissed'] },
            }, {
                $set: {
                    status: 'archived',
                    updatedAt: new Date(),
                },
            });
            if (result.modifiedCount > 0) {
                logger_1.default.info(`Archived ${result.modifiedCount} old notifications`);
            }
        }
        catch (error) {
            logger_1.default.error('Error archiving old notifications:', error);
        }
    }
    async updateNotificationStatistics() {
        try {
            const stats = await Notification_1.default.aggregate([
                {
                    $group: {
                        _id: {
                            status: '$status',
                            type: '$type',
                        },
                        count: { $sum: 1 },
                    },
                },
            ]);
            logger_1.default.debug('Current notification statistics:', stats);
        }
        catch (error) {
            logger_1.default.error('Error updating notification statistics:', error);
        }
    }
    async scheduleOneTimeNotification(notificationData, scheduledFor) {
        const delay = scheduledFor.getTime() - Date.now();
        if (delay <= 0) {
            await notificationService_1.notificationService.createNotification(notificationData);
            return;
        }
        setTimeout(async () => {
            try {
                await notificationService_1.notificationService.createNotification(notificationData);
                logger_1.default.debug(`Delivered scheduled notification for user ${notificationData.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error delivering scheduled notification:', error);
            }
        }, delay);
        logger_1.default.debug(`Scheduled one-time notification for ${scheduledFor.toISOString()}`);
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobCount: this.scheduledJobs.size,
            jobs: Array.from(this.scheduledJobs.values()).map(job => ({
                id: job.id,
                description: job.description,
                cronExpression: job.cronExpression,
            })),
        };
    }
}
exports.NotificationSchedulerService = NotificationSchedulerService;
exports.notificationSchedulerService = new NotificationSchedulerService();
exports.default = exports.notificationSchedulerService;
//# sourceMappingURL=notificationSchedulerService.js.map