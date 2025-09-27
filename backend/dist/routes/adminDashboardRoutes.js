"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const cacheMiddleware_1 = require("../middlewares/cacheMiddleware");
const router = express_1.default.Router();
router.use(authWithWorkspace_1.authWithWorkspace);
router.use((0, rbac_1.requireRole)('super_admin'));
router.get('/overview', cacheMiddleware_1.dashboardCacheMiddleware, adminDashboardController_1.adminDashboardController.getDashboardOverview.bind(adminDashboardController_1.adminDashboardController));
router.get('/workspaces', cacheMiddleware_1.dashboardCacheMiddleware, adminDashboardController_1.adminDashboardController.getWorkspaceManagement.bind(adminDashboardController_1.adminDashboardController));
router.put('/workspaces/:workspaceId/subscription', adminDashboardController_1.adminDashboardController.updateWorkspaceSubscription.bind(adminDashboardController_1.adminDashboardController));
router.get('/invitations', adminDashboardController_1.adminDashboardController.getInvitationManagement.bind(adminDashboardController_1.adminDashboardController));
router.delete('/invitations/:invitationId', adminDashboardController_1.adminDashboardController.cancelInvitation.bind(adminDashboardController_1.adminDashboardController));
router.get('/system-health', cacheMiddleware_1.dashboardCacheMiddleware, adminDashboardController_1.adminDashboardController.getSystemHealth.bind(adminDashboardController_1.adminDashboardController));
exports.default = router;
//# sourceMappingURL=adminDashboardRoutes.js.map