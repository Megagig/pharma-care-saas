"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionManagementController_1 = require("../controllers/subscriptionManagementController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const rateLimiting_1 = require("../middlewares/rateLimiting");
const router = express_1.default.Router();
router.get('/workspace/:workspaceId', authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.getWorkspaceSubscription.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/trial', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.manage'), subscriptionManagementController_1.subscriptionManagementController.createTrialSubscription.bind(subscriptionManagementController_1.subscriptionManagementController));
router.patch('/workspace/:workspaceId/status', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.admin'), subscriptionManagementController_1.subscriptionManagementController.updateSubscriptionStatus.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/checkout', rateLimiting_1.subscriptionRateLimiters.subscriptionChange, rateLimiting_1.subscriptionRateLimiters.subscriptionChangeUser, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.manage'), subscriptionManagementController_1.subscriptionManagementController.createWorkspaceCheckout.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/payment/success', rateLimiting_1.subscriptionRateLimiters.paymentAttempt, authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.handleWorkspacePaymentSuccess.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/upgrade', rateLimiting_1.subscriptionRateLimiters.subscriptionChange, rateLimiting_1.subscriptionRateLimiters.subscriptionChangeUser, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.manage'), subscriptionManagementController_1.subscriptionManagementController.upgradeWorkspaceSubscription.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/downgrade', rateLimiting_1.subscriptionRateLimiters.subscriptionChange, rateLimiting_1.subscriptionRateLimiters.subscriptionChangeUser, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.manage'), subscriptionManagementController_1.subscriptionManagementController.downgradeWorkspaceSubscription.bind(subscriptionManagementController_1.subscriptionManagementController));
router.delete('/workspace/:workspaceId/downgrade', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.manage'), subscriptionManagementController_1.subscriptionManagementController.cancelScheduledDowngrade.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/upgrade/payment/success', rateLimiting_1.subscriptionRateLimiters.paymentAttempt, authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.handleUpgradePaymentSuccess.bind(subscriptionManagementController_1.subscriptionManagementController));
router.get('/workspace/:workspaceId/trial/check', authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.checkTrialExpiry.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/trial/extend', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.admin'), subscriptionManagementController_1.subscriptionManagementController.extendTrialPeriod.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/expiry/handle', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('subscription.admin'), subscriptionManagementController_1.subscriptionManagementController.handleSubscriptionExpiry.bind(subscriptionManagementController_1.subscriptionManagementController));
router.post('/workspace/:workspaceId/paywall/enable', authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.enablePaywallMode.bind(subscriptionManagementController_1.subscriptionManagementController));
router.get('/workspace/:workspaceId/status', authWithWorkspace_1.authWithWorkspace, subscriptionManagementController_1.subscriptionManagementController.getSubscriptionStatus.bind(subscriptionManagementController_1.subscriptionManagementController));
exports.default = router;
//# sourceMappingURL=subscriptionManagementRoutes.js.map