"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRollbackManager = exports.MigrationProgressTracker = exports.MigrationIntegrityChecker = exports.BatchMigrationProcessor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const logger_1 = __importDefault(require("../utils/logger"));
class BatchMigrationProcessor {
    constructor(options = {}) {
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
    async processUserMigration(processor) {
        try {
            const totalUsers = await User_1.default.countDocuments({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            });
            this.progress.totalItems = totalUsers;
            this.progress.totalBatches = Math.ceil(totalUsers / this.options.batchSize);
            logger_1.default.info(`Starting batch migration for ${totalUsers} users in ${this.progress.totalBatches} batches`);
            let skip = 0;
            let batchNumber = 1;
            while (skip < totalUsers) {
                this.progress.currentBatch = batchNumber;
                logger_1.default.info(`Processing batch ${batchNumber}/${this.progress.totalBatches} (items ${skip + 1}-${Math.min(skip + this.options.batchSize, totalUsers)})`);
                const users = await User_1.default.find({
                    $or: [
                        { workplaceId: { $exists: false } },
                        { workplaceId: null }
                    ]
                })
                    .skip(skip)
                    .limit(this.options.batchSize)
                    .lean();
                for (const user of users) {
                    try {
                        if (!this.options.dryRun) {
                            await processor(user);
                        }
                        this.progress.successfulItems++;
                    }
                    catch (error) {
                        this.progress.failedItems++;
                        this.progress.errors.push({
                            itemId: user._id.toString(),
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date(),
                        });
                        logger_1.default.error(`Failed to process user ${user._id}:`, error);
                    }
                    this.progress.processedItems++;
                }
                const progressPercent = Math.round((this.progress.processedItems / totalUsers) * 100);
                logger_1.default.info(`Batch ${batchNumber} completed. Progress: ${progressPercent}% (${this.progress.processedItems}/${totalUsers})`);
                skip += this.options.batchSize;
                batchNumber++;
                if (skip < totalUsers && this.options.delayBetweenBatches > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
                }
            }
            logger_1.default.info('Batch migration completed', {
                totalItems: this.progress.totalItems,
                successfulItems: this.progress.successfulItems,
                failedItems: this.progress.failedItems,
                errorCount: this.progress.errors.length,
            });
            return this.progress;
        }
        catch (error) {
            logger_1.default.error('Batch migration failed:', error);
            throw error;
        }
    }
    getProgress() {
        return { ...this.progress };
    }
}
exports.BatchMigrationProcessor = BatchMigrationProcessor;
class MigrationIntegrityChecker {
    async checkOrphanedRecords() {
        const issues = [];
        try {
            const orphanedUsers = await User_1.default.countDocuments({
                $or: [
                    { workplaceId: { $exists: false } },
                    { workplaceId: null }
                ]
            });
            if (orphanedUsers > 0) {
                issues.push(`Found ${orphanedUsers} users without workspace associations`);
            }
            const orphanedSubscriptions = await Subscription_1.default.countDocuments({
                userId: { $exists: true }
            });
            if (orphanedSubscriptions > 0) {
                issues.push(`Found ${orphanedSubscriptions} old user-based subscriptions`);
            }
            const workspacesWithoutOwners = await Workplace_1.default.countDocuments({
                $or: [
                    { ownerId: { $exists: false } },
                    { ownerId: null }
                ]
            });
            if (workspacesWithoutOwners > 0) {
                issues.push(`Found ${workspacesWithoutOwners} workspaces without valid owners`);
            }
            const workspacesWithInvalidOwners = await Workplace_1.default.aggregate([
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
        }
        catch (error) {
            logger_1.default.error('Integrity check failed:', error);
            throw error;
        }
    }
    async checkDataConsistency() {
        const inconsistencies = [];
        try {
            const usersWithInvalidWorkspace = await User_1.default.aggregate([
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
            const workspacesWithInvalidSubscriptions = await Workplace_1.default.aggregate([
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
            const subscriptionsWithInvalidWorkspaces = await Subscription_1.default.aggregate([
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
        }
        catch (error) {
            logger_1.default.error('Consistency check failed:', error);
            throw error;
        }
    }
}
exports.MigrationIntegrityChecker = MigrationIntegrityChecker;
class MigrationProgressTracker {
    constructor(migrationName) {
        this.progressFile = `migration_progress_${migrationName}_${Date.now()}.json`;
    }
    async saveProgress(progress) {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(this.progressFile, JSON.stringify({
                ...progress,
                lastUpdated: new Date(),
            }, null, 2));
        }
        catch (error) {
            logger_1.default.error('Failed to save migration progress:', error);
        }
    }
    async loadProgress() {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(this.progressFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.default.warn('Could not load migration progress:', error);
            return null;
        }
    }
    async cleanup() {
        try {
            const fs = require('fs').promises;
            await fs.unlink(this.progressFile);
        }
        catch (error) {
            logger_1.default.warn('Could not clean up progress file:', error);
        }
    }
}
exports.MigrationProgressTracker = MigrationProgressTracker;
class MigrationRollbackManager {
    constructor() {
        this.backupData = new Map();
    }
    async backupDocument(collection, documentId, document) {
        const key = `${collection}:${documentId}`;
        this.backupData.set(key, {
            collection,
            documentId,
            originalData: JSON.parse(JSON.stringify(document)),
            backedUpAt: new Date(),
        });
    }
    async restoreDocument(collection, documentId) {
        const key = `${collection}:${documentId}`;
        const backup = this.backupData.get(key);
        if (!backup) {
            logger_1.default.warn(`No backup found for ${key}`);
            return false;
        }
        try {
            const Model = mongoose_1.default.model(collection);
            await Model.findByIdAndUpdate(documentId, backup.originalData);
            logger_1.default.info(`Restored document ${key} from backup`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to restore document ${key}:`, error);
            return false;
        }
    }
    getBackupStats() {
        const backupsByCollection = {};
        for (const [key, backup] of this.backupData.entries()) {
            const collection = backup.collection;
            backupsByCollection[collection] = (backupsByCollection[collection] || 0) + 1;
        }
        return {
            totalBackups: this.backupData.size,
            backupsByCollection,
        };
    }
    clearBackups() {
        this.backupData.clear();
    }
}
exports.MigrationRollbackManager = MigrationRollbackManager;
//# sourceMappingURL=migrationUtils.js.map