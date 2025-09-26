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
exports.mtrNotificationScheduler = void 0;
const cron = __importStar(require("node-cron"));
const mtrNotificationService_1 = require("./mtrNotificationService");
const logger_1 = __importDefault(require("../utils/logger"));
class MTRNotificationScheduler {
    constructor() {
        this.jobs = new Map();
    }
    start() {
        this.scheduleOverdueFollowUpCheck();
        this.schedulePendingReminderProcessing();
        this.scheduleNotificationCleanup();
        logger_1.default.info('MTR notification scheduler started');
    }
    stop() {
        this.jobs.forEach((job, name) => {
            job.stop();
            logger_1.default.info(`Stopped notification job: ${name}`);
        });
        this.jobs.clear();
        logger_1.default.info('MTR notification scheduler stopped');
    }
    scheduleOverdueFollowUpCheck() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logger_1.default.info('Running overdue follow-up check...');
                await mtrNotificationService_1.mtrNotificationService.checkOverdueFollowUps();
                logger_1.default.info('Overdue follow-up check completed');
            }
            catch (error) {
                logger_1.default.error('Error in overdue follow-up check:', error);
            }
        }, {
            timezone: process.env.TIMEZONE || 'UTC'
        });
        job.start();
        this.jobs.set('overdueFollowUpCheck', job);
        logger_1.default.info('Scheduled overdue follow-up check (every hour)');
    }
    schedulePendingReminderProcessing() {
        const job = cron.schedule('*/15 * * * *', async () => {
            try {
                logger_1.default.info('Processing pending reminders...');
                await mtrNotificationService_1.mtrNotificationService.processPendingReminders();
                logger_1.default.info('Pending reminders processed');
            }
            catch (error) {
                logger_1.default.error('Error processing pending reminders:', error);
            }
        }, {
            timezone: process.env.TIMEZONE || 'UTC'
        });
        job.start();
        this.jobs.set('pendingReminderProcessing', job);
        logger_1.default.info('Scheduled pending reminder processing (every 15 minutes)');
    }
    scheduleNotificationCleanup() {
        const job = cron.schedule('0 2 * * *', async () => {
            try {
                logger_1.default.info('Running notification cleanup...');
                await this.cleanupOldNotifications();
                logger_1.default.info('Notification cleanup completed');
            }
            catch (error) {
                logger_1.default.error('Error in notification cleanup:', error);
            }
        }, {
            timezone: process.env.TIMEZONE || 'UTC'
        });
        job.start();
        this.jobs.set('notificationCleanup', job);
        logger_1.default.info('Scheduled notification cleanup (daily at 2 AM)');
    }
    scheduleDailyDigest() {
        const job = cron.schedule('0 8 * * *', async () => {
            try {
                logger_1.default.info('Sending daily digest notifications...');
                await this.sendDailyDigest();
                logger_1.default.info('Daily digest notifications sent');
            }
            catch (error) {
                logger_1.default.error('Error sending daily digest:', error);
            }
        }, {
            timezone: process.env.TIMEZONE || 'UTC'
        });
        job.start();
        this.jobs.set('dailyDigest', job);
        logger_1.default.info('Scheduled daily digest notifications (daily at 8 AM)');
    }
    scheduleWeeklyReport() {
        const job = cron.schedule('0 9 * * 1', async () => {
            try {
                logger_1.default.info('Sending weekly report notifications...');
                await this.sendWeeklyReport();
                logger_1.default.info('Weekly report notifications sent');
            }
            catch (error) {
                logger_1.default.error('Error sending weekly report:', error);
            }
        }, {
            timezone: process.env.TIMEZONE || 'UTC'
        });
        job.start();
        this.jobs.set('weeklyReport', job);
        logger_1.default.info('Scheduled weekly report notifications (Mondays at 9 AM)');
    }
    async cleanupOldNotifications() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            logger_1.default.info(`Cleaning up notifications older than ${thirtyDaysAgo.toISOString()}`);
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old notifications:', error);
            throw error;
        }
    }
    async sendDailyDigest() {
        try {
            logger_1.default.info('Daily digest functionality would be implemented here');
        }
        catch (error) {
            logger_1.default.error('Error sending daily digest:', error);
            throw error;
        }
    }
    async sendWeeklyReport() {
        try {
            logger_1.default.info('Weekly report functionality would be implemented here');
        }
        catch (error) {
            logger_1.default.error('Error sending weekly report:', error);
            throw error;
        }
    }
    getJobStatus() {
        const status = {};
        this.jobs.forEach((job, name) => {
            status[name] = job.running || false;
        });
        return status;
    }
    async triggerJob(jobName) {
        switch (jobName) {
            case 'overdueFollowUpCheck':
                await mtrNotificationService_1.mtrNotificationService.checkOverdueFollowUps();
                break;
            case 'pendingReminderProcessing':
                await mtrNotificationService_1.mtrNotificationService.processPendingReminders();
                break;
            case 'notificationCleanup':
                await this.cleanupOldNotifications();
                break;
            case 'dailyDigest':
                await this.sendDailyDigest();
                break;
            case 'weeklyReport':
                await this.sendWeeklyReport();
                break;
            default:
                throw new Error(`Unknown job: ${jobName}`);
        }
    }
}
exports.mtrNotificationScheduler = new MTRNotificationScheduler();
exports.default = exports.mtrNotificationScheduler;
//# sourceMappingURL=mtrNotificationScheduler.js.map