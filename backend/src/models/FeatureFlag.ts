/**
 * Feature Flag Model
 * 
 * Stores feature flag overrides for users and workspaces
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureFlag extends Document {
  featureName: string;
  userId?: string;
  workspaceId?: string;
  enabled: boolean;
  reason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  featureName: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    sparse: true,
    index: true,
  },
  workspaceId: {
    type: String,
    sparse: true,
    index: true,
  },
  enabled: {
    type: Boolean,
    required: true,
  },
  reason: {
    type: String,
    maxlength: 500,
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }, // TTL index
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
FeatureFlagSchema.index({ featureName: 1, userId: 1 }, { unique: true, sparse: true });
FeatureFlagSchema.index({ featureName: 1, workspaceId: 1 }, { unique: true, sparse: true });

// Update the updatedAt field on save
FeatureFlagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);