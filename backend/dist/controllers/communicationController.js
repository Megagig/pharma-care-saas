"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationController = exports.CommunicationController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const communicationService_1 = require("../services/communicationService");
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
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
                tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
            };
            const conversations = await communicationService_1.communicationService.getConversations(userId, workplaceId, filters);
            const conversationsWithUnread = conversations.map(conv => ({
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
            logger_1.default.error('Error getting conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversations',
                error: error.message,
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
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                conversation.participants.forEach(participant => {
                    if (participant.userId.toString() !== userId) {
                        communicationSocket.io.to(`user:${participant.userId}`).emit('conversation:created', {
                            conversation: conversation.toObject(),
                            timestamp: new Date(),
                        });
                    }
                });
            }
            res.status(201).json({
                success: true,
                data: conversation,
                message: 'Conversation created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error creating conversation:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to create conversation',
                error: error.message,
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
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            })
                .populate('participants.userId', 'firstName lastName role')
                .populate('patientId', 'firstName lastName mrn')
                .populate('lastMessageId', 'content.text senderId createdAt');
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found or access denied',
                });
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
            logger_1.default.error('Error getting conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation',
                error: error.message,
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
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            });
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found or access denied',
                });
            }
            const userRole = conversation.getParticipantRole(userId);
            if (!userRole || !['pharmacist', 'doctor'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to update conversation',
                });
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
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    updates: req.body,
                    updatedBy: userId,
                });
            }
            res.json({
                success: true,
                data: conversation,
                message: 'Conversation updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error updating conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update conversation',
                error: error.message,
            });
        }
    }
    async addParticipant(req, res) {
        try {
            const conversationId = req.params.id;
            const { userId: newUserId, role } = req.body;
            const addedBy = req.user.id;
            const workplaceId = req.user.workplaceId;
            await communicationService_1.communicationService.addParticipant(conversationId, newUserId, role, addedBy, workplaceId);
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    action: 'participant_added',
                    userId: newUserId,
                    addedBy,
                });
            }
            res.json({
                success: true,
                message: 'Participant added successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error adding participant:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to add participant',
                error: error.message,
            });
        }
    }
    async removeParticipant(req, res) {
        try {
            const conversationId = req.params.id;
            const userIdToRemove = req.params.userId;
            const removedBy = req.user.id;
            const workplaceId = req.user.workplaceId;
            await communicationService_1.communicationService.removeParticipant(conversationId, userIdToRemove, removedBy, workplaceId);
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.sendConversationUpdate(conversationId, {
                    action: 'participant_removed',
                    userId: userIdToRemove,
                    removedBy,
                });
            }
            res.json({
                success: true,
                message: 'Participant removed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error removing participant:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to remove participant',
                error: error.message,
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
                before: req.query.before ? new Date(req.query.before) : undefined,
                after: req.query.after ? new Date(req.query.after) : undefined,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
            };
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
            logger_1.default.error('Error getting messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message,
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
            const message = await communicationService_1.communicationService.sendMessage(messageData);
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.sendMessageNotification(conversationId, message, senderId);
            }
            res.status(201).json({
                success: true,
                data: message,
                message: 'Message sent successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error sending message:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to send message',
                error: error.message,
            });
        }
    }
    async markMessageAsRead(req, res) {
        try {
            const messageId = req.params.id;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            await communicationService_1.communicationService.markMessageAsRead(messageId, userId, workplaceId);
            res.json({
                success: true,
                message: 'Message marked as read',
            });
        }
        catch (error) {
            logger_1.default.error('Error marking message as read:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to mark message as read',
                error: error.message,
            });
        }
    }
    async addReaction(req, res) {
        try {
            const messageId = req.params.id;
            const { emoji } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
            }
            message.addReaction(userId, emoji);
            await message.save();
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.io.to(`conversation:${message.conversationId}`).emit('message:reaction_added', {
                    messageId,
                    emoji,
                    userId,
                    timestamp: new Date(),
                });
            }
            res.json({
                success: true,
                message: 'Reaction added successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error adding reaction:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to add reaction',
                error: error.message,
            });
        }
    }
    async removeReaction(req, res) {
        try {
            const messageId = req.params.id;
            const emoji = req.params.emoji;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const message = await Message_1.default.findOne({
                _id: messageId,
                workplaceId,
            });
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
            }
            message.removeReaction(userId, emoji);
            await message.save();
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.io.to(`conversation:${message.conversationId}`).emit('message:reaction_removed', {
                    messageId,
                    emoji,
                    userId,
                    timestamp: new Date(),
                });
            }
            res.json({
                success: true,
                message: 'Reaction removed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error removing reaction:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to remove reaction',
                error: error.message,
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
                return res.status(404).json({
                    success: false,
                    message: 'Message not found or not authorized to edit',
                });
            }
            message.addEdit(content, userId, reason);
            await message.save();
            const app = req.app;
            const communicationSocket = app.get('communicationSocket');
            if (communicationSocket) {
                communicationSocket.io.to(`conversation:${message.conversationId}`).emit('message:edited', {
                    messageId,
                    content,
                    editedBy: userId,
                    timestamp: new Date(),
                });
            }
            res.json({
                success: true,
                data: message,
                message: 'Message edited successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error editing message:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to edit message',
                error: error.message,
            });
        }
    }
    async searchMessages(req, res) {
        try {
            const query = req.query.q;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                conversationId: req.query.conversationId,
                senderId: req.query.senderId,
                type: req.query.type,
                priority: req.query.priority,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                limit: parseInt(req.query.limit) || 50,
            };
            const messages = await communicationService_1.communicationService.searchMessages(workplaceId, query, userId, filters);
            res.json({
                success: true,
                data: messages,
                query,
                total: messages.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error searching messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search messages',
                error: error.message,
            });
        }
    }
    async searchConversations(req, res) {
        try {
            const query = req.query.q;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            const filters = {
                search: query,
                type: req.query.type,
                status: req.query.status,
                priority: req.query.priority,
                patientId: req.query.patientId,
                limit: parseInt(req.query.limit) || 50,
            };
            const conversations = await communicationService_1.communicationService.getConversations(userId, workplaceId, filters);
            res.json({
                success: true,
                data: conversations,
                query,
                total: conversations.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error searching conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search conversations',
                error: error.message,
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
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found',
                });
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
            logger_1.default.error('Error getting patient conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get patient conversations',
                error: error.message,
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
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found',
                });
            }
            const healthcareProviders = await User_1.default.find({
                workplaceId,
                role: { $in: ['pharmacist', 'doctor'] },
                isActive: true,
            }).limit(5);
            const participants = [userId, ...healthcareProviders.map(p => p._id.toString())];
            const conversationData = {
                title: title || `Query for ${patient.firstName} ${patient.lastName}`,
                type: 'patient_query',
                participants,
                patientId,
                priority: priority || 'normal',
                tags: tags || ['patient-query'],
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
                    type: 'text',
                },
                priority: priority || 'normal',
            };
            const initialMessage = await communicationService_1.communicationService.sendMessage(messageData);
            res.status(201).json({
                success: true,
                data: {
                    conversation,
                    initialMessage,
                },
                message: 'Patient query created successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error creating patient query:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to create patient query',
                error: error.message,
            });
        }
    }
    async getAnalyticsSummary(req, res) {
        try {
            const workplaceId = req.user.workplaceId;
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
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
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        resolvedConversations: {
                            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                        },
                        urgentConversations: {
                            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
                        },
                    }
                }
            ]);
            const messageStats = await Message_1.default.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        textMessages: {
                            $sum: { $cond: [{ $eq: ['$content.type', 'text'] }, 1, 0] }
                        },
                        fileMessages: {
                            $sum: { $cond: [{ $eq: ['$content.type', 'file'] }, 1, 0] }
                        },
                        urgentMessages: {
                            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
                        },
                    }
                }
            ]);
            const responseTimeStats = await Message_1.default.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: 'messages',
                        let: { conversationId: '$conversationId', messageTime: '$createdAt' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$conversationId', '$$conversationId'] },
                                            { $lt: ['$createdAt', '$$messageTime'] }
                                        ]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 }
                        ],
                        as: 'previousMessage'
                    }
                },
                {
                    $match: {
                        previousMessage: { $ne: [] }
                    }
                },
                {
                    $addFields: {
                        responseTime: {
                            $subtract: ['$createdAt', { $arrayElemAt: ['$previousMessage.createdAt', 0] }]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: '$responseTime' },
                        minResponseTime: { $min: '$responseTime' },
                        maxResponseTime: { $max: '$responseTime' },
                    }
                }
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
                responseTime: responseTimeStats[0] ? {
                    average: Math.round(responseTimeStats[0].avgResponseTime / (1000 * 60)),
                    min: Math.round(responseTimeStats[0].minResponseTime / (1000 * 60)),
                    max: Math.round(responseTimeStats[0].maxResponseTime / (1000 * 60)),
                } : null,
            };
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting analytics summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics summary',
                error: error.message,
            });
        }
    }
    async uploadFiles(req, res) {
        try {
            const files = req.files;
            const { conversationId, messageType = 'file' } = req.body;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded',
                });
            }
            if (conversationId) {
                const conversation = await Conversation_1.default.findOne({
                    _id: conversationId,
                    workplaceId,
                    'participants.userId': userId,
                    'participants.leftAt': { $exists: false },
                });
                if (!conversation) {
                    return res.status(404).json({
                        success: false,
                        message: 'Conversation not found or access denied',
                    });
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
                        error: error.message,
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
                const communicationSocket = app.get('communicationSocket');
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
            logger_1.default.error('Error uploading files:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload files',
                error: error.message,
            });
        }
    }
    async getFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;
            const workplaceId = req.user.workplaceId;
            if (!fileUploadService_1.default.fileExists(fileId)) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found',
                });
            }
            const message = await Message_1.default.findOne({
                workplaceId,
                'content.attachments.fileId': fileId,
            }).populate('conversationId');
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found in any accessible conversation',
                });
            }
            const conversation = await Conversation_1.default.findOne({
                _id: message.conversationId,
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            });
            if (!conversation) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this file',
                });
            }
            const attachment = message.content.attachments?.find(att => att.fileId === fileId);
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'File attachment not found',
                });
            }
            const fileStats = fileUploadService_1.default.getFileStats(fileId);
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
                    stats: fileStats ? {
                        size: fileStats.size,
                        created: fileStats.birthtime,
                        modified: fileStats.mtime,
                    } : null,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting file:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get file',
                error: error.message,
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
                'content.attachments.fileId': fileId,
            });
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found',
                });
            }
            const user = await User_1.default.findById(userId);
            if (message.senderId.toString() !== userId && !['admin', 'super_admin'].includes(user?.role || '')) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the file uploader or admin can delete files',
                });
            }
            const filePath = fileUploadService_1.default.getFilePath(fileId);
            await fileUploadService_1.default.deleteFile(filePath);
            message.content.attachments = message.content.attachments?.filter(att => att.fileId !== fileId) || [];
            await message.save();
            res.json({
                success: true,
                message: 'File deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting file:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete file',
                error: error.message,
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
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            });
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found or access denied',
                });
            }
            const query = {
                conversationId,
                'content.attachments': { $exists: true, $ne: [] },
            };
            if (type) {
                query['content.type'] = type;
            }
            const messages = await Message_1.default.find(query)
                .populate('senderId', 'firstName lastName role')
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
            logger_1.default.error('Error getting conversation files:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation files',
                error: error.message,
            });
        }
    }
}
exports.CommunicationController = CommunicationController;
exports.communicationController = new CommunicationController();
exports.default = exports.communicationController;
//# sourceMappingURL=communicationController.js.map