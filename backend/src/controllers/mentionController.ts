import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { IUser } from '../models/User';
import { IConversation } from '../models/Conversation';
import { IMessage } from '../models/Message';

interface AuthenticatedRequest extends Request {
    user?: IUser;
    workplaceId?: mongoose.Types.ObjectId;
}

/**
 * Get user suggestions for mentions with role-based filtering
 */
export const getUserSuggestions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { query, limit = 10 } = req.query;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;

        if (!workplaceId) {
            return res.status(400).json({
                success: false,
                message: 'Workplace context required',
            });
        }

        // Verify user has access to the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            workplaceId,
            'participants.userId': currentUserId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
            });
        }

        // Build user search query
        const searchQuery: any = {
            workplaceId,
            isDeleted: false,
            _id: { $ne: currentUserId }, // Exclude current user
        };

        // Add text search if query provided
        if (query && typeof query === 'string') {
            const searchRegex = new RegExp(query, 'i');
            searchQuery.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
            ];
        }

        // Role-based filtering based on conversation context
        const allowedRoles = ['pharmacist', 'doctor'];

        // For patient queries, include the patient
        if (conversation.type === 'patient_query' && conversation.patientId) {
            const patient = await User.findById(conversation.patientId);
            if (patient) {
                allowedRoles.push('patient');
            }
        }

        searchQuery.role = { $in: allowedRoles };

        // Get users with pagination
        const users = await User.find(searchQuery)
            .select('firstName lastName email role avatar')
            .limit(Number(limit))
            .sort({ firstName: 1, lastName: 1 });

        // Format response
        const suggestions = users.map(user => ({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            displayName: `${user.firstName} ${user.lastName}`,
            subtitle: `${user.role} • ${user.email}`,
        }));

        res.json({
            success: true,
            data: suggestions,
        });
    } catch (error) {
        console.error('Error getting user suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user suggestions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Search messages by mentions
 */
export const searchMessagesByMentions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { userId, limit = 50, page = 1 } = req.query;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;

        if (!workplaceId) {
            return res.status(400).json({
                success: false,
                message: 'Workplace context required',
            });
        }

        // Verify user has access to the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            workplaceId,
            'participants.userId': currentUserId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
            });
        }

        // Build search query
        const searchQuery: any = {
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        };

        // Filter by specific user if provided
        if (userId && typeof userId === 'string') {
            searchQuery.mentions = userId;
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Get messages with mentions
        const messages = await Message.find(searchQuery)
            .populate('senderId', 'firstName lastName role email avatar')
            .populate('mentions', 'firstName lastName role email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Get total count for pagination
        const total = await Message.countDocuments(searchQuery);

        // Format response
        const formattedMessages = messages.map(message => ({
            _id: message._id,
            conversationId: message.conversationId,
            senderId: message.senderId._id,
            sender: {
                _id: message.senderId._id,
                firstName: message.senderId.firstName,
                lastName: message.senderId.lastName,
                role: message.senderId.role,
                email: message.senderId.email,
                avatar: message.senderId.avatar,
            },
            content: {
                text: message.content.text,
                type: message.content.type,
            },
            mentions: message.mentions.map((m: any) => m._id),
            mentionedUsers: message.mentions.map((m: any) => ({
                _id: m._id,
                firstName: m.firstName,
                lastName: m.lastName,
                role: m.role,
                email: m.email,
                avatar: m.avatar,
            })),
            priority: message.priority,
            createdAt: message.createdAt,
        }));

        res.json({
            success: true,
            data: {
                messages: formattedMessages,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Error searching messages by mentions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search messages by mentions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Get mention statistics for a conversation
 */
export const getMentionStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;

        if (!workplaceId) {
            return res.status(400).json({
                success: false,
                message: 'Workplace context required',
            });
        }

        // Verify user has access to the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            workplaceId,
            'participants.userId': currentUserId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
            });
        }

        // Get total mention count
        const totalMentions = await Message.countDocuments({
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        });

        // Get mentions by user (aggregation)
        const mentionsByUser = await Message.aggregate([
            {
                $match: {
                    conversationId: new mongoose.Types.ObjectId(conversationId),
                    mentions: { $exists: true, $ne: [] },
                    isDeleted: false,
                },
            },
            {
                $unwind: '$mentions',
            },
            {
                $group: {
                    _id: '$mentions',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $project: {
                    userId: '$_id',
                    count: 1,
                    userName: {
                        $concat: ['$user.firstName', ' ', '$user.lastName'],
                    },
                },
            },
        ]);

        // Get recent mentions
        const recentMentions = await Message.find({
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        })
            .populate('senderId', 'firstName lastName')
            .populate('mentions', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('_id senderId mentions createdAt');

        // Format mentions by user
        const mentionsByUserMap = mentionsByUser.reduce((acc, item) => {
            acc[item.userId.toString()] = item.count;
            return acc;
        }, {} as Record<string, number>);

        // Format recent mentions
        const formattedRecentMentions = recentMentions.map(message => ({
            messageId: message._id,
            senderId: message.senderId._id,
            mentionedUsers: message.mentions.map((m: any) => m._id),
            timestamp: message.createdAt,
        }));

        res.json({
            success: true,
            data: {
                totalMentions,
                mentionsByUser: mentionsByUserMap,
                recentMentions: formattedRecentMentions,
            },
        });
    } catch (error) {
        console.error('Error getting mention stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mention statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Get users mentioned in a conversation
 */
export const getMentionedUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user?._id;
        const workplaceId = req.workplaceId;

        if (!workplaceId) {
            return res.status(400).json({
                success: false,
                message: 'Workplace context required',
            });
        }

        // Verify user has access to the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            workplaceId,
            'participants.userId': currentUserId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
            });
        }

        // Get unique mentioned users
        const mentionedUserIds = await Message.distinct('mentions', {
            conversationId,
            mentions: { $exists: true, $ne: [] },
            isDeleted: false,
        });

        // Get user details
        const users = await User.find({
            _id: { $in: mentionedUserIds },
            isDeleted: false,
        }).select('firstName lastName role email avatar');

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    email: user.email,
                    avatar: user.avatar,
                })),
            },
        });
    } catch (error) {
        console.error('Error getting mentioned users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mentioned users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Create mention notifications
 */
export const createMentionNotifications = async (
    messageId: mongoose.Types.ObjectId,
    conversationId: mongoose.Types.ObjectId,
    senderId: mongoose.Types.ObjectId,
    mentionedUserIds: mongoose.Types.ObjectId[],
    messageContent: string,
    priority: 'normal' | 'urgent' = 'normal'
) => {
    try {
        const Notification = mongoose.model('Notification');

        // Get sender info
        const sender = await User.findById(senderId).select('firstName lastName');
        if (!sender) return;

        const senderName = `${sender.firstName} ${sender.lastName}`;

        // Create notifications for each mentioned user
        const notifications = mentionedUserIds
            .filter(userId => !userId.equals(senderId)) // Don't notify sender
            .map(userId => ({
                userId,
                type: 'mention',
                title: `${senderName} mentioned you`,
                content: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
                data: {
                    conversationId,
                    messageId,
                    senderId,
                    actionUrl: `/communication/${conversationId}?message=${messageId}`,
                },
                priority,
                deliveryChannels: {
                    inApp: true,
                    email: priority === 'urgent',
                    sms: false,
                },
                workplaceId: req.workplaceId,
            }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        return notifications;
    } catch (error) {
        console.error('Error creating mention notifications:', error);
        throw error;
    }
};