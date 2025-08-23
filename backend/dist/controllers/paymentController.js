"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebhook = exports.getPayment = exports.createPayment = exports.getPayments = void 0;
const Payment_1 = __importDefault(require("../models/Payment"));
const getPayments = async (req, res) => {
    try {
        const payments = await Payment_1.default.find({ user: req.user.id })
            .populate('subscription')
            .sort({ createdAt: -1 });
        res.json({ payments });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPayments = getPayments;
const createPayment = async (req, res) => {
    try {
        const payment = await Payment_1.default.create({
            ...req.body,
            user: req.user.id
        });
        res.status(201).json({ payment });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPayment = createPayment;
const getPayment = async (req, res) => {
    try {
        const payment = await Payment_1.default.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('subscription');
        if (!payment) {
            res.status(404).json({ message: 'Payment not found' });
            return;
        }
        res.json({ payment });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPayment = getPayment;
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