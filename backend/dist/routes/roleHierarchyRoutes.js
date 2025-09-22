"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const roleHierarchyController_1 = require("../controllers/roleHierarchyController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/:id/children', (0, rbac_1.requireDynamicPermission)('role:update'), roleHierarchyController_1.roleHierarchyController.addChildRoles);
router.delete('/:id/children/:childId', (0, rbac_1.requireDynamicPermission)('role:update'), roleHierarchyController_1.roleHierarchyController.removeChildRole);
router.get('/:id/hierarchy', (0, rbac_1.requireDynamicPermission)('role:read'), roleHierarchyController_1.roleHierarchyController.getRoleHierarchy);
router.put('/:id/parent', (0, rbac_1.requireDynamicPermission)('role:update'), roleHierarchyController_1.roleHierarchyController.changeParentRole);
router.get('/hierarchy-tree', (0, rbac_1.requireDynamicPermission)('role:read'), roleHierarchyController_1.roleHierarchyController.getFullRoleHierarchyTree);
router.post('/hierarchy/validate', (0, rbac_1.requireDynamicPermission)('role:read'), roleHierarchyController_1.roleHierarchyController.validateRoleHierarchy);
exports.default = router;
//# sourceMappingURL=roleHierarchyRoutes.js.map