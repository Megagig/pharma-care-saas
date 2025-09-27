"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceController = exports.PerformanceController = void 0;
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const CacheManager_1 = __importDefault(require("../services/CacheManager"));
const DatabaseOptimizationService_1 = __importDefault(require("../services/DatabaseOptimizationService"));
const DatabaseProfiler_1 = __importDefault(require("../services/DatabaseProfiler"));
const latencyMeasurement_1 = require("../middlewares/latencyMeasurement");
const logger_1 = __importDefault(require("../utils/logger"));
class PerformanceController {
    constructor() {
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
        this.cacheManager = CacheManager_1.default.getInstance();
        this.dbOptimizationService = DatabaseOptimizationService_1.default.getInstance();
    }
    async getCacheMetrics(req, res) {
        try {
            const metrics = await this.cacheManager.getMetrics();
            res.json({
                success: true,
                data: {
                    metrics,
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
            await this.cacheManager.clearAll();
            res.json({
                success: true,
                message: 'Cache cleared successfully'
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
}
exports.PerformanceController = PerformanceController;
exports.performanceController = new PerformanceController();
//# sourceMappingURL=performanceController.js.map