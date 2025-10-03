import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { saasFeatureFlagsController } from '../controllers/saasFeatureFlagsController';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Apply authentication and super admin authorization to all routes
router.use(auth);
router.use(requireSuperAdmin);

/**
 * SaaS Feature Flags Routes
 * All routes require super admin privileges
 */

// Get enhanced feature flags list
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be true or false'),
    query('sortBy').optional().isString().withMessage('Sort by must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validateRequest,
  saasFeatureFlagsController.getEnhancedFeatureFlags.bind(saasFeatureFlagsController)
);

// Get feature flag usage metrics (all flags or specific flag)
router.get(
  '/usage-metrics',
  [
    query('flagId').optional().isMongoId().withMessage('Flag ID must be a valid MongoDB ObjectId'),
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range'),
    query('includeDetails').optional().isIn(['true', 'false']).withMessage('Include details must be true or false')
  ],
  validateRequest,
  saasFeatureFlagsController.getUsageMetrics.bind(saasFeatureFlagsController)
);

// Bulk update feature flags
router.post(
  '/bulk-update',
  [
    body('flagIds')
      .isArray({ min: 1 })
      .withMessage('Flag IDs must be a non-empty array')
      .custom((flagIds) => {
        if (!flagIds.every((id: any) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
          throw new Error('All flag IDs must be valid MongoDB ObjectIds');
        }
        return true;
      }),
    body('updates')
      .isObject()
      .withMessage('Updates must be an object')
      .custom((updates) => {
        // Prevent updating protected fields
        const protectedFields = ['_id', 'key', 'createdAt'];
        const hasProtectedField = protectedFields.some(field => updates.hasOwnProperty(field));
        if (hasProtectedField) {
          throw new Error(`Cannot update protected fields: ${protectedFields.join(', ')}`);
        }
        return true;
      })
  ],
  validateRequest,
  saasFeatureFlagsController.bulkUpdateFeatureFlags.bind(saasFeatureFlagsController)
);

// Update feature flag targeting rules
router.put(
  '/:flagId/targeting',
  [
    param('flagId').isMongoId().withMessage('Flag ID must be a valid MongoDB ObjectId'),
    body('targetingRules')
      .isObject()
      .withMessage('Targeting rules must be an object'),
    body('targetingRules.pharmacies')
      .optional()
      .isArray()
      .withMessage('Pharmacies must be an array'),
    body('targetingRules.userGroups')
      .optional()
      .isArray()
      .withMessage('User groups must be an array'),
    body('targetingRules.subscriptionPlans')
      .optional()
      .isArray()
      .withMessage('Subscription plans must be an array'),
    body('targetingRules.percentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Percentage must be a number between 0 and 100'),
    body('targetingRules.conditions')
      .optional()
      .isObject()
      .withMessage('Conditions must be an object'),
    body('targetingRules.conditions.dateRange.startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    body('targetingRules.conditions.dateRange.endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  saasFeatureFlagsController.updateTargetingRules.bind(saasFeatureFlagsController)
);

// Get feature flag impact analysis
router.get(
  '/:flagId/impact',
  [
    param('flagId').isMongoId().withMessage('Flag ID must be a valid MongoDB ObjectId')
  ],
  validateRequest,
  saasFeatureFlagsController.getFeatureFlagImpact.bind(saasFeatureFlagsController)
);

// Get feature flag rollout status
router.get(
  '/:flagId/rollout',
  [
    param('flagId').isMongoId().withMessage('Flag ID must be a valid MongoDB ObjectId')
  ],
  validateRequest,
  saasFeatureFlagsController.getRolloutStatus.bind(saasFeatureFlagsController)
);

export default router;