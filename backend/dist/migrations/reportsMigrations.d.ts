export interface MigrationResult {
    success: boolean;
    message: string;
    details?: any;
}
export declare const createReportsIndexes: () => Promise<MigrationResult>;
export declare const createDefaultReportTemplates: (workplaceId: string, userId: string) => Promise<MigrationResult>;
export declare const migrateExistingReportData: () => Promise<MigrationResult>;
export declare const validateDataIntegrity: () => Promise<MigrationResult>;
export declare const runAllReportsMigrations: (workplaceId?: string, userId?: string) => Promise<MigrationResult>;
export declare const rollbackReportsMigrations: () => Promise<MigrationResult>;
//# sourceMappingURL=reportsMigrations.d.ts.map