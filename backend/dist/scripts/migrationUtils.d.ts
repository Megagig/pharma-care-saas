export interface BatchMigrationOptions {
    batchSize: number;
    delayBetweenBatches: number;
    dryRun: boolean;
}
export interface MigrationProgress {
    totalItems: number;
    processedItems: number;
    successfulItems: number;
    failedItems: number;
    currentBatch: number;
    totalBatches: number;
    errors: Array<{
        itemId: string;
        error: string;
        timestamp: Date;
    }>;
}
export declare class BatchMigrationProcessor {
    private options;
    private progress;
    constructor(options?: Partial<BatchMigrationOptions>);
    processUserMigration(processor: (user: any) => Promise<void>): Promise<MigrationProgress>;
    getProgress(): MigrationProgress;
}
export declare class MigrationIntegrityChecker {
    checkOrphanedRecords(): Promise<{
        orphanedUsers: number;
        orphanedSubscriptions: number;
        workspacesWithoutOwners: number;
        issues: string[];
    }>;
    checkDataConsistency(): Promise<{
        inconsistencies: Array<{
            type: string;
            description: string;
            count: number;
        }>;
        isConsistent: boolean;
    }>;
}
export declare class MigrationProgressTracker {
    private progressFile;
    constructor(migrationName: string);
    saveProgress(progress: MigrationProgress): Promise<void>;
    loadProgress(): Promise<MigrationProgress | null>;
    cleanup(): Promise<void>;
}
export declare class MigrationRollbackManager {
    private backupData;
    backupDocument(collection: string, documentId: string, document: any): Promise<void>;
    restoreDocument(collection: string, documentId: string): Promise<boolean>;
    getBackupStats(): {
        totalBackups: number;
        backupsByCollection: Record<string, number>;
    };
    clearBackups(): void;
}
//# sourceMappingURL=migrationUtils.d.ts.map