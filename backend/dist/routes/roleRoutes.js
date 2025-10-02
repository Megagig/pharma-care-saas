"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const roleController_1 = require("../controllers/roleController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/', roleController_1.roleController.createRole.bind(roleController_1.roleController));
router.get('/', roleController_1.roleController.getRoles.bind(roleController_1.roleController));
router.get('/:id', roleController_1.roleController.getRoleById.bind(roleController_1.roleController));
router.put('/:id', roleController_1.roleController.updateRole.bind(roleController_1.roleController));
router.delete('/:id', roleController_1.roleController.deleteRole.bind(roleController_1.roleController));
router.get('/:id/permissions', roleController_1.roleController.getRolePermissions.bind(roleController_1.roleController));
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map