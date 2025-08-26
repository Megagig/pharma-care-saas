"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const paystackService_1 = require("../services/paystackService");
const Subscription = mongoose_1.default.model('Subscription');
const Payment = mongoose_1.default.model('Payment');
const SubscriptionPlan = mongoose_1.default.model('SubscriptionPlan');
class SubscriptionController {
    async getSubscriptionAnalytics(req, res) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            const currentSubscription = await Subscription.findOne({
                userId,
                status: 'active',
            }).populate('planId');
            const payments = await Payment.find({
                userId,
                createdAt: { $gte: thirtyDaysAgo },
            });
            const totalPayments = payments.length;
            const successfulPayments = payments.filter((p) => p.status === 'completed').length;
            const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
            return res.json({
                currentPlan: currentSubscription?.planId?.name || 'No active plan',
                billingCycle: currentSubscription?.planId?.billingInterval || 'N/A',
                status: currentSubscription?.status || 'inactive',
                metrics: {
                    totalPayments,
                    successfulPayments,
                    totalAmount,
                    averageAmount,
                },
                subscription: currentSubscription,
                recentPayments: payments.slice(0, 5),
            });
        }
        catch (error) {
            console.error('Error fetching subscription analytics:', error);
            return res
                .status(500)
                .json({ message: 'Error fetching subscription analytics' });
        }
    }
    async checkout(req, res) {
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
            const amountInKobo = Math.round(plan.priceNGN * 100);
            const reference = `sub_${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const transactionData = {
                email: userEmail,
                amount: amountInKobo,
                reference,
                callback_url: callbackUrl || `${process.env.FRONTEND_URL}/subscription/verify`,
                metadata: {
                    userId: userId.toString(),
                    planId: planId,
                    planName: plan.name,
                    billingInterval: plan.billingInterval,
                },
            };
            const response = await paystackService_1.paystackService.initializeTransaction(transactionData);
            if (!response.success) {
                return res.status(500).json({
                    message: 'Failed to initialize payment',
                    error: response.message,
                });
            }
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
        }
        catch (error) {
            console.error('Error initializing subscription checkout:', error);
            return res.status(500).json({
                message: 'Error initializing subscription checkout',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async verifyPayment(req, res) {
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
            const verificationResponse = await paystackService_1.paystackService.verifyTransaction(reference);
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
            const metadata = paymentData.metadata || {};
            const planId = metadata.planId;
            if (!planId) {
                return res
                    .status(400)
                    .json({ message: 'Invalid payment data: missing plan information' });
            }
            const plan = await SubscriptionPlan.findById(planId);
            if (!plan) {
                return res.status(404).json({ message: 'Subscription plan not found' });
            }
            const payment = await Payment.findOneAndUpdate({ paymentReference: reference }, {
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
            }, { new: true });
            if (!payment) {
                await Payment.create({
                    userId,
                    planId,
                    amount: plan.priceNGN,
                    currency: 'NGN',
                    paymentMethod: 'credit_card',
                    status: 'completed',
                    completedAt: new Date(),
                    paymentReference: reference,
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
            const startDate = new Date();
            const endDate = new Date();
            if (plan.billingInterval === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            else if (plan.billingInterval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            const existingSubscription = await Subscription.findOne({
                userId,
                status: { $in: ['active', 'trial'] },
            });
            if (existingSubscription) {
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
                    features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
                    autoRenew: true,
                });
            }
            else {
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
                    features: Object.keys(plan.features).filter((key) => plan.features[key] === true),
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
        }
        catch (error) {
            console.error('Error verifying payment:', error);
            return res.status(500).json({
                message: 'Error verifying payment',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
}
exports.subscriptionController = new SubscriptionController();
//# sourceMappingURL=subscriptionManagementController.js.map