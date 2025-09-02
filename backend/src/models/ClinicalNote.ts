import mongoose, { Document, Schema } from 'mongoose';

export interface IClinicalNote extends Document {
  patient: mongoose.Types.ObjectId;
  pharmacist: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId; // Added for tenancy
  locationId?: string; // Location ID within the workplace for multi-location support
  type: 'consultation' | 'medication_review' | 'follow_up' | 'adverse_event' | 'other';
  title: string;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  medications: mongoose.Types.ObjectId[];
  vitalSigns: {
    bloodPressure?: {
      systolic?: number;
      diastolic?: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  laborResults: Array<{
    test: string;
    result: string;
    normalRange: string;
    date: Date;
  }>;
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments: string[];
  priority: 'low' | 'medium' | 'high';
  isConfidential: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalNoteSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  pharmacist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workplaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workplace',
    required: true,
    index: true,
  },
  locationId: {
    type: String,
    index: true,
    sparse: true, // Allow null values and don't index them
  },
  type: {
    type: String,
    enum: ['consultation', 'medication_review', 'follow_up', 'adverse_event', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true
  },
  content: {
    subjective: String, // Patient's complaint/symptoms
    objective: String,  // Observable data
    assessment: String, // Analysis
    plan: String       // Action plan
  },
  medications: [{
    type: Schema.Types.ObjectId,
    ref: 'Medication'
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  laborResults: [{
    test: String,
    result: String,
    normalRange: String,
    date: Date
  }],
  recommendations: [String],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  attachments: [String], // File URLs
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isConfidential: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes for efficient querying
clinicalNoteSchema.index({ workplaceId: 1, patient: 1 });
clinicalNoteSchema.index({ workplaceId: 1, pharmacist: 1 });
clinicalNoteSchema.index({ workplaceId: 1, type: 1 });
clinicalNoteSchema.index({ workplaceId: 1, locationId: 1 }, { sparse: true });
clinicalNoteSchema.index({ createdAt: -1 });

export default mongoose.model<IClinicalNote>('ClinicalNote', clinicalNoteSchema);