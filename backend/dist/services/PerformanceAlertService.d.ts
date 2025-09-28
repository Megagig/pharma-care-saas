export interface PerformanceAlert {
    type: 'performance_budget_exceeded' | 'regression_detected' | 'lighthouse_failure';
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold?: number;
    url: string;
    timestamp: Date;
    userAgent?: string;
    deviceType?: string;
    workspaceId?: string;
    additionalData?: any;
}
export interface AlertChannel {
    type: 'email' | 'slack' | 'webhook';
    enabled: boolean;
    config: any;
}
export interface AlertConfiguration {
    channels: AlertChannel[];
    cooldownPeriod: number;
    escalationRules: {
        [severity: string]: {
            channels: string[];
            delay: number;
        };
    };
}
export declare class PerformanceAlertService {
    private alertConfig;
    private alertCooldowns;
    private emailTransporter;
    private slackWebhook;
    constructor(config?: Partial<AlertConfiguration>);
    private initializeChannels;
    sendAlert(alert: PerformanceAlert): Promise<void>;
    private sendEmailAlert;
    private sendSlackAlert;
    private sendWebhookAlert;
    private generateEmailSubject;
    private generateEmailBody;
    private generateSlackMessage;
    private generateRecommendations;
    private formatMetricValue;
    private getSeverityColor;
    testAlerts(): Promise<{
        [channel: string]: boolean;
    }>;
    updateConfiguration(config: Partial<AlertConfiguration>): void;
    getConfiguration(): AlertConfiguration;
}
export declare const performanceAlertService: PerformanceAlertService;
//# sourceMappingURL=PerformanceAlertService.d.ts.map