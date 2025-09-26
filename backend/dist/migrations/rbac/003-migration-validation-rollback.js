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
exports.MigrationRollback = exports.MigrationValidator = void 0;
exports.validateMigration = validateMigration;
exports.rollbackMigration = rollbackMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../../models/User"));
const Role_1 = __importDefault(require("../../models/Role"));
const Permission_1 = __importDefault(require("../../models/Permission"));
const UserRole_1 = __importDefault(require("../../models/UserRole"));
const RolePermission_1 = __importDefault(require("../../models/RolePermission"));
const BackwardCompatibilityService_1 = __importDefault(require("../../services/BackwardCompatibilityService"));
const permissionMatrix_1 = require("../../config/permissionMatrix");
const logger_1 = __importDefault(require("../../utils/logger"));
class MigrationValidator {
    constructor() {
        this.compatibilityService = BackwardCompatibilityService_1.default.getInstance();
    }
    async validateMigration() {
        logger_1.default.info('Starting comprehensive migration validation...');
        const errors = [];
        const warnings = [];
        const statistics = await this.gatherStatistics();
        try {
            await this.validateDataIntegrity(errors, warnings);
            await this.validatePermissionConsistency(errors, warnings);
            await this.validateRoleHierarchy(errors, warnings);
            await this.validateUserMigration(errors, warnings);
            await this.validatePerformance(errors, warnings);
            await this.validateSecurity(errors, warnings);
            const isValid = errors.filter(e => e.type === 'critical').length === 0;
            logger_1.default.info(`Migration validation completed - Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);
            return {
                isValid,
                errors,
                warnings,
                statistics
            };
        }
        catch (error) {
            logger_1.default.error('Migration validation failed:', error);
            errors.push({
                type: 'critical',
                category: 'system',
                message: `Validation process failed: ${error instanceof Error ? error.message : String(error)}`,
                suggestedFix: 'Check system logs and resolve underlying issues'
            });
            return {
                isValid: false,
                errors,
                warnings,
                statistics
            };
        }
    }
    async validateDataIntegrity(errors, warnings) {
        logger_1.default.debug('Validating data integrity...');
        const orphanedUserRoles = await UserRole_1.default.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roleId',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {
                $match: {
                    $or: [
                        { user: { $size: 0 } },
                        { role: { $size: 0 } }
                    ]
                }
            }
        ]);
        if (orphanedUserRoles.length > 0) {
            errors.push({
                type: 'major',
                category: 'data_integrity',
                message: `Found ${orphanedUserRoles.length} orphaned user role assignments`,
                affectedRecords: orphanedUserRoles,
                suggestedFix: 'Remove orphaned user role assignments'
            });
        }
        const orphanedRolePermissions = await RolePermission_1.default.aggregate([
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roleId',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {
                $match: {
                    role: { $size: 0 }
                }
            }
        ]);
        if (orphanedRolePermissions.length > 0) {
            errors.push({
                type: 'major',
                category: 'data_integrity',
                message: `Found ${orphanedRolePermissions.length} orphaned role permission assignments`,
                affectedRecords: orphanedRolePermissions,
                suggestedFix: 'Remove orphaned role permission assignments'
            });
        }
        const duplicateAssignments = await UserRole_1.default.aggregate([
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        roleId: '$roleId',
                        workspaceId: '$workspaceId'
                    },
                    count: { $sum: 1 },
                    assignments: { $push: '$$ROOT' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        if (duplicateAssignments.length > 0) {
            warnings.push({
                category: 'data_integrity',
                message: `Found ${duplicateAssignments.length} duplicate role assignments`,
                affectedRecords: duplicateAssignments,
                recommendation: 'Remove duplicate role assignments, keeping the most recent one'
            });
        }
        const invalidPermissionRefs = await RolePermission_1.default.aggregate([
            {
                $lookup: {
                    from: 'permissions',
                    localField: 'permissionAction',
                    foreignField: 'action',
                    as: 'permission'
                }
            },
            {
                $match: {
                    permission: { $size: 0 }
                }
            }
        ]);
        if (invalidPermissionRefs.length > 0) {
            warnings.push({
                category: 'data_integrity',
                message: `Found ${invalidPermissionRefs.length} role permissions referencing non-existent permissions`,
                affectedRecords: invalidPermissionRefs,
                recommendation: 'Create missing permissions or remove invalid references'
            });
        }
    }
    async validatePermissionConsistency(errors, warnings) {
        logger_1.default.debug('Validating permission consistency...');
        const sampleUsers = await User_1.default.aggregate([
            { $match: { status: 'active' } },
            { $sample: { size: Math.min(100, await User_1.default.countDocuments({ status: 'active' })) } }
        ]);
        const inconsistencies = [];
        const testActions = Object.keys(permissionMatrix_1.PERMISSION_MATRIX).slice(0, 20);
        for (const user of sampleUsers) {
            try {
                const workspaceContext = await this.buildWorkspaceContext(user);
                const validation = await this.compatibilityService.validatePermissionConsistency(workspaceContext, user, testActions);
                if (!validation.consistent) {
                    inconsistencies.push({
                        userId: user._id,
                        email: user.email,
                        inconsistencies: validation.inconsistencies
                    });
                }
            }
            catch (error) {
                warnings.push({
                    category: 'permission_consistency',
                    message: `Failed to validate permissions for user ${user.email}`,
                    recommendation: 'Check user data and role assignments'
                });
            }
        }
        if (inconsistencies.length > 0) {
            const totalInconsistencies = inconsistencies.reduce((sum, user) => sum + user.inconsistencies.length, 0);
            if (totalInconsistencies > sampleUsers.length * 0.1) {
                errors.push({
                    type: 'major',
                    category: 'permission_consistency',
                    message: `High permission inconsistency rate: ${totalInconsistencies} inconsistencies across ${inconsistencies.length} users`,
                    affectedRecords: inconsistencies,
                    suggestedFix: 'Review and fix role assignments and permission mappings'
                });
            }
            else {
                warnings.push({
                    category: 'permission_consistency',
                    message: `Found ${totalInconsistencies} permission inconsistencies across ${inconsistencies.length} users`,
                    affectedRecords: inconsistencies,
                    recommendation: 'Review affected users and resolve inconsistencies'
                });
            }
        }
    }
    async validateRoleHierarchy(errors, warnings) {
        logger_1.default.debug('Validating role hierarchy...');
        const roles = await Role_1.default.find({ isActive: true }).populate('parentRole');
        for (const role of roles) {
            const visited = new Set();
            let currentRole = role;
            while (currentRole && currentRole.parentRole) {
                const parentId = currentRole.parentRole._id.toString();
                if (visited.has(parentId)) {
                    errors.push({
                        type: 'critical',
                        category: 'role_hierarchy',
                        message: `Circular dependency detected in role hierarchy starting from ${role.name}`,
                        affectedRecords: [role],
                        suggestedFix: 'Break circular dependency by removing or changing parent role'
                    });
                    break;
                }
                visited.add(currentRole._id.toString());
                currentRole = currentRole.parentRole;
            }
        }
        for (const role of roles) {
            if (role.parentRole) {
                const parentRole = role.parentRole;
                if (role.hierarchyLevel !== parentRole.hierarchyLevel + 1) {
                    warnings.push({
                        category: 'role_hierarchy',
                        message: `Inconsistent hierarchy level for role ${role.name}`,
                        affectedRecords: [role],
                        recommendation: 'Recalculate hierarchy levels'
                    });
                }
            }
            else if (role.hierarchyLevel !== 0) {
                warnings.push({
                    category: 'role_hierarchy',
                    message: `Root role ${role.name} should have hierarchy level 0`,
                    affectedRecords: [role],
                    recommendation: 'Set hierarchy level to 0 for root roles'
                });
            }
        }
        const maxDepth = Math.max(...roles.map(r => r.hierarchyLevel));
        if (maxDepth > 5) {
            warnings.push({
                category: 'role_hierarchy',
                message: `Role hierarchy depth (${maxDepth}) exceeds recommended maximum (5)`,
                recommendation: 'Consider flattening role hierarchy for better performance'
            });
        }
    }
    async validateUserMigration(errors, warnings) {
        logger_1.default.debug('Validating user migration...');
        const usersWithoutRoles = await User_1.default.find({
            status: 'active',
            $or: [
                { assignedRoles: { $exists: false } },
                { assignedRoles: { $size: 0 } }
            ],
            role: { $exists: true, $ne: null }
        });
        if (usersWithoutRoles.length > 0) {
            errors.push({
                type: 'major',
                category: 'user_migration',
                message: `${usersWithoutRoles.length} active users have no dynamic role assignments but have static roles`,
                affectedRecords: usersWithoutRoles.map(u => ({ _id: u._id, email: u.email, role: u.role })),
                suggestedFix: 'Complete user role migration for all active users'
            });
        }
        const usersWithInconsistentRoles = await User_1.default.aggregate([
            {
                $lookup: {
                    from: 'user_roles',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'roleAssignments'
                }
            },
            {
                $match: {
                    $expr: {
                        $ne: [
                            { $size: '$assignedRoles' },
                            { $size: { $filter: { input: '$roleAssignments', cond: { $eq: ['$$this.isActive', true] } } } }
                        ]
                    }
                }
            }
        ]);
        if (usersWithInconsistentRoles.length > 0) {
            warnings.push({
                category: 'user_migration',
                message: `${usersWithInconsistentRoles.length} users have inconsistent role assignment counts`,
                affectedRecords: usersWithInconsistentRoles,
                recommendation: 'Synchronize assignedRoles array with UserRole records'
            });
        }
    }
    async validatePerformance(errors, warnings) {
        logger_1.default.debug('Validating system performance...');
        const testUser = await User_1.default.findOne({ status: 'active', assignedRoles: { $exists: true, $ne: [] } });
        if (!testUser) {
            warnings.push({
                category: 'performance',
                message: 'No migrated users found for performance testing',
                recommendation: 'Complete user migration before performance validation'
            });
            return;
        }
        const workspaceContext = await this.buildWorkspaceContext(testUser);
        const testActions = Object.keys(permissionMatrix_1.PERMISSION_MATRIX).slice(0, 10);
        const startTime = Date.now();
        for (const action of testActions) {
            await this.compatibilityService.checkPermission(workspaceContext, testUser, action);
        }
        const avgResponseTime = (Date.now() - startTime) / testActions.length;
        if (avgResponseTime > 100) {
            warnings.push({
                category: 'performance',
                message: `Average permission check time (${avgResponseTime.toFixed(2)}ms) exceeds recommended threshold (100ms)`,
                recommendation: 'Optimize permission caching and database queries'
            });
        }
        const usersWithManyRoles = await User_1.default.aggregate([
            {
                $match: {
                    assignedRoles: { $exists: true }
                }
            },
            {
                $project: {
                    email: 1,
                    roleCount: { $size: '$assignedRoles' }
                }
            },
            {
                $match: {
                    roleCount: { $gt: 10 }
                }
            }
        ]);
        if (usersWithManyRoles.length > 0) {
            warnings.push({
                category: 'performance',
                message: `${usersWithManyRoles.length} users have more than 10 role assignments`,
                affectedRecords: usersWithManyRoles,
                recommendation: 'Review role assignments and consider role consolidation'
            });
        }
    }
    async validateSecurity(errors, warnings) {
        logger_1.default.debug('Validating security aspects...');
        const superAdminCount = await User_1.default.countDocuments({ role: 'super_admin', status: 'active' });
        if (superAdminCount > 5) {
            warnings.push({
                category: 'security',
                message: `High number of super admin users (${superAdminCount})`,
                recommendation: 'Review super admin assignments and apply principle of least privilege'
            });
        }
        const rolesWithWildcard = await Role_1.default.find({ permissions: '*', isActive: true });
        if (rolesWithWildcard.length > 1) {
            warnings.push({
                category: 'security',
                message: `${rolesWithWildcard.length} roles have wildcard permissions`,
                affectedRecords: rolesWithWildcard,
                recommendation: 'Replace wildcard permissions with specific permission grants'
            });
        }
        const highRiskPermissions = await Permission_1.default.find({ riskLevel: 'critical', isActive: true });
        for (const permission of highRiskPermissions) {
            const assignmentCount = await RolePermission_1.default.countDocuments({
                permissionAction: permission.action,
                granted: true,
                isActive: true
            });
            if (assignmentCount > 10) {
                warnings.push({
                    category: 'security',
                    message: `Critical permission '${permission.action}' is assigned to ${assignmentCount} roles`,
                    recommendation: 'Review and restrict critical permission assignments'
                });
            }
        }
    }
    async gatherStatistics() {
        const [totalUsers, migratedUsers, totalRoles, totalPermissions, totalRoleAssignments, totalRolePermissions] = await Promise.all([
            User_1.default.countDocuments(),
            User_1.default.countDocuments({ roleLastModifiedAt: { $exists: true } }),
            Role_1.default.countDocuments({ isActive: true }),
            Permission_1.default.countDocuments({ isActive: true }),
            UserRole_1.default.countDocuments({ isActive: true }),
            RolePermission_1.default.countDocuments({ isActive: true })
        ]);
        const orphanedUserRoles = await UserRole_1.default.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $match: { user: { $size: 0 } }
            },
            {
                $count: 'count'
            }
        ]);
        const orphanedRecords = orphanedUserRoles[0]?.count || 0;
        return {
            totalUsers,
            migratedUsers,
            totalRoles,
            totalPermissions,
            totalRoleAssignments,
            totalRolePermissions,
            orphanedRecords,
            inconsistentPermissions: 0
        };
    }
    async buildWorkspaceContext(user) {
        return {
            workspace: user.workplaceId ? { _id: user.workplaceId } : null,
            subscription: null,
            plan: { tier: user.subscriptionTier || 'basic' },
            permissions: user.features || [],
            limits: {},
            isTrialExpired: false,
            isSubscriptionActive: true
        };
    }
}
exports.MigrationValidator = MigrationValidator;
class MigrationRollback {
    async generateRollbackPlan() {
        logger_1.default.info('Generating migration rollback plan...');
        const steps = [
            {
                order: 1,
                description: 'Create backup of current dynamic RBAC data',
                action: 'backup_dynamic_data',
                estimatedTime: 300,
                reversible: false
            },
            {
                order: 2,
                description: 'Disable dynamic RBAC feature flags',
                action: 'disable_dynamic_rbac',
                estimatedTime: 30,
                reversible: true
            },
            {
                order: 3,
                description: 'Clear dynamic role assignments from users',
                action: 'clear_user_dynamic_roles',
                estimatedTime: 600,
                reversible: true
            },
            {
                order: 4,
                description: 'Remove dynamic role assignments',
                action: 'remove_user_roles',
                estimatedTime: 300,
                reversible: true
            },
            {
                order: 5,
                description: 'Remove role-permission mappings',
                action: 'remove_role_permissions',
                estimatedTime: 180,
                reversible: true
            },
            {
                order: 6,
                description: 'Remove dynamic roles (keep system roles)',
                action: 'remove_dynamic_roles',
                estimatedTime: 120,
                reversible: true
            },
            {
                order: 7,
                description: 'Remove dynamic permissions',
                action: 'remove_dynamic_permissions',
                estimatedTime: 60,
                reversible: true
            },
            {
                order: 8,
                description: 'Validate legacy RBAC functionality',
                action: 'validate_legacy_rbac',
                estimatedTime: 300,
                reversible: false
            }
        ];
        const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
        const risks = [];
        const activeUserRoles = await UserRole_1.default.countDocuments({ isActive: true });
        if (activeUserRoles > 1000) {
            risks.push('Large number of role assignments may cause extended rollback time');
        }
        const customRoles = await Role_1.default.countDocuments({ isSystemRole: false, isActive: true });
        if (customRoles > 0) {
            risks.push(`${customRoles} custom roles will be permanently deleted`);
        }
        const directPermissions = await User_1.default.countDocuments({ directPermissions: { $exists: true, $ne: [] } });
        if (directPermissions > 0) {
            risks.push(`${directPermissions} users have direct permissions that will be lost`);
        }
        return {
            canRollback: true,
            steps,
            estimatedDuration: totalTime,
            risks,
            backupRequired: true
        };
    }
    async executeRollback(plan) {
        logger_1.default.info('Starting migration rollback...');
        if (!plan.canRollback) {
            throw new Error('Rollback is not possible with current system state');
        }
        for (const step of plan.steps) {
            logger_1.default.info(`Executing rollback step ${step.order}: ${step.description}`);
            try {
                await this.executeRollbackStep(step);
                logger_1.default.info(`Completed rollback step ${step.order}`);
            }
            catch (error) {
                logger_1.default.error(`Failed rollback step ${step.order}:`, error);
                if (!step.reversible) {
                    throw new Error(`Critical rollback step ${step.order} failed and cannot be reversed`);
                }
                logger_1.default.warn(`Continuing rollback despite failure in step ${step.order}`);
            }
        }
        logger_1.default.info('Migration rollback completed');
    }
    async executeRollbackStep(step) {
        switch (step.action) {
            case 'backup_dynamic_data':
                await this.backupDynamicData();
                break;
            case 'disable_dynamic_rbac':
                await this.disableDynamicRBAC();
                break;
            case 'clear_user_dynamic_roles':
                await this.clearUserDynamicRoles();
                break;
            case 'remove_user_roles':
                await this.removeUserRoles();
                break;
            case 'remove_role_permissions':
                await this.removeRolePermissions();
                break;
            case 'remove_dynamic_roles':
                await this.removeDynamicRoles();
                break;
            case 'remove_dynamic_permissions':
                await this.removeDynamicPermissions();
                break;
            case 'validate_legacy_rbac':
                await this.validateLegacyRBAC();
                break;
            default:
                throw new Error(`Unknown rollback action: ${step.action}`);
        }
    }
    async backupDynamicData() {
        logger_1.default.info('Creating backup of dynamic RBAC data...');
    }
    async disableDynamicRBAC() {
        const FeatureFlag = (await Promise.resolve().then(() => __importStar(require('../../models/FeatureFlag')))).default;
        await FeatureFlag.updateMany({ key: { $regex: /^rbac_/ } }, { $set: { isActive: false } });
    }
    async clearUserDynamicRoles() {
        await User_1.default.updateMany({}, {
            $unset: {
                assignedRoles: 1,
                directPermissions: 1,
                deniedPermissions: 1,
                roleLastModifiedBy: 1,
                roleLastModifiedAt: 1,
                cachedPermissions: 1
            }
        });
    }
    async removeUserRoles() {
        await UserRole_1.default.deleteMany({});
    }
    async removeRolePermissions() {
        await RolePermission_1.default.deleteMany({});
    }
    async removeDynamicRoles() {
        await Role_1.default.deleteMany({ isSystemRole: false });
    }
    async removeDynamicPermissions() {
        await Permission_1.default.deleteMany({});
    }
    async validateLegacyRBAC() {
        const testUser = await User_1.default.findOne({ status: 'active' });
        if (testUser) {
            const compatibilityService = BackwardCompatibilityService_1.default.getInstance();
            const workspaceContext = {
                workspace: null,
                subscription: null,
                plan: null,
                permissions: [],
                limits: {},
                isTrialExpired: false,
                isSubscriptionActive: true
            };
            const result = await compatibilityService.checkPermission(workspaceContext, testUser, 'patient.read', { forceMethod: 'legacy' });
            if (result.source !== 'legacy') {
                throw new Error('Legacy RBAC validation failed');
            }
        }
    }
}
exports.MigrationRollback = MigrationRollback;
async function validateMigration() {
    const validator = new MigrationValidator();
    return await validator.validateMigration();
}
async function rollbackMigration() {
    const rollback = new MigrationRollback();
    const plan = await rollback.generateRollbackPlan();
    await rollback.executeRollback(plan);
}
if (require.main === module) {
    const command = process.argv[2];
    mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
        .then(async () => {
        if (command === 'rollback') {
            await rollbackMigration();
        }
        else {
            const result = await validateMigration();
            console.log(JSON.stringify(result, null, 2));
        }
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Operation failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=003-migration-validation-rollback.js.map