"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWebhookController = exports.EmailWebhookController = void 0;
const emailDeliveryService_1 = require("../services/emailDeliveryService");
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
class EmailWebhookController {
    async handleResendWebhook(req, res) {
        try {
            if (process.env.RESEND_WEBHOOK_SECRET) {
                const signature = req.headers['resend-signature'];
                if (!this.verifyResendSignature(req.body, signature)) {
                    res.status(401).json({ error: 'Invalid signature' });
                    return;
                }
            }
            const { type, data } = req.body;
            switch (type) {
                case 'email.sent':
                    await this.handleEmailSent(data);
                    break;
                case 'email.delivered':
                    await this.handleEmailDelivered(data);
                    break;
                case 'email.bounced':
                    await this.handleEmailBounced(data);
                    break;
                case 'email.complained':
                    await this.handleEmailComplained(data);
                    break;
                default:
                    console.log(`Unhandled Resend webhook event: ${type}`);
            }
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('Error handling Resend webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async handleGenericWebhook(req, res) {
        try {
            const { messageId, status, metadata } = req.body;
            if (!messageId || !status) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            await emailDeliveryService_1.emailDeliveryService.updateDeliveryStatus(messageId, status, metadata);
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('Error handling generic email webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getDeliveryStats(req, res) {
        try {
            const { workspaceId } = req.query;
            const objectId = workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined;
            const stats = await emailDeliveryService_1.emailDeliveryService.getDeliveryStats(objectId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Error getting delivery stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get delivery statistics',
            });
        }
    }
    async getDeliveryHistory(req, res) {
        try {
            const { workspaceId, userId, status, templateName, limit = '50', offset = '0', } = req.query;
            const workspaceObjectId = workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined;
            const userObjectId = userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined;
            const history = await emailDeliveryService_1.emailDeliveryService.getDeliveryHistory({
                workspaceId: workspaceObjectId,
                userId: userObjectId,
                status: status,
                templateName: templateName,
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            console.error('Error getting delivery history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get delivery history',
            });
        }
    }
    async retryFailedEmail(req, res) {
        try {
            const { deliveryId } = req.params;
            await emailDeliveryService_1.emailDeliveryService.retryFailedDeliveries();
            res.json({
                success: true,
                message: 'Retry process initiated',
            });
        }
        catch (error) {
            console.error('Error retrying failed email:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retry email',
            });
        }
    }
    async handleEmailSent(data) {
        const { email_id: messageId } = data;
        if (messageId) {
            await emailDeliveryService_1.emailDeliveryService.updateDeliveryStatus(messageId, 'delivered');
        }
    }
    async handleEmailDelivered(data) {
        const { email_id: messageId } = data;
        if (messageId) {
            await emailDeliveryService_1.emailDeliveryService.updateDeliveryStatus(messageId, 'delivered', {
                deliveredAt: new Date(),
                providerData: data,
            });
        }
    }
    async handleEmailBounced(data) {
        const { email_id: messageId, bounce } = data;
        if (messageId) {
            await emailDeliveryService_1.emailDeliveryService.updateDeliveryStatus(messageId, 'bounced', {
                bounceReason: bounce?.reason,
                bounceType: bounce?.type,
                providerData: data,
            });
        }
    }
    async handleEmailComplained(data) {
        const { email_id: messageId } = data;
        if (messageId) {
            await emailDeliveryService_1.emailDeliveryService.updateDeliveryStatus(messageId, 'complained', {
                complaintDate: new Date(),
                providerData: data,
            });
        }
    }
    verifyResendSignature(payload, signature) {
        try {
            const secret = process.env.RESEND_WEBHOOK_SECRET;
            if (!secret)
                return true;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('Error verifying Resend signature:', error);
            return false;
        }
    }
}
exports.EmailWebhookController = EmailWebhookController;
exports.emailWebhookController = new EmailWebhookController();
//# sourceMappingURL=emailWebhookController.js.map