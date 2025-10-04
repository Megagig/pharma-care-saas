import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { FeatureFlag } from '../models/FeatureFlag';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import logger from '../utils/logger';

export interface TargetingRules {
  pharmacies?: string[];
  userGroups?: string[];
  subscriptionPlans?: string[];
  percentage?: number;
  conditions?: {
    userAttributes?: Record<string, any>;
    workspaceAttributes?: Record<string, any>;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  };
}

export interface FeatureFlagUsageMetrics {
  flagId: string;
  flagName: string;
  totalUsers: number;
  activeUsers: number;
  usagePercentage: number;
  lastUsed: Date;
  usageByPlan: Array<{
    plan: string;
    userCount: number;
    percentage: number;
  }>;
  usageByWorkspace: Array<{
    workspaceId: string;
    workspaceName: string;
    userCount: number;
  }>;
}

/**
 * SaaS Feature Flags Controller
 * Enhanced feature flag management with targeting rules and usage metrics
 * for the SaaS Settings Module
 */
export class SaaSFeatureFlagsController {

  /**
   * Get enhanced feature flags list with metadata
   * GET /api/admin/saas/feature-flags
   */
  async getEnhancedFeatureFlags(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        isActive = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      logger.info('Fetching enhanced feature flags', {
        adminId: req.user?._id,
        filters: { search, category, isActive }
      });

      // Build query
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { key: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (category) {
        query['metadata.category'] = category;
      }

      if (isActive !== '') {
        query.isActive = isActive === 'true';
      }

      // Build sort
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      // Get feature flags with pagination
      const [featureFlags, total] = await Promise.all([
        FeatureFlag.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        FeatureFlag.countDocuments(query)
      ]);

      // Enhance with usage metrics for each flag
      const enhancedFlags = await Promise.all(
        featureFlags.map(async (flag) => {
          const usageMetrics = await this.calculateFlagUsageMetrics(flag._id.toString());
          return {
            ...flag,
            usageMetrics: {
              totalUsers: usageMetrics.totalUsers,
              activeUsers: usageMetrics.activeUsers,
              usagePercentage: usageMetrics.usagePercentage,
              lastUsed: usageMetrics.lastUsed
            }
          };
        })
      );

      // Get categories for filtering
      const categories = await FeatureFlag.distinct('metadata.category');

      sendSuccess(
        res,
        {
          featureFlags: enhancedFlags,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          },
          filters: { search, category, isActive },
          categories,
          summary: {
            totalFlags: total,
            activeFlags: enhancedFlags.filter(f => f.isActive).length,
            inactiveFlags: enhancedFlags.filter(f => !f.isActive).length,
            categoriesCount: categories.length
          }
        },
        'Feature flags retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching enhanced feature flags:', error);
      sendError(
        res,
        'FEATURE_FLAGS_ERROR',
        'Failed to retrieve feature flags',
        500
      );
    }
  }

  /**
   * Update feature flag targeting rules
   * PUT /api/admin/saas/feature-flags/:flagId/targeting
   */
  async updateTargetingRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const { targetingRules } = req.body;

      if (!flagId || !mongoose.Types.ObjectId.isValid(flagId)) {
        sendError(res, 'INVALID_FLAG_ID', 'Invalid feature flag ID format', 400);
        return;
      }

      logger.info('Updating feature flag targeting rules', {
        adminId: req.user?._id,
        flagId,
        targetingRules
      });

      const featureFlag = await FeatureFlag.findById(flagId);

      if (!featureFlag) {
        sendError(res, 'FLAG_NOT_FOUND', 'Feature flag not found', 404);
        return;
      }

      // Validate targeting rules
      const validationResult = this.validateTargetingRules(targetingRules);
      if (!validationResult.isValid) {
        sendError(res, 'INVALID_TARGETING_RULES', validationResult.error, 400);
        return;
      }

      // Update targeting rules
      featureFlag.customRules = {
        ...featureFlag.customRules,
        targeting: targetingRules
      };

      // Update metadata
      featureFlag.metadata = {
        ...featureFlag.metadata,
        lastModified: new Date(),
        modifiedBy: req.user?._id
      };

      await featureFlag.save();

      // Log the change for audit
      logger.info('Feature flag targeting rules updated', {
        adminId: req.user?._id,
        flagId,
        flagName: featureFlag.name,
        previousRules: featureFlag.customRules?.targeting || {},
        newRules: targetingRules
      });

      sendSuccess(
        res,
        {
          flagId,
          flagName: featureFlag.name,
          targetingRules,
          updatedBy: req.user?._id,
          updatedAt: new Date()
        },
        'Targeting rules updated successfully'
      );
    } catch (error) {
      logger.error('Error updating targeting rules:', error);
      sendError(
        res,
        'TARGETING_UPDATE_ERROR',
        'Failed to update targeting rules',
        500
      );
    }
  }

  /**
   * Get feature flag usage metrics
   * GET /api/admin/saas/feature-flags/usage-metrics
   */
  async getUsageMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        flagId = '',
        timeRange = '30d',
        includeDetails = 'false'
      } = req.query;

      logger.info('Fetching feature flag usage metrics', {
        adminId: req.user?._id,
        flagId,
        timeRange,
        includeDetails
      });

      if (flagId) {
        // Get metrics for specific flag
        if (!mongoose.Types.ObjectId.isValid(flagId as string)) {
          sendError(res, 'INVALID_FLAG_ID', 'Invalid feature flag ID format', 400);
          return;
        }

        const metrics = await this.calculateFlagUsageMetrics(
          flagId as string,
          timeRange as string,
          includeDetails === 'true'
        );

        if (!metrics) {
          sendError(res, 'FLAG_NOT_FOUND', 'Feature flag not found', 404);
          return;
        }

        sendSuccess(
          res,
          { metrics, timeRange },
          'Feature flag usage metrics retrieved successfully'
        );
      } else {
        // Get metrics for all flags
        const allMetrics = await this.calculateAllFlagsUsageMetrics(
          timeRange as string,
          includeDetails === 'true'
        );

        sendSuccess(
          res,
          {
            metrics: allMetrics,
            timeRange,
            summary: {
              totalFlags: allMetrics.length,
              activeFlags: allMetrics.filter(m => m.activeUsers > 0).length,
              averageUsage: allMetrics.reduce((sum, m) => sum + m.usagePercentage, 0) / allMetrics.length || 0
            }
          },
          'All feature flags usage metrics retrieved successfully'
        );
      }
    } catch (error) {
      logger.error('Error fetching usage metrics:', error);
      sendError(
        res,
        'USAGE_METRICS_ERROR',
        'Failed to retrieve usage metrics',
        500
      );
    }
  }

  /**
   * Get feature flag impact analysis
   * GET /api/admin/saas/feature-flags/:flagId/impact
   */
  async getFeatureFlagImpact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;

      if (!flagId || !mongoose.Types.ObjectId.isValid(flagId)) {
        sendError(res, 'INVALID_FLAG_ID', 'Invalid feature flag ID format', 400);
        return;
      }

      logger.info('Analyzing feature flag impact', {
        adminId: req.user?._id,
        flagId
      });

      const featureFlag = await FeatureFlag.findById(flagId);

      if (!featureFlag) {
        sendError(res, 'FLAG_NOT_FOUND', 'Feature flag not found', 404);
        return;
      }

      const impact = await this.calculateFeatureFlagImpact(flagId);

      sendSuccess(
        res,
        {
          flagId,
          flagName: featureFlag.name,
          impact,
          analyzedAt: new Date()
        },
        'Feature flag impact analysis completed'
      );
    } catch (error) {
      logger.error('Error analyzing feature flag impact:', error);
      sendError(
        res,
        'IMPACT_ANALYSIS_ERROR',
        'Failed to analyze feature flag impact',
        500
      );
    }
  }

  /**
   * Bulk update feature flags
   * POST /api/admin/saas/feature-flags/bulk-update
   */
  async bulkUpdateFeatureFlags(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { flagIds, updates } = req.body;

      if (!flagIds || !Array.isArray(flagIds) || flagIds.length === 0) {
        sendError(res, 'INVALID_FLAG_IDS', 'Flag IDs array is required and cannot be empty', 400);
        return;
      }

      if (!updates || typeof updates !== 'object') {
        sendError(res, 'INVALID_UPDATES', 'Updates object is required', 400);
        return;
      }

      // Validate all flag IDs
      const invalidIds = flagIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        sendError(res, 'INVALID_FLAG_IDS', `Invalid flag IDs: ${invalidIds.join(', ')}`, 400);
        return;
      }

      logger.info('Bulk updating feature flags', {
        adminId: req.user?._id,
        flagIds,
        updates
      });

      const result = await this.performBulkUpdate(flagIds, updates, req.user?._id);

      sendSuccess(
        res,
        {
          totalFlags: flagIds.length,
          successfulUpdates: result.successful,
          failedUpdates: result.failed,
          updatedBy: req.user?._id,
          updatedAt: new Date(),
          details: result.details
        },
        'Bulk feature flag update completed'
      );
    } catch (error) {
      logger.error('Error in bulk feature flag update:', error);
      sendError(
        res,
        'BULK_UPDATE_ERROR',
        'Failed to perform bulk update',
        500
      );
    }
  }

  /**
   * Get feature flag rollout status
   * GET /api/admin/saas/feature-flags/:flagId/rollout
   */
  async getRolloutStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;

      if (!flagId || !mongoose.Types.ObjectId.isValid(flagId)) {
        sendError(res, 'INVALID_FLAG_ID', 'Invalid feature flag ID format', 400);
        return;
      }

      logger.info('Fetching feature flag rollout status', {
        adminId: req.user?._id,
        flagId
      });

      const rolloutStatus = await this.calculateRolloutStatus(flagId);

      if (!rolloutStatus) {
        sendError(res, 'FLAG_NOT_FOUND', 'Feature flag not found', 404);
        return;
      }

      sendSuccess(
        res,
        rolloutStatus,
        'Rollout status retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching rollout status:', error);
      sendError(
        res,
        'ROLLOUT_STATUS_ERROR',
        'Failed to retrieve rollout status',
        500
      );
    }
  }

  // Private helper methods

  private validateTargetingRules(rules: TargetingRules): { isValid: boolean; error?: string } {
    if (!rules || typeof rules !== 'object') {
      return { isValid: false, error: 'Targeting rules must be an object' };
    }

    // Validate percentage
    if (rules.percentage !== undefined) {
      if (typeof rules.percentage !== 'number' || rules.percentage < 0 || rules.percentage > 100) {
        return { isValid: false, error: 'Percentage must be a number between 0 and 100' };
      }
    }

    // Validate arrays
    if (rules.pharmacies && !Array.isArray(rules.pharmacies)) {
      return { isValid: false, error: 'Pharmacies must be an array' };
    }

    if (rules.userGroups && !Array.isArray(rules.userGroups)) {
      return { isValid: false, error: 'User groups must be an array' };
    }

    if (rules.subscriptionPlans && !Array.isArray(rules.subscriptionPlans)) {
      return { isValid: false, error: 'Subscription plans must be an array' };
    }

    // Validate date range
    if (rules.conditions?.dateRange) {
      const { startDate, endDate } = rules.conditions.dateRange;
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return { isValid: false, error: 'Start date must be before end date' };
      }
    }

    return { isValid: true };
  }

  private async calculateFlagUsageMetrics(
    flagId: string,
    timeRange: string = '30d',
    includeDetails: boolean = false
  ): Promise<FeatureFlagUsageMetrics | null> {
    try {
      const featureFlag = await FeatureFlag.findById(flagId);
      if (!featureFlag) {
        return null;
      }

      // This would integrate with actual usage tracking
      // For now, returning mock data structure
      const metrics: FeatureFlagUsageMetrics = {
        flagId,
        flagName: featureFlag.name,
        totalUsers: 0,
        activeUsers: 0,
        usagePercentage: 0,
        lastUsed: new Date(),
        usageByPlan: [],
        usageByWorkspace: []
      };

      return metrics;
    } catch (error) {
      logger.error('Error calculating flag usage metrics:', error);
      return null;
    }
  }

  private async calculateAllFlagsUsageMetrics(
    timeRange: string = '30d',
    includeDetails: boolean = false
  ): Promise<FeatureFlagUsageMetrics[]> {
    try {
      const featureFlags = await FeatureFlag.find({ isActive: true });
      
      const metrics = await Promise.all(
        featureFlags.map(flag => 
          this.calculateFlagUsageMetrics(flag._id.toString(), timeRange, includeDetails)
        )
      );

      return metrics.filter(m => m !== null) as FeatureFlagUsageMetrics[];
    } catch (error) {
      logger.error('Error calculating all flags usage metrics:', error);
      return [];
    }
  }

  private async calculateFeatureFlagImpact(flagId: string) {
    // This would analyze the impact of enabling/disabling the flag
    // For now, returning mock structure
    return {
      affectedUsers: 0,
      affectedWorkspaces: 0,
      estimatedImpact: 'low',
      dependencies: [],
      recommendations: []
    };
  }

  private async performBulkUpdate(flagIds: string[], updates: any, adminId?: string) {
    const results = {
      successful: 0,
      failed: 0,
      details: [] as Array<{ flagId: string; status: 'success' | 'failed'; error?: string }>
    };

    for (const flagId of flagIds) {
      try {
        const featureFlag = await FeatureFlag.findById(flagId);
        if (!featureFlag) {
          results.failed++;
          results.details.push({
            flagId,
            status: 'failed',
            error: 'Feature flag not found'
          });
          continue;
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
          if (key !== '_id' && key !== 'key') { // Protect immutable fields
            (featureFlag as any)[key] = updates[key];
          }
        });

        // Update metadata
        featureFlag.metadata = {
          ...featureFlag.metadata,
          lastModified: new Date(),
          modifiedBy: adminId
        };

        await featureFlag.save();
        results.successful++;
        results.details.push({
          flagId,
          status: 'success'
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          flagId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async calculateRolloutStatus(flagId: string) {
    try {
      const featureFlag = await FeatureFlag.findById(flagId);
      if (!featureFlag) {
        return null;
      }

      // This would calculate actual rollout metrics
      // For now, returning mock structure
      return {
        flagId,
        flagName: featureFlag.name,
        isActive: featureFlag.isActive,
        rolloutPercentage: featureFlag.customRules?.targeting?.percentage || 100,
        targetedUsers: 0,
        activeUsers: 0,
        rolloutStarted: featureFlag.createdAt,
        estimatedCompletion: null,
        status: featureFlag.isActive ? 'active' : 'inactive'
      };
    } catch (error) {
      logger.error('Error calculating rollout status:', error);
      return null;
    }
  }
}

// Create and export controller instance
export const saasFeatureFlagsController = new SaaSFeatureFlagsController();