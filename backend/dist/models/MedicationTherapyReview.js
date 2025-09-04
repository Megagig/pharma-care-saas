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
const medicationTherapyReviewSchema = new mongoose_1.Schema({
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
    pharmacistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    reviewNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'cancelled', 'on_hold'],
        default: 'in_progress',
        required: true,
        index: true,
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'high_risk'],
        default: 'routine',
        required: true,
        index: true,
    },
    reviewType: {
        type: String,
        enum: ['initial', 'follow_up', 'annual', 'targeted'],
        default: 'initial',
        required: true,
        index: true,
    },
    steps: {
        patientSelection: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
        medicationHistory: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
        therapyAssessment: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
        planDevelopment: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
        interventions: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
        followUp: {
            completed: { type: Boolean, default: false },
            completedAt: Date,
            data: mongoose_1.Schema.Types.Mixed,
        },
    },
    medications: [
        {
            drugName: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Drug name cannot exceed 200 characters'],
            },
            genericName: {
                type: String,
                trim: true,
                maxlength: [200, 'Generic name cannot exceed 200 characters'],
            },
            strength: {
                value: {
                    type: Number,
                    required: true,
                    min: [0, 'Strength value cannot be negative'],
                },
                unit: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [20, 'Unit cannot exceed 20 characters'],
                },
            },
            dosageForm: {
                type: String,
                required: true,
                trim: true,
                maxlength: [50, 'Dosage form cannot exceed 50 characters'],
            },
            instructions: {
                dose: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Dose cannot exceed 100 characters'],
                },
                frequency: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Frequency cannot exceed 100 characters'],
                },
                route: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [50, 'Route cannot exceed 50 characters'],
                },
                duration: {
                    type: String,
                    trim: true,
                    maxlength: [100, 'Duration cannot exceed 100 characters'],
                },
            },
            category: {
                type: String,
                enum: ['prescribed', 'otc', 'herbal', 'supplement'],
                required: true,
                index: true,
            },
            prescriber: {
                name: {
                    type: String,
                    trim: true,
                    maxlength: [100, 'Prescriber name cannot exceed 100 characters'],
                },
                license: {
                    type: String,
                    trim: true,
                    maxlength: [50, 'License cannot exceed 50 characters'],
                },
                contact: {
                    type: String,
                    trim: true,
                    maxlength: [100, 'Contact cannot exceed 100 characters'],
                },
            },
            startDate: {
                type: Date,
                required: true,
            },
            endDate: Date,
            indication: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Indication cannot exceed 200 characters'],
            },
            adherenceScore: {
                type: Number,
                min: [0, 'Adherence score cannot be negative'],
                max: [100, 'Adherence score cannot exceed 100'],
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [500, 'Notes cannot exceed 500 characters'],
            },
        },
    ],
    problems: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'DrugTherapyProblem',
            index: true,
        },
    ],
    plan: {
        problems: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'DrugTherapyProblem',
            },
        ],
        recommendations: [
            {
                type: {
                    type: String,
                    enum: [
                        'discontinue',
                        'adjust_dose',
                        'switch_therapy',
                        'add_therapy',
                        'monitor',
                    ],
                    required: true,
                },
                medication: {
                    type: String,
                    trim: true,
                    maxlength: [200, 'Medication name cannot exceed 200 characters'],
                },
                rationale: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [1000, 'Rationale cannot exceed 1000 characters'],
                },
                priority: {
                    type: String,
                    enum: ['high', 'medium', 'low'],
                    required: true,
                },
                expectedOutcome: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [500, 'Expected outcome cannot exceed 500 characters'],
                },
            },
        ],
        monitoringPlan: [
            {
                parameter: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Parameter cannot exceed 100 characters'],
                },
                frequency: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Frequency cannot exceed 100 characters'],
                },
                targetValue: {
                    type: String,
                    trim: true,
                    maxlength: [100, 'Target value cannot exceed 100 characters'],
                },
                notes: {
                    type: String,
                    trim: true,
                    maxlength: [500, 'Notes cannot exceed 500 characters'],
                },
            },
        ],
        counselingPoints: [
            {
                type: String,
                trim: true,
                maxlength: [500, 'Counseling point cannot exceed 500 characters'],
            },
        ],
        goals: [
            {
                description: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [300, 'Goal description cannot exceed 300 characters'],
                },
                targetDate: Date,
                achieved: {
                    type: Boolean,
                    default: false,
                },
                achievedDate: Date,
            },
        ],
        timeline: {
            type: String,
            trim: true,
            maxlength: [500, 'Timeline cannot exceed 500 characters'],
        },
        pharmacistNotes: {
            type: String,
            trim: true,
            maxlength: [2000, 'Pharmacist notes cannot exceed 2000 characters'],
        },
    },
    interventions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'MTRIntervention',
            index: true,
        },
    ],
    followUps: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'MTRFollowUp',
            index: true,
        },
    ],
    clinicalOutcomes: {
        problemsResolved: {
            type: Number,
            default: 0,
            min: [0, 'Problems resolved cannot be negative'],
        },
        medicationsOptimized: {
            type: Number,
            default: 0,
            min: [0, 'Medications optimized cannot be negative'],
        },
        adherenceImproved: {
            type: Boolean,
            default: false,
        },
        adverseEventsReduced: {
            type: Boolean,
            default: false,
        },
        costSavings: {
            type: Number,
            min: [0, 'Cost savings cannot be negative'],
        },
        qualityOfLifeImproved: {
            type: Boolean,
            default: false,
        },
        clinicalParametersImproved: {
            type: Boolean,
            default: false,
        },
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: Date,
    nextReviewDate: Date,
    estimatedDuration: {
        type: Number,
        min: [0, 'Duration cannot be negative'],
    },
    referralSource: {
        type: String,
        trim: true,
        maxlength: [100, 'Referral source cannot exceed 100 characters'],
    },
    reviewReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Review reason cannot exceed 500 characters'],
    },
    patientConsent: {
        type: Boolean,
        required: true,
        default: false,
    },
    confidentialityAgreed: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(medicationTherapyReviewSchema);
medicationTherapyReviewSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
medicationTherapyReviewSchema.index({
    workplaceId: 1,
    patientId: 1,
    status: 1,
});
medicationTherapyReviewSchema.index({ workplaceId: 1, pharmacistId: 1 });
medicationTherapyReviewSchema.index({ workplaceId: 1, reviewType: 1 });
medicationTherapyReviewSchema.index({ workplaceId: 1, priority: 1 });
medicationTherapyReviewSchema.index({ workplaceId: 1, isDeleted: 1 });
medicationTherapyReviewSchema.index({ status: 1, startedAt: -1 });
medicationTherapyReviewSchema.index({ nextReviewDate: 1 }, { sparse: true });
medicationTherapyReviewSchema.index({ completedAt: -1 }, { sparse: true });
medicationTherapyReviewSchema.index({ createdAt: -1 });
medicationTherapyReviewSchema.index({ workplaceId: 1, reviewNumber: 1 }, { unique: true });
medicationTherapyReviewSchema
    .virtual('completionPercentage')
    .get(function () {
    const steps = Object.values(this.steps);
    const completedSteps = steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
});
medicationTherapyReviewSchema
    .virtual('durationDays')
    .get(function () {
    const endDate = this.completedAt || new Date();
    const diffTime = Math.abs(endDate.getTime() - this.startedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
medicationTherapyReviewSchema
    .virtual('isOverdue')
    .get(function () {
    if (this.status === 'completed' || this.status === 'cancelled')
        return false;
    const daysSinceStart = Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24));
    const overdueThreshold = this.priority === 'routine' ? 7 : 1;
    return daysSinceStart > overdueThreshold;
});
medicationTherapyReviewSchema.methods.getCompletionPercentage = function () {
    const steps = Object.values(this.steps);
    const completedSteps = steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
};
medicationTherapyReviewSchema.methods.getNextStep = function () {
    const stepOrder = [
        'patientSelection',
        'medicationHistory',
        'therapyAssessment',
        'planDevelopment',
        'interventions',
        'followUp',
    ];
    for (const stepName of stepOrder) {
        if (!this.steps[stepName].completed) {
            return stepName;
        }
    }
    return null;
};
medicationTherapyReviewSchema.methods.canComplete = function () {
    return Object.values(this.steps).every((step) => step.completed);
};
medicationTherapyReviewSchema.methods.markStepComplete = function (stepName, data) {
    if (this.steps[stepName]) {
        this.steps[stepName].completed = true;
        this.steps[stepName].completedAt = new Date();
        if (data) {
            this.steps[stepName].data = data;
        }
    }
};
medicationTherapyReviewSchema.methods.generateReviewNumber = function () {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `MTR-${year}${month}-${randomSuffix}`;
};
medicationTherapyReviewSchema.pre('save', function () {
    if (this.isNew && !this.reviewNumber) {
        this.reviewNumber = this.generateReviewNumber();
    }
    if (this.canComplete() && this.status === 'in_progress') {
        this.status = 'completed';
        this.completedAt = new Date();
    }
    if (!this.patientConsent && this.createdByRole !== 'super_admin') {
        throw new Error('Patient consent is required to proceed with MTR');
    }
    if (!this.confidentialityAgreed &&
        this.createdByRole !== 'super_admin') {
        throw new Error('Confidentiality agreement is required to proceed with MTR');
    }
});
medicationTherapyReviewSchema.statics.generateNextReviewNumber =
    async function (workplaceId) {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const lastReview = await this.findOne({
            workplaceId,
            reviewNumber: { $regex: `^MTR-${year}${month}` },
        }, {}, { sort: { createdAt: -1 }, bypassTenancyGuard: true });
        let sequence = 1;
        if (lastReview?.reviewNumber) {
            const match = lastReview.reviewNumber.match(/-(\d+)$/);
            if (match) {
                sequence = parseInt(match[1]) + 1;
            }
        }
        return `MTR-${year}${month}-${sequence.toString().padStart(4, '0')}`;
    };
medicationTherapyReviewSchema.statics.findActive = function (workplaceId) {
    const query = { status: { $in: ['in_progress', 'on_hold'] } };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, startedAt: 1 });
};
medicationTherapyReviewSchema.statics.findOverdue = function (workplaceId) {
    const routineThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const urgentThreshold = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const query = {
        status: { $in: ['in_progress', 'on_hold'] },
        $or: [
            { priority: 'routine', startedAt: { $lt: routineThreshold } },
            {
                priority: { $in: ['urgent', 'high_risk'] },
                startedAt: { $lt: urgentThreshold },
            },
        ],
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, startedAt: 1 });
};
exports.default = mongoose_1.default.model('MedicationTherapyReview', medicationTherapyReviewSchema);
//# sourceMappingURL=MedicationTherapyReview.js.map