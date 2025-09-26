interface MigrationConfig {
    enableGradualRollout: boolean;
    rolloutPercentage: number;
    enableValidation: boolean;
    enableBackup: boolean;
    skipUserMigration: boolean;
    dryRun: boolean;
}
interface MigrationResult {
    success: boolean;
    phase: string;
    duration: number;
    errors: string[];
    warnings: string[];
    statistics: {
        rolesCreated: number;
        permissionsCreated: number;
        usersMigrated: number;
        validationErrors: number;
    };
}
export declare class RBACMigrationOrchestrator {
    private config;
    private compatibilityService;
    constructor(config?: Partial<MigrationConfig>);
    executeMigration(): Promise<MigrationResult>;
    private initializeMigration;
    private setupGradualRollout;
    private activateDynamicRBAC;
    private createBackup;
    private setMigrationPhase;
    private gatherMigrationStatistics;
    rollbackMigration(): Promise<void>;
    getMigrationStatus(): Promise<{
        phase: string;
        isActive: boolean;
        rolloutPercentage: number;
        statistics: any;
    }>;
    updateRolloutPercentage(percentage: number): Promise<void>;
    completeMigration(): Promise<void>;
}
export declare function executeRBACMigration(config?: Partial<MigrationConfig>): Promise<MigrationResult>;
export declare function rollbackRBACMigration(): Promise<void>;
export {};
//# sourceMappingURL=migration-orchestrator.d.ts.map