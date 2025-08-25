"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Subscription = mongoose_1.default.model('Subscription');
const Payment = mongoose_1.default.model('Payment');
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
}
exports.subscriptionController = new SubscriptionController();
//# sourceMappingURL=subscriptionManagementController.js.map