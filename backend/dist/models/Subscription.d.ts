import mongoose, { Document } from 'mongoose';
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
    startDate: Date;
    endDate: Date;
    priceAtPurchase: number;
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