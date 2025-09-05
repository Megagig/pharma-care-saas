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
const mtrAuditLogSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        trim: true,
        maxlength: [100, 'Action cannot exceed 100 characters'],
        index: true,
    },
    resourceType: {
        type: String,
        enum: [
            'MedicationTherapyReview',
            'DrugTherapyProblem',
            'MTRIntervention',
            'MTRFollowUp',
            'Patient',
            'User',
            'ClinicalNote',
        ],
        required: [true, 'Resource type is required'],
        index: true,
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Resource ID is required'],
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    userRole: {
        type: String,
        required: [true, 'User role is required'],
        trim: true,
        maxlength: [50, 'User role cannot exceed 50 characters'],
        index: true,
    },
    sessionId: {
        type: String,
        trim: true,
        maxlength: [100, 'Session ID cannot exceed 100 characters'],
        index: true,
    },
    ipAddress: {
        type: String,
        trim: true,
        maxlength: [45, 'IP address cannot exceed 45 characters'],
        index: true,
    },
    userAgent: {
        type: String,
        trim: true,
        maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    requestMethod: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        index: true,
    },
    requestUrl: {
        type: String,
        trim: true,
        maxlength: [500, 'Request URL cannot exceed 500 characters'],
    },
    oldValues: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    newValues: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    changedFields: [
        {
            type: String,
            trim: true,
            maxlength: [100, 'Field name cannot exceed 100 characters'],
        },
    ],
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        index: true,
    },
    reviewId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
        index: true,
    },
    complianceCategory: {
        type: String,
        enum: [
            'clinical_documentation',
            'patient_safety',
            'data_access',
            'system_security',
            'workflow_compliance',
        ],
        required: [true, 'Compliance category is required'],
        index: true,
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
        required: true,
        index: true,
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    errorMessage: {
        type: String,
        trim: true,
        maxlength: [1000, 'Error message cannot exceed 1000 characters'],
    },
    duration: {
        type: Number,
        min: [0, 'Duration cannot be negative'],
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(mtrAuditLogSchema);
mtrAuditLogSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
mtrAuditLogSchema.index({ workplaceId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ workplaceId: 1, userId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ workplaceId: 1, action: 1, timestamp: -1 });
mtrAuditLogSchema.index({ workplaceId: 1, resourceType: 1, timestamp: -1 });
mtrAuditLogSchema.index({
    workplaceId: 1,
    complianceCategory: 1,
    timestamp: -1,
});
mtrAuditLogSchema.index({ workplaceId: 1, riskLevel: 1, timestamp: -1 });
mtrAuditLogSchema.index({ workplaceId: 1, patientId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ workplaceId: 1, reviewId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ ipAddress: 1, timestamp: -1 });
mtrAuditLogSchema.index({ sessionId: 1, timestamp: -1 });
mtrAuditLogSchema.index({ createdAt: -1 });
mtrAuditLogSchema.index({
    workplaceId: 1,
    action: 1,
    resourceType: 1,
    timestamp: -1,
});
mtrAuditLogSchema.index({
    workplaceId: 1,
    userId: 1,
    complianceCategory: 1,
    timestamp: -1,
});
mtrAuditLogSchema.virtual('actionDisplay').get(function () {
    const actionMap = {
        CREATE_MTR_SESSION: 'Created MTR Session',
        UPDATE_MTR_SESSION: 'Updated MTR Session',
        DELETE_MTR_SESSION: 'Deleted MTR Session',
        COMPLETE_MTR_SESSION: 'Completed MTR Session',
        CREATE_MTR_PROBLEM: 'Identified Drug Therapy Problem',
        UPDATE_MTR_PROBLEM: 'Updated Drug Therapy Problem',
        RESOLVE_MTR_PROBLEM: 'Resolved Drug Therapy Problem',
        DELETE_MTR_PROBLEM: 'Deleted Drug Therapy Problem',
        CREATE_MTR_INTERVENTION: 'Recorded Intervention',
        UPDATE_MTR_INTERVENTION: 'Updated Intervention',
        DELETE_MTR_INTERVENTION: 'Deleted Intervention',
        CREATE_MTR_FOLLOWUP: 'Scheduled Follow-up',
        UPDATE_MTR_FOLLOWUP: 'Updated Follow-up',
        COMPLETE_MTR_FOLLOWUP: 'Completed Follow-up',
        DELETE_MTR_FOLLOWUP: 'Deleted Follow-up',
        ACCESS_PATIENT_DATA: 'Accessed Patient Data',
        EXPORT_MTR_DATA: 'Exported MTR Data',
        LOGIN: 'User Login',
        LOGOUT: 'User Logout',
        FAILED_LOGIN: 'Failed Login Attempt',
    };
    return actionMap[this.action] || this.action;
});
mtrAuditLogSchema
    .virtual('riskLevelDisplay')
    .get(function () {
    const riskMap = {
        low: 'Low Risk',
        medium: 'Medium Risk',
        high: 'High Risk',
        critical: 'Critical Risk',
    };
    return riskMap[this.riskLevel];
});
mtrAuditLogSchema
    .virtual('complianceCategoryDisplay')
    .get(function () {
    const categoryMap = {
        clinical_documentation: 'Clinical Documentation',
        patient_safety: 'Patient Safety',
        data_access: 'Data Access',
        system_security: 'System Security',
        workflow_compliance: 'Workflow Compliance',
    };
    return categoryMap[this.complianceCategory];
});
mtrAuditLogSchema.statics.createAuditLog = async function (auditData) {
    const auditLog = new this(auditData);
    return await auditLog.save();
};
mtrAuditLogSchema.statics.findWithFilters = function (workplaceId, filters = {}, options = {}) {
    const query = { workplaceId };
    if (filters.userId)
        query.userId = filters.userId;
    if (filters.action)
        query.action = filters.action;
    if (filters.resourceType)
        query.resourceType = filters.resourceType;
    if (filters.complianceCategory)
        query.complianceCategory = filters.complianceCategory;
    if (filters.riskLevel)
        query.riskLevel = filters.riskLevel;
    if (filters.patientId)
        query.patientId = filters.patientId;
    if (filters.reviewId)
        query.reviewId = filters.reviewId;
    if (filters.ipAddress)
        query.ipAddress = filters.ipAddress;
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate)
            query.timestamp.$gte = filters.startDate;
        if (filters.endDate)
            query.timestamp.$lte = filters.endDate;
    }
    const baseQuery = this.find(query)
        .populate('userId', 'firstName lastName email role')
        .populate('patientId', 'firstName lastName mrn')
        .populate('reviewId', 'reviewNumber status');
    const sortBy = options.sort || '-timestamp';
    baseQuery.sort(sortBy);
    if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        baseQuery.skip(skip).limit(options.limit);
    }
    return baseQuery;
};
mtrAuditLogSchema.statics.getAuditStatistics = async function (workplaceId, dateRange) {
    const matchStage = { workplaceId };
    if (dateRange) {
        matchStage.timestamp = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalLogs: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                actionsByType: {
                    $push: {
                        action: '$action',
                        resourceType: '$resourceType',
                        complianceCategory: '$complianceCategory',
                        riskLevel: '$riskLevel',
                    },
                },
                riskDistribution: {
                    $push: '$riskLevel',
                },
                complianceDistribution: {
                    $push: '$complianceCategory',
                },
                avgDuration: { $avg: '$duration' },
                errorCount: {
                    $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalLogs: 1,
                uniqueUserCount: { $size: '$uniqueUsers' },
                actionsByType: 1,
                riskDistribution: 1,
                complianceDistribution: 1,
                avgDurationMs: { $round: ['$avgDuration', 2] },
                errorCount: 1,
                errorRate: {
                    $cond: [
                        { $gt: ['$totalLogs', 0] },
                        { $multiply: [{ $divide: ['$errorCount', '$totalLogs'] }, 100] },
                        0,
                    ],
                },
            },
        },
    ];
    const result = await this.aggregate(pipeline);
    return (result[0] || {
        totalLogs: 0,
        uniqueUserCount: 0,
        actionsByType: [],
        riskDistribution: [],
        complianceDistribution: [],
        avgDurationMs: 0,
        errorCount: 0,
        errorRate: 0,
    });
};
mtrAuditLogSchema.statics.findHighRiskActivities = function (workplaceId, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
        workplaceId,
        riskLevel: { $in: ['high', 'critical'] },
        timestamp: { $gte: startTime },
    })
        .populate('userId', 'firstName lastName email')
        .populate('patientId', 'firstName lastName mrn')
        .sort({ timestamp: -1 });
};
mtrAuditLogSchema.statics.findSuspiciousActivities = function (workplaceId, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        {
            $match: {
                workplaceId,
                timestamp: { $gte: startTime },
            },
        },
        {
            $group: {
                _id: {
                    userId: '$userId',
                    ipAddress: '$ipAddress',
                },
                actionCount: { $sum: 1 },
                uniqueActions: { $addToSet: '$action' },
                errorCount: {
                    $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                },
                firstActivity: { $min: '$timestamp' },
                lastActivity: { $max: '$timestamp' },
            },
        },
        {
            $match: {
                $or: [
                    { actionCount: { $gt: 100 } },
                    { errorCount: { $gt: 10 } },
                    { 'uniqueActions.10': { $exists: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id.userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $project: {
                userId: '$_id.userId',
                ipAddress: '$_id.ipAddress',
                actionCount: 1,
                uniqueActionCount: { $size: '$uniqueActions' },
                errorCount: 1,
                errorRate: {
                    $multiply: [{ $divide: ['$errorCount', '$actionCount'] }, 100],
                },
                firstActivity: 1,
                lastActivity: 1,
                user: { $arrayElemAt: ['$user', 0] },
            },
        },
        { $sort: { actionCount: -1 } },
    ]);
};
exports.default = mongoose_1.default.model('MTRAuditLog', mtrAuditLogSchema);
//# sourceMappingURL=MTRAuditLog.js.map