import { Response, NextFunction } from 'express';
import { AuthRequest, PermissionResult } from '../types/auth';
import PermissionService from '../services/PermissionService';
import { auditOperations } from './auditLogging';
import logger from '../utils/logger';

/**
 * RBAC middleware that checks if user has permission to perform an action
 */
export const requirePermission = (action: string) => {
    return async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }

            // Super admin bypasses all permission checks
            if (req.user.role === 'super_admin') {
                return next();
            }

            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded. Ensure authWithWorkspace middleware is used.',
                });
                return;
            }

            const permissionService = PermissionService.getInstance();
            const result: PermissionResult = await permissionService.checkPermission(
                req.workspaceContext,
                req.user,
                action
            );

            if (!result.allowed) {
                const statusCode = result.upgradeRequired ? 402 : 403;

                // Log permission denied event for audit
                await auditOperations.permissionDenied(req, action, result.reason || 'Permission denied');

                res.status(statusCode).json({
                    success: false,
                    message: result.reason || 'Permission denied',
                    action,
                    requiredPermissions: result.requiredPermissions,
                    requiredRoles: result.requiredRoles,
                    requiredFeatures: result.requiredFeatures,
                    upgradeRequired: result.upgradeRequired || false,
                    userRole: req.user.role,
                    workplaceRole: req.user.workplaceRole,
                });
                return;
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        // Super admin bypasses role checks
        if (req.user.role === 'super_admin') {
            return next();
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient role permissions',
                requiredRoles: roles,
                userRole: req.user.role,
            });
            return;
        }

        next();
    };
};

/**
 * RBAC middleware that checks if user has any of the specified workplace roles
 */
export const requireWorkplaceRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        // Super admin bypasses role checks
        if (req.user.role === 'super_admin') {
            return next();
        }

        if (!req.user.workplaceRole || !roles.includes(req.user.workplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient workplace role permissions',
                requiredWorkplaceRoles: roles,
                userWorkplaceRole: req.user.workplaceRole,
            });
            return;
        }

        next();
    };
};

/**
 * RBAC middleware that checks if user's plan has specific features
 */
export const requireFeature = (...features: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        if (!req.workspaceContext) {
            res.status(500).json({
                success: false,
                message: 'Workspace context not loaded',
            });
            return;
        }

        // Super admin bypasses feature checks
        if (req.user.role === 'super_admin') {
            return next();
        }

        const userFeatures = req.workspaceContext.permissions || [];
        const hasRequiredFeatures = features.every(feature =>
            userFeatures.includes(feature)
        );

        if (!hasRequiredFeatures) {
            res.status(402).json({
                success: false,
                message: 'Required plan features not available',
                requiredFeatures: features,
                userFeatures,
                upgradeRequired: true,
            });
            return;
        }

        next();
    };
};

/**
 * RBAC middleware that checks if user's plan tier is sufficient
 */
export const requirePlanTier = (...tiers: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        if (!req.workspaceContext) {
            res.status(500).json({
                success: false,
                message: 'Workspace context not loaded',
            });
            return;
        }

        // Super admin bypasses tier checks
        if (req.user.role === 'super_admin') {
            return next();
        }

        const currentTier = req.workspaceContext.plan?.tier;
        if (!currentTier || !tiers.includes(currentTier)) {
            res.status(402).json({
                success: false,
                message: 'Plan tier not sufficient',
                requiredTiers: tiers,
                currentTier,
                upgradeRequired: true,
            });
            return;
        }

        next();
    };
};

/**
 * RBAC middleware that requires user to be workspace owner
 */
export const requireWorkspaceOwner = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (!req.workspaceContext?.workspace) {
        res.status(403).json({
            success: false,
            message: 'No workspace associated with user',
        });
        return;
    }

    // Super admin bypasses ownership checks
    if (req.user.role === 'super_admin') {
        return next();
    }

    const isOwner = req.workspaceContext.workspace.ownerId.toString() === req.user._id.toString();
    if (!isOwner) {
        res.status(403).json({
            success: false,
            message: 'Workspace owner access required',
        });
        return;
    }

    next();
};

/**
 * RBAC middleware that requires super admin access
 */
export const requireSuperAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            success: false,
            message: 'Super administrator access required',
            userRole: req.user.role,
        });
        return;
    }

    next();
};

/**
 * RBAC middleware that checks multiple permissions (user must have ALL)
 */
export const requireAllPermissions = (...actions: string[]) => {
    return async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }

            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded',
                });
                return;
            }

            const permissionService = PermissionService.getInstance();
            const failedPermissions: string[] = [];

            for (const action of actions) {
                const result: PermissionResult = await permissionService.checkPermission(
                    req.workspaceContext,
                    req.user,
                    action
                );

                if (!result.allowed) {
                    failedPermissions.push(action);
                }
            }

            if (failedPermissions.length > 0) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    failedPermissions,
                    requiredActions: actions,
                });
                return;
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error (requireAllPermissions):', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};

/**
 * RBAC middleware that checks multiple permissions (user must have ANY)
 */
export const requireAnyPermission = (...actions: string[]) => {
    return async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }

            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded',
                });
                return;
            }

            const permissionService = PermissionService.getInstance();
            let hasAnyPermission = false;

            for (const action of actions) {
                const result: PermissionResult = await permissionService.checkPermission(
                    req.workspaceContext,
                    req.user,
                    action
                );

                if (result.allowed) {
                    hasAnyPermission = true;
                    break;
                }
            }

            if (!hasAnyPermission) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions - requires any of the specified actions',
                    requiredActions: actions,
                });
                return;
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error (requireAnyPermission):', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};

/**
 * RBAC middleware that checks if user has active subscription
 */
export const requireActiveSubscription = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (!req.workspaceContext) {
        res.status(500).json({
            success: false,
            message: 'Workspace context not loaded',
        });
        return;
    }

    // Super admin bypasses subscription checks
    if (req.user.role === 'super_admin') {
        return next();
    }

    if (!req.workspaceContext.isSubscriptionActive) {
        res.status(402).json({
            success: false,
            message: 'Active subscription required',
            upgradeRequired: true,
            subscriptionStatus: req.workspaceContext.workspace?.subscriptionStatus,
        });
        return;
    }

    next();
};

/**
 * RBAC middleware that allows trial access but requires subscription for full access
 */
export const requireSubscriptionOrTrial = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (!req.workspaceContext) {
        res.status(500).json({
            success: false,
            message: 'Workspace context not loaded',
        });
        return;
    }

    // Super admin bypasses subscription checks
    if (req.user.role === 'super_admin') {
        return next();
    }

    const isTrialActive = req.workspaceContext.workspace?.subscriptionStatus === 'trial' &&
        !req.workspaceContext.isTrialExpired;

    if (!req.workspaceContext.isSubscriptionActive && !isTrialActive) {
        res.status(402).json({
            success: false,
            message: 'Active subscription or trial required',
            upgradeRequired: true,
            subscriptionStatus: req.workspaceContext.workspace?.subscriptionStatus,
            isTrialExpired: req.workspaceContext.isTrialExpired,
        });
        return;
    }

    next();
};

export default {
    requirePermission,
    requireRole,
    requireWorkplaceRole,
    requireFeature,
    requirePlanTier,
    requireWorkspaceOwner,
    requireSuperAdmin,
    requireAllPermissions,
    requireAnyPermission,
    requireActiveSubscription,
    requireSubscriptionOrTrial,
};