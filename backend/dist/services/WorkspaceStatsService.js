"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceStatsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const logger_1 = __importDefault(require("../utils/logger"));
class WorkspaceStatsService {
    async updateUsageStats(data) {
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            const { workspaceId, resource, delta, operation = 'increment' } = data;
            let updateQuery = {
                'stats.lastUpdated': new Date(),
            };
            switch (operation) {
                case 'increment':
                    updateQuery[`stats.${resource}Count`] = { $inc: delta };
                    break;
                case 'decrement':
                    updateQuery[`stats.${resource}Count`] = { $inc: -Math.abs(delta) };
                    break;
                case 'set':
                    updateQuery[`stats.${resource}Count`] = delta;
                    break;
                default:
                    updateQuery[`stats.${resource}Count`] = { $inc: delta };
            }
            const workplace = await Workplace_1.default.findByIdAndUpdate(workspaceId, updateQuery, {
                new: true,
                session,
                runValidators: true
            });
            if (!workplace) {
                throw new Error(`Workspace not found: ${workspaceId}`);
            }
            const stats = workplace.stats;
            let needsCorrection = false;
            const corrections = {};
            if (stats.patientsCount < 0) {
                corrections['stats.patientsCount'] = 0;
                needsCorrection = true;
            }
            if (stats.usersCount < 0) {
                corrections['stats.usersCount'] = 0;
                needsCorrection = true;
            }
            if (stats.storageUsed && stats.storageUsed < 0) {
                corrections['stats.storageUsed'] = 0;
                needsCorrection = true;
            }
            if (stats.apiCallsThisMonth && stats.apiCallsThisMonth < 0) {
                corrections['stats.apiCallsThisMonth'] = 0;
                needsCorrection = true;
            }
            if (needsCorrection) {
                await Workplace_1.default.findByIdAndUpdate(workspaceId, corrections, { session });
                const correctedWorkplace = await Workplace_1.default.findById(workspaceId, null, { session });
                await session.commitTransaction();
                return correctedWorkplace.stats;
            }
            await session.commitTransaction();
            return stats;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Error updating workspace usage stats:', {
                error: error instanceof Error ? error.message : error,
                workspaceId: data.workspaceId,
                resource: data.resource,
                delta: data.delta
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async getUsageStats(workspaceId) {
        const workplace = await Workplace_1.default.findById(workspaceId).select('stats');
        if (!workplace) {
            throw new Error(`Workspace not found: ${workspaceId}`);
        }
        return workplace.stats;
    }
    async recalculateUsageStats(workspaceId) {
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            const workplace = await Workplace_1.default.findById(workspaceId, null, { session });
            if (!workplace) {
                throw new Error(`Workspace not found: ${workspaceId}`);
            }
            const previousStats = { ...workplace.stats };
            const patientsCount = await Patient_1.default.countDocuments({
                workplaceId: workspaceId
            }, { session });
            const usersCount = await User_1.default.countDocuments({
                workplaceId: workspaceId
            }, { session });
            const newStats = {
                patientsCount,
                usersCount,
                storageUsed: workplace.stats.storageUsed || 0,
                apiCallsThisMonth: workplace.stats.apiCallsThisMonth || 0,
                lastUpdated: new Date()
            };
            await Workplace_1.default.findByIdAndUpdate(workspaceId, { stats: newStats }, { session });
            const differences = {};
            if (previousStats.patientsCount !== newStats.patientsCount) {
                differences.patientsCount = newStats.patientsCount - previousStats.patientsCount;
            }
            if (previousStats.usersCount !== newStats.usersCount) {
                differences.usersCount = newStats.usersCount - previousStats.usersCount;
            }
            await session.commitTransaction();
            logger_1.default.info('Workspace usage stats recalculated:', {
                workspaceId,
                previousStats,
                newStats,
                differences
            });
            return {
                workspaceId,
                previousStats,
                newStats,
                differences
            };
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Error recalculating workspace usage stats:', {
                error: error instanceof Error ? error.message : error,
                workspaceId
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async batchRecalculateStats(workspaceIds) {
        let targetWorkspaces;
        if (workspaceIds) {
            targetWorkspaces = workspaceIds;
        }
        else {
            const workplaces = await Workplace_1.default.find({}, '_id');
            targetWorkspaces = workplaces.map(w => w._id);
        }
        const results = [];
        const errors = [];
        for (const workspaceId of targetWorkspaces) {
            try {
                const result = await this.recalculateUsageStats(workspaceId);
                results.push(result);
            }
            catch (error) {
                errors.push({
                    workspaceId,
                    error: error instanceof Error ? error.message : String(error)
                });
                logger_1.default.error(`Failed to recalculate stats for workspace ${workspaceId}:`, error);
            }
        }
        if (errors.length > 0) {
            logger_1.default.warn(`Batch recalculation completed with ${errors.length} errors:`, errors);
        }
        logger_1.default.info(`Batch recalculation completed: ${results.length} successful, ${errors.length} failed`);
        return results;
    }
    async resetMonthlyApiCalls(workspaceId) {
        await Workplace_1.default.findByIdAndUpdate(workspaceId, {
            'stats.apiCallsThisMonth': 0,
            'stats.lastUpdated': new Date()
        });
        logger_1.default.info(`Reset monthly API calls for workspace: ${workspaceId}`);
    }
    async batchResetMonthlyApiCalls() {
        const result = await Workplace_1.default.updateMany({}, {
            'stats.apiCallsThisMonth': 0,
            'stats.lastUpdated': new Date()
        });
        logger_1.default.info(`Batch reset monthly API calls: ${result.modifiedCount} workspaces updated`);
    }
    async getWorkspacesWithStaleStats() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return await Workplace_1.default.find({
            'stats.lastUpdated': { $lt: oneDayAgo }
        }).select('_id name stats');
    }
    async updateStorageUsage(workspaceId, sizeInMB, operation = 'add') {
        const delta = operation === 'add' ? sizeInMB : -sizeInMB;
        return await this.updateUsageStats({
            workspaceId,
            resource: 'storage',
            delta,
            operation: 'increment'
        });
    }
    async incrementApiCalls(workspaceId, count = 1) {
        return await this.updateUsageStats({
            workspaceId,
            resource: 'apiCalls',
            delta: count,
            operation: 'increment'
        });
    }
    async getUsageWithLimits(workspaceId, limits) {
        const stats = await this.getUsageStats(workspaceId);
        const calculatePercentage = (current, limit) => {
            if (limit === null || limit === 0)
                return null;
            return Math.round((current / limit) * 100);
        };
        return {
            stats,
            usage: {
                patients: {
                    current: stats.patientsCount,
                    limit: limits.patients || null,
                    percentage: calculatePercentage(stats.patientsCount, limits.patients || null)
                },
                users: {
                    current: stats.usersCount,
                    limit: limits.users || null,
                    percentage: calculatePercentage(stats.usersCount, limits.users || null)
                },
                storage: {
                    current: stats.storageUsed || 0,
                    limit: limits.storage || null,
                    percentage: calculatePercentage(stats.storageUsed || 0, limits.storage || null)
                },
                apiCalls: {
                    current: stats.apiCallsThisMonth || 0,
                    limit: limits.apiCalls || null,
                    percentage: calculatePercentage(stats.apiCallsThisMonth || 0, limits.apiCalls || null)
                }
            }
        };
    }
}
exports.WorkspaceStatsService = WorkspaceStatsService;
exports.default = new WorkspaceStatsService();
//# sourceMappingURL=WorkspaceStatsService.js.map