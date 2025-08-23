import mongoose, { Document, Schema } from 'mongoose';

export interface IClinicalNote extends Document {
  patient: mongoose.Types.ObjectId;
  pharmacist: mongoose.Types.ObjectId;
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

export default mongoose.model<IClinicalNote>('ClinicalNote', clinicalNoteSchema);