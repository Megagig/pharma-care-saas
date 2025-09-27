/**
 * Feature Flag Model
 * 
 * Stores feature flag configuration for the application
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureFlag extends Document {
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  allowedTiers: string[];
  allowedRoles: string[];
  customRules?: {
    requiredLicense?: boolean;
    maxUsers?: number;
    [key: string]: any;
  };
  metadata?: {
    category: string;
    priority: string;
    tags: string[];
    [key: string]: any;
  };
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  allowedTiers: [{
    type: String,
    trim: true,
  }],
  allowedRoles: [{
    type: String,
    trim: true,
  }],
  customRules: {
    type: Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    category: {
      type: String,
      default: 'core',
    },
    priority: {
      type: String,
      default: 'medium',
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient queries
FeatureFlagSchema.index({ key: 1, isActive: 1 });
FeatureFlagSchema.index({ 'metadata.category': 1, isActive: 1 });
FeatureFlagSchema.index({ allowedTiers: 1, isActive: 1 });

// Update the updatedAt field on save
FeatureFlagSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
