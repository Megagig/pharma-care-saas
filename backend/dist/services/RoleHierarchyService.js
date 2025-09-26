"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Role_1 = __importDefault(require("../models/Role"));
const RolePermission_1 = __importDefault(require("../models/RolePermission"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoleHierarchyService {
    constructor() {
        this.MAX_HIERARCHY_DEPTH = 10;
        this.CACHE_TTL = 5 * 60 * 1000;
        this.hierarchyCache = new Map();
    }
    static getInstance() {
        if (!RoleHierarchyService.instance) {
            RoleHierarchyService.instance = new RoleHierarchyService();
        }
        return RoleHierarchyService.instance;
    }
    async getAllRolePermissions(roleId, visited = new Set()) {
        try {
            const cacheKey = `role_permissions_${roleId.toString()}`;
            const cached = this.hierarchyCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
                return cached.data;
            }
            if (visited.has(roleId.toString())) {
                return {
                    permissions: [],
                    sources: {},
                    conflicts: [{
                            type: 'circular_dependency',
                            roleId,
                            message: 'Circular dependency detected in role hierarchy',
                            severity: 'critical'
                        }]
                };
            }
            visited.add(roleId.toString());
            const role = await Role_1.default.findById(roleId);
            if (!role || !role.isActive) {
                return {
                    permissions: [],
                    sources: {},
                    conflicts: []
                };
            }
            const allPermissions = new Set();
            const sources = {};
            const conflicts = [];
            const rolePermissions = await RolePermission_1.default.find({
                roleId: role._id,
                isActive: true,
                granted: true
            });
            rolePermissions.forEach(rp => {
                allPermissions.add(rp.permissionAction);
                sources[rp.permissionAction] = {
                    roleId: role._id,
                    roleName: role.name,
                    source: 'direct',
                    level: role.hierarchyLevel
                };
            });
            if (role.permissions && role.permissions.length > 0) {
                role.permissions.forEach(permission => {
                    allPermissions.add(permission);
                    if (!sources[permission]) {
                        sources[permission] = {
                            roleId: role._id,
                            roleName: role.name,
                            source: 'direct',
                            level: role.hierarchyLevel
                        };
                    }
                });
            }
            if (role.parentRole) {
                const parentResult = await this.getAllRolePermissions(role.parentRole, visited);
                conflicts.push(...parentResult.conflicts);
                parentResult.permissions.forEach(permission => {
                    allPermissions.add(permission);
                    if (sources[permission] && sources[permission].source === 'direct') {
                        conflicts.push({
                            type: 'permission_conflict',
                            roleId: role._id,
                            conflictingRoleId: parentResult.sources[permission]?.roleId,
                            message: `Permission '${permission}' defined in both role and parent role`,
                            severity: 'warning'
                        });
                    }
                    else if (!sources[permission]) {
                        const sourceRoleId = parentResult.sources[permission]?.roleId || role.parentRole;
                        sources[permission] = {
                            roleId: sourceRoleId,
                            roleName: parentResult.sources[permission]?.roleName || 'Unknown',
                            source: 'inherited',
                            level: parentResult.sources[permission]?.level || role.hierarchyLevel + 1
                        };
                    }
                });
            }
            const result = {
                permissions: Array.from(allPermissions),
                sources,
                conflicts
            };
            this.hierarchyCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error getting all role permissions:', error);
            return {
                permissions: [],
                sources: {},
                conflicts: [{
                        type: 'invalid_parent',
                        roleId,
                        message: 'Error retrieving role permissions',
                        severity: 'error'
                    }]
            };
        }
    }
    async detectCircularDependency(roleId, parentRoleId) {
        try {
            const visited = new Set();
            let currentRoleId = parentRoleId;
            while (currentRoleId) {
                const currentRoleIdStr = currentRoleId.toString();
                if (currentRoleIdStr === roleId.toString()) {
                    return true;
                }
                if (visited.has(currentRoleIdStr)) {
                    return true;
                }
                visited.add(currentRoleIdStr);
                const currentRole = await Role_1.default.findById(currentRoleId);
                if (!currentRole) {
                    break;
                }
                currentRoleId = currentRole.parentRole;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error('Error detecting circular dependency:', error);
            return true;
        }
    }
    async calculateHierarchyLevel(roleId) {
        try {
            const role = await Role_1.default.findById(roleId);
            if (!role) {
                return 0;
            }
            if (!role.parentRole) {
                return 0;
            }
            const parentLevel = await this.calculateHierarchyLevel(role.parentRole);
            return parentLevel + 1;
        }
        catch (error) {
            logger_1.default.error('Error calculating hierarchy level:', error);
            return 0;
        }
    }
    async validateRoleHierarchy(roleId, parentRoleId) {
        const conflicts = [];
        try {
            const role = await Role_1.default.findById(roleId);
            if (!role) {
                conflicts.push({
                    type: 'invalid_parent',
                    roleId,
                    message: 'Role not found',
                    severity: 'error'
                });
                return conflicts;
            }
            if (parentRoleId) {
                const parentRole = await Role_1.default.findById(parentRoleId);
                if (!parentRole) {
                    conflicts.push({
                        type: 'invalid_parent',
                        roleId,
                        conflictingRoleId: parentRoleId,
                        message: 'Parent role not found',
                        severity: 'error'
                    });
                    return conflicts;
                }
                if (!parentRole.isActive) {
                    conflicts.push({
                        type: 'invalid_parent',
                        roleId,
                        conflictingRoleId: parentRoleId,
                        message: 'Parent role is inactive',
                        severity: 'error'
                    });
                }
                const hasCircularDependency = await this.detectCircularDependency(roleId, parentRoleId);
                if (hasCircularDependency) {
                    conflicts.push({
                        type: 'circular_dependency',
                        roleId,
                        conflictingRoleId: parentRoleId,
                        message: 'Circular dependency detected',
                        severity: 'critical'
                    });
                }
                const hierarchyLevel = await this.calculateHierarchyLevel(parentRoleId);
                if (hierarchyLevel >= this.MAX_HIERARCHY_DEPTH) {
                    conflicts.push({
                        type: 'hierarchy_depth',
                        roleId,
                        conflictingRoleId: parentRoleId,
                        message: `Hierarchy depth exceeds maximum of ${this.MAX_HIERARCHY_DEPTH}`,
                        severity: 'error'
                    });
                }
            }
            return conflicts;
        }
        catch (error) {
            logger_1.default.error('Error validating role hierarchy:', error);
            conflicts.push({
                type: 'invalid_parent',
                roleId,
                message: 'Error validating role hierarchy',
                severity: 'error'
            });
            return conflicts;
        }
    }
    async getRoleHierarchyTree(rootRoleId) {
        try {
            let rootRoles;
            if (rootRoleId) {
                const rootRole = await Role_1.default.findById(rootRoleId);
                rootRoles = rootRole ? [rootRole] : [];
            }
            else {
                rootRoles = await Role_1.default.find({
                    parentRole: { $exists: false },
                    isActive: true
                }).sort({ name: 1 });
            }
            const hierarchyNodes = [];
            for (const rootRole of rootRoles) {
                const node = await this.buildHierarchyNode(rootRole);
                hierarchyNodes.push(node);
            }
            return hierarchyNodes;
        }
        catch (error) {
            logger_1.default.error('Error getting role hierarchy tree:', error);
            return [];
        }
    }
    async buildHierarchyNode(role, visited = new Set()) {
        if (visited.has(role._id.toString())) {
            return {
                role,
                children: [],
                permissions: [],
                inheritedPermissions: [],
                level: role.hierarchyLevel
            };
        }
        visited.add(role._id.toString());
        const permissionResult = await this.getAllRolePermissions(role._id, new Set());
        const directPermissions = permissionResult.permissions.filter(perm => permissionResult.sources[perm]?.source === 'direct');
        const inheritedPermissions = permissionResult.permissions.filter(perm => permissionResult.sources[perm]?.source === 'inherited');
        const childRoles = await Role_1.default.find({
            parentRole: role._id,
            isActive: true
        }).sort({ name: 1 });
        const children = [];
        for (const childRole of childRoles) {
            const childNode = await this.buildHierarchyNode(childRole, visited);
            children.push(childNode);
        }
        return {
            role,
            children,
            permissions: directPermissions,
            inheritedPermissions,
            level: role.hierarchyLevel
        };
    }
    async resolveRoleConflicts(conflicts) {
        const resolutions = [];
        for (const conflict of conflicts) {
            const suggestions = [];
            switch (conflict.type) {
                case 'circular_dependency':
                    suggestions.push('Remove the parent role assignment that creates the cycle');
                    suggestions.push('Restructure the role hierarchy to eliminate circular references');
                    suggestions.push('Consider creating a new intermediate role to break the cycle');
                    break;
                case 'permission_conflict':
                    suggestions.push('Remove the duplicate permission from one of the roles');
                    suggestions.push('Use explicit permission denial to override inherited permissions');
                    suggestions.push('Restructure the role hierarchy to avoid permission conflicts');
                    break;
                case 'hierarchy_depth':
                    suggestions.push(`Flatten the role hierarchy to stay within ${this.MAX_HIERARCHY_DEPTH} levels`);
                    suggestions.push('Combine similar roles to reduce hierarchy depth');
                    suggestions.push('Create parallel role structures instead of deep nesting');
                    break;
                case 'invalid_parent':
                    suggestions.push('Select a valid, active parent role');
                    suggestions.push('Create the parent role if it doesn\'t exist');
                    suggestions.push('Remove the parent role assignment if not needed');
                    break;
            }
            resolutions.push({
                conflict,
                resolutions: suggestions
            });
        }
        return resolutions;
    }
    async getRoleInheritancePath(roleId) {
        try {
            const path = [];
            let currentRoleId = roleId;
            const visited = new Set();
            while (currentRoleId && !visited.has(currentRoleId.toString())) {
                visited.add(currentRoleId.toString());
                const role = await Role_1.default.findById(currentRoleId);
                if (!role) {
                    break;
                }
                path.unshift(role);
                currentRoleId = role.parentRole;
            }
            return path;
        }
        catch (error) {
            logger_1.default.error('Error getting role inheritance path:', error);
            return [];
        }
    }
    async updateHierarchyLevels(startingRoleId) {
        try {
            const role = await Role_1.default.findById(startingRoleId);
            if (!role) {
                return;
            }
            const newLevel = role.parentRole
                ? await this.calculateHierarchyLevel(role.parentRole) + 1
                : 0;
            await Role_1.default.findByIdAndUpdate(startingRoleId, {
                hierarchyLevel: newLevel
            });
            const childRoles = await Role_1.default.find({
                parentRole: startingRoleId,
                isActive: true
            });
            for (const childRole of childRoles) {
                await this.updateHierarchyLevels(childRole._id);
            }
            this.clearHierarchyCache(startingRoleId);
        }
        catch (error) {
            logger_1.default.error('Error updating hierarchy levels:', error);
        }
    }
    clearHierarchyCache(roleId) {
        if (roleId) {
            const cacheKey = `role_permissions_${roleId.toString()}`;
            this.hierarchyCache.delete(cacheKey);
        }
        else {
            this.hierarchyCache.clear();
        }
    }
    async getRolesWithPermission(permission) {
        try {
            const rolesWithPermission = [];
            const directRolePermissions = await RolePermission_1.default.find({
                permissionAction: permission,
                granted: true,
                isActive: true
            }).populate('roleId');
            for (const rp of directRolePermissions) {
                const role = rp.roleId;
                if (role && role.isActive) {
                    rolesWithPermission.push({
                        role,
                        source: 'direct'
                    });
                }
            }
            const rolesWithLegacyPermission = await Role_1.default.find({
                permissions: permission,
                isActive: true
            });
            for (const role of rolesWithLegacyPermission) {
                const alreadyAdded = rolesWithPermission.some(r => r.role._id.equals(role._id));
                if (!alreadyAdded) {
                    rolesWithPermission.push({
                        role,
                        source: 'direct'
                    });
                }
            }
            const allRoles = await Role_1.default.find({ isActive: true });
            for (const role of allRoles) {
                const alreadyAdded = rolesWithPermission.some(r => r.role._id.equals(role._id));
                if (!alreadyAdded) {
                    const permissionResult = await this.getAllRolePermissions(role._id);
                    if (permissionResult.permissions.includes(permission)) {
                        const source = permissionResult.sources[permission];
                        if (source && source.source === 'inherited') {
                            const inheritedFromRole = await Role_1.default.findById(source.roleId);
                            rolesWithPermission.push({
                                role,
                                source: 'inherited',
                                inheritedFrom: inheritedFromRole || undefined
                            });
                        }
                    }
                }
            }
            return rolesWithPermission;
        }
        catch (error) {
            logger_1.default.error('Error getting roles with permission:', error);
            return [];
        }
    }
}
exports.default = RoleHierarchyService;
//# sourceMappingURL=RoleHierarchyService.js.map