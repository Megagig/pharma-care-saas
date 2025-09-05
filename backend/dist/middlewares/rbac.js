"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSubscriptionOrTrial = exports.requireActiveSubscription = exports.requireAnyPermission = exports.requireAllPermissions = exports.requireSuperAdmin = exports.requireWorkspaceOwner = exports.requirePlanTier = exports.requireFeature = exports.requireWorkplaceRole = exports.requireRole = exports.requirePermission = void 0;
const PermissionService_1 = __importDefault(require("../services/PermissionService"));
const auditLogging_1 = require("./auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const requirePermission = (action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
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
            const permissionService = PermissionService_1.default.getInstance();
            const result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
            if (!result.allowed) {
                const statusCode = result.upgradeRequired ? 402 : 403;
                await auditLogging_1.auditOperations.permissionDenied(req, action, result.reason || 'Permission denied');
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
        }
        catch (error) {
            logger_1.default.error('RBAC middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};
exports.requirePermission = requirePermission;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
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
exports.requireRole = requireRole;
const requireWorkplaceRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
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
exports.requireWorkplaceRole = requireWorkplaceRole;
const requireFeature = (...features) => {
    return (req, res, next) => {
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
        if (req.user.role === 'super_admin') {
            return next();
        }
        const userFeatures = req.workspaceContext.permissions || [];
        const hasRequiredFeatures = features.every(feature => userFeatures.includes(feature));
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
exports.requireFeature = requireFeature;
const requirePlanTier = (...tiers) => {
    return (req, res, next) => {
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
exports.requirePlanTier = requirePlanTier;
const requireWorkspaceOwner = (req, res, next) => {
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
exports.requireWorkspaceOwner = requireWorkspaceOwner;
const requireSuperAdmin = (req, res, next) => {
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
exports.requireSuperAdmin = requireSuperAdmin;
const requireAllPermissions = (...actions) => {
    return async (req, res, next) => {
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
            const permissionService = PermissionService_1.default.getInstance();
            const failedPermissions = [];
            for (const action of actions) {
                const result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
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
        }
        catch (error) {
            logger_1.default.error('RBAC middleware error (requireAllPermissions):', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};
exports.requireAllPermissions = requireAllPermissions;
const requireAnyPermission = (...actions) => {
    return async (req, res, next) => {
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
            const permissionService = PermissionService_1.default.getInstance();
            let hasAnyPermission = false;
            for (const action of actions) {
                const result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
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
        }
        catch (error) {
            logger_1.default.error('RBAC middleware error (requireAnyPermission):', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
            });
        }
    };
};
exports.requireAnyPermission = requireAnyPermission;
const requireActiveSubscription = (req, res, next) => {
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
exports.requireActiveSubscription = requireActiveSubscription;
const requireSubscriptionOrTrial = (req, res, next) => {
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
exports.requireSubscriptionOrTrial = requireSubscriptionOrTrial;
exports.default = {
    requirePermission: exports.requirePermission,
    requireRole: exports.requireRole,
    requireWorkplaceRole: exports.requireWorkplaceRole,
    requireFeature: exports.requireFeature,
    requirePlanTier: exports.requirePlanTier,
    requireWorkspaceOwner: exports.requireWorkspaceOwner,
    requireSuperAdmin: exports.requireSuperAdmin,
    requireAllPermissions: exports.requireAllPermissions,
    requireAnyPermission: exports.requireAnyPermission,
    requireActiveSubscription: exports.requireActiveSubscription,
    requireSubscriptionOrTrial: exports.requireSubscriptionOrTrial,
};
//# sourceMappingURL=rbac.js.map