"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailDeliveryService = exports.EmailDeliveryService = void 0;
const EmailDelivery_1 = require("../models/EmailDelivery");
const emailService_1 = require("../utils/emailService");
class EmailDeliveryService {
    constructor() {
        this.emailService = emailService_1.emailService;
    }
    async sendTrackedEmail(options, emailContent) {
        const deliveryRecord = new EmailDelivery_1.EmailDelivery({
            messageId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            provider: 'pending',
            to: options.to,
            subject: options.subject,
            templateName: options.templateName,
            workspaceId: options.workspaceId,
            userId: options.userId,
            relatedEntity: options.relatedEntity,
            metadata: options.metadata,
            maxRetries: options.maxRetries || 3,
        });
        try {
            await deliveryRecord.save();
            const result = await this.emailService.sendEmail({
                to: options.to,
                subject: options.subject,
                html: emailContent.html,
                text: emailContent.text || '',
            });
            if (result.success) {
                await deliveryRecord.markAsSent(result.messageId);
                deliveryRecord.provider = result.provider || 'nodemailer';
                await deliveryRecord.save();
                return {
                    success: true,
                    messageId: result.messageId,
                    provider: result.provider || 'nodemailer',
                    deliveryRecord,
                };
            }
            else {
                await deliveryRecord.markAsFailed(result.error || 'Unknown error');
                return {
                    success: false,
                    error: result.error,
                    deliveryRecord,
                };
            }
        }
        catch (error) {
            await deliveryRecord.markAsFailed(error.message);
            return {
                success: false,
                error: error.message,
                deliveryRecord,
            };
        }
    }
    async retryFailedDeliveries() {
        try {
            const pendingRetries = await EmailDelivery_1.EmailDelivery.findPendingRetries();
            console.log(`Found ${pendingRetries.length} emails pending retry`);
            for (const delivery of pendingRetries) {
                try {
                    if (!delivery.metadata?.emailContent) {
                        console.warn(`No email content found for delivery ${delivery._id}, skipping retry`);
                        continue;
                    }
                    const result = await this.emailService.sendEmail({
                        to: delivery.to,
                        subject: delivery.subject,
                        html: delivery.metadata.emailContent.html,
                        text: delivery.metadata.emailContent.text,
                    });
                    if (result.success) {
                        await delivery.markAsSent(result.messageId);
                        delivery.provider = result.provider || 'nodemailer';
                        await delivery.save();
                        console.log(`Successfully retried email delivery ${delivery._id}`);
                    }
                    else {
                        await delivery.markAsFailed(result.error || 'Retry failed');
                        console.error(`Failed to retry email delivery ${delivery._id}:`, result.error);
                    }
                }
                catch (error) {
                    await delivery.markAsFailed(error.message);
                    console.error(`Error retrying email delivery ${delivery._id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error in retryFailedDeliveries:', error);
        }
    }
    async updateDeliveryStatus(messageId, status, metadata) {
        try {
            const delivery = await EmailDelivery_1.EmailDelivery.findOne({ messageId });
            if (!delivery) {
                console.warn(`No delivery record found for messageId: ${messageId}`);
                return;
            }
            switch (status) {
                case 'delivered':
                    await delivery.markAsDelivered();
                    break;
                case 'bounced':
                    await delivery.markAsBounced();
                    break;
                case 'complained':
                    await delivery.markAsComplained();
                    break;
            }
            if (metadata) {
                delivery.metadata = { ...delivery.metadata, ...metadata };
                await delivery.save();
            }
            console.log(`Updated delivery status for ${messageId} to ${status}`);
        }
        catch (error) {
            console.error(`Error updating delivery status for ${messageId}:`, error);
        }
    }
    async getDeliveryStats(workspaceId) {
        try {
            const stats = await EmailDelivery_1.EmailDelivery.getDeliveryStats(workspaceId);
            return stats[0] || { total: 0, stats: [] };
        }
        catch (error) {
            console.error('Error getting delivery stats:', error);
            return { total: 0, stats: [] };
        }
    }
    async getDeliveryHistory(filters) {
        try {
            const query = {};
            if (filters.workspaceId)
                query.workspaceId = filters.workspaceId;
            if (filters.userId)
                query.userId = filters.userId;
            if (filters.status)
                query.status = filters.status;
            if (filters.templateName)
                query.templateName = filters.templateName;
            return await EmailDelivery_1.EmailDelivery.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 50)
                .skip(filters.offset || 0)
                .exec();
        }
        catch (error) {
            console.error('Error getting delivery history:', error);
            return [];
        }
    }
    async cleanupOldRecords(daysOld = 90) {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            const result = await EmailDelivery_1.EmailDelivery.deleteMany({
                createdAt: { $lt: cutoffDate },
                status: { $in: ['delivered', 'failed', 'bounced', 'complained'] },
            });
            console.log(`Cleaned up ${result.deletedCount} old email delivery records`);
        }
        catch (error) {
            console.error('Error cleaning up old delivery records:', error);
        }
    }
    async handleBouncedEmails() {
        try {
            const bouncedEmails = await EmailDelivery_1.EmailDelivery.find({
                status: 'bounced',
                'metadata.bounceHandled': { $ne: true },
            });
            for (const delivery of bouncedEmails) {
                console.log(`Handling bounced email for: ${delivery.to}`);
                delivery.metadata = { ...delivery.metadata, bounceHandled: true };
                await delivery.save();
            }
        }
        catch (error) {
            console.error('Error handling bounced emails:', error);
        }
    }
    async sendTemplateEmail(templateName, templateVariables, options) {
        try {
            const template = await this.emailService.loadTemplate(templateName, templateVariables);
            const enhancedOptions = {
                ...options,
                templateName,
                metadata: {
                    ...options.metadata,
                    templateVariables,
                    emailContent: {
                        html: template.html,
                        text: template.text,
                    },
                },
            };
            return await this.sendTrackedEmail(enhancedOptions, {
                html: template.html,
                text: template.text,
            });
        }
        catch (error) {
            console.error(`Error sending template email ${templateName}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.EmailDeliveryService = EmailDeliveryService;
exports.emailDeliveryService = new EmailDeliveryService();
//# sourceMappingURL=emailDeliveryService.js.map