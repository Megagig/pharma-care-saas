"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationController = exports.CommunicationController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const communicationService_1 = require("../services/communicationService");
const messageSearchService_1 = require("../services/messageSearchService");
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const SearchHistory_1 = require("../models/SearchHistory");
const logger_1 = __importDefault(require("../utils/logger"));
const fileUploadService_1 = __importDefault(require("../services/fileUploadService"));
class CommunicationController {
    async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                status: req.query.status,
                type: req.query.type,
                priority: req.query.priority,
                patientId: req.query.patientId,
                search: req.query.search,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                tags: req.query.tags
                    ? Array.isArray(req.query.tags)
                        ? req.query.tags.map((tag) => tag.toString())
                        : [req.query.tags.toString()]
                    : undefined,
            };
            const conversations = await communicationService_1.communicationService.getConversations(userId, workplaceId, filters);
            const conversationsWithUnread = conversations.map((conv) => ({
                ...conv.toObject(),
                unreadCount: conv.unreadCount.get(userId) || 0,
            }));
            res.json({
                success: true,
                data: conversationsWithUnread,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: conversationsWithUnread.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting conversations:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversations",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createConversation(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const conversationData = {
                ...req.body,
                createdBy: userId,
                workplaceId,
            };
            const conversation = await communicationService_1.communicationService.createConversation(conversationData);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket) {
                conversation.participants.forEach((participant) => {
                    if (participant.userId.toString() !== userId) {
                        communicationSocket.io
                            .to(`user:${participant.userId}`)
                            .emit("conversation:created", {
                            conversation: conversation.toObject(),
                            timestamp: new Date(),
                        });
                    }
                });
            }
            res.status(201).json({
                success: true,
                data: conversation,
                message: "Conversation created successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error creating conversation:", error);
            res.status(400).json({
                success: false,
                message: "Failed to create conversation",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getConversation(req, res) {
        try {
            const conversationId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            })
                .populate("participants.userId", "firstName lastName role")
                .populate("patientId", "firstName lastName mrn")
                .populate("lastMessageId", "content.text senderId createdAt");
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: "Conversation not found or access denied",
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    ...conversation.toObject(),
                    unreadCount: conversation.unreadCount.get(userId) || 0,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting conversation:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async updateConversation(req, res) {
        try {
            const conversationId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: "Conversation not found or access denied",
                });
                return;
            }
            const userRole = conversation.getParticipantRole(userId);
            if (!userRole || !["pharmacist", "doctor"].includes(userRole)) {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions to update conversation",
                });
                return;
            }
            if (req.body.title)
                conversation.title = req.body.title;
            if (req.body.priority)
                conversation.priority = req.body.priority;
            if (req.body.tags)
                conversation.tags = req.body.tags;
            if (req.body.status)
                conversation.status = req.body.status;
            conversation.updatedBy = userId;
            await conversation.save();
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    updates: req.body,
                    updatedBy: userId,
                });
            }
            res.json({
                success: true,
                data: conversation,
                message: "Conversation updated successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error updating conversation:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update conversation",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async addParticipant(req, res) {
        try {
            const conversationId = req.params.id;
            const { userId: newUserId, role } = req.body;
            const addedBy = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!conversationId || typeof conversationId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid conversation ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.addParticipant(conversationId, newUserId, role, addedBy, workplaceId);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    action: "participant_added",
                    userId: newUserId,
                    addedBy,
                });
            }
            res.json({
                success: true,
                message: "Participant added successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error adding participant:", error);
            res.status(400).json({
                success: false,
                message: "Failed to add participant",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async removeParticipant(req, res) {
        try {
            const conversationId = req.params.id;
            const userIdToRemove = req.params.userId;
            if (!userIdToRemove || typeof userIdToRemove !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid user ID is required",
                });
                return;
            }
            const removedBy = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!conversationId || typeof conversationId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid conversation ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.removeParticipant(conversationId, userIdToRemove, removedBy, workplaceId);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    action: "participant_removed",
                    userId: userIdToRemove,
                    removedBy,
                });
            }
            res.json({
                success: true,
                message: "Participant removed successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error removing participant:", error);
            res.status(400).json({
                success: false,
                message: "Failed to remove participant",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getMessages(req, res) {
        try {
            const conversationId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                type: req.query.type,
                senderId: req.query.senderId,
                mentions: req.query.mentions,
                priority: req.query.priority,
                before: req.query.before
                    ? new Date(req.query.before)
                    : undefined,
                after: req.query.after
                    ? new Date(req.query.after)
                    : undefined,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
            };
            if (!conversationId || typeof conversationId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid conversation ID is required",
                });
                return;
            }
            const messages = await communicationService_1.communicationService.getMessages(conversationId, userId, workplaceId, filters);
            res.json({
                success: true,
                data: messages,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: messages.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting messages:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get messages",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async sendMessage(req, res) {
        try {
            const conversationId = req.params.id;
            const senderId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const messageData = {
                conversationId,
                senderId,
                workplaceId,
                ...req.body,
            };
            if (!conversationId || typeof conversationId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid conversation ID is required",
                });
                return;
            }
            const message = await communicationService_1.communicationService.sendMessage(messageData);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket) {
                communicationSocket.sendMessageNotification(conversationId, message, senderId);
            }
            res.status(201).json({
                success: true,
                data: message,
                message: "Message sent successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error sending message:", error);
            res.status(400).json({
                success: false,
                message: "Failed to send message",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async markMessageAsRead(req, res) {
        try {
            const messageId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!messageId || typeof messageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.markMessageAsRead(messageId, userId, workplaceId);
            res.json({
                success: true,
                message: "Message marked as read",
            });
        }
        catch (error) {
            logger_1.default.error("Error marking message as read:", error);
            res.status(400).json({
                success: false,
                message: "Failed to mark message as read",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async addReaction(req, res) {
        try {
            const messageId = req.params.id;
            const { emoji } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!messageId || typeof messageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.addMessageReaction(messageId, userId, emoji, workplaceId);
            const message = await Message_1.default.findById(messageId);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket && message) {
                communicationSocket.io
                    .to(`conversation:${message.conversationId}`)
                    .emit("message:reaction_added", {
                    messageId,
                    emoji,
                    userId,
                    timestamp: new Date(),
                    reactions: message.reactions,
                });
            }
            res.json({
                success: true,
                message: "Reaction added successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error adding reaction:", error);
            res.status(400).json({
                success: false,
                message: "Failed to add reaction",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async removeReaction(req, res) {
        try {
            const messageId = req.params.id;
            const emoji = req.params.emoji;
            if (!emoji || typeof emoji !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid emoji is required",
                });
                return;
            }
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!messageId || typeof messageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.removeMessageReaction(messageId, userId, emoji, workplaceId);
            const message = await Message_1.default.findById(messageId);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket && message) {
                communicationSocket.io
                    .to(`conversation:${message.conversationId}`)
                    .emit("message:reaction_removed", {
                    messageId,
                    emoji,
                    userId,
                    timestamp: new Date(),
                    reactions: message.reactions,
                });
            }
            res.json({
                success: true,
                message: "Reaction removed successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error removing reaction:", error);
            res.status(400).json({
                success: false,
                message: "Failed to remove reaction",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async editMessage(req, res) {
        try {
            const messageId = req.params.id;
            const { content, reason } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const message = await Message_1.default.findOne({
                _id: messageId,
                senderId: userId,
                workplaceId,
            });
            if (!message) {
                res.status(404).json({
                    success: false,
                    message: "Message not found or not authorized to edit",
                });
                return;
            }
            if (!messageId || typeof messageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.editMessage(messageId, userId, content, reason || "Message edited", workplaceId);
            const updatedMessage = await Message_1.default.findById(messageId)
                .populate("senderId", "firstName lastName role")
                .populate("editHistory.editedBy", "firstName lastName");
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket && updatedMessage) {
                communicationSocket.io
                    .to(`conversation:${updatedMessage.conversationId}`)
                    .emit("message:edited", {
                    messageId,
                    content,
                    editedBy: userId,
                    timestamp: new Date(),
                    editHistory: updatedMessage.editHistory,
                });
            }
            res.json({
                success: true,
                data: updatedMessage,
                message: "Message edited successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error editing message:", error);
            res.status(400).json({
                success: false,
                message: "Failed to edit message",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async deleteMessage(req, res) {
        try {
            const messageId = req.params.id;
            const { reason } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!messageId || typeof messageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            await communicationService_1.communicationService.deleteMessage(messageId, userId, workplaceId, reason);
            const message = await Message_1.default.findById(messageId);
            const app = req.app;
            const communicationSocket = app.get("communicationSocket");
            if (communicationSocket && message) {
                communicationSocket.io
                    .to(`conversation:${message.conversationId}`)
                    .emit("message:deleted", {
                    messageId,
                    deletedBy: userId,
                    timestamp: new Date(),
                    reason,
                });
            }
            res.json({
                success: true,
                message: "Message deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error deleting message:", error);
            res.status(400).json({
                success: false,
                message: "Failed to delete message",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getMessageStatuses(req, res) {
        try {
            const { messageIds } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Message IDs array is required",
                });
                return;
            }
            const statuses = await communicationService_1.communicationService.getMessageStatuses(messageIds, userId, workplaceId);
            res.json({
                success: true,
                data: statuses,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting message statuses:", error);
            res.status(400).json({
                success: false,
                message: "Failed to get message statuses",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async searchMessages(req, res) {
        const startTime = Date.now();
        try {
            const query = req.query.q;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                query,
                conversationId: req.query.conversationId,
                senderId: req.query.senderId,
                participantId: req.query.participantId,
                messageType: req.query.type,
                fileType: req.query.fileType,
                priority: req.query.priority,
                hasAttachments: req.query.hasAttachments === "true"
                    ? true
                    : req.query.hasAttachments === "false"
                        ? false
                        : undefined,
                hasMentions: req.query.hasMentions === "true"
                    ? true
                    : req.query.hasMentions === "false"
                        ? false
                        : undefined,
                dateFrom: req.query.dateFrom
                    ? new Date(req.query.dateFrom)
                    : undefined,
                dateTo: req.query.dateTo
                    ? new Date(req.query.dateTo)
                    : undefined,
                tags: req.query.tags
                    ? Array.isArray(req.query.tags)
                        ? req.query.tags.map((tag) => tag.toString())
                        : [req.query.tags.toString()]
                    : undefined,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                sortBy: req.query.sortBy || "relevance",
                sortOrder: req.query.sortOrder || "desc",
            };
            const { results, stats } = await messageSearchService_1.messageSearchService.searchMessages(workplaceId, userId, filters);
            if (query && query.trim()) {
                await messageSearchService_1.messageSearchService.saveSearchHistory(userId, query, filters, stats.totalResults);
                const searchHistory = new SearchHistory_1.SearchHistory({
                    userId,
                    workplaceId,
                    query: query.trim(),
                    filters: {
                        conversationId: filters.conversationId,
                        senderId: filters.senderId,
                        messageType: filters.messageType,
                        priority: filters.priority,
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo,
                        tags: filters.tags,
                    },
                    resultCount: stats.totalResults,
                    searchType: "message",
                    executionTime: Date.now() - startTime,
                });
                await searchHistory.save();
            }
            res.json({
                success: true,
                data: results,
                stats,
                query,
                filters: {
                    applied: Object.keys(filters).filter((key) => filters[key] !== undefined &&
                        filters[key] !== null &&
                        filters[key] !== ""),
                    available: [
                        "conversationId",
                        "senderId",
                        "participantId",
                        "messageType",
                        "fileType",
                        "priority",
                        "hasAttachments",
                        "hasMentions",
                        "dateFrom",
                        "dateTo",
                        "tags",
                    ],
                },
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: stats.totalResults,
                    hasMore: stats.totalResults > filters.offset + filters.limit,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in enhanced message search:", error);
            res.status(500).json({
                success: false,
                message: "Failed to search messages",
                error: error instanceof Error ? error.message : "Unknown error",
                executionTime: Date.now() - startTime,
            });
        }
    }
    async searchConversations(req, res) {
        const startTime = Date.now();
        try {
            const query = req.query.q;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                query,
                priority: req.query.priority,
                tags: req.query.tags
                    ? Array.isArray(req.query.tags)
                        ? req.query.tags.map((tag) => tag.toString())
                        : [req.query.tags.toString()]
                    : undefined,
                dateFrom: req.query.dateFrom
                    ? new Date(req.query.dateFrom)
                    : undefined,
                dateTo: req.query.dateTo
                    ? new Date(req.query.dateTo)
                    : undefined,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                sortBy: req.query.sortBy || "relevance",
                sortOrder: req.query.sortOrder || "desc",
            };
            const { results, stats } = await messageSearchService_1.messageSearchService.searchConversations(workplaceId, userId, filters);
            if (query && query.trim()) {
                const searchHistory = new SearchHistory_1.SearchHistory({
                    userId,
                    workplaceId,
                    query: query.trim(),
                    filters: {
                        priority: filters.priority,
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo,
                        tags: filters.tags,
                    },
                    resultCount: stats.totalResults || 0,
                    searchType: "conversation",
                    executionTime: Date.now() - startTime,
                });
                await searchHistory.save();
            }
            res.json({
                success: true,
                data: results,
                stats,
                query,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: stats.totalResults || 0,
                    hasMore: (stats.totalResults || 0) > filters.offset + filters.limit,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in enhanced conversation search:", error);
            res.status(500).json({
                success: false,
                message: "Failed to search conversations",
                error: error instanceof Error ? error.message : "Unknown error",
                executionTime: Date.now() - startTime,
            });
        }
    }
    async getPatientConversations(req, res) {
        try {
            const patientId = req.params.patientId;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const patient = await Patient_1.default.findOne({
                _id: patientId,
                workplaceId,
            });
            if (!patient) {
                res.status(404).json({
                    success: false,
                    message: "Patient not found",
                });
                return;
            }
            const filters = {
                patientId,
                status: req.query.status,
                type: req.query.type,
                limit: parseInt(req.query.limit) || 50,
            };
            const conversations = await communicationService_1.communicationService.getConversations(userId, workplaceId, filters);
            res.json({
                success: true,
                data: conversations,
                patient: {
                    id: patient._id,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    mrn: patient.mrn,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting patient conversations:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get patient conversations",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createPatientQuery(req, res) {
        try {
            const patientId = req.params.patientId;
            const { title, message, priority, tags } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const patient = await Patient_1.default.findOne({
                _id: patientId,
                workplaceId,
            });
            if (!patient) {
                res.status(404).json({
                    success: false,
                    message: "Patient not found",
                });
                return;
            }
            const healthcareProviders = await User_1.default.find({
                workplaceId,
                role: { $in: ["pharmacist", "doctor"] },
                isActive: true,
            }).limit(5);
            const participants = [
                userId,
                ...healthcareProviders.map((p) => p._id.toString()),
            ];
            const conversationData = {
                title: title || `Query for ${patient.firstName} ${patient.lastName}`,
                type: "patient_query",
                participants,
                patientId,
                priority: priority || "normal",
                tags: tags || ["patient-query"],
                createdBy: userId,
                workplaceId,
            };
            const conversation = await communicationService_1.communicationService.createConversation(conversationData);
            const messageData = {
                conversationId: conversation._id.toString(),
                senderId: userId,
                workplaceId,
                content: {
                    text: message,
                    type: "text",
                },
                priority: priority || "normal",
            };
            const initialMessage = await communicationService_1.communicationService.sendMessage(messageData);
            res.status(201).json({
                success: true,
                data: {
                    conversation,
                    initialMessage,
                },
                message: "Patient query created successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error creating patient query:", error);
            res.status(400).json({
                success: false,
                message: "Failed to create patient query",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getAnalyticsSummary(req, res) {
        try {
            const workplaceId = req.user.workplaceId;
            const dateFrom = req.query.dateFrom
                ? new Date(req.query.dateFrom)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const dateTo = req.query.dateTo
                ? new Date(req.query.dateTo)
                : new Date();
            const patientId = req.query.patientId;
            const matchQuery = {
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                createdAt: { $gte: dateFrom, $lte: dateTo },
            };
            if (patientId) {
                matchQuery.patientId = new mongoose_1.default.Types.ObjectId(patientId);
            }
            const conversationStats = await Conversation_1.default.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalConversations: { $sum: 1 },
                        activeConversations: {
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                        },
                        resolvedConversations: {
                            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
                        },
                        urgentConversations: {
                            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
                        },
                    },
                },
            ]);
            const messageStats = await Message_1.default.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        textMessages: {
                            $sum: { $cond: [{ $eq: ["$content.type", "text"] }, 1, 0] },
                        },
                        fileMessages: {
                            $sum: { $cond: [{ $eq: ["$content.type", "file"] }, 1, 0] },
                        },
                        urgentMessages: {
                            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
                        },
                    },
                },
            ]);
            const responseTimeStats = await Message_1.default.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: "messages",
                        let: {
                            conversationId: "$conversationId",
                            messageTime: "$createdAt",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$conversationId", "$$conversationId"] },
                                            { $lt: ["$createdAt", "$$messageTime"] },
                                        ],
                                    },
                                },
                            },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 },
                        ],
                        as: "previousMessage",
                    },
                },
                {
                    $match: {
                        previousMessage: { $ne: [] },
                    },
                },
                {
                    $addFields: {
                        responseTime: {
                            $subtract: [
                                "$createdAt",
                                { $arrayElemAt: ["$previousMessage.createdAt", 0] },
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: "$responseTime" },
                        minResponseTime: { $min: "$responseTime" },
                        maxResponseTime: { $max: "$responseTime" },
                    },
                },
            ]);
            const summary = {
                dateRange: { from: dateFrom, to: dateTo },
                conversations: conversationStats[0] || {
                    totalConversations: 0,
                    activeConversations: 0,
                    resolvedConversations: 0,
                    urgentConversations: 0,
                },
                messages: messageStats[0] || {
                    totalMessages: 0,
                    textMessages: 0,
                    fileMessages: 0,
                    urgentMessages: 0,
                },
                responseTime: responseTimeStats[0]
                    ? {
                        average: Math.round(responseTimeStats[0].avgResponseTime / (1000 * 60)),
                        min: Math.round(responseTimeStats[0].minResponseTime / (1000 * 60)),
                        max: Math.round(responseTimeStats[0].maxResponseTime / (1000 * 60)),
                    }
                    : null,
            };
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting analytics summary:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get analytics summary",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async uploadFiles(req, res) {
        try {
            const files = req.files;
            const { conversationId, messageType = "file" } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No files uploaded",
                });
                return;
            }
            if (conversationId) {
                const conversation = await Conversation_1.default.findOne({
                    _id: conversationId,
                    workplaceId,
                    "participants.userId": userId,
                    "participants.leftAt": { $exists: false },
                });
                if (!conversation) {
                    res.status(404).json({
                        success: false,
                        message: "Conversation not found or access denied",
                    });
                    return;
                }
            }
            const processedFiles = [];
            const errors = [];
            for (const file of files) {
                try {
                    const result = await fileUploadService_1.default.processUploadedFile(file);
                    if (result.success) {
                        processedFiles.push({
                            fileId: result.fileData.fileName,
                            fileName: result.fileData.originalName,
                            fileSize: result.fileData.size,
                            mimeType: result.fileData.mimeType,
                            secureUrl: result.fileData.url,
                            uploadedAt: result.fileData.uploadedAt,
                        });
                    }
                    else {
                        errors.push({
                            fileName: file.originalname,
                            error: result.error,
                        });
                    }
                }
                catch (error) {
                    errors.push({
                        fileName: file.originalname,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }
            if (conversationId && processedFiles.length > 0) {
                const messageData = {
                    conversationId,
                    senderId: userId,
                    workplaceId,
                    content: {
                        text: `Shared ${processedFiles.length} file(s)`,
                        type: messageType,
                        attachments: processedFiles,
                    },
                };
                const message = await communicationService_1.communicationService.sendMessage(messageData);
                const app = req.app;
                const communicationSocket = app.get("communicationSocket");
                if (communicationSocket) {
                    communicationSocket.sendMessageNotification(conversationId, message, userId);
                }
            }
            res.status(201).json({
                success: true,
                data: {
                    uploadedFiles: processedFiles,
                    errors: errors.length > 0 ? errors : undefined,
                },
                message: `Successfully uploaded ${processedFiles.length} file(s)`,
            });
        }
        catch (error) {
            logger_1.default.error("Error uploading files:", error);
            res.status(500).json({
                success: false,
                message: "Failed to upload files",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!fileId ||
                typeof fileId !== "string" ||
                !fileUploadService_1.default.fileExists(fileId)) {
                res.status(404).json({
                    success: false,
                    message: "File not found",
                });
                return;
            }
            const message = await Message_1.default.findOne({
                workplaceId,
                "content.attachments.fileId": fileId,
            }).populate("conversationId");
            if (!message) {
                res.status(404).json({
                    success: false,
                    message: "File not found in any accessible conversation",
                });
                return;
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                res.status(403).json({
                    success: false,
                    message: "Access denied to this file",
                });
                return;
            }
            const attachment = message.content.attachments?.find((att) => att.fileId === fileId);
            if (!attachment) {
                res.status(404).json({
                    success: false,
                    message: "File attachment not found",
                });
                return;
            }
            const fileStats = fileId ? fileUploadService_1.default.getFileStats(fileId) : null;
            res.json({
                success: true,
                data: {
                    fileId: attachment.fileId,
                    fileName: attachment.fileName,
                    fileSize: attachment.fileSize,
                    mimeType: attachment.mimeType,
                    secureUrl: attachment.secureUrl,
                    uploadedAt: attachment.uploadedAt,
                    conversationId: message.conversationId,
                    messageId: message._id,
                    stats: fileStats
                        ? {
                            size: fileStats.size,
                            created: fileStats.birthtime,
                            modified: fileStats.mtime,
                        }
                        : null,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting file:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get file",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const message = await Message_1.default.findOne({
                workplaceId,
                "content.attachments.fileId": fileId,
            });
            if (!message) {
                res.status(404).json({
                    success: false,
                    message: "File not found",
                });
                return;
            }
            const user = await User_1.default.findById(userId);
            if (message.senderId.toString() !== userId &&
                !["admin", "super_admin"].includes(user?.role || "")) {
                res.status(403).json({
                    success: false,
                    message: "Only the file uploader or admin can delete files",
                });
                return;
            }
            const filePath = fileId ? fileUploadService_1.default.getFilePath(fileId) : null;
            if (!filePath) {
                res.status(404).json({
                    success: false,
                    message: "File path not found",
                });
                return;
            }
            await fileUploadService_1.default.deleteFile(filePath);
            message.content.attachments =
                message.content.attachments?.filter((att) => att.fileId !== fileId) ||
                    [];
            await message.save();
            res.json({
                success: true,
                message: "File deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error deleting file:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete file",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getConversationFiles(req, res) {
        try {
            const conversationId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { type, limit = 50, offset = 0 } = req.query;
            const conversation = await Conversation_1.default.findOne({
                _id: conversationId,
                workplaceId,
                "participants.userId": userId,
                "participants.leftAt": { $exists: false },
            });
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: "Conversation not found or access denied",
                });
                return;
            }
            const query = {
                conversationId,
                "content.attachments": { $exists: true, $ne: [] },
            };
            if (type) {
                query["content.type"] = type;
            }
            const messages = await Message_1.default.find(query)
                .populate("senderId", "firstName lastName role")
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset));
            const files = [];
            for (const message of messages) {
                if (message.content.attachments) {
                    for (const attachment of message.content.attachments) {
                        files.push({
                            ...attachment,
                            messageId: message._id,
                            senderId: message.senderId,
                            sentAt: message.createdAt,
                        });
                    }
                }
            }
            res.json({
                success: true,
                data: files,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: files.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error getting conversation files:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation files",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getSearchSuggestions(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const query = req.query.q;
            const suggestions = await messageSearchService_1.messageSearchService.getSearchSuggestions(workplaceId, userId, query);
            res.json({
                success: true,
                data: suggestions,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting search suggestions:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get search suggestions",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getSearchHistory(req, res) {
        try {
            const userId = req.user.id;
            const searchType = req.query.type;
            const limit = parseInt(req.query.limit) || 20;
            const history = await SearchHistory_1.SearchHistory.getRecentSearches(new mongoose_1.default.Types.ObjectId(userId), limit);
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting search history:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get search history",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getPopularSearches(req, res) {
        try {
            const workplaceId = req.user.workplaceId;
            const searchType = req.query.type;
            const limit = parseInt(req.query.limit) || 10;
            const popularSearches = await SearchHistory_1.SearchHistory.getPopularSearches(new mongoose_1.default.Types.ObjectId(workplaceId), searchType, limit);
            res.json({
                success: true,
                data: popularSearches,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting popular searches:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get popular searches",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async saveSearch(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const savedSearch = new SearchHistory_1.SavedSearch({
                userId,
                workplaceId,
                name: req.body.name,
                description: req.body.description,
                query: req.body.query,
                filters: req.body.filters || {},
                searchType: req.body.searchType,
                isPublic: req.body.isPublic || false,
            });
            await savedSearch.save();
            res.status(201).json({
                success: true,
                data: savedSearch,
                message: "Search saved successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error saving search:", error);
            res.status(500).json({
                success: false,
                message: "Failed to save search",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getSavedSearches(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const searchType = req.query.type;
            const includePublic = req.query.includePublic === "true";
            let savedSearches;
            if (includePublic) {
                const [userSearches, publicSearches] = await Promise.all([
                    SearchHistory_1.SavedSearch.getUserSearches(new mongoose_1.default.Types.ObjectId(userId), searchType),
                    SearchHistory_1.SavedSearch.getPublicSearches(new mongoose_1.default.Types.ObjectId(workplaceId), searchType),
                ]);
                savedSearches = {
                    userSearches,
                    publicSearches: publicSearches.filter((search) => search.userId.toString() !== userId),
                };
            }
            else {
                savedSearches = await SearchHistory_1.SavedSearch.getUserSearches(new mongoose_1.default.Types.ObjectId(userId), searchType);
            }
            res.json({
                success: true,
                data: savedSearches,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting saved searches:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get saved searches",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async useSavedSearch(req, res) {
        try {
            const userId = req.user.id;
            const searchId = req.params.searchId;
            const savedSearch = await SearchHistory_1.SavedSearch.findOne({
                _id: searchId,
                $or: [
                    { userId },
                    { isPublic: true, workplaceId: req.user.workplaceId },
                ],
            });
            if (!savedSearch) {
                res.status(404).json({
                    success: false,
                    message: "Saved search not found",
                });
                return;
            }
            await savedSearch.incrementUseCount();
            res.json({
                success: true,
                data: savedSearch,
                message: "Saved search loaded successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error using saved search:", error);
            res.status(500).json({
                success: false,
                message: "Failed to load saved search",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async deleteSavedSearch(req, res) {
        try {
            const userId = req.user.id;
            const searchId = req.params.searchId;
            const savedSearch = await SearchHistory_1.SavedSearch.findOneAndDelete({
                _id: searchId,
                userId,
            });
            if (!savedSearch) {
                res.status(404).json({
                    success: false,
                    message: "Saved search not found or access denied",
                });
                return;
            }
            res.json({
                success: true,
                message: "Saved search deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Error deleting saved search:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete saved search",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createThread(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { messageId } = req.params;
            if (!messageId || !mongoose_1.default.Types.ObjectId.isValid(messageId)) {
                res.status(400).json({
                    success: false,
                    message: "Valid message ID is required",
                });
                return;
            }
            const threadId = await communicationService_1.communicationService.createThread(messageId, userId, workplaceId);
            res.json({
                success: true,
                message: "Thread created successfully",
                data: { threadId },
            });
        }
        catch (error) {
            logger_1.default.error("Error creating thread:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create thread",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getThreadMessages(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { threadId } = req.params;
            if (!threadId || !mongoose_1.default.Types.ObjectId.isValid(threadId)) {
                res.status(400).json({
                    success: false,
                    message: "Valid thread ID is required",
                });
                return;
            }
            const filters = {
                senderId: req.query.senderId,
                before: req.query.before
                    ? new Date(req.query.before)
                    : undefined,
                after: req.query.after
                    ? new Date(req.query.after)
                    : undefined,
                limit: parseInt(req.query.limit) || 100,
            };
            const threadData = await communicationService_1.communicationService.getThreadMessages(threadId, userId, workplaceId, filters);
            res.json({
                success: true,
                message: "Thread messages retrieved successfully",
                data: threadData,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting thread messages:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get thread messages",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getThreadSummary(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { threadId } = req.params;
            if (!threadId || !mongoose_1.default.Types.ObjectId.isValid(threadId)) {
                res.status(400).json({
                    success: false,
                    message: "Valid thread ID is required",
                });
                return;
            }
            const summary = await communicationService_1.communicationService.getThreadSummary(threadId, userId, workplaceId);
            res.json({
                success: true,
                message: "Thread summary retrieved successfully",
                data: summary,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting thread summary:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get thread summary",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async replyToThread(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { threadId } = req.params;
            if (!threadId || !mongoose_1.default.Types.ObjectId.isValid(threadId)) {
                res.status(400).json({
                    success: false,
                    message: "Valid thread ID is required",
                });
                return;
            }
            const { content, mentions, priority } = req.body;
            if (!content || !content.text?.trim()) {
                res.status(400).json({
                    success: false,
                    message: "Message content is required",
                });
                return;
            }
            let attachments = [];
            if (req.files && Array.isArray(req.files)) {
                attachments = req.files;
            }
            const messageData = {
                conversationId: "",
                senderId: userId,
                content: {
                    ...content,
                    attachments: attachments.length > 0 ? attachments : undefined,
                },
                mentions: mentions || [],
                priority: priority || "normal",
                workplaceId,
            };
            const message = await communicationService_1.communicationService.replyToThread(threadId, messageData);
            res.status(201).json({
                success: true,
                message: "Reply sent successfully",
                data: message,
            });
        }
        catch (error) {
            logger_1.default.error("Error replying to thread:", error);
            res.status(500).json({
                success: false,
                message: "Failed to send reply",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getConversationThreads(req, res) {
        try {
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const { conversationId } = req.params;
            if (!conversationId || !mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                res.status(400).json({
                    success: false,
                    message: "Valid conversation ID is required",
                });
                return;
            }
            const threads = await communicationService_1.communicationService.getConversationThreads(conversationId, userId, workplaceId);
            res.json({
                success: true,
                message: "Conversation threads retrieved successfully",
                data: threads,
            });
        }
        catch (error) {
            logger_1.default.error("Error getting conversation threads:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation threads",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.CommunicationController = CommunicationController;
exports.communicationController = new CommunicationController();
exports.default = exports.communicationController;
//# sourceMappingURL=communicationController.js.map