"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const roleController_1 = require("../controllers/roleController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/', (0, rbac_1.requireDynamicPermission)('role:create'), roleController_1.roleController.createRole);
router.get('/', (0, rbac_1.requireDynamicPermission)('role:read'), roleController_1.roleController.getRoles);
router.get('/:id', (0, rbac_1.requireDynamicPermission)('role:read'), roleController_1.roleController.getRoleById);
router.put('/:id', (0, rbac_1.requireDynamicPermission)('role:update'), roleController_1.roleController.updateRole);
router.delete('/:id', (0, rbac_1.requireDynamicPermission)('role:delete'), roleController_1.roleController.deleteRole);
router.get('/:id/permissions', (0, rbac_1.requireDynamicPermission)('role:read'), roleController_1.roleController.getRolePermissions);
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map