#!/usr/bin/env ts-node
interface ValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    summary: {
        totalWorkspaces: number;
        workspacesWithSubscriptions: number;
        orphanedSubscriptions: number;
        invalidSubscriptionReferences: number;
        usersWithInvalidWorkspaces: number;
    };
}
declare class MigrationIntegrityValidator {
    private errors;
    private warnings;
    validateIntegrity(): Promise<ValidationResult>;
    private validateWorkspaceSubscriptions;
    private validateSubscriptionReferences;
    private validateUserWorkspaceReferences;
    private validateSubscriptionPlans;
}
export default MigrationIntegrityValidator;
//# sourceMappingURL=validateMigrationIntegrity.d.ts.map