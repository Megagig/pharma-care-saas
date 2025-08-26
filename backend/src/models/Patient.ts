import mongoose, { Document, Schema } from 'mongoose';
import {
  tenancyGuardPlugin,
  addAuditFields,
  NIGERIAN_STATES,
  BLOOD_GROUPS,
  GENOTYPES,
  MARITAL_STATUS,
  GENDERS,
} from '../utils/tenancyGuard';

export interface IPatientVitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  rr?: number;
  tempC?: number;
  heartSounds?: string;
  pallor?: 'none' | 'mild' | 'moderate' | 'severe';
  dehydration?: 'none' | 'mild' | 'moderate' | 'severe';
  recordedAt?: Date;
}

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId; // ref Workplace, indexed (changed from pharmacyId)
  mrn: string; // generated patient code, unique per workplace

  // Demography
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: Date;
  age?: number; // derive/display if dob missing
  gender?: 'male' | 'female' | 'other';
  phone?: string; // +234 format
  email?: string;
  address?: string;
  state?: string; // NG state
  lga?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  genotype?: 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'CC';
  weightKg?: number;

  // Clinical snapshots (latest vitals cached for list speed)
  latestVitals?: IPatientVitals;

  // Flags
  hasActiveDTP?: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getAge(): number;
  getDisplayName(): string;
  updateLatestVitals(vitals: IPatientVitals): void;
}

const patientSchema = new Schema(
  {
    workplaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workplace',
      required: true,
      index: true,
    },
    mrn: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Demography
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    otherNames: {
      type: String,
      trim: true,
      maxlength: [100, 'Other names cannot exceed 100 characters'],
    },
    dob: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          if (value) {
            const now = new Date();
            const age = now.getFullYear() - value.getFullYear();
            return age >= 0 && age <= 150;
          }
          return true;
        },
        message: 'Invalid date of birth',
      },
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150'],
    },
    gender: {
      type: String,
      enum: GENDERS,
    },
    phone: {
      type: String,
      validate: {
        validator: function (value: string) {
          if (value) {
            // E.164 format for Nigerian numbers: +234...
            return /^\+234[789][01]\d{8}$/.test(value);
          }
          return true;
        },
        message: 'Phone must be in E.164 format (+234...)',
      },
    },
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (value: string) {
          if (value) {
            return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
          }
          return true;
        },
        message: 'Please enter a valid email',
      },
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    state: {
      type: String,
      enum: NIGERIAN_STATES,
    },
    lga: {
      type: String,
      maxlength: [50, 'LGA cannot exceed 50 characters'],
    },
    maritalStatus: {
      type: String,
      enum: MARITAL_STATUS,
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
    },
    genotype: {
      type: String,
      enum: GENOTYPES,
    },
    weightKg: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      max: [1000, 'Weight seems unrealistic'],
    },

    // Clinical snapshots
    latestVitals: {
      bpSystolic: {
        type: Number,
        min: [50, 'Systolic BP too low'],
        max: [300, 'Systolic BP too high'],
      },
      bpDiastolic: {
        type: Number,
        min: [30, 'Diastolic BP too low'],
        max: [200, 'Diastolic BP too high'],
      },
      rr: {
        type: Number,
        min: [8, 'Respiratory rate too low'],
        max: [60, 'Respiratory rate too high'],
      },
      tempC: {
        type: Number,
        min: [30, 'Temperature too low'],
        max: [45, 'Temperature too high'],
      },
      heartSounds: {
        type: String,
        maxlength: [100, 'Heart sounds description too long'],
      },
      pallor: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe'],
      },
      dehydration: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe'],
      },
      recordedAt: Date,
    },

    // Flags
    hasActiveDTP: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add audit fields (createdBy, updatedBy, isDeleted)
addAuditFields(patientSchema);

// Apply tenancy guard plugin
patientSchema.plugin(tenancyGuardPlugin);

// Compound indexes for tenancy and uniqueness
patientSchema.index({ workplaceId: 1, mrn: 1 }, { unique: true });
patientSchema.index({ workplaceId: 1, lastName: 1, firstName: 1 });
patientSchema.index({ workplaceId: 1, isDeleted: 1 });
patientSchema.index({ workplaceId: 1, phone: 1 }, { sparse: true });
patientSchema.index({ workplaceId: 1, email: 1 }, { sparse: true });
patientSchema.index({ hasActiveDTP: 1 });
patientSchema.index({ createdAt: -1 });

// Virtual for computed age from DOB
patientSchema.virtual('computedAge').get(function (this: IPatient) {
  if (this.dob) {
    const now = new Date();
    const age = now.getFullYear() - this.dob.getFullYear();
    const monthDiff = now.getMonth() - this.dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < this.dob.getDate())
    ) {
      return age - 1;
    }
    return age;
  }
  return this.age;
});

// Instance methods
patientSchema.methods.getAge = function (this: IPatient): number {
  if (this.dob) {
    const now = new Date();
    const age = now.getFullYear() - this.dob.getFullYear();
    const monthDiff = now.getMonth() - this.dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < this.dob.getDate())
    ) {
      return age - 1;
    }
    return age;
  }
  return this.age || 0;
};

patientSchema.methods.getDisplayName = function (this: IPatient): string {
  const names = [this.firstName];
  if (this.otherNames) names.push(this.otherNames);
  names.push(this.lastName);
  return names.join(' ');
};

patientSchema.methods.updateLatestVitals = function (
  this: IPatient,
  vitals: IPatientVitals
): void {
  this.latestVitals = {
    ...vitals,
    recordedAt: new Date(),
  };
};

// Pre-save middleware to validate and set computed fields
patientSchema.pre('save', function (this: IPatient) {
  // Ensure either dob or age is provided
  if (!this.dob && !this.age) {
    throw new Error('Either date of birth or age must be provided');
  }

  // Set computed age if dob is provided
  if (this.dob) {
    this.age = this.getAge();
  }
});

// Static method to generate next MRN
patientSchema.statics.generateNextMRN = async function (
  workplaceId: mongoose.Types.ObjectId,
  workplaceCode: string
): Promise<string> {
  const lastPatient = await this.findOne(
    { workplaceId },
    {},
    { sort: { createdAt: -1 }, bypassTenancyGuard: true }
  );

  let sequence = 1;
  if (lastPatient?.mrn) {
    const match = lastPatient.mrn.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `${workplaceCode}-${sequence.toString().padStart(4, '0')}`;
};

export default mongoose.model<IPatient>('Patient', patientSchema);
