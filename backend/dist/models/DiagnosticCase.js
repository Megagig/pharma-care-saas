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
const diagnosticCaseSchema = new mongoose_1.Schema({
    caseId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    pharmacistId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    workplaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    appointmentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false,
        index: true,
    },
    symptoms: {
        subjective: [String],
        objective: [String],
        duration: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            required: true,
        },
        onset: {
            type: String,
            enum: ['acute', 'chronic', 'subacute'],
            required: true,
        },
    },
    labResults: [
        {
            testName: String,
            value: String,
            referenceRange: String,
            abnormal: Boolean,
        },
    ],
    currentMedications: [
        {
            name: String,
            dosage: String,
            frequency: String,
            startDate: Date,
        },
    ],
    vitalSigns: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        respiratoryRate: Number,
        oxygenSaturation: Number,
    },
    aiAnalysis: {
        differentialDiagnoses: [
            {
                condition: String,
                probability: Number,
                reasoning: String,
                severity: {
                    type: String,
                    enum: ['low', 'medium', 'high'],
                },
            },
        ],
        recommendedTests: [
            {
                testName: String,
                priority: {
                    type: String,
                    enum: ['urgent', 'routine', 'optional'],
                },
                reasoning: String,
            },
        ],
        therapeuticOptions: [
            {
                medication: String,
                dosage: String,
                frequency: String,
                duration: String,
                reasoning: String,
                safetyNotes: [String],
            },
        ],
        redFlags: [
            {
                flag: String,
                severity: {
                    type: String,
                    enum: ['low', 'medium', 'high', 'critical'],
                },
                action: String,
            },
        ],
        referralRecommendation: {
            recommended: Boolean,
            urgency: {
                type: String,
                enum: ['immediate', 'within_24h', 'routine'],
                required: function () {
                    return this.recommended === true;
                },
            },
            specialty: {
                type: String,
                required: function () {
                    return this.recommended === true;
                },
            },
            reason: {
                type: String,
                required: function () {
                    return this.recommended === true;
                },
            },
        },
        disclaimer: String,
        confidenceScore: Number,
        processingTime: Number,
    },
    drugInteractions: [
        {
            drug1: String,
            drug2: String,
            severity: {
                type: String,
                enum: ['minor', 'moderate', 'major', 'contraindicated'],
            },
            description: String,
            clinicalEffect: String,
            management: String,
        },
    ],
    pharmacistDecision: {
        accepted: {
            type: Boolean,
            default: false,
        },
        modifications: String,
        finalRecommendation: String,
        counselingPoints: [String],
        followUpRequired: {
            type: Boolean,
            default: false,
        },
        followUpDate: Date,
        notes: String,
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    patientInterpretation: {
        summary: {
            type: String,
            trim: true,
            maxlength: [500, 'Summary cannot exceed 500 characters'],
        },
        keyFindings: {
            type: [String],
            validate: {
                validator: function (findings) {
                    return findings.length <= 10;
                },
                message: 'Maximum 10 key findings allowed'
            }
        },
        whatThisMeans: {
            type: String,
            trim: true,
            maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
        },
        recommendations: {
            type: [String],
            validate: {
                validator: function (recs) {
                    return recs.length <= 15;
                },
                message: 'Maximum 15 recommendations allowed'
            }
        },
        whenToSeekCare: {
            type: String,
            trim: true,
            maxlength: [500, 'When to seek care guidance cannot exceed 500 characters'],
        },
        visibleToPatient: {
            type: Boolean,
            default: false,
            index: true,
        },
        interpretedBy: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
        interpretedAt: {
            type: Date,
        },
        lastModifiedAt: {
            type: Date,
        },
        lastModifiedBy: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    patientConsent: {
        provided: {
            type: Boolean,
            required: true,
        },
        consentDate: {
            type: Date,
            required: true,
        },
        consentMethod: {
            type: String,
            enum: ['verbal', 'written', 'electronic'],
            required: true,
        },
    },
    aiRequestData: {
        model: String,
        promptTokens: Number,
        completionTokens: Number,
        totalTokens: Number,
        requestId: String,
        processingTime: Number,
    },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'follow_up', 'completed', 'referred', 'cancelled'],
        default: 'draft',
        index: true,
    },
    completedAt: Date,
    followUp: {
        scheduledDate: {
            type: Date,
            required: function () {
                return this.parent().status === 'follow_up';
            },
        },
        reason: {
            type: String,
            required: function () {
                return this.parent().status === 'follow_up';
            },
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedDate: Date,
        outcome: String,
        nextSteps: String,
    },
    referral: {
        generated: {
            type: Boolean,
            default: false,
        },
        generatedAt: Date,
        document: {
            content: String,
            template: String,
            lastModified: Date,
            modifiedBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'User',
            },
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'acknowledged', 'completed'],
            default: 'pending',
        },
        sentAt: Date,
        sentTo: {
            physicianName: String,
            physicianEmail: String,
            specialty: String,
            institution: String,
        },
        acknowledgedAt: Date,
        completedAt: Date,
        feedback: String,
        trackingId: String,
    },
}, {
    timestamps: true,
    collection: 'diagnostic_cases'
});
diagnosticCaseSchema.pre('save', function (next) {
    if (this.isNew && !this.caseId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        this.caseId = `DX-${timestamp}-${random}`.toUpperCase();
    }
    next();
});
diagnosticCaseSchema.index({ patientId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ pharmacistId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ workplaceId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ status: 1, createdAt: -1 });
diagnosticCaseSchema.index({ 'aiAnalysis.redFlags.severity': 1 });
diagnosticCaseSchema.index({ completedAt: -1 });
diagnosticCaseSchema.index({ 'patientInterpretation.visibleToPatient': 1 });
diagnosticCaseSchema.index({ 'patientInterpretation.interpretedBy': 1, 'patientInterpretation.interpretedAt': -1 });
diagnosticCaseSchema.index({ workplaceId: 1, 'patientInterpretation.visibleToPatient': 1, createdAt: -1 });
diagnosticCaseSchema.methods.addPatientInterpretation = function (interpretationData, interpretedBy) {
    this.patientInterpretation = {
        ...interpretationData,
        visibleToPatient: interpretationData.visibleToPatient || false,
        interpretedBy,
        interpretedAt: new Date(),
        lastModifiedAt: new Date(),
        lastModifiedBy: interpretedBy,
    };
};
diagnosticCaseSchema.methods.updatePatientInterpretation = function (updates, modifiedBy) {
    if (!this.patientInterpretation) {
        throw new Error('Patient interpretation does not exist. Use addPatientInterpretation first.');
    }
    this.patientInterpretation = {
        ...this.patientInterpretation,
        ...updates,
        lastModifiedAt: new Date(),
        lastModifiedBy: modifiedBy,
    };
};
diagnosticCaseSchema.methods.makeVisibleToPatient = function (modifiedBy) {
    if (!this.patientInterpretation) {
        throw new Error('Cannot make visible: No patient interpretation exists');
    }
    this.patientInterpretation.visibleToPatient = true;
    this.patientInterpretation.lastModifiedAt = new Date();
    this.patientInterpretation.lastModifiedBy = modifiedBy;
};
diagnosticCaseSchema.methods.hideFromPatient = function (modifiedBy) {
    if (!this.patientInterpretation) {
        throw new Error('Cannot hide: No patient interpretation exists');
    }
    this.patientInterpretation.visibleToPatient = false;
    this.patientInterpretation.lastModifiedAt = new Date();
    this.patientInterpretation.lastModifiedBy = modifiedBy;
};
diagnosticCaseSchema.methods.hasPatientInterpretation = function () {
    return !!(this.patientInterpretation && this.patientInterpretation.summary);
};
diagnosticCaseSchema.methods.isVisibleToPatient = function () {
    return !!(this.patientInterpretation && this.patientInterpretation.visibleToPatient);
};
exports.default = mongoose_1.default.model('DiagnosticCase', diagnosticCaseSchema);
//# sourceMappingURL=DiagnosticCase.js.map