import mongoose, { Document, Schema } from 'mongoose';

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

const subscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
    default: 'trial'
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
    required: true,
    min: 0
  },
  paymentHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  autoRenew: {
    type: Boolean,
    default: true
  },
  trialEnd: Date
}, { timestamps: true });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);