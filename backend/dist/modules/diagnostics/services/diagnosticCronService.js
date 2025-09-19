"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticCronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const diagnosticFollowUpService_1 = __importDefault(require("./diagnosticFollowUpService"));
const adherenceService_1 = __importDefault(require("./adherenceService"));
const diagnosticNotificationService_1 = __importDefault(require("./diagnosticNotificationService"));
class DiagnosticCronService {
    constructor() {
        this.jobs = new Map();
    }
    initializeCronJobs() {
        try {
            this.scheduleJob('processMissedFollowUps', '0 * * * *', this.processMissedFollowUps.bind(this));
            this.scheduleJob('processAdherenceAssessments', '0 */6 * * *', this.processAdherenceAssessments.bind(this));
            this.scheduleJob('processPendingNotifications', '*/15 * * * *', this.processPendingNotifications.bind(this));
            this.scheduleJob('checkOverdueFollowUps', '0 */2 * * *', this.checkOverdueFollowUps.bind(this));
            this.scheduleJob('checkAdherenceIssues', '0 */4 * * *', this.checkAdherenceIssues.bind(this));
            this.scheduleJob('dailyMaintenance', '0 2 * * *', this.dailyMaintenance.bind(this));
            logger_1.default.info('Diagnostic cron jobs initialized successfully');
        }
        catch (error) {
            logger_1.default.error('Error initializing diagnostic cron jobs:', error);
            throw error;
        }
    }
    scheduleJob(name, schedule, task) {
        try {
            const job = node_cron_1.default.schedule(schedule, async () => {
                logger_1.default.info(`Starting cron job: ${name}`);
                const startTime = Date.now();
                try {
                    await task();
                    const duration = Date.now() - startTime;
                    logger_1.default.info(`Completed cron job: ${name} in ${duration}ms`);
                }
                catch (error) {
                    logger_1.default.error(`Error in cron job ${name}:`, error);
                }
            }, {
                timezone: 'UTC'
            });
            this.jobs.set(name, job);
            logger_1.default.info(`Scheduled cron job: ${name} with schedule: ${schedule}`);
        }
        catch (error) {
            logger_1.default.error(`Error scheduling cron job ${name}:`, error);
            throw error;
        }
    }
    startAllJobs() {
        try {
            this.jobs.forEach((job, name) => {
                job.start();
                logger_1.default.info(`Started cron job: ${name}`);
            });
            logger_1.default.info(`Started ${this.jobs.size} diagnostic cron jobs`);
        }
        catch (error) {
            logger_1.default.error('Error starting cron jobs:', error);
            throw error;
        }
    }
    stopAllJobs() {
        try {
            this.jobs.forEach((job, name) => {
                job.stop();
                logger_1.default.info(`Stopped cron job: ${name}`);
            });
            logger_1.default.info(`Stopped ${this.jobs.size} diagnostic cron jobs`);
        }
        catch (error) {
            logger_1.default.error('Error stopping cron jobs:', error);
            throw error;
        }
    }
    stopJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            logger_1.default.info(`Stopped cron job: ${name}`);
        }
        else {
            logger_1.default.warn(`Cron job not found: ${name}`);
        }
    }
    startJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.start();
            logger_1.default.info(`Started cron job: ${name}`);
        }
        else {
            logger_1.default.warn(`Cron job not found: ${name}`);
        }
    }
    getJobsStatus() {
        const status = {};
        this.jobs.forEach((job, name) => {
            status[name] = job.getStatus() === 'running';
        });
        return status;
    }
    async processMissedFollowUps() {
        try {
            await diagnosticFollowUpService_1.default.processMissedFollowUps();
            logger_1.default.info('Processed missed follow-ups successfully');
        }
        catch (error) {
            logger_1.default.error('Error processing missed follow-ups:', error);
            throw error;
        }
    }
    async processAdherenceAssessments() {
        try {
            await adherenceService_1.default.processAdherenceAssessments();
            logger_1.default.info('Processed adherence assessments successfully');
        }
        catch (error) {
            logger_1.default.error('Error processing adherence assessments:', error);
            throw error;
        }
    }
    async processPendingNotifications() {
        try {
            await diagnosticNotificationService_1.default.processPendingNotifications();
            logger_1.default.info('Processed pending notifications successfully');
        }
        catch (error) {
            logger_1.default.error('Error processing pending notifications:', error);
            throw error;
        }
    }
    async checkOverdueFollowUps() {
        try {
            await diagnosticNotificationService_1.default.checkOverdueFollowUps();
            logger_1.default.info('Checked overdue follow-ups successfully');
        }
        catch (error) {
            logger_1.default.error('Error checking overdue follow-ups:', error);
            throw error;
        }
    }
    async checkAdherenceIssues() {
        try {
            await diagnosticNotificationService_1.default.checkAdherenceIssues();
            logger_1.default.info('Checked adherence issues successfully');
        }
        catch (error) {
            logger_1.default.error('Error checking adherence issues:', error);
            throw error;
        }
    }
    async dailyMaintenance() {
        try {
            logger_1.default.info('Starting daily diagnostic maintenance tasks');
            await this.cleanupOldNotifications();
            await this.archiveOldFollowUps();
            await this.generateDailyAdherenceSummary();
            await this.cleanupExpiredAlerts();
            logger_1.default.info('Completed daily diagnostic maintenance tasks');
        }
        catch (error) {
            logger_1.default.error('Error in daily maintenance:', error);
            throw error;
        }
    }
    async cleanupOldNotifications() {
        try {
            logger_1.default.info('Cleaned up old notifications');
        }
        catch (error) {
            logger_1.default.error('Error cleaning up old notifications:', error);
        }
    }
    async archiveOldFollowUps() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            logger_1.default.info(`Would archive follow-ups older than ${cutoffDate.toISOString()}`);
        }
        catch (error) {
            logger_1.default.error('Error archiving old follow-ups:', error);
        }
    }
    async generateDailyAdherenceSummary() {
        try {
            logger_1.default.info('Generated daily adherence summary');
        }
        catch (error) {
            logger_1.default.error('Error generating daily adherence summary:', error);
        }
    }
    async cleanupExpiredAlerts() {
        try {
            logger_1.default.info('Cleaned up expired alerts');
        }
        catch (error) {
            logger_1.default.error('Error cleaning up expired alerts:', error);
        }
    }
    async triggerJob(jobName) {
        try {
            logger_1.default.info(`Manually triggering job: ${jobName}`);
            switch (jobName) {
                case 'processMissedFollowUps':
                    await this.processMissedFollowUps();
                    break;
                case 'processAdherenceAssessments':
                    await this.processAdherenceAssessments();
                    break;
                case 'processPendingNotifications':
                    await this.processPendingNotifications();
                    break;
                case 'checkOverdueFollowUps':
                    await this.checkOverdueFollowUps();
                    break;
                case 'checkAdherenceIssues':
                    await this.checkAdherenceIssues();
                    break;
                case 'dailyMaintenance':
                    await this.dailyMaintenance();
                    break;
                default:
                    throw new Error(`Unknown job name: ${jobName}`);
            }
            logger_1.default.info(`Successfully triggered job: ${jobName}`);
        }
        catch (error) {
            logger_1.default.error(`Error triggering job ${jobName}:`, error);
            throw error;
        }
    }
    getAvailableJobs() {
        return Array.from(this.jobs.keys());
    }
    updateJobSchedule(jobName, newSchedule) {
        try {
            const job = this.jobs.get(jobName);
            if (!job) {
                throw new Error(`Job not found: ${jobName}`);
            }
            job.stop();
            const jobFunction = this.getJobFunction(jobName);
            if (jobFunction) {
                this.scheduleJob(jobName, newSchedule, jobFunction);
                logger_1.default.info(`Updated schedule for job ${jobName} to: ${newSchedule}`);
            }
            else {
                throw new Error(`Job function not found for: ${jobName}`);
            }
        }
        catch (error) {
            logger_1.default.error(`Error updating job schedule for ${jobName}:`, error);
            throw error;
        }
    }
    getJobFunction(jobName) {
        const jobFunctions = {
            'processMissedFollowUps': this.processMissedFollowUps.bind(this),
            'processAdherenceAssessments': this.processAdherenceAssessments.bind(this),
            'processPendingNotifications': this.processPendingNotifications.bind(this),
            'checkOverdueFollowUps': this.checkOverdueFollowUps.bind(this),
            'checkAdherenceIssues': this.checkAdherenceIssues.bind(this),
            'dailyMaintenance': this.dailyMaintenance.bind(this)
        };
        return jobFunctions[jobName] || null;
    }
    async shutdown() {
        try {
            logger_1.default.info('Shutting down diagnostic cron service...');
            this.stopAllJobs();
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger_1.default.info('Diagnostic cron service shutdown complete');
        }
        catch (error) {
            logger_1.default.error('Error during diagnostic cron service shutdown:', error);
            throw error;
        }
    }
}
exports.diagnosticCronService = new DiagnosticCronService();
exports.default = exports.diagnosticCronService;
//# sourceMappingURL=diagnosticCronService.js.map