export interface Migration {
    version: string;
    description: string;
    up: () => Promise<void>;
    down: () => Promise<void>;
}
export interface MigrationRecord {
    version: string;
    description: string;
    appliedAt: Date;
    executionTime: number;
}
export declare const clinicalInterventionMigrations: Migration[];
export declare class MigrationManager {
    static getAppliedMigrations(): Promise<MigrationRecord[]>;
    static getPendingMigrations(): Promise<Migration[]>;
    static applyMigration(migration: Migration): Promise<void>;
    static rollbackMigration(version: string): Promise<void>;
    static applyPendingMigrations(): Promise<void>;
    static getMigrationStatus(): Promise<{
        applied: MigrationRecord[];
        pending: Migration[];
        total: number;
    }>;
    static validateMigrations(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
}
export declare const runMigrations: (command: string, version?: string) => Promise<void>;
//# sourceMappingURL=clinicalInterventionMigrations.d.ts.map