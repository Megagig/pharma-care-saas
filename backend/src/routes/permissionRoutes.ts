import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { permissionController } from '../controllers/permissionController';

const router = express.Router();

// All permission management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Permission CRUD operations - Super admin has full access
router.get('/', permissionController.getPermissions);
router.get('/matrix', permissionController.getPermissionMatrix);
router.post('/', permissionController.createPermission);
router.put('/:action', permissionController.updatePermission);

// Permission categorization and analysis
router.get('/categories', permissionController.getPermissionCategories);
router.get('/dependencies', permissionController.getPermissionDependencies);

// Permission usage and validation
router.get('/:action/usage', permissionController.getPermissionUsage);
router.post('/validate', permissionController.validatePermissions);

export default router;