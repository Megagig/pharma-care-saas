import mongoose, { Document, Schema } from 'mongoose';

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

const subscriptionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  priceAtPurchase: {
    type: Number,
    required: true
  },
  features: [{
    name: String,
    enabled: { type: Boolean, default: true }
  }],
  limits: {
    maxPatients: { type: Number, default: 100 },
    maxNotes: { type: Number, default: 1000 },
    storageGB: { type: Number, default: 5 }
  },
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  autoRenew: { type: Boolean, default: true },
  trialEnd: Date
}, { timestamps: true });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);