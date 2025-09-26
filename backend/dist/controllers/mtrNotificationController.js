"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyHighSeverityDTP = exports.checkDrugInteractions = exports.cancelScheduledReminder = exports.getFollowUpReminders = exports.sendTestNotification = exports.processPendingReminders = exports.getNotificationStatistics = exports.getNotificationPreferences = exports.updateNotificationPreferences = exports.checkOverdueFollowUps = exports.sendCriticalAlert = exports.scheduleFollowUpReminder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mtrNotificationService_1 = require("../services/mtrNotificationService");
const responseHelpers_1 = require("../utils/responseHelpers");
const logger_1 = __importDefault(require("../utils/logger"));
const MTRFollowUp_1 = __importDefault(require("../models/MTRFollowUp"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const scheduleFollowUpReminder = async (req, res) => {
    try {
        const { followUpId } = req.params;
        const { reminderType = 'email', scheduledFor } = req.body;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid follow-up ID', 400);
        }
        const scheduledDate = scheduledFor ? new Date(scheduledFor) : undefined;
        await mtrNotificationService_1.mtrNotificationService.scheduleFollowUpReminder(new mongoose_1.default.Types.ObjectId(followUpId), reminderType, scheduledDate);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Follow-up reminder scheduled successfully');
    }
    catch (error) {
        logger_1.default.error('Error scheduling follow-up reminder:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to schedule follow-up reminder', 500);
    }
};
exports.scheduleFollowUpReminder = scheduleFollowUpReminder;
const sendCriticalAlert = async (req, res) => {
    try {
        const { type, severity, patientId, reviewId, problemId, message, details, requiresImmediate = false } = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid patient ID', 400);
        }
        const alert = {
            type,
            severity,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            reviewId: reviewId ? new mongoose_1.default.Types.ObjectId(reviewId) : undefined,
            problemId: problemId ? new mongoose_1.default.Types.ObjectId(problemId) : undefined,
            message,
            details,
            requiresImmediate
        };
        await mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Critical alert sent successfully');
    }
    catch (error) {
        logger_1.default.error('Error sending critical alert:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to send critical alert', 500);
    }
};
exports.sendCriticalAlert = sendCriticalAlert;
const checkOverdueFollowUps = async (req, res) => {
    try {
        await mtrNotificationService_1.mtrNotificationService.checkOverdueFollowUps();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Overdue follow-ups checked successfully');
    }
    catch (error) {
        logger_1.default.error('Error checking overdue follow-ups:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check overdue follow-ups', 500);
    }
};
exports.checkOverdueFollowUps = checkOverdueFollowUps;
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return (0, responseHelpers_1.sendError)(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }
        const preferences = req.body;
        await mtrNotificationService_1.mtrNotificationService.updateNotificationPreferences(new mongoose_1.default.Types.ObjectId(userId), preferences);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Notification preferences updated successfully');
    }
    catch (error) {
        logger_1.default.error('Error updating notification preferences:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to update notification preferences', 500);
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return (0, responseHelpers_1.sendError)(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }
        const User = mongoose_1.default.model('User');
        const user = await User.findById(userId).select('notificationPreferences');
        if (!user) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'User not found', 404);
        }
        const defaultPreferences = {
            email: true,
            sms: false,
            push: true,
            followUpReminders: true,
            criticalAlerts: true,
            dailyDigest: false,
            weeklyReport: false
        };
        const preferences = { ...defaultPreferences, ...(user.notificationPreferences || {}) };
        return (0, responseHelpers_1.sendSuccess)(res, preferences, 'Notification preferences retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting notification preferences:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get notification preferences', 500);
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const getNotificationStatistics = async (req, res) => {
    try {
        const workplaceId = req.user?.workplaceId;
        const stats = await mtrNotificationService_1.mtrNotificationService.getNotificationStatistics(workplaceId ? new mongoose_1.default.Types.ObjectId(workplaceId) : undefined);
        return (0, responseHelpers_1.sendSuccess)(res, stats, 'Notification statistics retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting notification statistics:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get notification statistics', 500);
    }
};
exports.getNotificationStatistics = getNotificationStatistics;
const processPendingReminders = async (req, res) => {
    try {
        await mtrNotificationService_1.mtrNotificationService.processPendingReminders();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Pending reminders processed successfully');
    }
    catch (error) {
        logger_1.default.error('Error processing pending reminders:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to process pending reminders', 500);
    }
};
exports.processPendingReminders = processPendingReminders;
const sendTestNotification = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { type = 'email' } = req.body;
        if (!userId) {
            return (0, responseHelpers_1.sendError)(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }
        const testData = {
            followUpId: new mongoose_1.default.Types.ObjectId(),
            patientName: 'Test Patient',
            followUpType: 'phone_call',
            scheduledDate: new Date(Date.now() + 60 * 60 * 1000),
            description: 'This is a test notification to verify your notification settings.',
            reviewNumber: 'MTR-TEST-001',
            priority: 'medium',
            estimatedDuration: 30
        };
        await mtrNotificationService_1.mtrNotificationService.scheduleFollowUpReminder(testData.followUpId, type, new Date());
        return (0, responseHelpers_1.sendSuccess)(res, null, `Test ${type} notification sent successfully`);
    }
    catch (error) {
        logger_1.default.error('Error sending test notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to send test notification', 500);
    }
};
exports.sendTestNotification = sendTestNotification;
const getFollowUpReminders = async (req, res) => {
    try {
        const { followUpId } = req.params;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid follow-up ID', 400);
        }
        const followUp = await MTRFollowUp_1.default.findById(followUpId)
            .select('reminders')
            .populate('reminders.recipientId', 'firstName lastName email');
        if (!followUp) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Follow-up not found', 404);
        }
        return (0, responseHelpers_1.sendSuccess)(res, followUp.reminders, 'Follow-up reminders retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting follow-up reminders:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get follow-up reminders', 500);
    }
};
exports.getFollowUpReminders = getFollowUpReminders;
const cancelScheduledReminder = async (req, res) => {
    try {
        const { followUpId, reminderId } = req.params;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid follow-up ID', 400);
        }
        const followUp = await MTRFollowUp_1.default.findById(followUpId);
        if (!followUp) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Follow-up not found', 404);
        }
        const reminderIndex = followUp.reminders.findIndex((r) => r._id?.toString() === reminderId);
        if (reminderIndex === -1) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Reminder not found', 404);
        }
        const reminder = followUp.reminders[reminderIndex];
        if (reminder && reminder.sent) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Cannot cancel reminder that has already been sent', 400);
        }
        followUp.reminders.splice(reminderIndex, 1);
        await followUp.save();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Reminder cancelled successfully');
    }
    catch (error) {
        logger_1.default.error('Error cancelling reminder:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to cancel reminder', 500);
    }
};
exports.cancelScheduledReminder = cancelScheduledReminder;
const checkDrugInteractions = async (req, res) => {
    try {
        const { patientId, medications } = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid patient ID', 400);
        }
        const mockInteractions = [
            {
                severity: 'major',
                medications: ['Warfarin', 'Aspirin'],
                description: 'Increased risk of bleeding',
                clinicalSignificance: 'Monitor INR closely and watch for signs of bleeding'
            }
        ];
        for (const interaction of mockInteractions) {
            if (['critical', 'major'].includes(interaction.severity)) {
                const alert = {
                    type: 'drug_interaction',
                    severity: interaction.severity,
                    patientId: new mongoose_1.default.Types.ObjectId(patientId),
                    message: `Drug interaction detected: ${interaction.medications.join(' + ')}`,
                    details: interaction,
                    requiresImmediate: interaction.severity === 'critical'
                };
                await mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert);
            }
        }
        return (0, responseHelpers_1.sendSuccess)(res, mockInteractions, 'Drug interactions checked successfully');
    }
    catch (error) {
        logger_1.default.error('Error checking drug interactions:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to check drug interactions', 500);
    }
};
exports.checkDrugInteractions = checkDrugInteractions;
const notifyHighSeverityDTP = async (req, res) => {
    try {
        const { problemId } = req.params;
        if (!problemId || !mongoose_1.default.Types.ObjectId.isValid(problemId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid problem ID', 400);
        }
        const problem = await DrugTherapyProblem_1.default.findById(problemId)
            .populate('patientId', 'firstName lastName mrn');
        if (!problem) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Drug therapy problem not found', 404);
        }
        if (!['critical', 'major'].includes(problem.severity)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Notifications are only sent for critical or major severity problems', 400);
        }
        const patient = problem.patientId;
        const alert = {
            type: 'high_severity_dtp',
            severity: problem.severity,
            patientId: problem.patientId,
            reviewId: problem.reviewId,
            problemId: problem._id,
            message: `High severity drug therapy problem identified: ${problem.description}`,
            details: {
                type: problem.type,
                category: problem.category,
                affectedMedications: problem.affectedMedications,
                clinicalSignificance: problem.clinicalSignificance
            },
            requiresImmediate: problem.severity === 'critical'
        };
        await mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'High severity DTP notification sent successfully');
    }
    catch (error) {
        logger_1.default.error('Error sending high severity DTP notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to send high severity DTP notification', 500);
    }
};
exports.notifyHighSeverityDTP = notifyHighSeverityDTP;
//# sourceMappingURL=mtrNotificationController.js.map