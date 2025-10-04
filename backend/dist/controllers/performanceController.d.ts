import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class PerformanceController {
    private dynamicPermissionService;
    private cacheManager;
    private performanceCacheService;
    private dbOptimizationService;
    private performanceDatabaseOptimizer;
    private performanceJobService;
    constructor();
    getCacheMetrics(req: AuthRequest, res: Response): Promise<any>;
    getDatabaseReport(req: AuthRequest, res: Response): Promise<any>;
    getQueryStats(req: AuthRequest, res: Response): Promise<any>;
    checkCacheConsistency(req: AuthRequest, res: Response): Promise<any>;
    initializeDatabaseOptimizations(req: AuthRequest, res: Response): Promise<any>;
    clearCache(req: AuthRequest, res: Response): Promise<any>;
    warmCache(req: AuthRequest, res: Response): Promise<any>;
    getPerformanceOverview(req: AuthRequest, res: Response): Promise<any>;
    getLatencyMetrics(req: AuthRequest, res: Response): Promise<any>;
    getDatabaseProfile(req: AuthRequest, res: Response): Promise<any>;
    enableDatabaseProfiling(req: AuthRequest, res: Response): Promise<any>;
    disableDatabaseProfiling(req: AuthRequest, res: Response): Promise<any>;
    optimizeDatabaseIndexes(req: AuthRequest, res: Response): Promise<any>;
    invalidateCacheByTags(req: AuthRequest, res: Response): Promise<any>;
    getPerformanceCacheStats(req: AuthRequest, res: Response): Promise<any>;
    warmPerformanceCache(req: AuthRequest, res: Response): Promise<any>;
    createOptimizedIndexes(req: AuthRequest, res: Response): Promise<any>;
    analyzeExistingIndexes(req: AuthRequest, res: Response): Promise<any>;
    cleanupUnusedIndexes(req: AuthRequest, res: Response): Promise<any>;
    queueAIAnalysisJob(req: AuthRequest, res: Response): Promise<any>;
    queueDataExportJob(req: AuthRequest, res: Response): Promise<any>;
    queueCacheWarmupJob(req: AuthRequest, res: Response): Promise<any>;
    queueDatabaseMaintenanceJob(req: AuthRequest, res: Response): Promise<any>;
    getJobStatistics(req: AuthRequest, res: Response): Promise<any>;
}
export declare const performanceController: PerformanceController;
//# sourceMappingURL=performanceController.d.ts.map