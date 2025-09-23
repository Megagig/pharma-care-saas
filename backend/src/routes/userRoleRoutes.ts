import { Router } from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { userRoleController } from '../controllers/userRoleController';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// User role management routes - accessible by super admin and users with appropriate permissions
router.get('/users/:id/roles', userRoleController.getUserRoles);
router.get(
  '/users/:id/effective-permissions',
  userRoleController.getUserEffectivePermissions
);
router.post(
  '/users/:id/check-permission',
  userRoleController.checkUserPermission
);
router.post(
  '/users/:id/preview-permissions',
  userRoleController.previewPermissionChanges
);
router.post(
  '/users/:id/refresh-cache',
  userRoleController.refreshUserPermissionCache
);

// Admin-only routes
router.post(
  '/users/assign-roles',
  requireSuperAdmin,
  userRoleController.assignUserRoles
);
router.delete(
  '/users/:id/roles/:roleId',
  requireSuperAdmin,
  userRoleController.revokeUserRole
);
router.put(
  '/users/:id/permissions',
  requireSuperAdmin,
  userRoleController.updateUserPermissions
);
router.post(
  '/users/bulk-update',
  requireSuperAdmin,
  userRoleController.bulkUpdateUsers
);
router.post(
  '/users/:id/detect-conflicts',
  requireSuperAdmin,
  userRoleController.detectRoleConflicts
);
router.post(
  '/users/:id/resolve-conflicts',
  requireSuperAdmin,
  userRoleController.resolveRoleConflicts
);

export default router;
