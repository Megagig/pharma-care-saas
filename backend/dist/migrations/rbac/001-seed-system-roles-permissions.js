"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemRolePermissionSeeder = void 0;
exports.seedSystemRolesAndPermissions = seedSystemRolesAndPermissions;
const mongoose_1 = __importDefault(require("mongoose"));
const Role_1 = __importDefault(require("../../models/Role"));
const Permission_1 = __importDefault(require("../../models/Permission"));
const RolePermission_1 = __importDefault(require("../../models/RolePermission"));
const permissionMatrix_1 = require("../../config/permissionMatrix");
const logger_1 = __importDefault(require("../../utils/logger"));
class SystemRolePermissionSeeder {
    constructor() {
        this.systemUserId = new mongoose_1.default.Types.ObjectId();
    }
    async seed() {
        try {
            logger_1.default.info('Starting system roles and permissions seeding...');
            await this.seedPermissions();
            await this.seedSystemRoles();
            await this.seedWorkplaceRoles();
            await this.seedRolePermissions();
            await this.validateSeededData();
            logger_1.default.info('System roles and permissions seeding completed successfully');
        }
        catch (error) {
            logger_1.default.error('Error during system roles and permissions seeding:', error);
            throw error;
        }
    }
    async seedPermissions() {
        logger_1.default.info('Seeding permissions from static matrix...');
        const permissions = [];
        for (const [action, config] of Object.entries(permissionMatrix_1.PERMISSION_MATRIX)) {
            const [resource, operation] = action.split('.');
            if (!resource || !operation) {
                logger_1.default.warn(`Invalid action format: ${action}`);
                continue;
            }
            permissions.push({
                action,
                displayName: this.generateDisplayName(action),
                description: this.generateDescription(action, config),
                category: this.categorizePermission(resource),
                riskLevel: this.assessRiskLevel(action, config),
                requiredSubscriptionTier: config.planTiers?.[0],
                requiredPlanFeatures: config.features,
                dependencies: this.extractDependencies(action),
                conflicts: this.extractConflicts(action),
                isSystemPermission: true
            });
        }
        for (const permissionDef of permissions) {
            try {
                const existingPermission = await Permission_1.default.findOne({ action: permissionDef.action });
                if (!existingPermission) {
                    await Permission_1.default.create({
                        ...permissionDef,
                        createdBy: this.systemUserId,
                        lastModifiedBy: this.systemUserId,
                        isActive: true
                    });
                    logger_1.default.debug(`Created permission: ${permissionDef.action}`);
                }
                else {
                    logger_1.default.debug(`Permission already exists: ${permissionDef.action}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Error creating permission ${permissionDef.action}:`, error);
                throw error;
            }
        }
        logger_1.default.info(`Seeded ${permissions.length} permissions`);
    }
    async seedSystemRoles() {
        logger_1.default.info('Seeding system roles...');
        const systemRoles = [
            {
                name: 'super_admin',
                displayName: 'Super Administrator',
                description: 'Full system access with all permissions',
                category: 'system',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: ['*']
            },
            {
                name: 'owner',
                displayName: 'Pharmacy Owner',
                description: 'Pharmacy owner with full workspace management capabilities',
                category: 'system',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForSystemRole('owner')
            },
            {
                name: 'pharmacist',
                displayName: 'Licensed Pharmacist',
                description: 'Licensed pharmacist with clinical and patient management permissions',
                category: 'system',
                parentRole: 'owner',
                isSystemRole: true,
                isDefault: true,
                staticPermissions: this.getPermissionsForSystemRole('pharmacist')
            },
            {
                name: 'pharmacy_team',
                displayName: 'Pharmacy Team Member',
                description: 'Team member with limited administrative permissions',
                category: 'system',
                parentRole: 'pharmacist',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForSystemRole('pharmacy_team')
            },
            {
                name: 'pharmacy_outlet',
                displayName: 'Pharmacy Outlet Manager',
                description: 'Outlet manager with location-specific permissions',
                category: 'system',
                parentRole: 'pharmacy_team',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForSystemRole('pharmacy_outlet')
            },
            {
                name: 'intern_pharmacist',
                displayName: 'Intern Pharmacist',
                description: 'Intern pharmacist with supervised clinical permissions',
                category: 'system',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForSystemRole('intern_pharmacist')
            }
        ];
        for (const roleDef of systemRoles) {
            try {
                const existingRole = await Role_1.default.findOne({ name: roleDef.name });
                if (!existingRole) {
                    let parentRoleId;
                    if (roleDef.parentRole) {
                        const parentRole = await Role_1.default.findOne({ name: roleDef.parentRole });
                        if (parentRole) {
                            parentRoleId = parentRole._id;
                        }
                    }
                    await Role_1.default.create({
                        name: roleDef.name,
                        displayName: roleDef.displayName,
                        description: roleDef.description,
                        category: roleDef.category,
                        parentRole: parentRoleId,
                        permissions: roleDef.staticPermissions,
                        isActive: true,
                        isSystemRole: roleDef.isSystemRole,
                        isDefault: roleDef.isDefault,
                        createdBy: this.systemUserId,
                        lastModifiedBy: this.systemUserId
                    });
                    logger_1.default.debug(`Created system role: ${roleDef.name}`);
                }
                else {
                    logger_1.default.debug(`System role already exists: ${roleDef.name}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Error creating system role ${roleDef.name}:`, error);
                throw error;
            }
        }
        logger_1.default.info(`Seeded ${systemRoles.length} system roles`);
    }
    async seedWorkplaceRoles() {
        logger_1.default.info('Seeding workplace roles...');
        const workplaceRoles = [
            {
                name: 'workplace_owner',
                displayName: 'Workplace Owner',
                description: 'Full workplace management and administrative permissions',
                category: 'workplace',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Owner')
            },
            {
                name: 'workplace_pharmacist',
                displayName: 'Workplace Pharmacist',
                description: 'Clinical and patient management permissions within workplace',
                category: 'workplace',
                parentRole: 'workplace_owner',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Pharmacist')
            },
            {
                name: 'workplace_staff',
                displayName: 'Workplace Staff',
                description: 'General staff permissions for daily operations',
                category: 'workplace',
                parentRole: 'workplace_pharmacist',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Staff')
            },
            {
                name: 'workplace_technician',
                displayName: 'Workplace Technician',
                description: 'Technical support and medication management permissions',
                category: 'workplace',
                parentRole: 'workplace_staff',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Technician')
            },
            {
                name: 'workplace_cashier',
                displayName: 'Workplace Cashier',
                description: 'Point of sale and basic customer service permissions',
                category: 'workplace',
                parentRole: 'workplace_technician',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Cashier')
            },
            {
                name: 'workplace_assistant',
                displayName: 'Workplace Assistant',
                description: 'Basic operational support permissions',
                category: 'workplace',
                parentRole: 'workplace_cashier',
                isSystemRole: true,
                isDefault: false,
                staticPermissions: this.getPermissionsForWorkplaceRole('Assistant')
            }
        ];
        for (const roleDef of workplaceRoles) {
            try {
                const existingRole = await Role_1.default.findOne({ name: roleDef.name });
                if (!existingRole) {
                    let parentRoleId;
                    if (roleDef.parentRole) {
                        const parentRole = await Role_1.default.findOne({ name: roleDef.parentRole });
                        if (parentRole) {
                            parentRoleId = parentRole._id;
                        }
                    }
                    await Role_1.default.create({
                        name: roleDef.name,
                        displayName: roleDef.displayName,
                        description: roleDef.description,
                        category: roleDef.category,
                        parentRole: parentRoleId,
                        permissions: roleDef.staticPermissions,
                        isActive: true,
                        isSystemRole: roleDef.isSystemRole,
                        isDefault: roleDef.isDefault,
                        createdBy: this.systemUserId,
                        lastModifiedBy: this.systemUserId
                    });
                    logger_1.default.debug(`Created workplace role: ${roleDef.name}`);
                }
                else {
                    logger_1.default.debug(`Workplace role already exists: ${roleDef.name}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Error creating workplace role ${roleDef.name}:`, error);
                throw error;
            }
        }
        logger_1.default.info(`Seeded ${workplaceRoles.length} workplace roles`);
    }
    async seedRolePermissions() {
        logger_1.default.info('Seeding role-permission mappings...');
        const roles = await Role_1.default.find({ isSystemRole: true, isActive: true });
        let mappingCount = 0;
        for (const role of roles) {
            if (role.name === 'super_admin') {
                const allPermissions = await Permission_1.default.find({ isActive: true });
                for (const permission of allPermissions) {
                    try {
                        const existingMapping = await RolePermission_1.default.findOne({
                            roleId: role._id,
                            permissionAction: permission.action
                        });
                        if (!existingMapping) {
                            await RolePermission_1.default.create({
                                roleId: role._id,
                                permissionAction: permission.action,
                                granted: true,
                                isActive: true,
                                priority: 100,
                                grantedBy: this.systemUserId,
                                lastModifiedBy: this.systemUserId
                            });
                            mappingCount++;
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error creating role-permission mapping for ${role.name} - ${permission.action}:`, error);
                    }
                }
            }
            else {
                for (const permissionAction of role.permissions) {
                    if (permissionAction === '*')
                        continue;
                    try {
                        const existingMapping = await RolePermission_1.default.findOne({
                            roleId: role._id,
                            permissionAction
                        });
                        if (!existingMapping) {
                            await RolePermission_1.default.create({
                                roleId: role._id,
                                permissionAction,
                                granted: true,
                                isActive: true,
                                priority: this.calculateRolePriority(role.name),
                                grantedBy: this.systemUserId,
                                lastModifiedBy: this.systemUserId
                            });
                            mappingCount++;
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error creating role-permission mapping for ${role.name} - ${permissionAction}:`, error);
                    }
                }
            }
        }
        logger_1.default.info(`Seeded ${mappingCount} role-permission mappings`);
    }
    async validateSeededData() {
        logger_1.default.info('Validating seeded data...');
        const permissionCount = await Permission_1.default.countDocuments({ isSystemPermission: true, isActive: true });
        const roleCount = await Role_1.default.countDocuments({ isSystemRole: true, isActive: true });
        const mappingCount = await RolePermission_1.default.countDocuments({ isActive: true });
        const roles = await Role_1.default.find({ isSystemRole: true, isActive: true }).populate('parentRole');
        for (const role of roles) {
            if (role.parentRole && !role.parentRole.isActive) {
                throw new Error(`Role ${role.name} has inactive parent role`);
            }
        }
        const permissions = await Permission_1.default.find({ isSystemPermission: true, isActive: true });
        for (const permission of permissions) {
            for (const dependency of permission.dependencies) {
                const dependentPermission = await Permission_1.default.findOne({ action: dependency, isActive: true });
                if (!dependentPermission) {
                    logger_1.default.warn(`Permission ${permission.action} has missing dependency: ${dependency}`);
                }
            }
        }
        logger_1.default.info(`Validation completed - Permissions: ${permissionCount}, Roles: ${roleCount}, Mappings: ${mappingCount}`);
    }
    generateDisplayName(action) {
        const [resource, operation] = action.split('.');
        if (!resource || !operation) {
            return action;
        }
        const resourceName = resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const operationName = operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${resourceName} - ${operationName}`;
    }
    generateDescription(action, config) {
        const [resource, operation] = action.split('.');
        if (!resource || !operation) {
            return `Permission for ${action}`;
        }
        const baseDescription = `Permission to ${operation} ${resource.replace(/_/g, ' ')}`;
        if (config.planTiers?.length > 0) {
            return `${baseDescription} (requires ${config.planTiers[0]}+ plan)`;
        }
        return baseDescription;
    }
    categorizePermission(resource) {
        const categoryMap = {
            'patient': 'patient',
            'medication': 'medication',
            'clinical': 'clinical',
            'clinical_notes': 'clinical',
            'clinical_intervention': 'clinical',
            'reports': 'reports',
            'admin': 'administration',
            'workspace': 'workspace',
            'subscription': 'subscription',
            'billing': 'billing',
            'team': 'user_management',
            'invitation': 'user_management',
            'audit': 'audit',
            'api': 'integration',
            'integration': 'integration',
            'backup': 'system',
            'location': 'workspace',
            'adr': 'clinical'
        };
        return categoryMap[resource] || 'system';
    }
    assessRiskLevel(action, config) {
        if (action.includes('delete') || action.includes('admin'))
            return 'critical';
        if (action.includes('update') || action.includes('manage'))
            return 'high';
        if (action.includes('create') || action.includes('export'))
            return 'medium';
        return 'low';
    }
    extractDependencies(action) {
        const dependencyMap = {
            'patient.update': ['patient.read'],
            'patient.delete': ['patient.read', 'patient.update'],
            'clinical_notes.update': ['clinical_notes.read'],
            'clinical_notes.delete': ['clinical_notes.read'],
            'medication.update': ['medication.read'],
            'medication.delete': ['medication.read']
        };
        return dependencyMap[action] || [];
    }
    extractConflicts(action) {
        const conflictMap = {
            'workspace.delete': ['workspace.transfer'],
            'subscription.cancel': ['subscription.upgrade']
        };
        return conflictMap[action] || [];
    }
    getPermissionsForSystemRole(role) {
        const permissions = [];
        for (const [action, config] of Object.entries(permissionMatrix_1.PERMISSION_MATRIX)) {
            if (config.systemRoles?.includes(role)) {
                permissions.push(action);
            }
        }
        return permissions;
    }
    getPermissionsForWorkplaceRole(role) {
        const permissions = [];
        for (const [action, config] of Object.entries(permissionMatrix_1.PERMISSION_MATRIX)) {
            if (config.workplaceRoles?.includes(role)) {
                permissions.push(action);
            }
        }
        return permissions;
    }
    calculateRolePriority(roleName) {
        const priorityMap = {
            'super_admin': 100,
            'owner': 90,
            'workplace_owner': 85,
            'pharmacist': 80,
            'workplace_pharmacist': 75,
            'pharmacy_team': 70,
            'workplace_staff': 65,
            'pharmacy_outlet': 60,
            'workplace_technician': 55,
            'workplace_cashier': 50,
            'intern_pharmacist': 45,
            'workplace_assistant': 40
        };
        return priorityMap[roleName] || 30;
    }
}
exports.SystemRolePermissionSeeder = SystemRolePermissionSeeder;
async function seedSystemRolesAndPermissions() {
    const seeder = new SystemRolePermissionSeeder();
    await seeder.seed();
}
if (require.main === module) {
    mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
        .then(async () => {
        await seedSystemRolesAndPermissions();
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=001-seed-system-roles-permissions.js.map