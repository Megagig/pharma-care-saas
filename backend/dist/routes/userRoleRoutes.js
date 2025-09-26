"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const userRoleController_1 = require("../controllers/userRoleController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/:id/roles', (0, rbac_1.requireDynamicPermission)('user:update'), userRoleController_1.userRoleController.assignUserRoles);
router.delete('/:id/roles/:roleId', (0, rbac_1.requireDynamicPermission)('user:update'), userRoleController_1.userRoleController.revokeUserRole);
router.put('/:id/permissions', (0, rbac_1.requireDynamicPermission)('user:update'), userRoleController_1.userRoleController.updateUserPermissions);
router.get('/:id/effective-permissions', (0, rbac_1.requireDynamicPermission)('user:read'), userRoleController_1.userRoleController.getUserEffectivePermissions);
router.post('/bulk-update', (0, rbac_1.requireDynamicPermission)('user:update'), userRoleController_1.userRoleController.bulkUpdateUsers);
exports.default = router;
//# sourceMappingURL=userRoleRoutes.js.map