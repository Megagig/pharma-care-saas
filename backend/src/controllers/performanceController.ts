import { Request, Response } from 'express';
import DynamicPermissionService from '../services/DynamicPermissionService';
import CacheManager from '../services/CacheManager';
import DatabaseOptimizationService from '../services/DatabaseOptimizationService';
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
}

export const performanceController = new PerformanceController();