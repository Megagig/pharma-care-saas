import mongoose from 'mongoose';
import { ChatConversation, IConversation, ChatMessage, IMessage } from '../../models/chat';
import User from '../../models/User';
import Patient from '../../models/Patient';
import logger from '../../utils/logger';
import { notificationService } from '../notificationService';

/**
 * ChatService - Complete Chat Service
 * 
 * Handles conversation management, message operations, and reactions
 */

export interface CreateConversationDTO {
  type: 'direct' | 'group' | 'patient_query' | 'prescription_discussion' | 'broadcast';
  title?: string;
  participants: Array<{
    userId: string;
    role: 'pharmacist' | 'doctor' | 'patient' | 'admin';
  }>;
  patientId?: string;
  prescriptionId?: string;
  createdBy: string;
  workplaceId: string;
}

export interface UpdateConversationDTO {
  title?: string;
  status?: 'active' | 'archived' | 'resolved';
  isPinned?: boolean;
}

export interface ConversationFilters {
  status?: 'active' | 'archived' | 'resolved';
  type?: 'direct' | 'group' | 'patient_query' | 'prescription_discussion' | 'broadcast';
  isPinned?: boolean;
  patientId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SendMessageDTO {
  conversationId: string;
  senderId: string;
  content: {
    text?: string;
    type: 'text' | 'file' | 'image' | 'system';
  };
  threadId?: string;
  parentMessageId?: string;
  mentions?: string[];
  workplaceId: string;
}

export interface MessageFilters {
  threadId?: string;
  before?: Date;
  after?: Date;
  limit?: number;
  offset?: number;
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationDTO): Promise<IConversation> {
    try {
      logger.info('Creating conversation', {
        type: data.type,
        participantCount: data.participants.length,
        workplaceId: data.workplaceId,
      });

      // Validate participants exist and belong to workplace
      const participantIds = data.participants.map(p => p.userId);
      const users = await User.find({
        _id: { $in: participantIds },
        workplaceId: data.workplaceId,
      }).select('_id role firstName lastName');

      if (users.length !== participantIds.length) {
        throw new Error('Some participants not found or not in the same workplace');
      }

      // Ensure creator is included in participants
      if (!participantIds.includes(data.createdBy)) {
        logger.warn('Creator not in participants, adding them', {
          createdBy: data.createdBy,
          type: data.type,
        });
        
        const creator = users.find(u => u._id.toString() === data.createdBy);
        if (creator) {
          data.participants.push({
            userId: data.createdBy,
            role: creator.role as any,
          });
        }
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

      // For direct conversations, ensure exactly 2 participants
      if (data.type === 'direct' && data.participants.length !== 2) {
        throw new Error('Direct conversations must have exactly 2 participants');
      }

      // Create conversation
      const conversation = new ChatConversation({
        type: data.type,
        title: data.title,
        participants: data.participants.map(p => ({
          userId: new mongoose.Types.ObjectId(p.userId),
          role: p.role,
          joinedAt: new Date(),
        })),
        patientId: data.patientId ? new mongoose.Types.ObjectId(data.patientId) : undefined,
        prescriptionId: data.prescriptionId ? new mongoose.Types.ObjectId(data.prescriptionId) : undefined,
        workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
      });

      await conversation.save();

      // Send notifications to participants (except creator)
      const otherParticipants = users.filter(u => u._id.toString() !== data.createdBy);
      
      for (const participant of otherParticipants) {
        try {
          await notificationService.createNotification({
            userId: participant._id,
            type: 'conversation_invite',
            title: 'New Conversation',
            content: `You've been added to a new conversation: ${conversation.title}`,
            data: {
              conversationId: conversation._id,
              senderId: new mongoose.Types.ObjectId(data.createdBy),
            },
            priority: 'normal',
            deliveryChannels: {
              inApp: true,
              email: false,
              sms: false,
            },
            workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
            createdBy: new mongoose.Types.ObjectId(data.createdBy),
          });
        } catch (notifError) {
          logger.error('Failed to send conversation notification', {
            error: notifError,
            participantId: participant._id,
          });
        }
      }

      logger.info('Conversation created successfully', {
        conversationId: conversation._id,
        type: conversation.type,
      });

      return conversation;
    } catch (error) {
      logger.error('Error creating conversation', { error });
      throw error;
    }
  }

  /**
   * Get conversations for a user with filtering
   */
  async getConversations(
    userId: string,
    workplaceId: string,
    filters: ConversationFilters = {}
  ): Promise<IConversation[]> {
    try {
      logger.debug('Getting conversations', {
        userId,
        workplaceId,
        filters,
      });

      const query: any = {
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
        'participants.userId': new mongoose.Types.ObjectId(userId),
        'participants.leftAt': { $exists: false },
      };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      } else {
        query.status = { $ne: 'archived' }; // Default: exclude archived
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.isPinned !== undefined) {
        query.isPinned = filters.isPinned;
      }

      if (filters.patientId) {
        query.patientId = new mongoose.Types.ObjectId(filters.patientId);
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const conversations = await ChatConversation.find(query)
        .populate('participants.userId', 'firstName lastName role email')
        .populate('patientId', 'firstName lastName mrn')
        .populate('prescriptionId', 'medicationName')
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .lean();

      logger.debug('Conversations retrieved', {
        count: conversations.length,
        userId,
      });

      return conversations as IConversation[];
    } catch (error) {
      logger.error('Error getting conversations', { error, userId });
      throw error;
    }
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation | null> {
    try {
      const conversation = await ChatConversation.findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
        'participants.userId': new mongoose.Types.ObjectId(userId),
        'participants.leftAt': { $exists: false },
      })
        .populate('participants.userId', 'firstName lastName role email')
        .populate('patientId', 'firstName lastName mrn')
        .populate('prescriptionId', 'medicationName');

      if (!conversation) {
        logger.warn('Conversation not found or access denied', {
          conversationId,
          userId,
        });
        return null;
      }

      return conversation;
    } catch (error) {
      logger.error('Error getting conversation', { error, conversationId });
      throw error;
    }
  }

