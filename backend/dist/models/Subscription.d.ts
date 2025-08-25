import mongoose, { Document } from 'mongoose';
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'grace_period' | 'suspended';
    tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    startDate: Date;
    endDate: Date;
    priceAtPurchase: number;
    paymentHistory: mongoose.Types.ObjectId[];
    autoRenew: boolean;
    trialEnd?: Date;
    gracePeriodEnd?: Date;
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
    usageMetrics: {
        feature: string;
        count: number;
        lastUpdated: Date;
    }[];
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
declare const _default: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription> & ISubscription & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Subscription.d.ts.map