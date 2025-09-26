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
const drugTherapyProblemSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    visitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Visit',
        index: true,
    },
    reviewId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
        index: true,
    },
    category: {
        type: String,
        enum: tenancyGuard_1.DTP_CATEGORIES,
        required: [true, 'DTP category is required'],
        index: true,
    },
    subcategory: {
        type: String,
        trim: true,
        maxlength: [100, 'Subcategory cannot exceed 100 characters'],
    },
    type: {
        type: String,
        enum: tenancyGuard_1.DTP_TYPES,
        required: [true, 'DTP type is required'],
        index: true,
    },
    severity: {
        type: String,
        enum: tenancyGuard_1.DTP_SEVERITIES,
        required: [true, 'DTP severity is required'],
        index: true,
    },
    description: {
        type: String,
        required: [true, 'DTP description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    clinicalSignificance: {
        type: String,
        required: [true, 'Clinical significance is required'],
        trim: true,
        maxlength: [1000, 'Clinical significance cannot exceed 1000 characters'],
    },
    affectedMedications: [
        {
            type: String,
            trim: true,
            maxlength: [200, 'Medication name cannot exceed 200 characters'],
        },
    ],
    relatedConditions: [
        {
            type: String,
            trim: true,
            maxlength: [200, 'Condition cannot exceed 200 characters'],
        },
    ],
    evidenceLevel: {
        type: String,
        enum: tenancyGuard_1.EVIDENCE_LEVELS,
        required: [true, 'Evidence level is required'],
        index: true,
    },
    riskFactors: [
        {
            type: String,
            trim: true,
            maxlength: [200, 'Risk factor cannot exceed 200 characters'],
        },
    ],
    status: {
        type: String,
        enum: ['identified', 'addressed', 'monitoring', 'resolved', 'not_applicable'],
        default: 'identified',
        required: true,
        index: true,
    },
    resolution: {
        action: {
            type: String,
            trim: true,
            maxlength: [1000, 'Resolution action cannot exceed 1000 characters'],
        },
        outcome: {
            type: String,
            trim: true,
            maxlength: [1000, 'Resolution outcome cannot exceed 1000 characters'],
        },
        resolvedAt: Date,
        resolvedBy: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    identifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    identifiedAt: {
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
(0, tenancyGuard_1.addAuditFields)(drugTherapyProblemSchema);
drugTherapyProblemSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
drugTherapyProblemSchema.index({ workplaceId: 1, patientId: 1, status: 1 });
drugTherapyProblemSchema.index({ workplaceId: 1, reviewId: 1 });
drugTherapyProblemSchema.index({ workplaceId: 1, type: 1, severity: 1 });
drugTherapyProblemSchema.index({ workplaceId: 1, category: 1 });
drugTherapyProblemSchema.index({ workplaceId: 1, visitId: 1 });
drugTherapyProblemSchema.index({ workplaceId: 1, isDeleted: 1 });
drugTherapyProblemSchema.index({ status: 1, identifiedAt: -1 });
drugTherapyProblemSchema.index({ severity: 1, status: 1 });
drugTherapyProblemSchema.index({ evidenceLevel: 1 });
drugTherapyProblemSchema.index({ 'resolution.resolvedAt': -1 }, { sparse: true });
drugTherapyProblemSchema.index({ identifiedBy: 1, identifiedAt: -1 });
drugTherapyProblemSchema.index({ createdAt: -1 });
drugTherapyProblemSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
drugTherapyProblemSchema.virtual('visit', {
    ref: 'Visit',
    localField: 'visitId',
    foreignField: '_id',
    justOne: true,
});
drugTherapyProblemSchema
    .virtual('resolutionDurationDays')
    .get(function () {
    if (this.resolution?.resolvedAt && this.identifiedAt) {
        const diffTime = Math.abs(this.resolution.resolvedAt.getTime() - this.identifiedAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
});
drugTherapyProblemSchema
    .virtual('priority')
    .get(function () {
    if (this.severity === 'critical')
        return 'high';
    if (this.severity === 'major' && ['definite', 'probable'].includes(this.evidenceLevel))
        return 'high';
    if (this.severity === 'major')
        return 'medium';
    if (this.severity === 'moderate' && this.evidenceLevel === 'definite')
        return 'medium';
    return 'low';
});
drugTherapyProblemSchema
    .virtual('typeDisplay')
    .get(function () {
    const typeMap = {
        unnecessary: 'Unnecessary Medication',
        wrongDrug: 'Wrong Drug/Indication',
        doseTooLow: 'Dose Too Low',
        doseTooHigh: 'Dose Too High',
        adverseReaction: 'Adverse Reaction',
        inappropriateAdherence: 'Inappropriate Adherence',
        needsAdditional: 'Needs Additional Medication',
        interaction: 'Drug Interaction',
        duplication: 'Duplicate Therapy',
        contraindication: 'Contraindication',
        monitoring: 'Monitoring Required',
    };
    return typeMap[this.type] || this.type;
});
drugTherapyProblemSchema.pre('save', function () {
    if (this.isModified('status') &&
        this.status === 'resolved' &&
        (!this.resolution || !this.resolution.resolvedAt)) {
        if (!this.resolution) {
            this.resolution = {
                action: 'Status updated to resolved',
                outcome: 'Problem resolved',
                resolvedAt: new Date(),
            };
        }
        else {
            this.resolution.resolvedAt = new Date();
        }
    }
    if (this.isModified('status') && this.status !== 'resolved') {
        if (this.resolution) {
            this.resolution.resolvedAt = undefined;
        }
    }
    if (['critical', 'major'].includes(this.severity) &&
        this.description.trim().length < 20) {
        throw new Error(`${this.severity} severity DTPs require detailed description (minimum 20 characters)`);
    }
    if (['definite', 'probable'].includes(this.evidenceLevel) &&
        (!this.clinicalSignificance || this.clinicalSignificance.trim().length < 10)) {
        throw new Error(`DTPs with ${this.evidenceLevel} evidence level require clinical significance explanation`);
    }
});
drugTherapyProblemSchema.post('save', async function () {
    try {
        const Patient = mongoose_1.default.model('Patient');
        const activeDTPCount = await mongoose_1.default
            .model('DrugTherapyProblem')
            .countDocuments({
            patientId: this.patientId,
            workplaceId: this.workplaceId,
            status: { $in: ['identified', 'addressed', 'monitoring'] },
            isDeleted: { $ne: true },
        });
        await Patient.findByIdAndUpdate(this.patientId, { hasActiveDTP: activeDTPCount > 0 }, { new: true });
    }
    catch (error) {
        console.error('Error updating patient hasActiveDTP flag:', error);
    }
});
drugTherapyProblemSchema.statics.findByPatient = function (patientId, status, workplaceId) {
    const query = { patientId };
    if (status) {
        query.status = status;
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ status: 1, createdAt: -1 });
};
drugTherapyProblemSchema.statics.findByType = function (type, status, workplaceId) {
    const query = { type };
    if (status) {
        query.status = status;
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ createdAt: -1 });
};
drugTherapyProblemSchema.statics.findActive = function (workplaceId) {
    const query = { status: { $in: ['identified', 'addressed', 'monitoring'] } };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ severity: 1, identifiedAt: -1 });
};
drugTherapyProblemSchema.statics.findByReview = function (reviewId, workplaceId) {
    const query = { reviewId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ severity: 1, identifiedAt: -1 });
};
drugTherapyProblemSchema.statics.getStatistics = async function (workplaceId, dateRange) {
    const matchStage = {};
    if (workplaceId) {
        matchStage.workplaceId = workplaceId;
    }
    if (dateRange) {
        matchStage.createdAt = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalDTPs: { $sum: 1 },
                unresolvedDTPs: {
                    $sum: { $cond: [{ $eq: ['$status', 'unresolved'] }, 1, 0] },
                },
                resolvedDTPs: {
                    $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                },
                dtpsByType: {
                    $push: {
                        type: '$type',
                        status: '$status',
                    },
                },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', 'resolved'] },
                            {
                                $divide: [
                                    { $subtract: ['$resolvedAt', '$createdAt'] },
                                    1000 * 60 * 60 * 24,
                                ],
                            },
                            null,
                        ],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalDTPs: 1,
                unresolvedDTPs: 1,
                resolvedDTPs: 1,
                resolutionRate: {
                    $cond: [
                        { $gt: ['$totalDTPs', 0] },
                        { $multiply: [{ $divide: ['$resolvedDTPs', '$totalDTPs'] }, 100] },
                        0,
                    ],
                },
                avgResolutionTimeDays: { $round: ['$avgResolutionTime', 1] },
                dtpsByType: 1,
            },
        },
    ];
    const result = await this.aggregate(pipeline);
    return (result[0] || {
        totalDTPs: 0,
        unresolvedDTPs: 0,
        resolvedDTPs: 0,
        resolutionRate: 0,
        avgResolutionTimeDays: 0,
        dtpsByType: [],
    });
};
drugTherapyProblemSchema.methods.resolve = function (action, outcome, resolvedBy) {
    this.status = 'resolved';
    this.resolution = {
        action,
        outcome,
        resolvedAt: new Date(),
        resolvedBy,
    };
    if (resolvedBy) {
        this.updatedBy = resolvedBy;
    }
};
drugTherapyProblemSchema.methods.reopen = function (reopenedBy) {
    this.status = 'identified';
    if (this.resolution) {
        this.resolution.resolvedAt = undefined;
    }
    if (reopenedBy) {
        this.updatedBy = reopenedBy;
    }
};
drugTherapyProblemSchema.methods.isHighSeverity = function () {
    return ['critical', 'major'].includes(this.severity);
};
drugTherapyProblemSchema.methods.isCritical = function () {
    return this.severity === 'critical';
};
drugTherapyProblemSchema.methods.isOverdue = function () {
    if (this.status === 'resolved')
        return false;
    const daysSinceIdentification = Math.floor((Date.now() - this.identifiedAt.getTime()) / (1000 * 60 * 60 * 24));
    const overdueThresholds = {
        critical: 1,
        major: 3,
        moderate: 7,
        minor: 14,
    };
    const threshold = overdueThresholds[this.severity] || 7;
    return daysSinceIdentification > threshold;
};
exports.default = mongoose_1.default.model('DrugTherapyProblem', drugTherapyProblemSchema);
//# sourceMappingURL=DrugTherapyProblem.js.map