export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    environments: string[];
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export declare const MANUAL_LAB_FEATURE_FLAGS: Record<string, FeatureFlag>;
export declare class FeatureFlagService {
    private static instance;
    private flags;
    private constructor();
    static getInstance(): FeatureFlagService;
    isEnabled(flagKey: string, context?: {
        userId?: string;
        workplaceId?: string;
        environment?: string;
        userAgent?: string;
    }): boolean;
    getEnabledFeatures(context?: {
        userId?: string;
        workplaceId?: string;
        environment?: string;
        userAgent?: string;
    }): string[];
    updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void;
    getFlag(flagKey: string): FeatureFlag | undefined;
    private hashContext;
}
export declare const injectFeatureFlags: (req: any, res: any, next: any) => void;
export declare const requireFeatureFlag: (flagKey: string) => (req: any, res: any, next: any) => any;
export default FeatureFlagService;
//# sourceMappingURL=featureFlags.d.ts.map