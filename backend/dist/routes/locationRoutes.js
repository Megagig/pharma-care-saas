"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/locationController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const usageLimits_1 = require("../middlewares/usageLimits");
const router = express_1.default.Router();
router.use(authWithWorkspace_1.authWithWorkspace);
router.get('/', (0, rbac_1.requirePermission)('location.read'), locationController_1.getWorkspaceLocations);
router.get('/:locationId', (0, rbac_1.requirePermission)('location.read'), locationController_1.getLocationById);
router.post('/', (0, rbac_1.requirePermission)('location.create'), (0, usageLimits_1.enforcePlanLimit)('locations'), locationController_1.createLocation);
router.put('/:locationId', (0, rbac_1.requirePermission)('location.update'), locationController_1.updateLocation);
router.delete('/:locationId', (0, rbac_1.requirePermission)('location.delete'), locationController_1.deleteLocation);
router.post('/:locationId/set-primary', (0, rbac_1.requirePermission)('location.manage'), locationController_1.setPrimaryLocation);
router.get('/:locationId/stats', (0, rbac_1.requirePermission)('location.read'), locationController_1.getLocationStats);
router.put('/bulk', (0, rbac_1.requirePermission)('location.manage'), locationController_1.bulkUpdateLocations);
exports.default = router;
//# sourceMappingURL=locationRoutes.js.map