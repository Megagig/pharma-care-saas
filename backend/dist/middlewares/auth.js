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
exports.requireSuperAdmin = exports.requireAdmin = exports.requireTeamAccess = exports.checkUsageLimit = exports.requireFeature = exports.requireLicense = exports.requirePermission = exports.authorize = exports.authOptionalSubscription = exports.auth = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const FeatureFlag_1 = require("../models/FeatureFlag");
const ROLE_HIERARCHY = {
    super_admin: [
        'super_admin',
        'owner',
        'pharmacy_outlet',
        'pharmacy_team',
        'pharmacist',
        'intern_pharmacist',
    ],
    owner: ['owner', 'pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
    pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
    pharmacy_team: ['pharmacy_team', 'pharmacist'],
    pharmacist: ['pharmacist'],
    intern_pharmacist: ['intern_pharmacist'],
};
const auth = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === 'development' && req.header('X-Super-Admin-Test') === 'true') {
            req.user = {
                _id: new mongoose_1.default.Types.ObjectId('68b5cb81f1f0f9758b8afadd'),
                email: 'super_admin@test.com',
                role: 'super_admin',
                firstName: 'Super',
                lastName: 'Admin',
                isActive: true,
                workplaceId: new mongoose_1.default.Types.ObjectId('68b5cb82f1f0f9758b8afadf'),
            };
            next();
            return;
        }
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '');
        if (!token &&
            req.cookies.refreshToken &&
            !req.originalUrl.includes('/auth/refresh-token')) {
            console.log('Auth middleware - no access token but found refresh token, redirecting to refresh flow');
            res.status(401).json({
                message: 'Access token expired, please refresh',
                requiresRefresh: true,
            });
            return;
        }
        if (!token) {
            res.status(401).json({
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN',
            });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        const user = await User_1.default.findById(userId)
            .populate('currentPlanId')
            .populate('parentUserId', 'firstName lastName role')
            .populate('teamMembers', 'firstName lastName role status')
            .select('-passwordHash');
        if (!user) {
            res.status(401).json({ message: 'Invalid token.' });
            return;
        }
        if (user.status === 'suspended') {
            res.status(401).json({
                message: 'Account is suspended. Please contact support.',
                status: user.status,
                requiresAction: 'contact_support',
            });
            return;
        }
        if (user.status === 'license_rejected') {
            res.status(401).json({
                message: 'License verification was rejected. Please resubmit your license.',
                status: user.status,
                requiresAction: 'license_resubmission',
            });
            return;
        }
        const allowedStatuses = ['active', 'license_pending'];
        if (process.env.NODE_ENV === 'development') {
            allowedStatuses.push('pending');
        }
        if (!allowedStatuses.includes(user.status)) {
            res.status(401).json({
                message: user.status === 'pending'
                    ? 'Please verify your email before logging in.'
                    : 'Account is not active.',
                status: user.status,
                requiresAction: user.status === 'license_pending'
                    ? 'license_verification'
                    : user.status === 'pending'
                        ? 'email_verification'
                        : 'account_activation',
            });
            return;
        }
        let subscription = null;
        if (user.workplaceId) {
            subscription = await Subscription_1.default.findOne({
                workspaceId: user.workplaceId,
                status: { $in: ['active', 'trial', 'past_due'] },
            }).populate('planId');
            if (process.env.NODE_ENV === 'development') {
                console.log('Auth middleware - Subscription lookup:', {
                    workplaceId: user.workplaceId,
                    subscriptionFound: !!subscription,
                    subscriptionStatus: subscription?.status,
                    subscriptionTier: subscription?.tier,
                    hasPlanId: !!subscription?.planId,
                });
            }
        }
        req.subscription = subscription;
        req.user = user;
        req.subscription = subscription;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired.' });
        }
        else {
            res.status(401).json({ message: 'Invalid token.' });
        }
    }
};
exports.auth = auth;
const authOptionalSubscription = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        const user = await User_1.default.findById(userId)
            .populate('currentPlanId')
            .populate('parentUserId', 'firstName lastName role')
            .populate('teamMembers', 'firstName lastName role status')
            .select('-passwordHash');
        if (!user) {
            res.status(401).json({ message: 'Invalid token.' });
            return;
        }
        if (!['active', 'license_pending'].includes(user.status)) {
            res.status(401).json({
                message: 'Account is not active.',
                status: user.status,
                requiresAction: user.status === 'license_pending'
                    ? 'license_verification'
                    : 'account_activation',
            });
            return;
        }
        let subscription = null;
        if (user.workplaceId) {
            subscription = await Subscription_1.default.findOne({
                workspaceId: user.workplaceId,
                status: { $in: ['active', 'trial', 'grace_period'] },
            }).populate('planId');
        }
        req.user = user;
        req.subscription = subscription || undefined;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired.' });
        }
        else {
            res.status(401).json({ message: 'Invalid token.' });
        }
    }
};
exports.authOptionalSubscription = authOptionalSubscription;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied.' });
            return;
        }
        const userRole = req.user.role;
        const hasRole = roles.some((role) => {
            const allowedRoles = ROLE_HIERARCHY[userRole] || [userRole];
            return allowedRoles.includes(role);
        });
        if (!hasRole) {
            res.status(403).json({
                message: 'Insufficient permissions.',
                requiredRoles: roles,
                userRole: userRole,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied.' });
            return;
        }
        if (!req.user.hasPermission(permission)) {
            res.status(403).json({
                message: 'Insufficient permissions.',
                requiredPermission: permission,
                userPermissions: req.user.permissions,
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireLicense = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
    }
    const requiresLicense = ['pharmacist', 'intern_pharmacist'].includes(req.user.role);
    if (req.user.role === 'super_admin') {
        return next();
    }
    if (requiresLicense) {
        switch (req.user.licenseStatus) {
            case 'approved':
                break;
            case 'pending':
                res.status(403).json({
                    message: 'Your license is pending review. This usually takes 1-3 business days.',
                    licenseStatus: 'pending',
                    requiresAction: 'license_pending',
                    nextStep: 'You will be notified when your license has been reviewed.',
                });
                return;
            case 'rejected':
                res.status(403).json({
                    message: 'Your license verification was rejected.',
                    licenseStatus: 'rejected',
                    requiresAction: 'license_resubmission',
                    rejectionReason: req.user.licenseRejectionReason ||
                        'Invalid or incomplete information.',
                    nextStep: 'Please resubmit with valid license information.',
                });
                return;
            default:
                res.status(403).json({
                    message: 'Valid license required for this role.',
                    licenseStatus: req.user.licenseStatus || 'not_submitted',
                    requiresAction: 'license_verification',
                    nextStep: 'Please submit your pharmacy license for verification.',
                });
                return;
        }
    }
    next();
};
exports.requireLicense = requireLicense;
const requireFeature = (featureKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Access denied.' });
                return;
            }
            console.log(`🔧 RequireFeature Debug - Feature: ${featureKey}, User: ${req.user.email}, Role: ${req.user.role}`);
            console.log(`🔧 User workplaceId: ${req.user.workplaceId}`);
            console.log(`🔧 Subscription: ${req.subscription ? 'found' : 'not found'}`);
            if (req.subscription) {
                console.log(`🔧 Subscription details: status=${req.subscription.status}, tier=${req.subscription.tier}, trialEndDate=${req.subscription.trialEndDate}`);
            }
            if (req.user.role === 'super_admin') {
                console.log('🔧 Super admin bypass granted');
                return next();
            }
            const featureFlag = await FeatureFlag_1.FeatureFlag.findOne({
                key: featureKey,
                isActive: true,
            });
            console.log(`🔧 Feature flag found: ${!!featureFlag}, Key: ${featureKey}`);
            if (featureFlag) {
                console.log(`🔧 Feature flag details: allowedTiers=${JSON.stringify(featureFlag.allowedTiers)}, allowedRoles=${JSON.stringify(featureFlag.allowedRoles)}, isActive=${featureFlag.isActive}`);
            }
            if (!featureFlag) {
                console.log(`🔧 Feature flag not found or inactive: ${featureKey}`);
                res.status(404).json({
                    message: 'Feature not found or inactive.',
                    feature: featureKey,
                });
                return;
            }
            const user = req.user;
            const subscription = req.subscription;
            console.log(`🔧 Subscription: ${subscription ? 'found' : 'not found'}`);
            if (subscription) {
                console.log(`🔧 Subscription details: status=${subscription.status}, tier=${subscription.tier}`);
            }
            if (!subscription) {
                if (!user.workplaceId) {
                    res.status(403).json({
                        message: 'You must join or create a workspace to access this feature.',
                        feature: featureKey,
                        subscriptionStatus: 'no_workspace',
                        requiresAction: 'workspace_required',
                        upgradeRequired: false,
                    });
                    return;
                }
                res.status(403).json({
                    message: 'Your workspace subscription is not active.',
                    feature: featureKey,
                    subscriptionStatus: 'no_subscription',
                    requiresAction: 'subscription_required',
                    upgradeRequired: true,
                });
                return;
            }
            if (!['active', 'trial', 'past_due'].includes(subscription.status)) {
                console.log(`🔧 Subscription status check failed: ${subscription.status}`);
                res.status(403).json({
                    message: 'Your workspace subscription is not active.',
                    feature: featureKey,
                    subscriptionStatus: subscription.status,
                    requiresAction: 'subscription_renewal',
                    upgradeRequired: true,
                });
                return;
            }
            if (subscription.status === 'trial' && subscription.trialEndDate) {
                const now = new Date();
                if (now > subscription.trialEndDate) {
                    res.status(403).json({
                        message: 'Your 14-day trial has expired. Please upgrade to continue using this feature.',
                        feature: featureKey,
                        subscriptionStatus: 'trial_expired',
                        requiresAction: 'subscription_required',
                        upgradeRequired: true,
                    });
                    return;
                }
            }
            const hasTierAccess = featureFlag.allowedTiers.includes(subscription.tier);
            console.log(`🔧 Tier access check: user tier=${subscription.tier}, allowed=${JSON.stringify(featureFlag.allowedTiers)}, hasAccess=${hasTierAccess}`);
            if (!hasTierAccess) {
                console.log(`🔧 Tier access check failed: user tier=${subscription.tier}, allowed=${featureFlag.allowedTiers}`);
                res.status(403).json({
                    message: 'Feature not available in your current plan.',
                    feature: featureKey,
                    currentTier: subscription.tier,
                    requiredTiers: featureFlag.allowedTiers,
                    upgradeRequired: true,
                });
                return;
            }
            if (featureFlag.allowedRoles.length > 0) {
                const hasRoleAccess = featureFlag.allowedRoles.some((role) => {
                    const allowedRoles = ROLE_HIERARCHY[user.role] || [
                        user.role,
                    ];
                    return allowedRoles.includes(role);
                });
                if (!hasRoleAccess) {
                    res.status(403).json({
                        message: 'Feature not available for your role.',
                        feature: featureKey,
                        userRole: user.role,
                        requiredRoles: featureFlag.allowedRoles,
                    });
                    return;
                }
            }
            if (featureFlag.customRules) {
                if (featureFlag.customRules.requiredLicense &&
                    user.licenseStatus !== 'approved') {
                    res.status(403).json({
                        message: 'Feature requires verified license.',
                        feature: featureKey,
                        licenseStatus: user.licenseStatus,
                        requiresAction: 'license_verification',
                    });
                    return;
                }
                if (featureFlag.customRules.maxUsers && user.teamMembers) {
                    const teamSize = user.teamMembers.length + 1;
                    if (teamSize > featureFlag.customRules.maxUsers) {
                        res.status(403).json({
                            message: 'Team size exceeds feature limit.',
                            feature: featureKey,
                            currentTeamSize: teamSize,
                            maxAllowed: featureFlag.customRules.maxUsers,
                        });
                        return;
                    }
                }
            }
            const hasFeatureAccess = subscription.features.includes(featureKey) ||
                subscription.customFeatures.includes(featureKey) ||
                user.features.includes(featureKey) ||
                user.role === 'super_admin';
            if (!hasFeatureAccess) {
                res.status(403).json({
                    message: 'Feature not enabled for this account.',
                    feature: featureKey,
                    upgradeRequired: true,
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                message: 'Error checking feature access.',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    };
};
exports.requireFeature = requireFeature;
;
const checkUsageLimit = (featureKey, limitKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.subscription) {
                res.status(401).json({ message: 'Access denied.' });
                return;
            }
            const subscription = req.subscription;
            const plan = subscription.planId;
            const limit = plan?.features?.[limitKey];
            if (limit === null || limit === undefined) {
                next();
                return;
            }
            const usageMetric = subscription.usageMetrics.find((m) => m.feature === featureKey);
            const currentUsage = usageMetric ? usageMetric.count : 0;
            if (currentUsage >= limit) {
                res.status(429).json({
                    message: `Usage limit exceeded for ${featureKey}.`,
                    feature: featureKey,
                    limit: limit,
                    current: currentUsage,
                    upgradeRequired: true,
                });
                return;
            }
            req.user.currentUsage = currentUsage;
            req.user.usageLimit = limit;
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Error checking usage limit.' });
        }
    };
};
exports.checkUsageLimit = checkUsageLimit;
const requireTeamAccess = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
    }
    const allowedRoles = ['pharmacy_team', 'pharmacy_outlet', 'super_admin', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
            message: 'Team features not available for your role.',
            requiredRoles: allowedRoles,
        });
        return;
    }
    next();
};
exports.requireTeamAccess = requireTeamAccess;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
    }
    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            message: 'Administrator access required.',
            userRole: req.user.role,
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Access denied.' });
        return;
    }
    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            message: 'Super Administrator access required.',
            userRole: req.user.role,
        });
        return;
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
//# sourceMappingURL=auth.js.map