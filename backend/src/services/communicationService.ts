import mongoose from 'mongoose';
import Conversation, { IConversation, IConversationParticipant } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import CommunicationAuditLog from '../models/CommunicationAuditLog';
import { encryptionService } from './encryptionService';
import logger from '../utils/logger';

export interface CreateConversationData {
    title?: string;
    type: 'direct' | 'group' | 'patient_query' | 'clinical_consultation';
    participants: {
        userId: string;
        role: 'pharmacist' | 'doctor' | 'patient' | 'pharmacy_team' | 'intern_pharmacist';
        permissions?: string[];
    }[];
    patientId?: string;
    caseId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    tags?: string[];
    workplaceId: string;
    createdBy: string;
    clinicalContext?: {
        diagnosis?: string;
        medications?: string[];
        conditions?: string[];
        interventionIds?: string[];
    };
}

export interface SendMessageData {
    conversationId: string;
    senderId: string;
    content: {
        text?: string;
        type: 'text' | 'file' | 'image' | 'clinical_note' | 'system' | 'voice_note';
        attachments?: {
            fileId: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            secureUrl: string;
            thumbnailUrl?: string;
        }[];
        metadata?: {
            originalText?: string;
            clinicalData?: {
                patientId?: string;
                interventionId?: string;
                medicationId?: string;
            };
            systemAction?: {
                action: string;
                performedBy: string;
                timestamp: Date;
            };
        };
    };
    threadId?: string;
    parentMessageId?: string;
    mentions?: string[];
    priority?: 'normal' | 'high' | 'urgent';
    workplaceId: string;
}

export interface ConversationFilters {
    type?: string;
    status?: string;
    priority?: string;
    patientId?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}

export interface PaginationOptions {
    limit?: number;
    before?: string;
    after?: string;
    threadId?: string;
}

export interface SearchFilters {
    conversationId?: string;
    senderId?: string;
    type?: string;
    workplaceId: string;
    limit?: number;
}

/**
 * CommunicationService handles secure messaging and conversation management
 * for healthcare providers with HIPAA compliance and role-based access control
 */
export class CommunicationService {
    /**
     * Create a new conversation with participants and security settings
     */
    async createConversation(data: CreateConversationData): Promise<IConversation> {
        try {
            // Validate participants
            if (!data.participants || data.participants.length === 0) {
                throw new Error('Conversation must have at least one participant');
            }

            if (data.participants.length > 50) {
                throw new Error('Conversation cannot have more than 50 participants');
            }

            // Validate patient-related conversation types
            if (['patient_query', 'clinical_consultation'].includes(data.type) && !data.patientId) {
                throw new Error('Patient ID is required for patient queries and clinical consultations');
            }

            // Generate encryption key for the conversation
            const encryptionKeyId = await encryptionService.generateEncryptionKey();

            // Create conversation document
            const conversationData = {
                title: data.title,
                type: data.type,
                participants: data.participants.map(p => ({
                    userId: new mongoose.Types.ObjectId(p.userId),
                    role: p.role,
                    joinedAt: new Date(),
                    permissions: p.permissions || this.getDefaultPermissions(p.role),
                })),
                patientId: data.patientId ? new mongoose.Types.ObjectId(data.patientId) : undefined,
                caseId: data.caseId,
                status: 'active' as const,
                priority: data.priority || 'normal',
                tags: data.tags || [],
                lastMessageAt: new Date(),
                workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
                createdBy: new mongoose.Types.ObjectId(data.createdBy),
                metadata: {
                    isEncrypted: true,
                    encryptionKeyId,
                    clinicalContext: data.clinicalContext ? {
                        diagnosis: data.clinicalContext.diagnosis,
                        medications: data.clinicalContext.medications?.map(id => new mongoose.Types.ObjectId(id)),
                        conditions: data.clinicalContext.conditions,
                        interventionIds: data.clinicalContext.interventionIds?.map(id => new mongoose.Types.ObjectId(id)),
                    } : undefined,
                },
            };

            const conversation = new Conversation(conversationData);
            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'conversation_created',
                userId: data.createdBy,
                targetId: conversation._id.toString(),
                targetType: 'conversation',
                details: {
                    conversationId: conversation._id,
                    type: data.type,
                    participantCount: data.participants.length,
                    patientId: data.patientId,
                },
                workplaceId: data.workplaceId,
            });

