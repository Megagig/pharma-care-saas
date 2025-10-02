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
        try {
            this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
            this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        }
        catch (error) {
            logger_1.default.error('Error initializing UserRoleController services:', error);
            setTimeout(() => {
                try {
                    this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
                    this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
                    logger_1.default.info('UserRoleController services initialized successfully on retry');
                }
                catch (retryError) {
                    logger_1.default.error('Failed to initialize UserRoleController services on retry:', retryError);
                }
            }, 1000);
        }
    }
    async getUserRoles(req, res) {
        try {
            const { id } = req.params;
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
            const userRoles = await UserRole_1.default.find({
                userId: id,
                isActive: true,
            })
                .populate('roleId', 'name displayName description category isActive')
                .populate('assignedBy', 'firstName lastName')
                .sort({ assignedAt: -1 });
            const assignedRoleIds = user.assignedRoles || [];
            const assignedRoles = await Role_1.default.find({
                _id: { $in: assignedRoleIds },
                isActive: true,
            }).select('name displayName description category isActive');
            const allRoles = new Map();
            userRoles.forEach((ur) => {
                if (ur.roleId && typeof ur.roleId === 'object' && 'name' in ur.roleId) {
                    const role = ur.roleId;
                    allRoles.set(role._id.toString(), {
                        _id: role._id,
                        name: role.name,
                        displayName: role.displayName,
                        description: role.description,
                        category: role.category,
                        isActive: role.isActive,
                        assignmentDetails: {
                            assignedAt: ur.assignedAt,
                            assignedBy: ur.assignedBy,
                            isTemporary: ur.isTemporary,
                            expiresAt: ur.expiresAt,
                            assignmentReason: ur.assignmentReason,
                            workspaceId: ur.workspaceId,
                        },
                    });
                }
            });
            assignedRoles.forEach((role) => {
                if (!allRoles.has(role._id.toString())) {
                    allRoles.set(role._id.toString(), {
                        _id: role._id,
                        name: role.name,
                        displayName: role.displayName,
                        description: role.description,
                        category: role.category,
                        isActive: role.isActive,
                        assignmentDetails: {
                            assignedAt: user.roleLastModifiedAt || user.createdAt,
                            assignedBy: user.roleLastModifiedBy,
                            isTemporary: false,
                            source: 'legacy',
                        },
                    });
                }
            });
            const roles = Array.from(allRoles.values());
            res.json({
                success: true,
                data: {
                    userRoles: roles,
                    effectivePermissions: [],
                    roleHierarchy: [],
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching user roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user roles',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async assignUserRoles(req, res) {
        try {
            const { userIds, roleIds, workspaceId, isTemporary = false, expiresAt, assignmentReason, } = req.body;
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required and cannot be empty',
                });
            }
            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Role IDs array is required and cannot be empty',
                });
            }
            const users = await User_1.default.find({
                _id: { $in: userIds },
            });
            if (users.length !== userIds.length) {
                const foundUserIds = users.map((u) => u._id.toString());
                const missingUserIds = userIds.filter((id) => !foundUserIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some users not found',
                    missingUserIds,
                });
            }
            const roles = await Role_1.default.find({
                _id: { $in: roleIds },
                isActive: true,
            });
            if (roles.length !== roleIds.length) {
                const foundRoleIds = roles.map((r) => r._id.toString());
                const missingRoleIds = roleIds.filter((id) => !foundRoleIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some roles not found or inactive',
                    missingRoleIds,
                });
            }
            if (workspaceId) {
                const workspace = await mongoose_1.default
                    .model('Workplace')
                    .findById(workspaceId);
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
            const operationId = new mongoose_1.default.Types.ObjectId().toString();
            try {
                await session.withTransaction(async () => {
                    const results = [];
                    for (const userId of userIds) {
                        for (const roleId of roleIds) {
                            const existingAssignment = await UserRole_1.default.findOne({
                                userId,
                                roleId,
                                workspaceId: workspaceId || { $exists: false },
                                isActive: true,
                            });
                            if (existingAssignment) {
                                continue;
                            }
                            const userRole = new UserRole_1.default({
                                userId,
                                roleId,
                                workspaceId: workspaceId || undefined,
                                isTemporary,
                                expiresAt: isTemporary ? new Date(expiresAt) : undefined,
                                assignmentReason,
                                assignedBy: req.user._id,
                                lastModifiedBy: req.user._id,
                                isActive: true,
                            });
                            await userRole.save({ session });
                            results.push({
                                userId,
                                roleId,
                                success: true,
                            });
                        }
                        const currentAssignedRoles = await UserRole_1.default.find({
                            userId,
                            isActive: true,
                        }).distinct('roleId');
                        await User_1.default.findByIdAndUpdate(userId, {
                            assignedRoles: currentAssignedRoles,
                            roleLastModifiedBy: req.user._id,
                            roleLastModifiedAt: new Date(),
                        }, { session });
                        if (this.dynamicPermissionService) {
                            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
                        }
                        else {
                            logger_1.default.warn('DynamicPermissionService not available, skipping cache invalidation');
                        }
                    }
                    logger_1.default.info('User roles assigned successfully', {
                        userIds,
                        roleIds,
                        assignedBy: req.user._id,
                        workspaceId: workspaceId || null,
                        isTemporary,
                        operationId,
                    });
                });
                res.json({
                    success: true,
                    message: 'User roles assigned successfully',
                    data: {
                        operationId,
                        totalUpdates: userIds.length * roleIds.length,
                        successfulUpdates: userIds.length * roleIds.length,
                        failedUpdates: 0,
                        results: userIds.map((userId) => ({
                            userId,
                            success: true,
                            changes: {
                                rolesAssigned: roleIds.length,
                            },
                        })),
                        summary: {
                            usersUpdated: userIds.length,
                            rolesAssigned: roleIds.length,
                        },
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
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async revokeUserRole(req, res) {
        try {
            const { id, roleId } = req.params;
            const { workspaceId, revocationReason } = req.body;
            if (!id ||
                !roleId ||
                !mongoose_1.default.Types.ObjectId.isValid(id) ||
                !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or role ID format',
                });
            }
            const query = {
                userId: id,
                roleId,
                isActive: true,
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
                isActive: true,
            }).distinct('roleId');
            await User_1.default.findByIdAndUpdate(id, {
                assignedRoles: currentAssignedRoles,
                roleLastModifiedBy: req.user._id,
                roleLastModifiedAt: new Date(),
            });
            if (this.dynamicPermissionService) {
                await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(id), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
            }
            else {
                logger_1.default.warn('DynamicPermissionService not available, skipping cache invalidation');
            }
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
            });
        }
        catch (error) {
            logger_1.default.error('Error revoking user role:', error);
            res.status(500).json({
                success: false,
                message: 'Error revoking user role',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateUserPermissions(req, res) {
        try {
            const { id } = req.params;
            const { directPermissions = [], deniedPermissions = [], replaceExisting = true, } = req.body;
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
                    isActive: true,
                });
                const validPermissionActions = validPermissions.map((p) => p.action);
                const invalidPermissions = allPermissions.filter((p) => !validPermissionActions.includes(p));
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
                roleLastModifiedAt: new Date(),
            };
            if (replaceExisting) {
                updateData.directPermissions = directPermissions;
                updateData.deniedPermissions = deniedPermissions;
            }
            else {
                const existingDirectPermissions = user.directPermissions || [];
                const existingDeniedPermissions = user.deniedPermissions || [];
                updateData.directPermissions = [
                    ...new Set([...existingDirectPermissions, ...directPermissions]),
                ];
                updateData.deniedPermissions = [
                    ...new Set([...existingDeniedPermissions, ...deniedPermissions]),
                ];
            }
            const updatedUser = await User_1.default.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            }).select('directPermissions deniedPermissions roleLastModifiedBy roleLastModifiedAt');
            if (this.dynamicPermissionService) {
                await this.dynamicPermissionService.invalidateUserCache(user._id);
            }
            else {
                logger_1.default.warn('DynamicPermissionService not available, skipping cache invalidation');
            }
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
            });
        }
        catch (error) {
            logger_1.default.error('Error updating user permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user permissions',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getUserEffectivePermissions(req, res) {
        try {
            const { id } = req.params;
            const { workspaceId, includeInherited = true, includeRoleDetails = false, } = req.query;
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
            const workspaceContext = {
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
                    interventions: null,
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
            };
            if (workspaceId) {
                const workspace = await mongoose_1.default
                    .model('Workplace')
                    .findById(workspaceId);
                if (workspace) {
                    workspaceContext.workspace = workspace;
                }
            }
            if (!this.dynamicPermissionService) {
                return res.status(500).json({
                    success: false,
                    message: 'Permission service not available',
                });
            }
            const permissionResult = await this.dynamicPermissionService.resolveUserPermissions(user, workspaceContext);
            const userRoles = await UserRole_1.default.find({
                userId: user._id,
                isActive: true,
                ...(workspaceId && { workspaceId }),
            }).populate('roleId', 'name displayName category hierarchyLevel permissions');
            let roleHierarchyDetails = {};
            if (includeRoleDetails === 'true') {
                for (const userRole of userRoles) {
                    const role = userRole.roleId;
                    if (role) {
                        const hierarchyPath = await this.roleHierarchyService.getRoleInheritancePath(role._id);
                        const allRolePermissions = await this.roleHierarchyService.getAllRolePermissions(role._id);
                        roleHierarchyDetails[role._id.toString()] = {
                            hierarchyPath: hierarchyPath.map((r) => ({
                                id: r._id,
                                name: r.name,
                                displayName: r.displayName,
                                level: r.hierarchyLevel,
                            })),
                            allPermissions: allRolePermissions.permissions,
                            permissionSources: allRolePermissions.sources,
                            conflicts: allRolePermissions.conflicts,
                        };
                    }
                }
            }
            const permissionsBySource = {
                direct: [],
                role: [],
                inherited: [],
                legacy: [],
            };
            Object.entries(permissionResult.sources).forEach(([permission, source]) => {
                const sourceType = typeof source === 'string'
                    ? source
                    : source?.source || 'unknown';
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
                isActive: true,
            }).select('action displayName category riskLevel requiredSubscriptionTier');
            const permissionDetailsMap = permissionDetails.reduce((acc, perm) => {
                acc[perm.action] = {
                    displayName: perm.displayName,
                    category: perm.category,
                    riskLevel: perm.riskLevel,
                    requiredSubscriptionTier: perm.requiredSubscriptionTier,
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
                }, {}),
            };
            res.json({
                success: true,
                data: {
                    permissions: permissionResult.permissions,
                    sources: permissionResult.sources,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching user effective permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user effective permissions',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
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
                        isActive: true,
                    });
                    if (validRoles.length !== roleIds.length) {
                        const foundRoleIds = validRoles.map((r) => r._id.toString());
                        const missingRoleIds = roleIds.filter((id) => !foundRoleIds.includes(id));
                        errors.push(`Invalid or inactive roles: ${missingRoleIds.join(', ')}`);
                    }
                }
                const allPermissions = [
                    ...(directPermissions || []),
                    ...(deniedPermissions || []),
                ];
                if (allPermissions.length > 0) {
                    const validPermissions = await Permission_1.default.find({
                        action: { $in: allPermissions },
                        isActive: true,
                    });
                    const validPermissionActions = validPermissions.map((p) => p.action);
                    const invalidPermissions = allPermissions.filter((p) => !validPermissionActions.includes(p));
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
                    warnings,
                });
            }
            const validUpdates = validationResults.filter((r) => r.isValid);
            const invalidUpdates = validationResults.filter((r) => !r.isValid);
            if (dryRun) {
                return res.json({
                    success: true,
                    message: 'Dry run completed',
                    data: {
                        totalUpdates: updates.length,
                        validUpdates: validUpdates.length,
                        invalidUpdates: invalidUpdates.length,
                        validationResults,
                        wouldProceed: invalidUpdates.length === 0,
                    },
                });
            }
            if (invalidUpdates.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed for some updates',
                    data: {
                        invalidUpdates,
                        totalErrors: invalidUpdates.reduce((sum, u) => sum + u.errors.length, 0),
                    },
                });
            }
            const results = [];
            for (const update of updates) {
                try {
                    const { userId, roleIds, directPermissions, deniedPermissions, workspaceId, } = update;
                    const changes = {};
                    const session = await mongoose_1.default.startSession();
                    try {
                        await session.withTransaction(async () => {
                            if (roleIds) {
                                await UserRole_1.default.updateMany({
                                    userId,
                                    isActive: true,
                                    ...(workspaceId && { workspaceId }),
                                }, {
                                    isActive: false,
                                    revokedBy: req.user._id,
                                    revokedAt: new Date(),
                                    revocationReason: 'Bulk update replacement',
                                    lastModifiedBy: req.user._id,
                                }, { session });
                                for (const roleId of roleIds) {
                                    const userRole = new UserRole_1.default({
                                        userId,
                                        roleId,
                                        workspaceId: workspaceId || undefined,
                                        assignedBy: req.user._id,
                                        lastModifiedBy: req.user._id,
                                        isActive: true,
                                    });
                                    await userRole.save({ session });
                                }
                                changes.roleIds = roleIds;
                            }
                            if (directPermissions !== undefined ||
                                deniedPermissions !== undefined) {
                                const updateData = {
                                    roleLastModifiedBy: req.user._id,
                                    roleLastModifiedAt: new Date(),
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
                                    isActive: true,
                                }).distinct('roleId');
                                await User_1.default.findByIdAndUpdate(userId, { assignedRoles: currentAssignedRoles }, { session });
                            }
                        });
                        if (this.dynamicPermissionService) {
                            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
                        }
                        else {
                            logger_1.default.warn('DynamicPermissionService not available, skipping cache invalidation');
                        }
                        results.push({
                            userId,
                            success: true,
                            changes: changes,
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
                        changes: {},
                    });
                }
            }
            const successfulUpdates = results.filter((r) => r.success);
            const failedUpdates = results.filter((r) => !r.success);
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
                        permissionsUpdated: successfulUpdates.filter((r) => r.changes.directPermissions || r.changes.deniedPermissions).length,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in bulk user update:', error);
            res.status(500).json({
                success: false,
                message: 'Error in bulk user update',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async checkUserPermission(req, res) {
        try {
            const { id } = req.params;
            const { permission, context } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            if (!permission) {
                return res.status(400).json({
                    success: false,
                    message: 'Permission is required',
                });
            }
            const user = await User_1.default.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const workspaceContext = {
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
                    interventions: null,
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
                ...context,
            };
            const permissionResult = await this.dynamicPermissionService.resolveUserPermissions(user, workspaceContext);
            const hasPermission = permissionResult.permissions.includes(permission);
            res.json({
                success: true,
                data: {
                    allowed: hasPermission,
                    source: hasPermission ? permissionResult.sources[permission] : 'none',
                    reason: hasPermission
                        ? 'Permission granted'
                        : 'Permission not granted',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error checking user permission:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking user permission',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async previewPermissionChanges(req, res) {
        try {
            const { id } = req.params;
            const { roleIds, directPermissions, deniedPermissions } = req.body;
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
            const workspaceContext = {
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
                    interventions: null,
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
            };
            const currentPermissionsResult = await this.dynamicPermissionService.resolveUserPermissions(user, workspaceContext);
            const currentPermissions = currentPermissionsResult.permissions;
            const simulatedUser = { ...user.toObject() };
            if (roleIds && Array.isArray(roleIds)) {
                simulatedUser.assignedRoles = roleIds;
            }
            if (directPermissions !== undefined) {
                simulatedUser.directPermissions = directPermissions;
            }
            if (deniedPermissions !== undefined) {
                simulatedUser.deniedPermissions = deniedPermissions;
            }
            const newPermissionsResult = await this.dynamicPermissionService.resolveUserPermissions(simulatedUser, workspaceContext);
            const newPermissions = newPermissionsResult.permissions;
            const addedPermissions = newPermissions.filter((p) => !currentPermissions.includes(p));
            const removedPermissions = currentPermissions.filter((p) => !newPermissions.includes(p));
            const conflicts = [];
            if (deniedPermissions && roleIds) {
                const roles = await Role_1.default.find({
                    _id: { $in: roleIds },
                    isActive: true,
                });
                const rolePermissions = new Set();
                for (const role of roles) {
                    role.permissions.forEach((p) => rolePermissions.add(p));
                }
                const conflictingPermissions = deniedPermissions.filter((p) => rolePermissions.has(p));
                if (conflictingPermissions.length > 0) {
                    conflicts.push(`Denied permissions would be granted by roles: ${conflictingPermissions.join(', ')}`);
                }
            }
            res.json({
                success: true,
                data: {
                    userId: id,
                    currentPermissions,
                    newPermissions,
                    addedPermissions,
                    removedPermissions,
                    conflicts,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error previewing permission changes:', error);
            res.status(500).json({
                success: false,
                message: 'Error previewing permission changes',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async detectRoleConflicts(req, res) {
        try {
            const { id } = req.params;
            const { roleIds } = req.body;
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
                isActive: true,
            });
            if (roles.length !== roleIds.length) {
                const foundRoleIds = roles.map((r) => r._id.toString());
                const missingRoleIds = roleIds.filter((id) => !foundRoleIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some roles not found or inactive',
                    missingRoleIds,
                });
            }
            const conflicts = [];
            const hierarchyConflicts = await this.roleHierarchyService.getRoleInheritancePath(roleIds[0]);
            if (hierarchyConflicts.length > 1) {
                hierarchyConflicts.forEach((conflict, index) => {
                    if (index > 0) {
                        conflicts.push({
                            type: 'hierarchy',
                            message: `Role hierarchy conflict detected`,
                            severity: 'error',
                        });
                    }
                });
            }
            const rolePermissions = new Map();
            for (const role of roles) {
                const permissions = new Set(role.permissions);
                rolePermissions.set(role._id.toString(), permissions);
            }
            const permissionConflicts = [];
            const permissionMap = new Map();
            rolePermissions.forEach((permissions, roleId) => {
                permissions.forEach((permission) => {
                    if (!permissionMap.has(permission)) {
                        permissionMap.set(permission, []);
                    }
                    permissionMap.get(permission).push(roleId);
                });
            });
            permissionMap.forEach((roleIds, permission) => {
                if (roleIds.length > 1) {
                    permissionConflicts.push({
                        permission,
                        roles: roleIds,
                    });
                }
            });
            if (permissionConflicts.length > 0) {
                permissionConflicts.forEach((conflict) => {
                    conflicts.push({
                        type: 'permission',
                        message: `Permission "${conflict.permission}" is assigned to multiple roles`,
                        severity: 'warning',
                    });
                });
            }
            const exclusiveRoles = roles.filter((role) => role.category === 'system' && role.name.includes('admin'));
            if (exclusiveRoles.length > 1) {
                conflicts.push({
                    type: 'exclusivity',
                    message: 'Multiple admin roles cannot be assigned to the same user',
                    severity: 'error',
                });
            }
            const temporaryRoles = roles.filter((role) => role.isTemporary === true);
            if (temporaryRoles.length > 0) {
                conflicts.push({
                    type: 'temporary',
                    message: 'Temporary roles should not be mixed with permanent roles',
                    severity: 'warning',
                });
            }
            res.json({
                success: true,
                data: {
                    conflicts,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error detecting role conflicts:', error);
            res.status(500).json({
                success: false,
                message: 'Error detecting role conflicts',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async resolveRoleConflicts(req, res) {
        try {
            const { id } = req.params;
            const { resolutions } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            if (!resolutions ||
                !Array.isArray(resolutions) ||
                resolutions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Resolutions array is required and cannot be empty',
                });
            }
            const user = await User_1.default.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const resolutionResults = [];
            for (const resolution of resolutions) {
                const { conflictId, resolution: resolutionType, priority } = resolution;
                try {
                    switch (resolutionType) {
                        case 'allow':
                            resolutionResults.push({
                                conflictId,
                                resolution: resolutionType,
                                success: true,
                                message: 'Conflict resolved by allowing the permission/role',
                            });
                            break;
                        case 'deny':
                            resolutionResults.push({
                                conflictId,
                                resolution: resolutionType,
                                success: true,
                                message: 'Conflict resolved by denying the permission/role',
                            });
                            break;
                        case 'prioritize':
                            if (!priority) {
                                resolutionResults.push({
                                    conflictId,
                                    resolution: resolutionType,
                                    success: false,
                                    message: 'Priority is required for prioritize resolution',
                                });
                            }
                            else {
                                resolutionResults.push({
                                    conflictId,
                                    resolution: resolutionType,
                                    success: true,
                                    message: `Conflict resolved by prioritizing: ${priority}`,
                                });
                            }
                            break;
                        default:
                            resolutionResults.push({
                                conflictId,
                                resolution: resolutionType,
                                success: false,
                                message: `Unknown resolution type: ${resolutionType}`,
                            });
                    }
                }
                catch (error) {
                    resolutionResults.push({
                        conflictId,
                        resolution: resolutionType,
                        success: false,
                        message: `Error applying resolution: ${error.message}`,
                    });
                }
            }
            const successfulResolutions = resolutionResults.filter((r) => r.success);
            const failedResolutions = resolutionResults.filter((r) => !r.success);
            logger_1.default.info('Role conflicts resolved', {
                userId: id,
                totalResolutions: resolutions.length,
                successful: successfulResolutions.length,
                failed: failedResolutions.length,
                resolvedBy: req.user._id,
            });
            res.json({
                success: failedResolutions.length === 0,
                message: `Role conflicts resolved. ${successfulResolutions.length} successful, ${failedResolutions.length} failed.`,
                data: {
                    resolutionResults,
                    summary: {
                        totalResolutions: resolutions.length,
                        successfulResolutions: successfulResolutions.length,
                        failedResolutions: failedResolutions.length,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error resolving role conflicts:', error);
            res.status(500).json({
                success: false,
                message: 'Error resolving role conflicts',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async refreshUserPermissionCache(req, res) {
        try {
            const { id } = req.params;
            const { workspaceId } = req.body;
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
            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(id), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
            let workspaceContext = {
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
                    interventions: null,
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
            };
            if (workspaceId) {
                const workspace = await mongoose_1.default
                    .model('Workplace')
                    .findById(workspaceId);
                if (workspace) {
                    workspaceContext.workspace = workspace;
                }
            }
            await this.dynamicPermissionService.resolveUserPermissions(user, workspaceContext);
            logger_1.default.info('User permission cache refreshed', {
                userId: id,
                workspaceId: workspaceId || null,
                refreshedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'User permission cache refreshed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error refreshing user permission cache:', error);
            res.status(500).json({
                success: false,
                message: 'Error refreshing user permission cache',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
}
exports.UserRoleController = UserRoleController;
exports.userRoleController = new UserRoleController();
//# sourceMappingURL=userRoleController.js.map