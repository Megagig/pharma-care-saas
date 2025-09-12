import mongoose, { Document, Schema } from 'mongoose';

export interface IDiagnosis {
    condition: string;
    probability: number;
    reasoning: string;
    severity: 'low' | 'medium' | 'high';
    icdCode?: string;
    snomedCode?: string;
}

export interface ISuggestedTest {
    testName: string;
    priority: 'urgent' | 'routine' | 'optional';
    reasoning: string;
    loincCode?: string;
}

export interface IMedicationSuggestion {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning: string;
    safetyNotes: string[];
    rxcui?: string;
}

export interface IRedFlag {
    flag: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: string;
}

export interface IReferralRecommendation {
    recommended: boolean;
    urgency: 'immediate' | 'within_24h' | 'routine';
    specialty: string;
    reason: string;
}

export interface IAIMetadata {
    modelId: string;
    modelVersion: string;
    confidenceScore: number;
    processingTime: number;
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    requestId: string;
}

export interface IPharmacistReview {
    status: 'approved' | 'modified' | 'rejected';
    modifications?: string;
    rejectionReason?: string;
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
}

export interface IDiagnosticResult extends Document {
    _id: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;

    // AI Analysis Results
    diagnoses: IDiagnosis[];
    suggestedTests: ISuggestedTest[];
    medicationSuggestions: IMedicationSuggestion[];
    redFlags: IRedFlag[];
    referralRecommendation?: IReferralRecommendation;

    // AI Metadata
    aiMetadata: IAIMetadata;
    rawResponse: string;
    disclaimer: string;

    // Pharmacist Review
    pharmacistReview?: IPharmacistReview;

    createdAt: Date;
}

const diagnosisSchema = new Schema({
    condition: {
        type: String,
        required: true,
        trim: true
    },
    probability: {
        type: Number,
        required: true,
        min: [0, 'Probability cannot be negative'],
        max: [1, 'Probability cannot exceed 1']
    },
    reasoning: {
        type: String,
        required: true,
        trim: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    icdCode: {
        type: String,
        trim: true,
        sparse: true
    },
    snomedCode: {
        type: String,
        trim: true,
        sparse: true
    }
});

const suggestedTestSchema = new Schema({
    testName: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['urgent', 'routine', 'optional'],
        required: true
    },
    reasoning: {
        type: String,
        required: true,
        trim: true
    },
    loincCode: {
        type: String,
        trim: true,
        sparse: true
    }
});

const medicationSuggestionSchema = new Schema({
    drugName: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        required: true,
        trim: true
    },
    frequency: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        required: true,
        trim: true
    },
    reasoning: {
        type: String,
        required: true,
        trim: true
    },
    safetyNotes: {
        type: [String],
        default: []
    },
    rxcui: {
        type: String,
        trim: true,
        sparse: true
    }
});

const redFlagSchema = new Schema({
    flag: {
        type: String,
        required: true,
        trim: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    }
});

const referralRecommendationSchema = new Schema({
    recommended: {
        type: Boolean,
        required: true
    },
    urgency: {
        type: String,
        enum: ['immediate', 'within_24h', 'routine'],
        required: function (this: IReferralRecommendation) {
            return this.recommended;
        }
    },
    specialty: {
        type: String,
        required: function (this: IReferralRecommendation) {
            return this.recommended;
        },
        trim: true
    },
    reason: {
        type: String,
        required: function (this: IReferralRecommendation) {
            return this.recommended;
        },
        trim: true
    }
});

const aiMetadataSchema = new Schema({
    modelId: {
        type: String,
        required: true,
        trim: true
    },
    modelVersion: {
        type: String,
        required: true,
        trim: true
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: [0, 'Confidence score cannot be negative'],
        max: [1, 'Confidence score cannot exceed 1']
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
        trim: true
    }
});

const pharmacistReviewSchema = new Schema({
    status: {
        type: String,
        enum: ['approved', 'modified', 'rejected'],
        required: true
    },
    modifications: {
        type: String,
        trim: true,
        required: function (this: IPharmacistReview) {
            return this.status === 'modified';
        }
    },
    rejectionReason: {
        type: String,
        trim: true,
        required: function (this: IPharmacistReview) {
            return this.status === 'rejected';
        }
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const diagnosticResultSchema = new Schema({
    requestId: {
        type: Schema.Types.ObjectId,
        ref: 'DiagnosticRequest',
        required: true,
        unique: true,
        index: true
    },

    // AI Analysis Results
    diagnoses: {
        type: [diagnosisSchema],
        required: true,
        validate: {
            validator: (arr: IDiagnosis[]) => arr.length > 0,
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

    // AI Metadata
    aiMetadata: {
        type: aiMetadataSchema,
        required: true
    },
    rawResponse: {
        type: String,
        required: true
    },
    disclaimer: {
        type: String,
        required: true,
        default: 'This AI-generated analysis is for informational purposes only and should not replace professional medical judgment. Always consult with qualified healthcare professionals for medical decisions.'
    },

    // Pharmacist Review
    pharmacistReview: pharmacistReviewSchema
}, {
    timestamps: true
});

// Indexes for efficient querying
diagnosticResultSchema.index({ requestId: 1 });
diagnosticResultSchema.index({ createdAt: -1 });
diagnosticResultSchema.index({ 'aiMetadata.modelId': 1, 'aiMetadata.confidenceScore': -1 });
diagnosticResultSchema.index({ 'pharmacistReview.status': 1 }, { sparse: true });
diagnosticResultSchema.index({ 'pharmacistReview.reviewedAt': -1 }, { sparse: true });

// Virtual for checking if result has been reviewed
diagnosticResultSchema.virtual('isReviewed').get(function (this: IDiagnosticResult) {
    return !!this.pharmacistReview;
});

// Instance methods
diagnosticResultSchema.methods.approve = function (
    this: IDiagnosticResult,
    reviewedBy: mongoose.Types.ObjectId
) {
    this.pharmacistReview = {
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date()
    };
    return this.save();
};

diagnosticResultSchema.methods.modify = function (
    this: IDiagnosticResult,
    modifications: string,
    reviewedBy: mongoose.Types.ObjectId
) {
    this.pharmacistReview = {
        status: 'modified',
        modifications,
        reviewedBy,
        reviewedAt: new Date()
    };
    return this.save();
};

diagnosticResultSchema.methods.reject = function (
    this: IDiagnosticResult,
    rejectionReason: string,
    reviewedBy: mongoose.Types.ObjectId
) {
    this.pharmacistReview = {
        status: 'rejected',
        rejectionReason,
        reviewedBy,
        reviewedAt: new Date()
    };
    return this.save();
};

// Static method to get results by confidence score
diagnosticResultSchema.statics.findByConfidenceRange = function (
    minConfidence: number,
    maxConfidence: number = 1
) {
    return this.find({
        'aiMetadata.confidenceScore': {
            $gte: minConfidence,
            $lte: maxConfidence
        }
    });
};

export default mongoose.model<IDiagnosticResult>('DiagnosticResult', diagnosticResultSchema);