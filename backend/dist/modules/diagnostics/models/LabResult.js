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
const tenancyGuard_1 = require("../../../utils/tenancyGuard");
const referenceRangeSchema = new mongoose_1.Schema({
    low: {
        type: Number
    },
    high: {
        type: Number
    },
    text: {
        type: String,
        trim: true,
        maxlength: [200, 'Reference range text cannot exceed 200 characters']
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    ageGroup: {
        type: String,
        trim: true,
        maxlength: [50, 'Age group cannot exceed 50 characters']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'all'],
        default: 'all'
    },
    condition: {
        type: String,
        trim: true,
        maxlength: [100, 'Condition cannot exceed 100 characters']
    }
}, { _id: false });
const deltaCheckSchema = new mongoose_1.Schema({
    previousValue: {
        type: String,
        trim: true
    },
    percentChange: {
        type: Number
    },
    significantChange: {
        type: Boolean,
        default: false
    }
}, { _id: false });
const labResultSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LabOrder',
        index: true,
        sparse: true
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    locationId: {
        type: String,
        index: true,
        sparse: true
    },
    testCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    testName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters'],
        index: true
    },
    testCategory: {
        type: String,
        trim: true,
        maxlength: [100, 'Test category cannot exceed 100 characters'],
        index: true
    },
    loincCode: {
        type: String,
        trim: true,
        maxlength: [20, 'LOINC code cannot exceed 20 characters'],
        index: true,
        sparse: true
    },
    value: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Result value cannot exceed 500 characters']
    },
    numericValue: {
        type: Number,
        index: true,
        sparse: true
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    referenceRange: {
        type: referenceRangeSchema,
        required: true
    },
    interpretation: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical', 'abnormal', 'inconclusive'],
        required: true,
        index: true
    },
    flags: {
        type: [String],
        default: [],
        validate: {
            validator: function (flags) {
                return flags.every(flag => flag.trim().length > 0);
            },
            message: 'Flags cannot be empty strings'
        }
    },
    criticalValue: {
        type: Boolean,
        default: false,
        index: true
    },
    deltaCheck: deltaCheckSchema,
    qualityFlags: {
        type: [String],
        default: []
    },
    technicalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Technical notes cannot exceed 1000 characters']
    },
    methodUsed: {
        type: String,
        trim: true,
        maxlength: [100, 'Method used cannot exceed 100 characters']
    },
    instrumentId: {
        type: String,
        trim: true,
        maxlength: [50, 'Instrument ID cannot exceed 50 characters']
    },
    specimenCollectedAt: {
        type: Date,
        index: true
    },
    performedAt: {
        type: Date,
        required: true,
        index: true
    },
    reportedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    recordedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    recordedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    source: {
        type: String,
        enum: ['manual', 'fhir', 'lis', 'external', 'imported'],
        required: true,
        default: 'manual',
        index: true
    },
    externalResultId: {
        type: String,
        trim: true,
        maxlength: [100, 'External result ID cannot exceed 100 characters'],
        index: true,
        sparse: true
    },
    fhirReference: {
        type: String,
        trim: true,
        maxlength: [200, 'FHIR reference cannot exceed 200 characters']
    },
    labSystemId: {
        type: String,
        trim: true,
        maxlength: [100, 'Lab system ID cannot exceed 100 characters'],
        index: true,
        sparse: true
    },
    clinicalNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Clinical notes cannot exceed 2000 characters']
    },
    followUpRequired: {
        type: Boolean,
        default: false,
        index: true
    },
    followUpInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'Follow-up instructions cannot exceed 1000 characters']
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date,
        index: true
    },
    reviewStatus: {
        type: String,
        enum: ['pending', 'reviewed', 'flagged', 'approved'],
        default: 'pending',
        required: true,
        index: true
    },
    reviewNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(labResultSchema);
labResultSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
labResultSchema.index({ workplaceId: 1, patientId: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, testCode: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, interpretation: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, criticalValue: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, reviewStatus: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, followUpRequired: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, locationId: 1, performedAt: -1 }, { sparse: true });
labResultSchema.index({ workplaceId: 1, orderId: 1 }, { sparse: true });
labResultSchema.index({ workplaceId: 1, isDeleted: 1, performedAt: -1 });
labResultSchema.index({
    testName: 'text',
    value: 'text',
    clinicalNotes: 'text',
    technicalNotes: 'text'
});
labResultSchema.virtual('isVerified').get(function () {
    return !!this.verifiedBy && !!this.verifiedAt;
});
labResultSchema.virtual('turnaroundTime').get(function () {
    if (this.specimenCollectedAt && this.reportedAt) {
        return this.reportedAt.getTime() - this.specimenCollectedAt.getTime();
    }
    return null;
});
labResultSchema.virtual('daysSinceResult').get(function () {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.performedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
labResultSchema.methods.interpretResult = function () {
    const { referenceRange, numericValue, interpretation } = this;
    if (interpretation === 'critical') {
        return 'CRITICAL - Immediate attention required';
    }
    if (numericValue !== undefined && referenceRange.low !== undefined && referenceRange.high !== undefined) {
        if (numericValue < referenceRange.low) {
            return `Below normal range (${referenceRange.low}-${referenceRange.high} ${referenceRange.unit || ''})`;
        }
        else if (numericValue > referenceRange.high) {
            return `Above normal range (${referenceRange.low}-${referenceRange.high} ${referenceRange.unit || ''})`;
        }
        else {
            return `Within normal range (${referenceRange.low}-${referenceRange.high} ${referenceRange.unit || ''})`;
        }
    }
    return referenceRange.text || 'See reference range for interpretation';
};
labResultSchema.methods.isCritical = function () {
    return this.criticalValue || this.interpretation === 'critical';
};
labResultSchema.methods.isAbnormal = function () {
    return ['low', 'high', 'critical', 'abnormal'].includes(this.interpretation);
};
labResultSchema.methods.calculatePercentChange = function (previousValue) {
    if (!this.numericValue || previousValue === 0)
        return 0;
    return ((this.numericValue - previousValue) / previousValue) * 100;
};
labResultSchema.methods.flagForReview = async function (reason, flaggedBy) {
    this.reviewStatus = 'flagged';
    this.reviewNotes = reason;
    this.updatedBy = flaggedBy;
    await this.save();
};
labResultSchema.methods.verify = async function (verifiedBy) {
    this.verifiedBy = verifiedBy;
    this.verifiedAt = new Date();
    this.reviewStatus = 'approved';
    this.updatedBy = verifiedBy;
    await this.save();
};
labResultSchema.methods.addClinicalNote = async function (note, addedBy) {
    const timestamp = new Date().toISOString();
    const noteWithTimestamp = `[${timestamp}] ${note}`;
    if (this.clinicalNotes) {
        this.clinicalNotes += '\n' + noteWithTimestamp;
    }
    else {
        this.clinicalNotes = noteWithTimestamp;
    }
    this.updatedBy = addedBy;
    await this.save();
};
labResultSchema.pre('save', function () {
    if (!this.numericValue && this.value) {
        const numericMatch = this.value.match(/^([+-]?\d*\.?\d+)/);
        if (numericMatch && numericMatch[1]) {
            this.numericValue = parseFloat(numericMatch[1]);
        }
    }
    if (this.numericValue !== undefined && this.referenceRange.low !== undefined && this.referenceRange.high !== undefined) {
        if (this.numericValue < this.referenceRange.low) {
            this.interpretation = 'low';
        }
        else if (this.numericValue > this.referenceRange.high) {
            this.interpretation = 'high';
        }
        else if (!this.interpretation) {
            this.interpretation = 'normal';
        }
    }
    if (this.interpretation === 'critical') {
        this.criticalValue = true;
    }
    if (this.isAbnormal() && this.followUpRequired === undefined) {
        this.followUpRequired = true;
    }
});
labResultSchema.statics.findByPatient = function (workplaceId, patientId) {
    return this.find({
        workplaceId,
        patientId,
        isDeleted: false
    }).sort({ performedAt: -1 });
};
labResultSchema.statics.findCriticalResults = function (workplaceId) {
    return this.find({
        workplaceId,
        criticalValue: true,
        isDeleted: false
    }).sort({ performedAt: -1 });
};
labResultSchema.statics.findAbnormalResults = function (workplaceId) {
    return this.find({
        workplaceId,
        interpretation: { $in: ['low', 'high', 'critical', 'abnormal'] },
        isDeleted: false
    }).sort({ performedAt: -1 });
};
labResultSchema.statics.findPendingReview = function (workplaceId) {
    return this.find({
        workplaceId,
        reviewStatus: { $in: ['pending', 'flagged'] },
        isDeleted: false
    }).sort({ performedAt: 1 });
};
labResultSchema.statics.findByTestCode = function (workplaceId, testCode) {
    return this.find({
        workplaceId,
        testCode: testCode.toUpperCase(),
        isDeleted: false
    }).sort({ performedAt: -1 });
};
labResultSchema.statics.findTrendData = function (workplaceId, patientId, testCode, fromDate, toDate) {
    const query = {
        workplaceId,
        patientId,
        testCode: testCode.toUpperCase(),
        numericValue: { $exists: true },
        isDeleted: false
    };
    if (fromDate || toDate) {
        query.performedAt = {};
        if (fromDate)
            query.performedAt.$gte = fromDate;
        if (toDate)
            query.performedAt.$lte = toDate;
    }
    return this.find(query).sort({ performedAt: 1 });
};
labResultSchema.statics.findRequiringFollowUp = function (workplaceId) {
    return this.find({
        workplaceId,
        followUpRequired: true,
        isDeleted: false
    }).sort({ performedAt: -1 });
};
exports.default = mongoose_1.default.model('LabResult', labResultSchema);
//# sourceMappingURL=LabResult.js.map