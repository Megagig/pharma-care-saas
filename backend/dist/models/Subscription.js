"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const subscriptionSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    planId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
    },
    status: {
        type: String,
        enum: [
            'trial',
            'active',
            'past_due',
            'expired',
            'canceled',
            'suspended',
        ],
        default: 'trial',
        index: true,
    },
    tier: {
        type: String,
        enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
        required: true,
        index: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    trialEndDate: {
        type: Date,
        index: true,
    },
    priceAtPurchase: {
        type: Number,
        required: true,
        min: 0,
    },
    billingInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
    },
    nextBillingDate: {
        type: Date,
        index: true,
    },
    paymentHistory: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Payment',
        },
    ],
    autoRenew: {
        type: Boolean,
        default: true,
    },
    gracePeriodEnd: Date,
    stripeSubscriptionId: {
        type: String,
        sparse: true,
        index: true,
    },
    stripeCustomerId: {
        type: String,
        sparse: true,
        index: true,
    },
    webhookEvents: [
        {
            eventId: {
                type: String,
                required: true,
            },
            eventType: {
                type: String,
                required: true,
            },
            processedAt: {
                type: Date,
                default: Date.now,
            },
            data: mongoose_1.Schema.Types.Mixed,
        },
    ],
    renewalAttempts: [
        {
            attemptedAt: {
                type: Date,
                default: Date.now,
            },
            successful: {
                type: Boolean,
                required: true,
            },
            error: String,
        },
    ],
    features: [
        {
            type: String,
            index: true,
        },
    ],
    customFeatures: [
        {
            type: String,
            index: true,
        },
    ],
    limits: {
        patients: {
            type: Number,
            default: null,
        },
        users: {
            type: Number,
            default: null,
        },
        locations: {
            type: Number,
            default: null,
        },
        storage: {
            type: Number,
            default: null,
        },
        apiCalls: {
            type: Number,
            default: null,
        },
    },
    usageMetrics: [
        {
            feature: {
                type: String,
                required: true,
            },
            count: {
                type: Number,
                default: 0,
            },
            lastUpdated: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    scheduledDowngrade: {
        planId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
        },
        effectiveDate: Date,
        scheduledAt: {
            type: Date,
            default: Date.now,
        },
    },
}, { timestamps: true });
subscriptionSchema.methods.isInGracePeriod = function () {
    return (this.status === 'grace_period' &&
        this.gracePeriodEnd &&
        new Date() <= this.gracePeriodEnd);
};
subscriptionSchema.methods.isExpired = function () {
    return new Date() > this.endDate && !this.isInGracePeriod();
};
subscriptionSchema.methods.canRenew = function () {
    return this.autoRenew && ['active', 'grace_period'].includes(this.status);
};
subscriptionSchema.pre('save', function (next) {
    const now = new Date();
    if (this.isModified('endDate') || this.isNew) {
        if (now > this.endDate) {
            if (this.gracePeriodEnd && now <= this.gracePeriodEnd) {
                this.status = 'past_due';
            }
            else {
                this.status = 'expired';
            }
        }
    }
    next();
});
subscriptionSchema.index({ workspaceId: 1, status: 1 });
subscriptionSchema.index({ workspaceId: 1 }, { unique: true });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ trialEndDate: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });
subscriptionSchema.index({ tier: 1, status: 1 });
exports.default = mongoose_1.default.model('Subscription', subscriptionSchema);
//# sourceMappingURL=Subscription.js.map