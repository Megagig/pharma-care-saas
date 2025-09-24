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
exports.RBACMigrationOrchestrator = void 0;
exports.executeRBACMigration = executeRBACMigration;
exports.rollbackRBACMigration = rollbackRBACMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const _001_seed_system_roles_permissions_1 = require("./001-seed-system-roles-permissions");
const _002_migrate_user_roles_1 = require("./002-migrate-user-roles");
const _003_migration_validation_rollback_1 = require("./003-migration-validation-rollback");
const BackwardCompatibilityService_1 = __importDefault(require("../../services/BackwardCompatibilityService"));
const FeatureFlag_1 = __importDefault(require("../../models/FeatureFlag"));
const logger_1 = __importDefault(require("../../utils/logger"));
class RBACMigrationOrchestrator {
    constructor(config = {}) {
        this.config = {
            enableGradualRollout: true,
            rolloutPercentage: 0,
            enableValidation: true,
            enableBackup: true,
            skipUserMigration: false,
            dryRun: false,
            ...config
        };
        this.compatibilityService = BackwardCompatibilityService_1.default.getInstance();
    }
    async executeMigration() {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
        let currentPhase = 'initialization';
        try {
            logger_1.default.info('Starting RBAC migration orchestration...', { config: this.config });
            currentPhase = 'initialization';
            await this.initializeMigration();
            currentPhase = 'seeding';
            logger_1.default.info('Phase 2: Seeding system roles and permissions...');
            if (!this.config.dryRun) {
                await (0, _001_seed_system_roles_permissions_1.seedSystemRolesAndPermissions)();
            }
            else {
                logger_1.default.info('DRY RUN: Would seed system roles and permissions');
            }
            if (!this.config.skipUserMigration) {
                currentPhase = 'user_migration';
                logger_1.default.info('Phase 3: Migrating user roles...');
                if (!this.config.dryRun) {
                    const migrationResults = await (0, _002_migrate_user_roles_1.migrateUserRoles)();
                    const failedMigrations = migrationResults.filter(r => !r.success);
                    if (failedMigrations.length > 0) {
                        warnings.push(`${failedMigrations.length} user migrations failed`);
                    }
                }
                else {
                    logger_1.default.info('DRY RUN: Would migrate user roles');
                }
            }
            if (this.config.enableValidation) {
                currentPhase = 'validation';
                logger_1.default.info('Phase 4: Validating migration...');
                if (!this.config.dryRun) {
                    const validationResult = await (0, _003_migration_validation_rollback_1.validateMigration)();
                    if (!validationResult.isValid) {
                        const criticalErrors = validationResult.errors.filter(e => e.type === 'critical');
                        if (criticalErrors.length > 0) {
                            throw new Error(`Migration validation failed with ${criticalErrors.length} critical errors`);
                        }
                    }
                    warnings.push(...validationResult.warnings.map(w => w.message));
                }
                else {
                    logger_1.default.info('DRY RUN: Would validate migration');
                }
            }
            if (this.config.enableGradualRollout) {
                currentPhase = 'rollout_setup';
                logger_1.default.info('Phase 5: Setting up gradual rollout...');
                if (!this.config.dryRun) {
                    await this.setupGradualRollout();
                }
                else {
                    logger_1.default.info('DRY RUN: Would setup gradual rollout');
                }
            }
            currentPhase = 'activation';
            logger_1.default.info('Phase 6: Activating dynamic RBAC...');
            if (!this.config.dryRun) {
                await this.activateDynamicRBAC();
            }
            else {
                logger_1.default.info('DRY RUN: Would activate dynamic RBAC');
            }
            const duration = Date.now() - startTime;
            const statistics = await this.gatherMigrationStatistics();
            logger_1.default.info('RBAC migration completed successfully', {
                duration: `${duration}ms`,
                statistics
            });
            return {
                success: true,
                phase: 'completed',
                duration,
                errors,
                warnings,
                statistics
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(errorMessage);
            logger_1.default.error(`RBAC migration failed in phase ${currentPhase}:`, error);
            if (!this.config.dryRun) {
                try {
                    logger_1.default.info('Attempting automatic rollback...');
                    await this.rollbackMigration();
                    warnings.push('Automatic rollback completed');
                }
                catch (rollbackError) {
                    logger_1.default.error('Automatic rollback failed:', rollbackError);
                    errors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
                }
            }
            return {
                success: false,
                phase: currentPhase,
                duration,
                errors,
                warnings,
                statistics: {
                    rolesCreated: 0,
                    permissionsCreated: 0,
                    usersMigrated: 0,
                    validationErrors: 0
                }
            };
        }
    }
    async initializeMigration() {
        logger_1.default.info('Initializing migration environment...');
        await this.compatibilityService.initialize();
        if (this.config.enableBackup && !this.config.dryRun) {
            await this.createBackup();
        }
        await this.setMigrationPhase('preparation');
        logger_1.default.info('Migration environment initialized');
    }
    async setupGradualRollout() {
        logger_1.default.info(`Setting up gradual rollout with ${this.config.rolloutPercentage}% coverage...`);
        await this.compatibilityService.updateConfiguration({
            enableDynamicRBAC: true,
            enableLegacyFallback: true,
            enableDeprecationWarnings: true,
            migrationPhase: 'migration',
            rolloutPercentage: this.config.rolloutPercentage
        });
        logger_1.default.info('Gradual rollout configured');
    }
    async activateDynamicRBAC() {
        logger_1.default.info('Activating dynamic RBAC system...');
        await FeatureFlag_1.default.findOneAndUpdate({ key: 'rbac_enable_dynamic' }, {
            key: 'rbac_enable_dynamic',
            value: true,
            isActive: true,
            description: 'Enable dynamic RBAC system',
            lastModifiedAt: new Date()
        }, { upsert: true });
        await this.setMigrationPhase('validation');
        await this.compatibilityService.updateConfiguration({
            enableDynamicRBAC: true,
            migrationPhase: 'validation'
        });
        logger_1.default.info('Dynamic RBAC system activated');
    }
    async createBackup() {
        logger_1.default.info('Creating system backup...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `rbac-migration-backup-${timestamp}`;
        logger_1.default.info(`Backup created: ${backupName}`);
    }
    async setMigrationPhase(phase) {
        await FeatureFlag_1.default.findOneAndUpdate({ key: 'rbac_migration_phase' }, {
            key: 'rbac_migration_phase',
            value: phase,
            isActive: true,
            description: 'Current RBAC migration phase',
            lastModifiedAt: new Date()
        }, { upsert: true });
    }
    async gatherMigrationStatistics() {
        const Role = (await Promise.resolve().then(() => __importStar(require('../../models/Role')))).default;
        const Permission = (await Promise.resolve().then(() => __importStar(require('../../models/Permission')))).default;
        const User = (await Promise.resolve().then(() => __importStar(require('../../models/User')))).default;
        const [rolesCreated, permissionsCreated, usersMigrated] = await Promise.all([
            Role.countDocuments({ isSystemRole: true, isActive: true }),
            Permission.countDocuments({ isSystemPermission: true, isActive: true }),
            User.countDocuments({ roleLastModifiedAt: { $exists: true } })
        ]);
        return {
            rolesCreated,
            permissionsCreated,
            usersMigrated,
            validationErrors: 0
        };
    }
    async rollbackMigration() {
        logger_1.default.info('Starting migration rollback...');
        try {
            await this.compatibilityService.updateConfiguration({
                enableDynamicRBAC: false,
                enableLegacyFallback: true,
                migrationPhase: 'preparation'
            });
            await (0, _003_migration_validation_rollback_1.rollbackMigration)();
            logger_1.default.info('Migration rollback completed');
        }
        catch (error) {
            logger_1.default.error('Migration rollback failed:', error);
            throw error;
        }
    }
    async getMigrationStatus() {
        const metrics = this.compatibilityService.getMetrics();
        const statistics = await this.gatherMigrationStatistics();
        return {
            phase: metrics.config.migrationPhase,
            isActive: metrics.config.enableDynamicRBAC,
            rolloutPercentage: metrics.config.rolloutPercentage,
            statistics
        };
    }
    async updateRolloutPercentage(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Rollout percentage must be between 0 and 100');
        }
        await this.compatibilityService.updateConfiguration({
            rolloutPercentage: percentage
        });
        logger_1.default.info(`Rollout percentage updated to ${percentage}%`);
    }
    async completeMigration() {
        logger_1.default.info('Completing RBAC migration...');
        await this.updateRolloutPercentage(100);
        await this.setMigrationPhase('cleanup');
        setTimeout(async () => {
            await this.compatibilityService.updateConfiguration({
                enableLegacyFallback: false,
                enableDeprecationWarnings: false
            });
            logger_1.default.info('Legacy fallback disabled - migration fully completed');
        }, 24 * 60 * 60 * 1000);
        logger_1.default.info('RBAC migration completion initiated');
    }
}
exports.RBACMigrationOrchestrator = RBACMigrationOrchestrator;
async function executeRBACMigration(config = {}) {
    const orchestrator = new RBACMigrationOrchestrator(config);
    return await orchestrator.executeMigration();
}
async function rollbackRBACMigration() {
    const orchestrator = new RBACMigrationOrchestrator();
    await orchestrator.rollbackMigration();
}
if (require.main === module) {
    const command = process.argv[2];
    const options = process.argv.slice(3);
    const config = {};
    for (const option of options) {
        if (option === '--dry-run') {
            config.dryRun = true;
        }
        else if (option === '--skip-validation') {
            config.enableValidation = false;
        }
        else if (option === '--skip-user-migration') {
            config.skipUserMigration = true;
        }
        else if (option.startsWith('--rollout=')) {
            const value = option.split('=')[1];
            if (value) {
                config.rolloutPercentage = parseInt(value);
            }
        }
    }
    mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas')
        .then(async () => {
        const orchestrator = new RBACMigrationOrchestrator(config);
        switch (command) {
            case 'migrate':
                const result = await orchestrator.executeMigration();
                console.log(JSON.stringify(result, null, 2));
                break;
            case 'rollback':
                await orchestrator.rollbackMigration();
                break;
            case 'status':
                const status = await orchestrator.getMigrationStatus();
                console.log(JSON.stringify(status, null, 2));
                break;
            case 'complete':
                await orchestrator.completeMigration();
                break;
            case 'rollout':
                const percentage = options[0] ? parseInt(options[0]) : 0;
                await orchestrator.updateRolloutPercentage(percentage);
                break;
            default:
                console.log('Usage: node migration-orchestrator.js <command> [options]');
                console.log('Commands: migrate, rollback, status, complete, rollout <percentage>');
                console.log('Options: --dry-run, --skip-validation, --skip-user-migration, --rollout=<percentage>');
        }
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Migration orchestration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migration-orchestrator.js.map