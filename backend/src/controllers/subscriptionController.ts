import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import FeatureFlag from '../models/FeatureFlag';
import Payment from '../models/Payment';
import { emailService } from '../utils/emailService';
import { paystackService, PaystackService } from '../services/paystackService';

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
    } else if (plan.tier === 'pharmily') {
      features.push('Everything in Pro plan');
      features.push('ADR Reporting');
      features.push('Drug Interaction Checker');
      features.push('Dose Calculator');
      features.push('Advanced Reporting');
      if (plan.features.integrations) features.push('Integrations');
      if (plan.features.emailReminders) features.push('Email reminders');
    } else if (plan.tier === 'network') {
      features.push('Everything in Pharmily plan');
      features.push('Multi-location Dashboard');
      features.push('Shared Patient Records');
      features.push('Group Analytics');
      features.push('Clinical Decision Support System (CDSS)');
      features.push('Team Management');
      if (plan.features.smsReminders) features.push('SMS reminders');
    } else if (plan.tier === 'enterprise') {
      features.push('Everything in Network plan');
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

  // Create Paystack checkout session
  async createCheckoutSession(req: AuthRequest, res: Response): Promise<any> {
    try {
      console.log('createCheckoutSession - Request received:', {
        body: req.body,
        user: req.user
          ? {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            hasSubscription: !!req.user.currentSubscriptionId,
          }
          : 'No user',
      });

      const { planId, billingInterval = 'monthly' } = req.body;

      console.log('Looking for subscription plan:', {
        planId,
        billingInterval,
      });

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

      if (!user) {
        console.error('createCheckoutSession - No user in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      console.log(
        'Checking for existing subscription for user:',
        user._id.toString()
      );

      // Check if user already has active subscription
      const existingSubscription = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['active', 'trial'] },
      });

      console.log(
        'Existing subscription check result:',
        existingSubscription
          ? {
            id: existingSubscription._id,
            status: existingSubscription.status,
            planId: existingSubscription.planId,
            endDate: existingSubscription.endDate,
          }
          : 'No active subscription'
      );

      if (existingSubscription) {
        console.log('User already has an active subscription, returning 400');
        return res.status(400).json({
          success: false,
          message: 'User already has an active subscription',
        });
      }

      // Create payment with Paystack
      const paymentData = {
        email: user.email,
        amount: PaystackService.convertToKobo(plan.priceNGN), // Convert to kobo using static method
        currency: 'NGN',
        callback_url:
          req.body.callbackUrl ||
          `${process.env.FRONTEND_URL}/subscription/success`,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          billingInterval,
          tier: plan.tier,
          customerName: `${user.firstName} ${user.lastName}`,
          planName: plan.name,
        },
        channels: [
          'card',
          'bank',
          'ussd',
          'qr',
          'mobile_money',
          'bank_transfer',
        ],
      };

      // Check if this is development mode without Paystack credentials or if Paystack is not configured
      if (
        process.env.NODE_ENV === 'development' &&
        !paystackService.isConfigured()
      ) {
        // Mock payment response for development
        const mockReference = `mock_${Date.now()}_${user._id}`;
        const mockCheckoutUrl = `${process.env.FRONTEND_URL}/subscription-management/checkout?reference=${mockReference}&planId=${planId}`;

        // Store pending payment record with mock data
        await Payment.create({
          userId: user._id,
          planId: plan._id,
          amount: plan.priceNGN,
          currency: 'NGN',
          paymentReference: mockReference,
          status: 'pending',
          paymentMethod: 'paystack',
          metadata: paymentData.metadata,
        });

        return res.json({
          success: true,
          data: {
            authorization_url: mockCheckoutUrl,
            access_code: 'mock_access_code',
            reference: mockReference,
          },
          message: 'Development mode: Mock payment initiated',
        });
      }

      // Check if Paystack is configured in production
      if (!paystackService.isConfigured()) {
        return res.status(500).json({
          success: false,
          message:
            'Payment service is not properly configured. Please contact support.',
        });
      }

      const paymentResponse = await paystackService.initializeTransaction(
        paymentData
      );

      if (!paymentResponse.success) {
        console.error('Paystack payment initialization failed:', {
          message: paymentResponse.message,
          error: paymentResponse.error,
          details: paymentResponse.details,
        });

        return res.status(400).json({
          success: false,
          message: paymentResponse.message || 'Failed to initialize payment',
          error: paymentResponse.error,
          details: paymentResponse.details,
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
        paymentMethod: 'paystack',
        metadata: paymentData.metadata,
      });

      res.json({
        success: true,
        data: {
          authorization_url: paymentResponse.data!.authorization_url,
          access_code: paymentResponse.data!.access_code,
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

  // Verify payment by reference (public method for Paystack callback)
  async verifyPaymentByReference(req: Request, res: Response): Promise<any> {
    try {
      const reference = req.query.reference as string;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
      }

      // Verify with Paystack
      const verificationResult = await paystackService.verifyTransaction(
        reference
      );

      if (!verificationResult.success || !verificationResult.data) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message || 'Payment verification failed',
        });
      }

      const paymentData = verificationResult.data;

      // Return basic payment verification info
      return res.status(200).json({
        success: true,
        data: {
          status: paymentData.status,
          reference: paymentData.reference,
          amount: paymentData.amount,
        },
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying payment',
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

      // Check if this is a development mode mock payment
      let paymentData: any;
      if (
        process.env.NODE_ENV === 'development' &&
        paymentReference.startsWith('mock_')
      ) {
        // Mock verification for development
        paymentData = {
          status: 'success',
          reference: paymentReference,
          amount: 0, // Will be filled from payment record
          currency: 'NGN',
          customerEmail: '',
        };
      } else {
        // Verify payment with Paystack
        const verificationResult = await paystackService.verifyTransaction(
          paymentReference
        );

        if (!verificationResult.success || !verificationResult.data) {
          return res.status(400).json({
            success: false,
            message:
              verificationResult.message || 'Payment verification failed',
          });
        }

        paymentData = verificationResult.data;

        if (paymentData.status !== 'success') {
          return res.status(400).json({
            success: false,
            message: 'Payment not completed',
          });
        }
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

      subscription.status = 'past_due';
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
      const tierOrder = [
        'free_trial',
        'basic',
        'pro',
        'pharmily',
        'network',
        'enterprise',
      ];
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
        'Basic Yearly': 'basic',
        Pro: 'pro',
        'Pro Yearly': 'pro',
        Pharmily: 'pharmily',
        'Pharmily Yearly': 'pharmily',
        Network: 'network',
        'Network Yearly': 'network',
        Enterprise: 'enterprise',
        'Enterprise Yearly': 'enterprise',
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
        | 'pharmily'
        | 'network'
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
          | 'pharmily'
          | 'network'
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

  // Paystack webhook handler
  async handleWebhook(req: Request, res: Response): Promise<any> {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    let event;
    try {
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = paystackService.verifyWebhookSignature(
        payload,
        signature
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
      switch (event.event) {
        case 'charge.success':
          await this.handlePaystackPaymentSucceeded(event.data);
          break;
        case 'charge.failed':
          await this.handlePaystackPaymentFailed(event.data);
          break;
        case 'subscription.create':
          await this.handlePaystackSubscriptionCreated(event.data);
          break;
        case 'subscription.disable':
          await this.handlePaystackSubscriptionDisabled(event.data);
          break;
        default:
          console.log(`Unhandled event type ${event.event}`);
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
    // Handle successful payment from payment provider webhook
    console.log(
      'Payment succeeded',
      paymentData?.reference || 'Unknown reference'
    );
    // Process payment success logic here
  }

  private async handlePaymentFailed(paymentData: any) {
    // Handle failed payment from payment provider webhook
    console.log(
      'Payment failed',
      paymentData?.reference || 'Unknown reference'
    );
    // Process payment failure logic here
  }

  // Paystack-specific webhook handlers
  private async handlePaystackPaymentSucceeded(paymentData: any) {
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
      console.log(
        'Processing Paystack payment success via webhook:',
        reference
      );

      // Update payment status
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Process subscription activation
      await this.processSubscriptionActivation(paymentRecord);
    } catch (error) {
      console.error('Error handling Paystack payment success:', error);
    }
  }

  private async handlePaystackPaymentFailed(paymentData: any) {
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
      console.error('Error handling Paystack payment failure:', error);
    }
  }

  private async handlePaystackSubscriptionCreated(subscriptionData: any) {
    console.log('Paystack subscription created:', subscriptionData);
  }

  private async handlePaystackSubscriptionDisabled(subscriptionData: any) {
    console.log('Paystack subscription disabled:', subscriptionData);
  }

  private async processSubscriptionActivation(paymentRecord: any) {
    try {
      const userId = paymentRecord.userId;
      const planId = paymentRecord.planId;
      const billingInterval =
        paymentRecord.metadata?.billingInterval || 'monthly';

      const user = await User.findById(userId);
      const plan = await SubscriptionPlan.findById(planId);

      if (!user || !plan) {
        console.error('User or plan not found for subscription activation');
        return;
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
        paymentReference: paymentRecord.paymentReference,
        features: Object.keys(plan.features).filter(
          (key: string) => (plan.features as any)[key] === true
        ),
      });

      await subscription.save();

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

      console.log('Subscription activated successfully for user:', userId);
    } catch (error) {
      console.error('Error processing subscription activation:', error);
    }
  }

  // Get billing history
  async getBillingHistory(req: AuthRequest, res: Response): Promise<any> {
    try {
      const payments = await Payment.find({
        userId: req.user._id,
      })
        .populate('planId')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching billing history',
        error: (error as Error).message,
      });
    }
  }

  // Get usage metrics
  async getUsageMetrics(req: AuthRequest, res: Response): Promise<any> {
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

      // Basic usage metrics - you can expand this based on actual usage tracking
      const usageMetrics = {
        currentPeriodStart: subscription.startDate,
        currentPeriodEnd: subscription.endDate,
        daysRemaining: Math.ceil(
          (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
        features: subscription.features,
        // Add more usage tracking here as needed
        patientsCount: 0, // Would be fetched from actual patient records
        notesCount: 0, // Would be fetched from actual notes
        teamMembers: 1,
      };

      res.json({
        success: true,
        data: usageMetrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching usage metrics',
        error: (error as Error).message,
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
