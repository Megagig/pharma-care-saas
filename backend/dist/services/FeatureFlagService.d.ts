export interface FeatureFlagEvaluation {
    enabled: boolean;
    reason: string;
    rolloutPercentage: number;
    userPercentile?: number;
    override?: boolean;
}
export interface FeatureFlagMetrics {
    featureName: string;
    totalEvaluations: number;
    enabledEvaluations: number;
    enabledPercentage: number;
    lastEvaluated: Date;
}
declare class FeatureFlagService {
    private cache;
    private cacheTimeout;
    private metrics;
    isFeatureEnabled(featureName: string, userId: string, workspaceId: string): Promise<FeatureFlagEvaluation>;
    private getGlobalFeatureFlag;
    private getUserFeatureOverride;
    private getWorkspaceFeatureOverride;
    private isInternalUser;
    private isBetaUser;
    private getUserPercentile;
    private updateMetrics;
    getMetrics(): FeatureFlagMetrics[];
    clearCache(): void;
    setUserFeatureOverride(featureName: string, userId: string, enabled: boolean, expiresAt?: Date, reason?: string): Promise<void>;
    setWorkspaceFeatureOverride(featureName: string, workspaceId: string, enabled: boolean, expiresAt?: Date, reason?: string): Promise<void>;
    removeFeatureOverride(featureName: string, userId?: string, workspaceId?: string): Promise<void>;
    getFeatureOverrides(featureName?: string): Promise<any[]>;
}
declare const _default: FeatureFlagService;
export default _default;
//# sourceMappingURL=FeatureFlagService.d.ts.map