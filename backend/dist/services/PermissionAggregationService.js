"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Permission_1 = __importDefault(require("../models/Permission"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const RolePermission_1 = __importDefault(require("../models/RolePermission"));
const RoleHierarchyService_1 = __importDefault(require("./RoleHierarchyService"));
const CacheManager_1 = __importDefault(require("./CacheManager"));
const logger_1 = __importDefault(require("../utils/logger"));
class PermissionAggregationService {
    constructor() {
        this.PRIORITY_LEVELS = {
            EXPLICIT_DENY: 1000,
            DIRECT_PERMISSION: 900,
            ROLE_PERMISSION: 800,
            INHERITED_PERMISSION: 700,
            LEGACY_PERMISSION: 600,
            DEFAULT_DENY: 0
        };
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        this.cacheManager = CacheManager_1.default.getInstance();
    }
    static getInstance() {
        if (!PermissionAggregationService.instance) {
            PermissionAggregationService.instance = new PermissionAggregationService();
        }
        return PermissionAggregationService.instance;
    }
    async aggregateUserPermissions(user, workspaceId) {
        try {
            const allPermissions = new Map();
            const conflicts = [];
            const dependencies = [];
            await this.collectDirectPermissions(user, allPermissions);
            await this.collectRolePermissions(user, workspaceId, allPermissions);
            await this.collectInheritedPermissions(user, workspaceId, allPermissions);
            await this.collectLegacyPermissions(user, allPermissions);
            this.applyExplicitDenials(user, allPermissions, conflicts);
            this.resolvePermissionConflicts(allPermissions, conflicts);
            await this.validatePermissionDependencies(Array.from(allPermissions.values()), dependencies);
            const suggestions = await this.generatePermissionSuggestions(user, Array.from(allPermissions.values()), conflicts);
            return {
                userId: user._id,
                workspaceId,
                permissions: Array.from(allPermissions.values()),
                conflicts,
                dependencies,
                suggestions,
                timestamp: new Date()
            };
        }
        catch (error) {
            logger_1.default.error('Error aggregating user permissions:', error);
            return {
                userId: user._id,
                workspaceId,
                permissions: [],
                conflicts: [],
                dependencies: [],
                suggestions: [],
                timestamp: new Date()
            };
        }
    }
    async collectDirectPermissions(user, allPermissions) {
        if (!user.directPermissions || user.directPermissions.length === 0) {
            return;
        }
        for (const permission of user.directPermissions) {
            const source = {
                type: 'direct',
                priority: this.PRIORITY_LEVELS.DIRECT_PERMISSION
            };
            this.addOrMergePermission(allPermissions, permission, true, source);
        }
    }
    async collectRolePermissions(user, workspaceId, allPermissions) {
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
                    isActive: true
                });
                for (const rolePerm of rolePermissions) {
                    const source = {
                        type: 'role',
                        roleId: role._id,
                        roleName: role.name,
                        priority: this.PRIORITY_LEVELS.ROLE_PERMISSION,
                        conditions: rolePerm.conditions
                    };
                    this.addOrMergePermission(allPermissions, rolePerm.permissionAction, rolePerm.granted, source);
                }
                if (role.permissions && role.permissions.length > 0) {
                    for (const permission of role.permissions) {
                        const source = {
                            type: 'role',
                            roleId: role._id,
                            roleName: role.name,
                            priority: this.PRIORITY_LEVELS.ROLE_PERMISSION
                        };
                        this.addOrMergePermission(allPermissions, permission, true, source);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error collecting role permissions:', error);
        }
    }
    async collectInheritedPermissions(user, workspaceId, allPermissions) {
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
                if (!role || !role.isActive || !role.parentRole)
                    continue;
                const inheritanceResult = await this.roleHierarchyService.getAllRolePermissions(role._id);
                for (const permission of inheritanceResult.permissions) {
                    const permissionSource = inheritanceResult.sources[permission];
                    if (permissionSource && permissionSource.source === 'inherited') {
                        const source = {
                            type: 'inherited',
                            roleId: permissionSource.roleId,
                            roleName: permissionSource.roleName,
                            inheritedFrom: role.name,
                            priority: this.PRIORITY_LEVELS.INHERITED_PERMISSION - permissionSource.level
                        };
                        this.addOrMergePermission(allPermissions, permission, true, source);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error collecting inherited permissions:', error);
        }
    }
    async collectLegacyPermissions(user, allPermissions) {
        if (!user.permissions || user.permissions.length === 0) {
            return;
        }
        for (const permission of user.permissions) {
            const source = {
                type: 'legacy',
                priority: this.PRIORITY_LEVELS.LEGACY_PERMISSION
            };
            this.addOrMergePermission(allPermissions, permission, true, source);
        }
    }
    applyExplicitDenials(user, allPermissions, conflicts) {
        if (!user.deniedPermissions || user.deniedPermissions.length === 0) {
            return;
        }
        for (const permission of user.deniedPermissions) {
            const existingPermission = allPermissions.get(permission);
            if (existingPermission && existingPermission.granted) {
                const conflict = {
                    type: 'explicit_deny_override',
                    permission,
                    conflictingSources: [
                        ...existingPermission.sources,
                        {
                            type: 'direct',
                            priority: this.PRIORITY_LEVELS.EXPLICIT_DENY
                        }
                    ],
                    resolution: 'deny_wins',
                    message: `Permission '${permission}' explicitly denied, overriding granted permissions`,
                    severity: 'medium'
                };
                conflicts.push(conflict);
                existingPermission.conflicts.push(conflict);
            }
            const denySource = {
                type: 'direct',
                priority: this.PRIORITY_LEVELS.EXPLICIT_DENY
            };
            this.addOrMergePermission(allPermissions, permission, false, denySource);
        }
    }
    resolvePermissionConflicts(allPermissions, conflicts) {
        for (const [permission, aggregatedPerm] of allPermissions) {
            if (aggregatedPerm.sources.length <= 1) {
                continue;
            }
            const grantingSources = aggregatedPerm.sources.filter(s => this.isGrantingSource(aggregatedPerm, s));
            const denyingSources = aggregatedPerm.sources.filter(s => !this.isGrantingSource(aggregatedPerm, s));
            if (grantingSources.length > 0 && denyingSources.length > 0) {
                const highestPrioritySource = aggregatedPerm.sources.reduce((highest, current) => current.priority > highest.priority ? current : highest);
                const conflict = {
                    type: 'role_conflict',
                    permission,
                    conflictingSources: aggregatedPerm.sources,
                    resolution: 'highest_priority',
                    message: `Permission '${permission}' has conflicting sources, resolved by highest priority`,
                    severity: 'low'
                };
                conflicts.push(conflict);
                aggregatedPerm.conflicts.push(conflict);
                aggregatedPerm.granted = this.isGrantingSource(aggregatedPerm, highestPrioritySource);
                aggregatedPerm.finalDecision = aggregatedPerm.granted ? 'allow' : 'deny';
            }
        }
    }
    async validatePermissionDependencies(permissions, dependencies) {
        try {
            const permissionDefs = await Permission_1.default.find({
                isActive: true,
                $or: [
                    { dependencies: { $exists: true, $ne: [] } },
                    { conflicts: { $exists: true, $ne: [] } }
                ]
            });
            const grantedPermissions = new Set(permissions.filter(p => p.granted).map(p => p.action));
            for (const permDef of permissionDefs) {
                if (!grantedPermissions.has(permDef.action)) {
                    continue;
                }
                const missingDependencies = permDef.dependencies.filter(dep => !grantedPermissions.has(dep));
                if (missingDependencies.length > 0) {
                    dependencies.push({
                        permission: permDef.action,
                        dependsOn: permDef.dependencies,
                        conflicts: permDef.conflicts,
                        satisfied: false,
                        missingSources: missingDependencies
                    });
                }
                const conflictingPermissions = permDef.conflicts.filter(conflict => grantedPermissions.has(conflict));
                if (conflictingPermissions.length > 0) {
                    dependencies.push({
                        permission: permDef.action,
                        dependsOn: permDef.dependencies,
                        conflicts: permDef.conflicts,
                        satisfied: false,
                        missingSources: conflictingPermissions
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error validating permission dependencies:', error);
        }
    }
    async generatePermissionSuggestions(user, permissions, conflicts) {
        const suggestions = [];
        try {
            const deniedPermissions = permissions.filter(p => !p.granted);
            for (const deniedPerm of deniedPermissions.slice(0, 5)) {
                const rolesWithPermission = await this.roleHierarchyService.getRolesWithPermission(deniedPerm.action);
                if (rolesWithPermission.length > 0) {
                    const roleNames = rolesWithPermission
                        .slice(0, 3)
                        .map(r => r.role.displayName)
                        .join(', ');
                    suggestions.push(`To get '${deniedPerm.action}' permission, consider assigning roles: ${roleNames}`);
                }
                if (user.deniedPermissions?.includes(deniedPerm.action)) {
                    suggestions.push(`Permission '${deniedPerm.action}' is explicitly denied and needs to be removed from denied list`);
                }
            }
            for (const conflict of conflicts.slice(0, 3)) {
                switch (conflict.type) {
                    case 'explicit_deny_override':
                        suggestions.push(`Remove '${conflict.permission}' from denied permissions to allow access`);
                        break;
                    case 'role_conflict':
                        suggestions.push(`Resolve role conflict for '${conflict.permission}' by adjusting role hierarchy`);
                        break;
                    case 'dependency_missing':
                        suggestions.push(`Grant required dependencies for '${conflict.permission}' to enable access`);
                        break;
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error generating permission suggestions:', error);
        }
        return suggestions;
    }
    addOrMergePermission(allPermissions, permission, granted, source) {
        const existing = allPermissions.get(permission);
        if (existing) {
            existing.sources.push(source);
            const highestPrioritySource = existing.sources.reduce((highest, current) => current.priority > highest.priority ? current : highest);
            existing.granted = this.isGrantingSource(existing, highestPrioritySource);
            existing.finalDecision = existing.granted ? 'allow' : 'deny';
            if (source.conditions) {
                existing.conditions = { ...existing.conditions, ...source.conditions };
                existing.finalDecision = 'conditional';
            }
        }
        else {
            const aggregatedPerm = {
                action: permission,
                granted,
                sources: [source],
                conflicts: [],
                finalDecision: granted ? 'allow' : 'deny',
                conditions: source.conditions
            };
            if (source.conditions) {
                aggregatedPerm.finalDecision = 'conditional';
            }
            allPermissions.set(permission, aggregatedPerm);
        }
    }
    isGrantingSource(permission, source) {
        if (source.priority === this.PRIORITY_LEVELS.EXPLICIT_DENY) {
            return false;
        }
        if (source.type === 'role' && source.roleId) {
            return true;
        }
        return true;
    }
    async checkAggregatedPermission(user, action, workspaceId) {
        try {
            const cached = await this.cacheManager.getCachedPermissionCheck(user._id, action, workspaceId);
            if (cached && typeof cached === "object" && Object.keys(cached).length > 0) {
                return {
                    allowed: cached.allowed,
                    source: cached.source,
                    conflicts: [],
                    conditions: undefined
                };
            }
            const aggregationResult = await this.aggregateUserPermissions(user, workspaceId);
            const permission = aggregationResult.permissions.find(p => p.action === action);
            if (!permission) {
                return {
                    allowed: false,
                    source: 'none',
                    conflicts: [],
                    conditions: undefined
                };
            }
            await this.cacheManager.cachePermissionCheck(user._id, action, permission.granted, permission.sources[0]?.type || 'unknown', workspaceId);
            return {
                allowed: permission.granted,
                source: permission.sources[0]?.type || 'unknown',
                conflicts: permission.conflicts,
                conditions: permission.conditions
            };
        }
        catch (error) {
            logger_1.default.error('Error checking aggregated permission:', error);
            return {
                allowed: false,
                source: 'error',
                conflicts: [],
                conditions: undefined
            };
        }
    }
}
exports.default = PermissionAggregationService;
//# sourceMappingURL=PermissionAggregationService.js.map