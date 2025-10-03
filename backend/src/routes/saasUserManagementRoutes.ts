import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { saasUserManagementController } from '../controllers/saasUserManagementController';
import { validateRequest } from '../middlewares/validation';

const router = Router();

// Apply authentication and super admin authorization to all routes
router.use(auth);
router.use(requireSuperAdmin);

/**
 * SaaS User Management Routes
 * All routes require super admin privileges
 */

// Get all users with filtering and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString().withMessage('Sort by must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('role').optional().isString().withMessage('Role must be a string'),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
    query('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID'),
    query('subscriptionPlan').optional().isString().withMessage('Subscription plan must be a string'),
    query('lastLoginAfter').optional().isISO8601().withMessage('Invalid date format for lastLoginAfter'),
    query('lastLoginBefore').optional().isISO8601().withMessage('Invalid date format for lastLoginBefore')
  ],
  validateRequest,
  saasUserManagementController.getAllUsers.bind(saasUserManagementController)
);

// Get user statistics
router.get(
  '/statistics',
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range')
  ],
  validateRequest,
  saasUserManagementController.getUserStatistics.bind(saasUserManagementController)
);

// Search users with advanced filters
router.post(
  '/search',
  [
    body('query').optional().isString().withMessage('Query must be a string'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    body('pagination').optional().isObject().withMessage('Pagination must be an object'),
    body('pagination.page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    body('pagination.limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    body('includeInactive').optional().isBoolean().withMessage('Include inactive must be a boolean')
  ],
  validateRequest,
  saasUserManagementController.searchUsers.bind(saasUserManagementController)
);

// Bulk assign roles
router.post(
  '/bulk-assign-roles',
  [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be a non-empty array')
      .custom((userIds) => {
        if (!userIds.every((id: any) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
          throw new Error('All user IDs must be valid MongoDB ObjectIds');
        }
        return true;
      }),
    body('roleId').isMongoId().withMessage('Role ID must be a valid MongoDB ObjectId'),
    body('workspaceId').optional().isMongoId().withMessage('Workspace ID must be a valid MongoDB ObjectId')
  ],
  validateRequest,
  saasUserManagementController.bulkAssignRoles.bind(saasUserManagementController)
);

// Get user by ID
router.get(
  '/:userId',
  [
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId')
  ],
  validateRequest,
  saasUserManagementController.getUserById.bind(saasUserManagementController)
);

// Update user role
router.put(
  '/:userId/role',
  [
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
    body('roleId').isMongoId().withMessage('Role ID must be a valid MongoDB ObjectId'),
    body('workspaceId').optional().isMongoId().withMessage('Workspace ID must be a valid MongoDB ObjectId'),
    body('reason').optional().isString().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters')
  ],
  validateRequest,
  saasUserManagementController.updateUserRole.bind(saasUserManagementController)
);

// Suspend user
router.put(
  '/:userId/suspend',
  [
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
    body('reason')
      .notEmpty()
      .withMessage('Suspension reason is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Reason must be between 10 and 1000 characters')
  ],
  validateRequest,
  saasUserManagementController.suspendUser.bind(saasUserManagementController)
);

// Reactivate user
router.put(
  '/:userId/reactivate',
  [
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId')
  ],
  validateRequest,
  saasUserManagementController.reactivateUser.bind(saasUserManagementController)
);

// Impersonate user
router.post(
  '/:userId/impersonate',
  [
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
    body('duration')
      .optional()
      .isInt({ min: 300, max: 86400 })
      .withMessage('Duration must be between 300 seconds (5 minutes) and 86400 seconds (24 hours)')
  ],
  validateRequest,
  saasUserManagementController.impersonateUser.bind(saasUserManagementController)
);

export default router;