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
exports.BackgroundJobService = void 0;
const bull_1 = __importDefault(require("bull"));
const perf_hooks_1 = require("perf_hooks");
const logger_1 = __importDefault(require("../utils/logger"));
const emailHelpers_1 = require("../utils/emailHelpers");
const exportHelpers_1 = require("../utils/exportHelpers");
const path = __importStar(require("path"));
class BackgroundJobService {
    constructor() {
        if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
            logger_1.default.info('Background job service is disabled via environment variable');
            return;
        }
        try {
            const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_JOB_DB || '1'),
            };
            this.exportQueue = new bull_1.default('report-exports', { redis: redisConfig });
            this.reportQueue = new bull_1.default('scheduled-reports', { redis: redisConfig });
            this.cleanupQueue = new bull_1.default('cleanup-jobs', { redis: redisConfig });
            this.setupJobProcessors();
            this.setupEventHandlers();
            this.scheduleCleanupJobs();
            logger_1.default.info('Background job service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('Failed to initialize background job service:', error);
            logger_1.default.warn('Background job service will be disabled. Install and start Redis to enable job processing.');
        }
    }
    static getInstance() {
        if (!BackgroundJobService.instance) {
            if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
                logger_1.default.info('Background jobs are disabled via environment variable');
                BackgroundJobService.instance = new BackgroundJobService();
                return BackgroundJobService.instance;
            }
            BackgroundJobService.instance = new BackgroundJobService();
        }
        return BackgroundJobService.instance;
    }
    async queueExportJob(data, options = {}) {
        try {
            if (!this.exportQueue) {
                logger_1.default.warn('Export queue not available - Redis connection failed');
                return null;
            }
            const defaultOptions = {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 10,
                removeOnFail: 5,
                timeout: 10 * 60 * 1000,
                ...options,
            };
            logger_1.default.info(`Queuing export job for ${data.reportType}`, {
                workplaceId: data.workplaceId,
                userId: data.userId,
                format: data.format,
            });
            return this.exportQueue.add('export-report', data, defaultOptions);
        }
        catch (error) {
            logger_1.default.error('Failed to queue export job:', error);
            return null;
        }
    }
    async queueScheduledReport(data, options = {}) {
        try {
            if (!this.reportQueue) {
                logger_1.default.warn('Report queue not available - Redis connection failed');
                return null;
            }
            const defaultOptions = {
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
                removeOnComplete: 20,
                removeOnFail: 10,
                timeout: 15 * 60 * 1000,
                ...options,
            };
            logger_1.default.info(`Queuing scheduled report for ${data.reportType}`, {
                workplaceId: data.workplaceId,
                scheduleId: data.scheduleId,
                recipients: data.recipients.length,
            });
            return this.reportQueue.add('generate-scheduled-report', data, defaultOptions);
        }
        catch (error) {
            logger_1.default.error('Failed to queue scheduled report:', error);
            return null;
        }
    }
    async getJobStatus(jobId, queueType) {
        try {
            const queue = queueType === 'export' ? this.exportQueue : this.reportQueue;
            const job = await queue.getJob(jobId);
            if (!job) {
                return { status: 'not_found' };
            }
            const state = await job.getState();
            const progress = job.progress();
            return {
                id: job.id,
                status: state,
                progress,
                data: job.data,
                result: job.returnvalue,
                failedReason: job.failedReason,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                createdAt: new Date(job.timestamp),
            };
        }
        catch (error) {
            logger_1.default.error('Error getting job status:', error);
            return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async cancelJob(jobId, queueType) {
        try {
            const queue = queueType === 'export' ? this.exportQueue : this.reportQueue;
            const job = await queue.getJob(jobId);
            if (job) {
                await job.remove();
                logger_1.default.info(`Job ${jobId} cancelled successfully`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error('Error cancelling job:', error);
            return false;
        }
    }
    async getQueueStats() {
        try {
            const [exportStats, reportStats, cleanupStats] = await Promise.all([
                this.getQueueStatistics(this.exportQueue),
                this.getQueueStatistics(this.reportQueue),
                this.getQueueStatistics(this.cleanupQueue),
            ]);
            return {
                export: exportStats,
                report: reportStats,
                cleanup: cleanupStats,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting queue stats:', error);
            return {
                export: {},
                report: {},
                cleanup: {},
            };
        }
    }
    setupJobProcessors() {
        this.exportQueue.process('export-report', 5, async (job) => {
            return this.processExportJob(job);
        });
        this.reportQueue.process('generate-scheduled-report', 3, async (job) => {
            return this.processScheduledReportJob(job);
        });
        this.cleanupQueue.process('cleanup-old-files', async (job) => {
            return this.processCleanupJob(job);
        });
    }
    setupEventHandlers() {
        this.exportQueue.on('completed', (job, result) => {
            logger_1.default.info(`Export job ${job.id} completed`, {
                reportType: job.data.reportType,
                executionTime: result.executionTime,
                fileSize: result.fileSize,
            });
        });
        this.exportQueue.on('failed', (job, err) => {
            logger_1.default.error(`Export job ${job.id} failed`, {
                reportType: job.data.reportType,
                error: err.message,
                attempts: job.attemptsMade,
            });
        });
        this.exportQueue.on('stalled', (job) => {
            logger_1.default.warn(`Export job ${job.id} stalled`, {
                reportType: job.data.reportType,
            });
        });
        this.reportQueue.on('completed', (job, result) => {
            logger_1.default.info(`Scheduled report job ${job.id} completed`, {
                reportType: job.data.reportType,
                scheduleId: job.data.scheduleId,
                executionTime: result.executionTime,
            });
        });
        this.reportQueue.on('failed', (job, err) => {
            logger_1.default.error(`Scheduled report job ${job.id} failed`, {
                reportType: job.data.reportType,
                scheduleId: job.data.scheduleId,
                error: err.message,
            });
        });
    }
    async processExportJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { reportType, workplaceId, userId, userEmail, filters, format, fileName, options } = job.data;
        try {
            await job.progress(10);
            const reportData = await this.generateReportData(reportType, workplaceId, filters);
            await job.progress(50);
            let filePath;
            let fileSize;
            switch (format) {
                case 'pdf':
                    filePath = await (0, exportHelpers_1.generatePDFReport)(reportData, fileName, options);
                    break;
                case 'excel':
                    filePath = await (0, exportHelpers_1.generateExcelReport)(reportData, fileName, options);
                    break;
                case 'csv':
                    filePath = await (0, exportHelpers_1.generateCSVReport)(reportData, fileName, options);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            await job.progress(80);
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const stats = await fs.promises.stat(filePath);
            fileSize = stats.size;
            await this.sendExportNotification(userEmail, fileName, filePath, format);
            await job.progress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            return {
                success: true,
                filePath,
                fileSize,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error('Export job processing failed:', error);
            await this.sendExportFailureNotification(userEmail, fileName, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async processScheduledReportJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { reportType, workplaceId, scheduleId, recipients, filters, format, templateId } = job.data;
        try {
            await job.progress(10);
            const reportData = await this.generateReportData(reportType, workplaceId, filters);
            await job.progress(40);
            const generatedFiles = [];
            for (const fmt of format) {
                const fileName = `${reportType}-${new Date().toISOString().split('T')[0]}.${fmt}`;
                let filePath;
                switch (fmt) {
                    case 'pdf':
                        filePath = await (0, exportHelpers_1.generatePDFReport)(reportData, fileName, { templateId });
                        break;
                    case 'excel':
                        filePath = await (0, exportHelpers_1.generateExcelReport)(reportData, fileName, { templateId });
                        break;
                    case 'csv':
                        filePath = await (0, exportHelpers_1.generateCSVReport)(reportData, fileName, { templateId });
                        break;
                    default:
                        continue;
                }
                generatedFiles.push({ format: fmt, filePath });
            }
            await job.progress(80);
            await this.sendScheduledReportNotification(recipients, reportType, generatedFiles);
            await job.progress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            return {
                success: true,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error('Scheduled report job processing failed:', error);
            await this.sendScheduledReportFailureNotification(recipients, reportType, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async processCleanupJob(job) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const exportsDir = path.join(process.cwd(), 'exports');
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            let deletedCount = 0;
            let totalSize = 0;
            if (await fs.promises.access(exportsDir).then(() => true).catch(() => false)) {
                const files = await fs.promises.readdir(exportsDir);
                for (const file of files) {
                    const filePath = path.join(exportsDir, file);
                    const stats = await fs.promises.stat(filePath);
                    if (stats.mtime < cutoffDate) {
                        totalSize += stats.size;
                        await fs.promises.unlink(filePath);
                        deletedCount++;
                    }
                }
            }
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.info(`Cleanup job completed: deleted ${deletedCount} files (${totalSize} bytes)`);
            return {
                success: true,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error('Cleanup job processing failed:', error);
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    scheduleCleanupJobs() {
        this.cleanupQueue.add('cleanup-old-files', {}, {
            repeat: { cron: '0 2 * * *' },
            removeOnComplete: 5,
            removeOnFail: 2,
        });
    }
    async getQueueStatistics(queue) {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed(),
        ]);
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
            total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        };
    }
    async generateReportData(reportType, workplaceId, filters) {
        return {
            reportType,
            workplaceId,
            filters,
            data: [],
            generatedAt: new Date(),
        };
    }
    async sendExportNotification(email, fileName, filePath, format) {
        try {
            await (0, emailHelpers_1.sendTemplatedEmail)({
                to: email,
                subject: `Report Export Ready: ${fileName}`,
                template: 'export-ready',
                data: {
                    fileName,
                    format: format.toUpperCase(),
                    downloadLink: `${process.env.BASE_URL}/api/exports/download/${path.basename(filePath)}`,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to send export notification:', error);
        }
    }
    async sendExportFailureNotification(email, fileName, error) {
        try {
            await (0, emailHelpers_1.sendTemplatedEmail)({
                to: email,
                subject: `Report Export Failed: ${fileName}`,
                template: 'export-failed',
                data: {
                    fileName,
                    error,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to send export failure notification:', error);
        }
    }
    async sendScheduledReportNotification(recipients, reportType, files) {
        try {
            const attachments = files.map(file => ({
                filename: path.basename(file.filePath),
                path: file.filePath,
            }));
            for (const recipient of recipients) {
                await (0, emailHelpers_1.sendTemplatedEmail)({
                    to: recipient,
                    subject: `Scheduled Report: ${reportType}`,
                    template: 'scheduled-report',
                    data: {
                        reportType,
                        generatedAt: new Date().toISOString(),
                        formats: files.map(f => f.format.toUpperCase()).join(', '),
                    },
                    attachments,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to send scheduled report notification:', error);
        }
    }
    async sendScheduledReportFailureNotification(recipients, reportType, error) {
        try {
            for (const recipient of recipients) {
                await (0, emailHelpers_1.sendTemplatedEmail)({
                    to: recipient,
                    subject: `Scheduled Report Failed: ${reportType}`,
                    template: 'scheduled-report-failed',
                    data: {
                        reportType,
                        error,
                    },
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to send scheduled report failure notification:', error);
        }
    }
    async shutdown() {
        logger_1.default.info('Shutting down background job service...');
        await Promise.all([
            this.exportQueue.close(),
            this.reportQueue.close(),
            this.cleanupQueue.close(),
        ]);
        logger_1.default.info('Background job service shut down successfully');
    }
}
exports.BackgroundJobService = BackgroundJobService;
exports.default = BackgroundJobService;
//# sourceMappingURL=BackgroundJobService.js.map