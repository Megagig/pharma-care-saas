"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailWebhookController_1 = require("../controllers/emailWebhookController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const router = (0, express_1.Router)();
router.post('/webhooks/resend', emailWebhookController_1.emailWebhookController.handleResendWebhook);
router.post('/webhooks/email', emailWebhookController_1.emailWebhookController.handleGenericWebhook);
router.get('/delivery/stats', auth_1.auth, (0, rbac_1.requirePermission)('email.view_stats'), emailWebhookController_1.emailWebhookController.getDeliveryStats);
router.get('/delivery/history', auth_1.auth, (0, rbac_1.requirePermission)('email.view_history'), emailWebhookController_1.emailWebhookController.getDeliveryHistory);
router.post('/delivery/:deliveryId/retry', auth_1.auth, (0, rbac_1.requirePermission)('email.retry'), emailWebhookController_1.emailWebhookController.retryFailedEmail);
exports.default = router;
//# sourceMappingURL=emailWebhookRoutes.js.map