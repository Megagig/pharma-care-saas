import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/User';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import FeatureFlag from '../models/FeatureFlag';
import { emailService } from '../utils/emailService';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class SubscriptionController {
  // Get current subscription details
  async getCurrentSubscription(req: AuthRequest, res: Response) {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: { $in: ['active', 'trial', 'grace_period'] }
      })
        .populate('planId')
        .populate('paymentHistory');

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      // Get available features for this subscription
      const availableFeatures = await FeatureFlag.find({
        isActive: true,
        allowedTiers: subscription.tier
      }).select('key name description metadata.category');

      res.json({
        success: true,
        data: {
          subscription,
          availableFeatures,
          isExpired: subscription.isExpired(),
          isInGracePeriod: subscription.isInGracePeriod(),
          canRenew: subscription.canRenew()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching subscription',
        error: error.message
      });
    }
  }

  // Get available subscription plans
  async getAvailablePlans(req: AuthRequest, res: Response) {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true })
        .sort({ priceNGN: 1 });

      // Get features for each plan
      const plansWithFeatures = await Promise.all(
        plans.map(async (plan) => {
          const tierMapping = {
            'Free Trial': 'free_trial',
            'Basic': 'basic',
            'Pro': 'pro',
            'Enterprise': 'enterprise'
          };
          
          const tier = tierMapping[plan.name] || 'basic';
          
          const features = await FeatureFlag.find({
            isActive: true,
            allowedTiers: tier
          }).select('key name description metadata.category');

          return {
            ...plan.toObject(),
            tier,
            features
          };
        })
      );

      res.json({
        success: true,
        data: plansWithFeatures
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching plans',
        error: error.message
      });
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const { planId, billingInterval = 'monthly' } = req.body;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
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
            role: user.role
          }
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
                description: `${plan.name} subscription plan`,
                metadata: {
                  planId: plan._id.toString(),
                  tier: plan.name.toLowerCase().replace(' ', '_')
                }
              },
              unit_amount: plan.priceNGN * 100, // Stripe uses smallest currency unit
              recurring: {
                interval: billingInterval
              }
            },
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/plans`,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          billingInterval
        }
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          sessionUrl: session.url
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating checkout session',
        error: error.message
      });
    }
  }

  // Handle successful payment (called after Stripe checkout)
  async handleSuccessfulPayment(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.body;

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session || session.payment_status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Payment not completed'
        });
      }

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const billingInterval = session.metadata?.billingInterval || 'monthly';

      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session metadata'
        });
      }

      const user = await User.findById(userId);
      const plan = await SubscriptionPlan.findById(planId);

      if (!user || !plan) {
        return res.status(404).json({
          success: false,
          message: 'User or plan not found'
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
      const tierMapping = {
        'Free Trial': 'free_trial',
        'Basic': 'basic',
        'Pro': 'pro',
        'Enterprise': 'enterprise'
      };
      const tier = tierMapping[plan.name] || 'basic';
      
      const features = await FeatureFlag.find({
        isActive: true,
        allowedTiers: tier
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
        features: features.map(f => f.key)
      });

      await subscription.save();

      // Update user subscription info
      user.currentSubscriptionId = subscription._id;
      user.subscriptionTier = tier;
      user.features = features.map(f => f.key);
      await user.save();

      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(user.email, {
        firstName: user.firstName,
        planName: plan.name,
        amount: plan.priceNGN,
        billingInterval: billingInterval,
        startDate: startDate,
        endDate: endDate
      });

      res.json({
        success: true,
        message: 'Subscription activated successfully',
        data: subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing payment',
        error: error.message
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const { reason } = req.body;

      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: 'active'
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
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
      
      if (reason) {
        subscription.cancellationReason = reason;
      }

      await subscription.save();

      // Send cancellation confirmation
      await emailService.sendSubscriptionCancellation(req.user.email, {
        firstName: req.user.firstName,
        planName: subscription.planId.name,
        gracePeriodEnd: gracePeriodEnd,
        reason: reason
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          gracePeriodEnd: gracePeriodEnd,
          accessUntil: gracePeriodEnd
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling subscription',
        error: error.message
      });
    }
  }

  // Stripe webhook handler
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
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
      stripeSubscriptionId: stripeSubscription.id
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
      stripeSubscriptionId: stripeSubscription.id
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
      stripeSubscriptionId: stripeSubscriptionId
    });

    if (subscription) {
      // Extend subscription period
      const newEndDate = new Date(invoice.period_end * 1000);
      subscription.endDate = newEndDate;
      subscription.status = 'active';
      
      // Add payment to history
      subscription.paymentHistory.push({
        amount: invoice.amount_paid / 100,
        paidAt: new Date(invoice.created * 1000),
        invoiceId: invoice.id
      });
      
      await subscription.save();

      // Send payment confirmation email
      const user = await User.findById(subscription.userId);
      if (user) {
        await emailService.sendPaymentConfirmation(user.email, {
          firstName: user.firstName,
          amount: invoice.amount_paid / 100,
          nextBillingDate: newEndDate
        });
      }
    }
  }

  private async handlePaymentFailed(invoice: any) {
    const stripeSubscriptionId = invoice.subscription;
    
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscriptionId
    });

    if (subscription) {
      // Record failed payment attempt
      subscription.renewalAttempts.push({
        attemptedAt: new Date(),
        successful: false,
        error: 'Payment failed'
      });
      
      // If too many failed attempts, suspend subscription
      const failedAttempts = subscription.renewalAttempts.filter(
        attempt => !attempt.successful
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
          nextAttempt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }
    }
  }
}

export const subscriptionController = new SubscriptionController();
