export interface PerformanceOverview {
    timestamp: Date;
    webVitals: {
        summary: any;
        recentViolations: number;
        trendDirection: 'improving' | 'degrading' | 'stable';
    };
    lighthouse: {
        latestScores: {
            [key: string]: number;
        };
        recentRuns: number;
        budgetViolations: number;
        trendDirection: 'improving' | 'degrading' | 'stable';
    };
    budgets: {
        totalBudgets: number;
        activeBudgets: number;
        recentViolations: number;
        violationRate: number;
    };
    api: {
        p95Latency: number;
        errorRate: number;
        throughput: number;
        trendDirection: 'improving' | 'degrading' | 'stable';
    };
    alerts: {
        activeAlerts: number;
        recentAlerts: number;
        criticalAlerts: number;
    };
    recommendations: string[];
}
export interface PerformanceTrend {
    metric: string;
    category: 'webVitals' | 'lighthouse' | 'api' | 'bundle';
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'improving' | 'degrading' | 'stable';
    timestamp: Date;
}
export interface PerformanceAlert {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    message: string;
    timestamp: Date;
    resolved: boolean;
    url?: string;
    workspaceId?: string;
}
export interface PerformanceReport {
    period: string;
    generatedAt: Date;
    overview: PerformanceOverview;
    trends: PerformanceTrend[];
    topIssues: Array<{
        category: string;
        metric: string;
        severity: string;
        count: number;
        impact: string;
    }>;
    recommendations: Array<{
        category: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        estimatedImpact: string;
    }>;
    budgetCompliance: {
        overallScore: number;
        categoryScores: {
            [key: string]: number;
        };
        violationsByCategory: {
            [key: string]: number;
        };
    };
}
export declare class PerformanceMonitoringService {
    private webVitalsService;
    private lighthouseService;
    private budgetService;
    private cacheService;
    constructor();
    getPerformanceOverview(workspaceId?: string): Promise<PerformanceOverview>;
    getPerformanceTrends(period?: '24h' | '7d' | '30d', workspaceId?: string): Promise<PerformanceTrend[]>;
    generatePerformanceReport(period?: '24h' | '7d' | '30d', workspaceId?: string): Promise<PerformanceReport>;
    getPerformanceAlerts(workspaceId?: string, limit?: number): Promise<PerformanceAlert[]>;
    resolveAlert(alertId: string): Promise<boolean>;
    private calculateTrendDirection;
    private calculateLighthouseTrend;
    private generateOverviewRecommendations;
    private analyzeTopIssues;
    private generateDetailedRecommendations;
    private calculateBudgetCompliance;
    private getPeriodDays;
}
export declare const performanceMonitoringService: PerformanceMonitoringService;
//# sourceMappingURL=PerformanceMonitoringService.d.ts.map