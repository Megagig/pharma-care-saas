import { ValidationResult } from './migrationValidationService';
export interface MigrationMetrics {
    timestamp: Date;
    totalUsers: number;
    migratedUsers: number;
    totalWorkspaces: number;
    workspacesWithSubscriptions: number;
    totalSubscriptions: number;
    workspaceSubscriptions: number;
    userSubscriptions: number;
    validationScore: number;
    criticalIssues: number;
    errors: number;
    warnings: number;
    migrationProgress: number;
}
export interface MigrationAlert {
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
    metadata?: any;
}
export interface MigrationReport {
    id: string;
    timestamp: Date;
    type: 'daily' | 'weekly' | 'on_demand';
    metrics: MigrationMetrics;
    validation: ValidationResult;
    alerts: MigrationAlert[];
    recommendations: string[];
    nextActions: string[];
}
export declare class MigrationMonitoringService {
    private validationService;
    private alerts;
    private metrics;
    constructor();
    collectMetrics(): Promise<MigrationMetrics>;
    checkForAlerts(): Promise<MigrationAlert[]>;
    generateReport(type?: 'daily' | 'weekly' | 'on_demand'): Promise<MigrationReport>;
    getTrendAnalysis(): {
        progressTrend: 'improving' | 'stable' | 'declining';
        validationTrend: 'improving' | 'stable' | 'declining';
        recentMetrics: MigrationMetrics[];
        averageProgress: number;
        averageValidationScore: number;
    };
    resolveAlert(alertId: string): boolean;
    getActiveAlerts(): MigrationAlert[];
    getStatusSummary(): Promise<{
        status: 'not_started' | 'in_progress' | 'completed' | 'failed';
        progress: number;
        validationScore: number;
        criticalIssues: number;
        estimatedCompletion?: Date;
        lastUpdated: Date;
    }>;
    private generateNextActions;
}
export default MigrationMonitoringService;
//# sourceMappingURL=migrationMonitoringService.d.ts.map