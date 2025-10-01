import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { roleController } from '../controllers/roleController';

const router = express.Router();

// All role management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Role CRUD operations - Super admin has full access without dynamic permission checks
router.post('/', roleController.createRole.bind(roleController));
router.get('/', roleController.getRoles.bind(roleController));
router.get('/:id', roleController.getRoleById.bind(roleController));
router.put('/:id', roleController.updateRole.bind(roleController));
router.delete('/:id', roleController.deleteRole.bind(roleController));

// Role permissions
router.get('/:id/permissions', roleController.getRolePermissions.bind(roleController));

export default router;