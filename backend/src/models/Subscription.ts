import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'grace_period' | 'suspended';
  tier: 'free_trial' | 'basic' | 'pro' | 'enterprise';
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
  features: string[]; // Cached features from plan
  customFeatures: string[]; // Additional features granted
  usageMetrics: {
    feature: string;
    count: number;
    lastUpdated: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isInGracePeriod(): boolean;
  isExpired(): boolean;
  canRenew(): boolean;
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
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial', 'grace_period', 'suspended'],
    default: 'trial',
    index: true
  },
  tier: {
    type: String,
    enum: ['free_trial', 'basic', 'pro', 'enterprise'],
    required: true,
    index: true
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
  trialEnd: Date,
  gracePeriodEnd: Date,
  stripeSubscriptionId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeCustomerId: {
    type: String,
    sparse: true,
    index: true
  },
  webhookEvents: [{
    eventId: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    data: Schema.Types.Mixed
  }],
  renewalAttempts: [{
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    successful: {
      type: Boolean,
      required: true
    },
    error: String
  }],
  features: [{
    type: String,
    index: true
  }],
  customFeatures: [{
    type: String,
    index: true
  }],
  usageMetrics: [{
    feature: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Instance methods
subscriptionSchema.methods.isInGracePeriod = function(): boolean {
  return this.status === 'grace_period' && this.gracePeriodEnd && new Date() <= this.gracePeriodEnd;
};

subscriptionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.endDate && !this.isInGracePeriod();
};

subscriptionSchema.methods.canRenew = function(): boolean {
  return this.autoRenew && ['active', 'grace_period'].includes(this.status);
};

// Pre-save middleware to update status based on dates
subscriptionSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('endDate') || this.isNew) {
    if (now > this.endDate) {
      if (this.gracePeriodEnd && now <= this.gracePeriodEnd) {
        this.status = 'grace_period';
      } else {
        this.status = 'expired';
      }
    }
  }
  
  next();
});

// Indexes for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });
subscriptionSchema.index({ tier: 1, status: 1 });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);