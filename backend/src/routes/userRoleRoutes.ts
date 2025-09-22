import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { userRoleController } from '../controllers/userRoleController';

const router = express.Router();

// All user role management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// User role assignment operations
router.post('/:id/roles', requireDynamicPermission('user:update'), userRoleController.assignUserRoles);
router.delete('/:id/roles/:roleId', requireDynamicPermission('user:update'), userRoleController.revokeUserRole);

// User permission management
router.put('/:id/permissions', requireDynamicPermission('user:update'), userRoleController.updateUserPermissions);
router.get('/:id/effective-permissions', requireDynamicPermission('user:read'), userRoleController.getUserEffectivePermissions);

// Bulk operations
router.post('/bulk-update', requireDynamicPermission('user:update'), userRoleController.bulkUpdateUsers);

export default router;