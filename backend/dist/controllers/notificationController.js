"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpiredNotifications = exports.archiveOldNotifications = exports.sendTestNotification = exports.retryFailedNotifications = exports.processScheduledNotifications = exports.getNotificationStatistics = exports.createPatientQueryNotification = exports.createConversationNotification = exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.getUnreadCount = exports.dismissNotification = exports.markMultipleAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotification = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationService_1 = require("../services/notificationService");
const responseHelpers_1 = require("../utils/responseHelpers");
const logger_1 = __importDefault(require("../utils/logger"));
const Notification_1 = __importDefault(require("../models/Notification"));
const createNotification = async (req, res) => {
    try {
        const { userId, type, title, content, data, priority = 'normal', deliveryChannels, scheduledFor, expiresAt, groupKey, } = req.body;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid user ID', 400);
        }
        if (!type || !title || !content) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Missing required fields: type, title, content', 400);
        }
        const notificationData = {
            userId: new mongoose_1.default.Types.ObjectId(userId),
            type,
            title,
            content,
            data: data || {},
            priority,
            deliveryChannels,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            groupKey,
            workplaceId: new mongoose_1.default.Types.ObjectId(req.user.workplaceId),
            createdBy: new mongoose_1.default.Types.ObjectId(req.user._id),
        };
        const notification = await notificationService_1.notificationService.createNotification(notificationData);
        return (0, responseHelpers_1.sendSuccess)(res, notification, 'Notification created successfully');
    }
    catch (error) {
        logger_1.default.error('Error creating notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to create notification', 500);
    }
};
exports.createNotification = createNotification;
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const workplaceId = req.user.workplaceId;
        const filters = {
            type: req.query.type,
            status: req.query.status,
            priority: req.query.priority,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
        };
        const result = await notificationService_1.notificationService.getUserNotifications(userId, workplaceId, filters);
        return (0, responseHelpers_1.sendSuccess)(res, result, 'Notifications retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting user notifications:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get notifications', 500);
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        if (!notificationId || !mongoose_1.default.Types.ObjectId.isValid(notificationId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid notification ID', 400);
        }
        await notificationService_1.notificationService.markAsRead(notificationId, userId);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Notification marked as read');
    }
    catch (error) {
        logger_1.default.error('Error marking notification as read:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to mark notification as read', 500);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markMultipleAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.user._id;
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid notification IDs array', 400);
        }
        const validIds = notificationIds.filter(id => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validIds.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'No valid notification IDs provided', 400);
        }
        await Notification_1.default.updateMany({
            _id: { $in: validIds.map(id => new mongoose_1.default.Types.ObjectId(id)) },
            userId: new mongoose_1.default.Types.ObjectId(userId),
            status: 'unread',
        }, {
            $set: {
                status: 'read',
                readAt: new Date(),
            },
        });
        return (0, responseHelpers_1.sendSuccess)(res, { markedCount: validIds.length }, 'Notifications marked as read');
    }
    catch (error) {
        logger_1.default.error('Error marking multiple notifications as read:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to mark notifications as read', 500);
    }
};
exports.markMultipleAsRead = markMultipleAsRead;
const dismissNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        if (!notificationId || !mongoose_1.default.Types.ObjectId.isValid(notificationId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid notification ID', 400);
        }
        const notification = await Notification_1.default.findOne({
            _id: notificationId,
            userId: userId,
        });
        if (!notification) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Notification not found', 404);
        }
        notification.markAsDismissed();
        await notification.save();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Notification dismissed');
    }
    catch (error) {
        logger_1.default.error('Error dismissing notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to dismiss notification', 500);
    }
};
exports.dismissNotification = dismissNotification;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const workplaceId = req.user.workplaceId;
        const unreadCount = await Notification_1.default.getUnreadCountByUser(new mongoose_1.default.Types.ObjectId(userId), new mongoose_1.default.Types.ObjectId(workplaceId));
        return (0, responseHelpers_1.sendSuccess)(res, { unreadCount }, 'Unread count retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting unread count:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get unread count', 500);
    }
};
exports.getUnreadCount = getUnreadCount;
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const preferences = await notificationService_1.notificationService.getNotificationPreferences(userId);
        return (0, responseHelpers_1.sendSuccess)(res, preferences, 'Notification preferences retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting notification preferences:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get notification preferences', 500);
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const preferences = req.body;
        await notificationService_1.notificationService.updateNotificationPreferences(userId, preferences);
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Notification preferences updated successfully');
    }
    catch (error) {
        logger_1.default.error('Error updating notification preferences:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to update notification preferences', 500);
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
const createConversationNotification = async (req, res) => {
    try {
        const { type, conversationId, recipientIds, messageId, customContent, } = req.body;
        if (!type || !conversationId || !Array.isArray(recipientIds)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Missing required fields: type, conversationId, recipientIds', 400);
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid conversation ID', 400);
        }
        const validRecipientIds = recipientIds.filter(id => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validRecipientIds.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'No valid recipient IDs provided', 400);
        }
        const senderId = req.user._id;
        const notifications = await notificationService_1.notificationService.createConversationNotification(type, conversationId, senderId, validRecipientIds, messageId, customContent);
        return (0, responseHelpers_1.sendSuccess)(res, notifications, 'Conversation notifications created successfully');
    }
    catch (error) {
        logger_1.default.error('Error creating conversation notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to create conversation notification', 500);
    }
};
exports.createConversationNotification = createConversationNotification;
const createPatientQueryNotification = async (req, res) => {
    try {
        const { patientId, conversationId, messageContent, recipientIds, } = req.body;
        if (!patientId || !conversationId || !messageContent || !Array.isArray(recipientIds)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Missing required fields: patientId, conversationId, messageContent, recipientIds', 400);
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(patientId) || !mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid patient ID or conversation ID', 400);
        }
        const validRecipientIds = recipientIds.filter(id => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validRecipientIds.length === 0) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'No valid recipient IDs provided', 400);
        }
        const notifications = await notificationService_1.notificationService.createPatientQueryNotification(patientId, conversationId, messageContent, validRecipientIds);
        return (0, responseHelpers_1.sendSuccess)(res, notifications, 'Patient query notifications created successfully');
    }
    catch (error) {
        logger_1.default.error('Error creating patient query notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to create patient query notification', 500);
    }
};
exports.createPatientQueryNotification = createPatientQueryNotification;
const getNotificationStatistics = async (req, res) => {
    try {
        const workplaceId = req.user.workplaceId;
        const { startDate, endDate } = req.query;
        const dateRange = {
            start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: endDate ? new Date(endDate) : new Date(),
        };
        const stats = await Notification_1.default.getNotificationStats(new mongoose_1.default.Types.ObjectId(workplaceId), dateRange);
        return (0, responseHelpers_1.sendSuccess)(res, stats, 'Notification statistics retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting notification statistics:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to get notification statistics', 500);
    }
};
exports.getNotificationStatistics = getNotificationStatistics;
const processScheduledNotifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions', 403);
        }
        await notificationService_1.notificationService.processScheduledNotifications();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Scheduled notifications processed successfully');
    }
    catch (error) {
        logger_1.default.error('Error processing scheduled notifications:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to process scheduled notifications', 500);
    }
};
exports.processScheduledNotifications = processScheduledNotifications;
const retryFailedNotifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions', 403);
        }
        await notificationService_1.notificationService.retryFailedNotifications();
        return (0, responseHelpers_1.sendSuccess)(res, null, 'Failed notifications retry processed successfully');
    }
    catch (error) {
        logger_1.default.error('Error retrying failed notifications:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retry notifications', 500);
    }
};
exports.retryFailedNotifications = retryFailedNotifications;
const sendTestNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type = 'system_notification', channels = ['inApp'] } = req.body;
        const testNotificationData = {
            userId: new mongoose_1.default.Types.ObjectId(userId),
            type,
            title: 'Test Notification',
            content: 'This is a test notification to verify your notification settings are working correctly.',
            data: {
                metadata: {
                    isTest: true,
                    sentAt: new Date().toISOString(),
                },
            },
            priority: 'normal',
            deliveryChannels: {
                inApp: channels.includes('inApp'),
                email: channels.includes('email'),
                sms: channels.includes('sms'),
                push: channels.includes('push'),
            },
            workplaceId: new mongoose_1.default.Types.ObjectId(req.user.workplaceId),
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
        };
        const notification = await notificationService_1.notificationService.createNotification(testNotificationData);
        return (0, responseHelpers_1.sendSuccess)(res, notification, 'Test notification sent successfully');
    }
    catch (error) {
        logger_1.default.error('Error sending test notification:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to send test notification', 500);
    }
};
exports.sendTestNotification = sendTestNotification;
const archiveOldNotifications = async (req, res) => {
    try {
        const { daysOld = 30 } = req.body;
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const result = await Notification_1.default.updateMany({
            createdAt: { $lt: cutoffDate },
            status: { $ne: 'archived' },
        }, {
            $set: {
                status: 'archived',
                updatedAt: new Date(),
            },
        });
        return (0, responseHelpers_1.sendSuccess)(res, { archivedCount: result.modifiedCount }, `Archived ${result.modifiedCount} old notifications`);
    }
    catch (error) {
        logger_1.default.error('Error archiving old notifications:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to archive old notifications', 500);
    }
};
exports.archiveOldNotifications = archiveOldNotifications;
const deleteExpiredNotifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions', 403);
        }
        const result = await Notification_1.default.deleteMany({
            expiresAt: { $lt: new Date() },
        });
        return (0, responseHelpers_1.sendSuccess)(res, { deletedCount: result.deletedCount }, `Deleted ${result.deletedCount} expired notifications`);
    }
    catch (error) {
        logger_1.default.error('Error deleting expired notifications:', error);
        return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to delete expired notifications', 500);
    }
};
exports.deleteExpiredNotifications = deleteExpiredNotifications;
//# sourceMappingURL=notificationController.js.map