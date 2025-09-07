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
const therapyPlanSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    patient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    workplace: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        index: true
    },
    name: {
        type: String,
        required: [true, 'Therapy plan name is required'],
        trim: true
    },
    description: String,
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'discontinued'],
        default: 'draft',
        index: true
    },
    drugs: [{
            rxcui: String,
            drugName: {
                type: String,
                required: true,
                trim: true
            },
            genericName: String,
            strength: String,
            dosageForm: String,
            indication: {
                type: String,
                required: true
            },
            dosing: {
                dose: String,
                frequency: String,
                duration: String,
                instructions: String
            },
            monitoring: {
                parameters: [String],
                frequency: String,
                notes: String
            },
            alternatives: [{
                    rxcui: String,
                    drugName: {
                        type: String,
                        required: true
                    },
                    reason: {
                        type: String,
                        required: true
                    },
                    therapeuticEquivalence: Boolean
                }],
            interactions: [{
                    interactingDrug: {
                        type: String,
                        required: true
                    },
                    severity: {
                        type: String,
                        enum: ['minor', 'moderate', 'major', 'contraindicated'],
                        required: true
                    },
                    description: {
                        type: String,
                        required: true
                    },
                    management: String
                }],
            adverseEffects: [{
                    effect: {
                        type: String,
                        required: true
                    },
                    frequency: String,
                    severity: {
                        type: String,
                        enum: ['mild', 'moderate', 'severe']
                    },
                    management: String
                }],
            contraindications: [String],
            precautions: [String],
            patientCounseling: [String],
            addedAt: {
                type: Date,
                default: Date.now
            },
            addedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }],
    guidelines: [{
            title: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            source: {
                type: String,
                required: true
            },
            url: String,
            dateAccessed: Date
        }],
    clinicalNotes: String,
    reviewDates: [{
            date: {
                type: Date,
                required: true
            },
            reviewedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            notes: String,
            changes: [String]
        }],
    isTemplate: {
        type: Boolean,
        default: false,
        index: true
    },
    sharedWith: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            permission: {
                type: String,
                enum: ['view', 'edit'],
                required: true
            },
            sharedAt: {
                type: Date,
                default: Date.now
            }
        }],
    tags: [String]
}, { timestamps: true });
therapyPlanSchema.index({ user: 1, status: 1, createdAt: -1 });
therapyPlanSchema.index({ patient: 1, status: 1 });
therapyPlanSchema.index({ workplace: 1, isTemplate: 1 });
therapyPlanSchema.index({ 'drugs.drugName': 'text', name: 'text', description: 'text' });
therapyPlanSchema.index({ tags: 1 });
exports.default = mongoose_1.default.model('TherapyPlan', therapyPlanSchema);
//# sourceMappingURL=TherapyPlan.js.map