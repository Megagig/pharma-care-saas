import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { roleHierarchyController } from '../controllers/roleHierarchyController';

const router = express.Router();

// All role hierarchy management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Role hierarchy management - Super admin has full access
router.post('/:id/children', roleHierarchyController.addChildRoles);
router.delete('/:id/children/:childId', roleHierarchyController.removeChildRole);
router.get('/:id/hierarchy', roleHierarchyController.getRoleHierarchy);
router.put('/:id/parent', roleHierarchyController.changeParentRole);

// Full hierarchy tree and validation
router.get('/hierarchy-tree', roleHierarchyController.getFullRoleHierarchyTree);
router.post('/hierarchy/validate', roleHierarchyController.validateRoleHierarchy);

export default router;