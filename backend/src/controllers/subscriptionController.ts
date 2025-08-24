import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/User';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import FeatureFlag from '../models/FeatureFlag';
import Payment from '../models/Payment';
import { emailService } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

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
  async getAvailablePlans(req: AuthRequest, res: Response): Promise<any> {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true }).sort({
        priceNGN: 1,
      });

      // Get features for each plan
      const plansWithFeatures = await Promise.all(
        plans.map(async (plan) => {
          const tierMapping: Record<string, string> = {
            'Free Trial': 'free_trial',
            Basic: 'basic',
            Pro: 'pro',
            Enterprise: 'enterprise',
          };

          const tier = tierMapping[plan.name] || 'basic';

          const features = await FeatureFlag.find({
            isActive: true,
            allowedTiers: tier,
          }).select('key name description metadata.category');

          return {
            ...plan.toObject(),
            tier,
            features,
          };
        })
      );

      res.json({
        success: true,
        data: plansWithFeatures,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching plans',
        error: (error as Error).message,
      });
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { planId, billingInterval = 'monthly' } = req.body;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      const user = req.user;
      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user._id.toString(),
            role: user.role,
          },
        });

        stripeCustomerId = customer.id;
        await User.findByIdAndUpdate(user._id, { stripeCustomerId });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'ngn',
              product_data: {
                name: plan.name,
                metadata: {
                  planId: plan._id.toString(),
                  tier: plan.name.toLowerCase().replace(' ', '_'),
                },
              },
              unit_amount: plan.priceNGN * 100, // Stripe uses smallest currency unit
              recurring: {
                interval: billingInterval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/plans`,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          billingInterval,
        },
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          sessionUrl: session.url,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating checkout session',
        error: (error as Error).message,
      });
    }
  }

  // Handle successful payment from Stripe
  async handleSuccessfulPayment(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.body;

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session || session.payment_status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Payment not completed',
        });
      }

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const billingInterval = session.metadata?.billingInterval || 'monthly';

      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session metadata',
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
        { userId: userId, status: 'active' },
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

      // Get features for the plan
      const tierMapping: Record<string, string> = {
        'Free Trial': 'free_trial',
        Basic: 'basic',
        Pro: 'pro',
        Enterprise: 'enterprise',
      };
      const tier = tierMapping[plan.name] || 'basic';

      const features = await FeatureFlag.find({
        isActive: true,
        allowedTiers: tier,
      });

      // Create new subscription
      const subscription = new Subscription({
        userId: userId,
        planId: planId,
        tier: tier,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        priceAtPurchase: plan.priceNGN,
        autoRenew: true,
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
        features: features.map((f) => f.key),
      });

      await subscription.save();

      // Update user subscription info
      user.currentSubscriptionId = subscription._id;
      user.subscriptionTier = tier as
        | 'free_trial'
        | 'basic'
        | 'pro'
        | 'enterprise';
      user.features = features.map((f) => f.key);
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
        status: 'active',
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
        });
      }

      // Cancel Stripe subscription if exists
      if (subscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError);
        }
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
      const newTierIndex = tierOrder.indexOf(newPlan.name.toLowerCase().replace(' ', '_'));

      if (newTierIndex <= currentTierIndex) {
        return res.status(400).json({
          success: false,
          message: 'This is not an upgrade. Use downgrade endpoint for downgrades.',
        });
      }

      // Calculate prorated amount
      const currentPlan = currentSubscription.planId as any;
      const daysRemaining = Math.ceil(
        (currentSubscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const totalDaysInPeriod = billingInterval === 'yearly' ? 365 : 30;
      const proratedDiscount = (currentPlan.priceNGN * daysRemaining) / totalDaysInPeriod;
      const upgradeAmount = newPlan.priceNGN - proratedDiscount;

      // Create immediate payment for upgrade
      if (currentSubscription.stripeSubscriptionId) {
        try {
          // Update Stripe subscription
          const stripeSubscription = await stripe.subscriptions.retrieve(
            currentSubscription.stripeSubscriptionId
          );

          // Create a new price for the upgraded plan
          const price = await stripe.prices.create({
            currency: 'ngn',
            unit_amount: newPlan.priceNGN * 100,
            recurring: {
              interval: billingInterval as 'month' | 'year',
            },
            product_data: {
              name: newPlan.name,
            },
          });

          await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
            items: [{
              id: stripeSubscription.items.data[0]?.id,
              price: price.id,
            }],
            proration_behavior: 'create_prorations',
          });
        } catch (stripeError) {
          console.error('Error updating Stripe subscription:', stripeError);
        }
      }

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
      currentSubscription.tier = newTier as 'free_trial' | 'basic' | 'pro' | 'enterprise';
      currentSubscription.priceAtPurchase = newPlan.priceNGN;
      currentSubscription.features = features.map((f) => f.key);

      await currentSubscription.save();

      // Update user
      const user = await User.findById(req.user._id);
      if (user) {
        user.subscriptionTier = newTier as 'free_trial' | 'basic' | 'pro' | 'enterprise';
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
  async getSubscriptionAnalytics(req: AuthRequest, res: Response): Promise<any> {
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

  // Stripe webhook handler
  async handleWebhook(req: Request, res: Response): Promise<any> {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.log(
        `Webhook signature verification failed.`,
        (err as Error).message
      );
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    try {
      switch (event.type) {
        case 'subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handleSubscriptionCreated(stripeSubscription: any) {
    // Handle new subscription creation
    console.log('Subscription created:', stripeSubscription.id);
  }

  private async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (subscription) {
      if (stripeSubscription.status === 'active') {
        subscription.status = 'active';
      } else if (stripeSubscription.status === 'canceled') {
        subscription.status = 'cancelled';
      }

      await subscription.save();
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (subscription) {
      subscription.status = 'cancelled';
      await subscription.save();
    }
  }

  private async handlePaymentSucceeded(invoice: any) {
    // Handle successful payment and extend subscription
    const stripeSubscriptionId = invoice.subscription;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscriptionId,
    });

    if (subscription) {
      // Extend subscription period
      const newEndDate = new Date(invoice.period_end * 1000);
      subscription.endDate = newEndDate;
      subscription.status = 'active';

      // Create payment record
      const payment = new Payment({
        user: subscription.userId,
        subscription: subscription._id,
        amount: invoice.amount_paid / 100,
        currency: 'ngn',
        paymentMethod: 'credit_card',
        status: 'completed',
        stripePaymentIntentId: invoice.payment_intent,
        transactionId: invoice.id,
      });

      await payment.save();

      // Add payment to history
      subscription.paymentHistory.push(payment._id);

      await subscription.save();

      // Send payment confirmation email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentConfirmation(user.email, {
          firstName: user.firstName,
          amount: invoice.amount_paid / 100,
          nextBillingDate: newEndDate,
        });
      }
    }
  }

  private async handlePaymentFailed(invoice: any) {
    const stripeSubscriptionId = invoice.subscription;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscriptionId,
    });

    if (subscription) {
      // Record failed payment attempt
      subscription.renewalAttempts.push({
        attemptedAt: new Date(),
        successful: false,
        error: 'Payment failed',
      });

      // If too many failed attempts, suspend subscription
      const failedAttempts = subscription.renewalAttempts.filter(
        (attempt) => !attempt.successful
      ).length;

      if (failedAttempts >= 3) {
        subscription.status = 'suspended';
      }

      await subscription.save();

      // Send payment failure email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentFailedNotification(user.email, {
          firstName: user.firstName,
          attemptNumber: failedAttempts,
          nextAttempt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
      }
    }
  }
}

export const subscriptionController = new SubscriptionController();
