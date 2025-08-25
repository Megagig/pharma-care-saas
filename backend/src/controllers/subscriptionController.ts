import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import FeatureFlag from '../models/FeatureFlag';
import Payment from '../models/Payment';
import { emailService } from '../utils/emailService';
import { nombaService } from '../services/nombaService';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

export class SubscriptionController {
  // Get current subscription details
  async getCurrentSubscription(req: AuthRequest, res: Response): Promise<any> {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: { $in: ['active', 'trial', 'grace_period'] },
      })
        .populate('planId')
        .populate('paymentHistory');

      if (!subscription) {
        // Instead of returning 404, return a structured response indicating no subscription
        return res.status(200).json({
          success: true,
          data: {
            subscription: null,
            availableFeatures: [],
            isExpired: true,
            isInGracePeriod: false,
            canRenew: true,
          },
          message: 'No active subscription found',
        });
      }

      // Get available features for this subscription
      const availableFeatures = await FeatureFlag.find({
        isActive: true,
        allowedTiers: subscription.tier,
      }).select('key name description metadata.category');

      res.json({
        success: true,
        data: {
          subscription,
          availableFeatures,
          isExpired: subscription.isExpired(),
          isInGracePeriod: subscription.isInGracePeriod(),
          canRenew: subscription.canRenew(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching subscription',
        error: (error as Error).message,
      });
    }
  }

  // Get available subscription plans
  getAvailablePlans = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const billingInterval =
        (req.query.billingInterval as string) || 'monthly';

      const plans = await SubscriptionPlan.find({
        isActive: true,
        billingInterval: billingInterval,
      }).sort({
        priceNGN: 1,
      });

      // Transform plans to include computed features
      const transformedPlans = plans.map((plan) => ({
        ...plan.toObject(),
        // Ensure tier is set
        tier: plan.tier,
        // Transform features for display
        displayFeatures: this.getDisplayFeatures(plan),
      }));

      res.json({
        success: true,
        data: transformedPlans,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching plans',
        error: (error as Error).message,
      });
    }
  };

  private getDisplayFeatures(plan: any): string[] {
    const features: string[] = [];

    if (plan.tier === 'free_trial') {
      features.push('Access to all features during trial period');
      features.push('14-day free trial');
    } else if (plan.tier === 'basic') {
      features.push(
        `Up to ${plan.features.patientLimit || 'unlimited'} patients`
      );
      features.push(
        `${plan.features.clinicalNotesLimit || 'unlimited'} clinical notes`
      );
      features.push(
        `${plan.features.patientRecordsLimit || 'unlimited'} patient records`
      );
      features.push('Basic reports');
      features.push(`${plan.features.teamSize || 1} User`);
      if (plan.features.emailReminders) features.push('Email reminders');
    } else if (plan.tier === 'pro') {
      features.push('Unlimited patients');
      features.push('Unlimited clinical notes');
      features.push('Unlimited users');
      features.push('Priority support');
      if (plan.features.integrations) features.push('Integrations');
      if (plan.features.emailReminders) features.push('Email reminders');
      if (plan.features.advancedReports) features.push('Advanced reports');
      if (plan.features.drugTherapyManagement)
        features.push('Drug Therapy Management');
    } else if (plan.tier === 'enterprise') {
      features.push('Everything in Pro plan');
      features.push('Dedicated support');
      features.push('Team management');
      features.push('ADR reporting');
      features.push('Advanced reports');
      if (plan.features.smsReminders) features.push('SMS reminders');
      if (plan.features.customIntegrations)
        features.push('Custom integrations');
    }

    return features;
  }

  // Create Nomba checkout session
  async createCheckoutSession(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { planId, billingInterval = 'monthly' } = req.body;

      const plan = await SubscriptionPlan.findOne({
        _id: planId,
        billingInterval: billingInterval,
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      const user = req.user;

      // Check if user already has active subscription
      const existingSubscription = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['active', 'trial'] },
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: 'User already has an active subscription',
        });
      }

      // Create payment with Nomba
      const paymentData = {
        amount: plan.priceNGN,
        currency: 'NGN',
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`,
        description: `${plan.name} Subscription - ${billingInterval}`,
        callbackUrl: `${process.env.FRONTEND_URL}/subscription-management/success`,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          billingInterval,
          tier: plan.tier,
        },
      };

      const paymentResponse = await nombaService.initiatePayment(paymentData);

      if (!paymentResponse.success) {
        return res.status(400).json({
          success: false,
          message: paymentResponse.message || 'Failed to initialize payment',
        });
      }

      // Store pending payment record
      await Payment.create({
        userId: user._id,
        planId: plan._id,
        amount: plan.priceNGN,
        currency: 'NGN',
        paymentReference: paymentResponse.data!.reference,
        status: 'pending',
        paymentMethod: 'nomba',
        metadata: paymentData.metadata,
      });

      res.json({
        success: true,
        data: {
          checkoutUrl: paymentResponse.data!.checkoutUrl,
          reference: paymentResponse.data!.reference,
        },
      });
    } catch (error) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating checkout session',
        error: (error as Error).message,
      });
    }
  }

  // Handle successful payment from Nomba
  async handleSuccessfulPayment(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
      }

      // Verify payment with Nomba
      const verificationResult = await nombaService.verifyPayment(
        paymentReference
      );

      if (!verificationResult.success || !verificationResult.data) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message || 'Payment verification failed',
        });
      }

      const paymentData = verificationResult.data;

      if (paymentData.status !== 'success') {
        return res.status(400).json({
          success: false,
          message: 'Payment not completed',
        });
      }

      // Find the payment record
      const paymentRecord = await Payment.findOne({
        paymentReference: paymentReference,
      });

      if (!paymentRecord) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found',
        });
      }

      const userId = paymentRecord.userId;
      const planId = paymentRecord.planId;
      const billingInterval =
        paymentRecord.metadata?.billingInterval || 'monthly';

      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment metadata',
        });
      }

      const user = await User.findById(userId);
      const plan = await SubscriptionPlan.findById(planId);

      if (!user || !plan) {
        return res.status(404).json({
          success: false,
          message: 'User or plan not found',
        });
      }

      // Cancel existing active subscriptions
      await Subscription.updateMany(
        { userId: userId, status: { $in: ['active', 'trial'] } },
        { status: 'cancelled' }
      );

      // Calculate subscription period
      const startDate = new Date();
      const endDate = new Date();
      if (billingInterval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create new subscription
      const subscription = new Subscription({
        userId: userId,
        planId: planId,
        tier: plan.tier,
        status: plan.tier === 'free_trial' ? 'trial' : 'active',
        startDate: startDate,
        endDate: endDate,
        priceAtPurchase: plan.priceNGN,
        autoRenew: true,
        paymentReference: paymentReference,
        features: Object.keys(plan.features).filter(
          (key: string) => (plan.features as any)[key] === true
        ),
      });

      await subscription.save();

      // Update payment record
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Update user subscription info
      user.currentSubscriptionId = subscription._id;
      user.subscriptionTier = plan.tier;
      user.currentPlanId = planId;
      await user.save();

      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(user.email, {
        firstName: user.firstName,
        planName: plan.name,
        amount: plan.priceNGN,
        billingInterval: billingInterval,
        startDate: startDate,
        endDate: endDate,
      });

      res.json({
        success: true,
        message: 'Subscription activated successfully',
        data: subscription,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing payment',
        error: (error as Error).message,
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { reason } = req.body;

      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: { $in: ['active', 'trial'] },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      // Set grace period (7 days)
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

      subscription.status = 'grace_period';
      subscription.gracePeriodEnd = gracePeriodEnd;
      subscription.autoRenew = false;

      await subscription.save();

      // Get plan details for email
      const plan = await SubscriptionPlan.findById(subscription.planId);

      // Send cancellation confirmation
      await emailService.sendSubscriptionCancellation(req.user.email, {
        firstName: req.user.firstName,
        planName: plan?.name || 'Unknown Plan',
        gracePeriodEnd: gracePeriodEnd,
        reason: reason,
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          gracePeriodEnd: gracePeriodEnd,
          accessUntil: gracePeriodEnd,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling subscription',
        error: (error as Error).message,
      });
    }
  }

  // Upgrade subscription
  async upgradeSubscription(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { planId, billingInterval = 'monthly' } = req.body;

      const currentSubscription = await Subscription.findOne({
        userId: req.user._id,
        status: 'active',
      }).populate('planId');

      if (!currentSubscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      const newPlan = await SubscriptionPlan.findById(planId);
      if (!newPlan) {
        return res.status(404).json({
          success: false,
          message: 'New plan not found',
        });
      }

      // Check if this is actually an upgrade
      const tierOrder = ['free_trial', 'basic', 'pro', 'enterprise'];
      const currentTierIndex = tierOrder.indexOf(currentSubscription.tier);
      const newTierIndex = tierOrder.indexOf(
        newPlan.name.toLowerCase().replace(' ', '_')
      );

      if (newTierIndex <= currentTierIndex) {
        return res.status(400).json({
          success: false,
          message:
            'This is not an upgrade. Use downgrade endpoint for downgrades.',
        });
      }

      // Calculate prorated amount
      const currentPlan = currentSubscription.planId as any;
      const daysRemaining = Math.ceil(
        (currentSubscription.endDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      const totalDaysInPeriod = billingInterval === 'yearly' ? 365 : 30;
      const proratedDiscount =
        (currentPlan.priceNGN * daysRemaining) / totalDaysInPeriod;
      const upgradeAmount = newPlan.priceNGN - proratedDiscount;

      // Create immediate payment for upgrade with Nomba
      // Note: For upgrades, you would need to implement Nomba payment flow here
      // This is a simplified version that updates the subscription directly
      console.log('Processing subscription upgrade...');

      // Update subscription in database
      const tierMapping: Record<string, string> = {
        'Free Trial': 'free_trial',
        Basic: 'basic',
        Pro: 'pro',
        Enterprise: 'enterprise',
      };
      const newTier = tierMapping[newPlan.name] || 'basic';

      const features = await FeatureFlag.find({
        isActive: true,
        allowedTiers: newTier,
      });

      currentSubscription.planId = newPlan._id;
      currentSubscription.tier = newTier as
        | 'free_trial'
        | 'basic'
        | 'pro'
        | 'enterprise';
      currentSubscription.priceAtPurchase = newPlan.priceNGN;
      currentSubscription.features = features.map((f) => f.key);

      await currentSubscription.save();

      // Update user
      const user = await User.findById(req.user._id);
      if (user) {
        user.subscriptionTier = newTier as
          | 'free_trial'
          | 'basic'
          | 'pro'
          | 'enterprise';
        user.features = features.map((f) => f.key);
        await user.save();
      }

      // Send upgrade confirmation email
      await emailService.sendSubscriptionUpgrade(req.user.email, {
        firstName: req.user.firstName,
        oldPlanName: currentPlan.name,
        newPlanName: newPlan.name,
        upgradeAmount: upgradeAmount,
        effectiveDate: new Date(),
      });

      res.json({
        success: true,
        message: 'Subscription upgraded successfully',
        data: {
          subscription: currentSubscription,
          upgradeAmount: upgradeAmount,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error upgrading subscription',
        error: (error as Error).message,
      });
    }
  }

  // Downgrade subscription
  async downgradeSubscription(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { planId } = req.body;

      const currentSubscription = await Subscription.findOne({
        userId: req.user._id,
        status: 'active',
      }).populate('planId');

      if (!currentSubscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      const newPlan = await SubscriptionPlan.findById(planId);
      if (!newPlan) {
        return res.status(404).json({
          success: false,
          message: 'New plan not found',
        });
      }

      // Schedule downgrade at end of current billing period
      currentSubscription.scheduledDowngrade = {
        planId: newPlan._id,
        effectiveDate: currentSubscription.endDate,
        scheduledAt: new Date(),
      };

      await currentSubscription.save();

      // Send downgrade confirmation email
      const currentPlan = currentSubscription.planId as any;
      await emailService.sendSubscriptionDowngrade(req.user.email, {
        firstName: req.user.firstName,
        currentPlanName: currentPlan.name,
        newPlanName: newPlan.name,
        effectiveDate: currentSubscription.endDate,
      });

      res.json({
        success: true,
        message: 'Subscription downgrade scheduled successfully',
        data: {
          effectiveDate: currentSubscription.endDate,
          newPlan: newPlan.name,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error scheduling downgrade',
        error: (error as Error).message,
      });
    }
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(
    req: AuthRequest,
    res: Response
  ): Promise<any> {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: { $in: ['active', 'trial', 'grace_period'] },
      }).populate('planId');

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      // Calculate usage metrics (this would be expanded based on actual feature usage)
      const usageMetrics = {
        currentPeriodStart: subscription.startDate,
        currentPeriodEnd: subscription.endDate,
        daysRemaining: Math.ceil(
          (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
        features: subscription.features,
        // Add more metrics based on actual feature usage
        storageUsed: 0,
        apiCalls: 0,
        teamMembers: 1,
      };

      // Calculate cost optimization suggestions
      const costOptimization = {
        currentMonthlySpend: subscription.priceAtPurchase,
        projectedAnnualSpend: subscription.priceAtPurchase * 12,
        savings: {
          yearlyVsMonthly: subscription.priceAtPurchase * 2, // 2 months free
          downgradeSavings: 0, // Calculate based on available plans
        },
      };

      res.json({
        success: true,
        data: {
          subscription,
          usageMetrics,
          costOptimization,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: (error as Error).message,
      });
    }
  }

  // Nomba webhook handler
  async handleWebhook(req: Request, res: Response): Promise<any> {
    const signature = req.headers['x-nomba-signature'] as string;
    const timestamp = req.headers['x-nomba-timestamp'] as string;

    if (!signature || !timestamp) {
      return res
        .status(400)
        .json({ error: 'Missing webhook signature or timestamp' });
    }

    let event;
    try {
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = nombaService.verifyWebhookSignature(
        payload,
        signature,
        timestamp
      );
      if (!isValid) {
        console.log('Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      event = req.body;
    } catch (err) {
      console.log('Webhook processing error:', (err as Error).message);
      return res
        .status(400)
        .json({ error: `Webhook Error: ${(err as Error).message}` });
    }

    try {
      switch (event.type || event.event) {
        case 'payment.success':
        case 'charge.success':
          await this.handleNombaPaymentSucceeded(event.data);
          break;
        case 'payment.failed':
        case 'charge.failed':
          await this.handleNombaPaymentFailed(event.data);
          break;
        default:
          console.log(`Unhandled event type ${event.type || event.event}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handleSubscriptionCreated(subscription: any) {
    // Handle new subscription creation for Nomba
    console.log('Subscription created via Nomba');
  }

  private async handleSubscriptionUpdated(subscription: any) {
    // Handle subscription updates for Nomba
    console.log('Subscription updated via Nomba');
  }

  private async handleSubscriptionDeleted(subscription: any) {
    // Handle subscription deletion for Nomba
    console.log('Subscription deleted via Nomba');
  }

  private async handlePaymentSucceeded(paymentData: any) {
    // Handle successful payment from Nomba webhook
    await this.handleNombaPaymentSucceeded(paymentData);
  }

  private async handlePaymentFailed(paymentData: any) {
    // Handle failed payment from Nomba webhook
    await this.handleNombaPaymentFailed(paymentData);
  }

  // Nomba-specific webhook handlers
  private async handleNombaPaymentSucceeded(paymentData: any) {
    try {
      const reference = paymentData.reference;
      if (!reference) return;

      // Find the payment record
      const paymentRecord = await Payment.findOne({
        paymentReference: reference,
        status: 'pending',
      });

      if (!paymentRecord) {
        console.log('Payment record not found for reference:', reference);
        return;
      }

      // Process the subscription activation (this logic is also in handleSuccessfulPayment)
      console.log('Processing Nomba payment success via webhook:', reference);

      // Update payment status
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();
    } catch (error) {
      console.error('Error handling Nomba payment success:', error);
    }
  }

  private async handleNombaPaymentFailed(paymentData: any) {
    try {
      const reference = paymentData.reference;
      if (!reference) return;

      // Update payment record
      await Payment.updateOne(
        { paymentReference: reference },
        {
          status: 'failed',
          failedAt: new Date(),
        }
      );

      console.log('Payment failed for reference:', reference);
    } catch (error) {
      console.error('Error handling Nomba payment failure:', error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
