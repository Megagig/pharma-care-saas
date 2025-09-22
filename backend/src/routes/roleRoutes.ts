import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { roleController } from '../controllers/roleController';

const router = express.Router();

// All role management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Role CRUD operations - Super admin has full access without dynamic permission checks
router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Role permissions
router.get('/:id/permissions', roleController.getRolePermissions);

export default router;