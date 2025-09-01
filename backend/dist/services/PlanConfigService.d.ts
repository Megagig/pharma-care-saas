export interface PlanLimits {
    patients: number | null;
    users: number | null;
    locations: number | null;
    storage: number | null;
    apiCalls: number | null;
    clinicalNotes: number | null;
    reminderSms: number | null;
}
export interface PlanConfig {
    name: string;
    code: string;
    tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    tierRank: number;
    priceNGN: number;
    billingInterval: 'monthly' | 'yearly';
    trialDuration?: number | null;
    popularPlan: boolean;
    isContactSales?: boolean;
    whatsappNumber?: string | null;
    description: string;
    isActive: boolean;
    isTrial: boolean;
    isCustom: boolean;
    features: string[];
    limits: PlanLimits;
}
export interface FeatureConfig {
    name: string;
    category: string;
    description: string;
}
export interface CategoryConfig {
    name: string;
    description: string;
}
export interface PlansConfiguration {
    plans: Record<string, PlanConfig>;
    features: Record<string, FeatureConfig>;
    categories: Record<string, CategoryConfig>;
}
declare class PlanConfigService {
    private static instance;
    private cachedConfig;
    private lastLoadTime;
    private readonly CACHE_DURATION;
    private readonly CONFIG_PATH;
    private constructor();
    static getInstance(): PlanConfigService;
    loadConfiguration(): Promise<PlansConfiguration>;
    getPlanByCode(code: string): Promise<PlanConfig | null>;
    getActivePlans(): Promise<PlanConfig[]>;
    getFeatureByCode(code: string): Promise<FeatureConfig | null>;
    planHasFeature(planCode: string, featureCode: string): Promise<boolean>;
    getPlansByTierRank(): Promise<PlanConfig[]>;
    refreshCache(): Promise<void>;
    private validateConfiguration;
    private validatePlan;
    private validateFeature;
    private validateFeatureReferences;
    private getDefaultConfiguration;
}
export default PlanConfigService;
//# sourceMappingURL=PlanConfigService.d.ts.map