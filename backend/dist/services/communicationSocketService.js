"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationSocketService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
class CommunicationSocketService {
    constructor(io) {
        this.connectedUsers = new Map();
        this.socketUsers = new Map();
        this.conversationRooms = new Map();
        this.typingUsers = new Map();
        this.typingTimeouts = new Map();
        this.io = io;
        this.setupSocketHandlers();
        logger_1.default.info('Communication Socket service initialized');
    }
    setupSocketHandlers() {
        this.io.use(async (socket, next) => {
            try {
                let user = null;
                logger_1.default.info('🔍 [Socket Auth] Attempting authentication for socket:', socket.id);
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (token) {
                    try {
                        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                        const userId = decoded.userId || decoded.id;
                        logger_1.default.info('🔍 [Socket Auth] Header token decoded:', {
                            userId: userId,
                            iat: decoded.iat,
                            exp: decoded.exp
                        });
                        user = await User_1.default.findById(userId)
                            .select('_id workplaceId role email firstName lastName');
                    }
                    catch (tokenError) {
                        logger_1.default.warn('🔍 [Socket Auth] Token authentication failed:', tokenError.message);
                    }
                }
                if (!user) {
                    const cookies = socket.handshake.headers.cookie;
                    logger_1.default.info('🔍 [Socket Auth] Checking cookies:', !!cookies);
                    logger_1.default.info('🔍 [Socket Auth] All headers:', Object.keys(socket.handshake.headers));
                    logger_1.default.info('🔍 [Socket Auth] Cookie header length:', cookies?.length || 0);
                    if (cookies) {
                        const cookieObj = {};
                        cookies.split(';').forEach(cookie => {
                            const [name, value] = cookie.trim().split('=');
                            if (name && value) {
                                try {
                                    cookieObj[name] = decodeURIComponent(value);
                                }
                                catch (e) {
                                    cookieObj[name] = value;
                                }
                            }
                        });
                        logger_1.default.info('🔍 [Socket Auth] Parsed cookies:', Object.keys(cookieObj));
                        logger_1.default.info('🔍 [Socket Auth] Cookie values:', {
                            hasAccessToken: !!cookieObj['accessToken'],
                            hasToken: !!cookieObj['token'],
                            accessTokenLength: cookieObj['accessToken']?.length || 0,
                            tokenLength: cookieObj['token']?.length || 0
                        });
                        const authToken = cookieObj['accessToken'] || cookieObj['token'];
                        if (authToken) {
                            logger_1.default.info('🔍 [Socket Auth] Found auth cookie, verifying...');
                            try {
                                const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
                                const userId = decoded.userId || decoded.id;
                                logger_1.default.info('🔍 [Socket Auth] Token decoded successfully:', {
                                    userId: userId,
                                    iat: decoded.iat,
                                    exp: decoded.exp
                                });
                                user = await User_1.default.findById(userId)
                                    .select('_id workplaceId role email firstName lastName');
                                if (user) {
                                    logger_1.default.info('🔍 [Socket Auth] Cookie auth successful for user:', user.email);
                                }
                                else {
                                    logger_1.default.warn('🔍 [Socket Auth] User not found in database for ID:', userId);
                                    const anyUser = await User_1.default.findOne().select('_id email');
                                    logger_1.default.info('🔍 [Socket Auth] Database test - found any user:', !!anyUser);
                                }
                            }
                            catch (cookieError) {
                                logger_1.default.warn('🔍 [Socket Auth] Cookie authentication failed:', cookieError.message);
                            }
                        }
                        else {
                            logger_1.default.warn('🔍 [Socket Auth] No auth cookies found. Available cookies:', Object.keys(cookieObj));
                        }
                    }
                }
                if (!user) {
                    return next(new Error('Authentication required - no valid token or session found'));
                }
                socket.userId = user._id.toString();
                socket.workplaceId = user.workplaceId?.toString();
                socket.role = user.role;
                this.socketUsers.set(socket.id, {
                    userId: user._id.toString(),
                    workplaceId: user.workplaceId?.toString() || '',
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
        logger_1.default.info(`User ${userData.firstName} ${userData.lastName} connected to communication hub (${socket.id})`);
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(socket.id);
        socket.join(`user:${userId}`);
        socket.join(`workplace:${socket.workplaceId}`);
        this.setupConversationHandlers(socket);
        this.setupMessageHandlers(socket);
        this.setupTypingHandlers(socket);
        this.setupPresenceHandlers(socket);
        this.setupFileHandlers(socket);
        this.sendInitialData(socket);
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
        socket.on('error', (error) => {
            logger_1.default.error(`Socket error for user ${userId}:`, error);
            this.sendErrorToSocket(socket, 'connection_error', 'Connection error occurred');
        });
    }
    handleDisconnection(socket) {
        const userId = socket.userId;
        const userData = this.socketUsers.get(socket.id);
        if (userData) {
            logger_1.default.info(`User ${userData.firstName} ${userData.lastName} disconnected from communication hub (${socket.id})`);
        }
        this.cleanupTypingForSocket(socket);
        this.conversationRooms.forEach((sockets, conversationId) => {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    this.conversationRooms.delete(conversationId);
                }
            }
        });
        if (this.connectedUsers.has(userId)) {
            this.connectedUsers.get(userId).delete(socket.id);
            if (this.connectedUsers.get(userId).size === 0) {
                this.connectedUsers.delete(userId);
                this.broadcastUserPresence(userId, false);
            }
        }
        this.socketUsers.delete(socket.id);
    }
    setupConversationHandlers(socket) {
        socket.on('conversation:join', async (data) => {
            try {
                const conversation = await Conversation_1.default.findById(data.conversationId);
                if (!conversation) {
                    return this.sendErrorToSocket(socket, 'conversation_not_found', 'Conversation not found');
                }
                if (!conversation.hasParticipant(socket.userId)) {
                    return this.sendErrorToSocket(socket, 'access_denied', 'Not a participant in this conversation');
                }
                socket.join(`conversation:${data.conversationId}`);
                if (!this.conversationRooms.has(data.conversationId)) {
                    this.conversationRooms.set(data.conversationId, new Set());
                }
                this.conversationRooms.get(data.conversationId).add(socket.id);
                socket.to(`conversation:${data.conversationId}`).emit('conversation:participant_joined', {
                    conversationId: data.conversationId,
                    userId: socket.userId,
                    userData: this.socketUsers.get(socket.id),
                    timestamp: new Date(),
                });
                logger_1.default.debug(`User ${socket.userId} joined conversation ${data.conversationId}`);
            }
            catch (error) {
                logger_1.default.error('Error joining conversation:', error);
                this.sendErrorToSocket(socket, 'join_conversation_error', 'Failed to join conversation');
            }
        });
        socket.on('conversation:leave', (data) => {
            socket.leave(`conversation:${data.conversationId}`);
            if (this.conversationRooms.has(data.conversationId)) {
                this.conversationRooms.get(data.conversationId).delete(socket.id);
                if (this.conversationRooms.get(data.conversationId).size === 0) {
                    this.conversationRooms.delete(data.conversationId);
                }
            }
            this.stopTyping(socket, data.conversationId);
            socket.to(`conversation:${data.conversationId}`).emit('conversation:participant_left', {
                conversationId: data.conversationId,
                userId: socket.userId,
                timestamp: new Date(),
            });
            logger_1.default.debug(`User ${socket.userId} left conversation ${data.conversationId}`);
        });
        socket.on('conversation:create', async (data) => {
            try {
                const participants = await User_1.default.find({
                    _id: { $in: data.participants },
                    workplaceId: socket.workplaceId,
                }).select('_id role');
                if (participants.length !== data.participants.length) {
                    return this.sendErrorToSocket(socket, 'invalid_participants', 'Some participants not found');
                }
                const conversation = new Conversation_1.default({
                    title: data.title,
                    type: data.type,
                    participants: participants.map(p => ({
                        userId: p._id,
                        role: p.role,
                        joinedAt: new Date(),
                        permissions: this.getDefaultPermissions(p.role),
                    })),
                    patientId: data.patientId,
                    priority: data.priority || 'normal',
                    tags: data.tags || [],
                    createdBy: socket.userId,
                    workplaceId: socket.workplaceId,
                    metadata: {
                        isEncrypted: true,
                        priority: data.priority || 'normal',
                        tags: data.tags || [],
                    },
                });
                await conversation.save();
                participants.forEach(participant => {
                    this.io.to(`user:${participant._id}`).emit('conversation:created', {
                        conversation: conversation.toObject(),
                        createdBy: this.socketUsers.get(socket.id),
                        timestamp: new Date(),
                    });
                });
                socket.emit('conversation:create_success', {
                    conversation: conversation.toObject(),
                    timestamp: new Date(),
                });
                logger_1.default.info(`Conversation ${conversation._id} created by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error creating conversation:', error);
                this.sendErrorToSocket(socket, 'create_conversation_error', 'Failed to create conversation');
            }
        });
        socket.on('conversation:update', async (data) => {
            try {
                const conversation = await Conversation_1.default.findById(data.conversationId);
                if (!conversation) {
                    return this.sendErrorToSocket(socket, 'conversation_not_found', 'Conversation not found');
                }
                const userRole = conversation.getParticipantRole(socket.userId);
                if (!userRole || !['pharmacist', 'doctor'].includes(userRole)) {
                    return this.sendErrorToSocket(socket, 'insufficient_permissions', 'Insufficient permissions to update conversation');
                }
                if (data.updates.title)
                    conversation.title = data.updates.title;
                if (data.updates.priority)
                    conversation.priority = data.updates.priority;
                if (data.updates.tags)
                    conversation.tags = data.updates.tags;
                await conversation.save();
                this.io.to(`conversation:${data.conversationId}`).emit('conversation:updated', {
                    conversationId: data.conversationId,
                    updates: data.updates,
                    updatedBy: this.socketUsers.get(socket.id),
                    timestamp: new Date(),
                });
                logger_1.default.info(`Conversation ${data.conversationId} updated by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error updating conversation:', error);
                this.sendErrorToSocket(socket, 'update_conversation_error', 'Failed to update conversation');
            }
        });
    }
    setupMessageHandlers(socket) {
        socket.on('message:send', async (data) => {
            try {
                const conversation = await Conversation_1.default.findById(data.conversationId);
                if (!conversation) {
                    return this.sendErrorToSocket(socket, 'conversation_not_found', 'Conversation not found');
                }
                if (!conversation.hasParticipant(socket.userId)) {
                    return this.sendErrorToSocket(socket, 'access_denied', 'Not a participant in this conversation');
                }
                const message = new Message_1.default({
                    conversationId: data.conversationId,
                    senderId: socket.userId,
                    content: data.content,
                    threadId: data.threadId,
                    parentMessageId: data.parentMessageId,
                    mentions: data.mentions || [],
                    priority: data.priority || 'normal',
                    workplaceId: socket.workplaceId,
                    createdBy: socket.userId,
                });
                await message.save();
                await message.populate('senderId', 'firstName lastName role');
                conversation.updateLastMessage(message._id);
                conversation.incrementUnreadCount(socket.userId);
                await conversation.save();
                this.io.to(`conversation:${data.conversationId}`).emit('message:received', {
                    message: message.toObject(),
                    conversationId: data.conversationId,
                    timestamp: new Date(),
                });
                if (data.mentions && data.mentions.length > 0) {
                    await this.handleMentionNotifications(data.mentions, message, conversation);
                }
                this.stopTyping(socket, data.conversationId);
                logger_1.default.debug(`Message sent by user ${socket.userId} in conversation ${data.conversationId}`);
            }
            catch (error) {
                logger_1.default.error('Error sending message:', error);
                this.sendErrorToSocket(socket, 'send_message_error', 'Failed to send message');
            }
        });
        socket.on('message:mark_read', async (data) => {
            try {
                const message = await Message_1.default.findById(data.messageId);
                if (!message) {
                    return this.sendErrorToSocket(socket, 'message_not_found', 'Message not found');
                }
                message.markAsRead(socket.userId);
                await message.save();
                const conversation = await Conversation_1.default.findById(data.conversationId);
                if (conversation) {
                    conversation.markAsRead(socket.userId);
                    await conversation.save();
                }
                socket.to(`conversation:${data.conversationId}`).emit('message:read_receipt', {
                    messageId: data.messageId,
                    userId: socket.userId,
                    userData: this.socketUsers.get(socket.id),
                    readAt: new Date(),
                });
                logger_1.default.debug(`Message ${data.messageId} marked as read by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error marking message as read:', error);
                this.sendErrorToSocket(socket, 'mark_read_error', 'Failed to mark message as read');
            }
        });
        socket.on('message:add_reaction', async (data) => {
            try {
                const message = await Message_1.default.findById(data.messageId);
                if (!message) {
                    return this.sendErrorToSocket(socket, 'message_not_found', 'Message not found');
                }
                message.addReaction(socket.userId, data.emoji);
                await message.save();
                this.io.to(`conversation:${data.conversationId}`).emit('message:reaction_added', {
                    messageId: data.messageId,
                    emoji: data.emoji,
                    userId: socket.userId,
                    userData: this.socketUsers.get(socket.id),
                    timestamp: new Date(),
                });
                logger_1.default.debug(`Reaction ${data.emoji} added to message ${data.messageId} by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error adding reaction:', error);
                this.sendErrorToSocket(socket, 'add_reaction_error', 'Failed to add reaction');
            }
        });
        socket.on('message:remove_reaction', async (data) => {
            try {
                const message = await Message_1.default.findById(data.messageId);
                if (!message) {
                    return this.sendErrorToSocket(socket, 'message_not_found', 'Message not found');
                }
                message.removeReaction(socket.userId, data.emoji);
                await message.save();
                this.io.to(`conversation:${data.conversationId}`).emit('message:reaction_removed', {
                    messageId: data.messageId,
                    emoji: data.emoji,
                    userId: socket.userId,
                    timestamp: new Date(),
                });
                logger_1.default.debug(`Reaction ${data.emoji} removed from message ${data.messageId} by user ${socket.userId}`);
            }
            catch (error) {
                logger_1.default.error('Error removing reaction:', error);
                this.sendErrorToSocket(socket, 'remove_reaction_error', 'Failed to remove reaction');
            }
        });
    }
    setupTypingHandlers(socket) {
        socket.on('typing:start', (data) => {
            this.startTyping(socket, data.conversationId);
        });
        socket.on('typing:stop', (data) => {
            this.stopTyping(socket, data.conversationId);
        });
    }
    setupPresenceHandlers(socket) {
        this.broadcastUserPresence(socket.userId, true);
        socket.on('presence:get_conversation_users', (data) => {
            const conversationSockets = this.conversationRooms.get(data.conversationId);
            const onlineUsers = conversationSockets ?
                Array.from(conversationSockets).map(socketId => this.socketUsers.get(socketId)).filter(Boolean) : [];
            socket.emit('presence:conversation_users', {
                conversationId: data.conversationId,
                onlineUsers,
                timestamp: new Date(),
            });
        });
        socket.on('presence:update_status', (data) => {
            const userData = this.socketUsers.get(socket.id);
            if (userData) {
                socket.to(`workplace:${socket.workplaceId}`).emit('presence:user_status_changed', {
                    userId: socket.userId,
                    status: data.status,
                    userData,
                    timestamp: new Date(),
                });
            }
        });
    }
    setupFileHandlers(socket) {
        socket.on('file:upload_progress', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('file:upload_progress', {
                conversationId: data.conversationId,
                fileName: data.fileName,
                progress: data.progress,
                userId: socket.userId,
                timestamp: new Date(),
            });
        });
        socket.on('file:upload_complete', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('file:upload_complete', {
                conversationId: data.conversationId,
                fileData: data.fileData,
                userId: socket.userId,
                userData: this.socketUsers.get(socket.id),
                timestamp: new Date(),
            });
        });
    }
    startTyping(socket, conversationId) {
        const userId = socket.userId;
        const userData = this.socketUsers.get(socket.id);
        const timeoutKey = `${socket.id}:${conversationId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey));
        }
        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Map());
        }
        this.typingUsers.get(conversationId).set(userId, {
            userId,
            userData,
            timestamp: new Date(),
        });
        socket.to(`conversation:${conversationId}`).emit('typing:user_started', {
            conversationId,
            userId,
            userData,
            timestamp: new Date(),
        });
        const timeout = setTimeout(() => {
            this.stopTyping(socket, conversationId);
        }, 3000);
        this.typingTimeouts.set(timeoutKey, timeout);
        logger_1.default.debug(`User ${userId} started typing in conversation ${conversationId}`);
    }
    stopTyping(socket, conversationId) {
        const userId = socket.userId;
        const timeoutKey = `${socket.id}:${conversationId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey));
            this.typingTimeouts.delete(timeoutKey);
        }
        if (this.typingUsers.has(conversationId)) {
            this.typingUsers.get(conversationId).delete(userId);
            if (this.typingUsers.get(conversationId).size === 0) {
                this.typingUsers.delete(conversationId);
            }
        }
        socket.to(`conversation:${conversationId}`).emit('typing:user_stopped', {
            conversationId,
            userId,
            timestamp: new Date(),
        });
        logger_1.default.debug(`User ${userId} stopped typing in conversation ${conversationId}`);
    }
    cleanupTypingForSocket(socket) {
        const userId = socket.userId;
        Array.from(this.typingTimeouts.keys())
            .filter(key => key.startsWith(socket.id))
            .forEach(key => {
            clearTimeout(this.typingTimeouts.get(key));
            this.typingTimeouts.delete(key);
        });
        this.typingUsers.forEach((users, conversationId) => {
            if (users.has(userId)) {
                users.delete(userId);
                socket.to(`conversation:${conversationId}`).emit('typing:user_stopped', {
                    conversationId,
                    userId,
                    timestamp: new Date(),
                });
            }
        });
    }
    async sendInitialData(socket) {
        try {
            const conversations = await Conversation_1.default.find({
                workplaceId: socket.workplaceId,
                'participants.userId': socket.userId,
                'participants.leftAt': { $exists: false },
                status: { $ne: 'closed' },
            })
                .populate('participants.userId', 'firstName lastName role')
                .populate('patientId', 'firstName lastName mrn')
                .populate('lastMessageId', 'content.text senderId createdAt')
                .sort({ lastMessageAt: -1 });
            socket.emit('conversations:initial_load', {
                conversations: conversations.map(conv => ({
                    ...conv.toObject(),
                    unreadCount: conv.unreadCount.get(socket.userId) || 0,
                })),
                timestamp: new Date(),
            });
            logger_1.default.debug(`Sent initial data to user ${socket.userId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending initial data:', error);
        }
    }
    async handleMentionNotifications(mentions, message, conversation) {
        try {
            logger_1.default.info(`Mentions handled for message ${message._id}: ${mentions.join(', ')}`);
        }
        catch (error) {
            logger_1.default.error('Error handling mention notifications:', error);
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
    getDefaultPermissions(role) {
        switch (role) {
            case 'patient':
                return ['read_messages', 'send_messages', 'upload_files'];
            case 'pharmacist':
            case 'doctor':
                return [
                    'read_messages', 'send_messages', 'upload_files',
                    'view_patient_data', 'manage_clinical_context'
                ];
            default:
                return ['read_messages', 'send_messages'];
        }
    }
    sendErrorToSocket(socket, errorCode, message) {
        socket.emit('error', {
            code: errorCode,
            message,
            timestamp: new Date(),
        });
    }
    sendMessageNotification(conversationId, message, excludeUserId) {
        const notificationData = {
            messageId: message._id,
            conversationId,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
        };
        if (excludeUserId) {
            this.io.to(`conversation:${conversationId}`)
                .except(`user:${excludeUserId}`)
                .emit('message:received', notificationData);
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
        return Array.from(this.socketUsers.values())
            .filter(user => user.workplaceId === workplaceId);
    }
    sendConversationAnnouncement(conversationId, announcement) {
        this.io.to(`conversation:${conversationId}`).emit('system:announcement', {
            conversationId,
            ...announcement,
            timestamp: new Date(),
        });
    }
    sendConversationEmergencyAlert(conversationId, alert) {
        this.io.to(`conversation:${conversationId}`).emit('system:emergency_alert', {
            conversationId,
            ...alert,
            timestamp: new Date(),
        });
    }
}
exports.CommunicationSocketService = CommunicationSocketService;
exports.default = CommunicationSocketService;
//# sourceMappingURL=communicationSocketService.js.map