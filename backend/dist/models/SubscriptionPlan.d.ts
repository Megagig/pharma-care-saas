import mongoose, { Document } from 'mongoose';
export interface ISubscriptionPlan extends Document {
    name: string;
    priceNGN: number;
    billingInterval: 'monthly' | 'yearly';
    features: {
        patientLimit: number | null;
        reminderSmsMonthlyLimit: number | null;
        reportsExport: boolean;
        careNoteExport: boolean;
        adrModule: boolean;
        multiUserSupport: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISubscriptionPlan, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionPlan> & ISubscriptionPlan & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=SubscriptionPlan.d.ts.map