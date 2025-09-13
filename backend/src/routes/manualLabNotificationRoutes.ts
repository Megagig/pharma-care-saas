import express from 'express';
import { auth } from '../middlewares/auth';
import { rbac } from '../middlewares/rbac';
import {
    getCriticalAlerts,
    acknowledgeAlert,
    dismissAlert,
    triggerCriticalAlert,
    triggerAIInterpretationComplete,
    triggerPatientResultNotification,
    getNotificationPreferences,
    updateNotificationPreferences,
    getNotificationStatistics,
    sendTestNotification,
    getNotificationDeliveryStatus,
    retryFailedNotifications,
} from '../controllers/manualLabNotificationController';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Critical Alerts Routes
router.get('/alerts', rbac(['pharmacist', 'owner']), getCriticalAlerts);
router.post('/alerts/:alertId/acknowledge', rbac(['pharmacist', 'owner']), acknowledgeAlert);
router.post('/alerts/:alertId/dismiss', rbac(['pharmacist', 'owner']), dismissAlert);

// Notification Trigger Routes
router.post('/trigger-alert', rbac(['pharmacist', 'owner']), triggerCriticalAlert);
router.post('/ai-complete', rbac(['pharmacist', 'owner']), triggerAIInterpretationComplete);
router.post('/patient-result', rbac(['pharmacist', 'owner']), triggerPatientResultNotification);

// Preferences Routes
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Statistics Routes
router.get('/stats', rbac(['pharmacist', 'owner']), getNotificationStatistics);

// Test Notification Routes
router.post('/test', sendTestNotification);

// Delivery Tracking Routes
router.get('/delivery/:orderId', rbac(['pharmacist', 'owner']), getNotificationDeliveryStatus);
router.post('/delivery/:orderId/retry', rbac(['pharmacist', 'owner']), retryFailedNotifications);

export default router;