import { IEmailDelivery } from '../models/EmailDelivery';
import mongoose from 'mongoose';
interface EmailDeliveryOptions {
    to: string;
    subject: string;
    templateName?: string;
    workspaceId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    relatedEntity?: {
        type: 'invitation' | 'subscription' | 'user' | 'workspace';
        id: mongoose.Types.ObjectId;
    };
    metadata?: Record<string, any>;
    maxRetries?: number;
}
export interface EmailDeliveryResult {
    success: boolean;
    messageId?: string;
    provider?: string;
    error?: string;
    deliveryRecord?: IEmailDelivery;
}
export declare class EmailDeliveryService {
    private emailService;
    sendTrackedEmail(options: EmailDeliveryOptions, emailContent: {
        html: string;
        text?: string;
    }): Promise<EmailDeliveryResult>;
    retryFailedDeliveries(): Promise<void>;
    updateDeliveryStatus(messageId: string, status: 'delivered' | 'bounced' | 'complained', metadata?: Record<string, any>): Promise<void>;
    getDeliveryStats(workspaceId?: mongoose.Types.ObjectId): Promise<any>;
    getDeliveryHistory(filters: {
        workspaceId?: mongoose.Types.ObjectId;
        userId?: mongoose.Types.ObjectId;
        status?: string;
        templateName?: string;
        limit?: number;
        offset?: number;
    }): Promise<IEmailDelivery[]>;
    cleanupOldRecords(daysOld?: number): Promise<void>;
    handleBouncedEmails(): Promise<void>;
    sendTemplateEmail(templateName: string, templateVariables: Record<string, any>, options: EmailDeliveryOptions): Promise<EmailDeliveryResult>;
}
export declare const emailDeliveryService: EmailDeliveryService;
export {};
//# sourceMappingURL=emailDeliveryService.d.ts.map