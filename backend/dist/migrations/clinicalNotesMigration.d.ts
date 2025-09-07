interface MigrationResult {
    success: boolean;
    message: string;
    migratedCount?: number;
    errors?: string[];
}
declare class ClinicalNotesMigration {
    private static instance;
    private migrationVersion;
    static getInstance(): ClinicalNotesMigration;
    runMigrations(): Promise<MigrationResult>;
    private createIndexes;
    private migrateExistingNotes;
    private addAuditFields;
    private setupTextIndexes;
    private validateDataIntegrity;
    rollbackMigrations(): Promise<MigrationResult>;
    getMigrationStatus(): Promise<{
        version: string;
        totalNotes: number;
        activeNotes: number;
        deletedNotes: number;
        indexesCount: number;
        lastMigration?: Date;
    }>;
}
export default ClinicalNotesMigration;
export declare const runClinicalNotesMigrations: () => Promise<MigrationResult>;
export declare const rollbackClinicalNotesMigrations: () => Promise<MigrationResult>;
export declare const getClinicalNotesMigrationStatus: () => Promise<{
    version: string;
    totalNotes: number;
    activeNotes: number;
    deletedNotes: number;
    indexesCount: number;
    lastMigration?: Date;
}>;
//# sourceMappingURL=clinicalNotesMigration.d.ts.map