"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoleMigrator = void 0;
exports.migrateUserRoles = migrateUserRoles;
exports.rollbackUserRoleMigration = rollbackUserRoleMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../../models/User"));
const Role_1 = __importDefault(require("../../models/Role"));
const UserRole_1 = __importDefault(require("../../models/UserRole"));
const logger_1 = __importDefault(require("../../utils/logger"));
class UserRoleMigrator {
    constructor() {
        this.migrationResults = [];
        this.systemUserId = new mongoose_1.default.Types.ObjectId();
    }
    async migrate() {
        try {
            logger_1.default.info('Starting user role migration...');
            const users = await User_1.default.find({
                $or: [
                    { role: { $exists: true, $ne: null } },
                    { workplaceRole: { $exists: true, $ne: null } }
                ]
            });
            logger_1.default.info(`Found ${users.length} users to migrate`);
            for (const user of users) {
                await this.migrateUser(user);
            }
            await this.validateMigration();
            this.generateMigrationReport();
            logger_1.default.info('User role migration completed successfully');
            return this.migrationResults;
        }
        catch (error) {
            logger_1.default.error('Error during user role migration:', error);
            throw error;
        }
    }
    async migrateUser(user) {
        const migrationResult = {
            userId: user._id,
            email: user.email,
            staticRole: user.role,
            staticWorkplaceRole: user.workplaceRole,
            assignedRoles: [],
            directPermissions: [],
            success: false,
            errors: []
        };
        try {
            const session = await mongoose_1.default.startSession();
            await session.withTransaction(async () => {
                if (user.role) {
                    await this.migrateSystemRole(user, migrationResult, session);
                }
                if (user.workplaceRole) {
                    await this.migrateWorkplaceRole(user, migrationResult, session);
                }
                if (user.permissions && user.permissions.length > 0) {
                    await this.migrateDirectPermissions(user, migrationResult, session);
                }
                await this.updateUserDocument(user, migrationResult, session);
                migrationResult.success = true;
            });
            await session.endSession();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            migrationResult.errors.push(errorMessage);
            logger_1.default.error(`Error migrating user ${user.email}:`, error);
        }
        this.migrationResults.push(migrationResult);
    }
    async migrateSystemRole(user, result, session) {
        const systemRole = await Role_1.default.findOne({
            name: user.role,
            category: 'system',
            isActive: true
        }).session(session);
        if (!systemRole) {
            result.errors.push(`System role '${user.role}' not found in dynamic roles`);
            return;
        }
        const existingAssignment = await UserRole_1.default.findOne({
            userId: user._id,
            roleId: systemRole._id,
            isActive: true
        }).session(session);
        if (existingAssignment) {
            result.assignedRoles.push(systemRole.name);
            return;
        }
        const userRole = new UserRole_1.default({
            userId: user._id,
            roleId: systemRole._id,
            workspaceId: user.workplaceId,
            isTemporary: false,
            isActive: true,
            assignedBy: this.systemUserId,
            assignedAt: new Date(),
            lastModifiedBy: this.systemUserId,
            assignmentReason: 'Migrated from static role assignment',
            assignmentContext: {
                migrationType: 'system_role',
                originalRole: user.role,
                migrationDate: new Date()
            }
        });
        await userRole.save({ session });
        result.assignedRoles.push(systemRole.name);
        logger_1.default.debug(`Migrated system role ${user.role} for user ${user.email}`);
    }
    async migrateWorkplaceRole(user, result, session) {
        const workplaceRoleMap = {
            'Owner': 'workplace_owner',
            'Pharmacist': 'workplace_pharmacist',
            'Staff': 'workplace_staff',
            'Technician': 'workplace_technician',
            'Cashier': 'workplace_cashier',
            'Assistant': 'workplace_assistant'
        };
        const dynamicRoleName = workplaceRoleMap[user.workplaceRole];
        if (!dynamicRoleName) {
            result.errors.push(`Unknown workplace role '${user.workplaceRole}'`);
            return;
        }
        const workplaceRole = await Role_1.default.findOne({
            name: dynamicRoleName,
            category: 'workplace',
            isActive: true
        }).session(session);
        if (!workplaceRole) {
            result.errors.push(`Workplace role '${dynamicRoleName}' not found in dynamic roles`);
            return;
        }
        const existingAssignment = await UserRole_1.default.findOne({
            userId: user._id,
            roleId: workplaceRole._id,
            workspaceId: user.workplaceId,
            isActive: true
        }).session(session);
        if (existingAssignment) {
            result.assignedRoles.push(workplaceRole.name);
            return;
        }
        const userRole = new UserRole_1.default({
            userId: user._id,
            roleId: workplaceRole._id,
            workspaceId: user.workplaceId,
            isTemporary: false,
            isActive: true,
            assignedBy: this.systemUserId,
            assignedAt: new Date(),
            lastModifiedBy: this.systemUserId,
            assignmentReason: 'Migrated from static workplace role assignment',
            assignmentContext: {
                migrationType: 'workplace_role',
                originalRole: user.workplaceRole,
                migrationDate: new Date()
            }
        });
        await userRole.save({ session });
        result.assignedRoles.push(workplaceRole.name);
        logger_1.default.debug(`Migrated workplace role ${user.workplaceRole} for user ${user.email}`);
    }
    async migrateDirectPermissions(user, result, session) {
        const rolePermissions = await this.getRolePermissions(user, session);
        const directPermissions = user.permissions.filter((permission) => !rolePermissions.includes(permission));
        if (directPermissions.length > 0) {
            result.directPermissions = directPermissions;
            logger_1.default.debug(`Migrated ${directPermissions.length} direct permissions for user ${user.email}`);
        }
    }
    async getRolePermissions(user, session) {
        const allPermissions = new Set();
        if (user.role) {
            const systemRole = await Role_1.default.findOne({
                name: user.role,
                category: 'system',
                isActive: true
            }).session(session);
            if (systemRole) {
                const rolePermissions = await systemRole.getAllPermissions();
                rolePermissions.forEach((permission) => allPermissions.add(permission));
            }
        }
        if (user.workplaceRole) {
            const workplaceRoleMap = {
                'Owner': 'workplace_owner',
                'Pharmacist': 'workplace_pharmacist',
                'Staff': 'workplace_staff',
                'Technician': 'workplace_technician',
                'Cashier': 'workplace_cashier',
                'Assistant': 'workplace_assistant'
            };
            const dynamicRoleName = workplaceRoleMap[user.workplaceRole];
            if (dynamicRoleName) {
                const workplaceRole = await Role_1.default.findOne({
                    name: dynamicRoleName,
                    category: 'workplace',
                    isActive: true
                }).session(session);
                if (workplaceRole) {
                    const rolePermissions = await workplaceRole.getAllPermissions();
                    rolePermissions.forEach((permission) => allPermissions.add(permission));
                }
            }
        }
        return Array.from(allPermissions);
    }
    async updateUserDocument(user, result, session) {
        const assignedRoleIds = [];
        for (const roleName of result.assignedRoles) {
            const role = await Role_1.default.findOne({ name: roleName, isActive: true }).session(session);
            if (role) {
                assignedRoleIds.push(role._id);
            }
        }
        await User_1.default.findByIdAndUpdate(user._id, {
            $set: {
                assignedRoles: assignedRoleIds,
                directPermissions: result.directPermissions,
                deniedPermissions: [],
                roleLastModifiedBy: this.systemUserId,
                roleLastModifiedAt: new Date(),
                cachedPermissions: undefined
            }
        }, { session });
        logger_1.default.debug(`Updated user document for ${user.email}`);
    }
    async validateMigration() {
        logger_1.default.info('Validating user role migration...');
        const successfulMigrations = this.migrationResults.filter(r => r.success);
        const failedMigrations = this.migrationResults.filter(r => !r.success);
        for (const result of successfulMigrations) {
            const user = await User_1.default.findById(result.userId);
            if (!user) {
                throw new Error(`User ${result.email} not found after migration`);
            }
            const userRoles = await UserRole_1.default.find({
                userId: result.userId,
                isActive: true
            }).populate('roleId');
            const assignedRoleNames = userRoles.map((ur) => ur.roleId.name);
            for (const expectedRole of result.assignedRoles) {
                if (!assignedRoleNames.includes(expectedRole)) {
                    throw new Error(`Role assignment ${expectedRole} missing for user ${result.email}`);
                }
            }
            if (result.directPermissions.length > 0) {
                const userDirectPermissions = user.directPermissions || [];
                for (const expectedPermission of result.directPermissions) {
                    if (!userDirectPermissions.includes(expectedPermission)) {
                        throw new Error(`Direct permission ${expectedPermission} missing for user ${result.email}`);
                    }
                }
            }
        }
        logger_1.default.info(`Migration validation completed - Success: ${successfulMigrations.length}, Failed: ${failedMigrations.length}`);
    }
    generateMigrationReport() {
        const successful = this.migrationResults.filter(r => r.success).length;
        const failed = this.migrationResults.filter(r => !r.success).length;
        const totalRolesAssigned = this.migrationResults.reduce((sum, r) => sum + r.assignedRoles.length, 0);
        const totalDirectPermissions = this.migrationResults.reduce((sum, r) => sum + r.directPermissions.length, 0);
        logger_1.default.info('=== USER ROLE MIGRATION REPORT ===');
        logger_1.default.info(`Total users processed: ${this.migrationResults.length}`);
        logger_1.default.info(`Successful migrations: ${successful}`);
        logger_1.default.info(`Failed migrations: ${failed}`);
        logger_1.default.info(`Total roles assigned: ${totalRolesAssigned}`);
        logger_1.default.info(`Total direct permissions migrated: ${totalDirectPermissions}`);
        if (failed > 0) {
            logger_1.default.warn('Failed migrations:');
            this.migrationResults
                .filter(r => !r.success)
                .forEach(r => {
                logger_1.default.warn(`- ${r.email}: ${r.errors.join(', ')}`);
            });
        }
        logger_1.default.info('=== END MIGRATION REPORT ===');
    }
    async rollbackUser(userId) {
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                await UserRole_1.default.deleteMany({
                    userId,
                    assignmentReason: { $regex: /migrated from static/i }
                }, { session });
                await User_1.default.findByIdAndUpdate(userId, {
                    $unset: {
                        assignedRoles: 1,
                        directPermissions: 1,
                        deniedPermissions: 1,
                        roleLastModifiedBy: 1,
                        roleLastModifiedAt: 1,
                        cachedPermissions: 1
                    }
                }, { session });
            });
            logger_1.default.info(`Rolled back migration for user ${userId}`);
        }
        finally {
            await session.endSession();
        }
    }
    async rollbackAll() {
        logger_1.default.info('Rolling back user role migration...');
        const result = await UserRole_1.default.deleteMany({
            assignmentReason: { $regex: /migrated from static/i }
        });
        await User_1.default.updateMany({
            $or: [
                { assignedRoles: { $exists: true } },
                { directPermissions: { $exists: true } },
                { deniedPermissions: { $exists: true } }
            ]
        }, {
            $unset: {
                assignedRoles: 1,
                directPermissions: 1,
                deniedPermissions: 1,
                roleLastModifiedBy: 1,
                roleLastModifiedAt: 1,
                cachedPermissions: 1
            }
        });
        logger_1.default.info(`Rollback completed - Removed ${result.deletedCount} role assignments`);
    }
}
exports.UserRoleMigrator = UserRoleMigrator;
async function migrateUserRoles() {
    const migrator = new UserRoleMigrator();
    return await migrator.migrate();
}
async function rollbackUserRoleMigration() {
    const migrator = new UserRoleMigrator();
    await migrator.rollbackAll();
}
if (require.main === module) {
    const command = process.argv[2];
    mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
        .then(async () => {
        if (command === 'rollback') {
            await rollbackUserRoleMigration();
        }
        else {
            await migrateUserRoles();
        }
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=002-migrate-user-roles.js.map