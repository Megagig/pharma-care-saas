"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewSubscription = exports.cancelSubscription = exports.updateSubscription = exports.getSubscription = exports.getPlans = void 0;
const Subscription_1 = __importDefault(require("../models/Subscription"));
const getPlans = async (req, res) => {
    try {
        const plans = [
            {
                id: 'basic',
                name: 'Basic',
                price: 29.99,
                features: ['Up to 50 patients', '500 clinical notes', '2GB storage'],
                limits: { maxPatients: 50, maxNotes: 500, storageGB: 2 }
            },
            {
                id: 'professional',
                name: 'Professional',
                price: 59.99,
                features: ['Up to 200 patients', '2000 clinical notes', '10GB storage', 'Advanced reporting'],
                limits: { maxPatients: 200, maxNotes: 2000, storageGB: 10 }
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 99.99,
                features: ['Unlimited patients', 'Unlimited notes', '50GB storage', 'Priority support'],
                limits: { maxPatients: -1, maxNotes: -1, storageGB: 50 }
            }
        ];
        res.json({ plans });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPlans = getPlans;
const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription_1.default.findOne({ user: req.user.id });
        res.json({ subscription });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getSubscription = getSubscription;
const updateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription_1.default.findOneAndUpdate({ user: req.user.id }, req.body, { new: true, runValidators: true });
        res.json({ subscription });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateSubscription = updateSubscription;
const cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription_1.default.findOneAndUpdate({ user: req.user.id }, { status: 'cancelled', autoRenew: false }, { new: true });
        res.json({ message: 'Subscription cancelled', subscription });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.cancelSubscription = cancelSubscription;
const renewSubscription = async (req, res) => {
    try {
        const subscription = await Subscription_1.default.findOneAndUpdate({ user: req.user.id }, {
            status: 'active',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }, { new: true });
        res.json({ message: 'Subscription renewed', subscription });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.renewSubscription = renewSubscription;
//# sourceMappingURL=subscriptionController.js.map