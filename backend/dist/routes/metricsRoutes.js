"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metrics_1 = require("../utils/metrics");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        await (0, metrics_1.updateAllMetrics)();
        res.set('Content-Type', metrics_1.register.contentType);
        const metrics = await metrics_1.register.metrics();
        res.end(metrics);
    }
    catch (error) {
        console.error('Error serving metrics:', error);
        res.status(500).end('Error serving metrics');
    }
});
router.get('/custom-metrics', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Workplace = mongoose.model('Workplace');
        const Subscription = mongoose.model('Subscription');
        const Invitation = mongoose.model('Invitation');
        const User = mongoose.model('User');
        const Patient = mongoose.model('Patient');
        const metrics = {
            timestamp: new Date().toISOString(),
            subscriptions: {
                total: await Subscription.countDocuments(),
                active: await Subscription.countDocuments({ status: 'active' }),
                trial: await Subscription.countDocuments({ status: 'trial' }),
                expired: await Subscription.countDocuments({ status: 'expired' }),
                past_due: await Subscription.countDocuments({ status: 'past_due' }),
                canceled: await Subscription.countDocuments({ status: 'canceled' }),
                by_tier: await Subscription.aggregate([
                    {
                        $group: {
                            _id: '$tier',
                            count: { $sum: 1 },
                        },
                    },
                ]),
            },
            workspaces: {
                total: await Workplace.countDocuments(),
                active: await Workplace.countDocuments({
                    subscriptionStatus: { $in: ['trial', 'active'] },
                }),
                trial: await Workplace.countDocuments({ subscriptionStatus: 'trial' }),
                expired: await Workplace.countDocuments({ subscriptionStatus: 'expired' }),
                trial_expiring_soon: await Workplace.countDocuments({
                    subscriptionStatus: 'trial',
                    trialEndDate: {
                        $gte: new Date(),
                        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                }),
            },
            invitations: {
                total: await Invitation.countDocuments(),
                active: await Invitation.countDocuments({
                    status: 'active',
                    expiresAt: { $gt: new Date() },
                }),
                expired: await Invitation.countDocuments({ status: 'expired' }),
                used: await Invitation.countDocuments({ status: 'used' }),
                canceled: await Invitation.countDocuments({ status: 'canceled' }),
                recent_sent: await Invitation.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                }),
                recent_accepted: await Invitation.countDocuments({
                    status: 'used',
                    usedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                }),
                by_role: await Invitation.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                        },
                    },
                ]),
            },
            users: {
                total: await User.countDocuments(),
                active: await User.countDocuments({ status: 'active' }),
                suspended: await User.countDocuments({ status: 'suspended' }),
                license_rejected: await User.countDocuments({ status: 'license_rejected' }),
                by_role: await User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                        },
                    },
                ]),
                new_users_30d: await User.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                }),
            },
            patients: {
                total: await Patient.countDocuments(),
                new_patients_30d: await Patient.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                }),
                by_workspace: await Patient.aggregate([
                    {
                        $group: {
                            _id: '$workspaceId',
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: 'workplaces',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'workspace',
                        },
                    },
                    {
                        $project: {
                            workspaceId: '$_id',
                            workspaceName: { $arrayElemAt: ['$workspace.name', 0] },
                            patientCount: '$count',
                        },
                    },
                ]),
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
                environment: process.env.NODE_ENV,
            },
            business: {
                mrr: await calculateMRR(),
                arr: await calculateARR(),
                trial_to_paid_rate: await calculateTrialConversionRate(),
                churn_rate: await calculateChurnRate(),
                workspace_growth_rate: await calculateWorkspaceGrowthRate(),
                user_growth_rate: await calculateUserGrowthRate(),
            },
        };
        res.json(metrics);
    }
    catch (error) {
        console.error('Error collecting custom metrics:', error);
        res.status(500).json({
            error: 'Failed to collect custom metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
async function calculateMRR() {
    try {
        const mongoose = require('mongoose');
        const Subscription = mongoose.model('Subscription');
        const activeSubscriptions = await Subscription.find({
            status: 'active',
            billingInterval: 'monthly',
        });
        return activeSubscriptions.reduce((total, sub) => total + (sub.priceAtPurchase || 0), 0);
    }
    catch (error) {
        console.error('Error calculating MRR:', error);
        return 0;
    }
}
async function calculateARR() {
    try {
        const mrr = await calculateMRR();
        const mongoose = require('mongoose');
        const Subscription = mongoose.model('Subscription');
        const yearlySubscriptions = await Subscription.find({
            status: 'active',
            billingInterval: 'yearly',
        });
        const yearlyRevenue = yearlySubscriptions.reduce((total, sub) => total + (sub.priceAtPurchase || 0), 0);
        return (mrr * 12) + yearlyRevenue;
    }
    catch (error) {
        console.error('Error calculating ARR:', error);
        return 0;
    }
}
async function calculateTrialConversionRate() {
    try {
        const mongoose = require('mongoose');
        const Subscription = mongoose.model('Subscription');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const trialsStarted = await Subscription.countDocuments({
            status: { $in: ['trial', 'active', 'expired', 'canceled'] },
            createdAt: { $gte: thirtyDaysAgo },
        });
        const trialsConverted = await Subscription.countDocuments({
            status: 'active',
            createdAt: { $gte: thirtyDaysAgo },
            tier: { $ne: 'free_trial' },
        });
        return trialsStarted > 0 ? (trialsConverted / trialsStarted) * 100 : 0;
    }
    catch (error) {
        console.error('Error calculating trial conversion rate:', error);
        return 0;
    }
}
async function calculateChurnRate() {
    try {
        const mongoose = require('mongoose');
        const Subscription = mongoose.model('Subscription');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeAtStart = await Subscription.countDocuments({
            status: 'active',
            createdAt: { $lt: thirtyDaysAgo },
        });
        const churned = await Subscription.countDocuments({
            status: { $in: ['canceled', 'expired'] },
            updatedAt: { $gte: thirtyDaysAgo },
        });
        return activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;
    }
    catch (error) {
        console.error('Error calculating churn rate:', error);
        return 0;
    }
}
async function calculateWorkspaceGrowthRate() {
    try {
        const mongoose = require('mongoose');
        const Workplace = mongoose.model('Workplace');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const currentPeriod = await Workplace.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });
        const previousPeriod = await Workplace.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        });
        return previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
    }
    catch (error) {
        console.error('Error calculating workspace growth rate:', error);
        return 0;
    }
}
async function calculateUserGrowthRate() {
    try {
        const mongoose = require('mongoose');
        const User = mongoose.model('User');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const currentPeriod = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });
        const previousPeriod = await User.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        });
        return previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
    }
    catch (error) {
        console.error('Error calculating user growth rate:', error);
        return 0;
    }
}
exports.default = router;
//# sourceMappingURL=metricsRoutes.js.map