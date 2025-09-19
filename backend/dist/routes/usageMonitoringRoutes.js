"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usageMonitoringController_1 = require("../controllers/usageMonitoringController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const router = express_1.default.Router();
router.use(authWithWorkspace_1.authWithWorkspace);
router.get('/stats', usageMonitoringController_1.getWorkspaceUsageStats);
router.get('/analytics', (0, rbac_1.requirePermission)('workspace.analytics'), usageMonitoringController_1.getUsageAnalytics);
router.get('/alerts', usageMonitoringController_1.getUsageAlerts);
router.post('/recalculate', (0, rbac_1.requirePermission)('workspace.manage'), usageMonitoringController_1.recalculateUsageStats);
router.get('/comparison', usageMonitoringController_1.getUsageComparison);
exports.default = router;
//# sourceMappingURL=usageMonitoringRoutes.js.map