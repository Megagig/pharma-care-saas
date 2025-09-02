declare class MTRPerformanceOptimizer {
    private metrics;
    optimizeMedicationQueries(): Promise<void>;
    optimizeDTPQueries(): Promise<void>;
    optimizeInterventionQueries(): Promise<void>;
    testQueryPerformance(): Promise<void>;
    optimizeConcurrency(): Promise<void>;
    generateReport(): void;
    runOptimizations(): Promise<void>;
}
export default MTRPerformanceOptimizer;
//# sourceMappingURL=performanceOptimization.d.ts.map