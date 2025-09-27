export interface ValidationTarget {
    lighthouse: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    webVitals: {
        LCP: number;
        TTI: number;
        FCP: number;
        CLS: number;
        TTFB: number;
    };
    apiLatency: {
        improvement: number;
        maxP95: number;
    };
    themeSwitch: {
        maxDuration: number;
    };
}
export interface ValidationResult {
    timestamp: Date;
    passed: boolean;
    score: number;
    results: {
        lighthouse: ValidationItemResult;
        webVitals: ValidationItemResult;
        apiLatency: ValidationItemResult;
        themeSwitch: ValidationItemResult;
    };
    details: any;
    recommendations: string[];
}
export interface ValidationItemResult {
    passed: boolean;
    score: number;
    actual: any;
    target: any;
    improvement?: number;
    message: string;
}
export interface BaselineMetrics {
    lighthouse: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    webVitals: {
        LCP: number;
        TTI: number;
        FCP: number;
        CLS: number;
        TTFB: number;
    };
    apiLatency: {
        p95: number;
        p50: number;
    };
    themeSwitch: {
        duration: number;
    };
}
declare class ProductionValidationService {
    private defaultTargets;
    validateProductionPerformance(baseline: BaselineMetrics, targets?: Partial<ValidationTarget>): Promise<ValidationResult>;
    private collectProductionMetrics;
    private aggregateWebVitals;
    private getAPILatencyMetrics;
    private measureThemeSwitchPerformance;
    private validateLighthouse;
    private validateWebVitals;
    private validateAPILatency;
    private validateThemeSwitch;
    private calculateOverallScore;
    private generateRecommendations;
    private sendValidationAlert;
    validateAcrossUserSegments(): Promise<{
        overall: ValidationResult;
        segments: {
            [key: string]: ValidationResult;
        };
    }>;
    private simulateSegmentValidation;
    private generateSegmentRecommendations;
}
declare const _default: ProductionValidationService;
export default _default;
//# sourceMappingURL=ProductionValidationService.d.ts.map