import { Request, Response } from 'express';
import DynamicPermissionService from '../services/DynamicPermissionService';
import CacheManager from '../services/CacheManager';
import DatabaseOptimizationService from '../services/DatabaseOptimizationService';
import DatabaseProfiler from '../services/DatabaseProfiler';
import { latencyTracker } from '../middlewares/latencyMeasurement';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';

export class PerformanceController {
    private dynamicPermissionService: DynamicPermissionService;
    private cacheManager: CacheManager;
    private dbOptimizationService: DatabaseOptimizationService;

    constructor() {
        this.dynamicPermissionService = DynamicPermissionService.getInstance();
        this.cacheManager = CacheManager.getInstance();
        this.dbOptimizationService = DatabaseOptimizationService.getInstance();
    }

    /**
     * Get cache performance metrics
     * GET /api/admin/performance/cache
     */
    async getCacheMetrics(req: AuthRequest, res: Response): Promise<any> {
        try {
            const metrics = await this.cacheManager.getMetrics();

            res.json({
                success: true,
                data: {
                    metrics,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            logger.error('Error getting cache metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving cache metrics',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Get database optimization report
     * GET /api/admin/performance/database
     */
    async getDatabaseReport(req: AuthRequest, res: Response): Promise<any> {
        try {
            const report = await this.dbOptimizationService.analyzeQueryPerformance();

            res.json({
                success: true,
                data: report
            });

        } catch (error) {
            logger.error('Error getting database report:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving database optimization report',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Get query performance statistics
     * GET /api/admin/performance/queries
     */
    async getQueryStats(req: AuthRequest, res: Response): Promise<any> {
        try {
            const stats = this.dbOptimizationService.getQueryStats();

            res.json({
                success: true,
                data: {
                    stats,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            logger.error('Error getting query stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving query statistics',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Check cache consistency
     * POST /api/admin/performance/cache/check
     */
    async checkCacheConsistency(req: AuthRequest, res: Response): Promise<any> {
        try {
            const result = await this.dynamicPermissionService.checkCacheConsistency();

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            logger.error('Error checking cache consistency:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking cache consistency',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Initialize database optimizations
     * POST /api/admin/performance/database/optimize
     */
    async initializeDatabaseOptimizations(req: AuthRequest, res: Response): Promise<any> {
        try {
            await this.dynamicPermissionService.initializeDatabaseOptimizations();

            res.json({
                success: true,
                message: 'Database optimizations initialized successfully'
            });

        } catch (error) {
            logger.error('Error initializing database optimizations:', error);
            res.status(500).json({
                success: false,
                message: 'Error initializing database optimizations',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Clear cache
     * POST /api/admin/performance/cache/clear
     */
    async clearCache(req: AuthRequest, res: Response): Promise<any> {
        try {
            await this.cacheManager.clearAll();

            res.json({
                success: true,
                message: 'Cache cleared successfully'
            });

        } catch (error) {
            logger.error('Error clearing cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error clearing cache',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Warm cache for specific users/roles
     * POST /api/admin/performance/cache/warm
     */
    async warmCache(req: AuthRequest, res: Response): Promise<any> {
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

        } catch (error) {
            logger.error('Error warming cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error warming cache',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Get comprehensive performance overview
     * GET /api/admin/performance/overview
     */
    async getPerformanceOverview(req: AuthRequest, res: Response): Promise<any> {
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

        } catch (error) {
            logger.error('Error getting performance overview:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving performance overview',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Get API latency metrics
     * GET /api/admin/performance/latency
     */
    async getLatencyMetrics(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { endpoint } = req.query;
            
            const stats = latencyTracker.getStats(endpoint as string);
            const topEndpoints = latencyTracker.getTopEndpoints(10);
            const recentMetrics = latencyTracker.getMetrics(endpoint as string, 100);

            res.json({
                success: true,
                data: {
                    stats,
                    topEndpoints,
                    recentMetrics,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            logger.error('Error getting latency metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving latency metrics',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Get database profiling data
     * GET /api/admin/performance/database/profile
     */
    async getDatabaseProfile(req: AuthRequest, res: Response): Promise<any> {
        try {
            const stats = await DatabaseProfiler.getDatabaseStats();
            const slowQueries = DatabaseProfiler.getSlowQueries(50);
            const queryAnalysis = await DatabaseProfiler.analyzeSlowQueries();

            res.json({
                success: true,
                data: {
                    stats,
                    slowQueries,
                    queryAnalysis,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            logger.error('Error getting database profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving database profile',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Enable database profiling
     * POST /api/admin/performance/database/profiling/enable
     */
    async enableDatabaseProfiling(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { slowMs = 100 } = req.body;
            
            await DatabaseProfiler.enableProfiling(slowMs);

            res.json({
                success: true,
                message: `Database profiling enabled for operations slower than ${slowMs}ms`,
                timestamp: new Date()
            });

        } catch (error) {
            logger.error('Error enabling database profiling:', error);
            res.status(500).json({
                success: false,
                message: 'Error enabling database profiling',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Disable database profiling
     * POST /api/admin/performance/database/profiling/disable
     */
    async disableDatabaseProfiling(req: AuthRequest, res: Response): Promise<any> {
        try {
            await DatabaseProfiler.disableProfiling();

            res.json({
                success: true,
                message: 'Database profiling disabled',
                timestamp: new Date()
            });

        } catch (error) {
            logger.error('Error disabling database profiling:', error);
            res.status(500).json({
                success: false,
                message: 'Error disabling database profiling',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    /**
     * Create optimal database indexes
     * POST /api/admin/performance/database/indexes/optimize
     */
    async optimizeDatabaseIndexes(req: AuthRequest, res: Response): Promise<any> {
        try {
            await DatabaseProfiler.createOptimalIndexes();

            res.json({
                success: true,
                message: 'Database indexes optimized successfully',
                timestamp: new Date()
            });

        } catch (error) {
            logger.error('Error optimizing database indexes:', error);
            res.status(500).json({
                success: false,
                message: 'Error optimizing database indexes',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }
}

export const performanceController = new PerformanceController();