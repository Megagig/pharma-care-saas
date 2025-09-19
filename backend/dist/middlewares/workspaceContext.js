"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = exports.requireWorkspace = exports.requireWorkspaceContext = exports.clearWorkspaceCache = exports.loadWorkspaceContext = void 0;
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const logger_1 = __importDefault(require("../utils/logger"));
class WorkspaceContextCache {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000;
    }
    get(userId) {
        const entry = this.cache.get(userId);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_DURATION) {
            this.cache.delete(userId);
            return null;
        }
        return entry.context;
    }
    set(userId, context) {
        this.cache.set(userId, {
            context,
            timestamp: Date.now(),
            userId,
        });
    }
    clear(userId) {
        if (userId) {
            this.cache.delete(userId);
        }
        else {
            this.cache.clear();
        }
    }
    cleanup() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        for (const [key, entry] of entries) {
            if (now - entry.timestamp > this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }
}
const workspaceCache = new WorkspaceContextCache();
setInterval(() => {
    workspaceCache.cleanup();
}, 10 * 60 * 1000);
const loadWorkspaceContext = async (req, res, next) => {
    try {
        if (!req.user) {
            logger_1.default.warn('loadWorkspaceContext called without authenticated user');
            return next();
        }
        if (req.user.role === 'super_admin') {
            req.workspaceContext = {
                workspace: null,
                subscription: null,
                plan: null,
                permissions: ['*'],
                limits: {
                    patients: null,
                    users: null,
                    locations: null,
                    storage: null,
                    apiCalls: null,
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
            };
            return next();
        }
        const userId = req.user._id.toString();
        const cachedContext = workspaceCache.get(userId);
        if (cachedContext) {
            req.workspaceContext = cachedContext;
            return next();
        }
        const context = await loadUserWorkspaceContext(req.user._id);
        workspaceCache.set(userId, context);
        req.workspaceContext = context;
        next();
    }
    catch (error) {
        logger_1.default.error('Error loading workspace context:', error);
        req.workspaceContext = {
            workspace: null,
            subscription: null,
            plan: null,
            permissions: [],
            limits: {
                patients: null,
                users: null,
                locations: null,
                storage: null,
                apiCalls: null,
            },
            isTrialExpired: false,
            isSubscriptionActive: false,
        };
        next();
    }
};
exports.loadWorkspaceContext = loadWorkspaceContext;
async function loadUserWorkspaceContext(userId) {
    let workspace = null;
    let subscription = null;
    let plan = null;
    try {
        workspace = await Workplace_1.default.findOne({
            $or: [
                { ownerId: userId },
                { teamMembers: userId }
            ]
        }).populate('currentPlanId');
        if (workspace) {
            subscription = await Subscription_1.default.findOne({
                workspaceId: workspace._id,
                status: { $in: ['trial', 'active', 'past_due', 'expired'] }
            }).populate('planId');
            if (subscription && subscription.planId) {
                plan = subscription.planId;
            }
            else if (workspace.currentPlanId) {
                plan = await SubscriptionPlan_1.default.findById(workspace.currentPlanId);
            }
        }
        const isTrialExpired = checkTrialExpired(workspace, subscription);
        const isSubscriptionActive = checkSubscriptionActive(subscription);
        const limits = plan ? {
            patients: plan.features?.patientLimit || null,
            users: plan.features?.teamSize || null,
            locations: plan.features?.multiLocationDashboard ? null : 1,
            storage: null,
            apiCalls: plan.features?.apiAccess ? null : 0,
        } : {
            patients: null,
            users: null,
            locations: null,
            storage: null,
            apiCalls: null,
        };
        const permissions = [];
        if (plan?.features) {
            Object.entries(plan.features).forEach(([key, value]) => {
                if (value === true) {
                    permissions.push(key);
                }
            });
        }
        return {
            workspace,
            subscription,
            plan,
            permissions,
            limits,
            isTrialExpired,
            isSubscriptionActive,
        };
    }
    catch (error) {
        logger_1.default.error('Error loading workspace context from database:', error);
        return {
            workspace: null,
            subscription: null,
            plan: null,
            permissions: [],
            limits: {
                patients: null,
                users: null,
                locations: null,
                storage: null,
                apiCalls: null,
            },
            isTrialExpired: false,
            isSubscriptionActive: false,
        };
    }
}
function checkTrialExpired(workspace, subscription) {
    if (!workspace)
        return false;
    const now = new Date();
    if (workspace.trialEndDate && now > workspace.trialEndDate) {
        return true;
    }
    if (subscription?.trialEndDate && now > subscription.trialEndDate) {
        return true;
    }
    return false;
}
function checkSubscriptionActive(subscription) {
    if (!subscription)
        return false;
    const activeStatuses = ['trial', 'active'];
    return activeStatuses.includes(subscription.status);
}
const clearWorkspaceCache = (userId) => {
    workspaceCache.clear(userId);
};
exports.clearWorkspaceCache = clearWorkspaceCache;
const requireWorkspaceContext = (req, res, next) => {
    if (!req.workspaceContext) {
        res.status(500).json({
            success: false,
            message: 'Workspace context not loaded. Ensure loadWorkspaceContext middleware is used first.',
        });
        return;
    }
    next();
};
exports.requireWorkspaceContext = requireWorkspaceContext;
const requireWorkspace = (req, res, next) => {
    if (!req.workspaceContext?.workspace) {
        res.status(403).json({
            success: false,
            message: 'Access denied. User must be associated with a workspace.',
            requiresAction: 'workspace_creation',
        });
        return;
    }
    next();
};
exports.requireWorkspace = requireWorkspace;
const requireActiveSubscription = (req, res, next) => {
    const context = req.workspaceContext;
    if (!context?.isSubscriptionActive) {
        res.status(402).json({
            success: false,
            message: 'Active subscription required.',
            subscriptionStatus: context?.subscription?.status || 'none',
            isTrialExpired: context?.isTrialExpired || false,
            requiresAction: 'subscription_upgrade',
            upgradeRequired: true,
        });
        return;
    }
    next();
};
exports.requireActiveSubscription = requireActiveSubscription;
exports.default = {
    loadWorkspaceContext: exports.loadWorkspaceContext,
    requireWorkspaceContext: exports.requireWorkspaceContext,
    requireWorkspace: exports.requireWorkspace,
    requireActiveSubscription: exports.requireActiveSubscription,
    clearWorkspaceCache: exports.clearWorkspaceCache,
};
//# sourceMappingURL=workspaceContext.js.map