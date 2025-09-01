"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationStatusChecker = exports.checkFeatureCompatibility = exports.checkSubscriptionCompatibility = exports.legacyEndpointWrapper = exports.compatibilityResponse = exports.compatibilityAuthOptional = exports.compatibilityAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const logger_1 = __importDefault(require("../utils/logger"));
const compatibilityAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '') ||
            req.header('x-auth-token');
        if (!token) {
            logger_1.default.debug('Compatibility auth - No token provided', {
                url: req.url,
                method: req.method,
            });
            res.status(401).json({
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            logger_1.default.warn('Compatibility auth - Invalid token format', { decoded });
            res.status(401).json({
                message: 'Invalid token format.',
                code: 'INVALID_TOKEN_FORMAT'
            });
            return;
        }
        const user = await User_1.default.findById(userId)
            .populate('currentPlanId')
            .populate('workplaceId')
            .select('-passwordHash');
        if (!user) {
            logger_1.default.warn('Compatibility auth - User not found', { userId });
            res.status(401).json({
                message: 'Invalid token - user not found.',
                code: 'USER_NOT_FOUND'
            });
            return;
        }
        const allowedStatuses = process.env.NODE_ENV === 'development'
            ? ['active', 'license_pending', 'pending']
            : ['active', 'license_pending'];
        if (!allowedStatuses.includes(user.status)) {
            logger_1.default.info('Compatibility auth - User account not active', {
                userId: user._id,
                status: user.status,
            });
            res.status(401).json({
                message: 'Account is not active.',
                status: user.status,
                code: 'ACCOUNT_INACTIVE',
                requiresAction: getRequiredAction(user.status),
            });
            return;
        }
        let workplace = null;
        let subscription = null;
        let plan = null;
        if (user.workplaceId) {
            workplace = await Workplace_1.default.findById(user.workplaceId);
            if (workplace && workplace.currentSubscriptionId) {
                subscription = await Subscription_1.default.findById(workplace.currentSubscriptionId)
                    .populate('planId');
                plan = subscription?.planId;
            }
        }
        else {
            logger_1.default.info('Compatibility auth - User has no workspace, checking user subscription', {
                userId: user._id,
            });
            subscription = await Subscription_1.default.findOne({
                userId: user._id,
                status: { $in: ['active', 'trial', 'past_due'] },
            }).populate('planId');
            if (subscription) {
                plan = subscription.planId;
            }
        }
        req.user = user;
        req.subscription = subscription;
        req.workplace = workplace;
        req.plan = plan;
        req.pharmacy = workplace || undefined;
        req.userSubscription = subscription || undefined;
        logger_1.default.debug('Compatibility auth - Success', {
            userId: user._id,
            workplaceId: workplace?._id,
            subscriptionId: subscription?._id,
            hasWorkspace: !!workplace,
            hasSubscription: !!subscription,
        });
        next();
    }
    catch (error) {
        logger_1.default.error('Compatibility auth - Error', { error, url: req.url });
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                message: 'Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                message: 'Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }
        else {
            res.status(500).json({
                message: 'Authentication error.',
                code: 'AUTH_ERROR'
            });
        }
    }
};
exports.compatibilityAuth = compatibilityAuth;
const compatibilityAuthOptional = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '') ||
            req.header('x-auth-token');
        if (!token) {
            next();
            return;
        }
        await (0, exports.compatibilityAuth)(req, res, (error) => {
            if (error) {
                logger_1.default.debug('Optional auth failed, continuing without authentication', { error });
                req.user = undefined;
                req.subscription = undefined;
                req.workplace = undefined;
                req.plan = undefined;
                req.pharmacy = undefined;
                req.userSubscription = undefined;
            }
            next();
        });
    }
    catch (error) {
        logger_1.default.debug('Optional auth error, continuing without authentication', { error });
        next();
    }
};
exports.compatibilityAuthOptional = compatibilityAuthOptional;
const compatibilityResponse = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (body && typeof body === 'object' && !Array.isArray(body)) {
            if (req.workplace && !body.pharmacy) {
                body.pharmacy = req.workplace;
            }
            if (req.subscription && !body.userSubscription) {
                body.userSubscription = req.subscription;
            }
            if (req.user && !body.user && body.success !== false) {
                body.user = {
                    id: req.user._id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role,
                    workplaceId: req.user.workplaceId,
                    workplaceRole: req.user.workplaceRole,
                };
            }
            if (req.subscription) {
                body.subscriptionStatus = req.subscription.status;
                body.subscriptionTier = req.subscription.tier;
            }
            else if (req.workplace) {
                body.subscriptionStatus = req.workplace.subscriptionStatus;
            }
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.compatibilityResponse = compatibilityResponse;
const legacyEndpointWrapper = (newHandler) => {
    return async (req, res, next) => {
        try {
            if (req.params.pharmacyId && !req.params.workspaceId) {
                req.params.workspaceId = req.params.pharmacyId;
            }
            if (req.body.pharmacyId && !req.body.workspaceId) {
                req.body.workspaceId = req.body.pharmacyId;
            }
            if (req.query.pharmacyId && !req.query.workspaceId) {
                req.query.workspaceId = req.query.pharmacyId;
            }
            await newHandler(req, res, next);
        }
        catch (error) {
            logger_1.default.error('Legacy endpoint wrapper error', { error, url: req.url });
            next(error);
        }
    };
};
exports.legacyEndpointWrapper = legacyEndpointWrapper;
const checkSubscriptionCompatibility = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            message: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
        return;
    }
    const hasSubscription = req.subscription || req.userSubscription;
    if (!hasSubscription) {
        logger_1.default.warn('User has no subscription', {
            userId: req.user._id,
            workplaceId: req.workplace?._id,
        });
        const originalJson = res.json;
        res.json = function (body) {
            if (body && typeof body === 'object') {
                body.subscriptionWarning = {
                    message: 'No active subscription found',
                    code: 'NO_SUBSCRIPTION',
                    upgradeRequired: true,
                };
            }
            return originalJson.call(this, body);
        };
    }
    next();
};
exports.checkSubscriptionCompatibility = checkSubscriptionCompatibility;
const checkFeatureCompatibility = (featureKey) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            next();
            return;
        }
        const hasFeatureAccess = (req.subscription?.features?.includes(featureKey)) ||
            (req.subscription?.customFeatures?.includes(featureKey)) ||
            (req.user.features?.includes(featureKey)) ||
            (req.plan?.features?.includes(featureKey));
        if (!hasFeatureAccess) {
            res.status(403).json({
                message: `Feature '${featureKey}' not available in your current plan.`,
                feature: featureKey,
                code: 'FEATURE_NOT_AVAILABLE',
                upgradeRequired: true,
                currentTier: req.subscription?.tier || 'unknown',
            });
            return;
        }
        next();
    };
};
exports.checkFeatureCompatibility = checkFeatureCompatibility;
function getRequiredAction(status) {
    switch (status) {
        case 'license_pending':
            return 'license_verification';
        case 'pending':
            return 'email_verification';
        case 'suspended':
            return 'account_reactivation';
        case 'license_rejected':
            return 'license_resubmission';
        default:
            return 'account_activation';
    }
}
const migrationStatusChecker = (req, res, next) => {
    if (req.user) {
        const migrationStatus = {
            userHasWorkspace: !!req.user.workplaceId,
            workspaceHasSubscription: !!(req.workplace?.currentSubscriptionId),
            hasLegacySubscription: !!(req.user.currentSubscriptionId),
            needsMigration: !req.user.workplaceId || !req.workplace?.currentSubscriptionId,
        };
        const originalJson = res.json;
        res.json = function (body) {
            if (body && typeof body === 'object' && process.env.NODE_ENV === 'development') {
                body._migrationStatus = migrationStatus;
            }
            return originalJson.call(this, body);
        };
        if (migrationStatus.needsMigration) {
            logger_1.default.info('User needs migration', {
                userId: req.user._id,
                migrationStatus,
            });
        }
    }
    next();
};
exports.migrationStatusChecker = migrationStatusChecker;
exports.default = {
    compatibilityAuth: exports.compatibilityAuth,
    compatibilityAuthOptional: exports.compatibilityAuthOptional,
    compatibilityResponse: exports.compatibilityResponse,
    legacyEndpointWrapper: exports.legacyEndpointWrapper,
    checkSubscriptionCompatibility: exports.checkSubscriptionCompatibility,
    checkFeatureCompatibility: exports.checkFeatureCompatibility,
    migrationStatusChecker: exports.migrationStatusChecker,
};
//# sourceMappingURL=compatibilityLayer.js.map