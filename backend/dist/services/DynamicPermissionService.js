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
exports.DynamicPermissionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const Permission_1 = __importDefault(require("../models/Permission"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const RolePermission_1 = __importDefault(require("../models/RolePermission"));
const RoleHierarchyService_1 = __importDefault(require("./RoleHierarchyService"));
const CacheManager_1 = __importDefault(require("./CacheManager"));
const PermissionAggregationService_1 = __importDefault(require("./PermissionAggregationService"));
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogging_1 = require("../middlewares/auditLogging");
class DynamicPermissionService {
    constructor() {
        this.CACHE_TTL = 5 * 60 * 1000;
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        this.cacheManager = CacheManager_1.default.getInstance();
        this.cacheInvalidationService = null;
        this.dbOptimizationService = null;
        this.aggregationService = PermissionAggregationService_1.default.getInstance();
    }
    static getInstance() {
        if (!DynamicPermissionService.instance) {
            DynamicPermissionService.instance = new DynamicPermissionService();
        }
        return DynamicPermissionService.instance;
    }
    async checkPermission(user, action, context, permissionContext = {}) {
        const startTime = Date.now();
        try {
            const cachedResult = await this.cacheManager.getCachedPermissionCheck(user._id, action, context.workspace?._id);
            if (cachedResult) {
                logger_1.default.debug(`Cache hit for permission check: ${user._id}:${action}`);
                return {
                    allowed: cachedResult.allowed,
                    source: cachedResult.source,
                    reason: cachedResult.allowed ? undefined : 'Cached permission denial'
                };
            }
            if (user.role === 'super_admin') {
                const result = {
                    allowed: true,
                    source: 'super_admin'
                };
                await this.cacheManager.cachePermissionCheck(user._id, action, true, 'super_admin', context.workspace?._id, this.CACHE_TTL / 1000);
                await this.auditPermissionCheck(user, action, context, result);
                return result;
            }
            const statusCheck = this.checkUserStatus(user);
            if (!statusCheck.allowed) {
                await this.auditPermissionCheck(user, action, context, statusCheck);
                return { ...statusCheck, source: 'none' };
            }
            if (user.deniedPermissions?.includes(action)) {
                const result = {
                    allowed: false,
                    reason: 'Permission explicitly denied',
                    source: 'direct_denial'
                };
                await this.cacheManager.cachePermissionCheck(user._id, action, false, 'direct_denial', context.workspace?._id, this.CACHE_TTL / 1000);
                await this.auditPermissionCheck(user, action, context, result);
                return result;
            }
            if (user.directPermissions?.includes(action)) {
                const result = {
                    allowed: true,
                    source: 'direct_permission'
                };
                await this.cacheManager.cachePermissionCheck(user._id, action, true, 'direct_permission', context.workspace?._id, this.CACHE_TTL / 1000);
                await this.auditPermissionCheck(user, action, context, result);
                return result;
            }
            const rolePermissionResult = await this.resolveRolePermissions(user, action, context, permissionContext);
            if (rolePermissionResult.allowed) {
                await this.cacheManager.cachePermissionCheck(user._id, action, true, rolePermissionResult.source || 'role', context.workspace?._id, this.CACHE_TTL / 1000);
                await this.auditPermissionCheck(user, action, context, rolePermissionResult);
                return rolePermissionResult;
            }
            const legacyResult = await this.checkLegacyPermission(user, action, context);
            if (legacyResult.allowed) {
                const result = {
                    ...legacyResult,
                    source: 'legacy'
                };
                await this.cacheManager.cachePermissionCheck(user._id, action, true, 'legacy', context.workspace?._id, this.CACHE_TTL / 1000);
                await this.auditPermissionCheck(user, action, context, result);
                return result;
            }
            const suggestions = await this.getPermissionSuggestions(user, action);
            const result = {
                allowed: false,
                reason: 'No matching permissions found',
                source: 'none',
                suggestions
            };
            await this.cacheManager.cachePermissionCheck(user._id, action, false, 'none', context.workspace?._id, Math.floor(this.CACHE_TTL / 2000));
            await this.auditPermissionCheck(user, action, context, result);
            return result;
        }
        catch (error) {
            logger_1.default.error('Dynamic permission check error:', error);
            const result = {
                allowed: false,
                reason: 'Permission check failed due to system error',
                source: 'none'
            };
            await this.auditPermissionCheck(user, action, context, result);
            return result;
        }
        finally {
            const executionTime = Date.now() - startTime;
            if (this.dbOptimizationService) {
                this.dbOptimizationService.recordQueryMetrics({
                    query: `checkPermission:${action}`,
                    executionTime,
                    documentsExamined: 0,
                    documentsReturned: 1,
                    indexUsed: true,
                    timestamp: new Date()
                });
            }
        }
    }
    async resolveUserPermissions(user, context, permissionContext = {}) {
        try {
            const cachedPermissions = await this.cacheManager.getCachedUserPermissions(user._id, context.workspace?._id);
            if (cachedPermissions) {
                logger_1.default.debug(`Cache hit for user permissions: ${user._id}`);
                return {
                    permissions: cachedPermissions.permissions,
                    sources: cachedPermissions.sources,
                    deniedPermissions: cachedPermissions.deniedPermissions
                };
            }
            const allPermissions = new Set();
            const permissionSources = {};
            const deniedPermissions = new Set();
            if (user.role === 'super_admin') {
                const allSystemPermissions = await Permission_1.default.find({ isActive: true }).select('action');
                allSystemPermissions.forEach(perm => {
                    allPermissions.add(perm.action);
                    permissionSources[perm.action] = 'super_admin';
                });
                return {
                    permissions: Array.from(allPermissions),
                    sources: permissionSources,
                    deniedPermissions: []
                };
            }
            if (user.permissions && user.permissions.length > 0) {
                user.permissions.forEach(permission => {
                    allPermissions.add(permission);
                    permissionSources[permission] = 'legacy';
                });
            }
            if (user.directPermissions && user.directPermissions.length > 0) {
                user.directPermissions.forEach(permission => {
                    allPermissions.add(permission);
                    permissionSources[permission] = 'direct_permission';
                });
            }
            const rolePermissions = await this.getAllRolePermissions(user, context, permissionContext);
            rolePermissions.forEach(({ permission, source, roleId, roleName }) => {
                allPermissions.add(permission);
                permissionSources[permission] = source;
            });
            if (user.deniedPermissions && user.deniedPermissions.length > 0) {
                user.deniedPermissions.forEach(permission => {
                    allPermissions.delete(permission);
                    deniedPermissions.add(permission);
                    delete permissionSources[permission];
                });
            }
            const result = {
                permissions: Array.from(allPermissions),
                sources: permissionSources,
                deniedPermissions: Array.from(deniedPermissions)
            };
            await this.cacheManager.cacheUserPermissions(user._id, result.permissions, result.sources, result.deniedPermissions, context.workspace?._id, this.CACHE_TTL / 1000);
            return result;
        }
        catch (error) {
            logger_1.default.error('Error resolving user permissions:', error);
            return {
                permissions: [],
                sources: {},
                deniedPermissions: []
            };
        }
    }
    async resolveRolePermissions(user, action, context, permissionContext) {
        try {
            const userRoles = await UserRole_1.default.find({
                userId: user._id,
                isActive: true,
                $or: [
                    { isTemporary: false },
                    { isTemporary: true, expiresAt: { $gt: new Date() } }
                ]
            }).populate('roleId');
            for (const userRole of userRoles) {
                const role = userRole.roleId;
                if (!role || !role.isActive)
                    continue;
                const rolePermissions = await RolePermission_1.default.find({
                    roleId: role._id,
                    permissionAction: action,
                    isActive: true
                }).sort({ priority: -1 });
                for (const rolePerm of rolePermissions) {
                    const isAllowed = rolePerm.evaluatePermission({
                        currentTime: permissionContext.currentTime,
                        clientIP: permissionContext.clientIP,
                        workspaceId: permissionContext.workspaceId,
                        departmentId: permissionContext.departmentId,
                        resourceId: permissionContext.resourceId
                    });
                    if (isAllowed) {
                        return {
                            allowed: rolePerm.granted,
                            source: 'role',
                            roleId: role._id,
                            roleName: role.name,
                            reason: rolePerm.granted ? undefined : 'Permission denied by role'
                        };
                    }
                }
                if (role.permissions.includes(action)) {
                    return {
                        allowed: true,
                        source: 'role',
                        roleId: role._id,
                        roleName: role.name
                    };
                }
                const inheritedResult = await this.checkInheritedPermissions(role, action, permissionContext);
                if (inheritedResult.allowed) {
                    return inheritedResult;
                }
            }
            return { allowed: false };
        }
        catch (error) {
            logger_1.default.error('Error resolving role permissions:', error);
            return { allowed: false, reason: 'Role permission resolution failed' };
        }
    }
    async checkInheritedPermissions(role, action, permissionContext, visited = new Set()) {
        if (visited.has(role._id.toString())) {
            return { allowed: false };
        }
        visited.add(role._id.toString());
        if (!role.parentRole) {
            return { allowed: false };
        }
        try {
            const parentRole = await Role_1.default.findById(role.parentRole);
            if (!parentRole || !parentRole.isActive) {
                return { allowed: false };
            }
            const parentRolePermissions = await RolePermission_1.default.find({
                roleId: parentRole._id,
                permissionAction: action,
                isActive: true
            }).sort({ priority: -1 });
            for (const rolePerm of parentRolePermissions) {
                const isAllowed = rolePerm.evaluatePermission({
                    currentTime: permissionContext.currentTime,
                    clientIP: permissionContext.clientIP,
                    workspaceId: permissionContext.workspaceId,
                    departmentId: permissionContext.departmentId,
                    resourceId: permissionContext.resourceId
                });
                if (isAllowed) {
                    return {
                        allowed: rolePerm.granted,
                        source: 'inherited',
                        roleId: parentRole._id,
                        roleName: parentRole.name,
                        inheritedFrom: role.name,
                        reason: rolePerm.granted ? undefined : 'Permission denied by parent role'
                    };
                }
            }
            if (parentRole.permissions.includes(action)) {
                return {
                    allowed: true,
                    source: 'inherited',
                    roleId: parentRole._id,
                    roleName: parentRole.name,
                    inheritedFrom: role.name
                };
            }
            return this.checkInheritedPermissions(parentRole, action, permissionContext, visited);
        }
        catch (error) {
            logger_1.default.error('Error checking inherited permissions:', error);
            return { allowed: false };
        }
    }
    async getAllRolePermissions(user, context, permissionContext) {
        const permissions = [];
        try {
            const userRoles = await UserRole_1.default.find({
                userId: user._id,
                isActive: true,
                $or: [
                    { isTemporary: false },
                    { isTemporary: true, expiresAt: { $gt: new Date() } }
                ]
            }).populate('roleId');
            for (const userRole of userRoles) {
                const role = userRole.roleId;
                if (!role || !role.isActive)
                    continue;
                const rolePermissions = await this.getAllPermissionsForRole(role, permissionContext);
                permissions.push(...rolePermissions);
            }
            return permissions;
        }
        catch (error) {
            logger_1.default.error('Error getting all role permissions:', error);
            return [];
        }
    }
    async getAllPermissionsForRole(role, permissionContext, visited = new Set()) {
        if (visited.has(role._id.toString())) {
            return [];
        }
        visited.add(role._id.toString());
        const cachedRolePermissions = await this.cacheManager.getCachedRolePermissions(role._id);
        if (cachedRolePermissions && visited.size === 1) {
            logger_1.default.debug(`Cache hit for role permissions: ${role._id}`);
            return cachedRolePermissions.permissions.map(permission => ({
                permission,
                source: 'role',
                roleId: role._id,
                roleName: role.name
            }));
        }
        const permissions = [];
        try {
            const rolePermissions = await RolePermission_1.default.find({
                roleId: role._id,
                isActive: true,
                granted: true
            });
            for (const rolePerm of rolePermissions) {
                const isAllowed = rolePerm.evaluatePermission({
                    currentTime: permissionContext.currentTime,
                    clientIP: permissionContext.clientIP,
                    workspaceId: permissionContext.workspaceId,
                    departmentId: permissionContext.departmentId,
                    resourceId: permissionContext.resourceId
                });
                if (isAllowed) {
                    permissions.push({
                        permission: rolePerm.permissionAction,
                        source: 'role',
                        roleId: role._id,
                        roleName: role.name
                    });
                }
            }
            if (role.permissions && role.permissions.length > 0) {
                role.permissions.forEach(permission => {
                    permissions.push({
                        permission,
                        source: 'role',
                        roleId: role._id,
                        roleName: role.name
                    });
                });
            }
            if (role.parentRole) {
                const parentRole = await Role_1.default.findById(role.parentRole);
                if (parentRole && parentRole.isActive) {
                    const inheritedPermissions = await this.getAllPermissionsForRole(parentRole, permissionContext, visited);
                    inheritedPermissions.forEach(perm => {
                        permissions.push({
                            ...perm,
                            source: 'inherited'
                        });
                    });
                }
            }
            if (visited.size === 1 && permissions.length > 0) {
                const allPermissions = permissions.map(p => p.permission);
                const inheritedPermissions = permissions
                    .filter(p => p.source === 'inherited')
                    .map(p => p.permission);
                await this.cacheManager.cacheRolePermissions(role._id, allPermissions, inheritedPermissions, role.hierarchyLevel || 0, role.parentRole, this.CACHE_TTL / 1000);
            }
            return permissions;
        }
        catch (error) {
            logger_1.default.error('Error getting permissions for role:', error);
            return [];
        }
    }
    checkUserStatus(user) {
        if (user.status === 'suspended') {
            return {
                allowed: false,
                reason: 'User account is suspended'
            };
        }
        if (user.status === 'pending') {
            return {
                allowed: false,
                reason: 'User account is pending activation'
            };
        }
        if (user.licenseStatus === 'rejected' &&
            ['pharmacist', 'intern_pharmacist'].includes(user.role)) {
            return {
                allowed: false,
                reason: 'License verification rejected'
            };
        }
        return { allowed: true };
    }
    async checkLegacyPermission(user, action, context) {
        try {
            const PermissionService = (await Promise.resolve().then(() => __importStar(require('./PermissionService')))).default;
            const legacyService = PermissionService.getInstance();
            return await legacyService.checkPermission(context, user, action);
        }
        catch (error) {
            logger_1.default.error('Error checking legacy permission:', error);
            return { allowed: false, reason: 'Legacy permission check failed' };
        }
    }
    async getPermissionSuggestions(user, action) {
        try {
            const suggestions = [];
            const userPermissions = await this.resolveUserPermissions(user, {});
            const [resource, actionPart] = action.split(':');
            if (!resource || !actionPart) {
                return suggestions;
            }
            const sameResourcePerms = userPermissions.permissions.filter(perm => perm.startsWith(`${resource}:`) && perm !== action);
            if (sameResourcePerms.length > 0) {
                suggestions.push(`You have other ${resource} permissions: ${sameResourcePerms.join(', ')}`);
            }
            const rolesWithPermission = await RolePermission_1.default.find({
                permissionAction: action,
                granted: true,
                isActive: true
            }).populate('roleId');
            const roleNames = rolesWithPermission
                .map(rp => rp.roleId?.displayName)
                .filter(Boolean)
                .slice(0, 3);
            if (roleNames.length > 0) {
                suggestions.push(`This permission is available in roles: ${roleNames.join(', ')}`);
            }
            return suggestions;
        }
        catch (error) {
            logger_1.default.error('Error getting permission suggestions:', error);
            return [];
        }
    }
    async invalidateUserCache(userId, workspaceId, reason = 'User permission change', initiatedBy) {
        try {
            await this.cacheInvalidationService.invalidateUserPermissions(userId, {
                workspaceId,
                reason,
                initiatedBy,
                strategy: {
                    immediate: true,
                    cascade: false,
                    selective: true,
                    distributed: true
                }
            });
            logger_1.default.debug(`Invalidated permission cache for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error invalidating user cache:', error);
        }
    }
    async invalidateRoleCache(roleId, reason = 'Role permission change', initiatedBy) {
        try {
            await this.cacheInvalidationService.invalidateRolePermissions(roleId, {
                reason,
                initiatedBy,
                strategy: {
                    immediate: true,
                    cascade: true,
                    selective: true,
                    distributed: true
                }
            });
            this.roleHierarchyService.clearHierarchyCache(roleId);
            logger_1.default.debug(`Invalidated permission cache for role ${roleId}`);
        }
        catch (error) {
            logger_1.default.error('Error invalidating role cache:', error);
        }
    }
    async invalidateRoleHierarchyCache(roleId, reason = 'Role hierarchy change', initiatedBy) {
        try {
            await this.cacheInvalidationService.invalidateRoleHierarchy(roleId, {
                reason,
                initiatedBy,
                strategy: {
                    immediate: true,
                    cascade: true,
                    selective: true,
                    distributed: true
                }
            });
            logger_1.default.debug(`Invalidated hierarchy cache for role ${roleId}`);
        }
        catch (error) {
            logger_1.default.error('Error invalidating role hierarchy cache:', error);
        }
    }
    async bulkUpdateUserPermissions(updates, modifiedBy) {
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                for (const update of updates) {
                    if (update.roleIds) {
                        await this.updateUserRoles(update.userId, update.roleIds, modifiedBy, session);
                    }
                    if (update.directPermissions || update.deniedPermissions) {
                        await User_1.default.findByIdAndUpdate(update.userId, {
                            $set: {
                                directPermissions: update.directPermissions || [],
                                deniedPermissions: update.deniedPermissions || [],
                                roleLastModifiedBy: modifiedBy,
                                roleLastModifiedAt: new Date(),
                            },
                        }, { session });
                    }
                    await this.invalidateUserCache(update.userId);
                    await this.auditPermissionChange({
                        userId: update.userId,
                        modifiedBy,
                        changes: update,
                        timestamp: new Date(),
                    });
                }
            });
        }
        finally {
            await session.endSession();
        }
    }
    async updateUserRoles(userId, roleIds, modifiedBy, session) {
        await UserRole_1.default.updateMany({ userId, isActive: true }, {
            $set: {
                isActive: false,
                revokedBy: modifiedBy,
                revokedAt: new Date(),
                lastModifiedBy: modifiedBy
            }
        }, { session });
        for (const roleId of roleIds) {
            const userRole = new UserRole_1.default({
                userId,
                roleId,
                assignedBy: modifiedBy,
                lastModifiedBy: modifiedBy,
                isActive: true
            });
            await userRole.save({ session });
        }
        await User_1.default.findByIdAndUpdate(userId, {
            $set: {
                assignedRoles: roleIds,
                roleLastModifiedBy: modifiedBy,
                roleLastModifiedAt: new Date(),
            },
        }, { session });
    }
    async auditPermissionChange(data) {
        try {
            logger_1.default.info('Permission change audit', {
                userId: data.userId,
                modifiedBy: data.modifiedBy,
                changes: data.changes,
                timestamp: data.timestamp
            });
        }
        catch (error) {
            logger_1.default.error('Error auditing permission change:', error);
        }
    }
    async warmPermissionCache(options) {
        try {
            logger_1.default.info('Starting permission cache warming', options);
            if (options.userIds && options.userIds.length > 0) {
                for (const userId of options.userIds) {
                    try {
                        const user = await User_1.default.findById(userId);
                        if (user) {
                            await this.resolveUserPermissions(user, { workspace: options.workspaceId ? { _id: options.workspaceId } : undefined });
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error warming cache for user ${userId}:`, error);
                    }
                }
            }
            if (options.roleIds && options.roleIds.length > 0) {
                for (const roleId of options.roleIds) {
                    try {
                        const role = await Role_1.default.findById(roleId);
                        if (role) {
                            await this.getAllPermissionsForRole(role, {
                                workspaceId: options.workspaceId,
                                currentTime: new Date()
                            });
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error warming cache for role ${roleId}:`, error);
                    }
                }
            }
            if (options.userIds && options.commonActions && options.commonActions.length > 0) {
                for (const userId of options.userIds) {
                    const user = await User_1.default.findById(userId);
                    if (user) {
                        for (const action of options.commonActions) {
                            try {
                                await this.checkPermission(user, action, { workspace: options.workspaceId ? { _id: options.workspaceId } : undefined });
                            }
                            catch (error) {
                                logger_1.default.error(`Error warming cache for permission ${userId}:${action}:`, error);
                            }
                        }
                    }
                }
            }
            logger_1.default.info('Permission cache warming completed');
        }
        catch (error) {
            logger_1.default.error('Error warming permission cache:', error);
        }
    }
    async getCacheMetrics() {
        try {
            return await this.cacheManager.getMetrics();
        }
        catch (error) {
            logger_1.default.error('Error getting cache metrics:', error);
            return null;
        }
    }
    async checkCacheConsistency() {
        try {
            return await this.cacheManager.checkConsistency();
        }
        catch (error) {
            logger_1.default.error('Error checking cache consistency:', error);
            return {
                consistent: false,
                issues: ['Error checking consistency'],
                repaired: 0
            };
        }
    }
    async initializeDatabaseOptimizations() {
        try {
            await this.dbOptimizationService.createOptimizedIndexes();
            await this.dbOptimizationService.optimizeConnectionPool();
            logger_1.default.info('Database optimizations initialized successfully');
        }
        catch (error) {
            logger_1.default.error('Error initializing database optimizations:', error);
        }
    }
    async getDatabaseOptimizationReport() {
        try {
            return await this.dbOptimizationService.analyzeQueryPerformance();
        }
        catch (error) {
            logger_1.default.error('Error getting database optimization report:', error);
            return null;
        }
    }
    getQueryPerformanceStats() {
        try {
            return this.dbOptimizationService.getQueryStats();
        }
        catch (error) {
            logger_1.default.error('Error getting query performance stats:', error);
            return null;
        }
    }
    async auditPermissionCheck(user, action, context, result) {
        try {
            if (!result.allowed || result.source === 'super_admin') {
                const mockReq = {
                    user,
                    workspace: context.workspace,
                    ip: 'system',
                    get: () => 'DynamicPermissionService',
                    method: 'PERMISSION_CHECK',
                    originalUrl: `/permission/${action}`,
                    connection: { remoteAddress: 'system' }
                };
                if (!result.allowed) {
                    await auditLogging_1.auditOperations.permissionDenied(mockReq, action, result.reason || 'Permission denied');
                }
                else if (result.source === 'super_admin') {
                    logger_1.default.info('Super admin permission access', {
                        userId: user._id,
                        action,
                        source: result.source,
                        workspaceId: context.workspace?._id
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error auditing permission check:', error);
        }
    }
}
exports.DynamicPermissionService = DynamicPermissionService;
exports.default = DynamicPermissionService;
//# sourceMappingURL=DynamicPermissionService.js.map