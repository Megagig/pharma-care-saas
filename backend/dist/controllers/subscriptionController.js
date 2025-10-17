"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = exports.SubscriptionController = void 0;
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const FeatureFlag_1 = require("../models/FeatureFlag");
const Payment_1 = __importDefault(require("../models/Payment"));
const emailService_1 = require("../utils/emailService");
const paystackService_1 = require("../services/paystackService");
class SubscriptionController {
    constructor() {
        this.getAvailablePlans = async (req, res) => {
            try {
                const billingInterval = req.query.billingInterval || 'monthly';
                const PlanConfigService = (await Promise.resolve().then(() => __importStar(require('../services/PlanConfigService')))).default;
                const planConfigService = PlanConfigService.getInstance();
                const configPlans = await planConfigService.getActivePlans();
                const filteredPlans = configPlans
                    .filter(plan => plan.billingInterval === billingInterval)
                    .sort((a, b) => a.tierRank - b.tierRank);
                const config = await planConfigService.loadConfiguration();
                const transformedPlans = filteredPlans.map((plan) => ({
                    ...plan,
                    displayFeatures: this.getDisplayFeaturesFromConfig(plan, config.features),
                }));
                res.json({
                    success: true,
                    data: transformedPlans,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error fetching plans',
                    error: error.message,
                });
            }
        };
    }
    async getCurrentSubscription(req, res) {
        try {
            const user = req.user;
            if (!user.workplaceId) {
                return res.status(200).json({
                    success: true,
                    data: {
                        hasWorkspace: false,
                        hasSubscription: false,
                        subscription: null,
                        status: 'no_workspace',
                        accessLevel: 'basic',
                        availableFeatures: [],
                        isExpired: false,
                        isInGracePeriod: false,
                        canRenew: false,
                        message: 'Create or join a workplace to access full features',
                    },
                });
            }
            const subscription = await Subscription_1.default.findOne({
                workspaceId: user.workplaceId,
                status: { $in: ['active', 'trial', 'grace_period'] },
            })
                .populate('planId')
                .populate('paymentHistory');
            if (!subscription) {
                return res.status(200).json({
                    success: true,
                    data: {
                        hasWorkspace: true,
                        hasSubscription: false,
                        subscription: null,
                        status: 'no_subscription',
                        accessLevel: 'limited',
                        availableFeatures: [],
                        isExpired: true,
                        isInGracePeriod: false,
                        canRenew: true,
                        message: 'No active subscription found for your workplace',
                    },
                });
            }
            const availableFeatures = await FeatureFlag_1.FeatureFlag.find({
                isActive: true,
                allowedTiers: subscription.tier,
            }).select('key name description metadata.category');
            const now = new Date();
            const isTrialActive = subscription.status === 'trial' &&
                subscription.endDate &&
                now <= subscription.endDate;
            let daysRemaining = 0;
            if (isTrialActive && subscription.endDate) {
                const diffTime = subscription.endDate.getTime() - now.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            res.json({
                success: true,
                data: {
                    hasWorkspace: true,
                    hasSubscription: true,
                    subscription,
                    status: subscription.status,
                    tier: subscription.tier,
                    accessLevel: 'full',
                    availableFeatures,
                    isExpired: subscription.isExpired(),
                    isInGracePeriod: subscription.isInGracePeriod(),
                    canRenew: subscription.canRenew(),
                    isTrialActive,
                    daysRemaining,
                    endDate: subscription.endDate,
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
    getDisplayFeaturesFromConfig(plan, featureDefinitions) {
        const features = [];
        if (plan.limits.patients) {
            features.push(`Up to ${plan.limits.patients} patients`);
        }
        else {
            features.push('Unlimited patients');
        }
        if (plan.limits.users) {
            features.push(`Up to ${plan.limits.users} team members`);
        }
        else {
            features.push('Unlimited team members');
        }
        if (plan.limits.locations) {
            features.push(`Up to ${plan.limits.locations} locations`);
        }
        else if (plan.features.includes('multi_location_dashboard')) {
            features.push('Unlimited locations');
        }
        plan.features.forEach((featureCode) => {
            const featureDef = featureDefinitions[featureCode];
            if (featureDef) {
                features.push(featureDef.name);
            }
        });
        if (plan.tier === 'free_trial') {
            features.unshift('14-day free trial with full access');
        }
        if (plan.isContactSales) {
            features.push('Custom pricing available');
            features.push('Dedicated account manager');
        }
        return features;
    }
    getDisplayFeatures(plan) {
        const features = [];
        if (plan.tier === 'free_trial') {
            features.push('Access to all features during trial period');
            features.push('14-day free trial');
        }
        else if (plan.tier === 'basic') {
            features.push(`Up to ${plan.features.patientLimit || 'unlimited'} patients`);
            features.push(`${plan.features.clinicalNotesLimit || 'unlimited'} clinical notes`);
            features.push(`${plan.features.patientRecordsLimit || 'unlimited'} patient records`);
            features.push('Basic reports');
            features.push(`${plan.features.teamSize || 1} User`);
            if (plan.features.emailReminders)
                features.push('Email reminders');
        }
        else if (plan.tier === 'pro') {
            features.push('Unlimited patients');
            features.push('Unlimited clinical notes');
            features.push('Unlimited users');
            features.push('Priority support');
            if (plan.features.integrations)
                features.push('Integrations');
            if (plan.features.emailReminders)
                features.push('Email reminders');
            if (plan.features.advancedReports)
                features.push('Advanced reports');
            if (plan.features.drugTherapyManagement)
                features.push('Drug Therapy Management');
        }
        else if (plan.tier === 'pharmily') {
            features.push('Everything in Pro plan');
            features.push('ADR Reporting');
            features.push('Drug Interaction Checker');
            features.push('Dose Calculator');
            features.push('Advanced Reporting');
            if (plan.features.integrations)
                features.push('Integrations');
            if (plan.features.emailReminders)
                features.push('Email reminders');
        }
        else if (plan.tier === 'network') {
            features.push('Everything in Pharmily plan');
            features.push('Multi-location Dashboard');
            features.push('Shared Patient Records');
            features.push('Group Analytics');
            features.push('Clinical Decision Support System (CDSS)');
            features.push('Team Management');
            if (plan.features.smsReminders)
                features.push('SMS reminders');
        }
        else if (plan.tier === 'enterprise') {
            features.push('Everything in Network plan');
            features.push('Dedicated support');
            features.push('Team management');
            features.push('ADR reporting');
            features.push('Advanced reports');
            if (plan.features.smsReminders)
                features.push('SMS reminders');
            if (plan.features.customIntegrations)
                features.push('Custom integrations');
        }
        return features;
    }
    async createCheckoutSession(req, res) {
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
            const { planId, planSlug, tier, billingInterval = 'monthly', amount } = req.body;
            console.log('Looking for subscription plan:', {
                planId,
                planSlug,
                tier,
                billingInterval,
                amount,
            });
            let plan = null;
            if (planId) {
                plan = await SubscriptionPlan_1.default.findOne({
                    _id: planId,
                    billingInterval: billingInterval,
                });
            }
            if (!plan && planSlug) {
                const tierFromSlug = planSlug.split('-')[0];
                plan = await SubscriptionPlan_1.default.findOne({
                    tier: tierFromSlug,
                    billingInterval: billingInterval,
                });
            }
            if (!plan && tier) {
                plan = await SubscriptionPlan_1.default.findOne({
                    tier: tier,
                    billingInterval: billingInterval,
                });
            }
            if (!plan && planSlug) {
                console.log('SubscriptionPlan not found, trying PricingPlan...');
                const PricingPlan = (await Promise.resolve().then(() => __importStar(require('../models/PricingPlan')))).default;
                const pricingPlan = await PricingPlan.findOne({ slug: planSlug });
                if (pricingPlan) {
                    console.log('Found PricingPlan, using it for checkout:', {
                        id: pricingPlan._id,
                        name: pricingPlan.name,
                        tier: pricingPlan.tier,
                        price: pricingPlan.price,
                    });
                    plan = {
                        _id: pricingPlan._id,
                        name: pricingPlan.name,
                        tier: pricingPlan.tier,
                        priceNGN: pricingPlan.price,
                        billingInterval: pricingPlan.billingPeriod,
                        features: pricingPlan.features || [],
                    };
                }
            }
            if (!plan) {
                console.error('No plan found with criteria:', { planId, planSlug, tier, billingInterval });
                return res.status(404).json({
                    success: false,
                    message: 'Subscription plan not found. Please contact support.',
                });
            }
            console.log('Using plan for checkout:', {
                id: plan._id,
                name: plan.name,
                tier: plan.tier,
                price: plan.priceNGN,
            });
            const user = req.user;
            if (!user) {
                console.error('createCheckoutSession - No user in request');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            console.log('Checking for existing subscription for user:', user._id.toString(), 'workplaceId:', user.workplaceId?.toString());
            const existingSubscription = await Subscription_1.default.findOne({
                workspaceId: user.workplaceId,
                status: { $in: ['active', 'trial'] },
            });
            console.log('Existing subscription check result:', existingSubscription
                ? {
                    id: existingSubscription._id,
                    status: existingSubscription.status,
                    planId: existingSubscription.planId,
                    endDate: existingSubscription.endDate,
                }
                : 'No active subscription');
            if (existingSubscription) {
                console.log('User has existing subscription, allowing upgrade/change:', {
                    currentStatus: existingSubscription.status,
                    currentTier: existingSubscription.tier,
                    newTier: plan.tier
                });
            }
            const pendingPayment = await Payment_1.default.findOne({
                userId: user._id,
                status: 'pending',
                planId: plan._id
            });
            if (pendingPayment) {
                console.log('Found existing pending payment, checking if it can be reused:', pendingPayment.paymentReference);
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                if (pendingPayment.createdAt > thirtyMinutesAgo) {
                    console.log('Reusing recent pending payment:', pendingPayment.paymentReference);
                    return res.json({
                        success: true,
                        data: {
                            authorization_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.FRONTEND_URL}/subscriptions?payment=pending&reference=${pendingPayment.paymentReference}`,
                            access_code: 'existing_pending',
                            reference: pendingPayment.paymentReference,
                        },
                        message: 'Existing pending payment found',
                    });
                }
                else {
                    console.log('Pending payment is old, marking as expired and creating new one');
                    pendingPayment.status = 'failed';
                    await pendingPayment.save();
                }
            }
            const paymentData = {
                email: user.email,
                amount: paystackService_1.PaystackService.convertToKobo(plan.priceNGN),
                currency: 'NGN',
                callback_url: req.body.callbackUrl ||
                    `${process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.FRONTEND_URL}/subscription/success`,
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
            if (process.env.NODE_ENV === 'development' &&
                !paystackService_1.paystackService.isConfigured()) {
                const mockReference = `mock_${Date.now()}_${user._id}`;
                const mockCheckoutUrl = `${process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.FRONTEND_URL}/subscription-management/checkout?reference=${mockReference}&planId=${planId}`;
                await Payment_1.default.create({
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
            if (!paystackService_1.paystackService.isConfigured()) {
                return res.status(500).json({
                    success: false,
                    message: 'Payment service is not properly configured. Please contact support.',
                });
            }
            const paymentResponse = await paystackService_1.paystackService.initializeTransaction(paymentData);
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
            await Payment_1.default.create({
                userId: user._id,
                planId: plan._id,
                amount: plan.priceNGN,
                currency: 'NGN',
                paymentReference: paymentResponse.data.reference,
                status: 'pending',
                paymentMethod: 'paystack',
                metadata: paymentData.metadata,
            });
            res.json({
                success: true,
                data: {
                    authorization_url: paymentResponse.data.authorization_url,
                    access_code: paymentResponse.data.access_code,
                    reference: paymentResponse.data.reference,
                },
            });
        }
        catch (error) {
            console.error('Checkout session creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating checkout session',
                error: error.message,
            });
        }
    }
    async verifyPaymentByReference(req, res) {
        try {
            const reference = req.query.reference;
            if (!reference) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment reference is required',
                });
            }
            const verificationResult = await paystackService_1.paystackService.verifyTransaction(reference);
            if (!verificationResult.success || !verificationResult.data) {
                return res.status(400).json({
                    success: false,
                    message: verificationResult.message || 'Payment verification failed',
                });
            }
            const paymentData = verificationResult.data;
            if (paymentData.status === 'success') {
                try {
                    console.log('Payment verified as successful, looking for payment record:', reference);
                    const paymentRecord = await Payment_1.default.findOne({
                        paymentReference: reference,
                    });
                    console.log('Payment record found:', paymentRecord ? {
                        id: paymentRecord._id,
                        userId: paymentRecord.userId,
                        status: paymentRecord.status,
                        amount: paymentRecord.amount
                    } : 'No payment record found');
                    if (paymentRecord && paymentRecord.status !== 'completed') {
                        console.log('Processing subscription activation for verified payment:', reference);
                        paymentRecord.status = 'completed';
                        paymentRecord.completedAt = new Date();
                        await paymentRecord.save();
                        await this.processSubscriptionActivation(paymentRecord);
                        console.log('Subscription activation completed for payment:', reference);
                    }
                    else if (paymentRecord && paymentRecord.status === 'completed') {
                        console.log('Payment already processed, skipping activation:', reference);
                    }
                }
                catch (activationError) {
                    console.error('Error during subscription activation:', activationError);
                }
            }
            return res.status(200).json({
                success: true,
                data: {
                    status: paymentData.status,
                    reference: paymentData.reference,
                    amount: paymentData.amount,
                },
            });
        }
        catch (error) {
            console.error('Error verifying payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying payment',
                error: error.message,
            });
        }
    }
    async handleSuccessfulPayment(req, res) {
        try {
            const { paymentReference } = req.body;
            if (!paymentReference) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment reference is required',
                });
            }
            let paymentData;
            if (process.env.NODE_ENV === 'development' &&
                paymentReference.startsWith('mock_')) {
                paymentData = {
                    status: 'success',
                    reference: paymentReference,
                    amount: 0,
                    currency: 'NGN',
                    customerEmail: '',
                };
            }
            else {
                const verificationResult = await paystackService_1.paystackService.verifyTransaction(paymentReference);
                if (!verificationResult.success || !verificationResult.data) {
                    return res.status(400).json({
                        success: false,
                        message: verificationResult.message || 'Payment verification failed',
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
            const paymentRecord = await Payment_1.default.findOne({
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
            const billingInterval = paymentRecord.metadata?.billingInterval || 'monthly';
            if (!userId || !planId) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment metadata',
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
            await Subscription_1.default.updateMany({ userId: userId, status: { $in: ['active', 'trial'] } }, { status: 'cancelled' });
            const startDate = new Date();
            const endDate = new Date();
            if (billingInterval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            const subscription = new Subscription_1.default({
                userId: userId,
                planId: planId,
                tier: plan.tier,
                status: plan.tier === 'free_trial' ? 'trial' : 'active',
                startDate: startDate,
                endDate: endDate,
                priceAtPurchase: plan.priceNGN,
                autoRenew: true,
                paymentReference: paymentReference,
                features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
            });
            await subscription.save();
            paymentRecord.status = 'completed';
            paymentRecord.completedAt = new Date();
            await paymentRecord.save();
            user.currentSubscriptionId = subscription._id;
            user.subscriptionTier = plan.tier;
            user.currentPlanId = planId;
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
                status: { $in: ['active', 'trial'] },
            });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
            subscription.status = 'past_due';
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
            const tierOrder = [
                'free_trial',
                'basic',
                'pro',
                'pharmily',
                'network',
                'enterprise',
            ];
            const currentTierIndex = tierOrder.indexOf(currentSubscription.tier);
            const newTierIndex = tierOrder.indexOf(newPlan.name.toLowerCase().replace(' ', '_'));
            if (newTierIndex <= currentTierIndex) {
                return res.status(400).json({
                    success: false,
                    message: 'This is not an upgrade. Use downgrade endpoint for downgrades.',
                });
            }
            const currentPlan = currentSubscription.planId;
            const daysRemaining = Math.ceil((currentSubscription.endDate.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24));
            const totalDaysInPeriod = billingInterval === 'yearly' ? 365 : 30;
            const proratedDiscount = (currentPlan.priceNGN * daysRemaining) / totalDaysInPeriod;
            const upgradeAmount = newPlan.priceNGN - proratedDiscount;
            console.log('Processing subscription upgrade...');
            const tierMapping = {
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
            const features = await FeatureFlag_1.FeatureFlag.find({
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
    async getSubscriptionStatus(req, res) {
        try {
            const user = req.user;
            if (!user.workplaceId) {
                return res.json({
                    success: true,
                    data: {
                        hasWorkspace: false,
                        hasSubscription: false,
                        status: 'no_workspace',
                        accessLevel: 'basic',
                        message: 'Create or join a workplace to access full features',
                    },
                });
            }
            const subscription = await Subscription_1.default.findOne({
                workspaceId: user.workplaceId,
                status: { $in: ['active', 'trial', 'grace_period'] },
            }).populate('planId');
            if (!subscription) {
                return res.json({
                    success: true,
                    data: {
                        hasWorkspace: true,
                        hasSubscription: false,
                        status: 'no_subscription',
                        accessLevel: 'limited',
                        message: 'No active subscription found',
                    },
                });
            }
            const now = new Date();
            const isTrialActive = subscription.status === 'trial' &&
                subscription.endDate &&
                now <= subscription.endDate;
            let daysRemaining = 0;
            if (isTrialActive && subscription.endDate) {
                const diffTime = subscription.endDate.getTime() - now.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            res.json({
                success: true,
                data: {
                    hasWorkspace: true,
                    hasSubscription: true,
                    status: subscription.status,
                    tier: subscription.tier,
                    accessLevel: 'full',
                    isTrialActive,
                    daysRemaining,
                    endDate: subscription.endDate,
                    planId: subscription.planId,
                    features: subscription.features || [],
                    limits: subscription.limits || {},
                },
            });
        }
        catch (error) {
            console.error('Error fetching subscription status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subscription status',
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
        const signature = req.headers['x-paystack-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing webhook signature' });
        }
        let event;
        try {
            const payload = JSON.stringify(req.body);
            const isValid = paystackService_1.paystackService.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                console.log('Webhook signature verification failed');
                return res.status(400).json({ error: 'Invalid webhook signature' });
            }
            event = req.body;
        }
        catch (err) {
            console.log('Webhook processing error:', err.message);
            return res
                .status(400)
                .json({ error: `Webhook Error: ${err.message}` });
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
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    async handleSubscriptionCreated(subscription) {
        console.log('Subscription created via Nomba');
    }
    async handleSubscriptionUpdated(subscription) {
        console.log('Subscription updated via Nomba');
    }
    async handleSubscriptionDeleted(subscription) {
        console.log('Subscription deleted via Nomba');
    }
    async handlePaymentSucceeded(paymentData) {
        console.log('Payment succeeded', paymentData?.reference || 'Unknown reference');
    }
    async handlePaymentFailed(paymentData) {
        console.log('Payment failed', paymentData?.reference || 'Unknown reference');
    }
    async handlePaystackPaymentSucceeded(paymentData) {
        try {
            const reference = paymentData.reference;
            if (!reference)
                return;
            const paymentRecord = await Payment_1.default.findOne({
                paymentReference: reference,
                status: 'pending',
            });
            if (!paymentRecord) {
                console.log('Payment record not found for reference:', reference);
                return;
            }
            console.log('Processing Paystack payment success via webhook:', reference);
            paymentRecord.status = 'completed';
            paymentRecord.completedAt = new Date();
            await paymentRecord.save();
            await this.processSubscriptionActivation(paymentRecord);
        }
        catch (error) {
            console.error('Error handling Paystack payment success:', error);
        }
    }
    async handlePaystackPaymentFailed(paymentData) {
        try {
            const reference = paymentData.reference;
            if (!reference)
                return;
            await Payment_1.default.updateOne({ paymentReference: reference }, {
                status: 'failed',
                failedAt: new Date(),
            });
            console.log('Payment failed for reference:', reference);
        }
        catch (error) {
            console.error('Error handling Paystack payment failure:', error);
        }
    }
    async handlePaystackSubscriptionCreated(subscriptionData) {
        console.log('Paystack subscription created:', subscriptionData);
    }
    async handlePaystackSubscriptionDisabled(subscriptionData) {
        console.log('Paystack subscription disabled:', subscriptionData);
    }
    async processSubscriptionActivation(paymentRecord) {
        try {
            const userId = paymentRecord.userId;
            const planId = paymentRecord.planId;
            const billingInterval = paymentRecord.metadata?.billingInterval || 'monthly';
            const tier = paymentRecord.metadata?.tier;
            const user = await User_1.default.findById(userId);
            let plan = await SubscriptionPlan_1.default.findById(planId);
            if (!plan && planId) {
                console.log('SubscriptionPlan not found, trying PricingPlan...');
                const PricingPlan = (await Promise.resolve().then(() => __importStar(require('../models/PricingPlan')))).default;
                const pricingPlan = await PricingPlan.findById(planId);
                if (pricingPlan) {
                    console.log('Found PricingPlan for activation:', pricingPlan.name);
                    plan = {
                        _id: pricingPlan._id,
                        name: pricingPlan.name,
                        tier: pricingPlan.tier,
                        priceNGN: pricingPlan.price,
                        features: pricingPlan.features || [],
                    };
                }
            }
            if (!user || !plan) {
                console.error('User or plan not found for subscription activation', {
                    userId,
                    planId,
                    userFound: !!user,
                    planFound: !!plan,
                });
                return;
            }
            if (!user.workplaceId) {
                console.error('User does not have a workplaceId for subscription activation', {
                    userId,
                    userEmail: user.email,
                });
                return;
            }
            console.log('Activating subscription for user:', {
                userId: user._id,
                email: user.email,
                planName: plan.name,
                tier: plan.tier,
            });
            await Subscription_1.default.updateMany({ workspaceId: user.workplaceId, status: { $in: ['active', 'trial'] } }, { status: 'cancelled' });
            const startDate = new Date();
            const endDate = new Date();
            if (billingInterval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            const subscription = new Subscription_1.default({
                workspaceId: user.workplaceId,
                planId: planId,
                tier: plan.tier,
                status: plan.tier === 'free_trial' ? 'trial' : 'active',
                startDate: startDate,
                endDate: endDate,
                priceAtPurchase: plan.priceNGN,
                autoRenew: true,
                paymentReference: paymentRecord.paymentReference,
                features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
            });
            await subscription.save();
            user.currentSubscriptionId = subscription._id;
            user.subscriptionTier = plan.tier;
            user.currentPlanId = planId;
            await user.save();
            await emailService_1.emailService.sendSubscriptionConfirmation(user.email, {
                firstName: user.firstName,
                planName: plan.name,
                amount: plan.priceNGN,
                billingInterval: billingInterval,
                startDate: startDate,
                endDate: endDate,
            });
            console.log('Subscription activated successfully for user:', userId);
        }
        catch (error) {
            console.error('Error processing subscription activation:', error);
        }
    }
    async getBillingHistory(req, res) {
        try {
            const payments = await Payment_1.default.find({
                userId: req.user._id,
            })
                .populate('planId')
                .sort({ createdAt: -1 })
                .limit(50);
            res.json({
                success: true,
                data: payments,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching billing history',
                error: error.message,
            });
        }
    }
    async getUsageMetrics(req, res) {
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
                patientsCount: 0,
                notesCount: 0,
                teamMembers: 1,
            };
            res.json({
                success: true,
                data: usageMetrics,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching usage metrics',
                error: error.message,
            });
        }
    }
}
exports.SubscriptionController = SubscriptionController;
exports.subscriptionController = new SubscriptionController();
//# sourceMappingURL=subscriptionController.js.map