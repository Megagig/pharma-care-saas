import { Db } from 'mongodb';
export interface MigrationResult {
    success: boolean;
    message: string;
    details?: any;
}
export declare function migration001_createManualLabCollections(db: Db): Promise<MigrationResult>;
export declare function migration002_createManualLabIndexes(db: Db): Promise<MigrationResult>;
export declare function migration003_createTestCatalog(db: Db): Promise<MigrationResult>;
export declare function migration004_addFeatureFlags(db: Db): Promise<MigrationResult>;
export declare function runAllManualLabMigrations(db: Db): Promise<MigrationResult[]>;
export declare function rollbackManualLabMigrations(db: Db): Promise<MigrationResult>;
export declare function validateManualLabSetup(db: Db): Promise<MigrationResult>;
//# sourceMappingURL=manualLabMigrations.d.ts.map