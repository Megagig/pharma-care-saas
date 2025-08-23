import mongoose, { Document } from 'mongoose';
export interface ISubscription extends Document {
    user: mongoose.Types.ObjectId;
    plan: 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    startDate: Date;
    endDate: Date;
    priceAtPurchase: number;
    features: Array<{
        name?: string;
        enabled?: boolean;
    }>;
    limits: {
        maxPatients?: number;
        maxNotes?: number;
        storageGB?: number;
    };
    paymentHistory: mongoose.Types.ObjectId[];
    autoRenew: boolean;
    trialEnd?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription> & ISubscription & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Subscription.d.ts.map