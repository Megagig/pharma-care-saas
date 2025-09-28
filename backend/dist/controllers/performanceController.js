"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceController = exports.PerformanceController = void 0;
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const CacheManager_1 = __importDefault(require("../services/CacheManager"));
const PerformanceCacheService_1 = __importDefault(require("../services/PerformanceCacheService"));
const DatabaseOptimizationService_1 = __importDefault(require("../services/DatabaseOptimizationService"));
const PerformanceDatabaseOptimizer_1 = __importDefault(require("../services/PerformanceDatabaseOptimizer"));
const PerformanceJobService_1 = __importDefault(require("../services/PerformanceJobService"));
const DatabaseProfiler_1 = __importDefault(require("../services/DatabaseProfiler"));
const latencyMeasurement_1 = require("../middlewares/latencyMeasurement");
const logger_1 = __importDefault(require("../utils/logger"));
class PerformanceController {
    constructor() {
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
        this.cacheManager = CacheManager_1.default.getInstance();
        this.performanceCacheService = PerformanceCacheService_1.default.getInstance();
        this.dbOptimizationService = DatabaseOptimizationService_1.default.getInstance();
        this.performanceDatabaseOptimizer = PerformanceDatabaseOptimizer_1.default.getInstance();
        this.performanceJobService = PerformanceJobService_1.default.getInstance();
    }
    async getCacheMetrics(req, res) {
        try {
            const [rbacMetrics, performanceMetrics] = await Promise.all([
                this.cacheManager.getMetrics(),
                this.performanceCacheService.getStats()
            ]);
            res.json({
                success: true,
                data: {
                    rbacCache: rbacMetrics,
                    performanceCache: performanceMetrics,
                    combined: {
                        totalHits: rbacMetrics.hits + performanceMetrics.hits,
                        totalMisses: rbacMetrics.misses + performanceMetrics.misses,
                        overallHitRate: ((rbacMetrics.hits + performanceMetrics.hits) /
                            (rbacMetrics.totalOperations + performanceMetrics.hits + performanceMetrics.misses)) * 100,
                        totalMemoryUsage: rbacMetrics.memoryUsage + performanceMetrics.memoryUsage,
                        totalKeys: rbacMetrics.keyCount + performanceMetrics.keyCount
                    },
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting cache metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving cache metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getDatabaseReport(req, res) {
        try {
            const report = await this.dbOptimizationService.analyzeQueryPerformance();
            res.json({
                success: true,
                data: report
            });
        }
        catch (error) {
            logger_1.default.error('Error getting database report:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving database optimization report',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getQueryStats(req, res) {
        try {
            const stats = this.dbOptimizationService.getQueryStats();
            res.json({
                success: true,
                data: {
                    stats,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting query stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving query statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async checkCacheConsistency(req, res) {
        try {
            const result = await this.dynamicPermissionService.checkCacheConsistency();
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Error checking cache consistency:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking cache consistency',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async initializeDatabaseOptimizations(req, res) {
        try {
            await this.dynamicPermissionService.initializeDatabaseOptimizations();
            res.json({
                success: true,
                message: 'Database optimizations initialized successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error initializing database optimizations:', error);
            res.status(500).json({
                success: false,
                message: 'Error initializing database optimizations',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async clearCache(req, res) {
        try {
            const { type } = req.body;
            if (type === 'rbac') {
                await this.cacheManager.clearAll();
            }
            else if (type === 'performance') {
                await this.performanceCacheService.clearAll();
            }
            else {
                await Promise.all([
                    this.cacheManager.clearAll(),
                    this.performanceCacheService.clearAll()
                ]);
            }
            res.json({
                success: true,
                message: `Cache cleared successfully${type ? ` (${type})` : ' (all)'}`
            });
        }
        catch (error) {
            logger_1.default.error('Error clearing cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error clearing cache',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async warmCache(req, res) {
        try {
            const { userIds, roleIds, commonActions, workspaceId } = req.body;
            await this.dynamicPermissionService.warmPermissionCache({
                userIds,
                roleIds,
                commonActions,
                workspaceId
            });
            res.json({
                success: true,
                message: 'Cache warming initiated successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error warming cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error warming cache',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getPerformanceOverview(req, res) {
        try {
            const [cacheMetrics, queryStats, dbReport] = await Promise.all([
                this.cacheManager.getMetrics(),
                this.dbOptimizationService.getQueryStats(),
                this.dbOptimizationService.analyzeQueryPerformance()
            ]);
            const overview = {
                cache: {
                    hitRate: cacheMetrics.hitRate,
                    totalOperations: cacheMetrics.totalOperations,
                    memoryUsage: cacheMetrics.memoryUsage,
                    keyCount: cacheMetrics.keyCount
                },
                queries: {
                    totalQueries: queryStats.totalQueries,
                    slowQueries: queryStats.slowQueries,
                    averageExecutionTime: queryStats.averageExecutionTime,
                    indexUsageRate: queryStats.indexUsageRate
                },
                database: {
                    slowQueriesCount: dbReport.slowQueries.length,
                    recommendationsCount: dbReport.indexRecommendations.length,
                    highPriorityRecommendations: dbReport.indexRecommendations.filter(r => r.priority === 'high').length
                },
                timestamp: new Date()
            };
            res.json({
                success: true,
                data: overview
            });
        }
        catch (error) {
            logger_1.default.error('Error getting performance overview:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving performance overview',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getLatencyMetrics(req, res) {
        try {
            const { endpoint } = req.query;
            const stats = latencyMeasurement_1.latencyTracker.getStats(endpoint);
            const topEndpoints = latencyMeasurement_1.latencyTracker.getTopEndpoints(10);
            const recentMetrics = latencyMeasurement_1.latencyTracker.getMetrics(endpoint, 100);
            res.json({
                success: true,
                data: {
                    stats,
                    topEndpoints,
                    recentMetrics,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting latency metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving latency metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getDatabaseProfile(req, res) {
        try {
            const stats = await DatabaseProfiler_1.default.getDatabaseStats();
            const slowQueries = DatabaseProfiler_1.default.getSlowQueries(50);
            const queryAnalysis = await DatabaseProfiler_1.default.analyzeSlowQueries();
            res.json({
                success: true,
                data: {
                    stats,
                    slowQueries,
                    queryAnalysis,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting database profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving database profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async enableDatabaseProfiling(req, res) {
        try {
            const { slowMs = 100 } = req.body;
            await DatabaseProfiler_1.default.enableProfiling(slowMs);
            res.json({
                success: true,
                message: `Database profiling enabled for operations slower than ${slowMs}ms`,
                timestamp: new Date()
            });
        }
        catch (error) {
            logger_1.default.error('Error enabling database profiling:', error);
            res.status(500).json({
                success: false,
                message: 'Error enabling database profiling',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async disableDatabaseProfiling(req, res) {
        try {
            await DatabaseProfiler_1.default.disableProfiling();
            res.json({
                success: true,
                message: 'Database profiling disabled',
                timestamp: new Date()
            });
        }
        catch (error) {
            logger_1.default.error('Error disabling database profiling:', error);
            res.status(500).json({
                success: false,
                message: 'Error disabling database profiling',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async optimizeDatabaseIndexes(req, res) {
        try {
            await DatabaseProfiler_1.default.createOptimalIndexes();
            res.json({
                success: true,
                message: 'Database indexes optimized successfully',
                timestamp: new Date()
            });
        }
        catch (error) {
            logger_1.default.error('Error optimizing database indexes:', error);
            res.status(500).json({
                success: false,
                message: 'Error optimizing database indexes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async invalidateCacheByTags(req, res) {
        try {
            const { tags } = req.body;
            if (!tags || !Array.isArray(tags)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tags array is required'
                });
            }
            const deletedCount = await this.performanceCacheService.invalidateByTags(tags);
            res.json({
                success: true,
                message: `Invalidated ${deletedCount} cache entries`,
                data: {
                    deletedCount,
                    tags
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error invalidating cache by tags:', error);
            res.status(500).json({
                success: false,
                message: 'Error invalidating cache',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getPerformanceCacheStats(req, res) {
        try {
            const stats = await this.performanceCacheService.getStats();
            res.json({
                success: true,
                data: {
                    stats,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting performance cache stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving performance cache statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async warmPerformanceCache(req, res) {
        try {
            const { operations = [] } = req.body;
            logger_1.default.info('Performance cache warming requested for operations:', operations);
            res.json({
                success: true,
                message: 'Performance cache warming initiated',
                data: {
                    operations,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error warming performance cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error warming performance cache',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async createOptimizedIndexes(req, res) {
        try {
            logger_1.default.info('Creating optimized database indexes');
            const result = await this.performanceDatabaseOptimizer.createAllOptimizedIndexes();
            res.json({
                success: true,
                message: 'Database indexes optimization completed',
                data: {
                    totalIndexes: result.totalIndexes,
                    successfulIndexes: result.successfulIndexes,
                    failedIndexes: result.failedIndexes,
                    executionTime: result.executionTime,
                    timestamp: result.timestamp,
                    summary: result.results.reduce((acc, r) => {
                        if (!acc[r.collection]) {
                            acc[r.collection] = { attempted: 0, created: 0, failed: 0 };
                        }
                        acc[r.collection].attempted++;
                        if (r.created) {
                            acc[r.collection].created++;
                        }
                        else {
                            acc[r.collection].failed++;
                        }
                        return acc;
                    }, {})
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error creating optimized indexes:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating optimized database indexes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async analyzeExistingIndexes(req, res) {
        try {
            const analysis = await this.performanceDatabaseOptimizer.analyzeExistingIndexes();
            res.json({
                success: true,
                data: {
                    analysis,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error analyzing existing indexes:', error);
            res.status(500).json({
                success: false,
                message: 'Error analyzing existing database indexes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async cleanupUnusedIndexes(req, res) {
        try {
            const { dryRun = true } = req.body;
            const result = await this.performanceDatabaseOptimizer.dropUnusedIndexes(dryRun);
            res.json({
                success: true,
                message: dryRun ? 'Unused indexes analysis completed' : 'Unused indexes cleanup completed',
                data: {
                    droppedIndexes: result.droppedIndexes,
                    errors: result.errors,
                    dryRun,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error cleaning up unused indexes:', error);
            res.status(500).json({
                success: false,
                message: 'Error cleaning up unused database indexes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async queueAIAnalysisJob(req, res) {
        try {
            const { type, patientId, parameters, priority = 'medium' } = req.body;
            if (!type || !patientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Type and patientId are required'
                });
            }
            const job = await this.performanceJobService.queueAIAnalysis({
                type,
                patientId,
                workspaceId: req.user?.workplaceId?.toString() || '',
                userId: req.user?.id?.toString() || '',
                parameters: parameters || {},
                priority,
            });
            res.json({
                success: true,
                message: 'AI analysis job queued successfully',
                data: {
                    jobId: job.id,
                    type,
                    priority,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error queuing AI analysis job:', error);
            res.status(500).json({
                success: false,
                message: 'Error queuing AI analysis job',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async queueDataExportJob(req, res) {
        try {
            const { type, filters, format, fileName, includeAttachments = false } = req.body;
            if (!type || !format || !fileName) {
                return res.status(400).json({
                    success: false,
                    message: 'Type, format, and fileName are required'
                });
            }
            const job = await this.performanceJobService.queueDataExport({
                type,
                workspaceId: req.user?.workplaceId?.toString() || '',
                userId: req.user?.id?.toString() || '',
                userEmail: req.user?.email || '',
                filters: filters || {},
                format,
                fileName,
                includeAttachments,
            });
            res.json({
                success: true,
                message: 'Data export job queued successfully',
                data: {
                    jobId: job.id,
                    type,
                    format,
                    fileName,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error queuing data export job:', error);
            res.status(500).json({
                success: false,
                message: 'Error queuing data export job',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async queueCacheWarmupJob(req, res) {
        try {
            const { type, targetUsers, priority = 'low' } = req.body;
            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: 'Type is required'
                });
            }
            const job = await this.performanceJobService.queueCacheWarmup({
                type,
                workspaceId: req.user?.workplaceId?.toString() || '',
                targetUsers,
                priority,
            });
            res.json({
                success: true,
                message: 'Cache warmup job queued successfully',
                data: {
                    jobId: job.id,
                    type,
                    priority,
                    targetUsers: targetUsers?.length || 'all',
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error queuing cache warmup job:', error);
            res.status(500).json({
                success: false,
                message: 'Error queuing cache warmup job',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async queueDatabaseMaintenanceJob(req, res) {
        try {
            const { type, parameters = {} } = req.body;
            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: 'Type is required'
                });
            }
            const job = await this.performanceJobService.queueDatabaseMaintenance({
                type,
                workspaceId: req.user?.workplaceId?.toString(),
                parameters,
            });
            res.json({
                success: true,
                message: 'Database maintenance job queued successfully',
                data: {
                    jobId: job.id,
                    type,
                    parameters: Object.keys(parameters),
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error queuing database maintenance job:', error);
            res.status(500).json({
                success: false,
                message: 'Error queuing database maintenance job',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getJobStatistics(req, res) {
        try {
            const statistics = await this.performanceJobService.getJobStatistics();
            res.json({
                success: true,
                data: {
                    statistics,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting job statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving job statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}
exports.PerformanceController = PerformanceController;
exports.performanceController = new PerformanceController();
//# sourceMappingURL=performanceController.js.map