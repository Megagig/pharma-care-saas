import mongoose from 'mongoose';
export interface MigrationResult {
    success: boolean;
    message: string;
    details?: any;
}
export declare function createManualLabIndexes(): Promise<MigrationResult>;
export declare function seedDefaultTestCatalog(workplaceId: mongoose.Types.ObjectId, createdBy: mongoose.Types.ObjectId): Promise<MigrationResult>;
export declare function runManualLabMigrations(workplaceId?: mongoose.Types.ObjectId, createdBy?: mongoose.Types.ObjectId): Promise<MigrationResult[]>;
export declare function dropManualLabIndexes(): Promise<MigrationResult>;
//# sourceMappingURL=manualLabMigrations.d.ts.map