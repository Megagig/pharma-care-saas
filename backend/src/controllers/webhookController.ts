import { Request, Response } from 'express';
import crypto from 'crypto';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Payment from '../models/Payment';
import { emailService } from '../utils/emailService';
import logger from '../utils/logger';

/**
 * Webhook handler for Nomba payment integration
 * See: https://developer.nomba.com/introduction/get-api-keys
 */
export class WebhookController {
  /**
   * Handles incoming webhook events from the Nomba payment gateway
   */
  async handleNombaWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error('NOMBA_WEBHOOK_SECRET is not configured');
        res
          .status(500)
          .json({ success: false, message: 'Webhook secret not configured' });
        return;
      }

      // Verify webhook signature
      const signature = req.headers['nomba-signature'] as string;
      if (!signature) {
        logger.error('Missing webhook signature');
        res.status(400).json({ success: false, message: 'Missing signature' });
        return;
      }

      // Validate webhook signature
      const isValid = this.verifyNombaSignature(
        webhookSecret,
        signature,
        JSON.stringify(req.body)
      );

      if (!isValid) {
        logger.error('Invalid webhook signature');
        res.status(401).json({ success: false, message: 'Invalid signature' });
        return;
      }

      // Process webhook event
      const event = req.body;

      logger.info(`Processing Nomba webhook: ${event.type}`, {
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
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      // Respond to the webhook
      res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      logger.error('Error processing webhook', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * Verify the signature of the Nomba webhook payload
   */
  private verifyNombaSignature(
    secret: string,
    signature: string,
    payload: string
  ): boolean {
    // Implementation will depend on Nomba's signature verification method
    // This is a placeholder based on common webhook verification patterns
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Handle successful payment webhook event
   */
  private async handleSuccessfulPayment(event: any): Promise<void> {
    try {
      const { reference, amount, metadata, customer } = event.data;

      // Extract user and subscription IDs from metadata
      const userId = metadata?.userId;
      const subscriptionId = metadata?.subscriptionId;

      if (!userId) {
        logger.error('Missing userId in payment metadata', { reference });
        return;
      }

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for payment', { userId, reference });
        return;
      }

      // Create payment record
      const payment = await Payment.create({
        userId: user._id,
        subscriptionId,
        reference,
        amount: amount / 100, // Convert from kobo to naira
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

      logger.info('Payment recorded successfully', {
        paymentId: payment._id,
        userId,
        reference,
      });

      // Update subscription if subscriptionId provided
      if (subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);

        if (subscription) {
          // Update subscription status and payment history
          subscription.status = 'active';
          subscription.paymentHistory.push(payment._id);

          // Log webhook event
          subscription.webhookEvents.push({
            eventId: event.id,
            eventType: event.type,
            processedAt: new Date(),
            data: event.data,
          });

          await subscription.save();
          logger.info('Subscription updated after payment', {
            subscriptionId,
            status: 'active',
          });

          // Send email notification to user
          await emailService.sendEmail({
            to: user.email,
            subject: 'Payment Received',
            text: `Dear ${user.firstName}, your payment of ₦${
              amount / 100
            } has been received and your subscription is now active.`,
            html: `
              <h2>Payment Successful</h2>
              <p>Dear ${user.firstName},</p>
              <p>Your payment of <strong>₦${
                amount / 100
              }</strong> has been received.</p>
              <p>Your subscription is now active until ${new Date(
                subscription.endDate
              ).toLocaleDateString()}.</p>
              <p>Thank you for using PharmaCareSaaS!</p>
            `,
          });
        } else {
          logger.error('Subscription not found for payment', {
            subscriptionId,
            userId,
            reference,
          });
        }
      }
    } catch (error) {
      logger.error('Error processing successful payment webhook', {
        error: (error as Error).message,
        eventId: event.id,
      });
    }
  }

  /**
   * Handle failed payment webhook event
   */
  private async handleFailedPayment(event: any): Promise<void> {
    try {
      const { reference, amount, metadata, customer, failureReason } =
        event.data;

      // Extract user and subscription IDs from metadata
      const userId = metadata?.userId;
      const subscriptionId = metadata?.subscriptionId;

      if (!userId) {
        logger.error('Missing userId in payment metadata', { reference });
        return;
      }

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for failed payment', {
          userId,
          reference,
        });
        return;
      }

      // Create payment record
      await Payment.create({
        userId: user._id,
        subscriptionId,
        reference,
        amount: amount / 100, // Convert from kobo to naira
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

      // Update subscription if subscriptionId provided
      if (subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);

        if (subscription) {
          // Log the failed payment attempt
          subscription.renewalAttempts.push({
            attemptedAt: new Date(),
            successful: false,
            error: failureReason,
          });

          // Log webhook event
          subscription.webhookEvents.push({
            eventId: event.id,
            eventType: event.type,
            processedAt: new Date(),
            data: event.data,
          });

          await subscription.save();

          // Send email notification to user
          await emailService.sendEmail({
            to: user.email,
            subject: 'Payment Failed',
            text: `Dear ${user.firstName}, your payment of ₦${
              amount / 100
            } has failed. Reason: ${failureReason}. Please update your payment method to avoid service interruption.`,
            html: `
              <h2>Payment Failed</h2>
              <p>Dear ${user.firstName},</p>
              <p>Your payment of <strong>₦${
                amount / 100
              }</strong> has failed.</p>
              <p><strong>Reason:</strong> ${failureReason}</p>
              <p>Please update your payment method to avoid service interruption.</p>
              <p><a href="${
                process.env.FRONTEND_URL
              }/subscription-management">Manage your subscription</a></p>
            `,
          });
        }
      }
    } catch (error) {
      logger.error('Error processing failed payment webhook', {
        error: (error as Error).message,
        eventId: event.id,
      });
    }
  }

  /**
   * Handle subscription created or renewed webhook event
   */
  private async handleSubscriptionCreatedOrRenewed(event: any): Promise<void> {
    try {
      const { subscriptionId, userId, planId, startDate, endDate, status } =
        event.data;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for subscription event', {
          userId,
          subscriptionId,
        });
        return;
      }

      // Find or create subscription
      let subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!subscription) {
        // Create new subscription
        subscription = await Subscription.create({
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

        // Update user with subscription reference
        user.currentSubscriptionId = subscription._id;
        await user.save();

        logger.info('New subscription created via webhook', {
          subscriptionId,
          userId,
        });
      } else {
        // Update existing subscription
        subscription.status = status;
        subscription.startDate = new Date(startDate);
        subscription.endDate = new Date(endDate);

        // Log webhook event
        subscription.webhookEvents.push({
          eventId: event.id,
          eventType: event.type,
          processedAt: new Date(),
          data: event.data,
        });

        await subscription.save();

        logger.info('Subscription updated via webhook', {
          subscriptionId,
          status,
        });
      }

      // Send email notification
      const isRenewal = event.type === 'subscription.renewed';

      await emailService.sendEmail({
        to: user.email,
        subject: isRenewal ? 'Subscription Renewed' : 'Subscription Activated',
        text: isRenewal
          ? `Dear ${
              user.firstName
            }, your subscription has been renewed and is valid until ${new Date(
              endDate
            ).toLocaleDateString()}.`
          : `Dear ${
              user.firstName
            }, your subscription has been activated and is valid until ${new Date(
              endDate
            ).toLocaleDateString()}.`,
        html: `
          <h2>${
            isRenewal ? 'Subscription Renewed' : 'Subscription Activated'
          }</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your subscription has been ${
            isRenewal ? 'renewed' : 'activated'
          } successfully.</p>
          <p>Valid until: <strong>${new Date(
            endDate
          ).toLocaleDateString()}</strong></p>
          <p>Thank you for using PharmaCareSaaS!</p>
        `,
      });
    } catch (error) {
      logger.error('Error processing subscription webhook', {
        error: (error as Error).message,
        eventId: event.id,
      });
    }
  }

  /**
   * Handle subscription canceled webhook event
   */
  private async handleSubscriptionCanceled(event: any): Promise<void> {
    try {
      const { subscriptionId } = event.data;

      // Find subscription
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!subscription) {
        logger.error('Subscription not found for cancellation event', {
          subscriptionId,
        });
        return;
      }

      // Update subscription
      subscription.status = 'cancelled';
      subscription.autoRenew = false;

      // Log webhook event
      subscription.webhookEvents.push({
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        data: event.data,
      });

      await subscription.save();

      // Find user
      const user = await User.findById(subscription.userId);
      if (user) {
        // Send email notification
        await emailService.sendEmail({
          to: user.email,
          subject: 'Subscription Cancelled',
          text: `Dear ${
            user.firstName
          }, your subscription has been cancelled. You will still have access until ${new Date(
            subscription.endDate
          ).toLocaleDateString()}.`,
          html: `
            <h2>Subscription Cancelled</h2>
            <p>Dear ${user.firstName},</p>
            <p>Your subscription has been cancelled as requested.</p>
            <p>You will still have access to your features until <strong>${new Date(
              subscription.endDate
            ).toLocaleDateString()}</strong>.</p>
            <p>If this was a mistake or you'd like to reactivate your subscription, please contact support.</p>
          `,
        });
      }

      logger.info('Subscription cancelled via webhook', {
        subscriptionId,
        userId: subscription.userId,
      });
    } catch (error) {
      logger.error('Error processing subscription cancellation webhook', {
        error: (error as Error).message,
        eventId: event.id,
      });
    }
  }

  /**
   * Handle subscription expiring soon webhook event
   */
  private async handleSubscriptionExpiringSoon(event: any): Promise<void> {
    try {
      const { subscriptionId, daysRemaining } = event.data;

      // Find subscription
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!subscription) {
        logger.error('Subscription not found for expiring soon event', {
          subscriptionId,
        });
        return;
      }

      // Log webhook event
      subscription.webhookEvents.push({
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        data: event.data,
      });

      await subscription.save();

      // Find user
      const user = await User.findById(subscription.userId);
      if (user) {
        // Send email notification
        await emailService.sendEmail({
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

      logger.info('Subscription expiring soon notification sent', {
        subscriptionId,
        userId: subscription.userId,
        daysRemaining,
      });
    } catch (error) {
      logger.error('Error processing subscription expiring soon webhook', {
        error: (error as Error).message,
        eventId: event.id,
      });
    }
  }
}

export const webhookController = new WebhookController();
