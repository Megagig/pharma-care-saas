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
router.post('/:id/children', roleHierarchyController_1.roleHierarchyController.addChildRoles);
router.delete('/:id/children/:childId', roleHierarchyController_1.roleHierarchyController.removeChildRole);
router.get('/:id/hierarchy', roleHierarchyController_1.roleHierarchyController.getRoleHierarchy);
router.put('/:id/parent', roleHierarchyController_1.roleHierarchyController.changeParentRole);
router.get('/hierarchy-tree', roleHierarchyController_1.roleHierarchyController.getFullRoleHierarchyTree);
router.post('/hierarchy/validate', roleHierarchyController_1.roleHierarchyController.validateRoleHierarchy);
exports.default = router;
//# sourceMappingURL=roleHierarchyRoutes.js.map