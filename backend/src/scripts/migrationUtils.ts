import mongoose from 'mongoose';
import User from '../models/User';
import Workplace from '../models/Workplace';
import Subscription from '../models/Subscription';
import logger from '../utils/logger';

export interface BatchMigrationOptions {
    batchSize: number;
    delayBetweenBatches: number; // milliseconds
    dryRun: boolean;
}

export interface MigrationProgress {
    totalItems: number;
    processedItems: number;
    successfulItems: number;
    failedItems: number;
    currentBatch: number;
    totalBatches: number;
    errors: Array<{
        itemId: string;
        error: string;
        timestamp: Date;
    }>;
}

/**
 * Batch migration utility for processing large datasets
 */
export class BatchMigrationProcessor {
    private options: BatchMigrationOptions;
    private progress: MigrationProgress;

    constructor(options: Partial<BatchMigrationOptions> = {}) {
        this.options = {
            batchSize: 100,
            delayBetweenBatches: 1000,
            dryRun: false,
            ...options,
        };

        this.progress = {
            totalItems: 0,
            processedItems: 0,
            successfulItems: 0,
            failedItems: 0,
            currentBatch: 0,
            totalBatches: 0,
            errors: [],
        };
    }

    /**
     * Process users in batches for workspace migration
     */
    async processUserMigration(
        processor: (user: any) => Promise<void>
    ): Promise<MigrationProgress> {
        try {
            // Get total count
            const totalUsers = await User.countDocuments({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            });

            this.progress.totalItems = totalUsers;
            this.progress.totalBatches = Math.ceil(totalUsers / this.options.batchSize);

            logger.info(`Starting batch migration for ${totalUsers} users in ${this.progress.totalBatches} batches`);

            let skip = 0;
            let batchNumber = 1;

            while (skip < totalUsers) {
                this.progress.currentBatch = batchNumber;

                logger.info(`Processing batch ${batchNumber}/${this.progress.totalBatches} (items ${skip + 1}-${Math.min(skip + this.options.batchSize, totalUsers)})`);

                // Get batch of users
                const users = await User.find({
                    $or: [
                        { workplaceId: { $exists: false } },
                        { workplaceId: null }
                    ]
                })
                    .skip(skip)
                    .limit(this.options.batchSize)
                    .lean();

                // Process each user in the batch
                for (const user of users) {
                    try {
                        if (!this.options.dryRun) {
                            await processor(user);
                        }
                        this.progress.successfulItems++;
                    } catch (error) {
                        this.progress.failedItems++;
                        this.progress.errors.push({
                            itemId: user._id.toString(),
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date(),
                        });
                        logger.error(`Failed to process user ${user._id}:`, error);
                    }
                    this.progress.processedItems++;
                }

                // Progress update
                const progressPercent = Math.round((this.progress.processedItems / totalUsers) * 100);
                logger.info(`Batch ${batchNumber} completed. Progress: ${progressPercent}% (${this.progress.processedItems}/${totalUsers})`);

                skip += this.options.batchSize;
                batchNumber++;

                // Delay between batches to avoid overwhelming the database
                if (skip < totalUsers && this.options.delayBetweenBatches > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
                }
            }

            logger.info('Batch migration completed', {
                totalItems: this.progress.totalItems,
                successfulItems: this.progress.successfulItems,
                failedItems: this.progress.failedItems,
                errorCount: this.progress.errors.length,
            });

            return this.progress;

        } catch (error) {
            logger.error('Batch migration failed:', error);
            throw error;
        }
    }

    /**
     * Get current progress
     */
    getProgress(): MigrationProgress {
        return { ...this.progress };
    }
}

/**
 * Data integrity checker for migration validation
 */
export class MigrationIntegrityChecker {

