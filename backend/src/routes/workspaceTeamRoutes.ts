import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { auth } from '../middlewares/auth';
import { requireWorkspaceOwner } from '../middlewares/rbac';
import { validateRequest } from '../middlewares/validation';
import { workspaceTeamController } from '../controllers/workspaceTeamController';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Apply workspace owner authorization to all routes
router.use(requireWorkspaceOwner);

/**
 * Workspace Team Management Routes
 * All routes require workspace owner privileges (pharmacy_outlet role)
 */

/**
 * Get all members in the workspace
 * @route GET /api/workspace/team/members
 * @access Private (Workspace owners only)
 */
router.get(
  '/members',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
    query('role')
      .optional()
      .isIn(['Owner', 'Staff', 'Pharmacist', 'Cashier', 'Technician', 'Assistant'])
      .withMessage('Invalid workplace role'),
    query('status')
      .optional()
      .isIn(['pending', 'active', 'suspended', 'license_pending', 'license_rejected'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  workspaceTeamController.getMembers.bind(workspaceTeamController)
);

/**
 * Update member role
 * @route PUT /api/workspace/team/members/:id
 * @access Private (Workspace owners only)
 */
router.put(
  '/members/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Member ID must be a valid MongoDB ObjectId'),
    body('workplaceRole')
      .notEmpty()
      .withMessage('Workplace role is required')
      .isIn(['Owner', 'Staff', 'Pharmacist', 'Cashier', 'Technician', 'Assistant'])
      .withMessage('Invalid workplace role'),
    body('reason')
      .optional()
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reason must be between 1 and 500 characters'),
  ],
  validateRequest,
  workspaceTeamController.updateMemberRole.bind(workspaceTeamController)
);

/**
 * Remove member from workspace
 * @route DELETE /api/workspace/team/members/:id
 * @access Private (Workspace owners only)
 */
router.delete(
  '/members/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Member ID must be a valid MongoDB ObjectId'),
    body('reason')
      .optional()
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reason must be between 1 and 500 characters'),
  ],
  validateRequest,
  workspaceTeamController.removeMember.bind(workspaceTeamController)
);

/**
 * Suspend a member
 * @route POST /api/workspace/team/members/:id/suspend
 * @access Private (Workspace owners only)
 */
router.post(
  '/members/:id/suspend',
  [
    param('id')
      .isMongoId()
      .withMessage('Member ID must be a valid MongoDB ObjectId'),
    body('reason')
      .notEmpty()
      .withMessage('Suspension reason is required')
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reason must be between 1 and 500 characters'),
  ],
  validateRequest,
  workspaceTeamController.suspendMember.bind(workspaceTeamController)
);

/**
 * Activate a suspended member
 * @route POST /api/workspace/team/members/:id/activate
 * @access Private (Workspace owners only)
 */
router.post(
  '/members/:id/activate',
  [
    param('id')
      .isMongoId()
      .withMessage('Member ID must be a valid MongoDB ObjectId'),
  ],
  validateRequest,
  workspaceTeamController.activateMember.bind(workspaceTeamController)
);

/**
 * Get audit logs for the workspace
 * @route GET /api/workspace/team/audit
 * @access Private (Workspace owners only)
 */
router.get(
  '/audit',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('actorId')
      .optional()
      .isMongoId()
      .withMessage('Actor ID must be a valid MongoDB ObjectId'),
    query('targetId')
      .optional()
      .isMongoId()
      .withMessage('Target ID must be a valid MongoDB ObjectId'),
    query('category')
      .optional()
      .isIn(['member', 'role', 'permission', 'invite', 'auth', 'settings'])
      .withMessage('Invalid category'),
    query('action')
      .optional()
      .isString()
      .withMessage('Action must be a string'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity'),
  ],
  validateRequest,
  workspaceTeamController.getAuditLogs.bind(workspaceTeamController)
);

/**
 * Export audit logs to CSV
 * @route GET /api/workspace/team/audit/export
 * @access Private (Workspace owners only)
 */
router.get(
  '/audit/export',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('actorId')
      .optional()
      .isMongoId()
      .withMessage('Actor ID must be a valid MongoDB ObjectId'),
    query('targetId')
      .optional()
      .isMongoId()
      .withMessage('Target ID must be a valid MongoDB ObjectId'),
    query('category')
      .optional()
      .isIn(['member', 'role', 'permission', 'invite', 'auth', 'settings'])
      .withMessage('Invalid category'),
    query('action')
      .optional()
      .isString()
      .withMessage('Action must be a string'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity'),
  ],
  validateRequest,
  workspaceTeamController.exportAuditLogs.bind(workspaceTeamController)
);

/**
 * Get audit statistics
 * @route GET /api/workspace/team/audit/statistics
 * @access Private (Workspace owners only)
 */
router.get(
  '/audit/statistics',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],
  validateRequest,
  workspaceTeamController.getAuditStatistics.bind(workspaceTeamController)
);

export default router;
