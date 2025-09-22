import express from 'express';
import { auth, requireSuperAdmin } from '../middlewares/auth';
import { requireDynamicPermission } from '../middlewares/rbac';
import { roleHierarchyController } from '../controllers/roleHierarchyController';

const router = express.Router();

// All role hierarchy management routes require authentication and super admin privileges
router.use(auth);
router.use(requireSuperAdmin);

// Role hierarchy management
router.post('/:id/children', requireDynamicPermission('role:update'), roleHierarchyController.addChildRoles);
router.delete('/:id/children/:childId', requireDynamicPermission('role:update'), roleHierarchyController.removeChildRole);
router.get('/:id/hierarchy', requireDynamicPermission('role:read'), roleHierarchyController.getRoleHierarchy);
router.put('/:id/parent', requireDynamicPermission('role:update'), roleHierarchyController.changeParentRole);

// Full hierarchy tree and validation
router.get('/hierarchy-tree', requireDynamicPermission('role:read'), roleHierarchyController.getFullRoleHierarchyTree);
router.post('/hierarchy/validate', requireDynamicPermission('role:read'), roleHierarchyController.validateRoleHierarchy);

export default router;