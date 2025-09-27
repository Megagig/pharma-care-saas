"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceJobService = void 0;
const bullmq_1 = require("bullmq");
const perf_hooks_1 = require("perf_hooks");
const logger_1 = __importDefault(require("../utils/logger"));
const PerformanceCacheService_1 = __importDefault(require("./PerformanceCacheService"));
const PerformanceDatabaseOptimizer_1 = __importDefault(require("./PerformanceDatabaseOptimizer"));
class PerformanceJobService {
    constructor() {
        this.queueEvents = new Map();
        this.initializeQueues();
        this.initializeWorkers();
        this.setupEventHandlers();
        this.scheduleRecurringJobs();
    }
    static getInstance() {
        if (!PerformanceJobService.instance) {
            PerformanceJobService.instance = new PerformanceJobService();
        }
        return PerformanceJobService.instance;
    }
    initializeQueues() {
        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_JOB_DB || '2'),
        };
        this.aiAnalysisQueue = new bullmq_1.Queue('ai-analysis', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 20,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        });
        this.dataExportQueue = new bullmq_1.Queue('data-export', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 20,
                removeOnFail: 10,
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
            },
        });
        this.cacheWarmupQueue = new bullmq_1.Queue('cache-warmup', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 10,
                removeOnFail: 5,
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 3000,
                },
            },
        });
        this.databaseMaintenanceQueue = new bullmq_1.Queue('database-maintenance', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 30,
                removeOnFail: 10,
                attempts: 1,
            },
        });
        ['ai-analysis', 'data-export', 'cache-warmup', 'database-maintenance'].forEach(queueName => {
            this.queueEvents.set(queueName, new bullmq_1.QueueEvents(queueName, { connection }));
        });
    }
    initializeWorkers() {
        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_JOB_DB || '2'),
        };
        this.aiAnalysisWorker = new bullmq_1.Worker('ai-analysis', async (job) => this.processAIAnalysisJob(job), {
            connection,
            concurrency: 2,
        });
        this.dataExportWorker = new bullmq_1.Worker('data-export', async (job) => this.processDataExportJob(job), {
            connection,
            concurrency: 3,
        });
        this.cacheWarmupWorker = new bullmq_1.Worker('cache-warmup', async (job) => this.processCacheWarmupJob(job), {
            connection,
            concurrency: 5,
        });
        this.databaseMaintenanceWorker = new bullmq_1.Worker('database-maintenance', async (job) => this.processDatabaseMaintenanceJob(job), {
            connection,
            concurrency: 1,
        });
    }
    async queueAIAnalysis(data) {
        const priority = this.getPriority(data.priority);
        logger_1.default.info(`Queuing AI analysis job: ${data.type}`, {
            patientId: data.patientId,
            workspaceId: data.workspaceId,
            priority: data.priority,
        });
        return this.aiAnalysisQueue.add('ai-analysis', data, {
            priority,
            delay: data.priority === 'urgent' ? 0 : 1000,
        });
    }
    async queueDataExport(data) {
        logger_1.default.info(`Queuing data export job: ${data.type}`, {
            workspaceId: data.workspaceId,
            userId: data.userId,
            format: data.format,
        });
        return this.dataExportQueue.add('data-export', data, {
            priority: 10,
        });
    }
    async queueCacheWarmup(data) {
        const priority = this.getPriority(data.priority);
        logger_1.default.info(`Queuing cache warmup job: ${data.type}`, {
            workspaceId: data.workspaceId,
            targetUsers: data.targetUsers?.length || 'all',
            priority: data.priority,
        });
        return this.cacheWarmupQueue.add('cache-warmup', data, {
            priority,
        });
    }
    async queueDatabaseMaintenance(data) {
        logger_1.default.info(`Queuing database maintenance job: ${data.type}`, {
            workspaceId: data.workspaceId,
            parameters: Object.keys(data.parameters),
        });
        return this.databaseMaintenanceQueue.add('database-maintenance', data, {
            priority: 1,
        });
    }
    async processAIAnalysisJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { type, patientId, workspaceId, userId, parameters } = job.data;
        try {
            await job.updateProgress(10);
            let result;
            switch (type) {
                case 'drug-interaction':
                    result = await this.performDrugInteractionAnalysis(patientId, parameters);
                    break;
                case 'clinical-decision-support':
                    result = await this.performClinicalDecisionSupport(patientId, parameters);
                    break;
                case 'medication-review':
                    result = await this.performMedicationReview(patientId, parameters);
                    break;
                case 'patient-risk-assessment':
                    result = await this.performPatientRiskAssessment(patientId, parameters);
                    break;
                default:
                    throw new Error(`Unknown AI analysis type: ${type}`);
            }
            await job.updateProgress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.info(`AI analysis job completed: ${type}`, {
                patientId,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: true,
                data: result,
                executionTime,
                metrics: {
                    analysisType: type,
                    patientId,
                    workspaceId,
                    userId,
                },
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error(`AI analysis job failed: ${type}`, error);
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async processDataExportJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { type, workspaceId, userId, userEmail, filters, format, fileName } = job.data;
        try {
            await job.updateProgress(10);
            const data = await this.fetchExportData(type, workspaceId, filters);
            await job.updateProgress(50);
            const filePath = await this.generateExportFile(data, format, fileName);
            await job.updateProgress(80);
            await this.sendExportNotification(userEmail, fileName, filePath, format);
            await job.updateProgress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.info(`Data export job completed: ${type}`, {
                workspaceId,
                format,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: true,
                data: { filePath, recordCount: data.length },
                executionTime,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error(`Data export job failed: ${type}`, error);
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async processCacheWarmupJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { type, workspaceId, targetUsers } = job.data;
        try {
            await job.updateProgress(10);
            const cacheService = PerformanceCacheService_1.default.getInstance();
            let warmedCount = 0;
            switch (type) {
                case 'dashboard':
                    warmedCount = await this.warmDashboardCache(workspaceId, targetUsers);
                    break;
                case 'patient-lists':
                    warmedCount = await this.warmPatientListsCache(workspaceId, targetUsers);
                    break;
                case 'clinical-notes':
                    warmedCount = await this.warmClinicalNotesCache(workspaceId, targetUsers);
                    break;
                case 'medications':
                    warmedCount = await this.warmMedicationsCache(workspaceId, targetUsers);
                    break;
                case 'reports':
                    warmedCount = await this.warmReportsCache(workspaceId, targetUsers);
                    break;
                default:
                    throw new Error(`Unknown cache warmup type: ${type}`);
            }
            await job.updateProgress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.info(`Cache warmup job completed: ${type}`, {
                workspaceId,
                warmedCount,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: true,
                data: { warmedCount },
                executionTime,
                metrics: {
                    cacheType: type,
                    workspaceId,
                    warmedCount,
                },
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error(`Cache warmup job failed: ${type}`, error);
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async processDatabaseMaintenanceJob(job) {
        const startTime = perf_hooks_1.performance.now();
        const { type, workspaceId, parameters } = job.data;
        try {
            await job.updateProgress(10);
            const optimizer = PerformanceDatabaseOptimizer_1.default.getInstance();
            let result;
            switch (type) {
                case 'index-optimization':
                    result = await optimizer.createAllOptimizedIndexes();
                    break;
                case 'cleanup-expired-data':
                    result = await this.cleanupExpiredData(workspaceId, parameters);
                    break;
                case 'performance-analysis':
                    result = await optimizer.analyzeExistingIndexes();
                    break;
                case 'backup-verification':
                    result = await this.verifyBackupIntegrity(parameters);
                    break;
                default:
                    throw new Error(`Unknown database maintenance type: ${type}`);
            }
            await job.updateProgress(100);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.info(`Database maintenance job completed: ${type}`, {
                workspaceId,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: true,
                data: result,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger_1.default.error(`Database maintenance job failed: ${type}`, error);
            return {
                success: false,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    setupEventHandlers() {
        this.queueEvents.get('ai-analysis')?.on('completed', ({ jobId, returnvalue }) => {
            logger_1.default.info(`AI analysis job ${jobId} completed`, returnvalue);
        });
        this.queueEvents.get('ai-analysis')?.on('failed', ({ jobId, failedReason }) => {
            logger_1.default.error(`AI analysis job ${jobId} failed: ${failedReason}`);
        });
        this.queueEvents.get('data-export')?.on('completed', ({ jobId, returnvalue }) => {
            logger_1.default.info(`Data export job ${jobId} completed`, returnvalue);
        });
        this.queueEvents.get('data-export')?.on('failed', ({ jobId, failedReason }) => {
            logger_1.default.error(`Data export job ${jobId} failed: ${failedReason}`);
        });
        this.queueEvents.get('cache-warmup')?.on('completed', ({ jobId, returnvalue }) => {
            logger_1.default.info(`Cache warmup job ${jobId} completed`, returnvalue);
        });
        this.queueEvents.get('database-maintenance')?.on('completed', ({ jobId, returnvalue }) => {
            logger_1.default.info(`Database maintenance job ${jobId} completed`, returnvalue);
        });
        this.queueEvents.get('database-maintenance')?.on('failed', ({ jobId, failedReason }) => {
            logger_1.default.error(`Database maintenance job ${jobId} failed: ${failedReason}`);
        });
    }
    scheduleRecurringJobs() {
        this.cacheWarmupQueue.add('daily-cache-warmup', {
            type: 'dashboard',
            workspaceId: 'all',
            priority: 'low',
        }, {
            repeat: { pattern: '0 6 * * *' },
            jobId: 'daily-cache-warmup',
        });
        this.databaseMaintenanceQueue.add('weekly-performance-analysis', {
            type: 'performance-analysis',
            parameters: { fullAnalysis: true },
        }, {
            repeat: { pattern: '0 2 * * 0' },
            jobId: 'weekly-performance-analysis',
        });
        this.databaseMaintenanceQueue.add('monthly-index-optimization', {
            type: 'index-optimization',
            parameters: { createNew: true, analyzeUsage: true },
        }, {
            repeat: { pattern: '0 3 1 * *' },
            jobId: 'monthly-index-optimization',
        });
    }
    async getJobStatistics() {
        const queues = {
            'ai-analysis': this.aiAnalysisQueue,
            'data-export': this.dataExportQueue,
            'cache-warmup': this.cacheWarmupQueue,
            'database-maintenance': this.databaseMaintenanceQueue,
        };
        const stats = {};
        for (const [name, queue] of Object.entries(queues)) {
            try {
                const [waiting, active, completed, failed] = await Promise.all([
                    queue.getWaiting(),
                    queue.getActive(),
                    queue.getCompleted(),
                    queue.getFailed(),
                ]);
                stats[name] = {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length,
                    total: waiting.length + active.length + completed.length + failed.length,
                };
            }
            catch (error) {
                logger_1.default.error(`Error getting stats for queue ${name}:`, error);
                stats[name] = { error: 'Failed to get statistics' };
            }
        }
        return stats;
    }
    getPriority(priority) {
        switch (priority) {
            case 'urgent': return 1;
            case 'high': return 5;
            case 'medium': return 10;
            case 'low': return 20;
            default: return 10;
        }
    }
    async performDrugInteractionAnalysis(patientId, parameters) {
        return { interactions: [], riskLevel: 'low', recommendations: [] };
    }
    async performClinicalDecisionSupport(patientId, parameters) {
        return { recommendations: [], alerts: [], confidence: 0.85 };
    }
    async performMedicationReview(patientId, parameters) {
        return { issues: [], optimizations: [], adherenceScore: 0.9 };
    }
    async performPatientRiskAssessment(patientId, parameters) {
        return { riskScore: 0.3, factors: [], recommendations: [] };
    }
    async fetchExportData(type, workspaceId, filters) {
        return [];
    }
    async generateExportFile(data, format, fileName) {
        return `/exports/${fileName}`;
    }
    async sendExportNotification(email, fileName, filePath, format) {
    }
    async warmDashboardCache(workspaceId, targetUsers) {
        return 0;
    }
    async warmPatientListsCache(workspaceId, targetUsers) {
        return 0;
    }
    async warmClinicalNotesCache(workspaceId, targetUsers) {
        return 0;
    }
    async warmMedicationsCache(workspaceId, targetUsers) {
        return 0;
    }
    async warmReportsCache(workspaceId, targetUsers) {
        return 0;
    }
    async cleanupExpiredData(workspaceId, parameters) {
        return { deletedRecords: 0, freedSpace: 0 };
    }
    async verifyBackupIntegrity(parameters) {
        return { verified: true, issues: [] };
    }
    async shutdown() {
        logger_1.default.info('Shutting down performance job service...');
        await Promise.all([
            this.aiAnalysisWorker.close(),
            this.dataExportWorker.close(),
            this.cacheWarmupWorker.close(),
            this.databaseMaintenanceWorker.close(),
        ]);
        await Promise.all([
            this.aiAnalysisQueue.close(),
            this.dataExportQueue.close(),
            this.cacheWarmupQueue.close(),
            this.databaseMaintenanceQueue.close(),
        ]);
        for (const queueEvents of this.queueEvents.values()) {
            await queueEvents.close();
        }
        logger_1.default.info('Performance job service shut down successfully');
    }
}
exports.PerformanceJobService = PerformanceJobService;
exports.default = PerformanceJobService;
//# sourceMappingURL=PerformanceJobService.js.map