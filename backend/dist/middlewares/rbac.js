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
exports.gracefulPermissionHandling = exports.notifyPermissionChanges = exports.validateSessionPermissions = exports.requireSubscriptionOrTrial = exports.requireActiveSubscription = exports.requireAnyPermission = exports.requireAllPermissions = exports.requireSuperAdmin = exports.requireWorkspaceOwner = exports.requirePlanTier = exports.requireFeature = exports.requireWorkplaceRole = exports.requireRole = exports.requirePermission = exports.requireDynamicPermission = void 0;
const auth_1 = require("../types/auth");
const PermissionService_1 = __importDefault(require("../services/PermissionService"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const auditLogging_1 = require("./auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const requireDynamicPermission = (action, options = {}) => {
    const { enableLegacyFallback = true, enableSuggestions = true, enableRealTimeValidation = false } = options;
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded. Ensure authWithWorkspace middleware is used.',
                    code: 'WORKSPACE_CONTEXT_MISSING'
                });
                return;
            }
            const permissionContext = {
                workspaceId: req.workspaceContext.workspace?._id,
                clientIP: req.ip || req.connection?.remoteAddress,
                currentTime: new Date()
            };
            const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
            const result = await dynamicPermissionService.checkPermission(req.user, action, req.workspaceContext, permissionContext);
            if (!result.allowed) {
                if (enableLegacyFallback && result.source === 'none') {
                    logger_1.default.debug(`Dynamic permission check failed for ${action}, trying legacy fallback`);
                    const legacyPermissionService = PermissionService_1.default.getInstance();
                    const legacyResult = await legacyPermissionService.checkPermission(req.workspaceContext, req.user, action);
                    if (legacyResult.allowed) {
                        logger_1.default.info(`Legacy permission check succeeded for ${action}`, {
                            userId: req.user._id,
                            action,
                            source: 'legacy_fallback'
                        });
                        req.permissionContext = {
                            action,
                            source: 'legacy_fallback'
                        };
                        return next();
                    }
                }
                await auditLogging_1.auditOperations.permissionDenied(req, action, result.reason || 'Permission denied');
                const statusCode = result.upgradeRequired ? 402 : 403;
                const errorCode = result.upgradeRequired ? 'UPGRADE_REQUIRED' : 'PERMISSION_DENIED';
                const errorResponse = {
                    success: false,
                    message: result.reason || 'Permission denied',
                    code: errorCode,
                    action,
                    source: result.source,
                    timestamp: new Date().toISOString()
                };
                if (result.roleId && result.roleName) {
                    errorResponse.roleContext = {
                        roleId: result.roleId,
                        roleName: result.roleName,
                        inheritedFrom: result.inheritedFrom
                    };
                }
                if (result.requiredPermissions && result.requiredPermissions.length > 0) {
                    errorResponse.requiredPermissions = result.requiredPermissions;
                }
                if (result.upgradeRequired) {
                    errorResponse.upgradeRequired = true;
                    errorResponse.currentPlan = req.workspaceContext.plan?.name;
                    errorResponse.subscriptionStatus = req.workspaceContext.workspace?.subscriptionStatus;
                }
                if (enableSuggestions && result.suggestions && result.suggestions.length > 0) {
                    errorResponse.suggestions = result.suggestions;
                }
                errorResponse.userContext = {
                    userId: req.user._id,
                    systemRole: (0, auth_1.getUserRole)(req.user),
                    workplaceRole: (0, auth_1.getUserWorkplaceRole)(req.user),
                    status: (0, auth_1.getUserStatus)(req.user)
                };
                res.status(statusCode).json(errorResponse);
                return;
            }
            req.permissionContext = {
                action,
                source: result.source || 'unknown',
                roleId: result.roleId,
                roleName: result.roleName,
                inheritedFrom: result.inheritedFrom
            };
            if (result.source === 'super_admin' || action.includes('admin') || action.includes('delete')) {
                logger_1.default.info('Sensitive permission granted', {
                    userId: req.user._id,
                    action,
                    source: result.source,
                    roleId: result.roleId,
                    roleName: result.roleName,
                    workspaceId: req.workspaceContext.workspace?._id
                });
            }
            if (enableRealTimeValidation) {
                req.user.lastPermissionCheck = new Date();
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Dynamic RBAC middleware error:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: req.user?._id,
                action,
                workspaceId: req.workspaceContext?.workspace?._id
            });
            if (enableLegacyFallback) {
                try {
                    logger_1.default.debug(`Dynamic permission check failed with error for ${action}, trying legacy fallback`);
                    const legacyPermissionService = PermissionService_1.default.getInstance();
                    const legacyResult = await legacyPermissionService.checkPermission(req.workspaceContext, req.user, action);
                    if (legacyResult.allowed) {
                        logger_1.default.warn(`Legacy permission check succeeded after dynamic error for ${action}`, {
                            userId: req.user._id,
                            action,
                            error: error instanceof Error ? error.message : String(error)
                        });
                        req.permissionContext = {
                            action,
                            source: 'legacy_error_fallback'
                        };
                        return next();
                    }
                }
                catch (legacyError) {
                    logger_1.default.error('Legacy fallback also failed:', legacyError);
                }
            }
            res.status(500).json({
                success: false,
                message: 'Permission check failed due to system error',
                code: 'PERMISSION_CHECK_ERROR',
                action,
                timestamp: new Date().toISOString()
            });
        }
    };
};
exports.requireDynamicPermission = requireDynamicPermission;
const requirePermission = (action, options = {}) => {
    const { useDynamicRBAC = false, enableLegacyFallback = true } = options;
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                req.permissionContext = {
                    action,
                    source: 'super_admin'
                };
                return next();
            }
            if (!req.workspaceContext) {
                res.status(500).json({
                    success: false,
                    message: 'Workspace context not loaded. Ensure authWithWorkspace middleware is used.',
                });
                return;
            }
            let result;
            let permissionSource = 'legacy';
            if (useDynamicRBAC) {
                try {
                    const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    const permissionContext = {
                        workspaceId: req.workspaceContext.workspace?._id,
                        clientIP: req.ip || req.connection?.remoteAddress,
                        currentTime: new Date()
                    };
                    result = await dynamicPermissionService.checkPermission(req.user, action, req.workspaceContext, permissionContext);
                    permissionSource = result.source || 'dynamic';
                    if (result.allowed) {
                        req.permissionContext = {
                            action,
                            source: permissionSource,
                            roleId: result.roleId,
                            roleName: result.roleName,
                            inheritedFrom: result.inheritedFrom
                        };
                    }
                }
                catch (dynamicError) {
                    logger_1.default.error('Dynamic permission check failed, falling back to legacy:', dynamicError);
                    if (!enableLegacyFallback) {
                        throw dynamicError;
                    }
                    const permissionService = PermissionService_1.default.getInstance();
                    result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
                    permissionSource = 'legacy_fallback';
                }
            }
            else {
                const permissionService = PermissionService_1.default.getInstance();
                result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
            }
            if (!result.allowed) {
                const statusCode = result.upgradeRequired ? 402 : 403;
                await auditLogging_1.auditOperations.permissionDenied(req, action, result.reason || 'Permission denied');
                const errorResponse = {
                    success: false,
                    message: result.reason || 'Permission denied',
                    action,
                    requiredPermissions: result.requiredPermissions,
                    requiredRoles: result.requiredRoles,
                    requiredFeatures: result.requiredFeatures,
                    upgradeRequired: result.upgradeRequired || false,
                    userRole: (0, auth_1.getUserRole)(req.user),
                    workplaceRole: (0, auth_1.getUserWorkplaceRole)(req.user),
                    source: permissionSource
                };
                if (useDynamicRBAC && result.suggestions) {
                    errorResponse.suggestions = result.suggestions;
                }
                res.status(statusCode).json(errorResponse);
                return;
            }
            if (!req.permissionContext) {
                req.permissionContext = {
                    action,
                    source: permissionSource
                };
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
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                req.permissionContext = {
                    action: `role:${roles.join('|')}`,
                    source: 'super_admin'
                };
                return next();
            }
            let hasRole = false;
            let matchedRole;
            let roleSource = 'static';
            if (userRole && roles.includes(userRole)) {
                hasRole = true;
                matchedRole = userRole;
                roleSource = 'static';
            }
            const userAssignedRoles = (0, auth_1.getUserAssignedRoles)(req.user);
            if (!hasRole && userAssignedRoles && userAssignedRoles.length > 0) {
                try {
                    const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    const userPermissions = await dynamicPermissionService.resolveUserPermissions(req.user, req.workspaceContext || {});
                    for (const role of roles) {
                        const rolePermissionAction = `role:${role}`;
                        if (userPermissions.permissions.includes(rolePermissionAction)) {
                            hasRole = true;
                            matchedRole = role;
                            roleSource = 'dynamic';
                            break;
                        }
                    }
                }
                catch (dynamicError) {
                    logger_1.default.error('Dynamic role check failed:', dynamicError);
                }
            }
            if (!hasRole) {
                await auditLogging_1.auditOperations.permissionDenied(req, `role:${roles.join('|')}`, 'Insufficient role permissions');
                res.status(403).json({
                    success: false,
                    message: 'Insufficient role permissions',
                    requiredRoles: roles,
                    userRole: (0, auth_1.getUserRole)(req.user),
                    userAssignedRoles: (0, auth_1.getUserAssignedRoles)(req.user) || [],
                    source: roleSource
                });
                return;
            }
            req.permissionContext = {
                action: `role:${matchedRole}`,
                source: roleSource
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Role check middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Role check failed',
            });
        }
    };
};
exports.requireRole = requireRole;
const requireWorkplaceRole = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                req.permissionContext = {
                    action: `workplace_role:${roles.join('|')}`,
                    source: 'super_admin'
                };
                return next();
            }
            let hasWorkplaceRole = false;
            let matchedRole;
            let roleSource = 'static';
            const userWorkplaceRole = (0, auth_1.getUserWorkplaceRole)(req.user);
            if (userWorkplaceRole && roles.includes(userWorkplaceRole)) {
                hasWorkplaceRole = true;
                matchedRole = userWorkplaceRole;
                roleSource = 'static';
            }
            if (!hasWorkplaceRole && req.workspaceContext?.workspace) {
                try {
                    const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    const userPermissions = await dynamicPermissionService.resolveUserPermissions(req.user, req.workspaceContext);
                    for (const role of roles) {
                        const workplaceRoleAction = `workplace_role:${role}`;
                        if (userPermissions.permissions.includes(workplaceRoleAction)) {
                            hasWorkplaceRole = true;
                            matchedRole = role;
                            roleSource = 'dynamic';
                            break;
                        }
                    }
                    if (!hasWorkplaceRole && req.user.assignedRoles && req.user.assignedRoles.length > 0) {
                        const UserRole = (await Promise.resolve().then(() => __importStar(require('../models/UserRole')))).default;
                        const workspaceRoles = await UserRole.find({
                            userId: req.user._id,
                            workspaceId: req.workspaceContext.workspace._id,
                            isActive: true,
                            $or: [
                                { isTemporary: false },
                                { isTemporary: true, expiresAt: { $gt: new Date() } }
                            ]
                        }).populate('roleId');
                        for (const userRole of workspaceRoles) {
                            const role = userRole.roleId;
                            if (role && role.category === 'workplace' && roles.includes(role.name)) {
                                hasWorkplaceRole = true;
                                matchedRole = role.name;
                                roleSource = 'dynamic_workspace';
                                break;
                            }
                        }
                    }
                }
                catch (dynamicError) {
                    logger_1.default.error('Dynamic workplace role check failed:', dynamicError);
                }
            }
            if (!hasWorkplaceRole) {
                await auditLogging_1.auditOperations.permissionDenied(req, `workplace_role:${roles.join('|')}`, 'Insufficient workplace role permissions');
                res.status(403).json({
                    success: false,
                    message: 'Insufficient workplace role permissions',
                    requiredWorkplaceRoles: roles,
                    userWorkplaceRole: (0, auth_1.getUserWorkplaceRole)(req.user),
                    workspaceId: req.workspaceContext?.workspace?._id,
                    source: roleSource
                });
                return;
            }
            req.permissionContext = {
                action: `workplace_role:${matchedRole}`,
                source: roleSource
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Workplace role check middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Workplace role check failed',
            });
        }
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
        const userRole = (0, auth_1.getUserRole)(req.user);
        if (userRole === 'super_admin') {
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
        const userRole = (0, auth_1.getUserRole)(req.user);
        if (userRole === 'super_admin') {
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
            error: 'User not authenticated',
        });
        return;
    }
    if (!req.workspaceContext?.workspace) {
        res.status(403).json({
            success: false,
            message: 'No workspace associated with user',
            error: 'Access denied',
        });
        return;
    }
    const userRole = (0, auth_1.getUserRole)(req.user);
    if (userRole === 'super_admin') {
        if (req.workspaceContext.workspace._id) {
            req.workplaceId = req.workspaceContext.workspace._id;
        }
        return next();
    }
    const workspaceOwnerId = req.workspaceContext.workspace.ownerId;
    if (!workspaceOwnerId) {
        res.status(403).json({
            success: false,
            message: 'Workspace owner access required',
            error: 'Workspace has no owner assigned',
        });
        return;
    }
    const isOwner = workspaceOwnerId.toString() === req.user._id.toString();
    if (!isOwner) {
        res.status(403).json({
            success: false,
            message: 'Workspace owner access required',
            error: 'Only workspace owners can access this resource',
        });
        return;
    }
    req.workplaceId = req.workspaceContext.workspace._id;
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
    const userRole = (0, auth_1.getUserRole)(req.user);
    if (userRole !== 'super_admin') {
        res.status(403).json({
            success: false,
            message: 'Super administrator access required',
            userRole: userRole,
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
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                req.permissionContext = {
                    action: `all:${actions.join('|')}`,
                    source: 'super_admin'
                };
                return next();
            }
            const failedPermissions = [];
            const permissionSources = {};
            let useDynamicRBAC = true;
            if (useDynamicRBAC) {
                try {
                    const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    const permissionContext = {
                        workspaceId: req.workspaceContext.workspace?._id,
                        clientIP: req.ip || req.connection?.remoteAddress,
                        currentTime: new Date()
                    };
                    for (const action of actions) {
                        const result = await dynamicPermissionService.checkPermission(req.user, action, req.workspaceContext, permissionContext);
                        if (!result.allowed) {
                            failedPermissions.push(action);
                        }
                        else {
                            permissionSources[action] = result.source || 'dynamic';
                        }
                    }
                }
                catch (dynamicError) {
                    logger_1.default.error('Dynamic permission check failed, falling back to legacy:', dynamicError);
                    useDynamicRBAC = false;
                }
            }
            if (!useDynamicRBAC) {
                const permissionService = PermissionService_1.default.getInstance();
                for (const action of actions) {
                    const result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
                    if (!result.allowed) {
                        failedPermissions.push(action);
                    }
                    else {
                        permissionSources[action] = 'legacy';
                    }
                }
            }
            if (failedPermissions.length > 0) {
                await auditLogging_1.auditOperations.permissionDenied(req, `all:${actions.join('|')}`, `Failed permissions: ${failedPermissions.join(', ')}`);
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    failedPermissions,
                    requiredActions: actions,
                    permissionSources,
                    source: useDynamicRBAC ? 'dynamic' : 'legacy'
                });
                return;
            }
            req.permissionContext = {
                action: `all:${actions.join('|')}`,
                source: useDynamicRBAC ? 'dynamic' : 'legacy'
            };
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
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                req.permissionContext = {
                    action: `any:${actions.join('|')}`,
                    source: 'super_admin'
                };
                return next();
            }
            let hasAnyPermission = false;
            let grantedAction;
            let permissionSource = 'legacy';
            let useDynamicRBAC = true;
            if (useDynamicRBAC) {
                try {
                    const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    const permissionContext = {
                        workspaceId: req.workspaceContext.workspace?._id,
                        clientIP: req.ip || req.connection?.remoteAddress,
                        currentTime: new Date()
                    };
                    for (const action of actions) {
                        const result = await dynamicPermissionService.checkPermission(req.user, action, req.workspaceContext, permissionContext);
                        if (result.allowed) {
                            hasAnyPermission = true;
                            grantedAction = action;
                            permissionSource = result.source || 'dynamic';
                            break;
                        }
                    }
                }
                catch (dynamicError) {
                    logger_1.default.error('Dynamic permission check failed, falling back to legacy:', dynamicError);
                    useDynamicRBAC = false;
                }
            }
            if (!useDynamicRBAC && !hasAnyPermission) {
                const permissionService = PermissionService_1.default.getInstance();
                for (const action of actions) {
                    const result = await permissionService.checkPermission(req.workspaceContext, req.user, action);
                    if (result.allowed) {
                        hasAnyPermission = true;
                        grantedAction = action;
                        permissionSource = 'legacy';
                        break;
                    }
                }
            }
            if (!hasAnyPermission) {
                await auditLogging_1.auditOperations.permissionDenied(req, `any:${actions.join('|')}`, 'No matching permissions found');
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions - requires any of the specified actions',
                    requiredActions: actions,
                    source: useDynamicRBAC ? 'dynamic' : 'legacy'
                });
                return;
            }
            req.permissionContext = {
                action: `any:${grantedAction}`,
                source: permissionSource
            };
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
    const userRole = (0, auth_1.getUserRole)(req.user);
    if (userRole === 'super_admin') {
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
    const userRole = (0, auth_1.getUserRole)(req.user);
    if (userRole === 'super_admin') {
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
const validateSessionPermissions = (options = {}) => {
    const { maxSessionAge = 30, criticalActions = [], enableSessionInvalidation = true } = options;
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const userRole = (0, auth_1.getUserRole)(req.user);
            if (userRole === 'super_admin') {
                return next();
            }
            const currentTime = new Date();
            const sessionAgeMinutes = maxSessionAge;
            const requestedAction = req.permissionContext?.action;
            const isCriticalAction = requestedAction && criticalActions.some(action => requestedAction.includes(action));
            const lastPermissionCheck = req.user.lastPermissionCheck;
            if (lastPermissionCheck) {
                const sessionAge = (currentTime.getTime() - lastPermissionCheck.getTime()) / (1000 * 60);
                if (sessionAge > sessionAgeMinutes || isCriticalAction) {
                    logger_1.default.info('Session permission validation required', {
                        userId: req.user._id,
                        sessionAge,
                        maxAge: sessionAgeMinutes,
                        isCriticalAction,
                        action: requestedAction
                    });
                    if (req.workspaceContext) {
                        const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                        const freshPermissions = await dynamicPermissionService.resolveUserPermissions(req.user, req.workspaceContext);
                        if (req.user.cachedPermissions) {
                            const cachedPermissions = req.user.cachedPermissions.permissions || [];
                            const currentPermissions = freshPermissions.permissions;
                            const removedPermissions = cachedPermissions.filter(p => !currentPermissions.includes(p));
                            const addedPermissions = currentPermissions.filter(p => !cachedPermissions.includes(p));
                            if (removedPermissions.length > 0 && enableSessionInvalidation) {
                                const hasCriticalPermissionLoss = removedPermissions.some(perm => criticalActions.some(action => perm.includes(action)));
                                if (hasCriticalPermissionLoss) {
                                    logger_1.default.warn('Critical permissions removed, invalidating session', {
                                        userId: req.user._id,
                                        removedPermissions,
                                        action: requestedAction
                                    });
                                    res.status(401).json({
                                        success: false,
                                        message: 'Session invalidated due to permission changes',
                                        code: 'SESSION_INVALIDATED',
                                        removedPermissions,
                                        requiresReauth: true
                                    });
                                    return;
                                }
                            }
                            if (removedPermissions.length > 0 || addedPermissions.length > 0) {
                                logger_1.default.info('User permissions changed during session', {
                                    userId: req.user._id,
                                    removedPermissions,
                                    addedPermissions,
                                    sessionAge
                                });
                            }
                        }
                        await req.user.updateOne({
                            $set: {
                                'cachedPermissions.permissions': freshPermissions.permissions,
                                'cachedPermissions.lastUpdated': currentTime,
                                'cachedPermissions.expiresAt': new Date(currentTime.getTime() + (sessionAgeMinutes * 60 * 1000)),
                                lastPermissionCheck: currentTime
                            }
                        });
                    }
                }
            }
            else {
                req.user.lastPermissionCheck = currentTime;
                await req.user.save();
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Session permission validation error:', error);
            logger_1.default.warn('Continuing request despite session validation error', {
                userId: req.user?._id,
                error: error instanceof Error ? error.message : String(error)
            });
            next();
        }
    };
};
exports.validateSessionPermissions = validateSessionPermissions;
const notifyPermissionChanges = () => {
    return async (req, res, next) => {
        try {
            const originalSend = res.send;
            const originalJson = res.json;
            res.send = function (body) {
                handlePermissionChangeResponse.call(this, req, body);
                return originalSend.call(this, body);
            };
            res.json = function (body) {
                handlePermissionChangeResponse.call(this, req, body);
                return originalJson.call(this, body);
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Permission change notification middleware error:', error);
            next();
        }
    };
};
exports.notifyPermissionChanges = notifyPermissionChanges;
async function handlePermissionChangeResponse(req, body) {
    try {
        if (body && body.success && req.method !== 'GET') {
            const isPermissionChange = req.originalUrl.includes('/roles') ||
                req.originalUrl.includes('/permissions') ||
                req.originalUrl.includes('/users') && (req.method === 'PUT' || req.method === 'POST');
            if (isPermissionChange && req.user) {
                const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                await dynamicPermissionService.invalidateUserCache(req.user._id);
                logger_1.default.info('Permission change detected, cache invalidated', {
                    userId: req.user._id,
                    action: req.method,
                    url: req.originalUrl,
                    timestamp: new Date()
                });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Error handling permission change response:', error);
    }
}
const gracefulPermissionHandling = () => {
    return async (req, res, next) => {
        try {
            const initialPermissionContext = req.permissionContext;
            const originalNext = next;
            const enhancedNext = async (error) => {
                if (error) {
                    return originalNext(error);
                }
                if (initialPermissionContext && req.user && req.workspaceContext) {
                    const criticalActions = ['delete', 'admin', 'super_admin'];
                    const isCriticalAction = criticalActions.some(action => initialPermissionContext.action.includes(action));
                    if (isCriticalAction) {
                        const dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                        const revalidationResult = await dynamicPermissionService.checkPermission(req.user, initialPermissionContext.action, req.workspaceContext);
                        if (!revalidationResult.allowed) {
                            logger_1.default.warn('Permission revoked during request processing', {
                                userId: req.user._id,
                                action: initialPermissionContext.action,
                                initialSource: initialPermissionContext.source,
                                revalidationResult
                            });
                            return res.status(403).json({
                                success: false,
                                message: 'Permission was revoked during request processing',
                                code: 'PERMISSION_REVOKED_DURING_REQUEST',
                                action: initialPermissionContext.action,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
                originalNext();
            };
            next = enhancedNext;
            originalNext();
        }
        catch (error) {
            logger_1.default.error('Graceful permission handling error:', error);
            next(error);
        }
    };
};
exports.gracefulPermissionHandling = gracefulPermissionHandling;
exports.default = {
    requirePermission: exports.requirePermission,
    requireDynamicPermission: exports.requireDynamicPermission,
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
    validateSessionPermissions: exports.validateSessionPermissions,
    notifyPermissionChanges: exports.notifyPermissionChanges,
    gracefulPermissionHandling: exports.gracefulPermissionHandling,
};
//# sourceMappingURL=rbac.js.map