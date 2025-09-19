import mongoose from 'mongoose';
import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import User from '../models/User';
import Patient from '../models/Patient';
import logger from '../utils/logger';
import { notificationService } from './notificationService';
import CommunicationAuditService from './communicationAuditService';

export interface CreateConversationData {
    title?: string;
    type: 'direct' | 'group' | 'patient_query' | 'clinical_consultation';
    participants: string[];
    patientId?: string;
    caseId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    tags?: string[];
    createdBy: string;
    workplaceId: string;
}

export interface SendMessageData {
    conversationId: string;
    senderId: string;
    content: {
        text?: string;
        type: 'text' | 'file' | 'image' | 'clinical_note' | 'system' | 'voice_note';
        attachments?: any[];
        metadata?: any;
    };
    threadId?: string;
    parentMessageId?: string;
    mentions?: string[];
    priority?: 'normal' | 'high' | 'urgent';
    workplaceId: string;
}

export interface ConversationFilters {
    status?: 'active' | 'archived' | 'resolved' | 'closed';
    type?: 'direct' | 'group' | 'patient_query' | 'clinical_consultation';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    patientId?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}

export interface MessageFilters {
    type?: 'text' | 'file' | 'image' | 'clinical_note' | 'system' | 'voice_note';
    senderId?: string;
    mentions?: string;
    priority?: 'normal' | 'high' | 'urgent';
    before?: Date;
    after?: Date;
    limit?: number;
    offset?: number;
}

export interface SearchFilters {
    conversationId?: string;
    senderId?: string;
    type?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
}

/**
 * Service for managing conversations and messages
 */
export class CommunicationService {
    /**
     * Create a new conversation
     */
    async createConversation(data: CreateConversationData): Promise<IConversation> {
        try {
            // Validate participants exist and belong to the same workplace
            const participants = await User.find({
                _id: { $in: data.participants },
                workplaceId: data.workplaceId,
            }).select('_id role firstName lastName');

            if (participants.length !== data.participants.length) {
                throw new Error('Some participants not found or not in the same workplace');
            }

            // Validate patient if provided
            if (data.patientId) {
                const patient = await Patient.findOne({
                    _id: data.patientId,
                    workplaceId: data.workplaceId,
                });

                if (!patient) {
                    throw new Error('Patient not found or not in the same workplace');
                }
            }

            // Create conversation
            const conversation = new Conversation({
                title: data.title,
                type: data.type,
                participants: participants.map(p => ({
                    userId: p._id,
                    role: p.role,
                    joinedAt: new Date(),
                    permissions: this.getDefaultPermissions(p.role),
                })),
                patientId: data.patientId,
                caseId: data.caseId,
                priority: data.priority || 'normal',
                tags: data.tags || [],
                createdBy: data.createdBy,
                workplaceId: data.workplaceId,
                metadata: {
                    isEncrypted: true,
                    priority: data.priority || 'normal',
                    tags: data.tags || [],
                },
            });

            await conversation.save();

            // Create system message for conversation creation
            await this.createSystemMessage(
                conversation._id.toString(),
                data.createdBy,
                'conversation_created',
                `Conversation "${conversation.title}" was created`,
                data.workplaceId
            );

            // Send notifications to participants (except creator)
            const otherParticipants = participants.filter(p => p._id.toString() !== data.createdBy);
            for (const participant of otherParticipants) {
                await notificationService.createNotification({
                    userId: participant._id.toString(),
                    type: 'conversation_invite',
                    title: 'New Conversation',
                    content: `You've been added to a new conversation: ${conversation.title}`,
                    data: {
                        conversationId: conversation._id,
                        senderId: data.createdBy,
                    },
                    priority: 'normal',
                    deliveryChannels: {
                        inApp: true,
                        email: false,
                        sms: false,
                    },
                    workplaceId: data.workplaceId,
                });
            }

            logger.info(`Conversation ${conversation._id} created by user ${data.createdBy}`);
            return conversation;
        } catch (error) {
            logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    /**
     * Add participant to conversation
     */
    async addParticipant(
        conversationId: string,
        userId: string,
        role: string,
        addedBy: string,
        workplaceId: string
    ): Promise<void> {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                workplaceId,
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check if user adding participant has permission
            const adderRole = conversation.getParticipantRole(addedBy as any);
            if (!adderRole || !['pharmacist', 'doctor'].includes(adderRole)) {
                throw new Error('Insufficient permissions to add participants');
            }

            // Validate user exists and belongs to workplace
            const user = await User.findOne({
                _id: userId,
                workplaceId,
            }).select('_id role firstName lastName');

            if (!user) {
                throw new Error('User not found or not in the same workplace');
            }

            // Add participant
            conversation.addParticipant(user._id, role);
            await conversation.save();

            // Create system message
            await this.createSystemMessage(
                conversationId,
                addedBy,
                'participant_added',
                `${user.firstName} ${user.lastName} was added to the conversation`,
                workplaceId
            );

            // Send notification to new participant
            await notificationService.createNotification({
                userId: userId,
                type: 'conversation_invite',
                title: 'Added to Conversation',
                content: `You've been added to the conversation: ${conversation.title}`,
                data: {
                    conversationId: conversation._id,
                    senderId: addedBy,
                },
                priority: 'normal',
                deliveryChannels: {
                    inApp: true,
                    email: false,
                    sms: false,
                },
                workplaceId,
            });

            logger.info(`User ${userId} added to conversation ${conversationId} by ${addedBy}`);
        } catch (error) {
            logger.error('Error adding participant:', error);
            throw error;
        }
    }

    /**
     * Remove participant from conversation
     */
    async removeParticipant(
        conversationId: string,
        userId: string,
        removedBy: string,
        workplaceId: string
    ): Promise<void> {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                workplaceId,
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check permissions (can remove self or if pharmacist/doctor)
            const removerRole = conversation.getParticipantRole(removedBy as any);
            if (userId !== removedBy && (!removerRole || !['pharmacist', 'doctor'].includes(removerRole))) {
                throw new Error('Insufficient permissions to remove participants');
            }

            const user = await User.findById(userId).select('firstName lastName');
            if (!user) {
                throw new Error('User not found');
            }

            // Remove participant
            conversation.removeParticipant(userId as any);
            await conversation.save();

            // Create system message
            const action = userId === removedBy ? 'participant_left' : 'participant_removed';
            const message = userId === removedBy
                ? `${user.firstName} ${user.lastName} left the conversation`
                : `${user.firstName} ${user.lastName} was removed from the conversation`;

            await this.createSystemMessage(
                conversationId,
                removedBy,
                action,
                message,
                workplaceId
            );

            logger.info(`User ${userId} removed from conversation ${conversationId} by ${removedBy}`);
        } catch (error) {
            logger.error('Error removing participant:', error);
            throw error;
        }
    }

