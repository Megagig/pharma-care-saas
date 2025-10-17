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
const communicationAuditLogDetailsSchema = new mongoose_1.Schema({
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
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        index: true,
    },
    participantIds: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    fileId: {
        type: String,
        index: true,
    },
    fileName: {
        type: String,
        maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    oldValues: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    newValues: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { _id: false });
const communicationAuditLogSchema = new mongoose_1.Schema({
    action: {
        type: String,
        enum: [
            'message_sent', 'message_read', 'message_edited', 'message_deleted',
            'conversation_created', 'conversation_updated', 'conversation_archived',
            'participant_added', 'participant_removed', 'participant_left',
            'file_uploaded', 'file_downloaded', 'file_deleted',
            'notification_sent', 'notification_read', 'encryption_key_rotated',
            'conversation_exported', 'bulk_message_delete', 'conversation_search',
            'message_search', 'clinical_context_updated', 'priority_changed'
        ],
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    targetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        enum: ['conversation', 'message', 'user', 'file', 'notification'],
        required: true,
        index: true,
    },
    details: {
        type: communicationAuditLogDetailsSchema,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
        validate: {
            validator: function (ip) {
                const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
                return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === '127.0.0.1';
            },
            message: 'Invalid IP address format',
        },
    },
    userAgent: {
        type: String,
        required: true,
        maxlength: [1000, 'User agent cannot exceed 1000 characters'],
    },
    sessionId: {
        type: String,
        index: true,
        maxlength: [100, 'Session ID cannot exceed 100 characters'],
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true,
        default: 'low',
    },
    complianceCategory: {
        type: String,
        enum: [
            'communication_security', 'data_access', 'patient_privacy',
            'message_integrity', 'file_security', 'audit_trail',
            'encryption_compliance', 'notification_delivery'
        ],
        required: true,
        index: true,
        default: 'audit_trail',
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: -1,
    },
    success: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    errorMessage: {
        type: String,
        maxlength: [1000, 'Error message cannot exceed 1000 characters'],
    },
    duration: {
        type: Number,
        min: [0, 'Duration cannot be negative'],
        max: [300000, 'Duration cannot exceed 5 minutes'],
    },
}, {
    timestamps: true,
    collection: 'communication_audit_logs',
});
communicationAuditLogSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
communicationAuditLogSchema.index({ workplaceId: 1, timestamp: -1 });
communicationAuditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
communicationAuditLogSchema.index({ targetId: 1, targetType: 1, timestamp: -1 });
communicationAuditLogSchema.index({ action: 1, timestamp: -1 });
communicationAuditLogSchema.index({ riskLevel: 1, timestamp: -1 });
communicationAuditLogSchema.index({ complianceCategory: 1, timestamp: -1 });
communicationAuditLogSchema.index({ success: 1, timestamp: -1 });
communicationAuditLogSchema.index({ sessionId: 1, timestamp: -1 });
communicationAuditLogSchema.index({ workplaceId: 1, action: 1, success: 1, timestamp: -1 });
communicationAuditLogSchema.index({ userId: 1, riskLevel: 1, timestamp: -1 });
communicationAuditLogSchema.index({ workplaceId: 1, complianceCategory: 1, timestamp: -1 });
communicationAuditLogSchema.index({ 'details.conversationId': 1, timestamp: -1 });
communicationAuditLogSchema.index({ 'details.patientId': 1, timestamp: -1 });
communicationAuditLogSchema.index({ timestamp: 1 }, {
    expireAfterSeconds: 7 * 365 * 24 * 60 * 60
});
communicationAuditLogSchema.virtual('formattedTimestamp').get(function () {
    return this.timestamp.toISOString();
});
communicationAuditLogSchema.virtual('isRecent').get(function () {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.timestamp > oneDayAgo;
});
communicationAuditLogSchema.methods.setRiskLevel = function () {
    const highRiskActions = [
        'message_deleted', 'conversation_archived', 'participant_removed',
        'file_deleted', 'bulk_message_delete', 'encryption_key_rotated'
    ];
    const mediumRiskActions = [
        'message_edited', 'conversation_updated', 'participant_added',
        'file_uploaded', 'clinical_context_updated', 'priority_changed'
    ];
    const criticalRiskActions = [
        'conversation_exported'
    ];
    if (criticalRiskActions.includes(this.action)) {
        this.riskLevel = 'critical';
    }
    else if (highRiskActions.includes(this.action)) {
        this.riskLevel = 'high';
    }
    else if (mediumRiskActions.includes(this.action)) {
        this.riskLevel = 'medium';
    }
    else {
        this.riskLevel = 'low';
    }
    if (!this.success && this.riskLevel === 'low') {
        this.riskLevel = 'medium';
    }
    if (this.details.patientId && this.riskLevel === 'low') {
        this.riskLevel = 'medium';
    }
};
communicationAuditLogSchema.methods.isHighRisk = function () {
    return ['high', 'critical'].includes(this.riskLevel);
};
communicationAuditLogSchema.methods.getFormattedDetails = function () {
    const details = [];
    if (this.details.conversationId) {
        details.push(`Conversation: ${this.details.conversationId}`);
    }
    if (this.details.messageId) {
        details.push(`Message: ${this.details.messageId}`);
    }
    if (this.details.patientId) {
        details.push(`Patient: ${this.details.patientId}`);
    }
    if (this.details.fileName) {
        details.push(`File: ${this.details.fileName}`);
    }
    if (this.details.participantIds && this.details.participantIds.length > 0) {
        details.push(`Participants: ${this.details.participantIds.length}`);
    }
    if (this.errorMessage) {
        details.push(`Error: ${this.errorMessage}`);
    }
    return details.join(', ');
};
communicationAuditLogSchema.pre('validate', function () {
    if (!this.riskLevel) {
        this.setRiskLevel();
    }
    if (!this.complianceCategory) {
        const actionToCategoryMap = {
            'message_sent': 'communication_security',
            'message_read': 'data_access',
            'message_edited': 'message_integrity',
            'message_deleted': 'message_integrity',
            'conversation_created': 'communication_security',
            'conversation_updated': 'communication_security',
            'conversation_archived': 'audit_trail',
            'participant_added': 'patient_privacy',
            'participant_removed': 'patient_privacy',
            'participant_left': 'audit_trail',
            'file_uploaded': 'file_security',
            'file_downloaded': 'file_security',
            'file_deleted': 'file_security',
            'notification_sent': 'notification_delivery',
            'notification_read': 'notification_delivery',
            'encryption_key_rotated': 'encryption_compliance',
            'conversation_exported': 'data_access',
            'bulk_message_delete': 'message_integrity',
            'conversation_search': 'data_access',
            'message_search': 'data_access',
            'clinical_context_updated': 'patient_privacy',
            'priority_changed': 'communication_security',
        };
        this.complianceCategory = actionToCategoryMap[this.action] || 'audit_trail';
    }
});
communicationAuditLogSchema.statics.logAction = async function (action, userId, targetId, targetType, details, context) {
    const auditLog = new this({
        action,
        userId,
        targetId,
        targetType,
        details,
        workplaceId: context.workplaceId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        success: context.success !== false,
        errorMessage: context.errorMessage,
        duration: context.duration,
    });
    return await auditLog.save();
};
communicationAuditLogSchema.statics.findByConversation = function (conversationId, workplaceId, options = {}) {
    const { limit = 100, startDate, endDate } = options;
    const query = {
        workplaceId,
        'details.conversationId': conversationId,
    };
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate)
            query.timestamp.$gte = startDate;
        if (endDate)
            query.timestamp.$lte = endDate;
    }
    return this.find(query)
        .populate('userId', 'firstName lastName role')
        .sort({ timestamp: -1 })
        .limit(limit);
};
communicationAuditLogSchema.statics.findHighRiskActivities = function (workplaceId, timeRange) {
    return this.find({
        workplaceId,
        riskLevel: { $in: ['high', 'critical'] },
        timestamp: {
            $gte: timeRange.start,
            $lte: timeRange.end,
        },
    })
        .populate('userId', 'firstName lastName role')
        .sort({ timestamp: -1 });
};
communicationAuditLogSchema.statics.getComplianceReport = function (workplaceId, dateRange) {
    return this.aggregate([
        {
            $match: {
                workplaceId,
                timestamp: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                },
            },
        },
        {
            $group: {
                _id: {
                    complianceCategory: '$complianceCategory',
                    riskLevel: '$riskLevel',
                    success: '$success',
                },
                count: { $sum: 1 },
                avgDuration: { $avg: '$duration' },
                actions: { $addToSet: '$action' },
            },
        },
        {
            $sort: { '_id.riskLevel': -1, count: -1 },
        },
    ]);
};
communicationAuditLogSchema.statics.getUserActivitySummary = function (userId, workplaceId, dateRange) {
    return this.aggregate([
        {
            $match: {
                userId,
                workplaceId,
                timestamp: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                },
            },
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                lastActivity: { $max: '$timestamp' },
                successRate: {
                    $avg: { $cond: ['$success', 1, 0] },
                },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);
};
exports.default = mongoose_1.default.model('CommunicationAuditLog', communicationAuditLogSchema);
//# sourceMappingURL=CommunicationAuditLog.js.map