import { IUser } from '../models/User';
import { WorkspaceContext, PermissionResult } from '../types/auth';
interface CompatibilityConfig {
    enableDynamicRBAC: boolean;
    enableLegacyFallback: boolean;
    enableDeprecationWarnings: boolean;
    migrationPhase: 'preparation' | 'migration' | 'validation' | 'cleanup';
    rolloutPercentage: number;
}
interface PermissionCheckMetrics {
    dynamicChecks: number;
    legacyChecks: number;
    fallbackUsage: number;
    errors: number;
    averageResponseTime: number;
}
export declare class BackwardCompatibilityService {
    private static instance;
    private config;
    private metrics;
    private legacyPermissionService;
    private dynamicPermissionService;
    private constructor();
    static getInstance(): BackwardCompatibilityService;
    initialize(): Promise<void>;
    checkPermission(context: WorkspaceContext, user: IUser, action: string, options?: {
        forceMethod?: 'dynamic' | 'legacy';
        enableMetrics?: boolean;
    }): Promise<PermissionResult & {
        source: string;
        responseTime?: number;
    }>;
    private checkDynamicPermission;
    private checkLegacyPermission;
    private determinePermissionMethod;
    private loadConfiguration;
    updateConfiguration(updates: Partial<CompatibilityConfig>): Promise<void>;
    getMetrics(): PermissionCheckMetrics & {
        config: CompatibilityConfig;
    };
    resetMetrics(): void;
    validatePermissionConsistency(context: WorkspaceContext, user: IUser, actions: string[]): Promise<{
        consistent: boolean;
        inconsistencies: Array<{
            action: string;
            dynamicResult: boolean;
            legacyResult: boolean;
            dynamicReason?: string;
            legacyReason?: string;
        }>;
    }>;
    generateMigrationReadinessReport(): Promise<{
        readyForMigration: boolean;
        issues: string[];
        recommendations: string[];
        statistics: {
            totalUsers: number;
            migratedUsers: number;
            usersWithDynamicRoles: number;
            usersWithDirectPermissions: number;
        };
    }>;
    private updateMetrics;
    private hashUserId;
    private logDeprecationWarning;
}
export default BackwardCompatibilityService;
//# sourceMappingURL=BackwardCompatibilityService.d.ts.map