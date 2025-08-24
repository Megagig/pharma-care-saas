"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = void 0;
const requireActiveSubscription = async (req, res, next) => {
    try {
        const subscription = req.subscription;
        if (!subscription || (subscription.isExpired && subscription.isExpired())) {
            res.status(402).json({
                message: 'Subscription expired or not found.',
                requiresPayment: true,
                subscriptionStatus: subscription?.status || 'none',
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Server error checking subscription' });
    }
};
exports.requireActiveSubscription = requireActiveSubscription;
//# sourceMappingURL=subscriptionCheck.js.map