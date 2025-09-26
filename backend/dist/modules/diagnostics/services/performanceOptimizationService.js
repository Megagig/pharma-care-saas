"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../utils/logger"));
const diagnosticCacheService_1 = __importDefault(require("./diagnosticCacheService"));
class PerformanceOptimizationService {
    constructor() {
        this.backgroundJobs = new Map();
        this.jobQueue = [];
        this.isProcessingJobs = false;
        this.connectionPoolStats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingRequests: 0,
            averageWaitTime: 0,
            connectionErrors: 0,
        };
        this.queryMetrics = {
            totalQueries: 0,
            totalQueryTime: 0,
            slowQueries: 0,
            optimizedQueries: 0,
        };
        this.startBackgroundJobProcessor();
        this.startPerformanceMonitoring();
    }
    optimizeAggregationPipeline(pipeline) {
        const originalPipeline = [...pipeline];
        const optimizedPipeline = [...pipeline];
        const recommendations = [];
        let estimatedImprovement = 0;
        const matchStages = optimizedPipeline.filter(stage => stage.$match);
        const otherStages = optimizedPipeline.filter(stage => !stage.$match);
        if (matchStages.length > 0 && optimizedPipeline.indexOf(matchStages[0]) > 0) {
            optimizedPipeline.splice(0, 0, ...matchStages);
            otherStages.forEach(stage => {
                if (!matchStages.includes(stage)) {
                    optimizedPipeline.push(stage);
                }
            });
            recommendations.push('Moved $match stages to beginning for early filtering');
            estimatedImprovement += 20;
        }
        for (let i = 0; i < optimizedPipeline.length; i++) {
            const stage = optimizedPipeline[i];
            if (stage.$lookup) {
                const nextStage = optimizedPipeline[i + 1];
                if (!nextStage || !nextStage.$match) {
                    recommendations.push('Consider adding $match after $lookup to filter joined data');
                    estimatedImprovement += 15;
                }
            }
        }
        const projectStages = optimizedPipeline.filter(stage => stage.$project);
        if (projectStages.length > 1) {
            recommendations.push('Multiple $project stages detected - consider combining them');
            estimatedImprovement += 10;
        }
        const hasLimit = optimizedPipeline.some(stage => stage.$limit);
        const hasGroup = optimizedPipeline.some(stage => stage.$group);
        if (!hasLimit && !hasGroup) {
            recommendations.push('Consider adding $limit to prevent large result sets');
            estimatedImprovement += 25;
        }
        return {
            originalQuery: originalPipeline,
            optimizedQuery: optimizedPipeline,
            estimatedImprovement,
            recommendations,
        };
    }
    optimizeFindQuery(query, options = {}) {
        const originalQuery = { ...query };
        const optimizedQuery = { ...query };
        const recommendations = [];
        let estimatedImprovement = 0;
        for (const [key, value] of Object.entries(optimizedQuery)) {
            if (value && typeof value === 'object' && value.$regex) {
                if (!value.$options || !value.$options.includes('i')) {
                    recommendations.push(`Consider case-insensitive regex for field: ${key}`);
                }
                if (typeof value.$regex === 'string' && !value.$regex.startsWith('^')) {
                    recommendations.push(`Consider anchoring regex with ^ for field: ${key}`);
                    estimatedImprovement += 30;
                }
            }
        }
        const indexableFields = ['workplaceId', 'patientId', 'createdAt', 'status', 'isDeleted'];
        for (const field of indexableFields) {
            if (optimizedQuery[field]) {
                recommendations.push(`Ensure index exists for field: ${field}`);
                estimatedImprovement += 20;
            }
        }
        if (optimizedQuery.createdAt && typeof optimizedQuery.createdAt === 'object') {
            if (optimizedQuery.createdAt.$gte && optimizedQuery.createdAt.$lte) {
                recommendations.push('Date range query detected - ensure compound index on (workplaceId, createdAt)');
                estimatedImprovement += 15;
            }
        }
        if (!options.projection && !options.select) {
            recommendations.push('Consider adding projection to limit returned fields');
            estimatedImprovement += 10;
        }
        if (!options.limit) {
            recommendations.push('Consider adding limit to prevent large result sets');
            estimatedImprovement += 20;
        }
        return {
            originalQuery,
            optimizedQuery,
            estimatedImprovement,
            recommendations,
        };
    }
    getRecommendedIndexes() {
        return [
            {
                collection: 'diagnosticrequests',
                index: { workplaceId: 1, patientId: 1, createdAt: -1 },
                options: { background: true },
                rationale: 'Optimize patient diagnostic history queries',
            },
            {
                collection: 'diagnosticrequests',
                index: { workplaceId: 1, status: 1, createdAt: -1 },
                options: { background: true },
                rationale: 'Optimize status-based queries with date sorting',
            },
            {
                collection: 'diagnosticrequests',
                index: { workplaceId: 1, pharmacistId: 1, createdAt: -1 },
                options: { background: true },
                rationale: 'Optimize pharmacist-specific diagnostic queries',
            },
            {
                collection: 'diagnosticresults',
                index: { requestId: 1 },
                options: { unique: true, background: true },
                rationale: 'Ensure unique results per request and fast lookups',
            },
            {
                collection: 'diagnosticresults',
                index: { workplaceId: 1, createdAt: -1 },
                options: { background: true },
                rationale: 'Optimize workplace-wide result queries',
            },
            {
                collection: 'diagnosticresults',
                index: { 'aiMetadata.modelId': 1, 'aiMetadata.confidenceScore': -1 },
                options: { background: true },
                rationale: 'Optimize AI performance analytics queries',
            },
            {
                collection: 'laborders',
                index: { workplaceId: 1, patientId: 1, orderDate: -1 },
                options: { background: true },
                rationale: 'Optimize patient lab order history',
            },
            {
                collection: 'laborders',
                index: { workplaceId: 1, status: 1, orderDate: -1 },
                options: { background: true },
                rationale: 'Optimize lab order status tracking',
            },
            {
                collection: 'labresults',
                index: { workplaceId: 1, patientId: 1, performedAt: -1 },
                options: { background: true },
                rationale: 'Optimize patient lab result history',
            },
            {
                collection: 'labresults',
                index: { workplaceId: 1, testCode: 1, performedAt: -1 },
                options: { background: true },
                rationale: 'Optimize test-specific trend analysis',
            },
            {
                collection: 'labresults',
                index: { interpretation: 1, workplaceId: 1 },
                options: { background: true },
                rationale: 'Optimize abnormal result queries',
            },
        ];
    }
    updateConnectionPoolStats(stats) {
        this.connectionPoolStats = { ...this.connectionPoolStats, ...stats };
    }
    getConnectionPoolRecommendations() {
        const recommendations = [];
        const stats = this.connectionPoolStats;
        if (stats.waitingRequests > 10) {
            recommendations.push('High number of waiting requests - consider increasing pool size');
        }
        if (stats.averageWaitTime > 1000) {
            recommendations.push('High average wait time - consider optimizing queries or increasing pool size');
        }
        if (stats.connectionErrors > 0) {
            recommendations.push('Connection errors detected - check network stability and database health');
        }
        const utilizationRate = stats.activeConnections / stats.totalConnections;
        if (utilizationRate > 0.9) {
            recommendations.push('High connection utilization - consider increasing pool size');
        }
        else if (utilizationRate < 0.3) {
            recommendations.push('Low connection utilization - consider reducing pool size');
        }
        return recommendations;
    }
    scheduleJob(type, payload, options = {}) {
        const jobId = this.generateJobId();
        const now = new Date();
        const scheduledAt = options.delay ?
            new Date(now.getTime() + options.delay) : now;
        const job = {
            id: jobId,
            type,
            priority: options.priority || 'medium',
            payload,
            createdAt: now,
            scheduledAt,
            status: 'pending',
            retryCount: 0,
            maxRetries: options.maxRetries || 3,
        };
        this.backgroundJobs.set(jobId, job);
        this.addToQueue(job);
        logger_1.default.info('Background job scheduled', {
            jobId,
            type,
            priority: job.priority,
            scheduledAt,
        });
        return jobId;
    }
    scheduleAIProcessing(requestId, inputData, priority = 'high') {
        return this.scheduleJob('ai_processing', {
            requestId,
            inputData,
        }, { priority });
    }
    scheduleDataAggregation(aggregationType, parameters, priority = 'low') {
        return this.scheduleJob('data_aggregation', {
            aggregationType,
            parameters,
        }, { priority });
    }
    scheduleCacheWarmup(cacheKeys, priority = 'medium') {
        return this.scheduleJob('cache_warmup', {
            cacheKeys,
        }, { priority });
    }
    getJobStatus(jobId) {
        return this.backgroundJobs.get(jobId) || null;
    }
    cancelJob(jobId) {
        const job = this.backgroundJobs.get(jobId);
        if (job && job.status === 'pending') {
            job.status = 'cancelled';
            this.backgroundJobs.set(jobId, job);
            this.jobQueue = this.jobQueue.filter(queuedJob => queuedJob.id !== jobId);
            logger_1.default.info('Background job cancelled', { jobId });
            return true;
        }
        return false;
    }
    addToQueue(job) {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const jobPriority = priorityOrder[job.priority];
        let insertIndex = this.jobQueue.length;
        for (let i = 0; i < this.jobQueue.length; i++) {
            const queuePriority = priorityOrder[this.jobQueue[i].priority];
            if (jobPriority < queuePriority) {
                insertIndex = i;
                break;
            }
        }
        this.jobQueue.splice(insertIndex, 0, job);
    }
    startBackgroundJobProcessor() {
        setInterval(async () => {
            if (!this.isProcessingJobs && this.jobQueue.length > 0) {
                await this.processNextJob();
            }
        }, 1000);
    }
    async processNextJob() {
        if (this.jobQueue.length === 0) {
            return;
        }
        this.isProcessingJobs = true;
        try {
            const job = this.jobQueue.shift();
            if (!job) {
                return;
            }
            if (job.scheduledAt > new Date()) {
                this.addToQueue(job);
                return;
            }
            await this.executeJob(job);
        }
        catch (error) {
            logger_1.default.error('Error in job processor', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        finally {
            this.isProcessingJobs = false;
        }
    }
    async executeJob(job) {
        job.status = 'running';
        job.startedAt = new Date();
        this.backgroundJobs.set(job.id, job);
        logger_1.default.info('Executing background job', {
            jobId: job.id,
            type: job.type,
            priority: job.priority,
        });
        try {
            switch (job.type) {
                case 'ai_processing':
                    await this.executeAIProcessingJob(job);
                    break;
                case 'data_aggregation':
                    await this.executeDataAggregationJob(job);
                    break;
                case 'cache_warmup':
                    await this.executeCacheWarmupJob(job);
                    break;
                case 'cleanup':
                    await this.executeCleanupJob(job);
                    break;
                case 'analytics':
                    await this.executeAnalyticsJob(job);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }
            job.status = 'completed';
            job.completedAt = new Date();
            job.progress = 100;
            logger_1.default.info('Background job completed', {
                jobId: job.id,
                type: job.type,
                duration: job.completedAt.getTime() - job.startedAt.getTime(),
            });
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.retryCount++;
            logger_1.default.error('Background job failed', {
                jobId: job.id,
                type: job.type,
                error: job.error,
                retryCount: job.retryCount,
            });
            if (job.retryCount < job.maxRetries) {
                job.status = 'pending';
                job.scheduledAt = new Date(Date.now() + (job.retryCount * 30000));
                this.addToQueue(job);
            }
        }
        this.backgroundJobs.set(job.id, job);
    }
    async executeAIProcessingJob(job) {
        const { requestId, inputData } = job.payload;
        job.progress = 25;
        await this.sleep(1000);
        job.progress = 50;
        await this.sleep(2000);
        job.progress = 75;
        await this.sleep(1000);
        const cacheKey = diagnosticCacheService_1.default.generateCacheKey('ai_result', inputData);
        await diagnosticCacheService_1.default.cacheAIResult(cacheKey, {
            requestId,
            processed: true,
            timestamp: new Date(),
        });
    }
    async executeDataAggregationJob(job) {
        const { aggregationType, parameters } = job.payload;
        logger_1.default.info('Executing data aggregation', {
            type: aggregationType,
            parameters,
        });
        await this.sleep(5000);
    }
    async executeCacheWarmupJob(job) {
        const { cacheKeys } = job.payload;
        for (let i = 0; i < cacheKeys.length; i++) {
            job.progress = Math.round((i / cacheKeys.length) * 100);
            await this.sleep(100);
        }
    }
    async executeCleanupJob(job) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        for (const [jobId, existingJob] of this.backgroundJobs.entries()) {
            if (existingJob.completedAt && existingJob.completedAt < cutoff) {
                this.backgroundJobs.delete(jobId);
            }
        }
        logger_1.default.info('Cleanup job completed');
    }
    async executeAnalyticsJob(job) {
        await this.sleep(3000);
        logger_1.default.info('Analytics job completed');
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000);
    }
    collectPerformanceMetrics() {
        const memoryUsage = process.memoryUsage();
        logger_1.default.debug('Performance metrics collected', {
            memoryUsage,
            connectionPool: this.connectionPoolStats,
            queryMetrics: this.queryMetrics,
            backgroundJobs: {
                total: this.backgroundJobs.size,
                queued: this.jobQueue.length,
            },
        });
    }
    getPerformanceMetrics() {
        const completedJobs = Array.from(this.backgroundJobs.values())
            .filter(job => job.status === 'completed');
        const failedJobs = Array.from(this.backgroundJobs.values())
            .filter(job => job.status === 'failed');
        const totalProcessingTime = completedJobs.reduce((sum, job) => {
            if (job.startedAt && job.completedAt) {
                return sum + (job.completedAt.getTime() - job.startedAt.getTime());
            }
            return sum;
        }, 0);
        return {
            queryPerformance: {
                averageQueryTime: this.queryMetrics.totalQueries > 0 ?
                    this.queryMetrics.totalQueryTime / this.queryMetrics.totalQueries : 0,
                slowQueries: this.queryMetrics.slowQueries,
                optimizedQueries: this.queryMetrics.optimizedQueries,
                cacheHitRate: diagnosticCacheService_1.default.getStats().hitRate,
            },
            connectionPool: this.connectionPoolStats,
            backgroundJobs: {
                totalJobs: this.backgroundJobs.size,
                completedJobs: completedJobs.length,
                failedJobs: failedJobs.length,
                averageProcessingTime: completedJobs.length > 0 ?
                    totalProcessingTime / completedJobs.length : 0,
            },
            memoryUsage: process.memoryUsage(),
        };
    }
    getPerformanceRecommendations() {
        const recommendations = [];
        const metrics = this.getPerformanceMetrics();
        if (metrics.queryPerformance.averageQueryTime > 1000) {
            recommendations.push('Average query time is high - consider query optimization');
        }
        if (metrics.queryPerformance.cacheHitRate < 0.5) {
            recommendations.push('Cache hit rate is low - consider cache tuning');
        }
        const memoryUsagePercent = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
        if (memoryUsagePercent > 0.8) {
            recommendations.push('High memory usage detected - consider memory optimization');
        }
        const jobFailureRate = metrics.backgroundJobs.failedJobs / metrics.backgroundJobs.totalJobs;
        if (jobFailureRate > 0.1) {
            recommendations.push('High background job failure rate - investigate job errors');
        }
        recommendations.push(...this.getConnectionPoolRecommendations());
        return recommendations;
    }
}
exports.default = new PerformanceOptimizationService();
//# sourceMappingURL=performanceOptimizationService.js.map