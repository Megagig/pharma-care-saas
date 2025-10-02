"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = exports.RoleController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Role_1 = __importDefault(require("../models/Role"));
const Permission_1 = __importDefault(require("../models/Permission"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const RolePermission_1 = __importDefault(require("../models/RolePermission"));
const User_1 = __importDefault(require("../models/User"));
const RoleHierarchyService_1 = __importDefault(require("../services/RoleHierarchyService"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoleController {
    constructor() {
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
    }
    async createRole(req, res) {
        try {
            const { name, displayName, description, category = 'custom', parentRoleId, permissions = [], workspaceId, isDefault = false } = req.body;
            if (!name || !displayName || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, display name, and description are required',
                });
            }
            const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
            const existingRole = await Role_1.default.findOne({ name: sanitizedName });
            if (existingRole) {
                return res.status(409).json({
                    success: false,
                    message: 'Role with this name already exists',
                });
            }
            let parentRole = null;
            if (parentRoleId) {
                parentRole = await Role_1.default.findById(parentRoleId);
                if (!parentRole) {
                    return res.status(404).json({
                        success: false,
                        message: 'Parent role not found',
                    });
                }
                if (!parentRole.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: 'Parent role is not active',
                    });
                }
                const hasCircularDependency = await this.roleHierarchyService.detectCircularDependency(new mongoose_1.default.Types.ObjectId(), parentRoleId);
                if (hasCircularDependency) {
                    return res.status(400).json({
                        success: false,
                        message: 'Creating this role would create a circular dependency',
                    });
                }
            }
            if (permissions.length > 0) {
                const validPermissions = await Permission_1.default.find({
                    action: { $in: permissions },
                    isActive: true
                });
                const validPermissionActions = validPermissions.map(p => p.action);
                const invalidPermissions = permissions.filter((p) => !validPermissionActions.includes(p));
                if (invalidPermissions.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid permissions found',
                        invalidPermissions,
                    });
                }
            }
            const hierarchyLevel = parentRole ? parentRole.hierarchyLevel + 1 : 0;
            const role = new Role_1.default({
                name: sanitizedName,
                displayName,
                description,
                category,
                parentRole: parentRoleId || undefined,
                hierarchyLevel,
                permissions,
                workspaceId: workspaceId || undefined,
                isDefault,
                isActive: true,
                isSystemRole: false,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id,
            });
            await role.save();
            if (parentRole) {
                await Role_1.default.findByIdAndUpdate(parentRoleId, { $addToSet: { childRoles: role._id } });
            }
            if (permissions.length > 0) {
                const rolePermissions = permissions.map((permission) => ({
                    roleId: role._id,
                    permissionAction: permission,
                    granted: true,
                    grantedBy: req.user._id,
                    lastModifiedBy: req.user._id,
                }));
                await RolePermission_1.default.insertMany(rolePermissions);
            }
            const populatedRole = await Role_1.default.findById(role._id)
                .populate('parentRole', 'name displayName')
                .populate('childRoles', 'name displayName')
                .populate('createdBy', 'firstName lastName')
                .populate('lastModifiedBy', 'firstName lastName');
            logger_1.default.info('Role created successfully', {
                roleId: role._id,
                roleName: role.name,
                createdBy: req.user._id,
                parentRoleId: parentRoleId || null,
            });
            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: populatedRole,
            });
        }
        catch (error) {
            logger_1.default.error('Error creating role:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getRoles(req, res) {
        try {
            const { page = 1, limit = 20, category, isActive, isSystemRole, workspaceId, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
            const query = {};
            if (category) {
                query.category = category;
            }
            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }
            if (isSystemRole !== undefined) {
                query.isSystemRole = isSystemRole === 'true';
            }
            if (workspaceId) {
                query.workspaceId = workspaceId;
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const [roles, total] = await Promise.all([
                Role_1.default.find(query)
                    .populate('parentRole', 'name displayName category')
                    .populate('childRoles', 'name displayName category')
                    .populate('createdBy', 'firstName lastName')
                    .populate('lastModifiedBy', 'firstName lastName')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                Role_1.default.countDocuments(query)
            ]);
            const rolesWithCounts = await Promise.all(roles.map(async (role) => {
                const [permissionCount, userCount] = await Promise.all([
                    RolePermission_1.default.countDocuments({
                        roleId: role._id,
                        granted: true,
                        isActive: true
                    }),
                    UserRole_1.default.countDocuments({
                        roleId: role._id,
                        isActive: true
                    })
                ]);
                return {
                    ...role.toObject(),
                    permissionCount,
                    userCount
                };
            }));
            res.json({
                success: true,
                data: {
                    roles: rolesWithCounts,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                    filters: {
                        category,
                        isActive,
                        isSystemRole,
                        workspaceId,
                        search
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching roles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getRoleById(req, res) {
        try {
            const { id } = req.params;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const role = await Role_1.default.findById(id)
                .populate('parentRole', 'name displayName category hierarchyLevel')
                .populate('childRoles', 'name displayName category hierarchyLevel')
                .populate('createdBy', 'firstName lastName')
                .populate('lastModifiedBy', 'firstName lastName');
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            const rolePermissions = await RolePermission_1.default.find({
                roleId: role._id,
                isActive: true
            }).populate('permissionAction');
            const userAssignments = await UserRole_1.default.find({
                roleId: role._id,
                isActive: true
            }).populate('userId', 'firstName lastName email role status');
            const hierarchyPath = await this.roleHierarchyService.getRoleInheritancePath(role._id);
            const allPermissions = await this.roleHierarchyService.getAllRolePermissions(role._id);
            res.json({
                success: true,
                data: {
                    role,
                    permissions: {
                        direct: rolePermissions,
                        all: allPermissions.permissions,
                        sources: allPermissions.sources,
                        conflicts: allPermissions.conflicts
                    },
                    userAssignments,
                    hierarchyPath,
                    statistics: {
                        directPermissionCount: rolePermissions.length,
                        totalPermissionCount: allPermissions.permissions.length,
                        userCount: userAssignments.length,
                        childRoleCount: role.childRoles.length
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching role:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { displayName, description, category, parentRoleId, permissions, isActive, isDefault } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const role = await Role_1.default.findById(id);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            if (role.isSystemRole) {
                return res.status(403).json({
                    success: false,
                    message: 'System roles cannot be modified',
                });
            }
            if (parentRoleId !== undefined) {
                if (parentRoleId && parentRoleId !== role.parentRole?.toString()) {
                    const newParentRole = await Role_1.default.findById(parentRoleId);
                    if (!newParentRole) {
                        return res.status(404).json({
                            success: false,
                            message: 'Parent role not found',
                        });
                    }
                    if (!newParentRole.isActive) {
                        return res.status(400).json({
                            success: false,
                            message: 'Parent role is not active',
                        });
                    }
                    const hasCircularDependency = await this.roleHierarchyService.detectCircularDependency(role._id, parentRoleId);
                    if (hasCircularDependency) {
                        return res.status(400).json({
                            success: false,
                            message: 'Changing parent would create a circular dependency',
                        });
                    }
                }
            }
            if (permissions && permissions.length > 0) {
                const validPermissions = await Permission_1.default.find({
                    action: { $in: permissions },
                    isActive: true
                });
                const validPermissionActions = validPermissions.map(p => p.action);
                const invalidPermissions = permissions.filter((p) => !validPermissionActions.includes(p));
                if (invalidPermissions.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid permissions found',
                        invalidPermissions,
                    });
                }
            }
            const oldParentRoleId = role.parentRole;
            const updateData = {
                lastModifiedBy: req.user._id,
            };
            if (displayName !== undefined)
                updateData.displayName = displayName;
            if (description !== undefined)
                updateData.description = description;
            if (category !== undefined)
                updateData.category = category;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            if (isDefault !== undefined)
                updateData.isDefault = isDefault;
            if (parentRoleId !== undefined) {
                updateData.parentRole = parentRoleId || undefined;
                if (parentRoleId) {
                    const newParentRole = await Role_1.default.findById(parentRoleId);
                    updateData.hierarchyLevel = newParentRole.hierarchyLevel + 1;
                }
                else {
                    updateData.hierarchyLevel = 0;
                }
            }
            if (permissions !== undefined) {
                updateData.permissions = permissions;
            }
            const updatedRole = await Role_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('parentRole', 'name displayName')
                .populate('childRoles', 'name displayName')
                .populate('createdBy', 'firstName lastName')
                .populate('lastModifiedBy', 'firstName lastName');
            if (parentRoleId !== undefined && parentRoleId !== oldParentRoleId?.toString()) {
                if (oldParentRoleId) {
                    await Role_1.default.findByIdAndUpdate(oldParentRoleId, { $pull: { childRoles: role._id } });
                }
                if (parentRoleId) {
                    await Role_1.default.findByIdAndUpdate(parentRoleId, { $addToSet: { childRoles: role._id } });
                }
                await this.roleHierarchyService.updateHierarchyLevels(role._id);
            }
            if (permissions !== undefined) {
                await RolePermission_1.default.updateMany({ roleId: role._id }, {
                    isActive: false,
                    lastModifiedBy: req.user._id
                });
                if (permissions.length > 0) {
                    const rolePermissions = permissions.map((permission) => ({
                        roleId: role._id,
                        permissionAction: permission,
                        granted: true,
                        grantedBy: req.user._id,
                        lastModifiedBy: req.user._id,
                    }));
                    await RolePermission_1.default.insertMany(rolePermissions);
                }
            }
            await this.invalidateRoleCaches(role._id, 'Role updated', req.user._id);
            logger_1.default.info('Role updated successfully', {
                roleId: role._id,
                roleName: role.name,
                updatedBy: req.user._id,
                changes: updateData,
            });
            res.json({
                success: true,
                message: 'Role updated successfully',
                data: updatedRole,
            });
        }
        catch (error) {
            logger_1.default.error('Error updating role:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async deleteRole(req, res) {
        try {
            const { id } = req.params;
            const { force = false } = req.query;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const role = await Role_1.default.findById(id);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            if (role.isSystemRole) {
                return res.status(403).json({
                    success: false,
                    message: 'System roles cannot be deleted',
                });
            }
            const childRoles = await Role_1.default.find({ parentRole: role._id, isActive: true });
            if (childRoles.length > 0 && !force) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete role with child roles. Remove child roles first or use force=true',
                    childRoles: childRoles.map(r => ({ id: r._id, name: r.name, displayName: r.displayName })),
                });
            }
            const userAssignments = await UserRole_1.default.find({ roleId: role._id, isActive: true });
            if (userAssignments.length > 0 && !force) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete role with active user assignments. Remove user assignments first or use force=true',
                    assignedUserCount: userAssignments.length,
                });
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    if (force && childRoles.length > 0) {
                        const newParentId = role.parentRole || null;
                        for (const childRole of childRoles) {
                            await Role_1.default.findByIdAndUpdate(childRole._id, {
                                parentRole: newParentId,
                                hierarchyLevel: newParentId ?
                                    (await Role_1.default.findById(newParentId)).hierarchyLevel + 1 : 0,
                                lastModifiedBy: req.user._id
                            }, { session });
                            if (newParentId) {
                                await Role_1.default.findByIdAndUpdate(newParentId, { $addToSet: { childRoles: childRole._id } }, { session });
                            }
                        }
                    }
                    if (force && userAssignments.length > 0) {
                        await UserRole_1.default.updateMany({ roleId: role._id, isActive: true }, {
                            isActive: false,
                            revokedBy: req.user._id,
                            revokedAt: new Date(),
                            lastModifiedBy: req.user._id
                        }, { session });
                        const userIds = userAssignments.map(ua => ua.userId);
                        await User_1.default.updateMany({ _id: { $in: userIds } }, {
                            $pull: { assignedRoles: role._id },
                            roleLastModifiedBy: req.user._id,
                            roleLastModifiedAt: new Date()
                        }, { session });
                    }
                    await RolePermission_1.default.updateMany({ roleId: role._id }, {
                        isActive: false,
                        lastModifiedBy: req.user._id
                    }, { session });
                    if (role.parentRole) {
                        await Role_1.default.findByIdAndUpdate(role.parentRole, { $pull: { childRoles: role._id } }, { session });
                    }
                    await Role_1.default.findByIdAndUpdate(role._id, {
                        isActive: false,
                        lastModifiedBy: req.user._id
                    }, { session });
                });
                await this.invalidateRoleCaches(role._id, 'Role deleted', req.user._id);
                logger_1.default.info('Role deleted successfully', {
                    roleId: role._id,
                    roleName: role.name,
                    deletedBy: req.user._id,
                    force: force === 'true',
                    childRolesCount: childRoles.length,
                    userAssignmentsCount: userAssignments.length,
                });
                res.json({
                    success: true,
                    message: 'Role deleted successfully',
                    data: {
                        deletedRole: {
                            id: role._id,
                            name: role.name,
                            displayName: role.displayName
                        },
                        affectedChildRoles: childRoles.length,
                        affectedUserAssignments: userAssignments.length
                    },
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error deleting role:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getRolePermissions(req, res) {
        try {
            const { id } = req.params;
            const { includeInherited = true } = req.query;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const role = await Role_1.default.findById(id);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            const directPermissions = await RolePermission_1.default.find({
                roleId: role._id,
                isActive: true
            }).populate({
                path: 'permissionAction',
                model: 'Permission',
                match: { action: { $exists: true } }
            });
            let result = {
                role: {
                    id: role._id,
                    name: role.name,
                    displayName: role.displayName,
                    hierarchyLevel: role.hierarchyLevel
                },
                directPermissions: directPermissions.map(rp => ({
                    action: rp.permissionAction,
                    granted: rp.granted,
                    grantedBy: rp.grantedBy,
                    grantedAt: rp.grantedAt
                }))
            };
            if (includeInherited === 'true') {
                const allPermissions = await this.roleHierarchyService.getAllRolePermissions(role._id);
                result.inheritedPermissions = allPermissions.permissions.filter(perm => allPermissions.sources[perm]?.source === 'inherited').map(perm => ({
                    action: perm,
                    source: allPermissions.sources[perm]
                }));
                result.allPermissions = allPermissions.permissions;
                result.permissionSources = allPermissions.sources;
                result.conflicts = allPermissions.conflicts;
            }
            if (role.permissions && role.permissions.length > 0) {
                result.legacyPermissions = role.permissions;
            }
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching role permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching role permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async invalidateRoleCaches(roleId, reason = 'Role modification', initiatedBy) {
        try {
            await this.dynamicPermissionService.invalidateRoleCache(roleId, reason, initiatedBy);
        }
        catch (error) {
            logger_1.default.error('Error invalidating role caches:', error);
        }
    }
}
exports.RoleController = RoleController;
exports.roleController = new RoleController();
//# sourceMappingURL=roleController.js.map