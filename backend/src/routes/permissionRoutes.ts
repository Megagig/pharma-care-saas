import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { permissionController } from '../controllers/permissionController';

const router = express.Router();

// All permission management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Permission CRUD operations
router.get('/', requireDynamicPermission('permission:read'), permissionController.getPermissions);
router.get('/matrix', requireDynamicPermission('permission:read'), permissionController.getPermissionMatrix);
router.post('/', requireDynamicPermission('permission:create'), permissionController.createPermission);
router.put('/:action', requireDynamicPermission('permission:update'), permissionController.updatePermission);

// Permission categorization and analysis
router.get('/categories', requireDynamicPermission('permission:read'), permissionController.getPermissionCategories);
router.get('/dependencies', requireDynamicPermission('permission:read'), permissionController.getPermissionDependencies);

// Permission usage and validation
router.get('/:action/usage', requireDynamicPermission('permission:read'), permissionController.getPermissionUsage);
router.post('/validate', requireDynamicPermission('permission:read'), permissionController.validatePermissions);

export default router;