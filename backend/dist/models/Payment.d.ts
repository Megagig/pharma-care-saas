import mongoose, { Document } from 'mongoose';
export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    planId?: mongoose.Types.ObjectId;
    subscription?: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'nomba';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentReference?: string;
    stripePaymentIntentId?: string;
    paypalOrderId?: string;
    transactionId?: string;
    metadata?: Record<string, any>;
    completedAt?: Date;
    failedAt?: Date;
    invoice: {
        invoiceNumber?: string;
        dueDate?: Date;
        items?: Array<{
            description?: string;
            amount?: number;
            quantity?: number;
        }>;
    };
    billingAddress: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    refundInfo: {
        refundedAt?: Date;
        refundAmount?: number;
        reason?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment> & IPayment & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Payment.d.ts.map