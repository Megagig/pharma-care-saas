"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = exports.SubscriptionController = void 0;
const stripe_1 = __importDefault(require("stripe"));
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const Payment_1 = __importDefault(require("../models/Payment"));
const emailService_1 = require("../utils/emailService");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});
class SubscriptionController {
    async getCurrentSubscription(req, res) {
        try {
            const subscription = await Subscription_1.default.findOne({
                userId: req.user._id,
                status: { $in: ['active', 'trial', 'grace_period'] },
            })
                .populate('planId')
                .populate('paymentHistory');
            if (!subscription) {
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
            const availableFeatures = await FeatureFlag_1.default.find({
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching subscription',
                error: error.message,
            });
        }
    }
    async getAvailablePlans(req, res) {
        try {
            const plans = await SubscriptionPlan_1.default.find({ isActive: true }).sort({
                priceNGN: 1,
            });
            const plansWithFeatures = await Promise.all(plans.map(async (plan) => {
                const tierMapping = {
                    'Free Trial': 'free_trial',
                    Basic: 'basic',
                    Pro: 'pro',
                    Enterprise: 'enterprise',
                };
                const tier = tierMapping[plan.name] || 'basic';
                const features = await FeatureFlag_1.default.find({
                    isActive: true,
                    allowedTiers: tier,
                }).select('key name description metadata.category');
                return {
                    ...plan.toObject(),
                    tier,
                    features,
                };
            }));
            res.json({
                success: true,
                data: plansWithFeatures,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching plans',
                error: error.message,
            });
        }
    }
    async createCheckoutSession(req, res) {
        try {
            const { planId, billingInterval = 'monthly' } = req.body;
            const plan = await SubscriptionPlan_1.default.findById(planId);
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription plan not found',
                });
            }
            const user = req.user;
            let stripeCustomerId = user.stripeCustomerId;
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
                await User_1.default.findByIdAndUpdate(user._id, { stripeCustomerId });
            }
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
                            unit_amount: plan.priceNGN * 100,
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating checkout session',
                error: error.message,
            });
        }
    }
    async handleSuccessfulPayment(req, res) {
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
            const user = await User_1.default.findById(userId);
            const plan = await SubscriptionPlan_1.default.findById(planId);
            if (!user || !plan) {
                return res.status(404).json({
                    success: false,
                    message: 'User or plan not found',
                });
            }
            await Subscription_1.default.updateMany({ userId: userId, status: 'active' }, { status: 'cancelled' });
            const startDate = new Date();
            const endDate = new Date();
            if (billingInterval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            const tierMapping = {
                'Free Trial': 'free_trial',
                Basic: 'basic',
                Pro: 'pro',
                Enterprise: 'enterprise',
            };
            const tier = tierMapping[plan.name] || 'basic';
            const features = await FeatureFlag_1.default.find({
                isActive: true,
                allowedTiers: tier,
            });
            const subscription = new Subscription_1.default({
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
            user.currentSubscriptionId = subscription._id;
            user.subscriptionTier = tier;
            user.features = features.map((f) => f.key);
            await user.save();
            await emailService_1.emailService.sendSubscriptionConfirmation(user.email, {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error processing payment',
                error: error.message,
            });
        }
    }
    async cancelSubscription(req, res) {
        try {
            const { reason } = req.body;
            const subscription = await Subscription_1.default.findOne({
                userId: req.user._id,
                status: 'active',
            });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }
            if (subscription.stripeSubscriptionId) {
                try {
                    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
                }
                catch (stripeError) {
                    console.error('Error cancelling Stripe subscription:', stripeError);
                }
            }
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
            subscription.status = 'grace_period';
            subscription.gracePeriodEnd = gracePeriodEnd;
            subscription.autoRenew = false;
            await subscription.save();
            const plan = await SubscriptionPlan_1.default.findById(subscription.planId);
            await emailService_1.emailService.sendSubscriptionCancellation(req.user.email, {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error cancelling subscription',
                error: error.message,
            });
        }
    }
    async upgradeSubscription(req, res) {
        try {
            const { planId, billingInterval = 'monthly' } = req.body;
            const currentSubscription = await Subscription_1.default.findOne({
                userId: req.user._id,
                status: 'active',
            }).populate('planId');
            if (!currentSubscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }
            const newPlan = await SubscriptionPlan_1.default.findById(planId);
            if (!newPlan) {
                return res.status(404).json({
                    success: false,
                    message: 'New plan not found',
                });
            }
            const tierOrder = ['free_trial', 'basic', 'pro', 'enterprise'];
            const currentTierIndex = tierOrder.indexOf(currentSubscription.tier);
            const newTierIndex = tierOrder.indexOf(newPlan.name.toLowerCase().replace(' ', '_'));
            if (newTierIndex <= currentTierIndex) {
                return res.status(400).json({
                    success: false,
                    message: 'This is not an upgrade. Use downgrade endpoint for downgrades.',
                });
            }
            const currentPlan = currentSubscription.planId;
            const daysRemaining = Math.ceil((currentSubscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const totalDaysInPeriod = billingInterval === 'yearly' ? 365 : 30;
            const proratedDiscount = (currentPlan.priceNGN * daysRemaining) / totalDaysInPeriod;
            const upgradeAmount = newPlan.priceNGN - proratedDiscount;
            if (currentSubscription.stripeSubscriptionId) {
                try {
                    const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);
                    const price = await stripe.prices.create({
                        currency: 'ngn',
                        unit_amount: newPlan.priceNGN * 100,
                        recurring: {
                            interval: billingInterval,
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
                }
                catch (stripeError) {
                    console.error('Error updating Stripe subscription:', stripeError);
                }
            }
            const tierMapping = {
                'Free Trial': 'free_trial',
                Basic: 'basic',
                Pro: 'pro',
                Enterprise: 'enterprise',
            };
            const newTier = tierMapping[newPlan.name] || 'basic';
            const features = await FeatureFlag_1.default.find({
                isActive: true,
                allowedTiers: newTier,
            });
            currentSubscription.planId = newPlan._id;
            currentSubscription.tier = newTier;
            currentSubscription.priceAtPurchase = newPlan.priceNGN;
            currentSubscription.features = features.map((f) => f.key);
            await currentSubscription.save();
            const user = await User_1.default.findById(req.user._id);
            if (user) {
                user.subscriptionTier = newTier;
                user.features = features.map((f) => f.key);
                await user.save();
            }
            await emailService_1.emailService.sendSubscriptionUpgrade(req.user.email, {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error upgrading subscription',
                error: error.message,
            });
        }
    }
    async downgradeSubscription(req, res) {
        try {
            const { planId } = req.body;
            const currentSubscription = await Subscription_1.default.findOne({
                userId: req.user._id,
                status: 'active',
            }).populate('planId');
            if (!currentSubscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }
            const newPlan = await SubscriptionPlan_1.default.findById(planId);
            if (!newPlan) {
                return res.status(404).json({
                    success: false,
                    message: 'New plan not found',
                });
            }
            currentSubscription.scheduledDowngrade = {
                planId: newPlan._id,
                effectiveDate: currentSubscription.endDate,
                scheduledAt: new Date(),
            };
            await currentSubscription.save();
            const currentPlan = currentSubscription.planId;
            await emailService_1.emailService.sendSubscriptionDowngrade(req.user.email, {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error scheduling downgrade',
                error: error.message,
            });
        }
    }
    async getSubscriptionAnalytics(req, res) {
        try {
            const subscription = await Subscription_1.default.findOne({
                userId: req.user._id,
                status: { $in: ['active', 'trial', 'grace_period'] },
            }).populate('planId');
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }
            const usageMetrics = {
                currentPeriodStart: subscription.startDate,
                currentPeriodEnd: subscription.endDate,
                daysRemaining: Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                features: subscription.features,
                storageUsed: 0,
                apiCalls: 0,
                teamMembers: 1,
            };
            const costOptimization = {
                currentMonthlySpend: subscription.priceAtPurchase,
                projectedAnnualSpend: subscription.priceAtPurchase * 12,
                savings: {
                    yearlyVsMonthly: subscription.priceAtPurchase * 2,
                    downgradeSavings: 0,
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching analytics',
                error: error.message,
            });
        }
    }
    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
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
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    async handleSubscriptionCreated(stripeSubscription) {
        console.log('Subscription created:', stripeSubscription.id);
    }
    async handleSubscriptionUpdated(stripeSubscription) {
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (subscription) {
            if (stripeSubscription.status === 'active') {
                subscription.status = 'active';
            }
            else if (stripeSubscription.status === 'canceled') {
                subscription.status = 'cancelled';
            }
            await subscription.save();
        }
    }
    async handleSubscriptionDeleted(stripeSubscription) {
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (subscription) {
            subscription.status = 'cancelled';
            await subscription.save();
        }
    }
    async handlePaymentSucceeded(invoice) {
        const stripeSubscriptionId = invoice.subscription;
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscriptionId,
        });
        if (subscription) {
            const newEndDate = new Date(invoice.period_end * 1000);
            subscription.endDate = newEndDate;
            subscription.status = 'active';
            const payment = new Payment_1.default({
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
            subscription.paymentHistory.push(payment._id);
            await subscription.save();
            const user = await User_1.default.findById(subscription.userId);
            if (user) {
                await emailService_1.emailService.sendPaymentConfirmation(user.email, {
                    firstName: user.firstName,
                    amount: invoice.amount_paid / 100,
                    nextBillingDate: newEndDate,
                });
            }
        }
    }
    async handlePaymentFailed(invoice) {
        const stripeSubscriptionId = invoice.subscription;
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscriptionId,
        });
        if (subscription) {
            subscription.renewalAttempts.push({
                attemptedAt: new Date(),
                successful: false,
                error: 'Payment failed',
            });
            const failedAttempts = subscription.renewalAttempts.filter((attempt) => !attempt.successful).length;
            if (failedAttempts >= 3) {
                subscription.status = 'suspended';
            }
            await subscription.save();
            const user = await User_1.default.findById(subscription.userId);
            if (user) {
                await emailService_1.emailService.sendPaymentFailedNotification(user.email, {
                    firstName: user.firstName,
                    attemptNumber: failedAttempts,
                    nextAttempt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                });
            }
        }
    }
}
exports.SubscriptionController = SubscriptionController;
exports.subscriptionController = new SubscriptionController();
//# sourceMappingURL=subscriptionController.js.map