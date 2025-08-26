"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebhook = exports.generateInvoice = exports.createSetupIntent = exports.setDefaultPaymentMethod = exports.removePaymentMethod = exports.addPaymentMethod = exports.getPaymentMethods = exports.getPayment = exports.createPayment = exports.getPayments = void 0;
const stripe_1 = __importDefault(require("stripe"));
const Payment_1 = __importDefault(require("../models/Payment"));
const User_1 = __importDefault(require("../models/User"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});
const getPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const filter = { user: req.user._id };
        if (status) {
            filter.status = status;
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom)
                filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                filter.createdAt.$lte = new Date(dateTo);
        }
        const [payments, totalCount] = await Promise.all([
            Payment_1.default.find(filter)
                .populate('subscription', 'tier planId status')
                .populate({
                path: 'subscription',
                populate: {
                    path: 'planId',
                    model: 'SubscriptionPlan',
                    select: 'name priceNGN billingInterval'
                }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Payment_1.default.countDocuments(filter)
        ]);
        const summary = await Payment_1.default.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalPayments: { $sum: 1 },
                    successfulPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    failedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    }
                }
            }
        ]);
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: skip + Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                summary: summary.length > 0 ? summary[0] : {
                    totalAmount: 0,
                    totalPayments: 0,
                    successfulPayments: 0,
                    failedPayments: 0
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};
exports.getPayments = getPayments;
const createPayment = async (req, res) => {
    try {
        const payment = await Payment_1.default.create({
            ...req.body,
            user: req.user._id
        });
        res.status(201).json({
            success: true,
            data: { payment }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating payment',
            error: error.message
        });
    }
};
exports.createPayment = createPayment;
const getPayment = async (req, res) => {
    try {
        const payment = await Payment_1.default.findOne({
            _id: req.params.id,
            user: req.user._id
        })
            .populate('subscription')
            .populate({
            path: 'subscription',
            populate: {
                path: 'planId',
                model: 'SubscriptionPlan'
            }
        });
        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { payment }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payment',
            error: error.message
        });
    }
};
exports.getPayment = getPayment;
const getPaymentMethods = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user || !user.stripeCustomerId) {
            res.json({
                success: true,
                data: { paymentMethods: [] }
            });
            return;
        }
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        const defaultPaymentMethodId = typeof customer !== 'string' && !customer.deleted && customer.invoice_settings?.default_payment_method;
        const formattedMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            expiryMonth: pm.card?.exp_month,
            expiryYear: pm.card?.exp_year,
            isDefault: pm.id === defaultPaymentMethodId,
            createdAt: new Date(pm.created * 1000)
        }));
        res.json({
            success: true,
            data: { paymentMethods: formattedMethods }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payment methods',
            error: error.message
        });
    }
};
exports.getPaymentMethods = getPaymentMethods;
const addPaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId, setAsDefault = false } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user || !user.stripeCustomerId) {
            res.status(400).json({
                success: false,
                message: 'User does not have a Stripe customer ID'
            });
            return;
        }
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: user.stripeCustomerId,
        });
        if (setAsDefault) {
            await stripe.customers.update(user.stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }
        res.json({
            success: true,
            message: 'Payment method added successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding payment method',
            error: error.message
        });
    }
};
exports.addPaymentMethod = addPaymentMethod;
const removePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        if (!paymentMethodId) {
            res.status(400).json({
                success: false,
                message: 'Payment method ID is required'
            });
            return;
        }
        await stripe.paymentMethods.detach(paymentMethodId);
        res.json({
            success: true,
            message: 'Payment method removed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing payment method',
            error: error.message
        });
    }
};
exports.removePaymentMethod = removePaymentMethod;
const setDefaultPaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user || !user.stripeCustomerId) {
            res.status(400).json({
                success: false,
                message: 'User does not have a Stripe customer ID'
            });
            return;
        }
        await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        res.json({
            success: true,
            message: 'Default payment method updated successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating default payment method',
            error: error.message
        });
    }
};
exports.setDefaultPaymentMethod = setDefaultPaymentMethod;
const createSetupIntent = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        let stripeCustomerId = user?.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user?.email,
                name: `${user?.firstName} ${user?.lastName}`,
                metadata: {
                    userId: user?._id.toString() || '',
                },
            });
            stripeCustomerId = customer.id;
            await User_1.default.findByIdAndUpdate(user?._id, { stripeCustomerId });
        }
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            usage: 'off_session',
        });
        res.json({
            success: true,
            data: {
                clientSecret: setupIntent.client_secret,
                setupIntentId: setupIntent.id
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating setup intent',
            error: error.message
        });
    }
};
exports.createSetupIntent = createSetupIntent;
const generateInvoice = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment_1.default.findOne({
            _id: paymentId,
            user: req.user._id
        })
            .populate('subscription')
            .populate({
            path: 'subscription',
            populate: {
                path: 'planId',
                model: 'SubscriptionPlan'
            }
        });
        if (!payment) {
            res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
            return;
        }
        const invoiceData = {
            invoiceNumber: payment.invoice?.invoiceNumber || `INV-${payment._id}`,
            paymentId: payment._id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            date: payment.createdAt,
            customer: {
                name: `${req.user.firstName} ${req.user.lastName}`,
                email: req.user.email,
            },
            items: payment.invoice?.items || [{
                    description: 'Subscription Plan',
                    amount: payment.amount,
                    quantity: 1
                }]
        };
        res.json({
            success: true,
            data: { invoice: invoiceData }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating invoice',
            error: error.message
        });
    }
};
exports.generateInvoice = generateInvoice;
const processWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment.succeeded') {
            await Payment_1.default.findByIdAndUpdate(data.paymentId, { status: 'completed' });
        }
        res.json({ received: true });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.processWebhook = processWebhook;
//# sourceMappingURL=paymentController.js.map