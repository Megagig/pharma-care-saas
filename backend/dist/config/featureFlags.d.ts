export interface PerformanceFeatureFlags {
    themeOptimization: boolean;
    bundleOptimization: boolean;
    apiCaching: boolean;
    databaseOptimization: boolean;
    performanceMonitoring: boolean;
    cursorPagination: boolean;
    backgroundJobs: boolean;
    serviceWorker: boolean;
    virtualization: boolean;
    reactQueryOptimization: boolean;
    rolloutPercentage: number;
    internalTesting: boolean;
    betaUsers: boolean;
}
export interface FeatureFlagOverride {
    userId?: string;
    workspaceId?: string;
    featureName: string;
    enabled: boolean;
    expiresAt?: Date;
    reason?: string;
}
export declare const getPerformanceFeatureFlags: () => PerformanceFeatureFlags;
export declare const validateFeatureFlags: (flags: PerformanceFeatureFlags) => string[];
export declare const getFeatureFlagStatus: () => {
    flags: PerformanceFeatureFlags;
    valid: boolean;
    errors: string[];
    lastUpdated: string;
};
export declare const getDefaultFeatureFlags: (environment: string) => Partial<PerformanceFeatureFlags>;
export declare const FEATURE_FLAG_DESCRIPTIONS: {
    readonly themeOptimization: "Enables zero-flicker theme switching with inline scripts and CSS variables";
    readonly bundleOptimization: "Enables code splitting, lazy loading, and bundle size optimizations";
    readonly apiCaching: "Enables Redis-based API response caching for improved performance";
    readonly databaseOptimization: "Enables optimized database indexes and query improvements";
    readonly performanceMonitoring: "Enables Web Vitals collection and performance monitoring";
    readonly cursorPagination: "Enables cursor-based pagination for better performance with large datasets";
    readonly backgroundJobs: "Enables BullMQ background job processing for heavy operations";
    readonly serviceWorker: "Enables service worker for offline functionality and caching";
    readonly virtualization: "Enables virtualized lists and tables for better performance with large datasets";
    readonly reactQueryOptimization: "Enables optimized React Query configuration and caching strategies";
};
export declare const FEATURE_FLAG_CATEGORIES: {
    readonly core: readonly ["themeOptimization", "bundleOptimization", "performanceMonitoring"];
    readonly backend: readonly ["apiCaching", "databaseOptimization", "cursorPagination", "backgroundJobs"];
    readonly frontend: readonly ["virtualization", "reactQueryOptimization", "serviceWorker"];
};
//# sourceMappingURL=featureFlags.d.ts.map