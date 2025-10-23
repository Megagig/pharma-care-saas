"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compatibilityLayer_1 = require("../middlewares/compatibilityLayer");
const router = express_1.default.Router();
router.use('/pharmacy/:pharmacyId/*', (req, res, next) => {
    const originalUrl = req.originalUrl;
    const newUrl = originalUrl.replace('/pharmacy/', '/workspace/').replace('/pharmacyId/', '/workspaceId/');
    console.log('Legacy API redirect:', originalUrl, '->', newUrl, req.method);
    req.url = newUrl.replace('/api/legacy', '/api');
    req.params.workspaceId = req.params.pharmacyId;
    next();
});
router.get('/user/subscription', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const user = req.user;
        let subscription = null;
        let plan = null;
        if (req.workplace?.currentSubscriptionId) {
            subscription = req.subscription;
            plan = req.plan;
        }
        else if (user.currentSubscriptionId) {
            const Subscription = require('../models/Subscription').default;
            subscription = await Subscription.findById(user.currentSubscriptionId).populate('planId');
            plan = subscription?.planId;
        }
        return res.json({
            success: true,
            subscription: subscription ? {
                id: subscription._id,
                status: subscription.status,
                tier: subscription.tier,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                trialEndDate: subscription.trialEndDate,
                features: subscription.features,
                limits: subscription.limits,
                plan: plan ? {
                    id: plan._id,
                    name: plan.name,
                    tier: plan.tier,
                    priceNGN: plan.priceNGN,
                    features: plan.features,
                    limits: plan.limits,
                } : null,
            } : null,
            userSubscription: subscription,
            currentPlan: plan,
        });
    }
    catch (error) {
        console.error('Legacy user subscription endpoint error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/user/profile', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const user = req.user;
        return res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                licenseStatus: user.licenseStatus,
                features: user.features,
                permissions: user.permissions,
                workplaceId: user.workplaceId,
                workplaceRole: user.workplaceRole,
                workplace: req.workplace ? {
                    id: req.workplace._id,
                    name: req.workplace.name,
                    type: req.workplace.type,
                    subscriptionStatus: req.workplace.subscriptionStatus,
                } : null,
                pharmacyId: user.workplaceId,
                pharmacy: req.workplace,
            },
            subscription: req.subscription,
            plan: req.plan,
        });
    }
    catch (error) {
        console.error('Legacy user profile endpoint error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/pharmacy/:pharmacyId', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId || req.params.pharmacyId;
        const Workplace = require('../models/Workplace').default;
        const workplace = await Workplace.findById(workspaceId)
            .populate('ownerId', 'firstName lastName email')
            .populate('teamMembers', 'firstName lastName email role workplaceRole')
            .populate('currentSubscriptionId');
        if (!workplace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found',
                code: 'WORKSPACE_NOT_FOUND',
            });
        }
        const hasAccess = workplace.ownerId._id.toString() === req.user._id.toString() ||
            workplace.teamMembers.some((member) => member._id.toString() === req.user._id.toString()) ||
            req.user.role === 'super_admin';
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this workspace',
                code: 'ACCESS_DENIED',
            });
        }
        return res.json({
            success: true,
            workspace: workplace,
            pharmacy: workplace,
        });
    }
    catch (error) {
        console.error('Legacy pharmacy endpoint error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch workspace',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/pharmacy/:pharmacyId/team', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId || req.params.pharmacyId;
        const User = require('../models/User').default;
        const teamMembers = await User.find({
            workplaceId: workspaceId,
        }).select('-passwordHash -resetToken -verificationToken');
        return res.json({
            success: true,
            teamMembers,
            pharmacyTeam: teamMembers,
        });
    }
    catch (error) {
        console.error('Legacy team endpoint error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch team members',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.post('/user/subscription/upgrade', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required',
                code: 'PLAN_ID_REQUIRED',
            });
        }
        if (req.workplace) {
            const subscriptionController = require('../controllers/subscriptionManagementController');
            req.params.workspaceId = req.workplace._id.toString();
            req.body.workspaceId = req.workplace._id;
            return await subscriptionController.upgradeWorkspaceSubscription(req, res);
        }
        else {
            console.warn('Legacy user subscription upgrade attempted:', req.user._id, planId);
            return res.status(400).json({
                success: false,
                message: 'User must be migrated to workspace-based subscription',
                code: 'MIGRATION_REQUIRED',
                migrationRequired: true,
            });
        }
    }
    catch (error) {
        console.error('Legacy subscription upgrade error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upgrade subscription',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/user/features/:feature', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const { feature } = req.params;
        const user = req.user;
        if (!feature) {
            return res.status(400).json({
                success: false,
                message: 'Feature parameter is required',
            });
        }
        const hasAccess = user.role === 'super_admin' ||
            user.features?.includes(feature) ||
            req.subscription?.features?.includes(feature) ||
            req.subscription?.customFeatures?.includes(feature) ||
            req.plan?.features?.includes(feature);
        return res.json({
            success: true,
            feature,
            hasAccess,
            source: user.role === 'super_admin' ? 'super_admin' :
                user.features?.includes(feature) ? 'user' :
                    req.subscription?.features?.includes(feature) ? 'subscription' :
                        req.subscription?.customFeatures?.includes(feature) ? 'custom' :
                            req.plan?.features?.includes(feature) ? 'plan' : 'none',
            currentTier: req.subscription?.tier || 'free_trial',
        });
    }
    catch (error) {
        console.error('Legacy feature check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check feature access',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/user/usage', compatibilityLayer_1.compatibilityAuth, (0, compatibilityLayer_1.legacyEndpointWrapper)(async (req, res) => {
    try {
        const user = req.user;
        let usage = {};
        let limits = {};
        if (req.workplace?.stats) {
            usage = {
                patients: req.workplace.stats.patientsCount,
                users: req.workplace.stats.usersCount,
                storage: req.workplace.stats.storageUsed || 0,
                apiCalls: req.workplace.stats.apiCallsThisMonth || 0,
            };
        }
        if (req.subscription?.limits) {
            limits = req.subscription.limits;
        }
        else if (req.plan?.limits) {
            limits = req.plan.limits;
        }
        return res.json({
            success: true,
            usage,
            limits,
            userUsage: usage,
            planLimits: limits,
        });
    }
    catch (error) {
        console.error('Legacy usage stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch usage statistics',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}));
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Legacy API compatibility layer is active',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
exports.default = router;
//# sourceMappingURL=legacyApiRoutes.js.map