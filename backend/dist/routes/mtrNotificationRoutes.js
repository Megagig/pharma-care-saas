"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mtrNotificationController_1 = require("../controllers/mtrNotificationController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/follow-up/:followUpId/reminder', mtrNotificationController_1.scheduleFollowUpReminder);
router.get('/follow-up/:followUpId/reminders', mtrNotificationController_1.getFollowUpReminders);
router.delete('/follow-up/:followUpId/reminder/:reminderId', mtrNotificationController_1.cancelScheduledReminder);
router.post('/alert/critical', mtrNotificationController_1.sendCriticalAlert);
router.post('/alert/drug-interactions', mtrNotificationController_1.checkDrugInteractions);
router.post('/alert/high-severity-dtp/:problemId', mtrNotificationController_1.notifyHighSeverityDTP);
router.post('/check-overdue', mtrNotificationController_1.checkOverdueFollowUps);
router.post('/process-pending', mtrNotificationController_1.processPendingReminders);
router.get('/preferences', mtrNotificationController_1.getNotificationPreferences);
router.put('/preferences', mtrNotificationController_1.updateNotificationPreferences);
router.get('/statistics', mtrNotificationController_1.getNotificationStatistics);
router.post('/test', mtrNotificationController_1.sendTestNotification);
exports.default = router;
//# sourceMappingURL=mtrNotificationRoutes.js.map