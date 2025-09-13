import { Request, Response, NextFunction } from 'express';
interface IntegrationHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime?: number;
    error?: string;
    dependencies?: string[];
}
interface SystemCompatibility {
    existingRoutes: string[];
    newRoutes: string[];
    conflicts: string[];
    migrations: string[];
}
export declare class SystemIntegrationService {
    private static instance;
    private healthChecks;
    private featureFlagService;
    private auditService;
    private constructor();
    static getInstance(): SystemIntegrationService;
    private initializeHealthChecks;
    checkSystemCompatibility(): Promise<SystemCompatibility>;
    validateIntegration(): Promise<{
        success: boolean;
        issues: string[];
        warnings: string[];
    }>;
    backwardCompatibilityMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    gradualRolloutMiddleware(): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    getIntegrationHealth(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        services: IntegrationHealth[];
        manualLabStatus: 'enabled' | 'disabled' | 'partial';
    }>;
    emergencyRollback(reason: string): Promise<{
        success: boolean;
        rollbackActions: string[];
        errors: string[];
    }>;
    private getExistingRoutes;
    private getManualLabRoutes;
    private detectRouteConflicts;
    private checkRequiredMigrations;
    private validateDatabaseSchema;
    private validateFHIRIntegration;
    private validateAuthenticationIntegration;
    private validateAuditIntegration;
    private isExistingRoute;
    private monitorRequestHealth;
    private startHealthCheckScheduler;
    private performHealthChecks;
    private checkServiceHealth;
}
export default SystemIntegrationService;
//# sourceMappingURL=systemIntegrationService.d.ts.map