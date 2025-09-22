import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { roleController } from '../controllers/roleController';

const router = express.Router();

// All role management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Role CRUD operations
router.post('/', requireDynamicPermission('role:create'), roleController.createRole);
router.get('/', requireDynamicPermission('role:read'), roleController.getRoles);
router.get('/:id', requireDynamicPermission('role:read'), roleController.getRoleById);
router.put('/:id', requireDynamicPermission('role:update'), roleController.updateRole);
router.delete('/:id', requireDynamicPermission('role:delete'), roleController.deleteRole);

// Role permissions
router.get('/:id/permissions', requireDynamicPermission('role:read'), roleController.getRolePermissions);

export default router;