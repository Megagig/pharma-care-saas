import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { communicationService } from '../services/communicationService';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import Patient from '../models/Patient';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        workplaceId: string;
        role: string;
    };
}

/**
 * Controller for communication hub endpoints
 */
export class CommunicationController {
    /**
     * Get user's conversations
     */
    async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const filters = {
                status: req.query.status as string,
                type: req.query.type as string,
                priority: req.query.priority as string,
                patientId: req.query.patientId as string,
                search: req.query.search as string,
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0,
                tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
            };

            const conversations = await communicationService.getConversations(userId, workplaceId, filters);

            // Add unread counts for each conversation
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
        } catch (error) {
            logger.error('Error getting conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversations',
                error: error.message,
            });
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const conversationData = {
                ...req.body,
                createdBy: userId,
                workplaceId,
            };

            const conversation = await communicationService.createConversation(conversationData);

            // Get socket service and notify participants
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
        } catch (error) {
            logger.error('Error creating conversation:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to create conversation',
                error: error.message,
            });
        }
    }

    /**
     * Get conversation details
     */
    async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const conversation = await Conversation.findOne({
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
        } catch (error) {
            logger.error('Error getting conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation',
                error: error.message,
            });
        }
    }

    /**
     * Update conversation
     */
    async updateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const conversation = await Conversation.findOne({
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

            // Check permissions
            const userRole = conversation.getParticipantRole(userId as any);
            if (!userRole || !['pharmacist', 'doctor'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to update conversation',
                });
            }

            // Update fields
            if (req.body.title) conversation.title = req.body.title;
            if (req.body.priority) conversation.priority = req.body.priority;
            if (req.body.tags) conversation.tags = req.body.tags;
            if (req.body.status) conversation.status = req.body.status;

            conversation.updatedBy = userId as any;
            await conversation.save();

            // Notify participants via socket
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
        } catch (error) {
            logger.error('Error updating conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update conversation',
                error: error.message,
            });
        }
    }

    /**
     * Add participant to conversation
     */
    async addParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const { userId: newUserId, role } = req.body;
            const addedBy = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            await communicationService.addParticipant(conversationId, newUserId, role, addedBy, workplaceId);

            // Notify via socket
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
        } catch (error) {
            logger.error('Error adding participant:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to add participant',
                error: error.message,
            });
        }
    }

    /**
     * Remove participant from conversation
     */
    async removeParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const userIdToRemove = req.params.userId;
            const removedBy = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            await communicationService.removeParticipant(conversationId, userIdToRemove, removedBy, workplaceId);

            // Notify via socket
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
        } catch (error) {
            logger.error('Error removing participant:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to remove participant',
                error: error.message,
            });
        }
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const filters = {
                type: req.query.type as string,
                senderId: req.query.senderId as string,
                mentions: req.query.mentions as string,
                priority: req.query.priority as string,
                before: req.query.before ? new Date(req.query.before as string) : undefined,
                after: req.query.after ? new Date(req.query.after as string) : undefined,
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0,
            };

            const messages = await communicationService.getMessages(conversationId, userId, workplaceId, filters);

            res.json({
                success: true,
                data: messages,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: messages.length,
                },
            });
        } catch (error) {
            logger.error('Error getting messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message,
            });
        }
    }

    /**
     * Send a message
     */
    async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const conversationId = req.params.id;
            const senderId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const messageData = {
                conversationId,
                senderId,
                workplaceId,
                ...req.body,
            };

            const message = await communicationService.sendMessage(messageData);

            // Notify via socket
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
        } catch (error) {
            logger.error('Error sending message:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to send message',
                error: error.message,
            });
        }
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const messageId = req.params.id;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            await communicationService.markMessageAsRead(messageId, userId, workplaceId);

            res.json({
                success: true,
                message: 'Message marked as read',
            });
        } catch (error) {
            logger.error('Error marking message as read:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to mark message as read',
                error: error.message,
            });
        }
    }

    /**
     * Add reaction to message
     */
    async addReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const messageId = req.params.id;
            const { emoji } = req.body;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const message = await Message.findOne({
                _id: messageId,
                workplaceId,
            });

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
            }

            message.addReaction(userId as any, emoji);
            await message.save();

            // Notify via socket
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
        } catch (error) {
            logger.error('Error adding reaction:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to add reaction',
                error: error.message,
            });
        }
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const messageId = req.params.id;
            const emoji = req.params.emoji;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const message = await Message.findOne({
                _id: messageId,
                workplaceId,
            });

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found',
                });
            }

            message.removeReaction(userId as any, emoji);
            await message.save();

            // Notify via socket
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
        } catch (error) {
            logger.error('Error removing reaction:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to remove reaction',
                error: error.message,
            });
        }
    }

    /**
     * Edit message
     */
    async editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const messageId = req.params.id;
            const { content, reason } = req.body;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const message = await Message.findOne({
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

            message.addEdit(content, userId as any, reason);
            await message.save();

            // Notify via socket
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
        } catch (error) {
            logger.error('Error editing message:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to edit message',
                error: error.message,
            });
        }
    }

    /**
     * Search messages
     */
    async searchMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const query = req.query.q as string;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const filters = {
                conversationId: req.query.conversationId as string,
                senderId: req.query.senderId as string,
                type: req.query.type as string,
                priority: req.query.priority as string,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
                limit: parseInt(req.query.limit as string) || 50,
            };

            const messages = await communicationService.searchMessages(workplaceId, query, userId, filters);

            res.json({
                success: true,
                data: messages,
                query,
                total: messages.length,
            });
        } catch (error) {
            logger.error('Error searching messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search messages',
                error: error.message,
            });
        }
    }

    /**
     * Search conversations
     */
    async searchConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const query = req.query.q as string;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            const filters = {
                search: query,
                type: req.query.type as string,
                status: req.query.status as string,
                priority: req.query.priority as string,
                patientId: req.query.patientId as string,
                limit: parseInt(req.query.limit as string) || 50,
            };

            const conversations = await communicationService.getConversations(userId, workplaceId, filters);

            res.json({
                success: true,
                data: conversations,
                query,
                total: conversations.length,
            });
        } catch (error) {
            logger.error('Error searching conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search conversations',
                error: error.message,
            });
        }
    }

    /**
     * Get conversations for a specific patient
     */
    async getPatientConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            // Verify patient exists and user has access
            const patient = await Patient.findOne({
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
                status: req.query.status as string,
                type: req.query.type as string,
                limit: parseInt(req.query.limit as string) || 50,
            };

            const conversations = await communicationService.getConversations(userId, workplaceId, filters);

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
        } catch (error) {
            logger.error('Error getting patient conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get patient conversations',
                error: error.message,
            });
        }
    }

    /**
     * Create a patient query conversation
     */
    async createPatientQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId;
            const { title, message, priority, tags } = req.body;
            const userId = req.user!.id;
            const workplaceId = req.user!.workplaceId;

            // Verify patient exists
            const patient = await Patient.findOne({
                _id: patientId,
                workplaceId,
            });

            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found',
                });
            }

            // Find appropriate healthcare providers to include
            const healthcareProviders = await User.find({
                workplaceId,
                role: { $in: ['pharmacist', 'doctor'] },
                isActive: true,
            }).limit(5); // Include up to 5 providers

            const participants = [userId, ...healthcareProviders.map(p => p._id.toString())];

            // Create conversation
            const conversationData = {
                title: title || `Query for ${patient.firstName} ${patient.lastName}`,
                type: 'patient_query' as const,
                participants,
                patientId,
                priority: priority || 'normal',
                tags: tags || ['patient-query'],
                createdBy: userId,
                workplaceId,
            };

            const conversation = await communicationService.createConversation(conversationData);

            // Send initial message
            const messageData = {
                conversationId: conversation._id.toString(),
                senderId: userId,
                workplaceId,
                content: {
                    text: message,
                    type: 'text' as const,
                },
                priority: priority || 'normal',
            };

            const initialMessage = await communicationService.sendMessage(messageData);

            res.status(201).json({
                success: true,
                data: {
                    conversation,
                    initialMessage,
                },
                message: 'Patient query created successfully',
            });
        } catch (error) {
            logger.error('Error creating patient query:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to create patient query',
                error: error.message,
            });
        }
    }

    /**
     * Get analytics summary
     */
    async getAnalyticsSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const workplaceId = req.user!.workplaceId;
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
            const patientId = req.query.patientId as string;

            const matchQuery: any = {
                workplaceId: new mongoose.Types.ObjectId(workplaceId),
                createdAt: { $gte: dateFrom, $lte: dateTo },
            };

            if (patientId) {
                matchQuery.patientId = new mongoose.Types.ObjectId(patientId);
            }

            // Get conversation statistics
            const conversationStats = await Conversation.aggregate([
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

            // Get message statistics
            const messageStats = await Message.aggregate([
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

            // Get response time statistics
            const responseTimeStats = await Message.aggregate([
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
                    average: Math.round(responseTimeStats[0].avgResponseTime / (1000 * 60)), // minutes
                    min: Math.round(responseTimeStats[0].minResponseTime / (1000 * 60)),
                    max: Math.round(responseTimeStats[0].maxResponseTime / (1000 * 60)),
                } : null,
            };

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            logger.error('Error getting analytics summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics summary',
                error: error.message,
            });
        }
    }
}

export const communicationController = new CommunicationController();
export default communicationController;