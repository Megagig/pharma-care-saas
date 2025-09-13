"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = __importDefault(require("../middlewares/rbac"));
const manualLabNotificationController_1 = require("../controllers/manualLabNotificationController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/alerts', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.getCriticalAlerts);
router.post('/alerts/:alertId/acknowledge', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.acknowledgeAlert);
router.post('/alerts/:alertId/dismiss', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.dismissAlert);
router.post('/trigger-alert', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.triggerCriticalAlert);
router.post('/ai-complete', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.triggerAIInterpretationComplete);
router.post('/patient-result', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.triggerPatientResultNotification);
router.get('/preferences', manualLabNotificationController_1.getNotificationPreferences);
router.put('/preferences', manualLabNotificationController_1.updateNotificationPreferences);
router.get('/stats', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.getNotificationStatistics);
router.post('/test', manualLabNotificationController_1.sendTestNotification);
router.get('/delivery/:orderId', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.getNotificationDeliveryStatus);
router.post('/delivery/:orderId/retry', (0, rbac_1.default)(['pharmacist', 'owner']), manualLabNotificationController_1.retryFailedNotifications);
exports.default = router;
//# sourceMappingURL=manualLabNotificationRoutes.js.map