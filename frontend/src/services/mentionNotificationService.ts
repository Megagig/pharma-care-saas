import { socketService } from './socketService';
import { notificationService } from './notificationService';

export interface MentionNotificationData {
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    mentionedUserIds: string[];
    messageContent: string;
    conversationTitle?: string;
    priority: 'normal' | 'urgent';
}

class MentionNotificationService {
    /**
     * Send notifications to mentioned users
     */
    async sendMentionNotifications(data: MentionNotificationData): Promise<void> {
        try {
            const {
                messageId,
                conversationId,
                senderId,
                senderName,
                mentionedUserIds,
                messageContent,
                conversationTitle,
                priority,
            } = data;

            // Create notifications for each mentioned user
            const notifications = mentionedUserIds.map((userId) => ({
                userId,
                type: 'mention' as const,
                title: `${senderName} mentioned you`,
                content: this.truncateMessage(messageContent, 100),
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
            }));

            // Send notifications via API
            await Promise.all(
                notifications.map((notification) =>
                    this.createNotification(notification)
                )
            );

            // Send real-time notifications via Socket.IO
            mentionedUserIds.forEach((userId) => {
                socketService.sendNotification(userId, {
                    type: 'mention',
                    title: `${senderName} mentioned you`,
                    content: this.truncateMessage(messageContent, 100),
                    data: {
                        conversationId,
                        messageId,
                        senderId,
                    },
                    priority,
                });
            });

            console.log(`Mention notifications sent to ${mentionedUserIds.length} users`);
        } catch (error) {
            console.error('Failed to send mention notifications:', error);
            throw error;
        }
    }

    /**
     * Create a notification via API
     */
    private async createNotification(notificationData: any): Promise<void> {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(notificationData),
            });

            if (!response.ok) {
                throw new Error(`Failed to create notification: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Handle mention in message
     */
    async handleMessageMention(
        messageId: string,
        conversationId: string,
        senderId: string,
        senderName: string,
        messageContent: string,
        mentions: string[],
        priority: 'normal' | 'urgent' = 'normal'
    ): Promise<void> {
        if (!mentions || mentions.length === 0) {
            return;
        }

        // Filter out the sender from mentions (don't notify yourself)
        const filteredMentions = mentions.filter((userId) => userId !== senderId);

        if (filteredMentions.length === 0) {
            return;
        }

        await this.sendMentionNotifications({
            messageId,
            conversationId,
            senderId,
            senderName,
            mentionedUserIds: filteredMentions,
            messageContent,
            priority,
        });
    }

    /**
     * Get mention statistics for a conversation
     */
    async getMentionStats(conversationId: string): Promise<{
        totalMentions: number;
        mentionsByUser: Record<string, number>;
        recentMentions: Array<{
            messageId: string;
            senderId: string;
            mentionedUsers: string[];
            timestamp: string;
        }>;
    }> {
        try {
            const response = await fetch(
                `/api/conversations/${conversationId}/mentions/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch mention stats: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching mention stats:', error);
            return {
                totalMentions: 0,
                mentionsByUser: {},
                recentMentions: [],
            };
        }
    }

    /**
     * Search messages by mentions
     */
    async searchMessagesByMentions(
        conversationId: string,
        userId?: string,
        limit: number = 50
    ): Promise<any[]> {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                ...(userId && { userId }),
            });

            const response = await fetch(
                `/api/conversations/${conversationId}/messages/mentions?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to search mentions: ${response.statusText}`);
            }

            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('Error searching messages by mentions:', error);
            return [];
        }
    }

    /**
     * Get users mentioned in a conversation
     */
    async getMentionedUsers(conversationId: string): Promise<any[]> {
        try {
            const response = await fetch(
                `/api/conversations/${conversationId}/mentions/users`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch mentioned users: ${response.statusText}`);
            }

            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('Error fetching mentioned users:', error);
            return [];
        }
    }

    /**
     * Mark mention notification as read
     */
    async markMentionAsRead(notificationId: string): Promise<void> {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to mark mention as read: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error marking mention as read:', error);
            throw error;
        }
    }

    /**
     * Truncate message content for notifications
     */
    private truncateMessage(content: string, maxLength: number): string {
        if (!content) return '';

        // Remove mention markup for notification display
        const cleanContent = content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');

        if (cleanContent.length <= maxLength) {
            return cleanContent;
        }

        return cleanContent.substring(0, maxLength - 3) + '...';
    }

    /**
     * Extract mentioned user IDs from message text
     */
    extractMentionsFromText(text: string): string[] {
        if (!text) return [];

        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[2]); // Extract user ID
        }

        return mentions;
    }

    /**
     * Validate mention format
     */
    validateMentionFormat(text: string): boolean {
        if (!text) return true;

        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const matches = text.match(mentionRegex);

        if (!matches) return true;

        // Check if all mentions have valid format
        return matches.every((match) => {
            const parts = match.match(/@\[([^\]]+)\]\(([^)]+)\)/);
            return parts && parts[1] && parts[2];
        });
    }
}

export const mentionNotificationService = new MentionNotificationService();