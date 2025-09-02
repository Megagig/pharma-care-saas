import { IWorkplace } from '../models/Workplace';
export interface UsageAlert {
    workspaceId: string;
    workspaceName: string;
    resource: string;
    currentUsage: number;
    limit: number;
    percentage: number;
    severity: 'warning' | 'critical';
    alertType: 'approaching_limit' | 'limit_exceeded';
}
export interface AlertNotificationData {
    workspace: IWorkplace;
    alerts: UsageAlert[];
    ownerEmail: string;
    ownerName: string;
    planName: string;
}
export declare class UsageAlertService {
    checkAndSendUsageAlerts(): Promise<void>;
    checkWorkspaceUsageAlerts(workspace: IWorkplace): Promise<UsageAlert[]>;
    sendUsageAlertNotification(workspace: IWorkplace, alerts: UsageAlert[]): Promise<boolean>;
    private sendUsageAlertEmail;
    private generateAlertRecommendations;
    getWorkspaceAlertSummary(workspaceId: string): Promise<{
        totalAlerts: number;
        criticalAlerts: number;
        warningAlerts: number;
        alerts: UsageAlert[];
    }>;
    private shouldSendAlert;
}
declare const _default: UsageAlertService;
export default _default;
//# sourceMappingURL=UsageAlertService.d.ts.map