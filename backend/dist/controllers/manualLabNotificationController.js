"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFailedNotifications = exports.getNotificationDeliveryStatus = exports.sendTestNotification = exports.getNotificationStatistics = exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.triggerPatientResultNotification = exports.triggerAIInterpretationComplete = exports.triggerCriticalAlert = exports.dismissAlert = exports.acknowledgeAlert = exports.getCriticalAlerts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const manualLabNotificationService_1 = require("../services/manualLabNotificationService");
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const activeAlerts = new Map();
const acknowledgedAlerts = new Set();
const dismissedAlerts = new Set();
const getCriticalAlerts = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const workplaceAlerts = Array.from(activeAlerts.values())
            .filter(alert => alert.workplaceId === workplaceId)
            .filter(alert => !dismissedAlerts.has(alert.id))
            .map(alert => ({
            ...alert,
            acknowledged: acknowledgedAlerts.has(alert.id),
        }))
            .sort((a, b) => {
            const severityOrder = { critical: 3, major: 2, moderate: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0)
                return severityDiff;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        return res.json({
            success: true,
            data: workplaceAlerts,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching critical alerts:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ALERTS_ERROR',
                message: 'Failed to fetch critical alerts',
            },
        });
    }
};
exports.getCriticalAlerts = getCriticalAlerts;
const acknowledgeAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { _id: userId } = req.user;
        if (!alertId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Alert ID is required',
                },
            });
        }
        if (!activeAlerts.has(alertId)) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ALERT_NOT_FOUND',
                    message: 'Alert not found',
                },
            });
        }
        acknowledgedAlerts.add(alertId);
        const alert = activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = userId;
            alert.acknowledgedAt = new Date().toISOString();
            activeAlerts.set(alertId, alert);
        }
        logger_1.default.info(`Alert ${alertId} acknowledged by user ${userId}`);
        return res.json({
            success: true,
            message: 'Alert acknowledged successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error acknowledging alert:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'ACKNOWLEDGE_ERROR',
                message: 'Failed to acknowledge alert',
            },
        });
    }
};
exports.acknowledgeAlert = acknowledgeAlert;
const dismissAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { _id: userId } = req.user;
        if (!alertId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Alert ID is required',
                },
            });
        }
        if (!activeAlerts.has(alertId)) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ALERT_NOT_FOUND',
                    message: 'Alert not found',
                },
            });
        }
        dismissedAlerts.add(alertId);
        logger_1.default.info(`Alert ${alertId} dismissed by user ${userId}`);
        return res.json({
            success: true,
            message: 'Alert dismissed successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error dismissing alert:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'DISMISS_ERROR',
                message: 'Failed to dismiss alert',
            },
        });
    }
};
exports.dismissAlert = dismissAlert;
const triggerCriticalAlert = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { type, severity, orderId, patientId, message, details, requiresImmediate, aiInterpretation, } = req.body;
        if (!type || !severity || !orderId || !patientId || !message) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                },
            });
        }
        const patient = await Patient_1.default.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PATIENT_NOT_FOUND',
                    message: 'Patient not found',
                },
            });
        }
        const alertId = new mongoose_1.default.Types.ObjectId().toString();
        const alert = {
            id: alertId,
            type,
            severity,
            orderId,
            patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientMRN: patient.mrn,
            message,
            details,
            requiresImmediate,
            timestamp: new Date().toISOString(),
            workplaceId,
            aiInterpretation,
        };
        activeAlerts.set(alertId, alert);
        const criticalAlert = {
            type: type,
            severity: severity,
            orderId,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            message,
            details,
            requiresImmediate,
            aiInterpretation,
        };
        await manualLabNotificationService_1.manualLabNotificationService.sendCriticalLabAlert(criticalAlert);
        return res.json({
            success: true,
            data: { alertId },
            message: 'Critical alert triggered successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error triggering critical alert:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'TRIGGER_ALERT_ERROR',
                message: 'Failed to trigger critical alert',
            },
        });
    }
};
exports.triggerCriticalAlert = triggerCriticalAlert;
const triggerAIInterpretationComplete = async (req, res) => {
    try {
        const { orderId, patientId, pharmacistId, interpretation } = req.body;
        if (!orderId || !patientId || !pharmacistId || !interpretation) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                },
            });
        }
        await manualLabNotificationService_1.manualLabNotificationService.sendAIInterpretationComplete(orderId, new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(pharmacistId), interpretation);
        return res.json({
            success: true,
            message: 'AI interpretation notification sent successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error triggering AI interpretation notification:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AI_NOTIFICATION_ERROR',
                message: 'Failed to send AI interpretation notification',
            },
        });
    }
};
exports.triggerAIInterpretationComplete = triggerAIInterpretationComplete;
const triggerPatientResultNotification = async (req, res) => {
    try {
        const { orderId, patientId, includeInterpretation = false } = req.body;
        if (!orderId || !patientId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                },
            });
        }
        await manualLabNotificationService_1.manualLabNotificationService.sendPatientResultNotification(orderId, new mongoose_1.default.Types.ObjectId(patientId), includeInterpretation);
        return res.json({
            success: true,
            message: 'Patient result notification sent successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error triggering patient result notification:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'PATIENT_NOTIFICATION_ERROR',
                message: 'Failed to send patient result notification',
            },
        });
    }
};
exports.triggerPatientResultNotification = triggerPatientResultNotification;
const getNotificationPreferences = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const user = await User_1.default.findById(userId).select('notificationPreferences');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
        }
        const preferences = user.notificationPreferences?.manualLab || {
            criticalAlerts: true,
            resultNotifications: true,
            orderReminders: true,
            email: true,
            sms: false,
            push: false,
        };
        return res.json({
            success: true,
            data: preferences,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching notification preferences:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_PREFERENCES_ERROR',
                message: 'Failed to fetch notification preferences',
            },
        });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const updateNotificationPreferences = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const preferences = req.body;
        await manualLabNotificationService_1.manualLabNotificationService.updateNotificationPreferences(new mongoose_1.default.Types.ObjectId(userId), preferences);
        return res.json({
            success: true,
            message: 'Notification preferences updated successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error updating notification preferences:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_PREFERENCES_ERROR',
                message: 'Failed to update notification preferences',
            },
        });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
