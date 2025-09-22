import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Role, { IRole } from '../models/Role';
import UserRole, { IUserRole } from '../models/UserRole';
import Permission, { IPermission } from '../models/Permission';
import DynamicPermissionService from '../services/DynamicPermissionService';
import RoleHierarchyService from '../services/RoleHierarchyService';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';

export class UserRoleController {
    private dynamicPermissionService: DynamicPermissionService;
    private roleHierarchyService: RoleHierarchyService;

    constructor() {
        this.dynamicPermissionService = DynamicPermissionService.getInstance();
        this.roleHierarchyService = RoleHierarchyService.getInstance();
    }

    /**
     * Get user roles
     * GET /api/admin/users/:id/roles
     */
    async getUserRoles(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { id } = req.params;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }

            // Validate user exists
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Get user role assignments
            const userRoles = await UserRole.find({
                userId: id,
                isActive: true
            })
                .populate('roleId', 'name displayName description category isActive')
                .populate('assignedBy', 'firstName lastName')
                .sort({ assignedAt: -1 });

            // Get roles from user's assignedRoles array as well (for backward compatibility)
            const assignedRoleIds = user.assignedRoles || [];
            const assignedRoles = await Role.find({
                _id: { $in: assignedRoleIds },
                isActive: true
            }).select('name displayName description category isActive');

            // Combine and deduplicate roles
            const allRoles = new Map();

