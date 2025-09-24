import mongoose, { Document } from 'mongoose';
export interface INotificationData {
    conversationId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    interventionId?: mongoose.Types.ObjectId;
    actionUrl?: string;
    metadata?: Record<string, any>;
}
export interface INotificationDeliveryChannels {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
}
export interface INotificationDeliveryStatus {
    channel: 'inApp' | 'email' | 'sms' | 'push';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    attempts: number;
    lastAttemptAt?: Date;
}
export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'new_message' | 'mention' | 'therapy_update' | 'clinical_alert' | 'conversation_invite' | 'file_shared' | 'intervention_assigned' | 'patient_query' | 'urgent_message' | 'system_notification';
    title: string;
    content: string;
    data: INotificationData;
    priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
    status: 'unread' | 'read' | 'dismissed' | 'archived';
    deliveryChannels: INotificationDeliveryChannels;
    deliveryStatus: INotificationDeliveryStatus[];
    scheduledFor?: Date;
    sentAt?: Date;
    readAt?: Date;
    dismissedAt?: Date;
    groupKey?: string;
    batchId?: string;
    expiresAt?: Date;
    workplaceId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    markAsRead(): void;
    markAsDismissed(): void;
    updateDeliveryStatus(channel: string, status: string, details?: any): void;
    isExpired(): boolean;
    canRetryDelivery(channel: string): boolean;
    getDeliveryStatusForChannel(channel: string): INotificationDeliveryStatus | null;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map