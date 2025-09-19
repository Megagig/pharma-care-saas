export interface FeatureFlag {
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    conditions?: {
        workplaceIds?: string[];
        userRoles?: string[];
        subscriptionPlans?: string[];
        environment?: string[];
    };
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface FeatureFlagEvaluation {
    flagName: string;
    enabled: boolean;
    reason: string;
    metadata?: Record<string, any>;
}
export declare class FeatureFlagManager {
    private static cache;
    private static cacheExpiry;
    private static cacheTTL;
    static initializeDefaultFlags(): Promise<void>;
    static getAllFlags(): Promise<FeatureFlag[]>;
    static getFlag(name: string): Promise<FeatureFlag | null>;
    static updateFlag(name: string, updates: Partial<FeatureFlag>, updatedBy: string): Promise<FeatureFlag | null>;
    static createFlag(flagData: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<FeatureFlag | null>;
    static deleteFlag(name: string, deletedBy: string): Promise<boolean>;
    static isEnabled(flagName: string, context?: {
        workplaceId?: string;
        userId?: string;
        userRole?: string;
        subscriptionPlan?: string;
    }): Promise<FeatureFlagEvaluation>;
    static evaluateFlags(flagNames: string[], context?: {
        workplaceId?: string;
        userId?: string;
        userRole?: string;
        subscriptionPlan?: string;
    }): Promise<Record<string, FeatureFlagEvaluation>>;
    static getModuleFlags(module: string): Promise<FeatureFlag[]>;
    static clearCache(): void;
    static refreshCache(): Promise<void>;
    private static isCacheValid;
    private static hashString;
}
export declare const featureFlagMiddleware: (req: any, res: any, next: any) => Promise<void>;
export declare const initializeFeatureFlags: () => Promise<void>;
export default FeatureFlagManager;
//# sourceMappingURL=featureFlags.d.ts.map