            // Add roles from UserRole collection
            userRoles.forEach(ur => {
                if (ur.roleId && typeof ur.roleId === 'object' && 'name' in ur.roleId) {
                    const role = ur.roleId as any;
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
                            workspaceId: ur.workspaceId
                        }
                    });
                }
            });

            // Add roles from user's assignedRoles array
            assignedRoles.forEach(role => {
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
                            source: 'legacy'
                        }
                    });
                }
            });

            const roles = Array.from(allRoles.values());

            res.json({
                success: true,
                data: {
                    userId: id,
                    roles,
                    totalRoles: roles.length,
                    systemRole: user.role,
                    lastModified: user.roleLastModifiedAt || user.updatedAt
                },
            });

        } catch (error) {
            logger.error('Error fetching user roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user roles',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }

    /**
     * Assign roles to a user
     * POST /api/admin/users/:id/roles
     */
    async assignUserRoles(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const {
                roleIds,
                workspaceId,
                isTemporary = false,
                expiresAt,
                assignmentReason,
                replaceExisting = false
            } = req.body;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

            // Validate user exists
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Validate all roles exist and are active
            const roles = await Role.find({
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

            // Validate workspace if provided
            if (workspaceId) {
                const workspace = await mongoose.model('Workplace').findById(workspaceId);
                if (!workspace) {
                    return res.status(404).json({
                        success: false,
                        message: 'Workspace not found',
                    });
                }
            }

            // Validate temporary assignment
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

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    // Remove existing role assignments if replacing
                    if (replaceExisting) {
                        const existingQuery: any = { userId: user._id, isActive: true };
                        if (workspaceId) {
                            existingQuery.workspaceId = workspaceId;
                        }

                        await UserRole.updateMany(
                            existingQuery,
                            {
                                isActive: false,
                                revokedBy: req.user!._id,
                                revokedAt: new Date(),
                                revocationReason: 'Replaced by new role assignment',
                                lastModifiedBy: req.user!._id
                            },
                            { session }
                        );
                    }

                    // Create new role assignments
                    const userRoleAssignments = [];
                    for (const roleId of roleIds) {
                        // Check if assignment already exists
                        const existingAssignment = await UserRole.findOne({
                            userId: user._id,
                            roleId,
                            workspaceId: workspaceId || { $exists: false },
                            isActive: true
                        });

                        if (existingAssignment && !replaceExisting) {
                            continue; // Skip if already assigned
                        }

                        const userRole = new UserRole({
                            userId: user._id,
                            roleId,
                            workspaceId: workspaceId || undefined,
                            isTemporary,
                            expiresAt: isTemporary ? new Date(expiresAt) : undefined,
                            assignmentReason,
                            assignedBy: req.user!._id,
                            lastModifiedBy: req.user!._id,
                            isActive: true
                        });

                        await userRole.save({ session });
                        userRoleAssignments.push(userRole);
                    }

                    // Update user's assignedRoles array
                    const currentAssignedRoles = await UserRole.find({
                        userId: user._id,
                        isActive: true
                    }).distinct('roleId');

                    await User.findByIdAndUpdate(
                        user._id,
                        {
                            assignedRoles: currentAssignedRoles,
                            roleLastModifiedBy: req.user!._id,
                            roleLastModifiedAt: new Date()
                        },
                        { session }
                    );
                });

                // Invalidate user permission cache
                await this.dynamicPermissionService.invalidateUserCache(user._id, workspaceId);

                // Get updated user with role assignments
                const updatedAssignments = await UserRole.find({
                    userId: user._id,
                    isActive: true
                }).populate('roleId', 'name displayName category hierarchyLevel');

                logger.info('User roles assigned successfully', {
                    userId: user._id,
                    roleIds,
                    assignedBy: req.user!._id,
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

            } finally {
                await session.endSession();
            }

        } catch (error) {
            logger.error('Error assigning user roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error assigning user roles',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }

    /**
     * Revoke a specific role from a user
     * DELETE /api/admin/users/:id/roles/:roleId
     */
    async revokeUserRole(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { id, roleId } = req.params;
            const { workspaceId, revocationReason } = req.body;

            if (!id || !roleId || !mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or role ID format',
                });
            }

            // Find the user role assignment
            const query: any = {
                userId: id,
                roleId,
                isActive: true
            };

            if (workspaceId) {
                query.workspaceId = workspaceId;
            }

            const userRole = await UserRole.findOne(query);
            if (!userRole) {
                return res.status(404).json({
                    success: false,
                    message: 'User role assignment not found',
                });
            }

            // Revoke the role assignment
            userRole.isActive = false;
            userRole.revokedBy = req.user!._id;
            userRole.revokedAt = new Date();
            userRole.lastModifiedBy = req.user!._id;
            if (revocationReason) {
                userRole.revocationReason = revocationReason;
            }
            await userRole.save();

            // Update user's assignedRoles array
            const currentAssignedRoles = await UserRole.find({
                userId: id,
                isActive: true
            }).distinct('roleId');

            await User.findByIdAndUpdate(id, {
                assignedRoles: currentAssignedRoles,
                roleLastModifiedBy: req.user!._id,
                roleLastModifiedAt: new Date()
            });

            // Invalidate user permission cache
            await this.dynamicPermissionService.invalidateUserCache(
                new mongoose.Types.ObjectId(id),
                workspaceId ? new mongoose.Types.ObjectId(workspaceId) : undefined
            );

            // Get role details for response
            const role = await Role.findById(roleId).select('name displayName category');

            logger.info('User role revoked successfully', {
                userId: id,
                roleId,
                revokedBy: req.user!._id,
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
                    revokedBy: req.user!._id,
                    reason: revocationReason || 'No reason provided'
                },
            });

        } catch (error) {
            logger.error('Error revoking user role:', error);
            res.status(500).json({
                success: false,
                message: 'Error revoking user role',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }

    /**
     * Manage user's direct permissions
     * PUT /api/admin/users/:id/permissions
     */
    async updateUserPermissions(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const {
                directPermissions = [],
                deniedPermissions = [],
                replaceExisting = true
            } = req.body;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Validate permissions exist
            const allPermissions = [...directPermissions, ...deniedPermissions];
            if (allPermissions.length > 0) {
                const validPermissions = await Permission.find({
                    action: { $in: allPermissions },
                    isActive: true
                });

                const validPermissionActions = validPermissions.map(p => p.action);
                const invalidPermissions = allPermissions.filter(
                    p => !validPermissionActions.includes(p)
                );

                if (invalidPermissions.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid permissions found',
                        invalidPermissions,
                    });
                }
            }

            // Check for conflicts between direct and denied permissions
            const conflictingPermissions = directPermissions.filter(
                (p: string) => deniedPermissions.includes(p)
            );

            if (conflictingPermissions.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissions cannot be both granted and denied',
                    conflictingPermissions,
                });
            }

            // Update user permissions
            const updateData: any = {
                roleLastModifiedBy: req.user!._id,
                roleLastModifiedAt: new Date()
            };

            if (replaceExisting) {
                updateData.directPermissions = directPermissions;
                updateData.deniedPermissions = deniedPermissions;
            } else {
                // Merge with existing permissions
                const existingDirectPermissions = user.directPermissions || [];
                const existingDeniedPermissions = user.deniedPermissions || [];

                updateData.directPermissions = [
                    ...new Set([...existingDirectPermissions, ...directPermissions])
                ];
                updateData.deniedPermissions = [
                    ...new Set([...existingDeniedPermissions, ...deniedPermissions])
                ];
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('directPermissions deniedPermissions roleLastModifiedBy roleLastModifiedAt');

            // Invalidate user permission cache
            await this.dynamicPermissionService.invalidateUserCache(user._id);

            logger.info('User permissions updated successfully', {
                userId: id,
                directPermissions,
                deniedPermissions,
                updatedBy: req.user!._id,
                replaceExisting,
            });

            res.json({
                success: true,
                message: 'User permissions updated successfully',
                data: {
                    userId: id,
                    directPermissions: updatedUser!.directPermissions,
                    deniedPermissions: updatedUser!.deniedPermissions,
                    lastModifiedBy: updatedUser!.roleLastModifiedBy,
                    lastModifiedAt: updatedUser!.roleLastModifiedAt
                },
            });

        } catch (error) {
            logger.error('Error updating user permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user permissions',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }    /**
 
    * Get user's effective permissions (complete permission listing)
     * GET /api/admin/users/:id/effective-permissions
     */
    async getUserEffectivePermissions(req: AuthRequest, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const { workspaceId, includeInherited = true, includeRoleDetails = false } = req.query;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Build workspace context
            const workspaceContext: any = {};
            if (workspaceId) {
                const workspace = await mongoose.model('Workplace').findById(workspaceId);
                if (workspace) {
                    workspaceContext.workspace = workspace;
                }
            }

            // Get complete permission resolution
            const permissionResult = await this.dynamicPermissionService.resolveUserPermissions(
                user,
                workspaceContext
            );

            // Get user's role assignments with details
            const userRoles = await UserRole.find({
                userId: user._id,
                isActive: true,
                ...(workspaceId && { workspaceId })
            }).populate('roleId', 'name displayName category hierarchyLevel permissions');

            // Get role hierarchy details if requested
            let roleHierarchyDetails: any = {};
            if (includeRoleDetails === 'true') {
                for (const userRole of userRoles) {
                    const role = userRole.roleId as unknown as IRole;
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

            // Categorize permissions by source
            const permissionsBySource: Record<string, string[]> = {
                direct: [],
                role: [],
                inherited: [],
                legacy: []
            };

            Object.entries(permissionResult.sources).forEach(([permission, source]) => {
                const sourceType = typeof source === 'string' ? source : (source as any)?.source || 'unknown';
                if (permissionsBySource[sourceType]) {
                    permissionsBySource[sourceType].push(permission);
                } else {
                    permissionsBySource.other = permissionsBySource.other || [];
                    permissionsBySource.other.push(permission);
                }
            });

            // Get permission details
            const permissionDetails = await Permission.find({
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
            }, {} as Record<string, any>);

            // Calculate statistics
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
                }, {} as Record<string, number>)
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

        } catch (error) {
            logger.error('Error fetching user effective permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user effective permissions',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }

    /**
     * Bulk update user roles and permissions
     * POST /api/admin/users/bulk-update
     */
    async bulkUpdateUsers(req: AuthRequest, res: Response): Promise<any> {
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

            // Validate all updates first
            const validationResults: Array<{
                userId: string;
                isValid: boolean;
                errors: string[];
                warnings: string[];
            }> = [];

            for (const update of updates) {
                const { userId, roleIds, directPermissions, deniedPermissions } = update;
                const errors: string[] = [];
                const warnings: string[] = [];

                // Validate user ID
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    errors.push('Invalid user ID format');
                } else {
                    // Check if user exists
                    const user = await User.findById(userId);
                    if (!user) {
                        errors.push('User not found');
                    } else if (user.status !== 'active') {
                        warnings.push(`User status is ${user.status}`);
                    }
                }

                // Validate role IDs if provided
                if (roleIds && Array.isArray(roleIds)) {
                    const validRoles = await Role.find({
                        _id: { $in: roleIds },
                        isActive: true
                    });

                    if (validRoles.length !== roleIds.length) {
                        const foundRoleIds = validRoles.map(r => r._id.toString());
                        const missingRoleIds = roleIds.filter(id => !foundRoleIds.includes(id));
                        errors.push(`Invalid or inactive roles: ${missingRoleIds.join(', ')}`);
                    }
                }

                // Validate permissions if provided
                const allPermissions = [
                    ...(directPermissions || []),
                    ...(deniedPermissions || [])
                ];

                if (allPermissions.length > 0) {
                    const validPermissions = await Permission.find({
                        action: { $in: allPermissions },
                        isActive: true
                    });

                    const validPermissionActions = validPermissions.map(p => p.action);
                    const invalidPermissions = allPermissions.filter(
                        p => !validPermissionActions.includes(p)
                    );

                    if (invalidPermissions.length > 0) {
                        errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
                    }
                }

                // Check for permission conflicts
                if (directPermissions && deniedPermissions) {
                    const conflicts = directPermissions.filter((p: string) => deniedPermissions.includes(p));
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

            // If dry run, return validation results
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

            // Stop if there are validation errors
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

            // Execute bulk updates
            const results: Array<{
                userId: string;
                success: boolean;
                error?: string;
                changes: any;
            }> = [];

            for (const update of updates) {
                try {
                    const { userId, roleIds, directPermissions, deniedPermissions, workspaceId } = update;
                    const changes: any = {};

                    const session = await mongoose.startSession();

                    try {
                        await session.withTransaction(async () => {

                            // Update roles if provided
                            if (roleIds) {
                                // Remove existing role assignments
                                await UserRole.updateMany(
                                    {
                                        userId,
                                        isActive: true,
                                        ...(workspaceId && { workspaceId })
                                    },
                                    {
                                        isActive: false,
                                        revokedBy: req.user!._id,
                                        revokedAt: new Date(),
                                        revocationReason: 'Bulk update replacement',
                                        lastModifiedBy: req.user!._id
                                    },
                                    { session }
                                );

                                // Add new role assignments
                                for (const roleId of roleIds) {
                                    const userRole = new UserRole({
                                        userId,
                                        roleId,
                                        workspaceId: workspaceId || undefined,
                                        assignedBy: req.user!._id,
                                        lastModifiedBy: req.user!._id,
                                        isActive: true
                                    });

                                    await userRole.save({ session });
                                }

                                changes.roleIds = roleIds;
                            }

                            // Update permissions if provided
                            if (directPermissions !== undefined || deniedPermissions !== undefined) {
                                const updateData: any = {
                                    roleLastModifiedBy: req.user!._id,
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

                                await User.findByIdAndUpdate(userId, updateData, { session });
                            }

                            // Update user's assignedRoles array
                            if (roleIds) {
                                const currentAssignedRoles = await UserRole.find({
                                    userId,
                                    isActive: true
                                }).distinct('roleId');

                                await User.findByIdAndUpdate(
                                    userId,
                                    { assignedRoles: currentAssignedRoles },
                                    { session }
                                );
                            }
                        });

                        // Invalidate user cache
                        await this.dynamicPermissionService.invalidateUserCache(
                            new mongoose.Types.ObjectId(userId),
                            workspaceId ? new mongoose.Types.ObjectId(workspaceId) : undefined
                        );

                        results.push({
                            userId,
                            success: true,
                            changes: changes
                        });

                    } finally {
                        await session.endSession();
                    }

                } catch (error) {
                    results.push({
                        userId: update.userId,
                        success: false,
                        error: (error as Error).message,
                        changes: {}
                    });
                }
            }

            const successfulUpdates = results.filter(r => r.success);
            const failedUpdates = results.filter(r => !r.success);

            logger.info('Bulk user update completed', {
                totalUpdates: updates.length,
                successful: successfulUpdates.length,
                failed: failedUpdates.length,
                updatedBy: req.user!._id,
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
                        rolesAssigned: successfulUpdates.reduce((sum, r) =>
                            sum + (r.changes.roleIds?.length || 0), 0),
                        permissionsUpdated: successfulUpdates.filter(r =>
                            r.changes.directPermissions || r.changes.deniedPermissions).length
                    }
                },
            });

        } catch (error) {
            logger.error('Error in bulk user update:', error);
            res.status(500).json({
                success: false,
                message: 'Error in bulk user update',
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            });
        }
    }
}

export const userRoleController = new UserRoleController();