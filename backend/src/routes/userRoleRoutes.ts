import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { userRoleController } from '../controllers/userRoleController';

const router = express.Router();

// All user role management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// User role assignment operations - Super admin has full access
router.get('/:id/roles', userRoleController.getUserRoles);
router.post('/:id/roles', userRoleController.assignUserRoles);
router.delete('/:id/roles/:roleId', userRoleController.revokeUserRole);

// User permission management
router.put('/:id/permissions', userRoleController.updateUserPermissions);
router.get('/:id/effective-permissions', userRoleController.getUserEffectivePermissions);

// Bulk operations
router.post('/bulk-update', userRoleController.bulkUpdateUsers);

export default router;