"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const permissionMatrix_1 = require("../config/permissionMatrix");
const logger_1 = __importDefault(require("../utils/logger"));
class PermissionService {
    constructor() {
        this.cachedMatrix = null;
        this.lastLoadTime = 0;
        this.CACHE_DURATION = 5 * 60 * 1000;
    }
    static getInstance() {
        if (!PermissionService.instance) {
            PermissionService.instance = new PermissionService();
        }
        return PermissionService.instance;
    }
    async checkPermission(context, user, action) {
        try {
            if (user.role === 'super_admin') {
                return { allowed: true };
            }
            const matrix = await this.loadPermissionMatrix();
            const permission = matrix[action];
            if (!permission) {
                logger_1.default.warn(`Permission not found for action: ${action}`);
                return {
                    allowed: false,
                    reason: 'Permission not defined',
                };
            }
            const statusCheck = this.checkUserStatus(user);
            if (!statusCheck.allowed) {
                return statusCheck;
            }
            const systemRoleCheck = this.checkSystemRoles(user, permission);
            if (!systemRoleCheck.allowed) {
                return systemRoleCheck;
            }
            const workplaceRoleCheck = this.checkWorkplaceRoles(user, permission);
            if (!workplaceRoleCheck.allowed) {
                return workplaceRoleCheck;
            }
            const subscriptionCheck = this.checkSubscriptionRequirements(context, permission);
            if (!subscriptionCheck.allowed) {
                return subscriptionCheck;
            }
            const featureCheck = this.checkPlanFeatures(context, permission);
            if (!featureCheck.allowed) {
                return featureCheck;
            }
            const tierCheck = this.checkPlanTiers(context, permission);
            if (!tierCheck.allowed) {
                return tierCheck;
            }
            return { allowed: true };
        }
        catch (error) {
            logger_1.default.error('Error checking permission:', error);
            return {
                allowed: false,
                reason: 'Permission check failed',
            };
        }
    }
    async resolveUserPermissions(user, context) {
        const matrix = await this.loadPermissionMatrix();
        const allowedActions = [];
        for (const action of Object.keys(matrix)) {
            const result = await this.checkPermission(context, user, action);
            if (result.allowed) {
                allowedActions.push(action);
            }
        }
        return allowedActions;
    }
    async loadPermissionMatrix() {
        const now = Date.now();
        if (this.cachedMatrix && (now - this.lastLoadTime) < this.CACHE_DURATION) {
            return this.cachedMatrix;
        }
        this.cachedMatrix = permissionMatrix_1.PERMISSION_MATRIX;
        this.lastLoadTime = now;
        logger_1.default.info(`Permission matrix loaded with ${Object.keys(this.cachedMatrix).length} actions`);
        return this.cachedMatrix;
    }
    checkUserStatus(user) {
        if (user.status === 'suspended') {
            return {
                allowed: false,
                reason: 'User account is suspended',
            };
        }
        if (user.licenseStatus === 'rejected' &&
            ['pharmacist', 'intern_pharmacist'].includes(user.role)) {
            return {
                allowed: false,
                reason: 'License verification rejected',
            };
        }
        return { allowed: true };
    }
    checkSubscriptionRequirements(context, permission) {
        if (!permission.requiresActiveSubscription) {
            return { allowed: true };
        }
        if (permission.allowTrialAccess && context.workspace?.subscriptionStatus === 'trial') {
            if (!context.isTrialExpired) {
                return { allowed: true };
            }
        }
        if (!context.isSubscriptionActive) {
            return {
                allowed: false,
                reason: 'Active subscription required',
                upgradeRequired: true,
            };
        }
        return { allowed: true };
    }
    checkPlanFeatures(context, permission) {
        if (!permission.features || permission.features.length === 0) {
            return { allowed: true };
        }
        const planFeatures = context.permissions || [];
        const hasRequiredFeatures = permission.features.every(feature => planFeatures.includes(feature));
        if (!hasRequiredFeatures) {
            return {
                allowed: false,
                reason: 'Required plan features not available',
                requiredFeatures: permission.features,
                upgradeRequired: true,
            };
        }
        return { allowed: true };
    }
    checkPlanTiers(context, permission) {
        if (!permission.planTiers || permission.planTiers.length === 0) {
            return { allowed: true };
        }
        const currentTier = context.plan?.tier;
        if (!currentTier || !permission.planTiers.includes(currentTier)) {
            return {
                allowed: false,
                reason: 'Plan tier not sufficient',
                upgradeRequired: true,
            };
        }
        return { allowed: true };
    }
    checkSystemRoles(user, permission) {
        if (!permission.systemRoles || permission.systemRoles.length === 0) {
            return { allowed: true };
        }
        const userRole = user.role;
        const allowedRoles = permissionMatrix_1.ROLE_HIERARCHY[userRole] || [userRole];
        const hasRequiredRole = permission.systemRoles.some(role => allowedRoles.includes(role));
        if (!hasRequiredRole) {
            return {
                allowed: false,
                reason: 'Insufficient system role',
                requiredRoles: permission.systemRoles,
            };
        }
        return { allowed: true };
    }
    checkWorkplaceRoles(user, permission) {
        if (!permission.workplaceRoles || permission.workplaceRoles.length === 0) {
            return { allowed: true };
        }
        const userWorkplaceRole = user.workplaceRole;
        if (!userWorkplaceRole) {
            return {
                allowed: false,
                reason: 'No workplace role assigned',
            };
        }
        const allowedRoles = permissionMatrix_1.WORKPLACE_ROLE_HIERARCHY[userWorkplaceRole] || [userWorkplaceRole];
        const hasRequiredRole = permission.workplaceRoles.some(role => allowedRoles.includes(role));
        if (!hasRequiredRole) {
            return {
                allowed: false,
                reason: 'Insufficient workplace role',
                requiredRoles: permission.workplaceRoles,
            };
        }
        return { allowed: true };
    }
    async refreshCache() {
        this.cachedMatrix = null;
        this.lastLoadTime = 0;
        await this.loadPermissionMatrix();
    }
}
exports.default = PermissionService;
//# sourceMappingURL=PermissionService.js.map