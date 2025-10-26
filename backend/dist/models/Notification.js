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
const tenancyGuard_1 = require("../utils/tenancyGuard");
const notificationDataSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        index: true,
    },
    messageId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        index: true,
    },
    interventionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClinicalIntervention',
        index: true,
    },
    consultationRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ConsultationRequest',
        index: true,
    },
    pharmacistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    priority: {
        type: String,
    },
    reason: {
        type: String,
    },
    waitTime: {
        type: Number,
    },
    escalationLevel: {
        type: Number,
    },
    reminderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Reminder',
        index: true,
    },
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Appointment',
        index: true,
    },
    followUpTaskId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'FollowUpTask',
        index: true,
    },
    medicationName: {
        type: String,
    },
    dosage: {
        type: String,
    },
    scheduledTime: {
        type: Date,
    },
    frequency: {
        type: String,
    },
    times: {
        type: [String],
    },
    actionUrl: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^\/|^https?:\/\//.test(url);
            },
            message: 'Invalid action URL format',
        },
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { _id: false });
const notificationDeliveryChannelsSchema = new mongoose_1.Schema({
    inApp: {
        type: Boolean,
        default: true,
    },
    email: {
        type: Boolean,
        default: false,
    },
    sms: {
        type: Boolean,
        default: false,
    },
    push: {
        type: Boolean,
        default: true,
    },
}, { _id: false });
const notificationDeliveryStatusSchema = new mongoose_1.Schema({
    channel: {
        type: String,
        enum: ['inApp', 'email', 'sms', 'push'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'pending',
        required: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    failureReason: {
        type: String,
        maxlength: [500, 'Failure reason cannot exceed 500 characters'],
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    lastAttemptAt: Date,
}, { _id: false });
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'new_message', 'mention', 'therapy_update', 'clinical_alert',
            'conversation_invite', 'file_shared', 'intervention_assigned',
            'patient_query', 'urgent_message', 'system_notification',
            'consultation_request', 'consultation_accepted', 'consultation_completed', 'consultation_escalated',
            'medication_reminder', 'missed_medication', 'reminder_setup', 'flagged_message',
            'appointment_reminder', 'appointment_confirmed', 'appointment_rescheduled',
            'appointment_cancelled', 'followup_task_assigned', 'followup_task_overdue',
            'medication_refill_due', 'adherence_check_reminder'
        ],
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Notification title cannot exceed 200 characters'],
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Notification content cannot exceed 1000 characters'],
    },
    data: {
        type: notificationDataSchema,
        required: true,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent', 'critical'],
        default: 'normal',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'dismissed', 'archived'],
        default: 'unread',
        required: true,
        index: true,
    },
    deliveryChannels: {
        type: notificationDeliveryChannelsSchema,
        required: true,
    },
    deliveryStatus: [notificationDeliveryStatusSchema],
    scheduledFor: {
        type: Date,
        index: true,
        validate: {
            validator: function (date) {
                return !date || date >= new Date();
            },
            message: 'Scheduled date cannot be in the past',
        },
    },
    sentAt: {
        type: Date,
        index: true,
    },
    readAt: {
        type: Date,
        index: true,
    },
    dismissedAt: {
        type: Date,
        index: true,
    },
    groupKey: {
        type: String,
        index: true,
        maxlength: [100, 'Group key cannot exceed 100 characters'],
    },
    batchId: {
        type: String,
        index: true,
        maxlength: [100, 'Batch ID cannot exceed 100 characters'],
    },
    expiresAt: {
        type: Date,
        index: true,
        validate: {
            validator: function (date) {
                return !date || date > new Date();
            },
            message: 'Expiration date must be in the future',
        },
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(notificationSchema);
notificationSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, status: 1 });
notificationSchema.index({ workplaceId: 1, type: 1, priority: 1 });
notificationSchema.index({ workplaceId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ groupKey: 1, userId: 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ 'data.conversationId': 1, userId: 1 });
notificationSchema.index({ 'data.patientId': 1, userId: 1 });
notificationSchema.index({ userId: 1, priority: 1, status: 1, createdAt: -1 });
notificationSchema.index({ workplaceId: 1, type: 1, scheduledFor: 1 });
notificationSchema.index({ 'deliveryStatus.channel': 1, 'deliveryStatus.status': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.virtual('deliverySuccessRate').get(function () {
    if (this.deliveryStatus.length === 0)
        return 0;
    const successfulDeliveries = this.deliveryStatus.filter(status => ['sent', 'delivered'].includes(status.status)).length;
    return (successfulDeliveries / this.deliveryStatus.length) * 100;
});
notificationSchema.virtual('totalDeliveryAttempts').get(function () {
    return this.deliveryStatus.reduce((total, status) => total + status.attempts, 0);
});
notificationSchema.virtual('isUrgent').get(function () {
    return ['urgent', 'critical'].includes(this.priority);
});
notificationSchema.methods.markAsRead = function () {
    if (this.status === 'unread') {
        this.status = 'read';
        this.readAt = new Date();
    }
};
notificationSchema.methods.markAsDismissed = function () {
    this.status = 'dismissed';
    this.dismissedAt = new Date();
};
notificationSchema.methods.updateDeliveryStatus = function (channel, status, details = {}) {
    let deliveryStatus = this.deliveryStatus.find(ds => ds.channel === channel);
    if (!deliveryStatus) {
        deliveryStatus = {
            channel: channel,
            status: status,
            attempts: 0,
        };
        this.deliveryStatus.push(deliveryStatus);
    }
    deliveryStatus.status = status;
    deliveryStatus.lastAttemptAt = new Date();
    if (status === 'sent') {
        deliveryStatus.sentAt = new Date();
        deliveryStatus.attempts += 1;
    }
    else if (status === 'delivered') {
        deliveryStatus.deliveredAt = new Date();
    }
    else if (['failed', 'bounced'].includes(status)) {
        deliveryStatus.attempts += 1;
        deliveryStatus.failureReason = details.reason || 'Unknown error';
    }
};
notificationSchema.methods.isExpired = function () {
    return !!(this.expiresAt && this.expiresAt <= new Date());
};
notificationSchema.methods.canRetryDelivery = function (channel) {
    const deliveryStatus = this.getDeliveryStatusForChannel(channel);
    if (!deliveryStatus)
        return true;
    if (['delivered', 'bounced'].includes(deliveryStatus.status)) {
        return false;
    }
    if (deliveryStatus.attempts >= 5) {
        return false;
    }
    if (this.isExpired()) {
        return false;
    }
    return true;
};
notificationSchema.methods.getDeliveryStatusForChannel = function (channel) {
    return this.deliveryStatus.find(ds => ds.channel === channel) || null;
};
notificationSchema.pre('save', function () {
    if (!this.expiresAt) {
        const now = new Date();
        switch (this.type) {
            case 'system_notification':
                this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'clinical_alert':
            case 'urgent_message':
                this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            default:
                this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
    }
    if (this.isNew) {
        const enabledChannels = [];
        if (this.deliveryChannels.inApp)
            enabledChannels.push('inApp');
        if (this.deliveryChannels.email)
            enabledChannels.push('email');
        if (this.deliveryChannels.sms)
            enabledChannels.push('sms');
        if (this.deliveryChannels.push)
            enabledChannels.push('push');
        this.deliveryStatus = enabledChannels.map(channel => ({
            channel: channel,
            status: 'pending',
            attempts: 0,
        }));
    }
    if (!this.scheduledFor && !this.sentAt) {
        this.sentAt = new Date();
    }
    if (!this.groupKey) {
        this.groupKey = `${this.type}_${this.data.conversationId || this.data.patientId || 'general'}`;
    }
});
notificationSchema.statics.findUnreadByUser = function (userId, workplaceId, options = {}) {
    const { limit = 50, type, priority } = options;
    const query = {
        userId,
        workplaceId,
        status: 'unread',
    };
    if (type) {
        query.type = type;
    }
    if (priority) {
        query.priority = priority;
    }
    return this.find(query)
        .populate('data.senderId', 'firstName lastName role')
        .populate('data.conversationId', 'title type')
        .populate('data.patientId', 'firstName lastName mrn')
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit);
};
notificationSchema.statics.findScheduledForDelivery = function (date = new Date()) {
    return this.find({
        scheduledFor: { $lte: date },
        status: 'unread',
        'deliveryStatus.status': { $in: ['pending', 'failed'] },
    })
        .populate('userId', 'notificationPreferences email phone')
        .sort({ priority: -1, scheduledFor: 1 });
};
notificationSchema.statics.markExpiredAsArchived = function () {
    return this.updateMany({
        expiresAt: { $lte: new Date() },
        status: { $ne: 'archived' },
    }, {
        $set: {
            status: 'archived',
            updatedAt: new Date(),
        },
    });
};
notificationSchema.statics.getUnreadCountByUser = function (userId, workplaceId) {
    return this.countDocuments({
        userId,
        workplaceId,
        status: 'unread',
    });
};
notificationSchema.statics.getNotificationStats = function (workplaceId, dateRange) {
    return this.aggregate([
        {
            $match: {
                workplaceId,
                createdAt: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                },
            },
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    status: '$status',
                    priority: '$priority',
                },
                count: { $sum: 1 },
                avgDeliveryTime: {
                    $avg: {
                        $subtract: ['$readAt', '$sentAt'],
                    },
                },
            },
        },
        {
            $sort: { '_id.priority': -1, count: -1 },
        },
    ]);
};
exports.default = mongoose_1.default.model('Notification', notificationSchema);
//# sourceMappingURL=Notification.js.map