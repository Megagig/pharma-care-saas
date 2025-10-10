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

export default router;
