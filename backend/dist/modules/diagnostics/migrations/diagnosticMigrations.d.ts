export interface MigrationResult {
    success: boolean;
    migrationName: string;
    executionTime: number;
    details: any;
    error?: string;
}
export interface MigrationStatus {
    migrationName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    executedAt?: Date;
    executionTime?: number;
    version: string;
}
declare class DiagnosticMigrations {
    private migrationHistory;
    runMigrations(): Promise<MigrationResult[]>;
    private createDiagnosticCollections;
    private createIndexes;
    private migrateExistingData;
    private setupFeatureFlags;
    private initializeCache;
    private migratePatientData;
    private migrateClinicalNotes;
    private migrateUserPermissions;
    private migrateWorkplaceSettings;
    private warmupDrugInteractionCache;
    private warmupLabReferenceCache;
    private warmupFHIRMappingCache;
    private generateIndexName;
    private updateMigrationStatus;
    getMigrationStatus(): MigrationStatus[];
    checkMigrationNeeded(): Promise<{
        needed: boolean;
        pendingMigrations: string[];
        completedMigrations: string[];
    }>;
    rollbackMigration(migrationName: string): Promise<MigrationResult>;
    validateMigrationIntegrity(): Promise<{
        valid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    getMigrationStatistics(): {
        totalMigrations: number;
        completedMigrations: number;
        failedMigrations: number;
        pendingMigrations: number;
        lastMigrationTime?: Date;
        averageExecutionTime: number;
    };
    private sleep;
}
declare const _default: DiagnosticMigrations;
export default _default;
//# sourceMappingURL=diagnosticMigrations.d.ts.map