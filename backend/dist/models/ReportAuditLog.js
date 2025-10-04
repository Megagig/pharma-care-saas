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
const ReportAuditLogSchema = new mongoose_1.Schema({
    eventType: {
        type: String,
        required: true,
        enum: [
            'REPORT_VIEWED',
            'REPORT_GENERATED',
            'REPORT_EXPORTED',
            'REPORT_SCHEDULED',
            'REPORT_SHARED',
            'TEMPLATE_CREATED',
            'TEMPLATE_MODIFIED',
            'TEMPLATE_DELETED',
            'TEMPLATE_CLONED',
            'SCHEDULE_CREATED',
            'SCHEDULE_MODIFIED',
            'SCHEDULE_DELETED',
            'SCHEDULE_EXECUTED',
            'SCHEDULE_PAUSED',
            'SCHEDULE_RESUMED',
            'DATA_ACCESS',
            'FILTER_APPLIED',
            'PERMISSION_CHANGED',
            'BULK_EXPORT',
            'API_ACCESS',
            'UNAUTHORIZED_ACCESS',
            'SYSTEM_ERROR'
        ],
        index: true
    },
    reportType: {
        type: String,
        enum: [
            'patient-outcomes',
            'pharmacist-interventions',
            'therapy-effectiveness',
            'quality-improvement',
            'regulatory-compliance',
            'cost-effectiveness',
            'trend-forecasting',
            'operational-efficiency',
            'medication-inventory',
            'patient-demographics',
            'adverse-events',
            'custom'
        ],
        index: true
    },
    reportId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        index: true
    },
    templateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ReportTemplate',
        index: true
    },
    scheduleId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ReportSchedule',
        index: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        index: true
    },
    ipAddress: {
        type: String,
        index: true
    },
    userAgent: {
        type: String
    },
    eventDetails: {
        action: {
            type: String,
            required: true,
            enum: [
                'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'SHARE',
                'SCHEDULE', 'EXECUTE', 'PAUSE', 'RESUME', 'CLONE', 'ACCESS'
            ]
        },
        resource: {
            type: String,
            required: true,
            enum: [
                'REPORT', 'TEMPLATE', 'SCHEDULE', 'DATA', 'FILTER',
                'PERMISSION', 'EXPORT', 'API', 'SYSTEM'
            ]
        },
        resourceId: { type: String },
        filters: { type: mongoose_1.Schema.Types.Mixed },
        exportFormat: {
            type: String,
            enum: ['pdf', 'csv', 'excel', 'json']
        },
        recipients: [{ type: String }],
        duration: { type: Number, min: 0 },
        recordCount: { type: Number, min: 0 },
        fileSize: { type: Number, min: 0 },
        success: { type: Boolean, required: true, index: true },
        errorMessage: { type: String },
        metadata: { type: mongoose_1.Schema.Types.Mixed }
    },
    compliance: {
        dataAccessed: [{
                type: String,
                enum: [
                    'PATIENT_DATA', 'FINANCIAL_DATA', 'CLINICAL_DATA',
                    'PHARMACIST_DATA', 'MEDICATION_DATA', 'AUDIT_DATA',
                    'DEMOGRAPHIC_DATA', 'PERFORMANCE_DATA', 'SYSTEM_DATA'
                ]
            }],
        sensitiveData: { type: Boolean, required: true, index: true },
        retentionPeriod: { type: Number, min: 1 },
        anonymized: { type: Boolean, required: true },
        encryptionUsed: { type: Boolean, required: true },
        accessJustification: { type: String, maxlength: 500 }
    },
    performance: {
        queryTime: { type: Number, min: 0 },
        renderTime: { type: Number, min: 0 },
        exportTime: { type: Number, min: 0 },
        memoryUsage: { type: Number, min: 0 },
        cpuUsage: { type: Number, min: 0, max: 100 }
    },
    geolocation: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        coordinates: {
            latitude: { type: Number, min: -90, max: 90 },
            longitude: { type: Number, min: -180, max: 180 }
        }
    },
    deviceInfo: {
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'server'],
            default: 'desktop'
        },
        operatingSystem: { type: String },
        browser: { type: String },
        screenResolution: { type: String }
    },
    riskScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
        index: true
    },
    flagged: {
        type: Boolean,
        default: false,
        index: true
    },
    flagReason: {
        type: String,
        enum: [
            'HIGH_RISK_SCORE',
            'UNUSUAL_ACCESS_PATTERN',
            'BULK_DATA_ACCESS',
            'OFF_HOURS_ACCESS',
            'GEOGRAPHIC_ANOMALY',
            'MULTIPLE_FAILED_ATTEMPTS',
            'SENSITIVE_DATA_ACCESS',
            'UNAUTHORIZED_EXPORT',
            'SUSPICIOUS_ACTIVITY',
            'POLICY_VIOLATION'
        ]
    },
    reviewStatus: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
        index: true
    },
    reviewedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 1000 },
    relatedEvents: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'ReportAuditLog'
        }],
    tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }]
}, {
    timestamps: true,
    collection: 'reportauditlogs'
});
ReportAuditLogSchema.index({ workplaceId: 1, createdAt: -1 });
ReportAuditLogSchema.index({ userId: 1, createdAt: -1 });
ReportAuditLogSchema.index({ eventType: 1, createdAt: -1 });
ReportAuditLogSchema.index({ reportType: 1, createdAt: -1 });
ReportAuditLogSchema.index({ 'eventDetails.success': 1, createdAt: -1 });
ReportAuditLogSchema.index({ 'compliance.sensitiveData': 1, createdAt: -1 });
ReportAuditLogSchema.index({ riskScore: -1, createdAt: -1 });
ReportAuditLogSchema.index({ flagged: 1, reviewStatus: 1 });
ReportAuditLogSchema.index({ ipAddress: 1, createdAt: -1 });
ReportAuditLogSchema.index({ sessionId: 1, createdAt: -1 });
ReportAuditLogSchema.index({
    workplaceId: 1,
    eventType: 1,
    createdAt: -1
});
ReportAuditLogSchema.index({
    workplaceId: 1,
    userId: 1,
    'eventDetails.success': 1,
    createdAt: -1
});
ReportAuditLogSchema.index({
    workplaceId: 1,
    'compliance.sensitiveData': 1,
    riskScore: -1,
    createdAt: -1
});
ReportAuditLogSchema.index({
    'eventDetails.errorMessage': 'text',
    'compliance.accessJustification': 'text',
    'reviewNotes': 'text',
    'tags': 'text'
});
ReportAuditLogSchema.index({
    createdAt: 1
}, {
    expireAfterSeconds: 7 * 365 * 24 * 60 * 60
});
ReportAuditLogSchema.virtual('riskLevel').get(function () {
    if (this.riskScore >= 80)
        return 'critical';
    if (this.riskScore >= 60)
        return 'high';
    if (this.riskScore >= 40)
        return 'medium';
    if (this.riskScore >= 20)
        return 'low';
    return 'minimal';
});
ReportAuditLogSchema.virtual('eventSummary').get(function () {
    return `${this.eventDetails.action} ${this.eventDetails.resource}${this.eventDetails.resourceId ? ` (${this.eventDetails.resourceId})` : ''}`;
});
ReportAuditLogSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('eventDetails') || this.isModified('compliance')) {
        this.riskScore = this.calculateRiskScore();
        if (this.riskScore >= 70) {
            this.flagged = true;
            if (!this.flagReason) {
                this.flagReason = 'HIGH_RISK_SCORE';
            }
        }
    }
    next();
});
ReportAuditLogSchema.methods.calculateRiskScore = function () {
    let score = 0;
    const eventTypeScores = {
        'UNAUTHORIZED_ACCESS': 50,
        'BULK_EXPORT': 30,
        'DATA_ACCESS': 20,
        'REPORT_EXPORTED': 15,
        'PERMISSION_CHANGED': 25,
        'TEMPLATE_DELETED': 20,
        'SCHEDULE_DELETED': 20,
        'SYSTEM_ERROR': 10
    };
    score += eventTypeScores[this.eventType] || 5;
    if (this.compliance.sensitiveData) {
        score += 20;
    }
    if (!this.eventDetails.success) {
        score += 15;
    }
    if (this.eventDetails.recordCount && this.eventDetails.recordCount > 1000) {
        score += 10;
    }
    const hour = this.createdAt.getHours();
    if (hour < 8 || hour > 18) {
        score += 10;
    }
    const day = this.createdAt.getDay();
    if (day === 0 || day === 6) {
        score += 5;
    }
    if (this.eventDetails.recipients && this.eventDetails.recipients.length > 5) {
        score += 10;
    }
    if (this.compliance.sensitiveData && !this.compliance.anonymized) {
        score += 15;
    }
    if (this.compliance.sensitiveData && !this.compliance.encryptionUsed) {
        score += 20;
    }
    return Math.min(100, Math.max(0, score));
};
ReportAuditLogSchema.methods.flag = function (reason, reviewerId) {
    this.flagged = true;
    this.flagReason = reason;
    this.reviewStatus = 'pending';
    if (reviewerId) {
        this.reviewedBy = reviewerId;
    }
    return this.save();
};
ReportAuditLogSchema.methods.review = function (status, reviewerId, notes) {
    this.reviewStatus = status;
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    if (notes) {
        this.reviewNotes = notes;
    }
    return this.save();
};
ReportAuditLogSchema.statics.logEvent = function (eventData) {
    const auditLog = new this(eventData);
    return auditLog.save();
};
ReportAuditLogSchema.statics.getSecuritySummary = function (workplaceId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                flaggedEvents: { $sum: { $cond: ['$flagged', 1, 0] } },
                failedEvents: { $sum: { $cond: [{ $not: '$eventDetails.success' }, 1, 0] } },
                sensitiveDataAccess: { $sum: { $cond: ['$compliance.sensitiveData', 1, 0] } },
                avgRiskScore: { $avg: '$riskScore' },
                highRiskEvents: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } },
                uniqueUsers: { $addToSet: '$userId' },
                uniqueIPs: { $addToSet: '$ipAddress' }
            }
        },
        {
            $addFields: {
                uniqueUserCount: { $size: '$uniqueUsers' },
                uniqueIPCount: { $size: '$uniqueIPs' },
                flaggedPercentage: { $multiply: [{ $divide: ['$flaggedEvents', '$totalEvents'] }, 100] },
                failureRate: { $multiply: [{ $divide: ['$failedEvents', '$totalEvents'] }, 100] }
            }
        },
        {
            $project: {
                uniqueUsers: 0,
                uniqueIPs: 0
            }
        }
    ]);
};
ReportAuditLogSchema.statics.getUserActivity = function (userId, workplaceId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.find({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
        createdAt: { $gte: startDate }
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('templateId', 'name')
        .populate('scheduleId', 'name');
};
ReportAuditLogSchema.statics.getComplianceReport = function (workplaceId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    eventType: '$eventType',
                    sensitiveData: '$compliance.sensitiveData'
                },
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' },
                flaggedCount: { $sum: { $cond: ['$flagged', 1, 0] } }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};
exports.default = mongoose_1.default.model('ReportAuditLog', ReportAuditLogSchema);
//# sourceMappingURL=ReportAuditLog.js.map