    /**
     * Send a message
     */
    async sendMessage(data: SendMessageData): Promise<IMessage> {
        try {
            // Validate conversation exists and user is participant
            const conversation = await Conversation.findOne({
                _id: data.conversationId,
                workplaceId: data.workplaceId,
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            if (!conversation.hasParticipant(data.senderId as any)) {
                throw new Error('User is not a participant in this conversation');
            }

            // Validate parent message if replying
            if (data.parentMessageId) {
                const parentMessage = await Message.findOne({
                    _id: data.parentMessageId,
                    conversationId: data.conversationId,
                });

                if (!parentMessage) {
                    throw new Error('Parent message not found');
                }
            }

            // Create message
            const message = new Message({
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                threadId: data.threadId,
                parentMessageId: data.parentMessageId,
                mentions: data.mentions || [],
                priority: data.priority || 'normal',
                workplaceId: data.workplaceId,
                createdBy: data.senderId,
            });

            await message.save();

            // Update conversation
            conversation.updateLastMessage(message._id);
            conversation.incrementUnreadCount(data.senderId as any);
            await conversation.save();

            // Populate sender data
            await message.populate('senderId', 'firstName lastName role');

            // Handle mentions
            if (data.mentions && data.mentions.length > 0) {
                await this.handleMentions(data.mentions, message, conversation);
            }

            // Send notifications for urgent messages
            if (data.priority === 'urgent') {
                await this.handleUrgentMessageNotifications(message, conversation);
            }

            logger.debug(`Message sent by user ${data.senderId} in conversation ${data.conversationId}`);
            return message;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Get conversations for a user
     */
    async getConversations(
        userId: string,
        workplaceId: string,
        filters: ConversationFilters = {}
    ): Promise<IConversation[]> {
        try {
            const query: any = {
                workplaceId,
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            };

            if (filters.status) {
                query.status = filters.status;
            } else {
                query.status = { $ne: 'closed' };
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

            const conversations = await Conversation.find(query)
                .populate('participants.userId', 'firstName lastName role')
                .populate('patientId', 'firstName lastName mrn')
                .populate('lastMessageId', 'content.text senderId createdAt')
                .sort({ lastMessageAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0);

            return conversations;
        } catch (error) {
            logger.error('Error getting conversations:', error);
            throw error;
        }
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(
        conversationId: string,
        userId: string,
        workplaceId: string,
        filters: MessageFilters = {}
    ): Promise<IMessage[]> {
        try {
            // Validate user is participant
            const conversation = await Conversation.findOne({
                _id: conversationId,
                workplaceId,
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            });

            if (!conversation) {
                throw new Error('Conversation not found or access denied');
            }

            const query: any = { conversationId };

            if (filters.type) {
                query['content.type'] = filters.type;
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

            const messages = await Message.find(query)
                .populate('senderId', 'firstName lastName role')
                .populate('mentions', 'firstName lastName role')
                .populate('readBy.userId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0);

            return messages;
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId: string, userId: string, workplaceId: string): Promise<void> {
        try {
            const message = await Message.findOne({
                _id: messageId,
                workplaceId,
            });

            if (!message) {
                throw new Error('Message not found');
            }

            // Validate user is participant in conversation
            const conversation = await Conversation.findOne({
                _id: message.conversationId,
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            });

            if (!conversation) {
                throw new Error('Access denied');
            }

            message.markAsRead(userId as any);
            await message.save();

            // Update conversation unread count
            conversation.markAsRead(userId as any);
            await conversation.save();

            logger.debug(`Message ${messageId} marked as read by user ${userId}`);
        } catch (error) {
            logger.error('Error marking message as read:', error);
            throw error;
        }
    }

    /**
     * Search messages
     */
    async searchMessages(
        workplaceId: string,
        query: string,
        userId: string,
        filters: SearchFilters = {}
    ): Promise<IMessage[]> {
        try {
            const searchQuery: any = {
                workplaceId,
                $text: { $search: query },
            };

            // Only search in conversations where user is a participant
            const userConversations = await Conversation.find({
                workplaceId,
                'participants.userId': userId,
                'participants.leftAt': { $exists: false },
            }).select('_id');

            searchQuery.conversationId = { $in: userConversations.map(c => c._id) };

            if (filters.conversationId) {
                searchQuery.conversationId = filters.conversationId;
            }

            if (filters.senderId) {
                searchQuery.senderId = filters.senderId;
            }

            if (filters.type) {
                searchQuery['content.type'] = filters.type;
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

            const messages = await Message.find(searchQuery, { score: { $meta: 'textScore' } })
                .populate('senderId', 'firstName lastName role')
                .populate('conversationId', 'title type')
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .limit(filters.limit || 50);

            return messages;
        } catch (error) {
            logger.error('Error searching messages:', error);
            throw error;
        }
    }

    /**
     * Create system message
     */
    private async createSystemMessage(
        conversationId: string,
        performedBy: string,
        action: string,
        text: string,
        workplaceId: string
    ): Promise<IMessage> {
        const message = new Message({
            conversationId,
            senderId: performedBy,
            content: {
                text,
                type: 'system',
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

    /**
     * Handle mention notifications
     */
    private async handleMentions(
        mentions: string[],
        message: IMessage,
        conversation: IConversation
    ): Promise<void> {
        try {
            for (const mentionedUserId of mentions) {
                // Verify mentioned user is a participant
                if (conversation.hasParticipant(mentionedUserId as any)) {
                    await notificationService.createNotification({
                        userId: mentionedUserId,
                        type: 'mention',
                        title: 'You were mentioned',
                        content: `You were mentioned in ${conversation.title}`,
                        data: {
                            conversationId: conversation._id,
                            messageId: message._id,
                            senderId: message.senderId,
                        },
                        priority: 'normal',
                        deliveryChannels: {
                            inApp: true,
                            email: false,
                            sms: false,
                        },
                        workplaceId: conversation.workplaceId,
                    });
                }
            }
        } catch (error) {
            logger.error('Error handling mentions:', error);
        }
    }

    /**
     * Handle urgent message notifications
     */
    private async handleUrgentMessageNotifications(
        message: IMessage,
        conversation: IConversation
    ): Promise<void> {
        try {
            const participants = conversation.participants.filter(
                p => !p.leftAt && p.userId.toString() !== message.senderId.toString()
            );

            for (const participant of participants) {
                await notificationService.createNotification({
                    userId: participant.userId.toString(),
                    type: 'urgent_message',
                    title: 'Urgent Message',
                    content: `Urgent message in ${conversation.title}`,
                    data: {
                        conversationId: conversation._id,
                        messageId: message._id,
                        senderId: message.senderId,
                    },
                    priority: 'urgent',
                    deliveryChannels: {
                        inApp: true,
                        email: true,
                        sms: false,
                    },
                    workplaceId: conversation.workplaceId,
                });
            }
        } catch (error) {
            logger.error('Error handling urgent message notifications:', error);
        }
    }

    /**
     * Get default permissions based on role
     */
    private getDefaultPermissions(role: string): string[] {
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
}

export const communicationService = new CommunicationService();
export default communicationService;