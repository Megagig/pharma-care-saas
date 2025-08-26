import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ISubscription } from '../models/Subscription';
import { IPayment } from '../models/Payment';
import { ISubscriptionPlan } from '../models/SubscriptionPlan';
import { paystackService } from '../services/paystackService';

const Subscription = mongoose.model<ISubscription>('Subscription');
const Payment = mongoose.model<IPayment>('Payment');
const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan');

interface CustomRequest extends Request {
  user?: {
    _id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

class SubscriptionController {
  // Get subscription analytics
  async getSubscriptionAnalytics(
    req: CustomRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      // Get current subscription details
      const currentSubscription = await Subscription.findOne({
        userId,
        status: 'active',
      }).populate('planId');

      // Get payment history for the last 30 days
      const payments = await Payment.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      });

      // Calculate metrics
      const totalPayments = payments.length;
      const successfulPayments = payments.filter(
        (p: IPayment) => p.status === 'completed'
      ).length;
      const totalAmount = payments.reduce(
        (sum: number, p: IPayment) => sum + (p.amount || 0),
        0
      );
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      return res.json({
        currentPlan:
          (currentSubscription?.planId as any)?.name || 'No active plan',
        billingCycle:
          (currentSubscription?.planId as any)?.billingInterval || 'N/A',
        status: currentSubscription?.status || 'inactive',
        metrics: {
          totalPayments,
          successfulPayments,
          totalAmount,
          averageAmount,
        },
        subscription: currentSubscription,
        recentPayments: payments.slice(0, 5), // Last 5 payments
      });
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return res
        .status(500)
        .json({ message: 'Error fetching subscription analytics' });
    }
  }

  // Initialize checkout session for subscription
  async checkout(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?._id;
      const userEmail = req.user?.email;
      const { planId, callbackUrl } = req.body;

      if (!userId || !userEmail) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!planId) {
        return res
          .status(400)
          .json({ message: 'Subscription plan ID is required' });
      }

      // Find the subscription plan
      const plan = await SubscriptionPlan.findById(planId);

      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      if (!plan.isActive) {
        return res
          .status(400)
          .json({ message: 'This subscription plan is no longer available' });
      }

      if (plan.isContactSales) {
        return res.status(400).json({
          message: 'This plan requires contacting sales team',
          contactInfo: {
            whatsapp: plan.whatsappNumber || 'Contact support for assistance',
          },
        });
      }

      // Calculate amount in kobo (Paystack uses kobo, which is NGN * 100)
      const amountInKobo = Math.round(plan.priceNGN * 100);

      // Generate reference
      const reference = `sub_${userId}_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;

      // Initialize Paystack transaction
      const transactionData = {
        email: userEmail,
        amount: amountInKobo,
        reference,
        callback_url:
          callbackUrl || `${process.env.FRONTEND_URL}/subscription/verify`,
        metadata: {
          userId: userId.toString(),
          planId: planId,
          planName: plan.name,
          billingInterval: plan.billingInterval,
        },
      };

      const response = await paystackService.initializeTransaction(
        transactionData
      );

      if (!response.success) {
        return res.status(500).json({
          message: 'Failed to initialize payment',
          error: response.message,
        });
      }

      // Create payment record
      await Payment.create({
        userId,
        planId,
        amount: plan.priceNGN,
        currency: 'NGN',
        paymentMethod: 'credit_card',
        status: 'pending',
        paymentReference: reference,
        metadata: {
          planName: plan.name,
          planTier: plan.tier,
          billingInterval: plan.billingInterval,
          paystackReference: reference,
        },
      });

      return res.json({
        success: true,
        message: 'Payment initialized',
        data: response.data,
        planDetails: {
          name: plan.name,
          price: plan.priceNGN,
          interval: plan.billingInterval,
        },
      });
    } catch (error) {
      console.error('Error initializing subscription checkout:', error);
      return res.status(500).json({
        message: 'Error initializing subscription checkout',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }

  // Verify payment and activate subscription
  async verifyPayment(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const { reference } = req.query;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!reference) {
        return res
          .status(400)
          .json({ message: 'Payment reference is required' });
      }

      // Verify payment with Paystack
      const verificationResponse = await paystackService.verifyTransaction(
        reference as string
      );

      if (!verificationResponse.success || !verificationResponse.data) {
        return res.status(400).json({
          message: 'Payment verification failed',
          error: verificationResponse.message,
        });
      }

      const paymentData = verificationResponse.data;

      if (paymentData.status !== 'success') {
        return res.status(400).json({
          message: `Payment was not successful. Status: ${paymentData.status}`,
          data: paymentData,
        });
      }

      // Extract metadata
      const metadata = paymentData.metadata || {};
      const planId = metadata.planId;

      if (!planId) {
        return res
          .status(400)
          .json({ message: 'Invalid payment data: missing plan information' });
      }

      // Find the subscription plan
      const plan = await SubscriptionPlan.findById(planId);

      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // Update payment record
      const payment = await Payment.findOneAndUpdate(
        { paymentReference: reference },
        {
          status: 'completed',
          completedAt: new Date(),
          transactionId: paymentData.id.toString(),
          metadata: {
            ...metadata,
            paymentProvider: 'paystack',
            authorizationCode: paymentData.authorization?.authorization_code,
            cardDetails: {
              last4: paymentData.authorization?.last4,
              cardType: paymentData.authorization?.card_type,
              bank: paymentData.authorization?.bank,
            },
          },
        },
        { new: true }
      );

      if (!payment) {
        // Create a new payment record if not found
        await Payment.create({
          userId,
          planId,
          amount: plan.priceNGN,
          currency: 'NGN',
          paymentMethod: 'credit_card',
          status: 'completed',
          completedAt: new Date(),
          paymentReference: reference as string,
          transactionId: paymentData.id.toString(),
          metadata: {
            planName: plan.name,
            planTier: plan.tier,
            billingInterval: plan.billingInterval,
            paymentProvider: 'paystack',
            authorizationCode: paymentData.authorization?.authorization_code,
            cardDetails: {
              last4: paymentData.authorization?.last4,
              cardType: paymentData.authorization?.card_type,
              bank: paymentData.authorization?.bank,
            },
          },
        });
      }

      // Calculate subscription duration based on billing interval
      const startDate = new Date();
      const endDate = new Date();

      if (plan.billingInterval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billingInterval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Check for existing subscription
      const existingSubscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
      });

      if (existingSubscription) {
        // Update existing subscription
        await Subscription.findByIdAndUpdate(existingSubscription._id, {
          planId: plan._id,
          status: 'active',
          tier: plan.tier,
          startDate,
          endDate,
          priceAtPurchase: plan.priceNGN,
          $push: {
            paymentHistory: payment ? payment._id : null,
            webhookEvents: {
              eventId: paymentData.id.toString(),
              eventType: 'payment.success',
              processedAt: new Date(),
              data: { reference },
            },
          },
          features: Object.keys(plan.features).filter(
            (key) => plan.features[key as keyof typeof plan.features] === true
          ),
          autoRenew: true,
        });
      } else {
        // Create new subscription
        await Subscription.create({
          userId,
          planId: plan._id,
          status: 'active',
          tier: plan.tier,
          startDate,
          endDate,
          priceAtPurchase: plan.priceNGN,
          paymentHistory: payment ? [payment._id] : [],
          webhookEvents: [
            {
              eventId: paymentData.id.toString(),
              eventType: 'payment.success',
              processedAt: new Date(),
              data: { reference },
            },
          ],
          features: Object.keys(plan.features).filter(
            (key) => plan.features[key as keyof typeof plan.features] === true
          ),
          autoRenew: true,
          usageMetrics: [],
        });
      }

      return res.json({
        success: true,
        message: 'Payment verified and subscription activated',
        data: {
          plan: plan.name,
          tier: plan.tier,
          validUntil: endDate,
          transactionReference: reference,
        },
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      return res.status(500).json({
        message: 'Error verifying payment',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }
}

// Export the controller
export const subscriptionController = new SubscriptionController();
