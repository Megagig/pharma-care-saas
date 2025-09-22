"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoleController = exports.UserRoleController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const Permission_1 = __importDefault(require("../models/Permission"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const RoleHierarchyService_1 = __importDefault(require("../services/RoleHierarchyService"));
const logger_1 = __importDefault(require("../utils/logger"));
class UserRoleController {
    constructor() {
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
    }
    async assignUserRoles(req, res) {
        try {
            const { id } = req.params;
            const { roleIds, workspaceId, isTemporary = false, expiresAt, assignmentReason, replaceExisting = false } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Role IDs array is required and cannot be empty',
                });
            }
            const user = await User_1.default.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const roles = await Role_1.default.find({
                _id: { $in: roleIds },
                isActive: true
            });
            if (roles.length !== roleIds.length) {
                const foundRoleIds = roles.map(r => r._id.toString());
                const missingRoleIds = roleIds.filter(id => !foundRoleIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some roles not found or inactive',
                    missingRoleIds,
                });
            }
            if (workspaceId) {
                const workspace = await mongoose_1.default.model('Workplace').findById(workspaceId);
                if (!workspace) {
                    return res.status(404).json({
                        success: false,
                        message: 'Workspace not found',
                    });
                }
            }
            if (isTemporary) {
                if (!expiresAt) {
                    return res.status(400).json({
                        success: false,
                        message: 'Expiration date is required for temporary assignments',
                    });
                }
                const expirationDate = new Date(expiresAt);
                if (expirationDate <= new Date()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Expiration date must be in the future',
                    });
                }
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    if (replaceExisting) {
                        const existingQuery = { userId: user._id, isActive: true };
                        if (workspaceId) {
                            existingQuery.workspaceId = workspaceId;
                        }
                        await UserRole_1.default.updateMany(existingQuery, {
                            isActive: false,
                            revokedBy: req.user._id,
                            revokedAt: new Date(),
                            revocationReason: 'Replaced by new role assignment',
                            lastModifiedBy: req.user._id
                        }, { session });
                    }
                    const userRoleAssignments = [];
                    for (const roleId of roleIds) {
                        const existingAssignment = await UserRole_1.default.findOne({
                            userId: user._id,
                            roleId,
                            workspaceId: workspaceId || { $exists: false },
                            isActive: true
                        });
                        if (existingAssignment && !replaceExisting) {
                            continue;
                        }
                        const userRole = new UserRole_1.default({
                            userId: user._id,
                            roleId,
                            workspaceId: workspaceId || undefined,
                            isTemporary,
                            expiresAt: isTemporary ? new Date(expiresAt) : undefined,
                            assignmentReason,
                            assignedBy: req.user._id,
                            lastModifiedBy: req.user._id,
                            isActive: true
                        });
                        await userRole.save({ session });
                        userRoleAssignments.push(userRole);
                    }
                    const currentAssignedRoles = await UserRole_1.default.find({
                        userId: user._id,
                        isActive: true
                    }).distinct('roleId');
                    await User_1.default.findByIdAndUpdate(user._id, {
                        assignedRoles: currentAssignedRoles,
                        roleLastModifiedBy: req.user._id,
                        roleLastModifiedAt: new Date()
                    }, { session });
                });
                await this.dynamicPermissionService.invalidateUserCache(user._id, workspaceId);
                const updatedAssignments = await UserRole_1.default.find({
                    userId: user._id,
                    isActive: true
                }).populate('roleId', 'name displayName category hierarchyLevel');
                logger_1.default.info('User roles assigned successfully', {
                    userId: user._id,
                    roleIds,
                    assignedBy: req.user._id,
                    workspaceId: workspaceId || null,
                    isTemporary,
                });
                res.json({
                    success: true,
                    message: 'User roles assigned successfully',
                    data: {
                        userId: user._id,
                        assignedRoles: updatedAssignments,
                        totalActiveRoles: updatedAssignments.length
                    },
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error assigning user roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error assigning user roles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async revokeUserRole(req, res) {
        try {
            const { id, roleId } = req.params;
            const { workspaceId, revocationReason } = req.body;
            if (!id || !roleId || !mongoose_1.default.Types.ObjectId.isValid(id) || !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or role ID format',
                });
            }
            const query = {
                userId: id,
                roleId,
                isActive: true
            };
            if (workspaceId) {
                query.workspaceId = workspaceId;
            }
            const userRole = await UserRole_1.default.findOne(query);
            if (!userRole) {
                return res.status(404).json({
                    success: false,
                    message: 'User role assignment not found',
                });
            }
            userRole.isActive = false;
            userRole.revokedBy = req.user._id;
            userRole.revokedAt = new Date();
            userRole.lastModifiedBy = req.user._id;
            if (revocationReason) {
                userRole.revocationReason = revocationReason;
            }
            await userRole.save();
            const currentAssignedRoles = await UserRole_1.default.find({
                userId: id,
                isActive: true
            }).distinct('roleId');
            await User_1.default.findByIdAndUpdate(id, {
                assignedRoles: currentAssignedRoles,
                roleLastModifiedBy: req.user._id,
                roleLastModifiedAt: new Date()
            });
            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(id), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
            const role = await Role_1.default.findById(roleId).select('name displayName category');
            logger_1.default.info('User role revoked successfully', {
                userId: id,
                roleId,
                revokedBy: req.user._id,
                workspaceId: workspaceId || null,
                reason: revocationReason || 'No reason provided',
            });
            res.json({
                success: true,
                message: 'User role revoked successfully',
                data: {
                    userId: id,
                    revokedRole: role,
                    revokedAt: userRole.revokedAt,
                    revokedBy: req.user._id,
                    reason: revocationReason || 'No reason provided'
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error revoking user role:', error);
            res.status(500).json({
                success: false,
                message: 'Error revoking user role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async updateUserPermissions(req, res) {
        try {
            const { id } = req.params;
            const { directPermissions = [], deniedPermissions = [], replaceExisting = true } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const allPermissions = [...directPermissions, ...deniedPermissions];
            if (allPermissions.length > 0) {
                const validPermissions = await Permission_1.default.find({
                    action: { $in: allPermissions },
                    isActive: true
                });
                const validPermissionActions = validPermissions.map(p => p.action);
                const invalidPermissions = allPermissions.filter(p => !validPermissionActions.includes(p));
                if (invalidPermissions.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid permissions found',
                        invalidPermissions,
                    });
                }
            }
            const conflictingPermissions = directPermissions.filter((p) => deniedPermissions.includes(p));
            if (conflictingPermissions.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissions cannot be both granted and denied',
                    conflictingPermissions,
                });
            }
            const updateData = {
                roleLastModifiedBy: req.user._id,
                roleLastModifiedAt: new Date()
            };
            if (replaceExisting) {
                updateData.directPermissions = directPermissions;
                updateData.deniedPermissions = deniedPermissions;
            }
            else {
                const existingDirectPermissions = user.directPermissions || [];
                const existingDeniedPermissions = user.deniedPermissions || [];
                updateData.directPermissions = [
                    ...new Set([...existingDirectPermissions, ...directPermissions])
                ];
                updateData.deniedPermissions = [
                    ...new Set([...existingDeniedPermissions, ...deniedPermissions])
                ];
            }
            const updatedUser = await User_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('directPermissions deniedPermissions roleLastModifiedBy roleLastModifiedAt');
            await this.dynamicPermissionService.invalidateUserCache(user._id);
            logger_1.default.info('User permissions updated successfully', {
                userId: id,
                directPermissions,
                deniedPermissions,
                updatedBy: req.user._id,
                replaceExisting,
            });
            res.json({
                success: true,
                message: 'User permissions updated successfully',
                data: {
                    userId: id,
                    directPermissions: updatedUser.directPermissions,
                    deniedPermissions: updatedUser.deniedPermissions,
                    lastModifiedBy: updatedUser.roleLastModifiedBy,
                    lastModifiedAt: updatedUser.roleLastModifiedAt
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error updating user permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getUserEffectivePermissions(req, res) {
        try {
            const { id } = req.params;
            const { workspaceId, includeInherited = true, includeRoleDetails = false } = req.query;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const workspaceContext = {};
            if (workspaceId) {
                const workspace = await mongoose_1.default.model('Workplace').findById(workspaceId);
                if (workspace) {
                    workspaceContext.workspace = workspace;
                }
            }
            const permissionResult = await this.dynamicPermissionService.resolveUserPermissions(user, workspaceContext);
            const userRoles = await UserRole_1.default.find({
                userId: user._id,
                isActive: true,
                ...(workspaceId && { workspaceId })
            }).populate('roleId', 'name displayName category hierarchyLevel permissions');
            let roleHierarchyDetails = {};
            if (includeRoleDetails === 'true') {
                for (const userRole of userRoles) {
                    const role = userRole.roleId;
                    if (role) {
                        const hierarchyPath = await this.roleHierarchyService.getRoleInheritancePath(role._id);
                        const allRolePermissions = await this.roleHierarchyService.getAllRolePermissions(role._id);
                        roleHierarchyDetails[role._id.toString()] = {
                            hierarchyPath: hierarchyPath.map(r => ({
                                id: r._id,
                                name: r.name,
                                displayName: r.displayName,
                                level: r.hierarchyLevel
                            })),
                            allPermissions: allRolePermissions.permissions,
                            permissionSources: allRolePermissions.sources,
                            conflicts: allRolePermissions.conflicts
                        };
                    }
                }
            }
            const permissionsBySource = {
                direct: [],
                role: [],
                inherited: [],
                legacy: []
            };
            Object.entries(permissionResult.sources).forEach(([permission, source]) => {
                const sourceType = typeof source === 'string' ? source : source?.source || 'unknown';
                if (permissionsBySource[sourceType]) {
                    permissionsBySource[sourceType].push(permission);
                }
                else {
                    permissionsBySource.other = permissionsBySource.other || [];
                    permissionsBySource.other.push(permission);
                }
            });
            const permissionDetails = await Permission_1.default.find({
                action: { $in: permissionResult.permissions },
                isActive: true
            }).select('action displayName category riskLevel requiredSubscriptionTier');
            const permissionDetailsMap = permissionDetails.reduce((acc, perm) => {
                acc[perm.action] = {
                    displayName: perm.displayName,
                    category: perm.category,
                    riskLevel: perm.riskLevel,
                    requiredSubscriptionTier: perm.requiredSubscriptionTier
                };
                return acc;
            }, {});
            const statistics = {
                totalPermissions: permissionResult.permissions.length,
                deniedPermissions: permissionResult.deniedPermissions.length,
                directPermissions: permissionsBySource.direct?.length || 0,
                roleBasedPermissions: permissionsBySource.role?.length || 0,
                inheritedPermissions: permissionsBySource.inherited?.length || 0,
                legacyPermissions: permissionsBySource.legacy?.length || 0,
                activeRoles: userRoles.length,
                riskLevelDistribution: permissionDetails.reduce((acc, perm) => {
                    acc[perm.riskLevel] = (acc[perm.riskLevel] || 0) + 1;
                    return acc;
                }, {})
            };
            res.json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    },
                    permissions: {
                        effective: permissionResult.permissions,
                        denied: permissionResult.deniedPermissions,
                        sources: permissionResult.sources,
                        bySource: permissionsBySource,
                        details: permissionDetailsMap
                    },
                    roles: userRoles.map(ur => ({
                        assignment: {
                            id: ur._id,
                            isTemporary: ur.isTemporary,
                            expiresAt: ur.expiresAt,
                            assignedBy: ur.assignedBy,
                            assignedAt: ur.assignedAt
                        },
                        role: ur.roleId
                    })),
                    ...(includeRoleDetails === 'true' && { roleHierarchyDetails }),
                    statistics,
                    workspaceContext: workspaceId ? { workspaceId } : null
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching user effective permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user effective permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async bulkUpdateUsers(req, res) {
        try {
            const { updates, dryRun = false } = req.body;
            if (!updates || !Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Updates array is required and cannot be empty',
                });
            }
            if (updates.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 100 users can be updated in a single request',
                });
            }
            const validationResults = [];
            for (const update of updates) {
                const { userId, roleIds, directPermissions, deniedPermissions } = update;
                const errors = [];
                const warnings = [];
                if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    errors.push('Invalid user ID format');
                }
                else {
                    const user = await User_1.default.findById(userId);
                    if (!user) {
                        errors.push('User not found');
                    }
                    else if (user.status !== 'active') {
                        warnings.push(`User status is ${user.status}`);
                    }
                }
                if (roleIds && Array.isArray(roleIds)) {
                    const validRoles = await Role_1.default.find({
                        _id: { $in: roleIds },
                        isActive: true
                    });
                    if (validRoles.length !== roleIds.length) {
                        const foundRoleIds = validRoles.map(r => r._id.toString());
                        const missingRoleIds = roleIds.filter(id => !foundRoleIds.includes(id));
                        errors.push(`Invalid or inactive roles: ${missingRoleIds.join(', ')}`);
                    }
                }
                const allPermissions = [
                    ...(directPermissions || []),
                    ...(deniedPermissions || [])
                ];
                if (allPermissions.length > 0) {
                    const validPermissions = await Permission_1.default.find({
                        action: { $in: allPermissions },
                        isActive: true
                    });
                    const validPermissionActions = validPermissions.map(p => p.action);
                    const invalidPermissions = allPermissions.filter(p => !validPermissionActions.includes(p));
                    if (invalidPermissions.length > 0) {
                        errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
                    }
                }
                if (directPermissions && deniedPermissions) {
                    const conflicts = directPermissions.filter((p) => deniedPermissions.includes(p));
                    if (conflicts.length > 0) {
                        errors.push(`Conflicting permissions: ${conflicts.join(', ')}`);
                    }
                }
                validationResults.push({
                    userId,
                    isValid: errors.length === 0,
                    errors,
                    warnings
                });
            }
            const validUpdates = validationResults.filter(r => r.isValid);
            const invalidUpdates = validationResults.filter(r => !r.isValid);
            if (dryRun) {
                return res.json({
                    success: true,
                    message: 'Dry run completed',
                    data: {
                        totalUpdates: updates.length,
                        validUpdates: validUpdates.length,
                        invalidUpdates: invalidUpdates.length,
                        validationResults,
                        wouldProceed: invalidUpdates.length === 0
                    },
                });
            }
            if (invalidUpdates.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed for some updates',
                    data: {
                        invalidUpdates,
                        totalErrors: invalidUpdates.reduce((sum, u) => sum + u.errors.length, 0)
                    },
                });
            }
            const results = [];
            for (const update of updates) {
                try {
                    const { userId, roleIds, directPermissions, deniedPermissions, workspaceId } = update;
                    const changes = {};
                    const session = await mongoose_1.default.startSession();
                    try {
                        await session.withTransaction(async () => {
                            if (roleIds) {
                                await UserRole_1.default.updateMany({
                                    userId,
                                    isActive: true,
                                    ...(workspaceId && { workspaceId })
                                }, {
                                    isActive: false,
                                    revokedBy: req.user._id,
                                    revokedAt: new Date(),
                                    revocationReason: 'Bulk update replacement',
                                    lastModifiedBy: req.user._id
                                }, { session });
                                for (const roleId of roleIds) {
                                    const userRole = new UserRole_1.default({
                                        userId,
                                        roleId,
                                        workspaceId: workspaceId || undefined,
                                        assignedBy: req.user._id,
                                        lastModifiedBy: req.user._id,
                                        isActive: true
                                    });
                                    await userRole.save({ session });
                                }
                                changes.roleIds = roleIds;
                            }
                            if (directPermissions !== undefined || deniedPermissions !== undefined) {
                                const updateData = {
                                    roleLastModifiedBy: req.user._id,
                                    roleLastModifiedAt: new Date()
                                };
                                if (directPermissions !== undefined) {
                                    updateData.directPermissions = directPermissions;
                                    changes.directPermissions = directPermissions;
                                }
                                if (deniedPermissions !== undefined) {
                                    updateData.deniedPermissions = deniedPermissions;
                                    changes.deniedPermissions = deniedPermissions;
                                }
                                await User_1.default.findByIdAndUpdate(userId, updateData, { session });
                            }
                            if (roleIds) {
                                const currentAssignedRoles = await UserRole_1.default.find({
                                    userId,
                                    isActive: true
                                }).distinct('roleId');
                                await User_1.default.findByIdAndUpdate(userId, { assignedRoles: currentAssignedRoles }, { session });
                            }
                        });
                        await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
                        results.push({
                            userId,
                            success: true,
                            changes: changes
                        });
                    }
                    finally {
                        await session.endSession();
                    }
                }
                catch (error) {
                    results.push({
                        userId: update.userId,
                        success: false,
                        error: error.message,
                        changes: {}
                    });
                }
            }
            const successfulUpdates = results.filter(r => r.success);
            const failedUpdates = results.filter(r => !r.success);
            logger_1.default.info('Bulk user update completed', {
                totalUpdates: updates.length,
                successful: successfulUpdates.length,
                failed: failedUpdates.length,
                updatedBy: req.user._id,
            });
            res.json({
                success: failedUpdates.length === 0,
                message: `Bulk update completed. ${successfulUpdates.length} successful, ${failedUpdates.length} failed.`,
                data: {
                    totalUpdates: updates.length,
                    successfulUpdates: successfulUpdates.length,
                    failedUpdates: failedUpdates.length,
                    results,
                    summary: {
                        usersUpdated: successfulUpdates.length,
                        rolesAssigned: successfulUpdates.reduce((sum, r) => sum + (r.changes.roleIds?.length || 0), 0),
                        permissionsUpdated: successfulUpdates.filter(r => r.changes.directPermissions || r.changes.deniedPermissions).length
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in bulk user update:', error);
            res.status(500).json({
                success: false,
                message: 'Error in bulk user update',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
}
exports.UserRoleController = UserRoleController;
exports.userRoleController = new UserRoleController();
//# sourceMappingURL=userRoleController.js.map