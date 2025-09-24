"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionController = exports.PermissionController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Permission_1 = __importDefault(require("../models/Permission"));
const Role_1 = __importDefault(require("../models/Role"));
const RolePermission_1 = __importDefault(require("../models/RolePermission"));
const RoleHierarchyService_1 = __importDefault(require("../services/RoleHierarchyService"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const logger_1 = __importDefault(require("../utils/logger"));
class PermissionController {
    constructor() {
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
    }
    async getPermissions(req, res) {
        try {
            const { page = 1, limit = 50, category, riskLevel, isActive, isSystemPermission, requiredSubscriptionTier, search, sortBy = 'action', sortOrder = 'asc' } = req.query;
            const query = {};
            if (category) {
                query.category = category;
            }
            if (riskLevel) {
                query.riskLevel = riskLevel;
            }
            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }
            if (isSystemPermission !== undefined) {
                query.isSystemPermission = isSystemPermission === 'true';
            }
            if (requiredSubscriptionTier) {
                query.requiredSubscriptionTier = requiredSubscriptionTier;
            }
            if (search) {
                query.$or = [
                    { action: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const [permissions, total] = await Promise.all([
                Permission_1.default.find(query)
                    .populate('createdBy', 'firstName lastName')
                    .populate('lastModifiedBy', 'firstName lastName')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum),
                Permission_1.default.countDocuments(query)
            ]);
            const permissionsWithStats = await Promise.all(permissions.map(async (permission) => {
                const [roleCount, directAssignmentCount] = await Promise.all([
                    RolePermission_1.default.countDocuments({
                        permissionAction: permission.action,
                        granted: true,
                        isActive: true
                    }),
                    0
                ]);
                return {
                    ...permission.toObject(),
                    usage: {
                        roleCount,
                        directAssignmentCount,
                        totalUsage: roleCount + directAssignmentCount
                    }
                };
            }));
            res.json({
                success: true,
                data: {
                    permissions: permissionsWithStats,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                    filters: {
                        category,
                        riskLevel,
                        isActive,
                        isSystemPermission,
                        requiredSubscriptionTier,
                        search
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getPermissionMatrix(req, res) {
        try {
            const { includeInactive = false } = req.query;
            const query = {};
            if (includeInactive !== 'true') {
                query.isActive = true;
            }
            const permissions = await Permission_1.default.find(query)
                .sort({ category: 1, action: 1 });
            const matrix = {};
            const categories = new Set();
            permissions.forEach(permission => {
                const category = permission.category;
                categories.add(category);
                if (!matrix[category]) {
                    matrix[category] = [];
                }
                matrix[category].push(permission);
            });
            const categoryStats = await Promise.all(Array.from(categories).map(async (category) => {
                const [totalCount, activeCount, systemCount] = await Promise.all([
                    Permission_1.default.countDocuments({ category }),
                    Permission_1.default.countDocuments({ category, isActive: true }),
                    Permission_1.default.countDocuments({ category, isSystemPermission: true })
                ]);
                return {
                    category,
                    totalCount,
                    activeCount,
                    systemCount
                };
            }));
            res.json({
                success: true,
                data: {
                    matrix,
                    categories: Array.from(categories).sort(),
                    categoryStats,
                    totalPermissions: permissions.length
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permission matrix:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permission matrix',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async createPermission(req, res) {
        try {
            const { action, displayName, description, category, requiredSubscriptionTier, requiredPlanFeatures = [], dependencies = [], conflicts = [], riskLevel = 'low' } = req.body;
            if (!action || !displayName || !description || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Action, display name, description, and category are required',
                });
            }
            if (!/^[a-z0-9_-]+:[a-z0-9_-]+$/.test(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Action must follow format "resource:action" (e.g., "patient:read")',
                });
            }
            const existingPermission = await Permission_1.default.findOne({ action });
            if (existingPermission) {
                return res.status(409).json({
                    success: false,
                    message: 'Permission with this action already exists',
                });
            }
            if (dependencies.length > 0) {
                const validDependencies = await Permission_1.default.find({
                    action: { $in: dependencies },
                    isActive: true
                });
                const validDependencyActions = validDependencies.map(p => p.action);
                const invalidDependencies = dependencies.filter((dep) => !validDependencyActions.includes(dep));
                if (invalidDependencies.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid dependency permissions found',
                        invalidDependencies,
                    });
                }
            }
            if (conflicts.length > 0) {
                const validConflicts = await Permission_1.default.find({
                    action: { $in: conflicts },
                    isActive: true
                });
                const validConflictActions = validConflicts.map(p => p.action);
                const invalidConflicts = conflicts.filter((conflict) => !validConflictActions.includes(conflict));
                if (invalidConflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid conflict permissions found',
                        invalidConflicts,
                    });
                }
            }
            const permission = new Permission_1.default({
                action: action.toLowerCase(),
                displayName,
                description,
                category: category.toLowerCase(),
                requiredSubscriptionTier,
                requiredPlanFeatures,
                dependencies,
                conflicts,
                riskLevel,
                isActive: true,
                isSystemPermission: false,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id,
            });
            await permission.save();
            const populatedPermission = await Permission_1.default.findById(permission._id)
                .populate('createdBy', 'firstName lastName')
                .populate('lastModifiedBy', 'firstName lastName');
            logger_1.default.info('Permission created successfully', {
                permissionId: permission._id,
                action: permission.action,
                createdBy: req.user._id,
            });
            res.status(201).json({
                success: true,
                message: 'Permission created successfully',
                data: populatedPermission,
            });
        }
        catch (error) {
            logger_1.default.error('Error creating permission:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating permission',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async updatePermission(req, res) {
        try {
            const { action } = req.params;
            const { displayName, description, category, requiredSubscriptionTier, requiredPlanFeatures, dependencies, conflicts, riskLevel, isActive } = req.body;
            const permission = await Permission_1.default.findOne({ action });
            if (!permission) {
                return res.status(404).json({
                    success: false,
                    message: 'Permission not found',
                });
            }
            if (permission.isSystemPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'System permissions cannot be modified',
                });
            }
            if (dependencies && dependencies.length > 0) {
                const validDependencies = await Permission_1.default.find({
                    action: { $in: dependencies },
                    isActive: true
                });
                const validDependencyActions = validDependencies.map(p => p.action);
                const invalidDependencies = dependencies.filter((dep) => !validDependencyActions.includes(dep));
                if (invalidDependencies.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid dependency permissions found',
                        invalidDependencies,
                    });
                }
            }
            if (conflicts && conflicts.length > 0) {
                const validConflicts = await Permission_1.default.find({
                    action: { $in: conflicts },
                    isActive: true
                });
                const validConflictActions = validConflicts.map(p => p.action);
                const invalidConflicts = conflicts.filter((conflict) => !validConflictActions.includes(conflict));
                if (invalidConflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid conflict permissions found',
                        invalidConflicts,
                    });
                }
            }
            const updateData = {
                lastModifiedBy: req.user._id,
            };
            if (displayName !== undefined)
                updateData.displayName = displayName;
            if (description !== undefined)
                updateData.description = description;
            if (category !== undefined)
                updateData.category = category.toLowerCase();
            if (requiredSubscriptionTier !== undefined)
                updateData.requiredSubscriptionTier = requiredSubscriptionTier;
            if (requiredPlanFeatures !== undefined)
                updateData.requiredPlanFeatures = requiredPlanFeatures;
            if (dependencies !== undefined)
                updateData.dependencies = dependencies;
            if (conflicts !== undefined)
                updateData.conflicts = conflicts;
            if (riskLevel !== undefined)
                updateData.riskLevel = riskLevel;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            const updatedPermission = await Permission_1.default.findOneAndUpdate({ action }, updateData, { new: true, runValidators: true }).populate('createdBy', 'firstName lastName')
                .populate('lastModifiedBy', 'firstName lastName');
            await this.invalidatePermissionCaches(action);
            logger_1.default.info('Permission updated successfully', {
                permissionId: permission._id,
                action: permission.action,
                updatedBy: req.user._id,
                changes: updateData,
            });
            res.json({
                success: true,
                message: 'Permission updated successfully',
                data: updatedPermission,
            });
        }
        catch (error) {
            logger_1.default.error('Error updating permission:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating permission',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getPermissionCategories(req, res) {
        try {
            const { includeInactive = false } = req.query;
            const pipeline = [
                {
                    $match: includeInactive === 'true' ? {} : { isActive: true }
                },
                {
                    $group: {
                        _id: '$category',
                        totalCount: { $sum: 1 },
                        activeCount: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        },
                        systemCount: {
                            $sum: { $cond: [{ $eq: ['$isSystemPermission', true] }, 1, 0] }
                        },
                        riskLevels: { $push: '$riskLevel' },
                        subscriptionTiers: { $push: '$requiredSubscriptionTier' }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ];
            const categoryStats = await Permission_1.default.aggregate(pipeline);
            const processedStats = categoryStats.map(stat => {
                const riskLevelCounts = stat.riskLevels.reduce((acc, level) => {
                    if (level) {
                        acc[level] = (acc[level] || 0) + 1;
                    }
                    return acc;
                }, {});
                const tierCounts = stat.subscriptionTiers.reduce((acc, tier) => {
                    if (tier) {
                        acc[tier] = (acc[tier] || 0) + 1;
                    }
                    return acc;
                }, {});
                return {
                    category: stat._id,
                    totalCount: stat.totalCount,
                    activeCount: stat.activeCount,
                    systemCount: stat.systemCount,
                    riskLevelDistribution: riskLevelCounts,
                    subscriptionTierDistribution: tierCounts
                };
            });
            const categoriesWithSamples = await Promise.all(processedStats.map(async (stat) => {
                const samplePermissions = await Permission_1.default.find({
                    category: stat.category,
                    isActive: true
                })
                    .select('action displayName riskLevel')
                    .limit(5)
                    .sort({ action: 1 });
                return {
                    ...stat,
                    samplePermissions
                };
            }));
            res.json({
                success: true,
                data: {
                    categories: categoriesWithSamples,
                    totalCategories: categoriesWithSamples.length,
                    summary: {
                        totalPermissions: categoriesWithSamples.reduce((sum, cat) => sum + cat.totalCount, 0),
                        activePermissions: categoriesWithSamples.reduce((sum, cat) => sum + cat.activeCount, 0),
                        systemPermissions: categoriesWithSamples.reduce((sum, cat) => sum + cat.systemCount, 0)
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permission categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permission categories',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getPermissionDependencies(req, res) {
        try {
            const { action } = req.query;
            let query = { isActive: true };
            if (action) {
                query.action = action;
            }
            const permissions = await Permission_1.default.find(query)
                .select('action displayName dependencies conflicts riskLevel category');
            const dependencyGraph = {};
            permissions.forEach(permission => {
                dependencyGraph[permission.action] = {
                    permission,
                    dependsOn: permission.dependencies || [],
                    requiredBy: [],
                    conflictsWith: permission.conflicts || [],
                    conflictedBy: []
                };
            });
            permissions.forEach(permission => {
                if (permission.dependencies) {
                    permission.dependencies.forEach(dep => {
                        if (dependencyGraph[dep]) {
                            dependencyGraph[dep].requiredBy.push(permission.action);
                        }
                    });
                }
                if (permission.conflicts) {
                    permission.conflicts.forEach(conflict => {
                        if (dependencyGraph[conflict]) {
                            dependencyGraph[conflict].conflictedBy.push(permission.action);
                        }
                    });
                }
            });
            const circularDependencies = [];
            const visited = new Set();
            const recursionStack = new Set();
            const detectCircular = (permissionAction, path) => {
                if (recursionStack.has(permissionAction)) {
                    const cycleStart = path.indexOf(permissionAction);
                    if (cycleStart !== -1) {
                        circularDependencies.push(path.slice(cycleStart));
                    }
                    return;
                }
                if (visited.has(permissionAction)) {
                    return;
                }
                visited.add(permissionAction);
                recursionStack.add(permissionAction);
                const node = dependencyGraph[permissionAction];
                if (node) {
                    node.dependsOn.forEach(dep => {
                        detectCircular(dep, [...path, permissionAction]);
                    });
                }
                recursionStack.delete(permissionAction);
            };
            Object.keys(dependencyGraph).forEach(permissionAction => {
                if (!visited.has(permissionAction)) {
                    detectCircular(permissionAction, []);
                }
            });
            const orphanedPermissions = Object.keys(dependencyGraph).filter(action => {
                const node = dependencyGraph[action];
                return node && node.dependsOn.length === 0 && node.requiredBy.length === 0;
            });
            const highlyConnected = Object.keys(dependencyGraph)
                .map(action => {
                const node = dependencyGraph[action];
                return {
                    action,
                    totalConnections: node ? (node.dependsOn.length +
                        node.requiredBy.length +
                        node.conflictsWith.length +
                        node.conflictedBy.length) : 0
                };
            })
                .filter(item => item.totalConnections > 0)
                .sort((a, b) => b.totalConnections - a.totalConnections)
                .slice(0, 10);
            res.json({
                success: true,
                data: {
                    dependencyGraph: action ?
                        (dependencyGraph[action] ? { [action]: dependencyGraph[action] } : {}) :
                        dependencyGraph,
                    analysis: {
                        circularDependencies,
                        orphanedPermissions,
                        highlyConnected,
                        totalPermissions: permissions.length,
                        permissionsWithDependencies: Object.values(dependencyGraph).filter(node => node.dependsOn.length > 0).length,
                        permissionsWithConflicts: Object.values(dependencyGraph).filter(node => node.conflictsWith.length > 0).length
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permission dependencies:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permission dependencies',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async getPermissionUsage(req, res) {
        try {
            const { action } = req.params;
            const permission = await Permission_1.default.findOne({ action });
            if (!permission) {
                return res.status(404).json({
                    success: false,
                    message: 'Permission not found',
                });
            }
            const rolesWithPermission = await this.roleHierarchyService.getRolesWithPermission(action);
            const roleIds = rolesWithPermission.map(r => r.role._id);
            const roleAssignments = await mongoose_1.default.model('UserRole').find({
                roleId: { $in: roleIds },
                isActive: true
            }).populate('userId', 'firstName lastName email role status');
            const usersWithDirectPermission = await mongoose_1.default.model('User').find({
                directPermissions: action,
                status: 'active'
            }).select('firstName lastName email role status');
            const usersWithDenial = await mongoose_1.default.model('User').find({
                deniedPermissions: action
            }).select('firstName lastName email role status');
            const uniqueUserIds = new Set();
            roleAssignments.forEach((assignment) => {
                if (assignment.userId) {
                    uniqueUserIds.add(assignment.userId._id.toString());
                }
            });
            usersWithDirectPermission.forEach(user => {
                uniqueUserIds.add(user._id.toString());
            });
            const usageStats = {
                totalUniqueUsers: uniqueUserIds.size,
                roleBasedUsers: roleAssignments.length,
                directAssignmentUsers: usersWithDirectPermission.length,
                deniedUsers: usersWithDenial.length,
                rolesUsingPermission: rolesWithPermission.length
            };
            res.json({
                success: true,
                data: {
                    permission: {
                        action: permission.action,
                        displayName: permission.displayName,
                        category: permission.category,
                        riskLevel: permission.riskLevel
                    },
                    usage: usageStats,
                    rolesWithPermission: rolesWithPermission.map(r => ({
                        role: {
                            id: r.role._id,
                            name: r.role.name,
                            displayName: r.role.displayName,
                            category: r.role.category
                        },
                        source: r.source,
                        inheritedFrom: r.inheritedFrom ? {
                            id: r.inheritedFrom._id,
                            name: r.inheritedFrom.name,
                            displayName: r.inheritedFrom.displayName
                        } : undefined
                    })),
                    directAssignments: usersWithDirectPermission.map(user => ({
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    })),
                    denials: usersWithDenial.map(user => ({
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    }))
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permission usage:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permission usage',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async validatePermissions(req, res) {
        try {
            const { permissions } = req.body;
            if (!permissions || !Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissions array is required',
                });
            }
            const validationResults = [];
            for (const permissionAction of permissions) {
                const permission = await Permission_1.default.findOne({
                    action: permissionAction,
                    isActive: true
                });
                const issues = [];
                const suggestions = [];
                if (!permission) {
                    issues.push('Permission does not exist');
                    suggestions.push('Create the permission or check the action name');
                    validationResults.push({
                        permission: permissionAction,
                        isValid: false,
                        issues,
                        suggestions
                    });
                    continue;
                }
                if (permission.dependencies && permission.dependencies.length > 0) {
                    const missingDependencies = [];
                    for (const dep of permission.dependencies) {
                        if (!permissions.includes(dep)) {
                            missingDependencies.push(dep);
                        }
                    }
                    if (missingDependencies.length > 0) {
                        issues.push(`Missing required dependencies: ${missingDependencies.join(', ')}`);
                        suggestions.push(`Add dependencies: ${missingDependencies.join(', ')}`);
                    }
                }
                if (permission.conflicts && permission.conflicts.length > 0) {
                    const conflictingPermissions = permission.conflicts.filter(conflict => permissions.includes(conflict));
                    if (conflictingPermissions.length > 0) {
                        issues.push(`Conflicts with: ${conflictingPermissions.join(', ')}`);
                        suggestions.push(`Remove conflicting permissions: ${conflictingPermissions.join(', ')}`);
                    }
                }
                validationResults.push({
                    permission: permissionAction,
                    isValid: issues.length === 0,
                    issues,
                    suggestions
                });
            }
            const overallValid = validationResults.every(result => result.isValid);
            const totalIssues = validationResults.reduce((sum, result) => sum + result.issues.length, 0);
            res.json({
                success: true,
                data: {
                    isValid: overallValid,
                    totalPermissions: permissions.length,
                    validPermissions: validationResults.filter(r => r.isValid).length,
                    totalIssues,
                    results: validationResults,
                    summary: {
                        hasConflicts: validationResults.some(r => r.issues.some(issue => issue.includes('Conflicts with'))),
                        hasMissingDependencies: validationResults.some(r => r.issues.some(issue => issue.includes('Missing required dependencies'))),
                        hasInvalidPermissions: validationResults.some(r => r.issues.some(issue => issue.includes('does not exist')))
                    }
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error validating permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error validating permissions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    async invalidatePermissionCaches(permissionAction) {
        try {
            const rolePermissions = await RolePermission_1.default.find({
                permissionAction,
                isActive: true
            });
            const roleIds = rolePermissions.map(rp => rp.roleId);
            for (const roleId of roleIds) {
                await this.dynamicPermissionService.invalidateRoleCache(roleId);
            }
            const rolesWithLegacyPermission = await Role_1.default.find({
                permissions: permissionAction,
                isActive: true
            });
            for (const role of rolesWithLegacyPermission) {
                await this.dynamicPermissionService.invalidateRoleCache(role._id);
            }
        }
        catch (error) {
            logger_1.default.error('Error invalidating permission caches:', error);
        }
    }
}
exports.PermissionController = PermissionController;
exports.permissionController = new PermissionController();
//# sourceMappingURL=permissionController.js.map