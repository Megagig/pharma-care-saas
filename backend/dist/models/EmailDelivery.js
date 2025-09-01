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
exports.EmailDelivery = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EmailDeliverySchema = new mongoose_1.Schema({
    messageId: {
        type: String,
        required: true,
        index: true,
    },
    provider: {
        type: String,
        enum: ['resend', 'nodemailer', 'simulation'],
        required: true,
    },
    to: {
        type: String,
        required: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
    },
    templateName: {
        type: String,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'complained'],
        default: 'pending',
        index: true,
    },
    sentAt: {
        type: Date,
    },
    deliveredAt: {
        type: Date,
    },
    failedAt: {
        type: Date,
    },
    error: {
        type: String,
    },
    retryCount: {
        type: Number,
        default: 0,
    },
    maxRetries: {
        type: Number,
        default: 3,
    },
    nextRetryAt: {
        type: Date,
    },
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ['invitation', 'subscription', 'user', 'workspace'],
        },
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
        },
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
EmailDeliverySchema.index({ status: 1, nextRetryAt: 1 });
EmailDeliverySchema.index({ workspaceId: 1, status: 1 });
EmailDeliverySchema.index({ createdAt: -1 });
EmailDeliverySchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
EmailDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
EmailDeliverySchema.methods.markAsSent = function (messageId) {
    this.status = 'sent';
    this.sentAt = new Date();
    if (messageId) {
        this.messageId = messageId;
    }
    return this.save();
};
EmailDeliverySchema.methods.markAsDelivered = function () {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
};
EmailDeliverySchema.methods.markAsFailed = function (error) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.error = error;
    this.retryCount += 1;
    if (this.retryCount <= this.maxRetries) {
        const backoffMinutes = Math.pow(2, this.retryCount) * 5;
        this.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        this.status = 'pending';
    }
    return this.save();
};
EmailDeliverySchema.methods.markAsBounced = function () {
    this.status = 'bounced';
    this.failedAt = new Date();
    return this.save();
};
EmailDeliverySchema.methods.markAsComplained = function () {
    this.status = 'complained';
    this.failedAt = new Date();
    return this.save();
};
EmailDeliverySchema.statics.findPendingRetries = function () {
    return this.find({
        status: 'pending',
        retryCount: { $gt: 0, $lte: 3 },
        nextRetryAt: { $lte: new Date() },
    });
};
EmailDeliverySchema.statics.getDeliveryStats = function (workspaceId) {
    const match = workspaceId ? { workspaceId } : {};
    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$count' },
                stats: {
                    $push: {
                        status: '$_id',
                        count: '$count',
                    },
                },
            },
        },
    ]);
};
exports.EmailDelivery = mongoose_1.default.model('EmailDelivery', EmailDeliverySchema);
//# sourceMappingURL=EmailDelivery.js.map