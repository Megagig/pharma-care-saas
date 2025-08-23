import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  pharmacist: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  contactInfo: {
    phone: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  medicalInfo: {
    allergies: string[];
    chronicConditions: string[];
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  };
  insuranceInfo?: {
    provider?: string;
    memberId?: string;
    groupNumber?: string;
  };
  medications: mongoose.Types.ObjectId[];
  clinicalNotes: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema({
  pharmacist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contactInfo: {
    phone: { type: String, required: true },
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  medicalInfo: {
    allergies: [String],
    chronicConditions: [String],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  insuranceInfo: {
    provider: String,
    memberId: String,
    groupNumber: String
  },
  medications: [{
    type: Schema.Types.ObjectId,
    ref: 'Medication'
  }],
  clinicalNotes: [{
    type: Schema.Types.ObjectId,
    ref: 'ClinicalNote'
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IPatient>('Patient', patientSchema);