    /**
     * Check for orphaned records after migration
     */
    async checkOrphanedRecords(): Promise<{
        orphanedUsers: number;
        orphanedSubscriptions: number;
        workspacesWithoutOwners: number;
        issues: string[];
    }> {
        const issues: string[] = [];

        try {
            // Check for users without workspaces
            const orphanedUsers = await User.countDocuments({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            });

            if (orphanedUsers > 0) {
                issues.push(`Found ${orphanedUsers} users without workspace associations`);
            }

            // Check for old user-based subscriptions
            const orphanedSubscriptions = await Subscription.countDocuments({
                userId: { $exists: true }
            });

            if (orphanedSubscriptions > 0) {
                issues.push(`Found ${orphanedSubscriptions} old user-based subscriptions`);
            }

            // Check for workspaces without valid owners
            const workspacesWithoutOwners = await Workplace.countDocuments({
                $or: [
                    { ownerId: { $exists: false } },
                    { ownerId: null }
                ]
            });

            if (workspacesWithoutOwners > 0) {
                issues.push(`Found ${workspacesWithoutOwners} workspaces without valid owners`);
            }

            // Check for workspaces with owners that don't exist
            const workspacesWithInvalidOwners = await Workplace.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ownerId',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                {
                    $match: {
                        owner: { $size: 0 }
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const invalidOwnerCount = workspacesWithInvalidOwners[0]?.count || 0;
            if (invalidOwnerCount > 0) {
                issues.push(`Found ${invalidOwnerCount} workspaces with non-existent owners`);
            }

            return {
                orphanedUsers,
                orphanedSubscriptions,
                workspacesWithoutOwners,
                issues,
            };

        } catch (error) {
            logger.error('Integrity check failed:', error);
            throw error;
        }
    }

    /**
     * Check data consistency between related models
     */
    async checkDataConsistency(): Promise<{
        inconsistencies: Array<{
            type: string;
            description: string;
            count: number;
        }>;
        isConsistent: boolean;
    }> {
        const inconsistencies: Array<{
            type: string;
            description: string;
            count: number;
        }> = [];

        try {
            // Check users with workplaceId but workspace doesn't exist
            const usersWithInvalidWorkspace = await User.aggregate([
                {
                    $match: {
                        workplaceId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workplaceId',
                        foreignField: '_id',
                        as: 'workplace'
                    }
                },
                {
                    $match: {
                        workplace: { $size: 0 }
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const invalidWorkspaceCount = usersWithInvalidWorkspace[0]?.count || 0;
            if (invalidWorkspaceCount > 0) {
                inconsistencies.push({
                    type: 'user_workspace_mismatch',
                    description: 'Users referencing non-existent workspaces',
                    count: invalidWorkspaceCount,
                });
            }

            // Check workspaces with subscriptions that don't exist
            const workspacesWithInvalidSubscriptions = await Workplace.aggregate([
                {
                    $match: {
                        currentSubscriptionId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'currentSubscriptionId',
                        foreignField: '_id',
                        as: 'subscription'
                    }
                },
                {
                    $match: {
                        subscription: { $size: 0 }
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const invalidSubscriptionCount = workspacesWithInvalidSubscriptions[0]?.count || 0;
            if (invalidSubscriptionCount > 0) {
                inconsistencies.push({
                    type: 'workspace_subscription_mismatch',
                    description: 'Workspaces referencing non-existent subscriptions',
                    count: invalidSubscriptionCount,
                });
            }

            // Check subscriptions with workspaces that don't exist
            const subscriptionsWithInvalidWorkspaces = await Subscription.aggregate([
                {
                    $match: {
                        workspaceId: { $exists: true, $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'workplaces',
                        localField: 'workspaceId',
                        foreignField: '_id',
                        as: 'workspace'
                    }
                },
                {
                    $match: {
                        workspace: { $size: 0 }
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const subscriptionWorkspaceMismatch = subscriptionsWithInvalidWorkspaces[0]?.count || 0;
            if (subscriptionWorkspaceMismatch > 0) {
                inconsistencies.push({
                    type: 'subscription_workspace_mismatch',
                    description: 'Subscriptions referencing non-existent workspaces',
                    count: subscriptionWorkspaceMismatch,
                });
            }

            return {
                inconsistencies,
                isConsistent: inconsistencies.length === 0,
            };

        } catch (error) {
            logger.error('Consistency check failed:', error);
            throw error;
        }
    }
}

/**
 * Migration progress tracker with persistence
 */
export class MigrationProgressTracker {
    private progressFile: string;

    constructor(migrationName: string) {
        this.progressFile = `migration_progress_${migrationName}_${Date.now()}.json`;
    }

    /**
     * Save progress to file
     */
    async saveProgress(progress: MigrationProgress): Promise<void> {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(
                this.progressFile,
                JSON.stringify({
                    ...progress,
                    lastUpdated: new Date(),
                }, null, 2)
            );
        } catch (error) {
            logger.error('Failed to save migration progress:', error);
        }
    }

    /**
     * Load progress from file
     */
    async loadProgress(): Promise<MigrationProgress | null> {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(this.progressFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.warn('Could not load migration progress:', error);
            return null;
        }
    }

    /**
     * Clean up progress file
     */
    async cleanup(): Promise<void> {
        try {
            const fs = require('fs').promises;
            await fs.unlink(this.progressFile);
        } catch (error) {
            logger.warn('Could not clean up progress file:', error);
        }
    }
}

/**
 * Rollback manager for safe migration rollbacks
 */
export class MigrationRollbackManager {
    private backupData: Map<string, any> = new Map();

    /**
     * Create backup of document before modification
     */
    async backupDocument(collection: string, documentId: string, document: any): Promise<void> {
        const key = `${collection}:${documentId}`;
        this.backupData.set(key, {
            collection,
            documentId,
            originalData: JSON.parse(JSON.stringify(document)),
            backedUpAt: new Date(),
        });
    }

    /**
     * Restore document from backup
     */
    async restoreDocument(collection: string, documentId: string): Promise<boolean> {
        const key = `${collection}:${documentId}`;
        const backup = this.backupData.get(key);

        if (!backup) {
            logger.warn(`No backup found for ${key}`);
            return false;
        }

        try {
            const Model = mongoose.model(collection);
            await Model.findByIdAndUpdate(documentId, backup.originalData);
            logger.info(`Restored document ${key} from backup`);
            return true;
        } catch (error) {
            logger.error(`Failed to restore document ${key}:`, error);
            return false;
        }
    }

    /**
     * Get backup statistics
     */
    getBackupStats(): {
        totalBackups: number;
        backupsByCollection: Record<string, number>;
    } {
        const backupsByCollection: Record<string, number> = {};

        for (const [key, backup] of this.backupData.entries()) {
            const collection = backup.collection;
            backupsByCollection[collection] = (backupsByCollection[collection] || 0) + 1;
        }

        return {
            totalBackups: this.backupData.size,
            backupsByCollection,
        };
    }

    /**
     * Clear all backups
     */
    clearBackups(): void {
        this.backupData.clear();
    }
}