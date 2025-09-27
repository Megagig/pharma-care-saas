import { Request, Response } from 'express';
import { FeatureFlag } from '../models/FeatureFlag';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { IUser } from '../models/User';

// Extend the Express Request type to include user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Get all feature flags
 * @route   GET /api/feature-flags
 * @access  Private (All authenticated users)
 */
export const getAllFeatureFlags = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let query: { isActive?: boolean } = { isActive: true };

    // Super admins can see all flags including inactive ones
    if (user && user.role === 'super_admin') {
      query = {}; // Empty query to get all flags
    }

    const featureFlags = await FeatureFlag.find(query).sort({
      'metadata.category': 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: featureFlags.length,
      data: featureFlags,
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Get feature flag by ID
 * @route   GET /api/feature-flags/:id
 * @access  Private (All authenticated users)
 */
export const getFeatureFlagById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check if ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag ID is required',
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    // Build query based on user role
    const query: { _id: mongoose.Types.ObjectId; isActive?: boolean } = {
      _id: new mongoose.Types.ObjectId(id),
    };

    // Regular users can only see active flags
    if (!user || user.role !== 'super_admin') {
      query.isActive = true;
    }

    const featureFlag = await FeatureFlag.findOne(query);

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: featureFlag,
    });
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Create a new feature flag
 * @route   POST /api/admin/feature-flags
 * @access  Private (Super Admin only)
 */
export const createFeatureFlag = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const {
      name,
      key,
      description,
      isActive = true,
      allowedTiers = [],
      allowedRoles = [],
      customRules = {},
      metadata = {
        category: 'core',
        priority: 'medium',
        tags: [],
      },
    } = req.body;

    // Check if feature flag key already exists
    const existingFlag = await FeatureFlag.findOne({ key: key.toLowerCase() });

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: `Feature flag with key '${key}' already exists`,
      });
    }

    // Create new feature flag
    const featureFlag = new FeatureFlag({
      name,
      key: key.toLowerCase(),
      description,
      isActive,
      allowedTiers,
      allowedRoles,
      customRules,
      metadata,
    });

    await featureFlag.save();

    return res.status(201).json({
      success: true,
      message: 'Feature flag created successfully',
      data: featureFlag,
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Update a feature flag
 * @route   PUT /api/admin/feature-flags/:id
 * @access  Private (Super Admin only)
 */
export const updateFeatureFlag = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { id } = req.params;

    // Check if ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag ID is required',
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    const {
      name,
      description,
      isActive,
      allowedTiers,
      allowedRoles,
      customRules,
      metadata,
    } = req.body;

    // Don't allow updating the key as it's used in code
    if (req.body.key) {
      delete req.body.key;
    }

    // Find feature flag
    const featureFlag = await FeatureFlag.findById(id);

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    // Update fields
    if (name) featureFlag.name = name;
    if (description !== undefined) featureFlag.description = description;
    if (isActive !== undefined) featureFlag.isActive = isActive;
    if (allowedTiers) featureFlag.allowedTiers = allowedTiers;
    if (allowedRoles) featureFlag.allowedRoles = allowedRoles;
    if (customRules) featureFlag.customRules = customRules;
    if (metadata) featureFlag.metadata = metadata;

    // Save updated feature flag
    await featureFlag.save();

    return res.status(200).json({
      success: true,
      message: 'Feature flag updated successfully',
      data: featureFlag,
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Delete a feature flag
 * @route   DELETE /api/admin/feature-flags/:id
 * @access  Private (Super Admin only)
 */
export const deleteFeatureFlag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag ID is required',
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    // Find and delete feature flag
    const featureFlag = await FeatureFlag.findByIdAndDelete(id);

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feature flag deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Toggle feature flag active status
 * @route   PATCH /api/admin/feature-flags/:id/toggle
 * @access  Private (Super Admin only)
 */
export const toggleFeatureFlagStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag ID is required',
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    // Find feature flag
    const featureFlag = await FeatureFlag.findById(id);

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    // Toggle active status
    featureFlag.isActive = !featureFlag.isActive;

    // Save updated feature flag
    await featureFlag.save();

    return res.status(200).json({
      success: true,
      message: `Feature flag ${featureFlag.isActive ? 'enabled' : 'disabled'
        } successfully`,
      data: featureFlag,
    });
  } catch (error) {
    console.error('Error toggling feature flag status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Get feature flags by category
 * @route   GET /api/admin/feature-flags/category/:category
 * @access  Private (Super Admin only)
 */
export const getFeatureFlagsByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { category } = req.params;

    const featureFlags = await FeatureFlag.find({
      'metadata.category': category,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: featureFlags.length,
      data: featureFlags,
    });
  } catch (error) {
    console.error('Error fetching feature flags by category:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @desc    Get feature flags by subscription tier
 * @route   GET /api/admin/feature-flags/tier/:tier
 * @access  Private (Super Admin only)
 */
export const getFeatureFlagsByTier = async (req: Request, res: Response) => {
  try {
    const { tier } = req.params;

    const featureFlags = await FeatureFlag.find({
      allowedTiers: tier,
    }).sort({ 'metadata.category': 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: featureFlags.length,
      data: featureFlags,
    });
  } catch (error) {
    console.error('Error fetching feature flags by tier:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default {
  getAllFeatureFlags,
  getFeatureFlagById,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  toggleFeatureFlagStatus,
  getFeatureFlagsByCategory,
  getFeatureFlagsByTier,
};
