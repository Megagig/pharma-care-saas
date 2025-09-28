import { EventEmitter } from 'events';
export interface MonitoringConfig {
    webVitals: {
        enabled: boolean;
        collectionInterval: number;
        alertThresholds: {
            LCP: number;
            FID: number;
            CLS: number;
            TTFB: number;
        };
    };
    lighthouse: {
        enabled: boolean;
        schedule: string;
        urls: string[];
        alertThresholds: {
            performance: number;
            accessibility: number;
            bestPractices: number;
            seo: number;
        };
    };
    apiLatency: {
        enabled: boolean;
        monitoringInterval: number;
        endpoints: string[];
        alertThresholds: {
            p95: number;
            errorRate: number;
        };
    };
    regressionDetection: {
        enabled: boolean;
        analysisInterval: number;
        lookbackPeriod: number;
        regressionThreshold: number;
    };
    reporting: {
        dailyReport: boolean;
        weeklyReport: boolean;
        monthlyReport: boolean;
        recipients: string[];
    };
}
export interface PerformanceTrend {
    metric: string;
    period: 'hour' | 'day' | 'week' | 'month';
    trend: 'improving' | 'stable' | 'degrading';
    changePercentage: number;
    significance: 'low' | 'medium' | 'high';
    data: Array<{
        timestamp: Date;
        value: number;
    }>;
}
export interface RegressionAlert {
    id: string;
    timestamp: Date;
    metric: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    currentValue: number;
    baselineValue: number;
    changePercentage: number;
    affectedUsers: number;
    description: string;
    recommendations: string[];
}
declare class ContinuousMonitoringService extends EventEmitter {
    private config;
    private monitoringTasks;
    private cronJobs;
    private isRunning;
    constructor();
    start(config?: Partial<MonitoringConfig>): Promise<void>;
    stop(): Promise<void>;
    private startWebVitalsMonitoring;
    private startLighthouseMonitoring;
    private startAPILatencyMonitoring;
    private startRegressionDetection;
    private checkWebVitalsThresholds;
    private runLighthouseChecks;
    private checkAPILatencyThresholds;
    private detectPerformanceRegressions;
    private analyzePerformanceTrends;
    private calculateMetricTrends;
    private simulateAPITrends;
    private calculateWebVitalsAverages;
    private measureEndpointLatency;
    private calculateRegressionSeverity;
    private estimateAffectedUsers;
    private generateRegressionRecommendations;
    private scheduleReports;
    private generateDailyReport;
    private generateWeeklyReport;
    private generateMonthlyReport;
    private sendReport;
    private getDefaultConfig;
    getStatus(): {
        isRunning: boolean;
        config: MonitoringConfig;
        activeTasks: string[];
        activeJobs: string[];
    };
    updateConfig(newConfig: Partial<MonitoringConfig>): Promise<void>;
}
declare const _default: ContinuousMonitoringService;
export default _default;
//# sourceMappingURL=ContinuousMonitoringService.d.ts.map