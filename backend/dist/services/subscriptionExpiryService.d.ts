export declare class SubscriptionExpiryService {
    checkExpiredTrials(): Promise<void>;
    checkExpiredSubscriptions(): Promise<void>;
    checkGracePeriodExpiry(): Promise<void>;
    processScheduledDowngrades(): Promise<void>;
    private sendTrialExpiryWarnings;
    private sendSubscriptionExpiryWarnings;
    private expireTrialSubscription;
    private handleExpiredSubscription;
    private expireSubscriptionAfterGracePeriod;
    private applyScheduledDowngrade;
    runExpiryChecks(): Promise<void>;
}
export declare const subscriptionExpiryService: SubscriptionExpiryService;
//# sourceMappingURL=subscriptionExpiryService.d.ts.map