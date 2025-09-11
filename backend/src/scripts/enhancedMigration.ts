import mongoose from 'mongoose';
import connectDB from '../config/db';
import logger from '../utils/logger';
import {
   BatchMigrationProcessor,
   MigrationIntegrityChecker,
   MigrationProgressTracker,
   MigrationRollbackManager,
   BatchMigrationOptions,
} from './migrationUtils';
import {
   migrateToWorkspaceSubscriptions,
   rollbackWorkspaceMigration,
   validateMigration,
} from './migrateToWorkspaceSubscriptions';

export interface EnhancedMigrationOptions
   extends Partial<BatchMigrationOptions> {
   enableBackup: boolean;
   enableProgressTracking: boolean;
   enableIntegrityChecks: boolean;
   continueOnError: boolean;
}

/**
 * Enhanced migration orchestrator with comprehensive error handling,
 * progress tracking, and rollback capabilities
 */
export class EnhancedMigrationOrchestrator {
   private options: EnhancedMigrationOptions;
   private progressTracker: MigrationProgressTracker;
   private rollbackManager: MigrationRollbackManager;
   private integrityChecker: MigrationIntegrityChecker;

   constructor(options: Partial<EnhancedMigrationOptions> = {}) {
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

      this.progressTracker = new MigrationProgressTracker(
         'workspace_subscription'
      );
      this.rollbackManager = new MigrationRollbackManager();
      this.integrityChecker = new MigrationIntegrityChecker();
   }