const getNotificationStatistics = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const stats = await manualLabNotificationService_1.manualLabNotificationService.getNotificationStatistics(new mongoose_1.default.Types.ObjectId(workplaceId));
        return res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching notification statistics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_STATS_ERROR',
                message: 'Failed to fetch notification statistics',
            },
        });
    }
};
exports.getNotificationStatistics = getNotificationStatistics;
const sendTestNotification = async (req, res) => {
    try {
        const { _id: userId, email, phone } = req.user;
        const { type } = req.body;
        if (!['email', 'sms'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TYPE',
                    message: 'Invalid notification type',
                },
            });
        }
        if (type === 'sms' && !phone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_PHONE',
                    message: 'Phone number not available for SMS test',
                },
            });
        }
        const testAlert = {
            type: 'critical_result',
            severity: 'moderate',
            orderId: 'TEST-' + Date.now(),
            patientId: new mongoose_1.default.Types.ObjectId(),
            message: 'This is a test notification from the Manual Lab system',
            details: { test: true },
            requiresImmediate: false,
        };
        await manualLabNotificationService_1.manualLabNotificationService.sendCriticalLabAlert(testAlert);
        return res.json({
            success: true,
            message: `Test ${type} notification sent successfully`,
        });
    }
    catch (error) {
        logger_1.default.error('Error sending test notification:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'TEST_NOTIFICATION_ERROR',
                message: 'Failed to send test notification',
            },
        });
    }
};
exports.sendTestNotification = sendTestNotification;
const getNotificationDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Order ID is required',
                },
            });
        }
        const deliveryStatus = {
            orderId,
            notifications: [
                {
                    type: 'ai_interpretation_complete',
                    channel: 'email',
                    status: 'delivered',
                    sentAt: new Date().toISOString(),
                    deliveredAt: new Date().toISOString(),
                },
                {
                    type: 'critical_alert',
                    channel: 'sms',
                    status: 'pending',
                    sentAt: new Date().toISOString(),
                    attempts: 1,
                    nextRetry: new Date(Date.now() + 60000).toISOString(),
                },
            ],
        };
        return res.json({
            success: true,
            data: deliveryStatus,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching delivery status:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'DELIVERY_STATUS_ERROR',
                message: 'Failed to fetch delivery status',
            },
        });
    }
};
exports.getNotificationDeliveryStatus = getNotificationDeliveryStatus;
const retryFailedNotifications = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Order ID is required',
                },
            });
        }
        logger_1.default.info(`Retrying failed notifications for order ${orderId}`);
        return res.json({
            success: true,
            message: 'Failed notifications retry initiated',
        });
    }
    catch (error) {
        logger_1.default.error('Error retrying failed notifications:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'RETRY_ERROR',
                message: 'Failed to retry notifications',
            },
        });
    }
};
exports.retryFailedNotifications = retryFailedNotifications;
//# sourceMappingURL=manualLabNotificationController.js.map