            logger.info('Conversation created successfully', {
                conversationId: conversation._id,
                type: data.type,
                participantCount: data.participants.length,
                createdBy: data.createdBy,
            });

            return conversation;
        } catch (error) {
            logger.error('Failed to create conversation', {
                error: error instanceof Error ? error.message : error,
                data,
            });
            throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Add a participant to an existing conversation
     */
    async addParticipant(
        conversationId: string,
        userId: string,
        role: 'pharmacist' | 'doctor' | 'patient' | 'pharmacy_team' | 'intern_pharmacist',
        addedBy: string,
        permissions?: string[]
    ): Promise<void> {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check if user is already a participant
            const existingParticipant = conversation.participants.find(
                p => p.userId.toString() === userId && !p.leftAt
            );

            if (existingParticipant) {
                throw new Error('User is already a participant in this conversation');
            }

            // Add participant using the model method
            conversation.addParticipant(
                new mongoose.Types.ObjectId(userId),
                role,
                permissions || this.getDefaultPermissions(role)
            );

            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'participant_added',
                userId: addedBy,
                targetId: conversationId,
                targetType: 'conversation',
                details: {
                    conversationId: conversation._id,
                    addedUserId: userId,
                    role,
                },
                workplaceId: conversation.workplaceId.toString(),
            });

            logger.info('Participant added to conversation', {
                conversationId,
                userId,
                role,
                addedBy,
            });
        } catch (error) {
            logger.error('Failed to add participant', {
                error: error instanceof Error ? error.message : error,
                conversationId,
                userId,
                role,
            });
            throw new Error(`Failed to add participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Remove a participant from a conversation
     */
    async removeParticipant(
        conversationId: string,
        userId: string,
        removedBy: string
    ): Promise<void> {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Remove participant using the model method
            conversation.removeParticipant(new mongoose.Types.ObjectId(userId));
            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'participant_removed',
                userId: removedBy,
                targetId: conversationId,
                targetType: 'conversation',
                details: {
                    conversationId: conversation._id,
                    removedUserId: userId,
                },
                workplaceId: conversation.workplaceId.toString(),
            });

            logger.info('Participant removed from conversation', {
                conversationId,
                userId,
                removedBy,
            });
        } catch (error) {
            logger.error('Failed to remove participant', {
                error: error instanceof Error ? error.message : error,
                conversationId,
                userId,
            });
            throw new Error(`Failed to remove participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send a message in a conversation with encryption
     */
    async sendMessage(data: SendMessageData): Promise<IMessage> {
        try {
            // Validate conversation exists and user has permission
            const conversation = await Conversation.findById(data.conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check if sender is a participant
            if (!conversation.hasParticipant(new mongoose.Types.ObjectId(data.senderId))) {
                throw new Error('User is not a participant in this conversation');
            }

            // Encrypt message content if it's text
            let encryptedContent = data.content;
            if (data.content.text && conversation.metadata.isEncrypted) {
                const encryptedText = await encryptionService.encryptMessage(
                    data.content.text,
                    conversation.metadata.encryptionKeyId
                );
                encryptedContent = {
                    ...data.content,
                    text: encryptedText,
                };
            }

            // Create message document
            const messageData = {
                conversationId: new mongoose.Types.ObjectId(data.conversationId),
                senderId: new mongoose.Types.ObjectId(data.senderId),
                content: encryptedContent,
                threadId: data.threadId ? new mongoose.Types.ObjectId(data.threadId) : undefined,
                parentMessageId: data.parentMessageId ? new mongoose.Types.ObjectId(data.parentMessageId) : undefined,
                mentions: data.mentions?.map(id => new mongoose.Types.ObjectId(id)) || [],
                status: 'sent' as const,
                priority: data.priority || 'normal',
                readBy: [],
                reactions: [],
                editHistory: [],
                isEncrypted: conversation.metadata.isEncrypted,
                encryptionKeyId: conversation.metadata.encryptionKeyId,
                workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
                createdBy: new mongoose.Types.ObjectId(data.senderId),
            };

            const message = new Message(messageData);
            await message.save();

            // Update conversation's last message info
            conversation.updateLastMessage(message._id);
            conversation.incrementUnreadCount(new mongoose.Types.ObjectId(data.senderId));
            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'message_sent',
                userId: data.senderId,
                targetId: message._id.toString(),
                targetType: 'message',
                details: {
                    conversationId: data.conversationId,
                    messageId: message._id,
                    messageType: data.content.type,
                    hasAttachments: !!(data.content.attachments && data.content.attachments.length > 0),
                },
                workplaceId: data.workplaceId,
            });

            logger.info('Message sent successfully', {
                messageId: message._id,
                conversationId: data.conversationId,
                senderId: data.senderId,
                type: data.content.type,
            });

            return message;
        } catch (error) {
            logger.error('Failed to send message', {
                error: error instanceof Error ? error.message : error,
                conversationId: data.conversationId,
                senderId: data.senderId,
            });
            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get conversations for a user with filtering and pagination
     */
    async getConversations(
        userId: string,
        workplaceId: string,
        filters: ConversationFilters = {}
    ): Promise<IConversation[]> {
        try {
            const query: any = {
                workplaceId: new mongoose.Types.ObjectId(workplaceId),
                'participants.userId': new mongoose.Types.ObjectId(userId),
                'participants.leftAt': { $exists: false },
                status: { $ne: 'closed' },
            };

            // Apply filters
            if (filters.type) {
                query.type = filters.type;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.priority) {
                query.priority = filters.priority;
            }

            if (filters.patientId) {
                query.patientId = new mongoose.Types.ObjectId(filters.patientId);
            }

            if (filters.tags && filters.tags.length > 0) {
                query.tags = { $in: filters.tags };
            }

            const conversations = await Conversation.find(query)
                .populate('participants.userId', 'firstName lastName role email')
                .populate('patientId', 'firstName lastName mrn')
                .populate('lastMessageId', 'content.text content.type senderId createdAt')
                .sort({ lastMessageAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0);

            logger.debug('Retrieved conversations for user', {
                userId,
                workplaceId,
                count: conversations.length,
                filters,
            });

            return conversations;
        } catch (error) {
            logger.error('Failed to get conversations', {
                error: error instanceof Error ? error.message : error,
                userId,
                workplaceId,
                filters,
            });
            throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get messages for a conversation with pagination and decryption
     */
    async getMessages(
        conversationId: string,
        userId: string,
        pagination: PaginationOptions = {}
    ): Promise<IMessage[]> {
        try {
            // Verify user has access to conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            if (!conversation.hasParticipant(new mongoose.Types.ObjectId(userId))) {
                throw new Error('User does not have access to this conversation');
            }

            const query: any = { conversationId: new mongoose.Types.ObjectId(conversationId) };

            // Apply pagination filters
            if (pagination.threadId) {
                query.threadId = new mongoose.Types.ObjectId(pagination.threadId);
            }

            if (pagination.before) {
                query.createdAt = { $lt: new Date(pagination.before) };
            }

            if (pagination.after) {
                query.createdAt = { $gt: new Date(pagination.after) };
            }

            const messages = await Message.find(query)
                .populate('senderId', 'firstName lastName role')
                .populate('mentions', 'firstName lastName role')
                .populate('readBy.userId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(pagination.limit || 50);

            // Decrypt message content if encrypted
            const decryptedMessages = await Promise.all(
                messages.map(async (message) => {
                    if (message.isEncrypted && message.content.text && message.encryptionKeyId) {
                        try {
                            const decryptedText = await encryptionService.decryptMessage(
                                message.content.text,
                                message.encryptionKeyId
                            );
                            return {
                                ...message.toObject(),
                                content: {
                                    ...message.content,
                                    text: decryptedText,
                                },
                            };
                        } catch (decryptError) {
                            logger.warn('Failed to decrypt message', {
                                messageId: message._id,
                                error: decryptError instanceof Error ? decryptError.message : decryptError,
                            });
                            // Return message with encrypted content if decryption fails
                            return message.toObject();
                        }
                    }
                    return message.toObject();
                })
            );

            logger.debug('Retrieved messages for conversation', {
                conversationId,
                userId,
                count: messages.length,
                pagination,
            });

            return decryptedMessages as IMessage[];
        } catch (error) {
            logger.error('Failed to get messages', {
                error: error instanceof Error ? error.message : error,
                conversationId,
                userId,
                pagination,
            });
            throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Mark a message as read by a user
     */
    async markMessageAsRead(messageId: string, userId: string): Promise<void> {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Verify user has access to the conversation
            const conversation = await Conversation.findById(message.conversationId);
            if (!conversation || !conversation.hasParticipant(new mongoose.Types.ObjectId(userId))) {
                throw new Error('User does not have access to this message');
            }

            // Mark message as read using model method
            message.markAsRead(new mongoose.Types.ObjectId(userId));
            await message.save();

            // Update conversation unread count
            conversation.markAsRead(new mongoose.Types.ObjectId(userId));
            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'message_read',
                userId,
                targetId: messageId,
                targetType: 'message',
                details: {
                    conversationId: message.conversationId,
                    messageId: message._id,
                },
                workplaceId: conversation.workplaceId.toString(),
            });

            logger.debug('Message marked as read', {
                messageId,
                userId,
                conversationId: message.conversationId,
            });
        } catch (error) {
            logger.error('Failed to mark message as read', {
                error: error instanceof Error ? error.message : error,
                messageId,
                userId,
            });
            throw new Error(`Failed to mark message as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Search messages across conversations with filters
     */
    async searchMessages(
        searchQuery: string,
        userId: string,
        filters: SearchFilters
    ): Promise<IMessage[]> {
        try {
            if (!searchQuery || searchQuery.trim().length === 0) {
                throw new Error('Search query cannot be empty');
            }

            // Build search query
            const query: any = {
                workplaceId: new mongoose.Types.ObjectId(filters.workplaceId),
                $text: { $search: searchQuery },
            };

            // Apply filters
            if (filters.conversationId) {
                query.conversationId = new mongoose.Types.ObjectId(filters.conversationId);
            }

            if (filters.senderId) {
                query.senderId = new mongoose.Types.ObjectId(filters.senderId);
            }

            if (filters.type) {
                query['content.type'] = filters.type;
            }

            // Find messages and verify user access
            const messages = await Message.find(query, { score: { $meta: 'textScore' } })
                .populate('senderId', 'firstName lastName role')
                .populate('conversationId', 'title type participants')
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .limit(filters.limit || 50);

            // Filter messages based on user's conversation access
            const accessibleMessages = messages.filter((message: any) => {
                return message.conversationId.participants.some(
                    (p: any) => p.userId.toString() === userId && !p.leftAt
                );
            });

            // Decrypt message content if encrypted
            const decryptedMessages = await Promise.all(
                accessibleMessages.map(async (message) => {
                    if (message.isEncrypted && message.content.text && message.encryptionKeyId) {
                        try {
                            const decryptedText = await encryptionService.decryptMessage(
                                message.content.text,
                                message.encryptionKeyId
                            );
                            return {
                                ...message.toObject(),
                                content: {
                                    ...message.content,
                                    text: decryptedText,
                                },
                            };
                        } catch (decryptError) {
                            logger.warn('Failed to decrypt message in search', {
                                messageId: message._id,
                                error: decryptError instanceof Error ? decryptError.message : decryptError,
                            });
                            return message.toObject();
                        }
                    }
                    return message.toObject();
                })
            );

            logger.info('Message search completed', {
                searchQuery,
                userId,
                totalFound: messages.length,
                accessibleCount: accessibleMessages.length,
                filters,
            });

            return decryptedMessages as IMessage[];
        } catch (error) {
            logger.error('Failed to search messages', {
                error: error instanceof Error ? error.message : error,
                searchQuery,
                userId,
                filters,
            });
            throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get default permissions based on user role
     */
    private getDefaultPermissions(role: string): string[] {
        switch (role) {
            case 'patient':
                return ['read_messages', 'send_messages', 'upload_files'];
            case 'pharmacist':
            case 'doctor':
                return [
                    'read_messages',
                    'send_messages',
                    'upload_files',
                    'add_participants',
                    'edit_conversation',
                    'view_patient_data',
                    'manage_clinical_context',
                ];
            case 'intern_pharmacist':
                return [
                    'read_messages',
                    'send_messages',
                    'upload_files',
                    'view_patient_data',
                ];
            case 'pharmacy_team':
                return ['read_messages', 'send_messages', 'upload_files'];
            default:
                return ['read_messages', 'send_messages'];
        }
    }

    /**
     * Log audit events for compliance tracking
     */
    private async logAuditEvent(data: {
        action: string;
        userId: string;
        targetId: string;
        targetType: string;
        details: any;
        workplaceId: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        try {
            const auditLog = new CommunicationAuditLog({
                action: data.action,
                userId: new mongoose.Types.ObjectId(data.userId),
                targetId: new mongoose.Types.ObjectId(data.targetId),
                targetType: data.targetType,
                details: data.details,
                ipAddress: data.ipAddress || 'unknown',
                userAgent: data.userAgent || 'unknown',
                workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
                timestamp: new Date(),
            });

            await auditLog.save();
        } catch (error) {
            logger.error('Failed to log audit event', {
                error: error instanceof Error ? error.message : error,
                auditData: data,
            });
            // Don't throw error for audit logging failures to avoid breaking main functionality
        }
    }

    /**
     * Update conversation status (archive, resolve, close)
     */
    async updateConversationStatus(
        conversationId: string,
        status: 'active' | 'archived' | 'resolved' | 'closed',
        userId: string
    ): Promise<IConversation> {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Verify user has permission to update conversation
            const participant = conversation.participants.find(
                p => p.userId.toString() === userId && !p.leftAt
            );

            if (!participant || !participant.permissions.includes('edit_conversation')) {
                throw new Error('User does not have permission to update conversation status');
            }

            conversation.status = status;
            await conversation.save();

            // Log audit trail
            await this.logAuditEvent({
                action: 'conversation_status_updated',
                userId,
                targetId: conversationId,
                targetType: 'conversation',
                details: {
                    conversationId: conversation._id,
                    oldStatus: conversation.status,
                    newStatus: status,
                },
                workplaceId: conversation.workplaceId.toString(),
            });

            logger.info('Conversation status updated', {
                conversationId,
                status,
                userId,
            });

            return conversation;
        } catch (error) {
            logger.error('Failed to update conversation status', {
                error: error instanceof Error ? error.message : error,
                conversationId,
                status,
                userId,
            });
            throw new Error(`Failed to update conversation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get conversation statistics for dashboard
     */
    async getConversationStats(userId: string, workplaceId: string): Promise<{
        totalConversations: number;
        unreadConversations: number;
        activeQueries: number;
        resolvedQueries: number;
        urgentConversations: number;
    }> {
        try {
            const baseQuery = {
                workplaceId: new mongoose.Types.ObjectId(workplaceId),
                'participants.userId': new mongoose.Types.ObjectId(userId),
                'participants.leftAt': { $exists: false },
            };

            const [
                totalConversations,
                unreadConversations,
                activeQueries,
                resolvedQueries,
                urgentConversations,
            ] = await Promise.all([
                Conversation.countDocuments({ ...baseQuery, status: { $ne: 'closed' } }),
                Conversation.countDocuments({
                    ...baseQuery,
                    status: 'active',
                    [`unreadCount.${userId}`]: { $gt: 0 },
                }),
                Conversation.countDocuments({
                    ...baseQuery,
                    type: 'patient_query',
                    status: 'active',
                }),
                Conversation.countDocuments({
                    ...baseQuery,
                    type: 'patient_query',
                    status: 'resolved',
                }),
                Conversation.countDocuments({
                    ...baseQuery,
                    priority: 'urgent',
                    status: 'active',
                }),
            ]);

            return {
                totalConversations,
                unreadConversations,
                activeQueries,
                resolvedQueries,
                urgentConversations,
            };
        } catch (error) {
            logger.error('Failed to get conversation statistics', {
                error: error instanceof Error ? error.message : error,
                userId,
                workplaceId,
            });
            throw new Error(`Failed to get conversation statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export singleton instance
export const communicationService = new CommunicationService();