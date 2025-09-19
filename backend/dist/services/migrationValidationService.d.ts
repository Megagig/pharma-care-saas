export interface ValidationResult {
    isValid: boolean;
    score: number;
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    stats: ValidationStats;
    recommendations: string[];
}
export interface ValidationIssue {
    type: 'critical' | 'error' | 'warning';
    category: string;
    description: string;
    count: number;
    affectedIds: string[];
    fixSuggestion?: string;
}
export interface ValidationWarning {
    type: string;
    description: string;
    count: number;
    impact: 'low' | 'medium' | 'high';
}
export interface ValidationStats {
    totalUsers: number;
    usersWithWorkspace: number;
    usersWithoutWorkspace: number;
    totalWorkspaces: number;
    workspacesWithSubscription: number;
    workspacesWithoutSubscription: number;
    totalSubscriptions: number;
    workspaceSubscriptions: number;
    userSubscriptions: number;
    orphanedRecords: number;
    dataConsistencyScore: number;
}
export declare class MigrationValidationService {
    runCompleteValidation(): Promise<ValidationResult>;
    collectValidationStats(): Promise<ValidationStats>;
    checkOrphanedRecords(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    checkDataConsistency(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    checkReferentialIntegrity(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    checkSubscriptionMigration(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    checkWorkspaceIntegrity(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    checkUserMigration(): Promise<{
        issues: ValidationIssue[];
        warnings: ValidationWarning[];
    }>;
    private calculateValidationScore;
    private generateRecommendations;
}
export default MigrationValidationService;
//# sourceMappingURL=migrationValidationService.d.ts.map