  /**
   * Update conversation details
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    workplaceId: string,
    updates: UpdateConversationDTO
  ): Promise<IConversation | null> {
    try {
      logger.info('Updating conversation', {
        conversationId,
        userId,
        updates,
      });

      // Get conversation and verify access
      const conversation = await this.getConversation(conversationId, userId, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Check if user has permission to update
      const userRole = conversation.getParticipantRole(new mongoose.Types.ObjectId(userId));
      
      if (!userRole || !['pharmacist', 'doctor', 'admin'].includes(userRole)) {
        throw new Error('Insufficient permissions to update conversation');
      }

      // Apply updates
      if (updates.title !== undefined) {
        conversation.title = updates.title;
      }

      if (updates.status !== undefined) {
        conversation.status = updates.status;
      }

      if (updates.isPinned !== undefined) {
        conversation.isPinned = updates.isPinned;
      }

      await conversation.save();

      logger.info('Conversation updated successfully', {
        conversationId,
        updates,
      });

      return conversation;
    } catch (error) {
      logger.error('Error updating conversation', { error, conversationId });
      throw error;
    }
  }

  /**
   * Pin a conversation
   */
  async pinConversation(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation | null> {
    return this.updateConversation(conversationId, userId, workplaceId, {
      isPinned: true,
    });
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation | null> {
    return this.updateConversation(conversationId, userId, workplaceId, {
      isPinned: false,
    });
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation | null> {
    return this.updateConversation(conversationId, userId, workplaceId, {
      status: 'archived',
    });
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation | null> {
    return this.updateConversation(conversationId, userId, workplaceId, {
      status: 'active',
    });
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    newUserId: string,
    role: 'pharmacist' | 'doctor' | 'patient' | 'admin',
    addedBy: string,
    workplaceId: string
  ): Promise<void> {
    try {
      logger.info('Adding participant to conversation', {
        conversationId,
        newUserId,
        role,
        addedBy,
      });

      // Get conversation
      const conversation = await this.getConversation(conversationId, addedBy, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Check if user adding participant has permission
      const adderRole = conversation.getParticipantRole(new mongoose.Types.ObjectId(addedBy));
      
      if (!adderRole || !['pharmacist', 'doctor', 'admin'].includes(adderRole)) {
        throw new Error('Insufficient permissions to add participants');
      }

      // Validate new user exists and belongs to workplace
      const newUser = await User.findOne({
        _id: new mongoose.Types.ObjectId(newUserId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      }).select('_id firstName lastName role');

      if (!newUser) {
        throw new Error('User not found or not in the same workplace');
      }

      // Add participant
      conversation.addParticipant(new mongoose.Types.ObjectId(newUserId), role);
      await conversation.save();

      // Send notification to new participant
      try {
        await notificationService.createNotification({
          userId: newUser._id,
          type: 'conversation_invite',
          title: 'Added to Conversation',
          content: `You've been added to: ${conversation.title}`,
          data: {
            conversationId: conversation._id,
            senderId: new mongoose.Types.ObjectId(addedBy),
          },
          priority: 'normal',
          deliveryChannels: {
            inApp: true,
            email: false,
            sms: false,
          },
          workplaceId: new mongoose.Types.ObjectId(workplaceId),
          createdBy: new mongoose.Types.ObjectId(addedBy),
        });
      } catch (notifError) {
        logger.error('Failed to send participant added notification', {
          error: notifError,
        });
      }

      logger.info('Participant added successfully', {
        conversationId,
        newUserId,
      });
    } catch (error) {
      logger.error('Error adding participant', { error, conversationId });
      throw error;
    }
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(
    conversationId: string,
    userIdToRemove: string,
    removedBy: string,
    workplaceId: string
  ): Promise<void> {
    try {
      logger.info('Removing participant from conversation', {
        conversationId,
        userIdToRemove,
        removedBy,
      });

      // Get conversation
      const conversation = await this.getConversation(conversationId, removedBy, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Check permissions (can remove self or if admin/pharmacist/doctor)
      const removerRole = conversation.getParticipantRole(new mongoose.Types.ObjectId(removedBy));
      
      if (
        userIdToRemove !== removedBy &&
        (!removerRole || !['pharmacist', 'doctor', 'admin'].includes(removerRole))
      ) {
        throw new Error('Insufficient permissions to remove participants');
      }

      // Remove participant
      conversation.removeParticipant(new mongoose.Types.ObjectId(userIdToRemove));
      await conversation.save();

      logger.info('Participant removed successfully', {
        conversationId,
        userIdToRemove,
      });
    } catch (error) {
      logger.error('Error removing participant', { error, conversationId });
      throw error;
    }
  }

  /**
   * Get conversations for a specific patient
   */
  async getPatientConversations(
    patientId: string,
    userId: string,
    workplaceId: string
  ): Promise<IConversation[]> {
    try {
      // Verify patient exists and user has access
      const patient = await Patient.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!patient) {
        throw new Error('Patient not found or access denied');
      }

      return this.getConversations(userId, workplaceId, {
        patientId,
        status: 'active',
      });
    } catch (error) {
      logger.error('Error getting patient conversations', { error, patientId });
      throw error;
    }
  }

  /**
   * Mark conversation as read for user
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId, userId, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      conversation.markAsRead(new mongoose.Types.ObjectId(userId));
      await conversation.save();

      logger.debug('Conversation marked as read', {
        conversationId,
        userId,
      });
    } catch (error) {
      logger.error('Error marking conversation as read', { error, conversationId });
      throw error;
    }
  }

  /**
   * Get unread count for user across all conversations
   */
  async getUnreadCount(userId: string, workplaceId: string): Promise<number> {
    try {
      const conversations = await this.getConversations(userId, workplaceId, {
        status: 'active',
      });

      const totalUnread = conversations.reduce((sum, conv) => {
        const unread = conv.unreadCounts.get(userId) || 0;
        return sum + unread;
      }, 0);

      return totalUnread;
    } catch (error) {
      logger.error('Error getting unread count', { error, userId });
      throw error;
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send a message in a conversation
   */
  async sendMessage(data: SendMessageDTO): Promise<IMessage> {
    try {
      logger.info('Sending message', {
        conversationId: data.conversationId,
        senderId: data.senderId,
        type: data.content.type,
      });

      // Validate conversation exists and user is participant
      const conversation = await this.getConversation(
        data.conversationId,
        data.senderId,
        data.workplaceId
      );

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Validate parent message if replying to thread
      if (data.parentMessageId) {
        const parentMessage = await ChatMessage.findOne({
          _id: new mongoose.Types.ObjectId(data.parentMessageId),
          conversationId: new mongoose.Types.ObjectId(data.conversationId),
        });

        if (!parentMessage) {
          throw new Error('Parent message not found');
        }
      }

      // Validate mentions are participants
      if (data.mentions && data.mentions.length > 0) {
        const mentionedUserIds = data.mentions.map(id => new mongoose.Types.ObjectId(id));
        const validMentions = mentionedUserIds.filter(mentionId =>
          conversation.hasParticipant(mentionId)
        );

        if (validMentions.length !== mentionedUserIds.length) {
          logger.warn('Some mentioned users are not participants', {
            conversationId: data.conversationId,
            mentions: data.mentions,
          });
        }
      }

      // Create message
      const message = new ChatMessage({
        conversationId: new mongoose.Types.ObjectId(data.conversationId),
        senderId: new mongoose.Types.ObjectId(data.senderId),
        content: data.content,
        threadId: data.threadId ? new mongoose.Types.ObjectId(data.threadId) : undefined,
        parentMessageId: data.parentMessageId ? new mongoose.Types.ObjectId(data.parentMessageId) : undefined,
        mentions: data.mentions?.map(id => new mongoose.Types.ObjectId(id)) || [],
        workplaceId: new mongoose.Types.ObjectId(data.workplaceId),
      });

      await message.save();

      // Populate sender data
      await message.populate('senderId', 'firstName lastName role email');

      // Handle mentions - send notifications
      if (data.mentions && data.mentions.length > 0) {
        await this.handleMentionNotifications(message, conversation);
      }

      logger.info('Message sent successfully', {
        messageId: message._id,
        conversationId: data.conversationId,
      });

      return message;
    } catch (error) {
      logger.error('Error sending message', { error });
      throw error;
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    workplaceId: string,
    filters: MessageFilters = {}
  ): Promise<IMessage[]> {
    try {
      logger.debug('Getting messages', {
        conversationId,
        userId,
        filters,
      });

      // Validate user is participant
      const conversation = await this.getConversation(conversationId, userId, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const query: any = {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        isDeleted: false,
      };

      if (filters.threadId) {
        query.threadId = new mongoose.Types.ObjectId(filters.threadId);
      }

      if (filters.before) {
        query.createdAt = { $lt: filters.before };
      }

      if (filters.after) {
        query.createdAt = { ...query.createdAt, $gt: filters.after };
      }

      const messages = await ChatMessage.find(query)
        .populate('senderId', 'firstName lastName role email')
        .populate('mentions', 'firstName lastName role')
        .populate('readBy.userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0);

      logger.debug('Messages retrieved', {
        count: messages.length,
        conversationId,
      });

      return messages;
    } catch (error) {
      logger.error('Error getting messages', { error, conversationId });
      throw error;
    }
  }

  /**
   * Edit a message (within 15-minute window)
   */
  async editMessage(
    messageId: string,
    userId: string,
    workplaceId: string,
    newContent: string
  ): Promise<IMessage> {
    try {
      logger.info('Editing message', {
        messageId,
        userId,
      });

      // Get message and verify ownership
      const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
        senderId: new mongoose.Types.ObjectId(userId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!message) {
        throw new Error('Message not found or not authorized to edit');
      }

      // Edit message (will throw if outside 15-minute window)
      message.edit(newContent);
      await message.save();

      // Populate sender data
      await message.populate('senderId', 'firstName lastName role email');

      logger.info('Message edited successfully', {
        messageId,
      });

      return message;
    } catch (error) {
      logger.error('Error editing message', { error, messageId });
      throw error;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    workplaceId: string
  ): Promise<void> {
    try {
      logger.info('Deleting message', {
        messageId,
        userId,
      });

      // Get message and verify ownership or admin permission
      const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is sender or has admin permission
      const conversation = await ChatConversation.findById(message.conversationId);
      const userRole = conversation?.getParticipantRole(new mongoose.Types.ObjectId(userId));

      const canDelete =
        message.senderId.toString() === userId ||
        (userRole && ['admin', 'pharmacist', 'doctor'].includes(userRole));

      if (!canDelete) {
        throw new Error('Not authorized to delete this message');
      }

      // Soft delete
      message.softDelete();
      await message.save();

      logger.info('Message deleted successfully', {
        messageId,
      });
    } catch (error) {
      logger.error('Error deleting message', { error, messageId });
      throw error;
    }
  }

  // ==================== REACTIONS AND READ RECEIPTS ====================

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string,
    userId: string,
    workplaceId: string,
    emoji: string
  ): Promise<IMessage> {
    try {
      logger.debug('Adding reaction', {
        messageId,
        userId,
        emoji,
      });

      // Get message and verify user has access
      const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Verify user is participant in conversation
      const conversation = await ChatConversation.findById(message.conversationId);
      
      if (!conversation?.hasParticipant(new mongoose.Types.ObjectId(userId))) {
        throw new Error('Not authorized to react to this message');
      }

      // Add reaction
      message.addReaction(new mongoose.Types.ObjectId(userId), emoji);
      await message.save();

      // Populate data
      await message.populate('senderId', 'firstName lastName role');

      logger.debug('Reaction added successfully', {
        messageId,
        emoji,
      });

      return message;
    } catch (error) {
      logger.error('Error adding reaction', { error, messageId });
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    workplaceId: string,
    emoji: string
  ): Promise<IMessage> {
    try {
      logger.debug('Removing reaction', {
        messageId,
        userId,
        emoji,
      });

      // Get message
      const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Remove reaction
      message.removeReaction(new mongoose.Types.ObjectId(userId), emoji);
      await message.save();

      // Populate data
      await message.populate('senderId', 'firstName lastName role');

      logger.debug('Reaction removed successfully', {
        messageId,
        emoji,
      });

      return message;
    } catch (error) {
      logger.error('Error removing reaction', { error, messageId });
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(
    messageId: string,
    userId: string,
    workplaceId: string
  ): Promise<void> {
    try {
      logger.debug('Marking message as read', {
        messageId,
        userId,
      });

      // Get message
      const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
        workplaceId: new mongoose.Types.ObjectId(workplaceId),
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Verify user is participant
      const conversation = await ChatConversation.findById(message.conversationId);
      
      if (!conversation?.hasParticipant(new mongoose.Types.ObjectId(userId))) {
        throw new Error('Not authorized to mark this message as read');
      }

      // Mark as read
      message.markAsRead(new mongoose.Types.ObjectId(userId));
      await message.save();

      // Update conversation unread count
      conversation.markAsRead(new mongoose.Types.ObjectId(userId));
      await conversation.save();

      logger.debug('Message marked as read', {
        messageId,
        userId,
      });
    } catch (error) {
      logger.error('Error marking message as read', { error, messageId });
      throw error;
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationMessagesAsRead(
    conversationId: string,
    userId: string,
    workplaceId: string
  ): Promise<void> {
    try {
      logger.debug('Marking all conversation messages as read', {
        conversationId,
        userId,
      });

      // Verify user is participant
      const conversation = await this.getConversation(conversationId, userId, workplaceId);

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Get all unread messages
      const messages = await ChatMessage.find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        isDeleted: false,
      });

      // Mark each as read
      for (const message of messages) {
        if (!message.isReadBy(new mongoose.Types.ObjectId(userId))) {
          message.markAsRead(new mongoose.Types.ObjectId(userId));
          await message.save();
        }
      }

      // Update conversation unread count
      conversation.markAsRead(new mongoose.Types.ObjectId(userId));
      await conversation.save();

      logger.debug('All messages marked as read', {
        conversationId,
        count: messages.length,
      });
    } catch (error) {
      logger.error('Error marking conversation messages as read', { error, conversationId });
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Handle mention notifications
   */
  private async handleMentionNotifications(
    message: IMessage,
    conversation: IConversation
  ): Promise<void> {
    try {
      const sender = await User.findById(message.senderId).select('firstName lastName');
      if (!sender) return;

      const senderName = `${sender.firstName} ${sender.lastName}`;
      const messagePreview = message.content.text?.substring(0, 100) || 'New message';

      for (const mentionedUserId of message.mentions) {
        // Skip if mentioning self
        if (mentionedUserId.toString() === message.senderId.toString()) continue;

        // Verify mentioned user is a participant
        if (!conversation.hasParticipant(mentionedUserId)) {
          logger.warn('Mentioned user is not a participant', {
            mentionedUserId,
            conversationId: conversation._id,
          });
          continue;
        }

        try {
          await notificationService.createNotification({
            userId: mentionedUserId,
            type: 'mention',
            title: `${senderName} mentioned you`,
            content: messagePreview,
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
            createdBy: message.senderId,
          });
        } catch (notifError) {
          logger.error('Failed to send mention notification', {
            error: notifError,
            mentionedUserId,
          });
        }
      }
    } catch (error) {
      logger.error('Error handling mention notifications', { error });
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
