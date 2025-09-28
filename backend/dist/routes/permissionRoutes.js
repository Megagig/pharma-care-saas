"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const permissionController_1 = require("../controllers/permissionController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.get('/', permissionController_1.permissionController.getPermissions);
router.get('/matrix', permissionController_1.permissionController.getPermissionMatrix);
router.post('/', permissionController_1.permissionController.createPermission);
router.put('/:action', permissionController_1.permissionController.updatePermission);
router.get('/categories', permissionController_1.permissionController.getPermissionCategories);
router.get('/dependencies', permissionController_1.permissionController.getPermissionDependencies);
router.get('/:action/usage', permissionController_1.permissionController.getPermissionUsage);
router.post('/validate', permissionController_1.permissionController.validatePermissions);
exports.default = router;
//# sourceMappingURL=permissionRoutes.js.map