"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const email_1 = require("../utils/email");
const sms_1 = require("../utils/sms");
const notificationTemplates_1 = require("../templates/notifications/notificationTemplates");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationService {
    constructor() {
        this.io = null;
        this.templates = new Map();
        this.initializeTemplates();
    }
    setSocketServer(io) {
        this.io = io;
        logger_1.default.info("Socket.IO server set for NotificationService");
    }
    async createNotification(data) {
        try {
            const user = await User_1.default.findById(data.userId).select("notificationPreferences");
            const preferences = this.getUserPreferences(user?.notificationPreferences);
            const deliveryChannels = this.applyUserPreferences(data.deliveryChannels || {}, preferences, data.type);
            if (this.isInQuietHours(preferences.quietHours)) {
                if (!["urgent", "critical"].includes(data.priority || "normal")) {
                    data.scheduledFor = this.getNextAvailableTime(preferences.quietHours);
                }
            }
            const notification = new Notification_1.default({
                userId: data.userId,
                type: data.type,
                title: data.title,
                content: data.content,
                data: data.data,
                priority: data.priority || "normal",
                deliveryChannels,
                scheduledFor: data.scheduledFor,
                expiresAt: data.expiresAt,
                groupKey: data.groupKey,
                workplaceId: data.workplaceId,
                createdBy: data.createdBy,
            });
            await notification.save();
            if (!data.scheduledFor || data.scheduledFor <= new Date()) {
                await this.deliverNotification(notification);
            }
            logger_1.default.info(`Notification created: ${notification._id} for user ${data.userId}`);
            return notification;
        }
        catch (error) {
            logger_1.default.error("Error creating notification:", error);
            throw error;
        }
    }
    async sendRealTimeNotification(userId, notification) {
        if (!this.io) {
            logger_1.default.warn("Socket.IO server not available for real-time notifications");
            return;
        }
        try {
            const userSockets = await this.getUserSockets(userId);
            if (userSockets.length === 0) {
                logger_1.default.debug(`No active sockets found for user ${userId}`);
                return;
            }
            const notificationData = {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                content: notification.content,
                priority: notification.priority,
                data: notification.data,
                createdAt: notification.createdAt,
                isUrgent: notification.priority === "urgent",
            };
            userSockets.forEach((socketId) => {
                this.io.to(socketId).emit("notification_received", notificationData);
            });
            notification.updateDeliveryStatus("inApp", "delivered");
            await notification.save();
            logger_1.default.debug(`Real-time notification sent to ${userSockets.length} sockets for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error sending real-time notification:", error);
            throw error;
        }
    }
    async sendEmailNotification(userId, notification) {
        try {
            const user = await User_1.default.findById(userId).select("email firstName lastName");
            if (!user || !user.email) {
                throw new Error("User email not found");
            }
            const template = this.getNotificationTemplate(notification.type, notification.data);
            await (0, email_1.sendEmail)({
                to: user.email,
                subject: template.subject,
                html: template.htmlTemplate || template.content,
                text: template.content,
            });
            notification.updateDeliveryStatus("email", "sent");
            await notification.save();
            logger_1.default.debug(`Email notification sent to ${user.email}`);
        }
        catch (error) {
            logger_1.default.error("Error sending email notification:", error);
            notification.updateDeliveryStatus("email", "failed", {
                reason: error.message,
            });
            await notification.save();
            throw error;
        }
    }
    async sendSMSNotification(userId, notification) {
        try {
            const user = await User_1.default.findById(userId).select("phone firstName lastName");
            if (!user || !user.phone) {
                throw new Error("User phone number not found");
            }
            const template = this.getNotificationTemplate(notification.type, notification.data);
            const smsContent = template.smsTemplate || template.content;
            await (0, sms_1.sendSMS)(user.phone, smsContent);
            notification.updateDeliveryStatus("sms", "sent");
            await notification.save();
            logger_1.default.debug(`SMS notification sent to ${user.phone}`);
        }
        catch (error) {
            logger_1.default.error("Error sending SMS notification:", error);
            notification.updateDeliveryStatus("sms", "failed", {
                reason: error.message,
            });
            await notification.save();
            throw error;
        }
    }
    async deliverNotification(notification) {
        const deliveryPromises = [];
        if (notification.deliveryChannels.inApp) {
            deliveryPromises.push(this.sendRealTimeNotification(notification.userId.toString(), notification).catch((error) => {
                logger_1.default.error("In-app delivery failed:", error);
            }));
        }
        if (notification.deliveryChannels.email) {
            deliveryPromises.push(this.sendEmailNotification(notification.userId.toString(), notification).catch((error) => {
                logger_1.default.error("Email delivery failed:", error);
            }));
        }
        if (notification.deliveryChannels.sms) {
            deliveryPromises.push(this.sendSMSNotification(notification.userId.toString(), notification).catch((error) => {
                logger_1.default.error("SMS delivery failed:", error);
            }));
        }
        await Promise.allSettled(deliveryPromises);
        notification.sentAt = new Date();
        await notification.save();
    }
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification_1.default.findOne({
                _id: notificationId,
                userId: userId,
            });
            if (!notification) {
                throw new Error("Notification not found");
            }
            notification.markAsRead();
            await notification.save();
            if (this.io) {
                const userSockets = await this.getUserSockets(userId);
                userSockets.forEach((socketId) => {
                    this.io.to(socketId).emit("notification_read", {
                        notificationId,
                        readAt: notification.readAt,
                    });
                });
            }
            logger_1.default.debug(`Notification ${notificationId} marked as read by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error marking notification as read:", error);
            throw error;
        }
    }
    async getUserNotifications(userId, workplaceId, filters = {}) {
        try {
            const query = {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            };
            if (filters.type)
                query.type = filters.type;
            if (filters.status)
                query.status = filters.status;
            if (filters.priority)
                query.priority = filters.priority;
            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate)
                    query.createdAt.$gte = filters.startDate;
                if (filters.endDate)
                    query.createdAt.$lte = filters.endDate;
            }
            const [notifications, total, unreadCount] = await Promise.all([
                Notification_1.default.find(query)
                    .populate("data.senderId", "firstName lastName role")
                    .populate("data.conversationId", "title type")
                    .populate("data.patientId", "firstName lastName mrn")
                    .sort({ priority: -1, createdAt: -1 })
                    .limit(filters.limit || 50)
                    .skip(filters.offset || 0),
                Notification_1.default.countDocuments(query),
                Notification_1.default.countDocuments({ ...query, status: "unread" }),
            ]);
            return { notifications, total, unreadCount };
        }
        catch (error) {
            logger_1.default.error("Error getting user notifications:", error);
            throw error;
        }
    }
    async processScheduledNotifications() {
        try {
            const scheduledNotifications = await Notification_1.default.find({
                scheduledFor: { $lte: new Date() },
                status: "pending",
            });
            for (const notification of scheduledNotifications) {
                try {
                    await this.deliverNotification(notification);
                }
                catch (error) {
                    logger_1.default.error(`Failed to deliver scheduled notification ${notification._id}:`, error);
                }
            }
            logger_1.default.info(`Processed ${scheduledNotifications.length} scheduled notifications`);
        }
        catch (error) {
            logger_1.default.error("Error processing scheduled notifications:", error);
            throw error;
        }
    }
    async createConversationNotification(type, conversationId, senderId, recipientIds, messageId, customContent) {
        try {
            const [conversation, sender, message] = await Promise.all([
                Conversation_1.default.findById(conversationId).populate("patientId", "firstName lastName"),
                User_1.default.findById(senderId).select("firstName lastName role"),
                messageId ? Message_1.default.findById(messageId) : null,
            ]);
            if (!conversation || !sender) {
                throw new Error("Conversation or sender not found");
            }
            const notifications = [];
            for (const recipientId of recipientIds) {
                if (recipientId === senderId)
                    continue;
                const template = this.getConversationNotificationTemplate(type, conversation, sender, message, customContent);
                const notification = await this.createNotification({
                    userId: new mongoose_1.default.Types.ObjectId(recipientId),
                    type,
                    title: template.subject,
                    content: template.content,
                    data: {
                        conversationId: conversation._id,
                        messageId: messageId
                            ? new mongoose_1.default.Types.ObjectId(messageId)
                            : undefined,
                        senderId: sender._id,
                        patientId: conversation.patientId?._id,
                        actionUrl: `/communication-hub/conversations/${conversationId}`,
                    },
                    priority: type === "mention" ? "high" : "normal",
                    workplaceId: conversation.workplaceId,
                    createdBy: sender._id,
                });
                notifications.push(notification);
            }
            return notifications;
        }
        catch (error) {
            logger_1.default.error("Error creating conversation notification:", error);
            throw error;
        }
    }
    async createPatientQueryNotification(patientId, conversationId, messageContent, recipientIds) {
        try {
            const [patient, conversation] = await Promise.all([
                Patient_1.default.findById(patientId).select("firstName lastName mrn"),
                Conversation_1.default.findById(conversationId),
            ]);
            if (!patient || !conversation) {
                throw new Error("Patient or conversation not found");
            }
            const notifications = [];
            for (const recipientId of recipientIds) {
                const notification = await this.createNotification({
                    userId: new mongoose_1.default.Types.ObjectId(recipientId),
                    type: "patient_query",
                    title: `New Patient Query from ${patient.firstName} ${patient.lastName}`,
                    content: `Patient ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn}) has sent a new query: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? "..." : ""}"`,
                    data: {
                        conversationId: conversation._id,
                        patientId: patient._id,
                        actionUrl: `/communication-hub/conversations/${conversationId}`,
                        metadata: {
                            patientMRN: patient.mrn,
                            queryPreview: messageContent.substring(0, 200),
                        },
                    },
                    priority: "high",
                    workplaceId: conversation.workplaceId,
                    createdBy: patient._id,
                });
                notifications.push(notification);
            }
            return notifications;
        }
        catch (error) {
            logger_1.default.error("Error creating patient query notification:", error);
            throw error;
        }
    }
    async updateNotificationPreferences(userId, preferences) {
        try {
            await User_1.default.findByIdAndUpdate(userId, { $set: { notificationPreferences: preferences } }, { new: true });
            logger_1.default.info(`Updated notification preferences for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error updating notification preferences:", error);
            throw error;
        }
    }
    async getNotificationPreferences(userId) {
        try {
            const user = await User_1.default.findById(userId).select("notificationPreferences");
            return this.getUserPreferences(user?.notificationPreferences);
        }
        catch (error) {
            logger_1.default.error("Error getting notification preferences:", error);
            throw error;
        }
    }
    async retryFailedNotifications() {
        try {
            const failedNotifications = await Notification_1.default.find({
                "deliveryStatus.status": "failed",
                "deliveryStatus.attempts": { $lt: 5 },
                expiresAt: { $gt: new Date() },
            });
            for (const notification of failedNotifications) {
                for (const deliveryStatus of notification.deliveryStatus) {
                    if (deliveryStatus.status === "failed" &&
                        notification.canRetryDelivery(deliveryStatus.channel)) {
                        try {
                            switch (deliveryStatus.channel) {
                                case "email":
                                    await this.sendEmailNotification(notification.userId.toString(), notification);
                                    break;
                                case "sms":
                                    await this.sendSMSNotification(notification.userId.toString(), notification);
                                    break;
                                case "inApp":
                                    await this.sendRealTimeNotification(notification.userId.toString(), notification);
                                    break;
                            }
                        }
                        catch (error) {
                            logger_1.default.error(`Retry failed for notification ${notification._id}, channel ${deliveryStatus.channel}:`, error);
                        }
                    }
                }
            }
            logger_1.default.info(`Processed retry for ${failedNotifications.length} failed notifications`);
        }
        catch (error) {
            logger_1.default.error("Error retrying failed notifications:", error);
            throw error;
        }
    }
    getUserPreferences(preferences) {
        const defaultPreferences = {
            inApp: true,
            email: true,
            sms: false,
            push: true,
            newMessage: true,
            mentions: true,
            conversationInvites: true,
            patientQueries: true,
            urgentMessages: true,
            therapyUpdates: true,
            clinicalAlerts: true,
            interventionAssignments: true,
            quietHours: {
                enabled: false,
                startTime: "22:00",
                endTime: "08:00",
                timezone: "UTC",
            },
            batchDigest: false,
            digestFrequency: "daily",
        };
        return { ...defaultPreferences, ...preferences };
    }
    applyUserPreferences(requestedChannels, preferences, notificationType) {
        const channels = {
            inApp: requestedChannels.inApp ?? preferences.inApp,
            email: requestedChannels.email ?? preferences.email,
            sms: requestedChannels.sms ?? preferences.sms,
            push: requestedChannels.push ?? preferences.push,
        };
        switch (notificationType) {
            case "new_message":
                if (!preferences.newMessage) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "mention":
                if (!preferences.mentions) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "conversation_invite":
                if (!preferences.conversationInvites) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "patient_query":
                if (!preferences.patientQueries) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "urgent_message":
                if (!preferences.urgentMessages) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "therapy_update":
                if (!preferences.therapyUpdates) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "clinical_alert":
                if (!preferences.clinicalAlerts) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
            case "intervention_assigned":
                if (!preferences.interventionAssignments) {
                    channels.email = false;
                    channels.sms = false;
                }
                break;
        }
        return channels;
    }
    isInQuietHours(quietHours) {
        if (!quietHours.enabled)
            return false;
        const now = new Date();
        const currentTime = now
            .toLocaleTimeString("en-US", {
            hour12: false,
            timeZone: quietHours.timezone,
        })
            .substring(0, 5);
        return (currentTime >= quietHours.startTime || currentTime <= quietHours.endTime);
    }
    getNextAvailableTime(quietHours) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [endHour, endMinute] = quietHours.endTime.split(":").map(Number);
        tomorrow.setHours(endHour || 17, endMinute || 0, 0, 0);
        return tomorrow;
    }
    async getUserSockets(userId) {
        if (!this.io)
            return [];
        const sockets = [];
        const allSockets = await this.io.fetchSockets();
        for (const socket of allSockets) {
            if (socket.data.userId === userId) {
                sockets.push(socket.id);
            }
        }
        return sockets;
    }
    initializeTemplates() {
        this.templates.set("new_message", {
            subject: "New Message from {{senderName}}",
            content: "{{senderName}} sent you a message in {{conversationTitle}}",
            htmlTemplate: `
                <h3>New Message</h3>
                <p><strong>{{senderName}}</strong> sent you a message in <strong>{{conversationTitle}}</strong></p>
                <blockquote>{{messagePreview}}</blockquote>
                <a href="{{actionUrl}}">View Conversation</a>
            `,
            smsTemplate: "New message from {{senderName}}: {{messagePreview}}",
            variables: {},
        });
        this.templates.set("mention", {
            subject: "You were mentioned by {{senderName}}",
            content: "{{senderName}} mentioned you in {{conversationTitle}}",
            htmlTemplate: `
                <h3>You were mentioned</h3>
                <p><strong>{{senderName}}</strong> mentioned you in <strong>{{conversationTitle}}</strong></p>
                <blockquote>{{messagePreview}}</blockquote>
                <a href="{{actionUrl}}">View Message</a>
            `,
            smsTemplate: "{{senderName}} mentioned you: {{messagePreview}}",
            variables: {},
        });
        this.templates.set("patient_query", {
            subject: "New Patient Query from {{patientName}}",
            content: "Patient {{patientName}} has sent a new query",
            htmlTemplate: `
                <h3>New Patient Query</h3>
                <p>Patient <strong>{{patientName}}</strong> (MRN: {{patientMRN}}) has sent a new query:</p>
                <blockquote>{{queryPreview}}</blockquote>
                <a href="{{actionUrl}}">Respond to Query</a>
            `,
            smsTemplate: "New patient query from {{patientName}}: {{queryPreview}}",
            variables: {},
        });
    }
    getNotificationTemplate(type, data) {
        const variables = notificationTemplates_1.NotificationTemplateService.getTemplateVariables(type, data);
        const template = notificationTemplates_1.notificationTemplateService.getTemplate(type, variables);
        return {
            ...template,
            variables,
        };
    }
    getConversationNotificationTemplate(type, conversation, sender, message, customContent) {
        const senderName = `${sender.firstName} ${sender.lastName}`;
        const conversationTitle = conversation.title || "Conversation";
        const messagePreview = message?.content?.text?.substring(0, 100) || customContent || "";
        switch (type) {
            case "new_message":
                return {
                    subject: `New message from ${senderName}`,
                    content: `${senderName} sent a message in ${conversationTitle}: "${messagePreview}"`,
                };
            case "mention":
                return {
                    subject: `You were mentioned by ${senderName}`,
                    content: `${senderName} mentioned you in ${conversationTitle}: "${messagePreview}"`,
                };
            case "conversation_invite":
                return {
                    subject: `Invited to conversation by ${senderName}`,
                    content: `${senderName} invited you to join ${conversationTitle}`,
                };
            default:
                return {
                    subject: "Communication Hub Notification",
                    content: "You have a new notification",
                };
        }
    }
}
exports.notificationService = new NotificationService();
exports.default = exports.notificationService;
//# sourceMappingURL=notificationService.js.map