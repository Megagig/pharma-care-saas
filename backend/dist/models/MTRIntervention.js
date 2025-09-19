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
const mtrInterventionSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    reviewId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['recommendation', 'counseling', 'monitoring', 'communication', 'education'],
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: ['medication_change', 'adherence_support', 'monitoring_plan', 'patient_education'],
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Intervention description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    rationale: {
        type: String,
        required: [true, 'Intervention rationale is required'],
        trim: true,
        maxlength: [1000, 'Rationale cannot exceed 1000 characters'],
    },
    targetAudience: {
        type: String,
        enum: ['patient', 'prescriber', 'caregiver', 'healthcare_team'],
        required: true,
        index: true,
    },
    communicationMethod: {
        type: String,
        enum: ['verbal', 'written', 'phone', 'email', 'fax', 'in_person'],
        required: true,
        index: true,
    },
    outcome: {
        type: String,
        enum: ['accepted', 'rejected', 'modified', 'pending', 'not_applicable'],
        default: 'pending',
        required: true,
        index: true,
    },
    outcomeDetails: {
        type: String,
        trim: true,
        maxlength: [1000, 'Outcome details cannot exceed 1000 characters'],
    },
    acceptanceRate: {
        type: Number,
        min: [0, 'Acceptance rate cannot be negative'],
        max: [100, 'Acceptance rate cannot exceed 100'],
    },
    followUpRequired: {
        type: Boolean,
        default: false,
        index: true,
    },
    followUpDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value && this.followUpRequired) {
                    return value > this.performedAt;
                }
                return true;
            },
            message: 'Follow-up date must be after intervention date',
        },
        index: true,
    },
    followUpCompleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    documentation: {
        type: String,
        required: [true, 'Documentation is required'],
        trim: true,
        maxlength: [2000, 'Documentation cannot exceed 2000 characters'],
    },
    attachments: [
        {
            type: String,
            trim: true,
            maxlength: [500, 'Attachment path cannot exceed 500 characters'],
        },
    ],
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
        required: true,
        index: true,
    },
    urgency: {
        type: String,
        enum: ['immediate', 'within_24h', 'within_week', 'routine'],
        default: 'routine',
        required: true,
        index: true,
    },
    pharmacistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    performedAt: {
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
(0, tenancyGuard_1.addAuditFields)(mtrInterventionSchema);
mtrInterventionSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
mtrInterventionSchema.index({ workplaceId: 1, reviewId: 1, type: 1 });
mtrInterventionSchema.index({ workplaceId: 1, patientId: 1, outcome: 1 });
mtrInterventionSchema.index({ workplaceId: 1, pharmacistId: 1 });
mtrInterventionSchema.index({ workplaceId: 1, category: 1 });
mtrInterventionSchema.index({ workplaceId: 1, isDeleted: 1 });
mtrInterventionSchema.index({ outcome: 1, performedAt: -1 });
mtrInterventionSchema.index({ followUpRequired: 1, followUpDate: 1 });
mtrInterventionSchema.index({ followUpCompleted: 1 }, { sparse: true });
mtrInterventionSchema.index({ priority: 1, urgency: 1 });
mtrInterventionSchema.index({ createdAt: -1 });
mtrInterventionSchema.virtual('daysSinceIntervention').get(function () {
    const diffTime = Math.abs(Date.now() - this.performedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
mtrInterventionSchema.virtual('followUpStatus').get(function () {
    if (!this.followUpRequired)
        return 'not_required';
    if (this.followUpCompleted)
        return 'completed';
    if (this.followUpDate && this.followUpDate < new Date())
        return 'overdue';
    return 'pending';
});
mtrInterventionSchema.virtual('isEffective').get(function () {
    return ['accepted', 'modified'].includes(this.outcome);
});
mtrInterventionSchema.methods.isOverdue = function () {
    if (!this.followUpRequired || this.followUpCompleted)
        return false;
    if (!this.followUpDate)
        return false;
    return this.followUpDate < new Date();
};
mtrInterventionSchema.methods.markCompleted = function (outcome, details) {
    this.outcome = outcome;
    if (details) {
        this.outcomeDetails = details;
    }
    if (this.followUpRequired && ['accepted', 'modified'].includes(outcome)) {
        this.followUpCompleted = true;
    }
};
mtrInterventionSchema.methods.requiresFollowUp = function () {
    return this.followUpRequired && !this.followUpCompleted;
};
mtrInterventionSchema.pre('save', function () {
    if (this.followUpRequired && !this.followUpDate) {
        const daysToAdd = {
            immediate: 1,
            within_24h: 1,
            within_week: 7,
            routine: 14,
        };
        const days = daysToAdd[this.urgency] || 14;
        this.followUpDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    if (!this.followUpRequired) {
        this.followUpDate = undefined;
        this.followUpCompleted = false;
    }
    if (this.priority === 'high' && this.documentation.length < 50) {
        throw new Error('High priority interventions require detailed documentation (minimum 50 characters)');
    }
});
mtrInterventionSchema.statics.findByReview = function (reviewId, workplaceId) {
    const query = { reviewId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, performedAt: -1 });
};
mtrInterventionSchema.statics.findByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ performedAt: -1 });
};
mtrInterventionSchema.statics.findPending = function (workplaceId) {
    const query = { outcome: 'pending' };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, urgency: 1, performedAt: 1 });
};
mtrInterventionSchema.statics.findOverdueFollowUps = function (workplaceId) {
    const query = {
        followUpRequired: true,
        followUpCompleted: false,
        followUpDate: { $lt: new Date() },
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ followUpDate: 1 });
};
mtrInterventionSchema.statics.getStatistics = async function (workplaceId, dateRange) {
    const matchStage = {};
    if (workplaceId) {
        matchStage.workplaceId = workplaceId;
    }
    if (dateRange) {
        matchStage.performedAt = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalInterventions: { $sum: 1 },
                acceptedInterventions: {
                    $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
                },
                rejectedInterventions: {
                    $sum: { $cond: [{ $eq: ['$outcome', 'rejected'] }, 1, 0] },
                },
                modifiedInterventions: {
                    $sum: { $cond: [{ $eq: ['$outcome', 'modified'] }, 1, 0] },
                },
                pendingInterventions: {
                    $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] },
                },
                interventionsByType: {
                    $push: {
                        type: '$type',
                        category: '$category',
                        outcome: '$outcome',
                    },
                },
                interventionsByPriority: {
                    $push: {
                        priority: '$priority',
                        urgency: '$urgency',
                        outcome: '$outcome',
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalInterventions: 1,
                acceptedInterventions: 1,
                rejectedInterventions: 1,
                modifiedInterventions: 1,
                pendingInterventions: 1,
                acceptanceRate: {
                    $cond: [
                        { $gt: ['$totalInterventions', 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $add: ['$acceptedInterventions', '$modifiedInterventions'] },
                                        '$totalInterventions',
                                    ],
                                },
                                100,
                            ],
                        },
                        0,
                    ],
                },
                interventionsByType: 1,
                interventionsByPriority: 1,
            },
        },
    ];
    const result = await this.aggregate(pipeline);
    return (result[0] || {
        totalInterventions: 0,
        acceptedInterventions: 0,
        rejectedInterventions: 0,
        modifiedInterventions: 0,
        pendingInterventions: 0,
        acceptanceRate: 0,
        interventionsByType: [],
        interventionsByPriority: [],
    });
};
exports.default = mongoose_1.default.model('MTRIntervention', mtrInterventionSchema);
//# sourceMappingURL=MTRIntervention.js.map