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
exports.authWithWorkspaceOptionalSubscription = exports.authWithWorkspace = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const workspaceContext_1 = require("./workspaceContext");
const logger_1 = __importDefault(require("../utils/logger"));
const authWithWorkspace = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '');
        logger_1.default.debug('Enhanced auth middleware - checking token:', {
            hasAccessToken: !!req.cookies.accessToken,
            hasToken: !!req.cookies.token,
            hasAuthHeader: !!req.header('Authorization'),
            tokenExists: !!token,
            url: req.url,
            method: req.method,
        });
        if (!token) {
            logger_1.default.warn('Enhanced auth middleware - No token provided');
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
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
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
            return;
        }
        const isValidStatus = await validateUserStatus(user);
        if (!isValidStatus.valid) {
            res.status(401).json({
                success: false,
                message: isValidStatus.message,
                status: user.status,
                requiresAction: isValidStatus.requiresAction,
            });
            return;
        }
        req.user = user;
        await (0, workspaceContext_1.loadWorkspaceContext)(req, res, async () => {
            const subscriptionValidation = await validateSubscriptionStatus(req);
            if (!subscriptionValidation.valid && subscriptionValidation.blockAccess) {
                res.status(402).json({
                    success: false,
                    message: subscriptionValidation.message,
                    subscriptionStatus: req.workspaceContext?.subscription?.status || 'none',
                    isTrialExpired: req.workspaceContext?.isTrialExpired || false,
                    requiresAction: 'subscription_upgrade',
                    upgradeRequired: true,
                });
                return;
            }
            if (req.workspaceContext?.subscription) {
                req.subscription = req.workspaceContext.subscription;
            }
            else {
                try {
                    const legacySubscription = await Subscription_1.default.findOne({
                        userId: user._id,
                        status: { $in: ['active', 'trial', 'grace_period'] },
                    }).populate('planId');
                    req.subscription = legacySubscription;
                }
                catch (error) {
                    logger_1.default.error('Error loading legacy subscription:', error);
                    req.subscription = null;
                }
            }
            next();
        });
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        else {
            logger_1.default.error('Enhanced auth middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    }
};
exports.authWithWorkspace = authWithWorkspace;
const authWithWorkspaceOptionalSubscription = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken ||
            req.cookies.token ||
            req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
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
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
            return;
        }
        const isValidStatus = await validateUserStatus(user);
        if (!isValidStatus.valid) {
            res.status(401).json({
                success: false,
                message: isValidStatus.message,
                status: user.status,
                requiresAction: isValidStatus.requiresAction,
            });
            return;
        }
        req.user = user;
        await (0, workspaceContext_1.loadWorkspaceContext)(req, res, () => {
            if (req.workspaceContext?.subscription) {
                req.subscription = req.workspaceContext.subscription;
            }
            else {
                req.subscription = undefined;
            }
            next();
        });
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        else {
            logger_1.default.error('Enhanced auth optional subscription middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    }
};
exports.authWithWorkspaceOptionalSubscription = authWithWorkspaceOptionalSubscription;
async function validateUserStatus(user) {
    if (user.role === 'super_admin') {
        return { valid: true };
    }
    if (user.status === 'suspended') {
        return {
            valid: false,
            message: 'Account is suspended. Please contact support.',
            requiresAction: 'contact_support',
        };
    }
    if (user.licenseStatus === 'rejected' && ['pharmacist', 'intern_pharmacist'].includes(user.role)) {
        return {
            valid: false,
            message: 'License verification was rejected. Please resubmit valid license information.',
            requiresAction: 'license_resubmission',
        };
    }
    const allowedStatuses = process.env.NODE_ENV === 'development'
        ? ['active', 'license_pending', 'pending']
        : ['active', 'license_pending'];
    if (!allowedStatuses.includes(user.status)) {
        return {
            valid: false,
            message: 'Account is not active.',
            requiresAction: user.status === 'license_pending'
                ? 'license_verification'
                : user.status === 'pending'
                    ? 'email_verification'
                    : 'account_activation',
        };
    }
    return { valid: true };
}
async function validateSubscriptionStatus(req) {
    const context = req.workspaceContext;
    if (!context) {
        return {
            valid: false,
            blockAccess: false,
            message: 'Unable to load workspace context.',
        };
    }
    if (req.user?.role === 'super_admin') {
        return { valid: true, blockAccess: false };
    }
    if (!context.workspace) {
        return {
            valid: false,
            blockAccess: false,
            message: 'User must be associated with a workspace.',
        };
    }
    if (context.isTrialExpired && !context.isSubscriptionActive) {
        return {
            valid: false,
            blockAccess: true,
            message: 'Trial period has expired. Please upgrade to continue using the service.',
        };
    }
    if (context.subscription) {
        const subscription = context.subscription;
        switch (subscription.status) {
            case 'trial':
            case 'active':
                return { valid: true, blockAccess: false };
            case 'past_due':
                return {
                    valid: false,
                    blockAccess: false,
                    message: 'Subscription payment is past due. Please update payment method.',
                };
            case 'expired':
            case 'canceled':
                return {
                    valid: false,
                    blockAccess: true,
                    message: 'Subscription has expired. Please renew to continue using the service.',
                };
            case 'suspended':
                return {
                    valid: false,
                    blockAccess: true,
                    message: 'Subscription is suspended. Please contact support.',
                };
            default:
                return {
                    valid: false,
                    blockAccess: false,
                    message: 'Unknown subscription status.',
                };
        }
    }
    if (context.workspace.subscriptionStatus === 'trial') {
        return { valid: true, blockAccess: false };
    }
    return {
        valid: false,
        blockAccess: false,
        message: 'No active subscription found.',
    };
}
exports.default = {
    authWithWorkspace: exports.authWithWorkspace,
    authWithWorkspaceOptionalSubscription: exports.authWithWorkspaceOptionalSubscription,
};
//# sourceMappingURL=authWithWorkspace.js.map