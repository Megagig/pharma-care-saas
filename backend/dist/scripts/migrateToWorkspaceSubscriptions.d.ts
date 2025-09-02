interface MigrationResult {
    success: boolean;
    workspacesCreated: number;
    subscriptionsMigrated: number;
    usersUpdated: number;
    errors: string[];
}
export declare function migrateToWorkspaceSubscriptions(): Promise<MigrationResult>;
export declare function rollbackWorkspaceMigration(): Promise<MigrationResult>;
export declare function validateMigration(): Promise<{
    valid: boolean;
    issues: string[];
    stats: {
        totalUsers: number;
        usersWithWorkspace: number;
        workspacesWithSubscription: number;
        orphanedSubscriptions: number;
    };
}>;
export {};
//# sourceMappingURL=migrateToWorkspaceSubscriptions.d.ts.map