"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleHierarchyController = exports.RoleHierarchyController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Role_1 = __importDefault(require("../models/Role"));
const RoleHierarchyService_1 = __importDefault(require("../services/RoleHierarchyService"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoleHierarchyController {
    constructor() {
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
    }
    async addChildRoles(req, res) {
        try {
            const { id } = req.params;
            const { childRoleIds } = req.body;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parent role ID format',
                });
            }
            if (!childRoleIds || !Array.isArray(childRoleIds) || childRoleIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Child role IDs array is required and cannot be empty',
                });
            }
            const parentRole = await Role_1.default.findById(id);
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
            const childRoles = await Role_1.default.find({
                _id: { $in: childRoleIds },
                isActive: true
            });
            if (childRoles.length !== childRoleIds.length) {
                const foundRoleIds = childRoles.map(r => r._id.toString());
                const missingRoleIds = childRoleIds.filter(id => !foundRoleIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some child roles not found or inactive',
                    missingRoleIds,
                });
            }
            const validationResults = [];
            for (const childRoleId of childRoleIds) {
                const childRole = childRoles.find(r => r._id.toString() === childRoleId);
                if (childRole && childRole.parentRole) {
                    validationResults.push({
                        roleId: childRoleId,
                        roleName: childRole.name,
                        error: 'Role already has a parent role'
                    });
                    continue;
                }
                const hasCircularDependency = await this.roleHierarchyService.detectCircularDependency(new mongoose_1.default.Types.ObjectId(childRoleId), parentRole._id);
                if (hasCircularDependency) {
                    validationResults.push({
                        roleId: childRoleId,
                        roleName: childRole?.name,
                        error: 'Would create circular dependency'
                    });
                    continue;
                }
                const conflicts = await this.roleHierarchyService.validateRoleHierarchy(new mongoose_1.default.Types.ObjectId(childRoleId), parentRole._id);
                if (conflicts.length > 0) {
                    validationResults.push({
                        roleId: childRoleId,
                        roleName: childRole?.name,
                        error: conflicts.map(c => c.message).join(', ')
                    });
                }
            }
            if (validationResults.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hierarchy validation failed',
                    validationErrors: validationResults,
                });
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    for (const childRoleId of childRoleIds) {
                        await Role_1.default.findByIdAndUpdate(childRoleId, {
                            parentRole: parentRole._id,
                            hierarchyLevel: parentRole.hierarchyLevel + 1,
                            lastModifiedBy: req.user._id
                        }, { session });
                    }
                    await Role_1.default.findByIdAndUpdate(parentRole._id, {
                        $addToSet: { childRoles: { $each: childRoleIds } },
                        lastModifiedBy: req.user._id
                    }, { session });
                    for (const childRoleId of childRoleIds) {
                        await this.roleHierarchyService.updateHierarchyLevels(new mongoose_1.default.Types.ObjectId(childRoleId));
                    }
                });
                await this.dynamicPermissionService.invalidateRoleCache(parentRole._id);
                for (const childRoleId of childRoleIds) {
                    await this.dynamicPermissionService.invalidateRoleCache(new mongoose_1.default.Types.ObjectId(childRoleId));
                }
                const updatedParentRole = await Role_1.default.findById(parentRole._id)
                    .populate('childRoles', 'name displayName category hierarchyLevel');
                logger_1.default.info('Child roles added successfully', {
                    parentRoleId: parentRole._id,
                    parentRoleName: parentRole.name,
                    childRoleIds,
                    addedBy: req.user._id,
                });
                res.json({
                    success: true,
                    message: 'Child roles added successfully',
                    data: {
                        parentRole: {
                            id: updatedParentRole._id,
                            name: updatedParentRole.name,
                            displayName: updatedParentRole.displayName,
                            hierarchyLevel: updatedParentRole.hierarchyLevel
                        },
                        addedChildren: updatedParentRole.childRoles,
                        totalChildren: updatedParentRole.childRoles.length
                    },
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error adding child roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding child roles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async removeChildRole(req, res) {
        try {
            const { id, childId } = req.params;
            if (!id || !childId || !mongoose_1.default.Types.ObjectId.isValid(id) || !mongoose_1.default.Types.ObjectId.isValid(childId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parent or child role ID format',
                });
            }
            const parentRole = await Role_1.default.findById(id);
            if (!parentRole) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent role not found',
                });
            }
            const childRole = await Role_1.default.findById(childId);
            if (!childRole) {
                return res.status(404).json({
                    success: false,
                    message: 'Child role not found',
                });
            }
            if (!childRole.parentRole || !childRole.parentRole.equals(parentRole._id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Role is not a child of the specified parent role',
                });
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    await Role_1.default.findByIdAndUpdate(childId, {
                        $unset: { parentRole: 1 },
                        hierarchyLevel: 0,
                        lastModifiedBy: req.user._id
                    }, { session });
                    await Role_1.default.findByIdAndUpdate(id, {
                        $pull: { childRoles: childId },
                        lastModifiedBy: req.user._id
                    }, { session });
                    await this.roleHierarchyService.updateHierarchyLevels(new mongoose_1.default.Types.ObjectId(childId));
                });
                await this.dynamicPermissionService.invalidateRoleCache(parentRole._id);
                await this.dynamicPermissionService.invalidateRoleCache(childRole._id);
                logger_1.default.info('Child role removed successfully', {
                    parentRoleId: id,
                    parentRoleName: parentRole.name,
                    childRoleId: childId,
                    childRoleName: childRole.name,
                    removedBy: req.user._id,
                });
                res.json({
                    success: true,
                    message: 'Child role removed successfully',
                    data: {
                        parentRole: {
                            id: parentRole._id,
                            name: parentRole.name,
                            displayName: parentRole.displayName
                        },
                        removedChild: {
                            id: childRole._id,
                            name: childRole.name,
                            displayName: childRole.displayName
                        }
                    },
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error removing child role:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing child role',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getRoleHierarchy(req, res) {
        try {
            const { id } = req.params;
            const { includePermissions = false, includeUsers = false } = req.query;
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
            const inheritancePath = await this.roleHierarchyService.getRoleInheritancePath(role._id);
            const hierarchyTree = await this.roleHierarchyService.getRoleHierarchyTree(role._id);
            let permissionDetails = {};
            if (includePermissions === 'true') {
                const allPermissions = await this.roleHierarchyService.getAllRolePermissions(role._id);
                permissionDetails = {
                    allPermissions: allPermissions.permissions,
                    permissionSources: allPermissions.sources,
                    conflicts: allPermissions.conflicts
                };
            }
            let userAssignments = {};
            if (includeUsers === 'true') {
                const userRoles = await mongoose_1.default.model('UserRole').find({
                    roleId: role._id,
                    isActive: true
                }).populate('userId', 'firstName lastName email role status');
                userAssignments = {
                    directAssignments: userRoles.length,
                    users: userRoles.map((ur) => ({
                        id: ur.userId._id,
                        name: `${ur.userId.firstName} ${ur.userId.lastName}`,
                        email: ur.userId.email,
                        status: ur.userId.status,
                        assignedAt: ur.assignedAt
                    }))
                };
            }
            const calculateTreeStats = (nodes) => {
                let totalNodes = 0;
                let maxDepth = 0;
                let leafNodes = 0;
                const traverse = (node, depth) => {
                    totalNodes++;
                    maxDepth = Math.max(maxDepth, depth);
                    if (node.children.length === 0) {
                        leafNodes++;
                    }
                    else {
                        node.children.forEach((child) => traverse(child, depth + 1));
                    }
                };
                nodes.forEach(node => traverse(node, 0));
                return { totalNodes, maxDepth, leafNodes };
            };
            const hierarchyStats = calculateTreeStats(hierarchyTree);
            res.json({
                success: true,
                data: {
                    role: {
                        id: role._id,
                        name: role.name,
                        displayName: role.displayName,
                        category: role.category,
                        hierarchyLevel: role.hierarchyLevel,
                        isSystemRole: role.isSystemRole
                    },
                    inheritancePath: inheritancePath.map(r => ({
                        id: r._id,
                        name: r.name,
                        displayName: r.displayName,
                        hierarchyLevel: r.hierarchyLevel
                    })),
                    hierarchyTree,
                    statistics: {
                        ...hierarchyStats,
                        inheritanceDepth: inheritancePath.length,
                        hasParent: !!role.parentRole,
                        hasChildren: role.childRoles.length > 0
                    },
                    ...(includePermissions === 'true' && { permissions: permissionDetails }),
                    ...(includeUsers === 'true' && { userAssignments })
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching role hierarchy:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching role hierarchy',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async changeParentRole(req, res) {
        try {
            const { id } = req.params;
            const { parentRoleId } = req.body;
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
                    message: 'System roles cannot have their parent changed',
                });
            }
            let newParentRole = null;
            if (parentRoleId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(parentRoleId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid parent role ID format',
                    });
                }
                newParentRole = await Role_1.default.findById(parentRoleId);
                if (!newParentRole) {
                    return res.status(404).json({
                        success: false,
                        message: 'New parent role not found',
                    });
                }
                if (!newParentRole.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: 'New parent role is not active',
                    });
                }
                const hasCircularDependency = await this.roleHierarchyService.detectCircularDependency(role._id, newParentRole._id);
                if (hasCircularDependency) {
                    return res.status(400).json({
                        success: false,
                        message: 'Changing parent would create a circular dependency',
                    });
                }
                const conflicts = await this.roleHierarchyService.validateRoleHierarchy(role._id, newParentRole._id);
                if (conflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Hierarchy validation failed',
                        conflicts: conflicts.map(c => ({
                            type: c.type,
                            message: c.message,
                            severity: c.severity
                        })),
                    });
                }
            }
            const oldParentRole = role.parentRole;
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    if (oldParentRole) {
                        await Role_1.default.findByIdAndUpdate(oldParentRole, {
                            $pull: { childRoles: role._id },
                            lastModifiedBy: req.user._id
                        }, { session });
                    }
                    const updateData = {
                        lastModifiedBy: req.user._id
                    };
                    if (parentRoleId) {
                        updateData.parentRole = newParentRole._id;
                        updateData.hierarchyLevel = newParentRole.hierarchyLevel + 1;
                    }
                    else {
                        updateData.$unset = { parentRole: 1 };
                        updateData.hierarchyLevel = 0;
                    }
                    await Role_1.default.findByIdAndUpdate(role._id, updateData, { session });
                    if (parentRoleId) {
                        await Role_1.default.findByIdAndUpdate(parentRoleId, {
                            $addToSet: { childRoles: role._id },
                            lastModifiedBy: req.user._id
                        }, { session });
                    }
                    await this.roleHierarchyService.updateHierarchyLevels(role._id);
                });
                await this.dynamicPermissionService.invalidateRoleCache(role._id);
                if (oldParentRole) {
                    await this.dynamicPermissionService.invalidateRoleCache(oldParentRole);
                }
                if (newParentRole) {
                    await this.dynamicPermissionService.invalidateRoleCache(newParentRole._id);
                }
                logger_1.default.info('Role parent changed successfully', {
                    roleId: role._id,
                    roleName: role.name,
                    oldParentRoleId: oldParentRole?.toString() || null,
                    newParentRoleId: parentRoleId || null,
                    changedBy: req.user._id,
                });
                res.json({
                    success: true,
                    message: 'Role parent changed successfully',
                    data: {
                        role: {
                            id: role._id,
                            name: role.name,
                            displayName: role.displayName
                        },
                        oldParent: oldParentRole ? {
                            id: oldParentRole,
                        } : null,
                        newParent: newParentRole ? {
                            id: newParentRole._id,
                            name: newParentRole.name,
                            displayName: newParentRole.displayName,
                            hierarchyLevel: newParentRole.hierarchyLevel
                        } : null,
                        newHierarchyLevel: newParentRole ? newParentRole.hierarchyLevel + 1 : 0
                    },
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error changing role parent:', error);
            res.status(500).json({
                success: false,
                message: 'Error changing role parent',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getFullRoleHierarchyTree(req, res) {
        try {
            const { includeInactive = false, includePermissions = false, includeUserCounts = false, rootRoleId } = req.query;
            const hierarchyTree = await this.roleHierarchyService.getRoleHierarchyTree(rootRoleId ? new mongoose_1.default.Types.ObjectId(rootRoleId) : undefined);
            const enhanceNode = async (node) => {
                const enhancedNode = { ...node };
                if (includePermissions === 'true') {
                    const allPermissions = await this.roleHierarchyService.getAllRolePermissions(node.role._id);
                    enhancedNode.permissionSummary = {
                        totalPermissions: allPermissions.permissions.length,
                        directPermissions: node.permissions.length,
                        inheritedPermissions: node.inheritedPermissions.length,
                        hasConflicts: allPermissions.conflicts.length > 0
                    };
                }
                if (includeUserCounts === 'true') {
                    const userCount = await mongoose_1.default.model('UserRole').countDocuments({
                        roleId: node.role._id,
                        isActive: true
                    });
                    enhancedNode.userCount = userCount;
                }
                if (node.children && node.children.length > 0) {
                    enhancedNode.children = await Promise.all(node.children.map((child) => enhanceNode(child)));
                }
                return enhancedNode;
            };
            const enhancedTree = await Promise.all(hierarchyTree.map(node => enhanceNode(node)));
            const calculateOverallStats = (nodes) => {
                let totalRoles = 0;
                let totalUsers = 0;
                let maxDepth = 0;
                let rolesWithChildren = 0;
                let leafRoles = 0;
                const categoryDistribution = {};
                const traverse = (node, depth) => {
                    totalRoles++;
                    maxDepth = Math.max(maxDepth, depth);
                    const category = node.role.category;
                    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
                    if (node.userCount !== undefined) {
                        totalUsers += node.userCount;
                    }
                    if (node.children.length === 0) {
                        leafRoles++;
                    }
                    else {
                        rolesWithChildren++;
                        node.children.forEach((child) => traverse(child, depth + 1));
                    }
                };
                nodes.forEach(node => traverse(node, 0));
                return {
                    totalRoles,
                    totalUsers,
                    maxDepth,
                    rolesWithChildren,
                    leafRoles,
                    rootRoles: nodes.length,
                    categoryDistribution
                };
            };
            const overallStats = calculateOverallStats(enhancedTree);
            const hierarchyIssues = [];
            const checkForIssues = (node, depth) => {
                if (depth > 5) {
                    hierarchyIssues.push({
                        type: 'excessive_depth',
                        roleId: node.role._id.toString(),
                        roleName: node.role.name,
                        message: `Role is at depth ${depth}, consider flattening hierarchy`,
                        severity: 'warning'
                    });
                }
                if (node.children.length > 10) {
                    hierarchyIssues.push({
                        type: 'too_many_children',
                        roleId: node.role._id.toString(),
                        roleName: node.role.name,
                        message: `Role has ${node.children.length} children, consider grouping`,
                        severity: 'warning'
                    });
                }
                if (node.permissionSummary?.hasConflicts) {
                    hierarchyIssues.push({
                        type: 'permission_conflicts',
                        roleId: node.role._id.toString(),
                        roleName: node.role.name,
                        message: 'Role has permission conflicts in hierarchy',
                        severity: 'error'
                    });
                }
                node.children.forEach((child) => checkForIssues(child, depth + 1));
            };
            enhancedTree.forEach(node => checkForIssues(node, 0));
            res.json({
                success: true,
                data: {
                    hierarchyTree: enhancedTree,
                    statistics: overallStats,
                    issues: hierarchyIssues,
                    metadata: {
                        includeInactive: includeInactive === 'true',
                        includePermissions: includePermissions === 'true',
                        includeUserCounts: includeUserCounts === 'true',
                        rootRoleId: rootRoleId || null,
                        generatedAt: new Date()
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching full role hierarchy tree:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching full role hierarchy tree',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async validateRoleHierarchy(req, res) {
        try {
            const { roleId, parentRoleId, checkType = 'full' } = req.body;
            const validationResults = [];
            if (checkType === 'single' && roleId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid role ID format',
                    });
                }
                const role = await Role_1.default.findById(roleId);
                if (!role) {
                    return res.status(404).json({
                        success: false,
                        message: 'Role not found',
                    });
                }
                const conflicts = await this.roleHierarchyService.validateRoleHierarchy(role._id, parentRoleId ? new mongoose_1.default.Types.ObjectId(parentRoleId) : undefined);
                conflicts.forEach(conflict => {
                    validationResults.push({
                        type: conflict.type,
                        roleId: conflict.roleId.toString(),
                        roleName: role.name,
                        message: conflict.message,
                        severity: conflict.severity,
                        suggestions: []
                    });
                });
                if (conflicts.length > 0) {
                    const resolutions = await this.roleHierarchyService.resolveRoleConflicts(conflicts);
                    resolutions.forEach((resolution, index) => {
                        if (validationResults[index]) {
                            validationResults[index].suggestions = resolution.resolutions;
                        }
                    });
                }
            }
            else {
                const allRoles = await Role_1.default.find({ isActive: true });
                const visited = new Set();
                const recursionStack = new Set();
                const detectCircularDependencies = async (role, path) => {
                    const roleIdStr = role._id.toString();
                    if (recursionStack.has(roleIdStr)) {
                        const cycleStart = path.indexOf(role.name);
                        const cyclePath = cycleStart !== -1 ? path.slice(cycleStart) : path;
                        validationResults.push({
                            type: 'circular_dependency',
                            roleId: roleIdStr,
                            roleName: role.name,
                            message: `Circular dependency detected: ${cyclePath.join(' -> ')} -> ${role.name}`,
                            severity: 'critical',
                            suggestions: [
                                'Remove one of the parent-child relationships in the cycle',
                                'Restructure the hierarchy to eliminate the circular reference'
                            ]
                        });
                        return;
                    }
                    if (visited.has(roleIdStr)) {
                        return;
                    }
                    visited.add(roleIdStr);
                    recursionStack.add(roleIdStr);
                    if (role.parentRole) {
                        const parentRole = await Role_1.default.findById(role.parentRole);
                        if (parentRole) {
                            await detectCircularDependencies(parentRole, [...path, role.name]);
                        }
                    }
                    recursionStack.delete(roleIdStr);
                };
                for (const role of allRoles) {
                    if (!visited.has(role._id.toString())) {
                        await detectCircularDependencies(role, []);
                    }
                }
                for (const role of allRoles) {
                    if (role.parentRole) {
                        const parentExists = await Role_1.default.findById(role.parentRole);
                        if (!parentExists) {
                            validationResults.push({
                                type: 'orphaned_role',
                                roleId: role._id.toString(),
                                roleName: role.name,
                                message: 'Role references non-existent parent role',
                                severity: 'error',
                                suggestions: [
                                    'Remove the parent role reference',
                                    'Create the missing parent role',
                                    'Assign a different valid parent role'
                                ]
                            });
                        }
                        else if (!parentExists.isActive) {
                            validationResults.push({
                                type: 'inactive_parent',
                                roleId: role._id.toString(),
                                roleName: role.name,
                                message: 'Role references inactive parent role',
                                severity: 'warning',
                                suggestions: [
                                    'Activate the parent role',
                                    'Assign a different active parent role',
                                    'Remove the parent role reference'
                                ]
                            });
                        }
                    }
                }
                for (const role of allRoles) {
                    const expectedLevel = await this.roleHierarchyService.calculateHierarchyLevel(role._id);
                    if (role.hierarchyLevel !== expectedLevel) {
                        validationResults.push({
                            type: 'inconsistent_hierarchy_level',
                            roleId: role._id.toString(),
                            roleName: role.name,
                            message: `Hierarchy level mismatch: expected ${expectedLevel}, actual ${role.hierarchyLevel}`,
                            severity: 'warning',
                            suggestions: [
                                'Run hierarchy level recalculation',
                                'Update the role hierarchy level manually'
                            ]
                        });
                    }
                }
                const maxDepth = Math.max(...allRoles.map(r => r.hierarchyLevel));
                if (maxDepth > 8) {
                    validationResults.push({
                        type: 'excessive_hierarchy_depth',
                        message: `Maximum hierarchy depth is ${maxDepth}, consider flattening`,
                        severity: 'warning',
                        suggestions: [
                            'Combine similar roles at different levels',
                            'Create parallel role structures instead of deep nesting',
                            'Review if all hierarchy levels are necessary'
                        ]
                    });
                }
            }
            const resultsBySeverity = {
                critical: validationResults.filter(r => r.severity === 'critical'),
                error: validationResults.filter(r => r.severity === 'error'),
                warning: validationResults.filter(r => r.severity === 'warning'),
                info: validationResults.filter(r => r.severity === 'info')
            };
            const isValid = resultsBySeverity.critical.length === 0 && resultsBySeverity.error.length === 0;
            res.json({
                success: true,
                data: {
                    isValid,
                    checkType,
                    totalIssues: validationResults.length,
                    issuesBySeverity: {
                        critical: resultsBySeverity.critical.length,
                        error: resultsBySeverity.error.length,
                        warning: resultsBySeverity.warning.length,
                        info: resultsBySeverity.info.length
                    },
                    results: validationResults,
                    resultsBySeverity,
                    recommendations: isValid ?
                        ['Role hierarchy is valid'] :
                        [
                            'Address critical and error issues immediately',
                            'Review warning issues for potential improvements',
                            'Consider running hierarchy maintenance operations'
                        ]
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error validating role hierarchy:', error);
            res.status(500).json({
                success: false,
                message: 'Error validating role hierarchy',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
}
exports.RoleHierarchyController = RoleHierarchyController;
exports.roleHierarchyController = new RoleHierarchyController();
//# sourceMappingURL=roleHierarchyController.js.map