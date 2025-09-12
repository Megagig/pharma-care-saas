import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../../../utils/tenancyGuard';

export interface ISymptomData {
    subjective: string[];
    objective: string[];
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    onset: 'acute' | 'chronic' | 'subacute';
}

export interface IVitalSigns {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    bloodGlucose?: number;
    respiratoryRate?: number;
}

export interface IMedication {
    name: string;
    dosage: string;
    frequency: string;
}

export interface IInputSnapshot {
    symptoms: ISymptomData;
    vitals?: IVitalSigns;
    currentMedications?: IMedication[];
    allergies?: string[];
    medicalHistory?: string[];
    labResultIds?: mongoose.Types.ObjectId[];
}

export interface IDiagnosticRequest extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    pharmacistId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;

    // Clinical Input Data
    inputSnapshot: IInputSnapshot;

    // AI Processing Metadata
    consentObtained: boolean;
    consentTimestamp: Date;
    promptVersion: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

    // Audit Fields
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    processedAt?: Date;
    isDeleted: boolean;
}

const symptomDataSchema = new Schema({
    subjective: {
        type: [String],
        required: true,
        validate: {
            validator: (arr: string[]) => arr.length > 0,
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
        trim: true
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        required: true
    },
    onset: {
        type: String,
        enum: ['acute', 'chronic', 'subacute'],
        required: true
    }
});

const vitalSignsSchema = new Schema({
    bloodPressure: {
        type: String,
        validate: {
            validator: (v: string) => !v || /^\d{2,3}\/\d{2,3}$/.test(v),
            message: 'Blood pressure must be in format "120/80"'
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
        min: [0, 'Blood glucose cannot be negative'],
        max: [1000, 'Blood glucose too high']
    },
    respiratoryRate: {
        type: Number,
        min: [8, 'Respiratory rate too low'],
        max: [60, 'Respiratory rate too high']
    }
});

const medicationSchema = new Schema({
    name: {
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
    }
});

const inputSnapshotSchema = new Schema({
    symptoms: {
        type: symptomDataSchema,
        required: true
    },
    vitals: vitalSignsSchema,
    currentMedications: [medicationSchema],
    allergies: [String],
    medicalHistory: [String],
    labResultIds: [{
        type: Schema.Types.ObjectId,
        ref: 'LabResult'
    }]
});

const diagnosticRequestSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    pharmacistId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    locationId: {
        type: String,
        index: true,
        sparse: true
    },

    // Clinical Input Data
    inputSnapshot: {
        type: inputSnapshotSchema,
        required: true
    },

    // AI Processing Metadata
    consentObtained: {
        type: Boolean,
        required: true,
        validate: {
            validator: (v: boolean) => v === true,
            message: 'Patient consent is required for AI processing'
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
        default: '1.0'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },

    processedAt: Date
}, {
    timestamps: true
});

// Add audit fields (createdBy, updatedBy, isDeleted)
addAuditFields(diagnosticRequestSchema);

// Apply tenancy guard plugin
diagnosticRequestSchema.plugin(tenancyGuardPlugin);

// Compound indexes for efficient querying
diagnosticRequestSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
diagnosticRequestSchema.index({ workplaceId: 1, pharmacistId: 1, status: 1 });
diagnosticRequestSchema.index({ workplaceId: 1, status: 1, createdAt: -1 });
diagnosticRequestSchema.index({ workplaceId: 1, locationId: 1, status: 1 }, { sparse: true });

// Pre-save middleware for validation
diagnosticRequestSchema.pre('save', function (this: IDiagnosticRequest) {
    // Ensure consent timestamp is set when consent is obtained
    if (this.consentObtained && !this.consentTimestamp) {
        this.consentTimestamp = new Date();
    }

    // Set processed timestamp when status changes to completed
    if (this.status === 'completed' && !this.processedAt) {
        this.processedAt = new Date();
    }
});

// Instance methods
diagnosticRequestSchema.methods.markAsProcessing = function (this: IDiagnosticRequest) {
    this.status = 'processing';
    return this.save();
};

diagnosticRequestSchema.methods.markAsCompleted = function (this: IDiagnosticRequest) {
    this.status = 'completed';
    this.processedAt = new Date();
    return this.save();
};

diagnosticRequestSchema.methods.markAsFailed = function (this: IDiagnosticRequest) {
    this.status = 'failed';
    return this.save();
};

diagnosticRequestSchema.methods.cancel = function (this: IDiagnosticRequest) {
    this.status = 'cancelled';
    return this.save();
};

export default mongoose.model<IDiagnosticRequest>('DiagnosticRequest', diagnosticRequestSchema);