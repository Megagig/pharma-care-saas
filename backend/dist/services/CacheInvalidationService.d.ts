interface InvalidationRule {
    event: string;
    patterns: string[];
    tags: string[];
    warmAfterInvalidation: boolean;
}
interface InvalidationEvent {
    type: string;
    entityId?: string;
    entityType?: string;
    metadata?: any;
    timestamp: Date;
}
export declare class CacheInvalidationService {
    private static instance;
    private cacheService;
    private warmingService;
    private invalidationRules;
    private invalidationStats;
    constructor();
    static getInstance(): CacheInvalidationService;
    private setupInvalidationRules;
    private addInvalidationRule;
    handleInvalidationEvent(event: InvalidationEvent): Promise<void>;
    private invalidateByPatterns;
    private resolvePattern;
    invalidateUserCaches(userId: string): Promise<void>;
    invalidateTenantCaches(tenantId: string): Promise<void>;
    invalidateSystemCaches(): Promise<void>;
    invalidateSecurityCaches(): Promise<void>;
    invalidateFeatureFlagCaches(flagId?: string): Promise<void>;
    invalidateBillingCaches(subscriptionId?: string): Promise<void>;
    invalidateNotificationCaches(): Promise<void>;
    invalidateSupportCaches(): Promise<void>;
    invalidateApiCaches(): Promise<void>;
    smartInvalidate(changes: {
        collection: string;
        operation: 'create' | 'update' | 'delete';
        documentId?: string;
        fields?: string[];
    }): Promise<void>;
    getInvalidationStats(): typeof this.invalidationStats;
    getInvalidationRules(): Array<{
        event: string;
        rule: InvalidationRule;
    }>;
    clearAllCaches(): Promise<boolean>;
}
declare const _default: CacheInvalidationService;
export default _default;
//# sourceMappingURL=CacheInvalidationService.d.ts.map