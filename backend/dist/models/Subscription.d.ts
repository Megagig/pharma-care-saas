import mongoose, { Document } from 'mongoose';
export interface UsageMetric {
    feature: string;
    count: number;
    lastUpdated: Date;
}
export interface PlanLimits {
    patients: number | null;
    users: number | null;
    locations: number | null;
    storage: number | null;
    apiCalls: number | null;
}
export interface ISubscription extends Document {
    workspaceId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    status: 'trial' | 'active' | 'past_due' | 'expired' | 'canceled' | 'suspended';
    tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    startDate: Date;
    endDate: Date;
    trialEndDate?: Date;
    trialEndsAt?: Date;
    isTrial?: boolean;
    amount?: number;
    priceAtPurchase: number;
    billingCycle?: 'monthly' | 'yearly';
    billingInterval: 'monthly' | 'yearly';
    nextBillingDate?: Date;
    paymentHistory: mongoose.Types.ObjectId[];
    autoRenew: boolean;
    gracePeriodEnd?: Date;
    canceledAt?: Date;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    webhookEvents: {
        eventId: string;
        eventType: string;
        processedAt: Date;
        data: any;
    }[];
    renewalAttempts: {
        attemptedAt: Date;
        successful: boolean;
        error?: string;
    }[];
    features: string[];
    customFeatures: string[];
    limits: PlanLimits;
    usageMetrics: UsageMetric[];
    scheduledDowngrade?: {
        planId: mongoose.Types.ObjectId;
        effectiveDate: Date;
        scheduledAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    isInGracePeriod(): boolean;
    isExpired(): boolean;
    canRenew(): boolean;
}
declare const Subscription: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription> & ISubscription & {
    _id: mongoose.Types.ObjectId;
}, any>;
export { Subscription };
export default Subscription;
//# sourceMappingURL=Subscription.d.ts.map