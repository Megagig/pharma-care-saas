import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { INotification, INotificationData, INotificationDeliveryChannels } from '../models/Notification';
export interface CreateNotificationData {
    userId: mongoose.Types.ObjectId;
    type: INotification['type'];
    title: string;
    content: string;
    data: INotificationData;
    priority?: INotification['priority'];
    deliveryChannels?: Partial<INotificationDeliveryChannels>;
    scheduledFor?: Date;
    expiresAt?: Date;
    groupKey?: string;
    workplaceId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
}
export interface NotificationFilters {
    type?: INotification['type'];
    status?: INotification['status'];
    priority?: INotification['priority'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export interface NotificationPreferences {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    newMessage: boolean;
    mentions: boolean;
    conversationInvites: boolean;
    patientQueries: boolean;
    urgentMessages: boolean;
    therapyUpdates: boolean;
    clinicalAlerts: boolean;
    interventionAssignments: boolean;
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    batchDigest: boolean;
    digestFrequency: 'hourly' | 'daily' | 'weekly';
}
export interface NotificationTemplate {
    subject: string;
    content: string;
    htmlTemplate?: string;
    smsTemplate?: string;
    variables: Record<string, any>;
}
declare class NotificationService {
    private io;
    private templates;
    constructor();
    setSocketServer(io: SocketIOServer): void;
    createNotification(data: CreateNotificationData): Promise<INotification>;
    sendRealTimeNotification(userId: string, notification: INotification): Promise<void>;
    sendEmailNotification(userId: string, notification: INotification): Promise<void>;
    sendSMSNotification(userId: string, notification: INotification): Promise<void>;
    deliverNotification(notification: INotification): Promise<void>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    getUserNotifications(userId: string, workplaceId: string, filters?: NotificationFilters): Promise<{
        notifications: INotification[];
        total: number;
        unreadCount: number;
    }>;
    processScheduledNotifications(): Promise<void>;
    createConversationNotification(type: 'new_message' | 'mention' | 'conversation_invite', conversationId: string, senderId: string, recipientIds: string[], messageId?: string, customContent?: string): Promise<INotification[]>;
    createPatientQueryNotification(patientId: string, conversationId: string, messageContent: string, recipientIds: string[]): Promise<INotification[]>;
    updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
    getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
    retryFailedNotifications(): Promise<void>;
    private getUserPreferences;
    private applyUserPreferences;
    private isInQuietHours;
    private getNextAvailableTime;
    private getUserSockets;
    private initializeTemplates;
    private getNotificationTemplate;
    private getConversationNotificationTemplate;
}
export declare const notificationService: NotificationService;
export default notificationService;
//# sourceMappingURL=notificationService.d.ts.map