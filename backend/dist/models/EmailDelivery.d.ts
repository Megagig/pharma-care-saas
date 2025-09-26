import mongoose, { Document } from 'mongoose';
export interface IEmailDelivery extends Document {
    messageId: string;
    provider: 'resend' | 'nodemailer' | 'simulation';
    to: string;
    subject: string;
    templateName?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
    sentAt?: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    error?: string;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
    workspaceId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    relatedEntity?: {
        type: 'invitation' | 'subscription' | 'user' | 'workspace';
        id: mongoose.Types.ObjectId;
    };
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    markAsSent(messageId?: string): Promise<IEmailDelivery>;
    markAsDelivered(): Promise<IEmailDelivery>;
    markAsFailed(error: string): Promise<IEmailDelivery>;
    markAsBounced(): Promise<IEmailDelivery>;
    markAsComplained(): Promise<IEmailDelivery>;
}
export interface IEmailDeliveryModel extends mongoose.Model<IEmailDelivery> {
    findPendingRetries(): Promise<IEmailDelivery[]>;
    getDeliveryStats(workspaceId?: mongoose.Types.ObjectId): Promise<any>;
}
export declare const EmailDelivery: IEmailDeliveryModel;
//# sourceMappingURL=EmailDelivery.d.ts.map