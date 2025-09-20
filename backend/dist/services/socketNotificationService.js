"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketNotificationService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const notificationService_1 = require("./notificationService");
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
class SocketNotificationService {
    constructor(io) {
        this.connectedUsers = new Map();
        this.socketUsers = new Map();
        this.io = io;
        this.setupSocketHandlers();
        notificationService_1.notificationService.setSocketServer(io);
        logger_1.default.info('Socket notification service initialized');
    }
    setupSocketHandlers() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await User_1.default.findById(decoded.id).select('_id workplaceId role email firstName lastName');
                if (!user) {
                    return next(new Error('User not found'));
                }
                socket.userId = user._id.toString();
                socket.workplaceId = user.workplaceId.toString();
                socket.role = user.role;
                this.socketUsers.set(socket.id, {
                    userId: user._id.toString(),
                    workplaceId: user.workplaceId.toString(),
                    role: user.role,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                });
                next();
            }
            catch (error) {
                logger_1.default.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        const userId = socket.userId;
        const userData = this.socketUsers.get(socket.id);
        logger_1.default.info(`User ${userData.firstName} ${userData.lastName} connected (${socket.id})`);
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(socket.id);
        socket.join(`user:${userId}`);
        socket.join(`workplace:${socket.workplaceId}`);
        this.sendInitialNotifications(socket);
        this.setupNotificationHandlers(socket);
        this.setupConversationHandlers(socket);
        this.setupPresenceHandlers(socket);
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }
    handleDisconnection(socket) {
        const userId = socket.userId;
        const userData = this.socketUsers.get(socket.id);
        if (userData) {
            logger_1.default.info(`User ${userData.firstName} ${userData.lastName} disconnected (${socket.id})`);
        }
        if (this.connectedUsers.has(userId)) {
            this.connectedUsers.get(userId).delete(socket.id);
            if (this.connectedUsers.get(userId).size === 0) {
                this.connectedUsers.delete(userId);
            }
        }
        this.socketUsers.delete(socket.id);
        this.broadcastUserPresence(userId, false);
    }
    setupNotificationHandlers(socket) {
        socket.on('notification:mark_read', async (data) => {
            try {
                await notificationService_1.notificationService.markAsRead(data.notificationId, socket.userId);
                this.io.to(`user:${socket.userId}`).emit('notification:marked_read', {
                    notificationId: data.notificationId,
                    readAt: new Date(),
                });
                logger_1.default.debug(`Notification ${data.notificationId} marked as read by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error marking notification as read:', error);
                socket.emit('notification:error', {
                    message: 'Failed to mark notification as read',
                    error: error.message,
                });
            }
        });
        socket.on('notification:get_unread_count', async () => {
            try {
                const unreadCount = await Notification_1.default.getUnreadCountByUser(socket.userId, socket.workplaceId);
                socket.emit('notification:unread_count', { unreadCount });
            }
            catch (error) {
                logger_1.default.error('Error getting unread count:', error);
                socket.emit('notification:error', {
                    message: 'Failed to get unread count',
                    error: error.message,
                });
            }
        });
        socket.on('notification:get_recent', async (data = {}) => {
            try {
                const result = await notificationService_1.notificationService.getUserNotifications(socket.userId, socket.workplaceId, { limit: data.limit || 10, status: 'unread' });
                socket.emit('notification:recent_list', result);
            }
            catch (error) {
                logger_1.default.error('Error getting recent notifications:', error);
                socket.emit('notification:error', {
                    message: 'Failed to get recent notifications',
                    error: error.message,
                });
            }
        });
        socket.on('notification:update_preferences', async (preferences) => {
            try {
                await notificationService_1.notificationService.updateNotificationPreferences(socket.userId, preferences);
                socket.emit('notification:preferences_updated', {
                    success: true,
                    preferences,
                });
                logger_1.default.debug(`Notification preferences updated for user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error updating notification preferences:', error);
                socket.emit('notification:error', {
                    message: 'Failed to update notification preferences',
                    error: error.message,
                });
            }
        });
    }
    setupConversationHandlers(socket) {
        socket.on('conversation:join', (data) => {
            socket.join(`conversation:${data.conversationId}`);
            logger_1.default.debug(`User ${socket.userId} joined conversation ${data.conversationId}`);
        });
        socket.on('conversation:leave', (data) => {
            socket.leave(`conversation:${data.conversationId}`);
            logger_1.default.debug(`User ${socket.userId} left conversation ${data.conversationId}`);
        });
        socket.on('conversation:typing_start', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('conversation:user_typing', {
                userId: socket.userId,
                conversationId: data.conversationId,
                userData: this.socketUsers.get(socket.id),
            });
        });
        socket.on('conversation:typing_stop', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('conversation:user_stopped_typing', {
                userId: socket.userId,
                conversationId: data.conversationId,
            });
        });
        socket.on('message:mark_read', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('message:read_receipt', {
                messageId: data.messageId,
                userId: socket.userId,
                readAt: new Date(),
            });
        });
    }
    setupPresenceHandlers(socket) {
        this.broadcastUserPresence(socket.userId, true);
        socket.on('presence:get_online_users', () => {
            const onlineUsers = Array.from(this.connectedUsers.keys()).map(userId => {
                const sockets = this.connectedUsers.get(userId);
                const firstSocket = Array.from(sockets)[0];
                return this.socketUsers.get(firstSocket);
            }).filter(Boolean);
            socket.emit('presence:online_users', onlineUsers);
        });
        socket.on('presence:update_status', (data) => {
            const userData = this.socketUsers.get(socket.id);
            if (userData) {
                socket.to(`workplace:${socket.workplaceId}`).emit('presence:user_status_changed', {
                    userId: socket.userId,
                    status: data.status,
                    userData,
                });
            }
        });
    }
    async sendInitialNotifications(socket) {
        try {
            const unreadCount = await Notification_1.default.getUnreadCountByUser(socket.userId, socket.workplaceId);
            socket.emit('notification:unread_count', { unreadCount });
            const result = await notificationService_1.notificationService.getUserNotifications(socket.userId, socket.workplaceId, { limit: 5, status: 'unread' });
            socket.emit('notification:initial_load', result);
            logger_1.default.debug(`Sent initial notifications to user ${socket.userId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending initial notifications:', error);
        }
    }
    broadcastUserPresence(userId, isOnline) {
        const userData = Array.from(this.socketUsers.values()).find(u => u.userId === userId);
        if (userData) {
            this.io.to(`workplace:${userData.workplaceId}`).emit('presence:user_presence_changed', {
                userId,
                isOnline,
                userData,
                timestamp: new Date(),
            });
        }
    }
    async sendNotificationToUser(userId, notification) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets && userSockets.size > 0) {
            this.io.to(`user:${userId}`).emit('notification:received', {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                content: notification.content,
                priority: notification.priority,
                data: notification.data,
                createdAt: notification.createdAt,
                isUrgent: notification.isUrgent,
            });
            const unreadCount = await Notification_1.default.getUnreadCountByUser(userId, notification.workplaceId);
            this.io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
            logger_1.default.debug(`Sent real-time notification to user ${userId}`);
        }
    }
    sendMessageNotification(conversationId, message, excludeUserId) {
        const notificationData = {
            messageId: message._id,
            conversationId,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
            senderData: this.socketUsers.get(message.senderId),
        };
        if (excludeUserId) {
            this.io.to(`conversation:${conversationId}`).except(`user:${excludeUserId}`).emit('message:received', notificationData);
        }
        else {
            this.io.to(`conversation:${conversationId}`).emit('message:received', notificationData);
        }
    }
    sendConversationUpdate(conversationId, updateData) {
        this.io.to(`conversation:${conversationId}`).emit('conversation:updated', {
            conversationId,
            ...updateData,
            timestamp: new Date(),
        });
    }
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
    getWorkplaceConnectedUsers(workplaceId) {
        return Array.from(this.socketUsers.values()).filter(user => user.workplaceId === workplaceId);
    }
    sendWorkplaceAnnouncement(workplaceId, announcement) {
        this.io.to(`workplace:${workplaceId}`).emit('system:announcement', {
            ...announcement,
            timestamp: new Date(),
        });
    }
    sendEmergencyAlert(alert) {
        this.io.emit('system:emergency_alert', {
            ...alert,
            timestamp: new Date(),
        });
    }
}
exports.SocketNotificationService = SocketNotificationService;
exports.default = SocketNotificationService;
//# sourceMappingURL=socketNotificationService.js.map