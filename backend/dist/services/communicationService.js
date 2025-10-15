"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationService = exports.CommunicationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const logger_1 = __importDefault(require("../utils/logger"));
const notificationService_1 = require("./notificationService");
class CommunicationService {
    async createConversation(data) {
        try {
            const participantIds = data.participants.map((p) => typeof p === 'string' ? p : p.userId);
            if (!participantIds.includes(data.createdBy)) {
                logger_1.default.warn('Creator not in participants, adding them', {
                    createdBy: data.createdBy,
                    type: data.type,
                    participants: participantIds,
                    service: 'communication-service'
                });
                participantIds.push(data.createdBy);
            }
            const participants = await User_1.default.find({
                _id: { $in: participantIds },
                workplaceId: data.workplaceId,
            }).select("_id role firstName lastName");
            if (participants.length !== participantIds.length) {
                throw new Error("Some participants not found or not in the same workplace");
            }
            if (data.patientId) {
                const patient = await Patient_1.default.findOne({
                    _id: data.patientId,
                    workplaceId: data.workplaceId,
                });
                if (!patient) {
                    throw new Error("Patient not found or not in the same workplace");
                }
            }
            const conversation = new Conversation_1.default({
                title: data.title,
                type: data.type,
                participants: participants.map((p) => ({
                    userId: p._id,
                    role: p.role,
                    joinedAt: new Date(),
                    permissions: this.getDefaultPermissions(p.role),
                })),
                patientId: data.patientId,
                caseId: data.caseId,
                priority: data.priority || "normal",
                tags: data.tags || [],
                createdBy: data.createdBy,
                workplaceId: data.workplaceId,
                metadata: {
                    isEncrypted: true,
                    priority: data.priority || "normal",
                    tags: data.tags || [],
                },
            });
            await conversation.save();
            await this.createSystemMessage(conversation._id.toString(), data.createdBy, "conversation_created", `Conversation "${conversation.title}" was created`, data.workplaceId);
            const otherParticipants = participants.filter((p) => p._id.toString() !== data.createdBy);
            for (const participant of otherParticipants) {
                await notificationService_1.notificationService.createNotification({
                    userId: participant._id.toString(),
                    type: "conversation_invite",
                    title: "New Conversation",
                    content: `You've been added to a new conversation: ${conversation.title}`,
                    data: {
                        conversationId: conversation._id,
                        senderId: data.createdBy,
                    },
                    priority: "normal",
                    deliveryChannels: {
                        inApp: true,
                        email: false,
                        sms: false,
                    },
                    workplaceId: data.workplaceId,
                    createdBy: data.createdBy,
                });
            }
            logger_1.default.info(`Conversation ${conversation._id} created by user ${data.createdBy}`);
            return conversation;
        }
        catch (error) {
            logger_1.default.error("Error creating conversation:", error);
            throw error;
        }
    }
    async addParticipant(conversationId, userId, role, addedBy, workplaceId) {
        try {
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
            });
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            const adderRole = conversation.getParticipantRole(addedBy);
            if (!adderRole || !["pharmacist", "doctor"].includes(adderRole)) {
                throw new Error("Insufficient permissions to add participants");
            }
            const user = await User_1.default.findOne({
                _id: userId,
                workplaceId,
            }).select("_id role firstName lastName");
            if (!user) {
                throw new Error("User not found or not in the same workplace");
            }
            conversation.addParticipant(user._id, role);
            await conversation.save();
            await this.createSystemMessage(conversationId, addedBy, "participant_added", `${user.firstName} ${user.lastName} was added to the conversation`, workplaceId);
            await notificationService_1.notificationService.createNotification({
                userId: userId,
                type: "conversation_invite",
                title: "Participant Added",
                content: `You've been added to a conversation${conversation ? ": " + conversation.title : ""}`,
                data: {
                    conversationId: new mongoose_1.default.Types.ObjectId(conversationId),
                    senderId: addedBy,
                },
                priority: "normal",
                deliveryChannels: {
                    inApp: true,
                    email: false,
                    sms: false,
                },
                workplaceId: workplaceId,
                createdBy: addedBy,
            });
            logger_1.default.info(`User ${userId} added to conversation ${conversationId} by ${addedBy}`);
        }
        catch (error) {
            logger_1.default.error("Error adding participant:", error);
            throw error;
        }
    }
    async removeParticipant(conversationId, userId, removedBy, workplaceId) {
        try {
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
            });
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            const removerRole = conversation.getParticipantRole(removedBy);
            if (userId !== removedBy &&
                (!removerRole || !["pharmacist", "doctor"].includes(removerRole))) {
                throw new Error("Insufficient permissions to remove participants");
            }
            const user = await User_1.default.findById(userId).select("firstName lastName");
            if (!user) {
                throw new Error("User not found");
            }
            conversation.removeParticipant(userId);
            await conversation.save();
            const action = userId === removedBy ? "participant_left" : "participant_removed";
            const message = userId === removedBy
                ? `${user.firstName} ${user.lastName} left the conversation`
                : `${user.firstName} ${user.lastName} was removed from the conversation`;
            await this.createSystemMessage(conversationId, removedBy, action, message, workplaceId);
            logger_1.default.info(`User ${userId} removed from conversation ${conversationId} by ${removedBy}`);
        }
        catch (error) {
            logger_1.default.error("Error removing participant:", error);
            throw error;
        }
    }
    async sendMessage(data) {
        try {
            const conversation = await Conversation_1.default.findOne({
                _id: data.conversationId,
                workplaceId: data.workplaceId,
            });
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            if (!conversation.hasParticipant(data.senderId)) {
                throw new Error("User is not a participant in this conversation");
            }
            if (data.parentMessageId) {
                const parentMessage = await Message_1.default.findOne({
                    _id: data.parentMessageId,
                    conversationId: data.conversationId,
                });
                if (!parentMessage) {
                    throw new Error("Parent message not found");
                }
            }
            const message = new Message_1.default({
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                threadId: data.threadId,
                parentMessageId: data.parentMessageId,
                mentions: data.mentions || [],
                priority: data.priority || "normal",
                workplaceId: data.workplaceId,
                createdBy: data.senderId,
            });
            await message.save();
            conversation.updateLastMessage(message._id);
            conversation.incrementUnreadCount(data.senderId);
            await conversation.save();
            await message.populate("senderId", "firstName lastName role");
            if (data.mentions && data.mentions.length > 0) {
                await this.handleMentions(data.mentions, message, conversation);
            }
            if (data.priority === "urgent") {
                await this.handleUrgentMessageNotifications(message, conversation);
            }
            logger_1.default.debug(`Message sent by user ${data.senderId} in conversation ${data.conversationId}`);
            return message;
        }
        catch (error) {
            logger_1.default.error("Error sending message:", error);
            throw error;
        }
    }
    async getConversations(userId, workplaceId, filters = {}) {
        try {
            const query = {
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            };
            if (filters.status) {
                query.status = filters.status;
            }
            else {
                query.status = { $ne: "closed" };
            }
            if (filters.type) {
                query.type = filters.type;
            }
            if (filters.priority) {
                query.priority = filters.priority;
            }
            if (filters.patientId) {
                query.patientId = filters.patientId;
            }
            if (filters.tags && filters.tags.length > 0) {
                query.tags = { $in: filters.tags };
            }
            if (filters.search) {
                query.$text = { $search: filters.search };
            }
            const conversations = await Conversation_1.default.find(query)
                .populate("participants.userId", "firstName lastName role")
                .populate("patientId", "firstName lastName mrn")
                .populate("lastMessageId", "content.text senderId createdAt")
                .sort({ lastMessageAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0);
            return conversations;
        }
        catch (error) {
            logger_1.default.error("Error getting conversations:", error);
            throw error;
        }
    }
    async getMessages(conversationId, userId, workplaceId, filters = {}) {
        try {
            logger_1.default.info('Getting messages', {
                conversationId,
                userId,
                workplaceId,
                service: 'communication-service'
            });
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                logger_1.default.error('Conversation not found', {
                    conversationId,
                    userId,
                    workplaceId,
                    service: 'communication-service'
                });
                throw new Error("Conversation not found or access denied");
            }
            const query = { conversationId };
            if (filters.type) {
                query["content.type"] = filters.type;
            }
            if (filters.senderId) {
                query.senderId = filters.senderId;
            }
            if (filters.mentions) {
                query.mentions = filters.mentions;
            }
            if (filters.priority) {
                query.priority = filters.priority;
            }
            if (filters.before) {
                query.createdAt = { ...query.createdAt, $lt: filters.before };
            }
            if (filters.after) {
                query.createdAt = { ...query.createdAt, $gt: filters.after };
            }
            const messages = await Message_1.default.find(query)
                .populate("senderId", "firstName lastName role")
                .populate("mentions", "firstName lastName role")
                .populate("readBy.userId", "firstName lastName")
                .sort({ createdAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0);
            return messages;
        }
        catch (error) {
            logger_1.default.error("Error getting messages:", error);
            throw error;
        }
    }
    async markMessageAsRead(messageId, userId, workplaceId) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            message.markAsRead(userId);
            await message.save();
            conversation.markAsRead(userId);
            await conversation.save();
            logger_1.default.debug(`Message ${messageId} marked as read by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error marking message as read:", error);
            throw error;
        }
    }
    async searchMessages(workplaceId, query, userId, filters = {}) {
        try {
            const searchQuery = {
                workplaceId,
                $text: { $search: query },
            };
            const userConversations = await Conversation_1.default.find({
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            }).select("_id");
            searchQuery.conversationId = { $in: userConversations.map((c) => c._id) };
            if (filters.conversationId) {
                searchQuery.conversationId = filters.conversationId;
            }
            if (filters.senderId) {
                searchQuery.senderId = filters.senderId;
            }
            if (filters.type) {
                searchQuery["content.type"] = filters.type;
            }
            if (filters.priority) {
                searchQuery.priority = filters.priority;
            }
            if (filters.dateFrom || filters.dateTo) {
                searchQuery.createdAt = {};
                if (filters.dateFrom) {
                    searchQuery.createdAt.$gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    searchQuery.createdAt.$lte = filters.dateTo;
                }
            }
            const messages = await Message_1.default.find(searchQuery, {
                score: { $meta: "textScore" },
            })
                .populate("senderId", "firstName lastName role")
                .populate("conversationId", "title type")
                .sort({ score: { $meta: "textScore" }, createdAt: -1 })
                .limit(filters.limit || 50);
            return messages;
        }
        catch (error) {
            logger_1.default.error("Error searching messages:", error);
            throw error;
        }
    }
    async createThread(messageId, userId, workplaceId) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            if (message.threadId) {
                return message.threadId.toString();
            }
            message.threadId = message._id;
            await message.save();
            logger_1.default.info(`Thread created from message ${messageId} by user ${userId}`);
            return message._id.toString();
        }
        catch (error) {
            logger_1.default.error("Error creating thread:", error);
            throw error;
        }
    }
    async getThreadMessages(threadId, userId, workplaceId, filters = {}) {
        try {
            const rootMessage = await Message_1.default.findOne({
                _id: threadId,
                workplaceId,
            }).populate("senderId", "firstName lastName role");
            if (!rootMessage) {
                throw new Error("Thread not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: rootMessage.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            const query = {
                threadId,
                _id: { $ne: threadId },
                workplaceId,
            };
            if (filters.senderId) {
                query.senderId = filters.senderId;
            }
            if (filters.before) {
                query.createdAt = { ...query.createdAt, $lt: filters.before };
            }
            if (filters.after) {
                query.createdAt = { ...query.createdAt, $gt: filters.after };
            }
            const replies = await Message_1.default.find(query)
                .populate("senderId", "firstName lastName role")
                .populate("mentions", "firstName lastName role")
                .populate("readBy.userId", "firstName lastName")
                .sort({ createdAt: 1 })
                .limit(filters.limit || 100);
            return { rootMessage, replies };
        }
        catch (error) {
            logger_1.default.error("Error getting thread messages:", error);
            throw error;
        }
    }
    async getThreadSummary(threadId, userId, workplaceId) {
        try {
            const rootMessage = await Message_1.default.findOne({
                _id: threadId,
                workplaceId,
            }).populate("senderId", "firstName lastName role");
            if (!rootMessage) {
                throw new Error("Thread not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: rootMessage.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            const threadStats = await Message_1.default.aggregate([
                {
                    $match: {
                        threadId: new mongoose_1.default.Types.ObjectId(threadId),
                        _id: { $ne: new mongoose_1.default.Types.ObjectId(threadId) },
                        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        replyCount: { $sum: 1 },
                        participants: { $addToSet: "$senderId" },
                        lastReplyAt: { $max: "$createdAt" },
                        unreadMessages: {
                            $push: {
                                $cond: [
                                    {
                                        $not: {
                                            $in: [
                                                new mongoose_1.default.Types.ObjectId(userId),
                                                "$readBy.userId",
                                            ],
                                        },
                                    },
                                    "$_id",
                                    null,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        replyCount: 1,
                        participants: 1,
                        lastReplyAt: 1,
                        unreadCount: {
                            $size: {
                                $filter: {
                                    input: "$unreadMessages",
                                    cond: { $ne: ["$$this", null] },
                                },
                            },
                        },
                    },
                },
            ]);
            const stats = threadStats[0] || {
                replyCount: 0,
                participants: [],
                lastReplyAt: null,
                unreadCount: 0,
            };
            return {
                threadId,
                rootMessage,
                replyCount: stats.replyCount,
                participants: stats.participants.map((p) => p.toString()),
                lastReplyAt: stats.lastReplyAt,
                unreadCount: stats.unreadCount,
            };
        }
        catch (error) {
            logger_1.default.error("Error getting thread summary:", error);
            throw error;
        }
    }
    async replyToThread(threadId, data) {
        try {
            const rootMessage = await Message_1.default.findOne({
                _id: threadId,
                workplaceId: data.workplaceId,
            });
            if (!rootMessage) {
                throw new Error("Thread not found");
            }
            const replyData = {
                ...data,
                threadId,
                parentMessageId: threadId,
            };
            return await this.sendMessage(replyData);
        }
        catch (error) {
            logger_1.default.error("Error replying to thread:", error);
            throw error;
        }
    }
    async getConversationThreads(conversationId, userId, workplaceId) {
        try {
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Conversation not found or access denied");
            }
            const rootMessages = await Message_1.default.find({
                conversationId,
                threadId: { $exists: true },
                workplaceId,
            }).populate("senderId", "firstName lastName role");
            const threadSummaries = await Promise.all(rootMessages.map(async (rootMessage) => {
                if (rootMessage.threadId?.toString() === rootMessage._id.toString()) {
                    const summary = await this.getThreadSummary(rootMessage._id.toString(), userId, workplaceId);
                    return {
                        threadId: summary.threadId,
                        rootMessage: summary.rootMessage,
                        replyCount: summary.replyCount,
                        lastReplyAt: summary.lastReplyAt,
                        unreadCount: summary.unreadCount,
                    };
                }
                return null;
            }));
            return threadSummaries.filter(Boolean);
        }
        catch (error) {
            logger_1.default.error("Error getting conversation threads:", error);
            throw error;
        }
    }
    async createSystemMessage(conversationId, performedBy, action, text, workplaceId) {
        const message = new Message_1.default({
            conversationId,
            senderId: performedBy,
            content: {
                text,
                type: "system",
                metadata: {
                    systemAction: {
                        action,
                        performedBy,
                        timestamp: new Date(),
                    },
                },
            },
            workplaceId,
            createdBy: performedBy,
        });
        await message.save();
        return message;
    }
    async handleMentions(mentions, message, conversation) {
        try {
            const sender = await User_1.default.findById(message.senderId).select("firstName lastName");
            if (!sender)
                return;
            const senderName = `${sender.firstName} ${sender.lastName}`;
            const messagePreview = message.content.text?.substring(0, 100) || "New message";
            for (const mentionedUserId of mentions) {
                if (mentionedUserId === message.senderId.toString())
                    continue;
                const isParticipant = conversation.hasParticipant(mentionedUserId);
                if (isParticipant) {
                    await notificationService_1.notificationService.createNotification({
                        userId: mentionedUserId,
                        type: "mention",
                        title: `${senderName} mentioned you`,
                        content: messagePreview.length > 100
                            ? messagePreview.substring(0, 100) + "..."
                            : messagePreview,
                        data: {
                            conversationId: conversation._id,
                            messageId: message._id,
                            senderId: message.senderId,
                            actionUrl: `/conversations/${conversation._id}?message=${message._id}`,
                        },
                        priority: message.priority === "urgent" ? "urgent" : "normal",
                        deliveryChannels: {
                            inApp: true,
                            email: message.priority === "urgent",
                            sms: false,
                        },
                        workplaceId: conversation.workplaceId,
                        createdBy: message.senderId,
                    });
                    logger_1.default.debug(`Mention notification sent to user ${mentionedUserId} for message ${message._id}`);
                }
                else {
                    logger_1.default.warn(`User ${mentionedUserId} mentioned but not a participant in conversation ${conversation._id}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error("Error handling mentions:", error);
        }
    }
    async handleUrgentMessageNotifications(message, conversation) {
        try {
            const sender = await User_1.default.findById(message.senderId).select("firstName lastName");
            const senderName = sender
                ? `${sender.firstName} ${sender.lastName}`
                : "Someone";
            const messageContent = message.content.text || "New message";
            const participants = conversation.participants.filter((p) => !p.leftAt && p.userId.toString() !== message.senderId.toString());
            for (const participant of participants) {
                await notificationService_1.notificationService.createNotification({
                    userId: participant.userId,
                    type: "urgent_message",
                    title: "Urgent Message",
                    content: `${senderName} sent an urgent message: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? "..." : ""}`,
                    data: {
                        conversationId: conversation._id,
                        messageId: message._id,
                        senderId: message.senderId,
                    },
                    priority: "urgent",
                    deliveryChannels: {
                        inApp: true,
                        email: true,
                        sms: false,
                    },
                    workplaceId: conversation.workplaceId,
                    createdBy: message.senderId,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error handling urgent message notifications:", error);
        }
    }
    async deleteMessage(messageId, userId, workplaceId, reason) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found");
            }
            if (message.senderId.toString() !== userId) {
                const user = await User_1.default.findById(userId);
                if (!user || !["pharmacist", "doctor"].includes(user.role)) {
                    throw new Error("Insufficient permissions to delete message");
                }
            }
            message.isDeleted = true;
            message.deletedAt = new Date();
            message.deletedBy = userId;
            await message.save();
            logger_1.default.info(`Message ${messageId} deleted by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error deleting message:", error);
            throw error;
        }
    }
    async addMessageReaction(messageId, userId, emoji, workplaceId) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            message.addReaction(userId, emoji);
            await message.save();
            logger_1.default.debug(`Reaction ${emoji} added to message ${messageId} by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding reaction:", error);
            throw error;
        }
    }
    async removeMessageReaction(messageId, userId, emoji, workplaceId) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found");
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                throw new Error("Access denied");
            }
            message.removeReaction(userId, emoji);
            await message.save();
            logger_1.default.debug(`Reaction ${emoji} removed from message ${messageId} by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error removing reaction:", error);
            throw error;
        }
    }
    async editMessage(messageId, userId, newContent, reason, workplaceId) {
        try {
            const message = await Message_1.default.findOne({
                _id: messageId,
                senderId: userId,
                workplaceId,
            });
            if (!message) {
                throw new Error("Message not found or not authorized to edit");
            }
            const messageAge = Date.now() - new Date(message.createdAt).getTime();
            const maxEditAge = 24 * 60 * 60 * 1000;
            if (messageAge > maxEditAge) {
                throw new Error("Message is too old to edit");
            }
            const originalContent = message.content.text;
            message.addEdit(newContent, userId, reason);
            await message.save();
            logger_1.default.info(`Message ${messageId} edited by user ${userId}`);
        }
        catch (error) {
            logger_1.default.error("Error editing message:", error);
            throw error;
        }
    }
    async getMessageStatuses(messageIds, userId, workplaceId) {
        try {
            const messages = await Message_1.default.find({
                _id: { $in: messageIds },
                workplaceId,
            }).select("_id status readBy reactions");
            const statuses = {};
            messages.forEach((message) => {
                statuses[message._id.toString()] = {
                    status: message.status,
                    readBy: message.readBy,
                    reactions: message.reactions,
                };
            });
            return statuses;
        }
        catch (error) {
            logger_1.default.error("Error getting message statuses:", error);
            throw error;
        }
    }
    getDefaultPermissions(role) {
        switch (role) {
            case "patient":
                return ["read_messages", "send_messages", "upload_files"];
            case "pharmacist":
            case "doctor":
                return [
                    "read_messages",
                    "send_messages",
                    "upload_files",
                    "view_patient_data",
                    "manage_clinical_context",
                ];
            default:
                return ["read_messages", "send_messages"];
        }
    }
}
exports.CommunicationService = CommunicationService;
exports.communicationService = new CommunicationService();
exports.default = exports.communicationService;
//# sourceMappingURL=communicationService.js.map