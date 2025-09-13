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
const symptomDataSchema = new mongoose_1.Schema({
    subjective: {
        type: [String],
        required: true,
        validate: {
            validator: function (symptoms) {
                return symptoms.length > 0;
            },
            message: 'At least one subjective symptom is required'
        }
    },
    objective: {
        type: [String],
        default: []
    },
    duration: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Duration description cannot exceed 100 characters']
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        required: true,
        index: true
    },
    onset: {
        type: String,
        enum: ['acute', 'chronic', 'subacute'],
        required: true,
        index: true
    }
}, { _id: false });
const vitalSignsSchema = new mongoose_1.Schema({
    bloodPressure: {
        type: String,
        validate: {
            validator: function (bp) {
                if (!bp)
                    return true;
                return /^\d{2,3}\/\d{2,3}$/.test(bp);
            },
            message: 'Blood pressure must be in format "systolic/diastolic" (e.g., 120/80)'
        }
    },
    heartRate: {
        type: Number,
        min: [30, 'Heart rate too low'],
        max: [250, 'Heart rate too high']
    },
    temperature: {
        type: Number,
        min: [30, 'Temperature too low'],
        max: [45, 'Temperature too high']
    },
    bloodGlucose: {
        type: Number,
        min: [20, 'Blood glucose too low'],
        max: [600, 'Blood glucose too high']
    },
    respiratoryRate: {
        type: Number,
        min: [8, 'Respiratory rate too low'],
        max: [60, 'Respiratory rate too high']
    },
    oxygenSaturation: {
        type: Number,
        min: [70, 'Oxygen saturation too low'],
        max: [100, 'Oxygen saturation cannot exceed 100%']
    },
    weight: {
        type: Number,
        min: [0.5, 'Weight too low'],
        max: [1000, 'Weight too high']
    },
    height: {
        type: Number,
        min: [30, 'Height too low'],
        max: [300, 'Height too high']
    }
}, { _id: false });
const medicationEntrySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Medication name cannot exceed 200 characters']
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
    route: {
        type: String,
        trim: true,
        maxlength: [50, 'Route cannot exceed 50 characters']
    },
    startDate: Date,
    indication: {
        type: String,
        trim: true,
        maxlength: [200, 'Indication cannot exceed 200 characters']
    }
}, { _id: false });
const inputSnapshotSchema = new mongoose_1.Schema({
    symptoms: {
        type: symptomDataSchema,
        required: true
    },
    vitals: vitalSignsSchema,
    currentMedications: {
        type: [medicationEntrySchema],
        default: []
    },
    allergies: {
        type: [String],
        default: [],
        validate: {
            validator: function (allergies) {
                return allergies.every(allergy => allergy.trim().length > 0);
            },
            message: 'Allergies cannot be empty strings'
        }
    },
    medicalHistory: {
        type: [String],
        default: [],
        validate: {
            validator: function (history) {
                return history.every(item => item.trim().length > 0);
            },
            message: 'Medical history items cannot be empty strings'
        }
    },
    labResultIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'LabResult',
        default: []
    },
    socialHistory: {
        smoking: {
            type: String,
            enum: ['never', 'former', 'current']
        },
        alcohol: {
            type: String,
            enum: ['never', 'occasional', 'regular', 'heavy']
        },
        exercise: {
            type: String,
            enum: ['sedentary', 'light', 'moderate', 'active']
        }
    },
    familyHistory: {
        type: [String],
        default: [],
        validate: {
            validator: function (history) {
                return history.every(item => item.trim().length > 0);
            },
            message: 'Family history items cannot be empty strings'
        }
    }
}, { _id: false });
const diagnosticRequestSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    pharmacistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
    inputSnapshot: {
        type: inputSnapshotSchema,
        required: true
    },
    consentObtained: {
        type: Boolean,
        required: true,
        validate: {
            validator: function (consent) {
                return consent === true;
            },
            message: 'Patient consent is required for AI diagnostic processing'
        }
    },
    consentTimestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    promptVersion: {
        type: String,
        required: true,
        default: 'v1.0',
        maxlength: [20, 'Prompt version cannot exceed 20 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        required: true,
        index: true
    },
    processingStartedAt: {
        type: Date,
        index: true
    },
    processingCompletedAt: {
        type: Date,
        index: true
    },
    errorMessage: {
        type: String,
        maxlength: [1000, 'Error message cannot exceed 1000 characters']
    },
    retryCount: {
        type: Number,
        default: 0,
        min: [0, 'Retry count cannot be negative'],
        max: [5, 'Maximum retry count exceeded']
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine',
        required: true,
        index: true
    },
    clinicalUrgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(diagnosticRequestSchema);
diagnosticRequestSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
diagnosticRequestSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
diagnosticRequestSchema.index({ workplaceId: 1, pharmacistId: 1, status: 1 });
diagnosticRequestSchema.index({ workplaceId: 1, status: 1, priority: 1 });
diagnosticRequestSchema.index({ workplaceId: 1, status: 1, createdAt: -1 });
diagnosticRequestSchema.index({ workplaceId: 1, locationId: 1, status: 1 }, { sparse: true });
diagnosticRequestSchema.index({ workplaceId: 1, clinicalUrgency: 1, createdAt: -1 }, { sparse: true });
diagnosticRequestSchema.index({ workplaceId: 1, isDeleted: 1, createdAt: -1 });
diagnosticRequestSchema.virtual('processingDuration').get(function () {
    if (this.processingStartedAt && this.processingCompletedAt) {
        return this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
    }
    return null;
});
diagnosticRequestSchema.virtual('isActive').get(function () {
    return ['pending', 'processing'].includes(this.status);
});
diagnosticRequestSchema.methods.updateStatus = async function (status) {
    this.status = status;
    if (status === 'processing' && !this.processingStartedAt) {
        this.processingStartedAt = new Date();
    }
    else if (['completed', 'failed', 'cancelled'].includes(status) && !this.processingCompletedAt) {
        this.processingCompletedAt = new Date();
    }
    await this.save();
};
diagnosticRequestSchema.methods.markAsProcessing = async function () {
    await this.updateStatus('processing');
};
diagnosticRequestSchema.methods.markAsCompleted = async function () {
    await this.updateStatus('completed');
};
diagnosticRequestSchema.methods.markAsFailed = async function (error) {
    this.errorMessage = error;
    await this.updateStatus('failed');
};
diagnosticRequestSchema.methods.incrementRetryCount = async function () {
    this.retryCount += 1;
    await this.save();
};
diagnosticRequestSchema.methods.canRetry = function () {
    return this.status === 'failed' && this.retryCount < 3;
};
diagnosticRequestSchema.pre('save', function () {
    if (this.consentObtained && !this.consentTimestamp) {
        this.consentTimestamp = new Date();
    }
    if (!this.clinicalUrgency && this.inputSnapshot?.symptoms?.severity) {
        const severityMap = {
            'mild': 'low',
            'moderate': 'medium',
            'severe': 'high'
        };
        this.clinicalUrgency = severityMap[this.inputSnapshot.symptoms.severity];
    }
});
diagnosticRequestSchema.statics.findActiveRequests = function (workplaceId) {
    return this.find({
        workplaceId,
        status: { $in: ['pending', 'processing'] },
        isDeleted: false
    }).sort({ priority: 1, createdAt: 1 });
};
diagnosticRequestSchema.statics.findByPatient = function (workplaceId, patientId) {
    return this.find({
        workplaceId,
        patientId,
        isDeleted: false
    }).sort({ createdAt: -1 });
};
diagnosticRequestSchema.statics.findPendingRetries = function () {
    return this.find({
        status: 'failed',
        retryCount: { $lt: 3 },
        isDeleted: false
    }).sort({ createdAt: 1 });
};
exports.default = mongoose_1.default.model('DiagnosticRequest', diagnosticRequestSchema);
//# sourceMappingURL=DiagnosticRequest.js.map