   /**
    * Execute the complete migration with all safety measures
    */
   async executeMigration(): Promise<{
      success: boolean;
      results: any;
      integrityCheck?: any;
      backupStats?: any;
   }> {
      logger.info('Starting enhanced workspace subscription migration', {
         options: this.options,
      });

      try {
         // Step 1: Pre-migration integrity check
         if (this.options.enableIntegrityChecks) {
            logger.info('Running pre-migration integrity checks...');
            const preCheck = await this.integrityChecker.checkOrphanedRecords();
            logger.info('Pre-migration integrity check results:', preCheck);

            if (preCheck.issues.length > 0) {
               logger.warn('Pre-migration issues detected:', preCheck.issues);
            }
         }

         // Step 2: Load previous progress if available
         let previousProgress = null;
         if (this.options.enableProgressTracking) {
            previousProgress = await this.progressTracker.loadProgress();
            if (previousProgress) {
               logger.info('Found previous migration progress:', {
                  processedItems: previousProgress.processedItems,
                  totalItems: previousProgress.totalItems,
                  errors: previousProgress.errors.length,
               });
            }
         }

         // Step 3: Execute migration
         logger.info('Executing workspace subscription migration...');
         const migrationResults = await migrateToWorkspaceSubscriptions();

         // Step 4: Save progress
         if (this.options.enableProgressTracking) {
            await this.progressTracker.saveProgress({
               totalItems:
                  migrationResults.usersUpdated +
                  migrationResults.workspacesCreated,
               processedItems:
                  migrationResults.usersUpdated +
                  migrationResults.workspacesCreated,
               successfulItems:
                  migrationResults.usersUpdated +
                  migrationResults.workspacesCreated -
                  migrationResults.errors.length,
               failedItems: migrationResults.errors.length,
               currentBatch: 1,
               totalBatches: 1,
               errors: migrationResults.errors.map((error) => ({
                  itemId: 'unknown',
                  error,
                  timestamp: new Date(),
               })),
            });
         }

         // Step 5: Post-migration validation
         logger.info('Running post-migration validation...');
         const validation = await validateMigration();

         // Step 6: Post-migration integrity check
         let postIntegrityCheck = null;
         if (this.options.enableIntegrityChecks) {
            logger.info('Running post-migration integrity checks...');
            postIntegrityCheck =
               await this.integrityChecker.checkOrphanedRecords();
            const consistencyCheck =
               await this.integrityChecker.checkDataConsistency();

            logger.info('Post-migration integrity check results:', {
               orphanedRecords: postIntegrityCheck,
               consistency: consistencyCheck,
            });

            if (!consistencyCheck.isConsistent) {
               logger.error(
                  'Data consistency issues detected after migration:',
                  consistencyCheck.inconsistencies
               );
            }
         }

         // Step 7: Get backup statistics
         const backupStats = this.options.enableBackup
            ? this.rollbackManager.getBackupStats()
            : null;

         // Step 8: Cleanup progress tracking if successful
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
            logger.info('Enhanced migration completed successfully!', result);
         } else {
            logger.error('Enhanced migration completed with issues:', result);
         }

         return result;
      } catch (error) {
         logger.error('Enhanced migration failed:', error);

         // Save error state for debugging
         if (this.options.enableProgressTracking) {
            await this.progressTracker.saveProgress({
               totalItems: 0,
               processedItems: 0,
               successfulItems: 0,
               failedItems: 1,
               currentBatch: 0,
               totalBatches: 0,
               errors: [
                  {
                     itemId: 'migration_orchestrator',
                     error:
                        error instanceof Error
                           ? error.message
                           : 'Unknown error',
                     timestamp: new Date(),
                  },
               ],
            });
         }

         throw error;
      }
   }

   /**
    * Execute rollback with safety measures
    */
   async executeRollback(): Promise<{
      success: boolean;
      results: any;
      integrityCheck?: any;
   }> {
      logger.info('Starting enhanced migration rollback', {
         options: this.options,
      });

      try {
         // Step 1: Pre-rollback integrity check
         if (this.options.enableIntegrityChecks) {
            logger.info('Running pre-rollback integrity checks...');
            const preCheck = await this.integrityChecker.checkOrphanedRecords();
            logger.info('Pre-rollback integrity check results:', preCheck);
         }

         // Step 2: Execute rollback
         logger.info('Executing migration rollback...');
         const rollbackResults = await rollbackWorkspaceMigration();

         // Step 3: Post-rollback validation
         logger.info('Running post-rollback validation...');
         const validation = await validateMigration();

         // Step 4: Post-rollback integrity check
         let postIntegrityCheck = null;
         if (this.options.enableIntegrityChecks) {
            logger.info('Running post-rollback integrity checks...');
            postIntegrityCheck =
               await this.integrityChecker.checkOrphanedRecords();
            const consistencyCheck =
               await this.integrityChecker.checkDataConsistency();

            logger.info('Post-rollback integrity check results:', {
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
            logger.info('Enhanced rollback completed successfully!', result);
         } else {
            logger.error('Enhanced rollback completed with issues:', result);
         }

         return result;
      } catch (error) {
         logger.error('Enhanced rollback failed:', error);
         throw error;
      }
   }

   /**
    * Dry run migration to test without making changes
    */
   async dryRun(): Promise<{
      estimatedChanges: any;
      integrityCheck: any;
      issues: string[];
   }> {
      logger.info('Starting migration dry run...');

      try {
         // Run integrity checks
         const integrityCheck =
            await this.integrityChecker.checkOrphanedRecords();
         const consistencyCheck =
            await this.integrityChecker.checkDataConsistency();

         // Estimate changes that would be made
         const User = mongoose.model('User');
         const usersWithoutWorkspace = await User.countDocuments({
            $or: [{ workplaceId: { $exists: false } }, { workplaceId: null }],
         });

         const usersWithSubscriptions = await User.countDocuments({
            currentSubscriptionId: { $exists: true, $ne: null },
         });

         const estimatedChanges = {
            workspacesToCreate: usersWithoutWorkspace,
            subscriptionsToMigrate: usersWithSubscriptions,
            usersToUpdate: usersWithoutWorkspace,
         };

         const issues: string[] = [
            ...integrityCheck.issues,
            ...consistencyCheck.inconsistencies.map((inc) => inc.description),
         ];

         logger.info('Dry run completed:', {
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
      } catch (error) {
         logger.error('Dry run failed:', error);
         throw error;
      }
   }
}

// CLI execution
if (require.main === module) {
   const command = process.argv[2];
   const options: Partial<EnhancedMigrationOptions> = {};

   // Parse command line options
   for (let i = 3; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg === '--dry-run') {
         options.dryRun = true;
      } else if (arg === '--batch-size' && process.argv[i + 1]) {
         const batchSizeArg = process.argv[i + 1];
         if (batchSizeArg) {
            options.batchSize = parseInt(batchSizeArg);
         }
         i++;
      } else if (arg === '--no-backup') {
         options.enableBackup = false;
      } else if (arg === '--no-progress') {
         options.enableProgressTracking = false;
      } else if (arg === '--no-integrity-checks') {
         options.enableIntegrityChecks = false;
      } else if (arg === '--continue-on-error') {
         options.continueOnError = true;
      }
   }

   connectDB().then(async () => {
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
               const validation = await validateMigration();
               logger.info('Validation Result:', validation);
               break;
            default:
               logger.info(
                  'Usage: npm run migrate:enhanced [migrate|rollback|dry-run|validate] [options]'
               );
               logger.info('Options:');
               logger.info(
                  '  --dry-run              Run without making changes'
               );
               logger.info(
                  '  --batch-size <number>  Set batch size for processing'
               );
               logger.info('  --no-backup           Disable backup creation');
               logger.info('  --no-progress         Disable progress tracking');
               logger.info('  --no-integrity-checks Disable integrity checks');
               logger.info(
                  '  --continue-on-error   Continue processing on errors'
               );
         }
      } catch (error) {
         logger.error('Enhanced migration script execution failed:', error);
         process.exit(1);
      } finally {
         await mongoose.connection.close();
         process.exit(0);
      }
   });
}
