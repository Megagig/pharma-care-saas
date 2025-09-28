export interface LighthouseResult {
    url: string;
    timestamp: Date;
    runId: string;
    branch: string;
    commit: string;
    scores: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    metrics: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        cumulativeLayoutShift: number;
        totalBlockingTime: number;
        speedIndex: number;
        timeToInteractive: number;
    };
    budgetStatus: {
        [key: string]: 'passed' | 'failed';
    };
    reportUrl?: string;
    rawResult: any;
}
export interface LighthouseTrend {
    metric: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'improving' | 'degrading' | 'stable';
}
export interface LighthouseComparison {
    current: LighthouseResult;
    baseline: LighthouseResult;
    trends: LighthouseTrend[];
    regressions: Array<{
        metric: string;
        current: number;
        baseline: number;
        threshold: number;
        severity: 'low' | 'medium' | 'high';
    }>;
}
export declare class LighthouseCIService {
    private cacheService;
    private performanceBudgets;
    constructor();
    storeLighthouseResult(result: Omit<LighthouseResult, 'timestamp'>): Promise<LighthouseResult>;
    getLighthouseResults(filters?: {
        branch?: string;
        url?: string;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<LighthouseResult[]>;
    compareLighthouseResults(currentRunId: string, baselineRunId?: string): Promise<LighthouseComparison>;
    getLighthouseTrends(branch?: string, url?: string, days?: number): Promise<Array<{
        date: Date;
        scores: {
            [key: string]: number;
        };
        metrics: {
            [key: string]: number;
        };
    }>>;
    generatePerformanceReport(branch?: string, days?: number): Promise<{
        summary: {
            totalRuns: number;
            averageScores: {
                [key: string]: number;
            };
            budgetViolations: number;
            regressionCount: number;
        };
        trends: any[];
        recentRegressions: any[];
        recommendations: string[];
    }>;
    private calculateBudgetStatus;
    private calculateTrends;
    private detectRegressions;
    private checkForRegressions;
    private calculateAverages;
    private generateRecommendations;
    private invalidateRelevantCaches;
}
export declare const lighthouseCIService: LighthouseCIService;
//# sourceMappingURL=LighthouseCIService.d.ts.map