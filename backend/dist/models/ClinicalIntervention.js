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
const clinicalInterventionSchema = new mongoose_1.Schema({
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
    interventionNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        match: [/^CI-\d{6}-\d{4}$/, 'Invalid intervention number format'],
    },
    category: {
        type: String,
        enum: [
            'drug_therapy_problem',
            'adverse_drug_reaction',
            'medication_nonadherence',
            'drug_interaction',
            'dosing_issue',
            'contraindication',
            'other',
        ],
        required: true,
        index: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true,
    },
    issueDescription: {
        type: String,
        required: [true, 'Issue description is required'],
        trim: true,
        minlength: [10, 'Issue description must be at least 10 characters'],
        maxlength: [1000, 'Issue description cannot exceed 1000 characters'],
    },
    identifiedDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    identifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    strategies: [
        {
            type: {
                type: String,
                enum: [
                    'medication_review',
                    'dose_adjustment',
                    'alternative_therapy',
                    'discontinuation',
                    'additional_monitoring',
                    'patient_counseling',
                    'physician_consultation',
                    'custom',
                ],
                required: true,
            },
            description: {
                type: String,
                required: true,
                trim: true,
                maxlength: [500, 'Strategy description cannot exceed 500 characters'],
            },
            rationale: {
                type: String,
                required: true,
                trim: true,
                maxlength: [500, 'Strategy rationale cannot exceed 500 characters'],
            },
            expectedOutcome: {
                type: String,
                required: true,
                trim: true,
                minlength: [20, 'Expected outcome must be at least 20 characters'],
                maxlength: [500, 'Expected outcome cannot exceed 500 characters'],
            },
            priority: {
                type: String,
                enum: ['primary', 'secondary'],
                default: 'primary',
            },
        },
    ],
    assignments: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
                index: true,
            },
            role: {
                type: String,
                enum: ['pharmacist', 'physician', 'nurse', 'patient', 'caregiver'],
                required: true,
            },
            task: {
                type: String,
                required: true,
                trim: true,
                maxlength: [300, 'Task description cannot exceed 300 characters'],
            },
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                default: 'pending',
                index: true,
            },
            assignedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
            completedAt: Date,
            notes: {
                type: String,
                trim: true,
                maxlength: [500, 'Assignment notes cannot exceed 500 characters'],
            },
        },
    ],
    status: {
        type: String,
        enum: [
            'identified',
            'planning',
            'in_progress',
            'implemented',
            'completed',
            'cancelled',
        ],
        default: 'identified',
        required: true,
        index: true,
    },
    implementationNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Implementation notes cannot exceed 2000 characters'],
    },
    outcomes: {
        patientResponse: {
            type: String,
            enum: ['improved', 'no_change', 'worsened', 'unknown'],
        },
        clinicalParameters: [
            {
                parameter: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Parameter name cannot exceed 100 characters'],
                },
                beforeValue: {
                    type: String,
                    trim: true,
                    maxlength: [50, 'Before value cannot exceed 50 characters'],
                },
                afterValue: {
                    type: String,
                    trim: true,
                    maxlength: [50, 'After value cannot exceed 50 characters'],
                },
                unit: {
                    type: String,
                    trim: true,
                    maxlength: [20, 'Unit cannot exceed 20 characters'],
                },
                improvementPercentage: {
                    type: Number,
                    min: [-100, 'Improvement percentage cannot be less than -100'],
                    max: [1000, 'Improvement percentage cannot exceed 1000'],
                },
            },
        ],
        adverseEffects: {
            type: String,
            trim: true,
            maxlength: [1000, 'Adverse effects description cannot exceed 1000 characters'],
        },
        additionalIssues: {
            type: String,
            trim: true,
            maxlength: [1000, 'Additional issues description cannot exceed 1000 characters'],
        },
        successMetrics: {
            problemResolved: {
                type: Boolean,
                default: false,
            },
            medicationOptimized: {
                type: Boolean,
                default: false,
            },
            adherenceImproved: {
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
        },
    },
    followUp: {
        required: {
            type: Boolean,
            default: false,
        },
        scheduledDate: Date,
        completedDate: Date,
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Follow-up notes cannot exceed 500 characters'],
        },
        nextReviewDate: Date,
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: Date,
    estimatedDuration: {
        type: Number,
        min: [0, 'Estimated duration cannot be negative'],
    },
    actualDuration: {
        type: Number,
        min: [0, 'Actual duration cannot be negative'],
    },
    relatedMTRId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
        index: true,
    },
    relatedDTPIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'DrugTherapyProblem',
            index: true,
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(clinicalInterventionSchema);
clinicalInterventionSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
clinicalInterventionSchema.index({ workplaceId: 1, patientId: 1, status: 1 });
clinicalInterventionSchema.index({ workplaceId: 1, identifiedBy: 1 });
clinicalInterventionSchema.index({ workplaceId: 1, category: 1, priority: 1 });
clinicalInterventionSchema.index({ workplaceId: 1, isDeleted: 1 });
clinicalInterventionSchema.index({ workplaceId: 1, interventionNumber: 1 }, { unique: true });
clinicalInterventionSchema.index({ 'assignments.userId': 1, 'assignments.status': 1 });
clinicalInterventionSchema.index({ identifiedDate: -1 });
clinicalInterventionSchema.index({ completedAt: -1 }, { sparse: true });
clinicalInterventionSchema.index({ createdAt: -1 });
clinicalInterventionSchema.index({ 'followUp.scheduledDate': 1 }, { sparse: true });
clinicalInterventionSchema.index({ relatedMTRId: 1 }, { sparse: true });
clinicalInterventionSchema.index({ relatedDTPIds: 1 }, { sparse: true });
clinicalInterventionSchema.virtual('durationDays').get(function () {
    const endDate = this.completedAt || new Date();
    const diffTime = Math.abs(endDate.getTime() - this.startedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
clinicalInterventionSchema.virtual('isOverdue').get(function () {
    if (this.status === 'completed' || this.status === 'cancelled')
        return false;
    const daysSinceStart = Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24));
    let overdueThreshold;
    switch (this.priority) {
        case 'critical':
        case 'high':
            overdueThreshold = 1;
            break;
        case 'medium':
            overdueThreshold = 3;
            break;
        case 'low':
        default:
            overdueThreshold = 7;
            break;
    }
    return daysSinceStart > overdueThreshold;
});
clinicalInterventionSchema.methods.getCompletionPercentage = function () {
    const totalSteps = 5;
    const statusOrder = ['identified', 'planning', 'in_progress', 'implemented', 'completed'];
    const currentStepIndex = statusOrder.indexOf(this.status);
    if (currentStepIndex === -1 || this.status === 'cancelled')
        return 0;
    return Math.round(((currentStepIndex + 1) / totalSteps) * 100);
};
clinicalInterventionSchema.methods.getNextStep = function () {
    const statusFlow = {
        'identified': 'planning',
        'planning': 'in_progress',
        'in_progress': 'implemented',
        'implemented': 'completed',
        'completed': null,
        'cancelled': null,
    };
    return statusFlow[this.status] || null;
};
clinicalInterventionSchema.methods.canComplete = function () {
    return (this.status === 'implemented' &&
        this.strategies.length > 0 &&
        !!this.outcomes &&
        this.outcomes.patientResponse !== undefined);
};
clinicalInterventionSchema.methods.addStrategy = function (strategy) {
    this.strategies.push(strategy);
    if (this.status === 'identified' && this.strategies.length === 1) {
        this.status = 'planning';
    }
};
clinicalInterventionSchema.methods.assignTeamMember = function (assignment) {
    this.assignments.push(assignment);
    if (this.status === 'planning' && this.assignments.length === 1) {
        this.status = 'in_progress';
    }
};
clinicalInterventionSchema.methods.recordOutcome = function (outcome) {
    this.outcomes = outcome;
    if (this.status === 'in_progress') {
        this.status = 'implemented';
    }
    if (this.canComplete()) {
        this.status = 'completed';
        this.completedAt = new Date();
        if (this.startedAt) {
            this.actualDuration = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
        }
    }
};
clinicalInterventionSchema.methods.generateInterventionNumber = function () {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const randomSuffix = Math.random().toString().substr(2, 4).padStart(4, '0');
    return `CI-${year}${month}-${randomSuffix}`;
};
clinicalInterventionSchema.pre('save', function () {
    if (this.isNew && !this.interventionNumber) {
        this.interventionNumber = this.generateInterventionNumber();
    }
    if (this.status !== 'identified' && this.status !== 'cancelled' && this.strategies.length === 0) {
        throw new Error('At least one intervention strategy is required');
    }
    if ((this.status === 'implemented' || this.status === 'completed') && !this.outcomes?.patientResponse) {
        throw new Error('Patient response outcome is required for implemented/completed interventions');
    }
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    if (this.status === 'completed' && this.completedAt && this.startedAt && !this.actualDuration) {
        this.actualDuration = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
    }
});
clinicalInterventionSchema.statics.generateNextInterventionNumber = async function (workplaceId) {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const lastIntervention = await this.findOne({
        workplaceId,
        interventionNumber: { $regex: `^CI-${year}${month}` }
    }, {}, { sort: { createdAt: -1 }, bypassTenancyGuard: true });
    let sequence = 1;
    if (lastIntervention?.interventionNumber) {
        const match = lastIntervention.interventionNumber.match(/-(\d+)$/);
        if (match) {
            sequence = parseInt(match[1]) + 1;
        }
    }
    return `CI-${year}${month}-${sequence.toString().padStart(4, '0')}`;
};
clinicalInterventionSchema.statics.findActive = function (workplaceId) {
    const query = { status: { $in: ['identified', 'planning', 'in_progress', 'implemented'] } };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, identifiedDate: 1 });
};
clinicalInterventionSchema.statics.findOverdue = function (workplaceId) {
    const criticalThreshold = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const highThreshold = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const mediumThreshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const lowThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = {
        status: { $in: ['identified', 'planning', 'in_progress', 'implemented'] },
        $or: [
            { priority: 'critical', startedAt: { $lt: criticalThreshold } },
            { priority: 'high', startedAt: { $lt: highThreshold } },
            { priority: 'medium', startedAt: { $lt: mediumThreshold } },
            { priority: 'low', startedAt: { $lt: lowThreshold } }
        ]
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, startedAt: 1 });
};
clinicalInterventionSchema.statics.findByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ identifiedDate: -1 });
};
clinicalInterventionSchema.statics.findAssignedToUser = function (userId, workplaceId) {
    const query = { 'assignments.userId': userId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ priority: 1, identifiedDate: 1 });
};
exports.default = mongoose_1.default.model('ClinicalIntervention', clinicalInterventionSchema);
//# sourceMappingURL=ClinicalIntervention.js.map