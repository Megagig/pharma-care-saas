import express from 'express';
import { auth } from '../middlewares/auth';
import { rbac } from '../middlewares/rbac';
import { notificationValidation } from '../middlewares/communicationValidation';
import {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markMultipleAsRead,
    dismissNotification,
    getUnreadCount,
    getNotificationPreferences,
    updateNotificationPreferences,
    createConversationNotification,
    createPatientQueryNotification,
    getNotificationStatistics,
    processScheduledNotifications,
    retryFailedNotifications,
    sendTestNotification,
    archiveOldNotifications,
    deleteExpiredNotifications,
} from '../controllers/notificationController';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Basic notification routes
router.get('/', getUserNotifications);
router.post('/', notificationValidation.create, createNotification);
router.get('/unread-count', getUnreadCount);
router.get('/statistics', getNotificationStatistics);

// Individual notification actions
router.patch('/:notificationId/read', markNotificationAsRead);
router.patch('/:notificationId/dismiss', dismissNotification);

// Batch operations
router.patch('/mark-multiple-read', markMultipleAsRead);
router.post('/archive-old', archiveOldNotifications);

// Notification preferences
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Communication-specific notifications
router.post('/conversation', createConversationNotification);
router.post('/patient-query', createPatientQueryNotification);

// Testing and utilities
router.post('/test', sendTestNotification);

// Admin-only routes
router.post('/process-scheduled', rbac(['admin', 'super_admin']), processScheduledNotifications);
router.post('/retry-failed', rbac(['admin', 'super_admin']), retryFailedNotifications);
router.delete('/expired', rbac(['admin', 'super_admin']), deleteExpiredNotifications);

export default router;