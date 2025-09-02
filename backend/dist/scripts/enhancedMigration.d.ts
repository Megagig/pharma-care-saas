import { BatchMigrationOptions } from './migrationUtils';
export interface EnhancedMigrationOptions extends Partial<BatchMigrationOptions> {
    enableBackup: boolean;
    enableProgressTracking: boolean;
    enableIntegrityChecks: boolean;
    continueOnError: boolean;
}
export declare class EnhancedMigrationOrchestrator {
    private options;
    private progressTracker;
    private rollbackManager;
    private integrityChecker;
    constructor(options?: Partial<EnhancedMigrationOptions>);
    executeMigration(): Promise<{
        success: boolean;
        results: any;
        integrityCheck?: any;
        backupStats?: any;
    }>;
    executeRollback(): Promise<{
        success: boolean;
        results: any;
        integrityCheck?: any;
    }>;
    dryRun(): Promise<{
        estimatedChanges: any;
        integrityCheck: any;
        issues: string[];
    }>;
}
//# sourceMappingURL=enhancedMigration.d.ts.map