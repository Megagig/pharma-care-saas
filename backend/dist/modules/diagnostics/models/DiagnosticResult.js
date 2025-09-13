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
const diagnosisSchema = new mongoose_1.Schema({
    condition: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Condition name cannot exceed 200 characters']
    },
    probability: {
        type: Number,
        required: true,
        min: [0, 'Probability cannot be negative'],
        max: [1, 'Probability cannot exceed 1.0']
    },
    reasoning: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Reasoning cannot exceed 1000 characters']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
        index: true
    },
    icdCode: {
        type: String,
        trim: true,
        maxlength: [20, 'ICD code cannot exceed 20 characters']
    },
    snomedCode: {
        type: String,
        trim: true,
        maxlength: [20, 'SNOMED code cannot exceed 20 characters']
    },
    confidence: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    evidenceLevel: {
        type: String,
        enum: ['definite', 'probable', 'possible', 'unlikely'],
        required: true
    }
}, { _id: false });
const suggestedTestSchema = new mongoose_1.Schema({
    testName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters']
    },
    priority: {
        type: String,
        enum: ['urgent', 'routine', 'optional'],
        required: true,
        index: true
    },
    reasoning: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Reasoning cannot exceed 500 characters']
    },
    loincCode: {
        type: String,
        trim: true,
        maxlength: [20, 'LOINC code cannot exceed 20 characters']
    },
    expectedCost: {
        type: Number,
        min: [0, 'Expected cost cannot be negative']
    },
    turnaroundTime: {
        type: String,
        trim: true,
        maxlength: [100, 'Turnaround time cannot exceed 100 characters']
    },
    clinicalSignificance: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Clinical significance cannot exceed 300 characters']
    }
}, { _id: false });
const medicationSuggestionSchema = new mongoose_1.Schema({
    drugName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Drug name cannot exceed 200 characters']
    },
    dosage: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Dosage cannot exceed 100 characters']
    },
    frequency: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Frequency cannot exceed 100 characters']
    },
    duration: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Duration cannot exceed 100 characters']
    },
    reasoning: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Reasoning cannot exceed 500 characters']
    },
    safetyNotes: {
        type: [String],
        default: [],
        validate: {
            validator: function (notes) {
                return notes.every(note => note.trim().length > 0 && note.length <= 200);
            },
            message: 'Safety notes must be non-empty and not exceed 200 characters each'
        }
    },
    rxcui: {
        type: String,
        trim: true,
        maxlength: [20, 'RxCUI cannot exceed 20 characters']
    },
    contraindications: {
        type: [String],
        default: []
    },
    monitoringParameters: {
        type: [String],
        default: []
    },
    alternativeOptions: {
        type: [String],
        default: []
    }
}, { _id: false });
const redFlagSchema = new mongoose_1.Schema({
    flag: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Red flag cannot exceed 200 characters']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Action cannot exceed 300 characters']
    },
    timeframe: {
        type: String,
        trim: true,
        maxlength: [100, 'Timeframe cannot exceed 100 characters']
    },
    clinicalRationale: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Clinical rationale cannot exceed 500 characters']
    }
}, { _id: false });
const referralRecommendationSchema = new mongoose_1.Schema({
    recommended: {
        type: Boolean,
        required: true
    },
    urgency: {
        type: String,
        enum: ['immediate', 'within_24h', 'within_week', 'routine'],
        required: function () {
            return this.recommended;
        }
    },
    specialty: {
        type: String,
        required: function () {
            return this.recommended;
        },
        trim: true,
        maxlength: [100, 'Specialty cannot exceed 100 characters']
    },
    reason: {
        type: String,
        required: function () {
            return this.recommended;
        },
        trim: true,
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    suggestedTests: {
        type: [String],
        default: []
    },
    clinicalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Clinical notes cannot exceed 1000 characters']
    },
    followUpInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Follow-up instructions cannot exceed 500 characters']
    }
}, { _id: false });
const aiMetadataSchema = new mongoose_1.Schema({
    modelId: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Model ID cannot exceed 100 characters']
    },
    modelVersion: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'Model version cannot exceed 50 characters']
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: [0, 'Confidence score cannot be negative'],
        max: [1, 'Confidence score cannot exceed 1.0']
    },
    processingTime: {
        type: Number,
        required: true,
        min: [0, 'Processing time cannot be negative']
    },
    tokenUsage: {
        promptTokens: {
            type: Number,
            required: true,
            min: [0, 'Prompt tokens cannot be negative']
        },
        completionTokens: {
            type: Number,
            required: true,
            min: [0, 'Completion tokens cannot be negative']
        },
        totalTokens: {
            type: Number,
            required: true,
            min: [0, 'Total tokens cannot be negative']
        }
    },
    requestId: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Request ID cannot exceed 100 characters']
    },
    temperature: {
        type: Number,
        min: [0, 'Temperature cannot be negative'],
        max: [2, 'Temperature cannot exceed 2.0']
    },
    maxTokens: {
        type: Number,
        min: [1, 'Max tokens must be at least 1']
    },
    promptHash: {
        type: String,
        trim: true,
        maxlength: [64, 'Prompt hash cannot exceed 64 characters']
    }
}, { _id: false });
const pharmacistReviewSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['approved', 'modified', 'rejected'],
        required: true,
        index: true
    },
    modifications: {
        type: String,
        trim: true,
        maxlength: [2000, 'Modifications cannot exceed 2000 characters']
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    reviewNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    },
    clinicalJustification: {
        type: String,
        trim: true,
        maxlength: [1000, 'Clinical justification cannot exceed 1000 characters']
    }
}, { _id: false });
const diagnosticResultSchema = new mongoose_1.Schema({
    requestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticRequest',
        required: true,
        unique: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    diagnoses: {
        type: [diagnosisSchema],
        required: true,
        validate: {
            validator: function (diagnoses) {
                return diagnoses.length > 0;
            },
            message: 'At least one diagnosis is required'
        }
    },
    suggestedTests: {
        type: [suggestedTestSchema],
        default: []
    },
    medicationSuggestions: {
        type: [medicationSuggestionSchema],
        default: []
    },
    redFlags: {
        type: [redFlagSchema],
        default: []
    },
    referralRecommendation: referralRecommendationSchema,
    differentialDiagnosis: {
        type: [String],
        required: true,
        validate: {
            validator: function (diagnoses) {
                return diagnoses.length > 0;
            },
            message: 'At least one differential diagnosis is required'
        }
    },
    clinicalImpression: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Clinical impression cannot exceed 2000 characters']
    },
    riskAssessment: {
        overallRisk: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            required: true,
            index: true
        },
        riskFactors: {
            type: [String],
            required: true,
            validate: {
                validator: function (factors) {
                    return factors.length > 0;
                },
                message: 'At least one risk factor is required'
            }
        },
        mitigatingFactors: {
            type: [String],
            default: []
        }
    },
    aiMetadata: {
        type: aiMetadataSchema,
        required: true
    },
    rawResponse: {
        type: String,
        required: true,
        maxlength: [50000, 'Raw response cannot exceed 50000 characters']
    },
    disclaimer: {
        type: String,
        required: true,
        default: 'This AI-generated diagnostic analysis is for informational purposes only and should not replace professional medical judgment. Always consult with qualified healthcare professionals for medical decisions.',
        maxlength: [1000, 'Disclaimer cannot exceed 1000 characters']
    },
    validationScore: {
        type: Number,
        min: [0, 'Validation score cannot be negative'],
        max: [1, 'Validation score cannot exceed 1.0']
    },
    qualityFlags: {
        type: [String],
        default: []
    },
    pharmacistReview: pharmacistReviewSchema,
    followUpRequired: {
        type: Boolean,
        default: false,
        index: true
    },
    followUpDate: {
        type: Date,
        index: true
    },
    followUpInstructions: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(diagnosticResultSchema);
diagnosticResultSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
diagnosticResultSchema.index({ workplaceId: 1, createdAt: -1 });
diagnosticResultSchema.index({ workplaceId: 1, 'riskAssessment.overallRisk': 1, createdAt: -1 });
diagnosticResultSchema.index({ workplaceId: 1, 'pharmacistReview.status': 1, createdAt: -1 });
diagnosticResultSchema.index({ workplaceId: 1, followUpRequired: 1, followUpDate: 1 });
diagnosticResultSchema.index({ workplaceId: 1, 'aiMetadata.confidenceScore': -1 });
diagnosticResultSchema.index({ workplaceId: 1, isDeleted: 1, createdAt: -1 });
diagnosticResultSchema.virtual('needsReview').get(function () {
    return !this.pharmacistReview;
});
diagnosticResultSchema.virtual('isApproved').get(function () {
    return this.pharmacistReview?.status === 'approved';
});
diagnosticResultSchema.virtual('primaryDiagnosis').get(function () {
    if (this.diagnoses.length === 0)
        return null;
    return this.diagnoses.reduce((highest, current) => current.probability > highest.probability ? current : highest);
});
diagnosticResultSchema.methods.approve = async function (reviewedBy, modifications) {
    this.pharmacistReview = {
        status: modifications ? 'modified' : 'approved',
        modifications,
        reviewedBy,
        reviewedAt: new Date()
    };
    await this.save();
};
diagnosticResultSchema.methods.reject = async function (reviewedBy, reason) {
    this.pharmacistReview = {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy,
        reviewedAt: new Date()
    };
    await this.save();
};
diagnosticResultSchema.methods.modify = async function (reviewedBy, modifications) {
    this.pharmacistReview = {
        status: 'modified',
        modifications,
        reviewedBy,
        reviewedAt: new Date()
    };
    await this.save();
};
diagnosticResultSchema.methods.calculateOverallConfidence = function () {
    if (this.diagnoses.length === 0)
        return 0;
    const avgDiagnosisConfidence = this.diagnoses.reduce((sum, diagnosis) => {
        const confidenceMap = { low: 0.3, medium: 0.6, high: 0.9 };
        return sum + (diagnosis.probability * confidenceMap[diagnosis.confidence]);
    }, 0) / this.diagnoses.length;
    return Math.min(avgDiagnosisConfidence * this.aiMetadata.confidenceScore, 1);
};
diagnosticResultSchema.methods.getHighestRiskFlag = function () {
    if (this.redFlags.length === 0)
        return null;
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return this.redFlags.reduce((highest, current) => severityOrder[current.severity] > severityOrder[highest.severity] ? current : highest);
};
diagnosticResultSchema.methods.requiresImmediateAttention = function () {
    const hasCriticalFlags = this.redFlags.some(flag => flag.severity === 'critical');
    const hasImmediateReferral = this.referralRecommendation?.urgency === 'immediate';
    const hasCriticalRisk = this.riskAssessment.overallRisk === 'critical';
    return hasCriticalFlags || hasImmediateReferral || hasCriticalRisk;
};
diagnosticResultSchema.statics.findPendingReview = function (workplaceId) {
    return this.find({
        workplaceId,
        pharmacistReview: { $exists: false },
        isDeleted: false
    }).sort({ createdAt: 1 });
};
diagnosticResultSchema.statics.findHighRisk = function (workplaceId) {
    return this.find({
        workplaceId,
        'riskAssessment.overallRisk': { $in: ['high', 'critical'] },
        isDeleted: false
    }).sort({ createdAt: -1 });
};
diagnosticResultSchema.statics.findByConfidenceRange = function (workplaceId, minConfidence, maxConfidence) {
    return this.find({
        workplaceId,
        'aiMetadata.confidenceScore': { $gte: minConfidence, $lte: maxConfidence },
        isDeleted: false
    }).sort({ 'aiMetadata.confidenceScore': -1 });
};
exports.default = mongoose_1.default.model('DiagnosticResult', diagnosticResultSchema);
//# sourceMappingURL=DiagnosticResult.js.map