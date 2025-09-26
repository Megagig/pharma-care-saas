interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    statistics: ValidationStatistics;
}
interface ValidationError {
    type: 'critical' | 'major' | 'minor';
    category: string;
    message: string;
    affectedRecords?: any[];
    suggestedFix?: string;
}
interface ValidationWarning {
    category: string;
    message: string;
    affectedRecords?: any[];
    recommendation?: string;
}
interface ValidationStatistics {
    totalUsers: number;
    migratedUsers: number;
    totalRoles: number;
    totalPermissions: number;
    totalRoleAssignments: number;
    totalRolePermissions: number;
    orphanedRecords: number;
    inconsistentPermissions: number;
}
interface RollbackPlan {
    canRollback: boolean;
    steps: RollbackStep[];
    estimatedDuration: number;
    risks: string[];
    backupRequired: boolean;
}
interface RollbackStep {
    order: number;
    description: string;
    action: string;
    estimatedTime: number;
    reversible: boolean;
}
export declare class MigrationValidator {
    private compatibilityService;
    constructor();
    validateMigration(): Promise<ValidationResult>;
    private validateDataIntegrity;
    private validatePermissionConsistency;
    private validateRoleHierarchy;
    private validateUserMigration;
    private validatePerformance;
    private validateSecurity;
    private gatherStatistics;
    private buildWorkspaceContext;
}
export declare class MigrationRollback {
    generateRollbackPlan(): Promise<RollbackPlan>;
    executeRollback(plan: RollbackPlan): Promise<void>;
    private executeRollbackStep;
    private backupDynamicData;
    private disableDynamicRBAC;
    private clearUserDynamicRoles;
    private removeUserRoles;
    private removeRolePermissions;
    private removeDynamicRoles;
    private removeDynamicPermissions;
    private validateLegacyRBAC;
}
export declare function validateMigration(): Promise<ValidationResult>;
export declare function rollbackMigration(): Promise<void>;
export {};
//# sourceMappingURL=003-migration-validation-rollback.d.ts.map