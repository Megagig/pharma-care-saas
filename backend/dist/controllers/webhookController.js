"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = exports.WebhookController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const emailService_1 = require("../utils/emailService");
const logger_1 = __importDefault(require("../utils/logger"));
class WebhookController {
    async handlePaystackWebhook(req, res) {
        try {
            const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
            if (!webhookSecret) {
                logger_1.default.error('PAYSTACK_WEBHOOK_SECRET is not configured');
                res
                    .status(500)
                    .json({ success: false, message: 'Webhook secret not configured' });
                return;
            }
            const signature = req.headers['x-paystack-signature'];
            if (!signature) {
                logger_1.default.error('Missing Paystack webhook signature');
                res.status(400).json({ success: false, message: 'Missing signature' });
                return;
            }
            const isValid = this.verifyPaystackSignature(webhookSecret, signature, req.body);
            if (!isValid) {
                logger_1.default.error('Invalid Paystack webhook signature');
                res.status(401).json({ success: false, message: 'Invalid signature' });
                return;
            }
            const event = req.body;
            logger_1.default.info(`Processing Paystack webhook: ${event.event}`, {
                eventId: event.id,
                eventType: event.event,
            });
            switch (event.event) {
                case 'charge.success':
                    await this.handlePaystackSuccessfulCharge(event.data);
                    break;
                case 'subscription.create':
                    await this.handlePaystackSubscriptionCreated(event.data);
                    break;
                case 'subscription.disable':
                    await this.handlePaystackSubscriptionDisabled(event.data);
                    break;
                case 'invoice.create':
                    await this.handlePaystackInvoiceCreated(event.data);
                    break;
                default:
                    logger_1.default.info(`Unhandled Paystack webhook event type: ${event.event}`);
            }
            res.status(200).json({ success: true, message: 'Webhook processed' });
        }
        catch (error) {
            logger_1.default.error('Error processing Paystack webhook', {
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({
                success: false,
                message: 'Error processing webhook',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async handleNombaWebhook(req, res) {
        try {
            const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;
            if (!webhookSecret) {
                logger_1.default.error('NOMBA_WEBHOOK_SECRET is not configured');
                res
                    .status(500)
                    .json({ success: false, message: 'Webhook secret not configured' });
                return;
            }
            const signature = req.headers['nomba-signature'];
            if (!signature) {
                logger_1.default.error('Missing webhook signature');
                res.status(400).json({ success: false, message: 'Missing signature' });
                return;
            }
            const isValid = this.verifyNombaSignature(webhookSecret, signature, JSON.stringify(req.body));
            if (!isValid) {
                logger_1.default.error('Invalid webhook signature');
                res.status(401).json({ success: false, message: 'Invalid signature' });
                return;
            }
            const event = req.body;
            logger_1.default.info(`Processing Nomba webhook: ${event.type}`, {
                eventId: event.id,
                eventType: event.type,
            });
            switch (event.type) {
                case 'payment.successful':
                    await this.handleSuccessfulPayment(event);
                    break;
                case 'payment.failed':
                    await this.handleFailedPayment(event);
                    break;
                case 'subscription.created':
                case 'subscription.renewed':
                    await this.handleSubscriptionCreatedOrRenewed(event);
                    break;
                case 'subscription.canceled':
                    await this.handleSubscriptionCanceled(event);
                    break;
                case 'subscription.expiring_soon':
                    await this.handleSubscriptionExpiringSoon(event);
                    break;
                default:
                    logger_1.default.info(`Unhandled webhook event type: ${event.type}`);
            }
            res.status(200).json({ success: true, message: 'Webhook processed' });
        }
        catch (error) {
            logger_1.default.error('Error processing webhook', {
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({
                success: false,
                message: 'Error processing webhook',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    verifyNombaSignature(secret, signature, payload) {
        const hmac = crypto_1.default.createHmac('sha256', secret);
        const calculatedSignature = hmac.update(payload).digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature));
    }
    async handleSuccessfulPayment(event) {
        try {
            const { reference, amount, metadata, customer } = event.data;
            const userId = metadata?.userId;
            const subscriptionId = metadata?.subscriptionId;
            if (!userId) {
                logger_1.default.error('Missing userId in payment metadata', { reference });
                return;
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                logger_1.default.error('User not found for payment', { userId, reference });
                return;
            }
            const payment = await Payment_1.default.create({
                userId: user._id,
                subscriptionId,
                reference,
                amount: amount / 100,
                currency: 'NGN',
                status: 'successful',
                provider: 'nomba',
                providerFee: event.data.fees || 0,
                metadata: {
                    eventId: event.id,
                    customerEmail: customer?.email,
                    customerName: customer?.name,
                },
            });
            logger_1.default.info('Payment recorded successfully', {
                paymentId: payment._id,
                userId,
                reference,
            });
            if (subscriptionId) {
                const subscription = await Subscription_1.default.findById(subscriptionId);
                if (subscription) {
                    subscription.status = 'active';
                    subscription.paymentHistory.push(payment._id);
                    subscription.webhookEvents.push({
                        eventId: event.id,
                        eventType: event.type,
                        processedAt: new Date(),
                        data: event.data,
                    });
                    await subscription.save();
                    logger_1.default.info('Subscription updated after payment', {
                        subscriptionId,
                        status: 'active',
                    });
                    await emailService_1.emailService.sendEmail({
                        to: user.email,
                        subject: 'Payment Received',
                        text: `Dear ${user.firstName}, your payment of ₦${amount / 100} has been received and your subscription is now active.`,
                        html: `
              <h2>Payment Successful</h2>
              <p>Dear ${user.firstName},</p>
              <p>Your payment of <strong>₦${amount / 100}</strong> has been received.</p>
              <p>Your subscription is now active until ${new Date(subscription.endDate).toLocaleDateString()}.</p>
              <p>Thank you for using PharmaCareSaaS!</p>
            `,
                    });
                }
                else {
                    logger_1.default.error('Subscription not found for payment', {
                        subscriptionId,
                        userId,
                        reference,
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error processing successful payment webhook', {
                error: error.message,
                eventId: event.id,
            });
        }
    }
    async handleFailedPayment(event) {
        try {
            const { reference, amount, metadata, customer, failureReason } = event.data;
            const userId = metadata?.userId;
            const subscriptionId = metadata?.subscriptionId;
            if (!userId) {
                logger_1.default.error('Missing userId in payment metadata', { reference });
                return;
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                logger_1.default.error('User not found for failed payment', {
                    userId,
                    reference,
                });
                return;
            }
            await Payment_1.default.create({
                userId: user._id,
                subscriptionId,
                reference,
                amount: amount / 100,
                currency: 'NGN',
                status: 'failed',
                provider: 'nomba',
                failureReason,
                metadata: {
                    eventId: event.id,
                    customerEmail: customer?.email,
                    customerName: customer?.name,
                },
            });
            if (subscriptionId) {
                const subscription = await Subscription_1.default.findById(subscriptionId);
                if (subscription) {
                    subscription.renewalAttempts.push({
                        attemptedAt: new Date(),
                        successful: false,
                        error: failureReason,
                    });
                    subscription.webhookEvents.push({
                        eventId: event.id,
                        eventType: event.type,
                        processedAt: new Date(),
                        data: event.data,
                    });
                    await subscription.save();
                    await emailService_1.emailService.sendEmail({
                        to: user.email,
                        subject: 'Payment Failed',
                        text: `Dear ${user.firstName}, your payment of ₦${amount / 100} has failed. Reason: ${failureReason}. Please update your payment method to avoid service interruption.`,
                        html: `
              <h2>Payment Failed</h2>
              <p>Dear ${user.firstName},</p>
              <p>Your payment of <strong>₦${amount / 100}</strong> has failed.</p>
              <p><strong>Reason:</strong> ${failureReason}</p>
              <p>Please update your payment method to avoid service interruption.</p>
              <p><a href="${process.env.FRONTEND_URL}/subscription-management">Manage your subscription</a></p>
            `,
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error processing failed payment webhook', {
                error: error.message,
                eventId: event.id,
            });
        }
    }
    async handleSubscriptionCreatedOrRenewed(event) {
        try {
            const { subscriptionId, userId, planId, startDate, endDate, status } = event.data;
            const user = await User_1.default.findById(userId);
            if (!user) {
                logger_1.default.error('User not found for subscription event', {
                    userId,
                    subscriptionId,
                });
                return;
            }
            let subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: subscriptionId,
            });
            if (!subscription) {
                subscription = await Subscription_1.default.create({
                    userId,
                    planId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    status,
                    stripeSubscriptionId: subscriptionId,
                    tier: event.data.tier || 'basic',
                    priceAtPurchase: event.data.amount / 100,
                    autoRenew: true,
                    features: event.data.features || [],
                });
                user.currentSubscriptionId = subscription._id;
                await user.save();
                logger_1.default.info('New subscription created via webhook', {
                    subscriptionId,
                    userId,
                });
            }
            else {
                subscription.status = status;
                subscription.startDate = new Date(startDate);
                subscription.endDate = new Date(endDate);
                subscription.webhookEvents.push({
                    eventId: event.id,
                    eventType: event.type,
                    processedAt: new Date(),
                    data: event.data,
                });
                await subscription.save();
                logger_1.default.info('Subscription updated via webhook', {
                    subscriptionId,
                    status,
                });
            }
            const isRenewal = event.type === 'subscription.renewed';
            await emailService_1.emailService.sendEmail({
                to: user.email,
                subject: isRenewal ? 'Subscription Renewed' : 'Subscription Activated',
                text: isRenewal
                    ? `Dear ${user.firstName}, your subscription has been renewed and is valid until ${new Date(endDate).toLocaleDateString()}.`
                    : `Dear ${user.firstName}, your subscription has been activated and is valid until ${new Date(endDate).toLocaleDateString()}.`,
                html: `
          <h2>${isRenewal ? 'Subscription Renewed' : 'Subscription Activated'}</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your subscription has been ${isRenewal ? 'renewed' : 'activated'} successfully.</p>
          <p>Valid until: <strong>${new Date(endDate).toLocaleDateString()}</strong></p>
          <p>Thank you for using PharmaCareSaaS!</p>
        `,
            });
        }
        catch (error) {
            logger_1.default.error('Error processing subscription webhook', {
                error: error.message,
                eventId: event.id,
            });
        }
    }
    async handleSubscriptionCanceled(event) {
        try {
            const { subscriptionId } = event.data;
            const subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: subscriptionId,
            });
            if (!subscription) {
                logger_1.default.error('Subscription not found for cancellation event', {
                    subscriptionId,
                });
                return;
            }
            subscription.status = 'cancelled';
            subscription.autoRenew = false;
            subscription.webhookEvents.push({
                eventId: event.id,
                eventType: event.type,
                processedAt: new Date(),
                data: event.data,
            });
            await subscription.save();
            const user = await User_1.default.findById(subscription.userId);
            if (user) {
                await emailService_1.emailService.sendEmail({
                    to: user.email,
                    subject: 'Subscription Cancelled',
                    text: `Dear ${user.firstName}, your subscription has been cancelled. You will still have access until ${new Date(subscription.endDate).toLocaleDateString()}.`,
                    html: `
            <h2>Subscription Cancelled</h2>
            <p>Dear ${user.firstName},</p>
            <p>Your subscription has been cancelled as requested.</p>
            <p>You will still have access to your features until <strong>${new Date(subscription.endDate).toLocaleDateString()}</strong>.</p>
            <p>If this was a mistake or you'd like to reactivate your subscription, please contact support.</p>
          `,
                });
            }
            logger_1.default.info('Subscription cancelled via webhook', {
                subscriptionId,
                userId: subscription.userId,
            });
        }
        catch (error) {
            logger_1.default.error('Error processing subscription cancellation webhook', {
                error: error.message,
                eventId: event.id,
            });
        }
    }
    async handleSubscriptionExpiringSoon(event) {
        try {
            const { subscriptionId, daysRemaining } = event.data;
            const subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: subscriptionId,
            });
            if (!subscription) {
                logger_1.default.error('Subscription not found for expiring soon event', {
                    subscriptionId,
                });
                return;
            }
            subscription.webhookEvents.push({
                eventId: event.id,
                eventType: event.type,
                processedAt: new Date(),
                data: event.data,
            });
            await subscription.save();
            const user = await User_1.default.findById(subscription.userId);
            if (user) {
                await emailService_1.emailService.sendEmail({
                    to: user.email,
                    subject: 'Your Subscription is Expiring Soon',
                    text: `Dear ${user.firstName}, your subscription will expire in ${daysRemaining} days. Please renew to avoid service interruption.`,
                    html: `
            <h2>Subscription Expiring Soon</h2>
            <p>Dear ${user.firstName},</p>
            <p>Your subscription will expire in <strong>${daysRemaining} days</strong>.</p>
            <p>To ensure uninterrupted access to all features, please renew your subscription.</p>
            <p><a href="${process.env.FRONTEND_URL}/subscription-management">Renew your subscription</a></p>
          `,
                });
            }
            logger_1.default.info('Subscription expiring soon notification sent', {
                subscriptionId,
                userId: subscription.userId,
                daysRemaining,
            });
        }
        catch (error) {
            logger_1.default.error('Error processing subscription expiring soon webhook', {
                error: error.message,
                eventId: event.id,
            });
        }
    }
    verifyPaystackSignature(secret, signature, payload) {
        const hash = crypto_1.default
            .createHmac('sha512', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
    async handlePaystackSuccessfulCharge(data) {
        try {
            const { reference, amount, metadata, customer, authorization } = data;
            const userId = metadata?.userId;
            const planId = metadata?.planId;
            if (!userId || !planId) {
                logger_1.default.error('Missing userId or planId in payment metadata', {
                    reference,
                });
                return;
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                logger_1.default.error('User not found for payment', { userId, reference });
                return;
            }
            const plan = await SubscriptionPlan_1.default.findById(planId);
            if (!plan) {
                logger_1.default.error('Subscription plan not found', { planId, reference });
                return;
            }
            const payment = await Payment_1.default.create({
                userId: user._id,
                planId,
                amount: amount / 100,
                currency: 'NGN',
                paymentMethod: 'credit_card',
                status: 'completed',
                completedAt: new Date(),
                paymentReference: reference,
                transactionId: data.id?.toString(),
                metadata: {
                    planName: plan.name,
                    planTier: plan.tier,
                    billingInterval: plan.billingInterval,
                    paymentProvider: 'paystack',
                    authorizationCode: authorization?.authorization_code,
                    cardDetails: {
                        last4: authorization?.last4,
                        cardType: authorization?.card_type,
                        bank: authorization?.bank,
                    },
                },
            });
            logger_1.default.info('Payment recorded successfully', {
                paymentId: payment._id,
                userId,
                reference,
            });
            const startDate = new Date();
            const endDate = new Date();
            if (plan.billingInterval === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            else if (plan.billingInterval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            const existingSubscription = await Subscription_1.default.findOne({
                userId,
                status: { $in: ['active', 'trial'] },
            });
            if (existingSubscription) {
                await Subscription_1.default.findByIdAndUpdate(existingSubscription._id, {
                    planId: plan._id,
                    status: 'active',
                    tier: plan.tier,
                    startDate,
                    endDate,
                    priceAtPurchase: plan.priceNGN,
                    $push: {
                        paymentHistory: payment._id,
                        webhookEvents: {
                            eventId: data.id.toString(),
                            eventType: 'charge.success',
                            processedAt: new Date(),
                            data: { reference },
                        },
                    },
                    features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
                    autoRenew: true,
                });
                logger_1.default.info('Existing subscription updated after payment', {
                    subscriptionId: existingSubscription._id,
                    status: 'active',
                });
            }
            else {
                const subscription = await Subscription_1.default.create({
                    userId,
                    planId: plan._id,
                    status: 'active',
                    tier: plan.tier,
                    startDate,
                    endDate,
                    priceAtPurchase: plan.priceNGN,
                    paymentHistory: [payment._id],
                    webhookEvents: [
                        {
                            eventId: data.id.toString(),
                            eventType: 'charge.success',
                            processedAt: new Date(),
                            data: { reference },
                        },
                    ],
                    features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
                    autoRenew: true,
                    usageMetrics: [],
                });
                logger_1.default.info('New subscription created after payment', {
                    subscriptionId: subscription._id,
                    status: 'active',
                });
            }
            await emailService_1.emailService
                .sendEmail({
                to: user.email,
                subject: 'Subscription Payment Successful',
                text: `Dear ${user.firstName}, your payment of ₦${amount / 100} has been received and your ${plan.name} subscription is now active.`,
                html: `
          <h2>Subscription Payment Successful</h2>
          <p>Dear ${user.firstName},</p>
          <p>We have received your payment of <strong>₦${amount / 100}</strong> for the <strong>${plan.name}</strong> plan.</p>
          <p>Your subscription is now active and will be valid until ${endDate.toLocaleDateString()}.</p>
          <p>Thank you for choosing our service!</p>
        `,
            })
                .catch((err) => {
                logger_1.default.error('Failed to send payment confirmation email', {
                    error: err.message,
                    userId,
                });
            });
        }
        catch (error) {
            logger_1.default.error('Error handling Paystack successful charge', {
                error: error.message,
                stack: error.stack,
            });
        }
    }
    async handlePaystackSubscriptionCreated(data) {
        logger_1.default.info('Paystack subscription created webhook received', {
            subscriptionCode: data.subscription_code,
            customerEmail: data.customer?.email,
        });
    }
    async handlePaystackSubscriptionDisabled(data) {
        logger_1.default.info('Paystack subscription disabled webhook received', {
            subscriptionCode: data.subscription_code,
            customerEmail: data.customer?.email,
        });
    }
    async handlePaystackInvoiceCreated(data) {
        logger_1.default.info('Paystack invoice created webhook received', {
            invoiceCode: data.invoice_code,
            customerEmail: data.customer?.email,
        });
    }
}
exports.WebhookController = WebhookController;
exports.webhookController = new WebhookController();
//# sourceMappingURL=webhookController.js.map