"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = exports.requireTeamAccess = exports.checkUsageLimit = exports.requireFeature = exports.requireLicense = exports.requirePermission = exports.authorize = exports.authOptionalSubscription = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const ROLE_HIERARCHY = {
    super_admin: [
        'super_admin',
        'pharmacy_outlet',
        'pharmacy_team',
        'pharmacist',
        'intern_pharmacist',
    ],
    pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
    pharmacy_team: ['pharmacy_team', 'pharmacist'],
    pharmacist: ['pharmacist'],
    intern_pharmacist: ['intern_pharmacist'],
};
const auth = async (req, res, next) => {
    try {
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
        if (process.env.NODE_ENV !== 'production') {
            console.log('Auth middleware - checking token:', {
                hasAccessToken: !!req.cookies.accessToken,
                hasRefreshToken: !!req.cookies.refreshToken,
                hasToken: !!req.cookies.token,
                hasAuthHeader: !!req.header('Authorization'),
                tokenExists: !!token,
                url: req.url,
                method: req.method,
            });
        }
        if (!token) {
            console.log('Auth middleware - No token provided');
            res.status(401).json({
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
        const allowedStatuses = process.env.NODE_ENV === 'development'
            ? ['active', 'license_pending', 'pending']
            : ['active', 'license_pending'];
        if (!allowedStatuses.includes(user.status)) {
            res.status(401).json({
                message: 'Account is not active.',
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
                status: { $in: ['active', 'trial', 'grace_period'] },
            }).populate('planId');
        }
        req.subscription = subscription;
        req.user = user;
        req.subscription = subscription;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
            if (!req.user || !req.subscription) {
                res.status(401).json({ message: 'Access denied.' });
                return;
            }
            const featureFlag = await FeatureFlag_1.default.findOne({
                key: featureKey,
                isActive: true,
            });
            if (!featureFlag) {
                res.status(404).json({
                    message: 'Feature not found or inactive.',
                    feature: featureKey,
                });
                return;
            }
            const user = req.user;
            const subscription = req.subscription;
            if (user.role === 'super_admin') {
                return next();
            }
            if (!['active', 'trial'].includes(subscription.status)) {
                res.status(403).json({
                    message: 'Your subscription is not active.',
                    feature: featureKey,
                    subscriptionStatus: subscription.status,
                    requiresAction: 'subscription_renewal',
                    upgradeRequired: true,
                });
                return;
            }
            if (!featureFlag.allowedTiers.includes(subscription.tier)) {
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
    const allowedRoles = ['pharmacy_team', 'pharmacy_outlet', 'super_admin'];
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