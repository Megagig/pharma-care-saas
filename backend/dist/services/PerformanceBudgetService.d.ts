export interface PerformanceBudget {
    id?: string;
    name: string;
    description?: string;
    workspaceId?: string;
    isActive: boolean;
    budgets: {
        lighthouse: {
            performance: {
                min: number;
                target: number;
            };
            accessibility: {
                min: number;
                target: number;
            };
            bestPractices: {
                min: number;
                target: number;
            };
            seo: {
                min: number;
                target: number;
            };
        };
        webVitals: {
            FCP: {
                max: number;
                target: number;
            };
            LCP: {
                max: number;
                target: number;
            };
            CLS: {
                max: number;
                target: number;
            };
            FID: {
                max: number;
                target: number;
            };
            TTFB: {
                max: number;
                target: number;
            };
            INP: {
                max: number;
                target: number;
            };
        };
        bundleSize: {
            totalGzip: {
                max: number;
                target: number;
            };
            totalBrotli: {
                max: number;
                target: number;
            };
            mainChunk: {
                max: number;
                target: number;
            };
            vendorChunk: {
                max: number;
                target: number;
            };
        };
        apiLatency: {
            p50: {
                max: number;
                target: number;
            };
            p95: {
                max: number;
                target: number;
            };
            p99: {
                max: number;
                target: number;
            };
        };
    };
    alerting: {
        enabled: boolean;
        channels: string[];
        escalation: {
            [severity: string]: {
                delay: number;
                channels: string[];
            };
        };
        cooldown: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface BudgetViolation {
    budgetId: string;
    budgetName: string;
    category: 'lighthouse' | 'webVitals' | 'bundleSize' | 'apiLatency';
    metric: string;
    value: number;
    budget: number;
    target: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    url?: string;
    branch?: string;
    workspaceId?: string;
    additionalData?: any;
}
export interface BudgetReport {
    budgetId: string;
    budgetName: string;
    period: string;
    summary: {
        totalChecks: number;
        violations: number;
        violationRate: number;
        averageScores: {
            [key: string]: number;
        };
    };
    violations: BudgetViolation[];
    trends: {
        [metric: string]: {
            current: number;
            previous: number;
            change: number;
            trend: 'improving' | 'degrading' | 'stable';
        };
    };
    recommendations: string[];
}
export declare class PerformanceBudgetService {
    private cacheService;
    constructor();
    createBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceBudget>;
    updateBudget(id: string, updates: Partial<PerformanceBudget>): Promise<PerformanceBudget | null>;
    deleteBudget(id: string): Promise<boolean>;
    getBudgets(workspaceId?: string): Promise<PerformanceBudget[]>;
    getBudget(id: string): Promise<PerformanceBudget | null>;
    checkLighthouseBudgets(result: {
        scores: {
            [key: string]: number;
        };
        metrics: {
            [key: string]: number;
        };
        url: string;
        branch?: string;
        workspaceId?: string;
    }): Promise<BudgetViolation[]>;
    checkWebVitalsBudgets(metrics: {
        [key: string]: number;
    }, context: {
        url: string;
        workspaceId?: string;
        userAgent?: string;
        deviceType?: string;
    }): Promise<BudgetViolation[]>;
    checkBundleSizeBudgets(bundleData: {
        totalGzip: number;
        totalBrotli: number;
        mainChunk: number;
        vendorChunk: number;
    }, context: {
        branch?: string;
        commit?: string;
        workspaceId?: string;
    }): Promise<BudgetViolation[]>;
    checkAPILatencyBudgets(latencyData: {
        p50: number;
        p95: number;
        p99: number;
    }, context: {
        endpoint?: string;
        workspaceId?: string;
    }): Promise<BudgetViolation[]>;
    getBudgetReport(budgetId: string, period?: '24h' | '7d' | '30d'): Promise<BudgetReport>;
    private calculateSeverity;
    private recordViolation;
    private sendViolationAlert;
    private getPeriodStartTime;
    private estimateTotalChecks;
    private calculateAverageScores;
    private calculateBudgetTrends;
    private generateBudgetRecommendations;
    private invalidateBudgetCaches;
    createDefaultBudget(workspaceId: string): Promise<PerformanceBudget>;
}
export declare const performanceBudgetService: PerformanceBudgetService;
//# sourceMappingURL=PerformanceBudgetService.d.ts.map