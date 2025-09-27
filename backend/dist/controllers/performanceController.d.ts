import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare class PerformanceController {
    private dynamicPermissionService;
    private cacheManager;
    private dbOptimizationService;
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
}
export declare const performanceController: PerformanceController;
//# sourceMappingURL=performanceController.d.ts.map