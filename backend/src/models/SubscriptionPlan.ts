import mongoose, { Document, Schema } from 'mongoose';

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

const subscriptionPlanSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        unique: true,
        trim: true
    },
    priceNGN: {
        type: Number,
        required: [true, 'Price in NGN is required'],
        min: 0
    },
    billingInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    features: {
        patientLimit: {
            type: Number,
            default: null // null means unlimited
        },
        reminderSmsMonthlyLimit: {
            type: Number,
            default: null // null means unlimited
        },
        reportsExport: {
            type: Boolean,
            default: false
        },
        careNoteExport: {
            type: Boolean,
            default: false
        },
        adrModule: {
            type: Boolean,
            default: false
        },
        multiUserSupport: {
            type: Boolean,
            default: false
        }
    }
}, { timestamps: true });

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);