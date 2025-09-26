"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const permissionController_1 = require("../controllers/permissionController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.get('/', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.getPermissions);
router.get('/matrix', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.getPermissionMatrix);
router.post('/', (0, rbac_1.requireDynamicPermission)('permission:create'), permissionController_1.permissionController.createPermission);
router.put('/:action', (0, rbac_1.requireDynamicPermission)('permission:update'), permissionController_1.permissionController.updatePermission);
router.get('/categories', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.getPermissionCategories);
router.get('/dependencies', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.getPermissionDependencies);
router.get('/:action/usage', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.getPermissionUsage);
router.post('/validate', (0, rbac_1.requireDynamicPermission)('permission:read'), permissionController_1.permissionController.validatePermissions);
exports.default = router;
//# sourceMappingURL=permissionRoutes.js.map