"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedMigrationOrchestrator = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("../config/db"));
const logger_1 = __importDefault(require("../utils/logger"));
const migrationUtils_1 = require("./migrationUtils");
const migrateToWorkspaceSubscriptions_1 = require("./migrateToWorkspaceSubscriptions");
class EnhancedMigrationOrchestrator {
    constructor(options = {}) {
        this.options = {
            batchSize: 50,
            delayBetweenBatches: 2000,
            dryRun: false,
            enableBackup: true,
            enableProgressTracking: true,
            enableIntegrityChecks: true,
            continueOnError: false,
            ...options,
        };
        this.progressTracker = new migrationUtils_1.MigrationProgressTracker('workspace_subscription');
        this.rollbackManager = new migrationUtils_1.MigrationRollbackManager();
        this.integrityChecker = new migrationUtils_1.MigrationIntegrityChecker();
    }
    async executeMigration() {
        logger_1.default.info('Starting enhanced workspace subscription migration', {
            options: this.options,
        });
        try {
            if (this.options.enableIntegrityChecks) {
                logger_1.default.info('Running pre-migration integrity checks...');
                const preCheck = await this.integrityChecker.checkOrphanedRecords();
                logger_1.default.info('Pre-migration integrity check results:', preCheck);
                if (preCheck.issues.length > 0) {
                    logger_1.default.warn('Pre-migration issues detected:', preCheck.issues);
                }
            }
            let previousProgress = null;
            if (this.options.enableProgressTracking) {
                previousProgress = await this.progressTracker.loadProgress();
                if (previousProgress) {
                    logger_1.default.info('Found previous migration progress:', {
                        processedItems: previousProgress.processedItems,
                        totalItems: previousProgress.totalItems,
                        errors: previousProgress.errors.length,
                    });
                }
            }
            logger_1.default.info('Executing workspace subscription migration...');
            const migrationResults = await (0, migrateToWorkspaceSubscriptions_1.migrateToWorkspaceSubscriptions)();
            if (this.options.enableProgressTracking) {
                await this.progressTracker.saveProgress({
                    totalItems: migrationResults.usersUpdated + migrationResults.workspacesCreated,
                    processedItems: migrationResults.usersUpdated + migrationResults.workspacesCreated,
                    successfulItems: migrationResults.usersUpdated + migrationResults.workspacesCreated - migrationResults.errors.length,
                    failedItems: migrationResults.errors.length,
                    currentBatch: 1,
                    totalBatches: 1,
                    errors: migrationResults.errors.map(error => ({
                        itemId: 'unknown',
                        error,
                        timestamp: new Date(),
                    })),
                });
            }
            logger_1.default.info('Running post-migration validation...');
            const validation = await (0, migrateToWorkspaceSubscriptions_1.validateMigration)();
            let postIntegrityCheck = null;
            if (this.options.enableIntegrityChecks) {
                logger_1.default.info('Running post-migration integrity checks...');
                postIntegrityCheck = await this.integrityChecker.checkOrphanedRecords();
                const consistencyCheck = await this.integrityChecker.checkDataConsistency();
                logger_1.default.info('Post-migration integrity check results:', {
                    orphanedRecords: postIntegrityCheck,
                    consistency: consistencyCheck,
                });
                if (!consistencyCheck.isConsistent) {
                    logger_1.default.error('Data consistency issues detected after migration:', consistencyCheck.inconsistencies);
                }
            }
            const backupStats = this.options.enableBackup ? this.rollbackManager.getBackupStats() : null;
            if (migrationResults.success && this.options.enableProgressTracking) {
                await this.progressTracker.cleanup();
            }
            const result = {
                success: migrationResults.success && validation.valid,
                results: {
                    migration: migrationResults,
                    validation,
                },
                integrityCheck: postIntegrityCheck,
                backupStats,
            };
            if (result.success) {
                logger_1.default.info('Enhanced migration completed successfully!', result);
            }
            else {
                logger_1.default.error('Enhanced migration completed with issues:', result);
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Enhanced migration failed:', error);
            if (this.options.enableProgressTracking) {
                await this.progressTracker.saveProgress({
                    totalItems: 0,
                    processedItems: 0,
                    successfulItems: 0,
                    failedItems: 1,
                    currentBatch: 0,
                    totalBatches: 0,
                    errors: [{
                            itemId: 'migration_orchestrator',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date(),
                        }],
                });
            }
            throw error;
        }
    }
    async executeRollback() {
        logger_1.default.info('Starting enhanced migration rollback', {
            options: this.options,
        });
        try {
            if (this.options.enableIntegrityChecks) {
                logger_1.default.info('Running pre-rollback integrity checks...');
                const preCheck = await this.integrityChecker.checkOrphanedRecords();
                logger_1.default.info('Pre-rollback integrity check results:', preCheck);
            }
            logger_1.default.info('Executing migration rollback...');
            const rollbackResults = await (0, migrateToWorkspaceSubscriptions_1.rollbackWorkspaceMigration)();
            logger_1.default.info('Running post-rollback validation...');
            const validation = await (0, migrateToWorkspaceSubscriptions_1.validateMigration)();
            let postIntegrityCheck = null;
            if (this.options.enableIntegrityChecks) {
                logger_1.default.info('Running post-rollback integrity checks...');
                postIntegrityCheck = await this.integrityChecker.checkOrphanedRecords();
                const consistencyCheck = await this.integrityChecker.checkDataConsistency();
                logger_1.default.info('Post-rollback integrity check results:', {
                    orphanedRecords: postIntegrityCheck,
                    consistency: consistencyCheck,
                });
            }
            const result = {
                success: rollbackResults.success,
                results: {
                    rollback: rollbackResults,
                    validation,
                },
                integrityCheck: postIntegrityCheck,
            };
            if (result.success) {
                logger_1.default.info('Enhanced rollback completed successfully!', result);
            }
            else {
                logger_1.default.error('Enhanced rollback completed with issues:', result);
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Enhanced rollback failed:', error);
            throw error;
        }
    }
    async dryRun() {
        logger_1.default.info('Starting migration dry run...');
        try {
            const integrityCheck = await this.integrityChecker.checkOrphanedRecords();
            const consistencyCheck = await this.integrityChecker.checkDataConsistency();
            const User = mongoose_1.default.model('User');
            const usersWithoutWorkspace = await User.countDocuments({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            });
            const usersWithSubscriptions = await User.countDocuments({
                currentSubscriptionId: { $exists: true, $ne: null }
            });
            const estimatedChanges = {
                workspacesToCreate: usersWithoutWorkspace,
                subscriptionsToMigrate: usersWithSubscriptions,
                usersToUpdate: usersWithoutWorkspace,
            };
            const issues = [
                ...integrityCheck.issues,
                ...consistencyCheck.inconsistencies.map(inc => inc.description),
            ];
            logger_1.default.info('Dry run completed:', {
                estimatedChanges,
                integrityIssues: issues.length,
            });
            return {
                estimatedChanges,
                integrityCheck: {
                    ...integrityCheck,
                    consistency: consistencyCheck,
                },
                issues,
            };
        }
        catch (error) {
            logger_1.default.error('Dry run failed:', error);
            throw error;
        }
    }
}
exports.EnhancedMigrationOrchestrator = EnhancedMigrationOrchestrator;
if (require.main === module) {
    const command = process.argv[2];
    const options = {};
    for (let i = 3; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg === '--dry-run') {
            options.dryRun = true;
        }
        else if (arg === '--batch-size' && process.argv[i + 1]) {
            const batchSizeArg = process.argv[i + 1];
            if (batchSizeArg) {
                options.batchSize = parseInt(batchSizeArg);
            }
            i++;
        }
        else if (arg === '--no-backup') {
            options.enableBackup = false;
        }
        else if (arg === '--no-progress') {
            options.enableProgressTracking = false;
        }
        else if (arg === '--no-integrity-checks') {
            options.enableIntegrityChecks = false;
        }
        else if (arg === '--continue-on-error') {
            options.continueOnError = true;
        }
    }
    (0, db_1.default)().then(async () => {
        const orchestrator = new EnhancedMigrationOrchestrator(options);
        try {
            switch (command) {
                case 'migrate':
                    await orchestrator.executeMigration();
                    break;
                case 'rollback':
                    await orchestrator.executeRollback();
                    break;
                case 'dry-run':
                    await orchestrator.dryRun();
                    break;
                case 'validate':
                    const validation = await (0, migrateToWorkspaceSubscriptions_1.validateMigration)();
                    logger_1.default.info('Validation Result:', validation);
                    break;
                default:
                    logger_1.default.info('Usage: npm run migrate:enhanced [migrate|rollback|dry-run|validate] [options]');
                    logger_1.default.info('Options:');
                    logger_1.default.info('  --dry-run              Run without making changes');
                    logger_1.default.info('  --batch-size <number>  Set batch size for processing');
                    logger_1.default.info('  --no-backup           Disable backup creation');
                    logger_1.default.info('  --no-progress         Disable progress tracking');
                    logger_1.default.info('  --no-integrity-checks Disable integrity checks');
                    logger_1.default.info('  --continue-on-error   Continue processing on errors');
            }
        }
        catch (error) {
            logger_1.default.error('Enhanced migration script execution failed:', error);
            process.exit(1);
        }
        finally {
            await mongoose_1.default.connection.close();
            process.exit(0);
        }
    });
}
//# sourceMappingURL=enhancedMigration.js.map