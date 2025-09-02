import { Response, NextFunction } from 'express';
import { AuthRequest, WorkspaceContext, PlanLimits } from '../types/auth';
import Workplace, { IWorkplace } from '../models/Workplace';
import Subscription, { ISubscription } from '../models/Subscription';
import SubscriptionPlan, { ISubscriptionPlan } from '../models/SubscriptionPlan';
import logger from '../utils/logger';

// In-memory cache for workspace context
interface CacheEntry {
    context: WorkspaceContext;
    timestamp: number;
    userId: string;
}

class WorkspaceContextCache {
    private cache = new Map<string, CacheEntry>();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    get(userId: string): WorkspaceContext | null {
        const entry = this.cache.get(userId);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_DURATION) {
            this.cache.delete(userId);
            return null;
        }

        return entry.context;
    }

    set(userId: string, context: WorkspaceContext): void {
        this.cache.set(userId, {
            context,
            timestamp: Date.now(),
            userId,
        });
    }

    clear(userId?: string): void {
        if (userId) {
            this.cache.delete(userId);
        } else {
            this.cache.clear();
        }
    }

    // Clean expired entries periodically
    cleanup(): void {
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

// Clean cache every 10 minutes
setInterval(() => {
    workspaceCache.cleanup();
}, 10 * 60 * 1000);

/**
 * Load workspace context for authenticated user
 * Attaches workspace, subscription, and plan information to request
 */
export const loadWorkspaceContext = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            logger.warn('loadWorkspaceContext called without authenticated user');
            return next();
        }

        const userId = req.user._id.toString();

        // Try to get from cache first
        const cachedContext = workspaceCache.get(userId);
        if (cachedContext) {
            req.workspaceContext = cachedContext;
            return next();
        }

        // Load workspace context from database
        const context = await loadUserWorkspaceContext(req.user._id);

        // Cache the context
        workspaceCache.set(userId, context);

        // Attach to request
        req.workspaceContext = context;

        next();
    } catch (error) {
        logger.error('Error loading workspace context:', error);

        // Don't fail the request, just log the error and continue
        // Set empty context to prevent undefined errors
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

/**
 * Load workspace context from database
 */
async function loadUserWorkspaceContext(userId: any): Promise<WorkspaceContext> {
    let workspace: IWorkplace | null = null;
    let subscription: ISubscription | null = null;
    let plan: ISubscriptionPlan | null = null;

    try {
        // Find user's workplace
        workspace = await Workplace.findOne({
            $or: [
                { ownerId: userId },
                { teamMembers: userId }
            ]
        }).populate('currentPlanId');

        if (workspace) {
            // Load workspace subscription
            subscription = await Subscription.findOne({
                workspaceId: workspace._id,
                status: { $in: ['trial', 'active', 'past_due', 'expired'] }
            }).populate('planId');

            // Get plan from subscription or workspace
            if (subscription && subscription.planId) {
                plan = subscription.planId as unknown as ISubscriptionPlan;
            } else if (workspace.currentPlanId) {
                plan = await SubscriptionPlan.findById(workspace.currentPlanId);
            }
        }

        // Determine subscription status
        const isTrialExpired = checkTrialExpired(workspace, subscription);
        const isSubscriptionActive = checkSubscriptionActive(subscription);

        // Build limits from plan (adapting to existing SubscriptionPlan structure)
        const limits: PlanLimits = plan ? {
            patients: plan.features?.patientLimit || null,
            users: plan.features?.teamSize || null,
            locations: plan.features?.multiLocationDashboard ? null : 1, // Unlimited if multi-location enabled
            storage: null, // Not defined in current model
            apiCalls: plan.features?.apiAccess ? null : 0, // Unlimited if API access enabled
        } : {
            patients: null,
            users: null,
            locations: null,
            storage: null,
            apiCalls: null,
        };

        // Build permissions array from plan features (will be enhanced by permission service)
        const permissions: string[] = [];
        if (plan?.features) {
            // Convert boolean features to permission strings
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

    } catch (error) {
        logger.error('Error loading workspace context from database:', error);

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

/**
 * Check if trial period has expired
 */
function checkTrialExpired(workspace: IWorkplace | null, subscription: ISubscription | null): boolean {
    if (!workspace) return false;

    const now = new Date();

    // Check workspace trial
    if (workspace.trialEndDate && now > workspace.trialEndDate) {
        return true;
    }

    // Check subscription trial
    if (subscription?.trialEndDate && now > subscription.trialEndDate) {
        return true;
    }

    return false;
}

/**
 * Check if subscription is active
 */
function checkSubscriptionActive(subscription: ISubscription | null): boolean {
    if (!subscription) return false;

    const activeStatuses = ['trial', 'active'];
    return activeStatuses.includes(subscription.status);
}

/**
 * Clear workspace context cache for a user
 * Useful when workspace data changes
 */
export const clearWorkspaceCache = (userId?: string): void => {
    workspaceCache.clear(userId);
};

/**
 * Middleware that requires workspace context to be loaded
 * Use this after loadWorkspaceContext to ensure context exists
 */
export const requireWorkspaceContext = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.workspaceContext) {
        res.status(500).json({
            success: false,
            message: 'Workspace context not loaded. Ensure loadWorkspaceContext middleware is used first.',
        });
        return;
    }

    next();
};

/**
 * Middleware that requires user to have a workspace
 */
export const requireWorkspace = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
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

/**
 * Middleware that requires active subscription
 */
export const requireActiveSubscription = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
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

export default {
    loadWorkspaceContext,
    requireWorkspaceContext,
    requireWorkspace,
    requireActiveSubscription,
    clearWorkspaceCache,
};