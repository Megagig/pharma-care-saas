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
    pharmacyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Pharmacy',
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
    type: {
        type: String,
        enum: tenancyGuard_1.DTP_TYPES,
        required: [true, 'DTP type is required'],
        index: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
        type: String,
        enum: ['unresolved', 'resolved'],
        default: 'unresolved',
        required: true,
        index: true,
    },
    resolvedAt: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value) {
                    return value >= this.createdAt;
                }
                return true;
            },
            message: 'Resolved date cannot be before DTP creation',
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(drugTherapyProblemSchema);
drugTherapyProblemSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
drugTherapyProblemSchema.index({ pharmacyId: 1, patientId: 1, status: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, type: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, visitId: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, isDeleted: 1 });
drugTherapyProblemSchema.index({ status: 1, createdAt: -1 });
drugTherapyProblemSchema.index({ resolvedAt: -1 }, { sparse: true });
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
    if (this.resolvedAt && this.createdAt) {
        const diffTime = Math.abs(this.resolvedAt.getTime() - this.createdAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
});
drugTherapyProblemSchema
    .virtual('severity')
    .get(function () {
    const severityMap = {
        adverseReaction: 'high',
        wrongDrug: 'high',
        doseTooHigh: 'medium',
        doseTooLow: 'medium',
        unnecessary: 'medium',
        inappropriateAdherence: 'medium',
        needsAdditional: 'low',
    };
    return severityMap[this.type] || 'medium';
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
    };
    return typeMap[this.type] || this.type;
});
drugTherapyProblemSchema.pre('save', function () {
    if (this.isModified('status') &&
        this.status === 'resolved' &&
        !this.resolvedAt) {
        this.resolvedAt = new Date();
    }
    if (this.isModified('status') && this.status === 'unresolved') {
        this.resolvedAt = undefined;
    }
    const highSeverityTypes = ['adverseReaction', 'wrongDrug'];
    if (highSeverityTypes.includes(this.type) &&
        (!this.description || this.description.trim().length < 10)) {
        throw new Error(`DTP type '${this.type}' requires detailed description (minimum 10 characters)`);
    }
});
drugTherapyProblemSchema.post('save', async function () {
    try {
        const Patient = mongoose_1.default.model('Patient');
        const activeDTPCount = await mongoose_1.default
            .model('DrugTherapyProblem')
            .countDocuments({
            patientId: this.patientId,
            pharmacyId: this.pharmacyId,
            status: 'unresolved',
            isDeleted: { $ne: true },
        });
        await Patient.findByIdAndUpdate(this.patientId, { hasActiveDTP: activeDTPCount > 0 }, { new: true });
    }
    catch (error) {
        console.error('Error updating patient hasActiveDTP flag:', error);
    }
});
drugTherapyProblemSchema.statics.findByPatient = function (patientId, status, pharmacyId) {
    const query = { patientId };
    if (status) {
        query.status = status;
    }
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ status: 1, createdAt: -1 });
};
drugTherapyProblemSchema.statics.findByType = function (type, status, pharmacyId) {
    const query = { type };
    if (status) {
        query.status = status;
    }
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ createdAt: -1 });
};
drugTherapyProblemSchema.statics.findUnresolved = function (pharmacyId) {
    const query = { status: 'unresolved' };
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ createdAt: -1 });
};
drugTherapyProblemSchema.statics.getStatistics = async function (pharmacyId, dateRange) {
    const matchStage = {};
    if (pharmacyId) {
        matchStage.pharmacyId = pharmacyId;
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
drugTherapyProblemSchema.methods.resolve = function (resolvedBy) {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    if (resolvedBy) {
        this.updatedBy = resolvedBy;
    }
};
drugTherapyProblemSchema.methods.reopen = function (reopenedBy) {
    this.status = 'unresolved';
    this.resolvedAt = undefined;
    if (reopenedBy) {
        this.updatedBy = reopenedBy;
    }
};
drugTherapyProblemSchema.methods.isHighSeverity = function () {
    return ['adverseReaction', 'wrongDrug'].includes(this.type);
};
drugTherapyProblemSchema.methods.isOverdue = function () {
    if (this.status === 'resolved')
        return false;
    const daysSinceCreation = Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const overdueThreshold = this.get('severity') === 'high' ? 1 : 7;
    return daysSinceCreation > overdueThreshold;
};
exports.default = mongoose_1.default.model('DrugTherapyProblem', drugTherapyProblemSchema);
//# sourceMappingURL=DrugTherapyProblem.js.map