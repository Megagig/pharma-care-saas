export interface WebVitalsEntry {
    name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
    value: number;
    id: string;
    timestamp: Date;
    url: string;
    userAgent: string;
    connectionType?: string;
    userId?: string;
    workspaceId?: string;
    sessionId?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    country?: string;
    ip?: string;
}
export interface WebVitalsSummary {
    period: string;
    metrics: {
        [key: string]: {
            p50: number;
            p75: number;
            p95: number;
            p99: number;
            count: number;
            avg: number;
        };
    };
    budgetStatus: {
        [key: string]: 'good' | 'needs-improvement' | 'poor';
    };
    totalSamples: number;
    lastUpdated: Date;
    trends: {
        [key: string]: {
            change: number;
            direction: 'up' | 'down' | 'stable';
        };
    };
}
export interface PerformanceBudgets {
    FCP: {
        good: number;
        poor: number;
    };
    LCP: {
        good: number;
        poor: number;
    };
    CLS: {
        good: number;
        poor: number;
    };
    FID: {
        good: number;
        poor: number;
    };
    TTFB: {
        good: number;
        poor: number;
    };
    INP: {
        good: number;
        poor: number;
    };
}
export declare class WebVitalsService {
    private cacheService;
    private performanceBudgets;
    constructor();
    storeWebVitalsEntry(entry: Omit<WebVitalsEntry, 'timestamp'> & {
        timestamp?: Date;
    }): Promise<void>;
    getWebVitalsSummary(period?: '1h' | '24h' | '7d' | '30d', filters?: {
        workspaceId?: string;
        url?: string;
        deviceType?: string;
        country?: string;
    }): Promise<WebVitalsSummary>;
    getWebVitalsTimeSeries(metric: string, period?: '1h' | '24h' | '7d' | '30d', interval?: '1m' | '5m' | '1h' | '1d', filters?: any): Promise<Array<{
        timestamp: Date;
        value: number;
        count: number;
    }>>;
    detectRegressions(metric: string, threshold?: number): Promise<Array<{
        metric: string;
        currentValue: number;
        previousValue: number;
        change: number;
        severity: 'low' | 'medium' | 'high';
        timestamp: Date;
    }>>;
    private calculateMetrics;
    private calculateTrends;
    private calculateBudgetStatus;
    private percentile;
    private detectDeviceType;
    private generateSessionId;
    private getPeriodStartTime;
    private getPreviousPeriodStartTime;
    private getIntervalMs;
    private invalidateRelevantCaches;
    private checkPerformanceBudgets;
    private sendPerformanceAlert;
    static getRecentMetrics(timeRangeMs: number): Promise<any[]>;
    static getMetricsInRange(startDate: Date, endDate: Date): Promise<any[]>;
}
export declare const webVitalsService: WebVitalsService;
//# sourceMappingURL=WebVitalsService.d.ts.map