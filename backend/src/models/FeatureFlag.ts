import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureFlag extends Document {
  name: string;
  key: string;
  description: string;
  isActive: boolean;
  allowedTiers: string[];
  allowedRoles: string[];
  customRules?: {
    maxUsers?: number;
    requiredLicense?: boolean;
    customLogic?: string;
  };
  metadata: {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z_]+$/,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  allowedTiers: [{
    type: String,
    enum: ['free_trial', 'basic', 'pro', 'enterprise'],
    index: true
  }],
  allowedRoles: [{
    type: String,
    enum: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'intern_pharmacist', 'super_admin', 'owner'],
    index: true
  }],
  customRules: {
    maxUsers: {
      type: Number,
      min: 1
    },
    requiredLicense: {
      type: Boolean,
      default: false
    },
    customLogic: {
      type: String // For future JavaScript evaluation
    }
  },
  metadata: {
    category: {
      type: String,
      required: true,
      enum: ['core', 'analytics', 'collaboration', 'integration', 'reporting', 'compliance', 'administration'],
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    tags: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound indexes for efficient queries
featureFlagSchema.index({ isActive: 1, allowedTiers: 1 });
featureFlagSchema.index({ isActive: 1, allowedRoles: 1 });
featureFlagSchema.index({ 'metadata.category': 1, isActive: 1 });

export default mongoose.model<IFeatureFlag>('FeatureFlag', featureFlagSchema);