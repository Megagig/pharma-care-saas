"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const roleHierarchyController_1 = require("../controllers/roleHierarchyController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/:id/children', roleHierarchyController_1.roleHierarchyController.addChildRoles.bind(roleHierarchyController_1.roleHierarchyController));
router.delete('/:id/children/:childId', roleHierarchyController_1.roleHierarchyController.removeChildRole.bind(roleHierarchyController_1.roleHierarchyController));
router.get('/:id/hierarchy', roleHierarchyController_1.roleHierarchyController.getRoleHierarchy.bind(roleHierarchyController_1.roleHierarchyController));
router.put('/:id/parent', roleHierarchyController_1.roleHierarchyController.changeParentRole.bind(roleHierarchyController_1.roleHierarchyController));
router.get('/hierarchy-tree', roleHierarchyController_1.roleHierarchyController.getFullRoleHierarchyTree.bind(roleHierarchyController_1.roleHierarchyController));
router.post('/hierarchy/validate', roleHierarchyController_1.roleHierarchyController.validateRoleHierarchy.bind(roleHierarchyController_1.roleHierarchyController));
exports.default = router;
//# sourceMappingURL=roleHierarchyRoutes.js.map