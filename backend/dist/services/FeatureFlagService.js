"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const FeatureFlag_1 = require("../models/FeatureFlag");
const featureFlags_1 = require("../config/featureFlags");
const logger_1 = __importDefault(require("../utils/logger"));
class FeatureFlagService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
        this.metrics = new Map();
    }
    async isFeatureEnabled(featureName, userId, workspaceId) {
        try {
            const cacheKey = `${featureName}:${userId}:${workspaceId}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.lastEvaluated < this.cacheTimeout) {
                this.updateMetrics(featureName, cached.enabled);
                return cached;
            }
            const globalFlags = (0, featureFlags_1.getPerformanceFeatureFlags)();
            const isGloballyEnabled = this.getGlobalFeatureFlag(globalFlags, featureName);
            if (!isGloballyEnabled) {
                const result = {
                    enabled: false,
                    reason: 'Feature globally disabled',
                    rolloutPercentage: 0,
                    lastEvaluated: new Date(),
                };
                this.cache.set(cacheKey, result);
                this.updateMetrics(featureName, false);
                return result;
            }
            const userOverride = await this.getUserFeatureOverride(featureName, userId);
            if (userOverride !== null) {
                const result = {
                    enabled: userOverride,
                    reason: userOverride ? 'User override: enabled' : 'User override: disabled',
                    rolloutPercentage: globalFlags.rolloutPercentage,
                    override: true,
                    lastEvaluated: new Date(),
                };
                this.cache.set(cacheKey, result);
                this.updateMetrics(featureName, userOverride);
                return result;
            }
            const workspaceOverride = await this.getWorkspaceFeatureOverride(featureName, workspaceId);
            if (workspaceOverride !== null) {
                const result = {
                    enabled: workspaceOverride,
                    reason: workspaceOverride ? 'Workspace override: enabled' : 'Workspace override: disabled',
                    rolloutPercentage: globalFlags.rolloutPercentage,
                    override: true,
                    lastEvaluated: new Date(),
                };
                this.cache.set(cacheKey, result);
                this.updateMetrics(featureName, workspaceOverride);
                return result;
            }
            if (globalFlags.internalTesting) {
                const isInternalUser = await this.isInternalUser(userId);
                if (isInternalUser) {
                    const result = {
                        enabled: true,
                        reason: 'Internal testing user',
                        rolloutPercentage: globalFlags.rolloutPercentage,
                        lastEvaluated: new Date(),
                    };
                    this.cache.set(cacheKey, result);
                    this.updateMetrics(featureName, true);
                    return result;
                }
            }
            if (globalFlags.betaUsers) {
                const isBetaUser = await this.isBetaUser(userId, workspaceId);
                if (isBetaUser) {
                    const result = {
                        enabled: true,
                        reason: 'Beta user',
                        rolloutPercentage: globalFlags.rolloutPercentage,
                        lastEvaluated: new Date(),
                    };
                    this.cache.set(cacheKey, result);
                    this.updateMetrics(featureName, true);
                    return result;
                }
            }
            if (globalFlags.rolloutPercentage < 100) {
                const userPercentile = this.getUserPercentile(userId, workspaceId, featureName);
                const enabled = userPercentile < globalFlags.rolloutPercentage;
                const result = {
                    enabled,
                    reason: enabled
                        ? `Rollout: user in ${globalFlags.rolloutPercentage}% (percentile: ${userPercentile})`
                        : `Rollout: user not in ${globalFlags.rolloutPercentage}% (percentile: ${userPercentile})`,
                    rolloutPercentage: globalFlags.rolloutPercentage,
                    userPercentile,
                    lastEvaluated: new Date(),
                };
                this.cache.set(cacheKey, result);
                this.updateMetrics(featureName, enabled);
                return result;
            }
            const result = {
                enabled: true,
                reason: 'Feature fully enabled',
                rolloutPercentage: globalFlags.rolloutPercentage,
                lastEvaluated: new Date(),
            };
            this.cache.set(cacheKey, result);
            this.updateMetrics(featureName, true);
            return result;
        }
        catch (error) {
            logger_1.default.error('Feature flag evaluation error:', error);
            const result = {
                enabled: false,
                reason: `Evaluation error: ${error.message}`,
                rolloutPercentage: 0,
                lastEvaluated: new Date(),
            };
            this.updateMetrics(featureName, false);
            return result;
        }
    }
    getGlobalFeatureFlag(flags, featureName) {
        switch (featureName) {
            case 'themeOptimization':
                return flags.themeOptimization;
            case 'bundleOptimization':
                return flags.bundleOptimization;
            case 'apiCaching':
                return flags.apiCaching;
            case 'databaseOptimization':
                return flags.databaseOptimization;
            case 'performanceMonitoring':
                return flags.performanceMonitoring;
            case 'cursorPagination':
                return flags.cursorPagination;
            case 'backgroundJobs':
                return flags.backgroundJobs;
            case 'serviceWorker':
                return flags.serviceWorker;
            case 'virtualization':
                return flags.virtualization;
            case 'reactQueryOptimization':
                return flags.reactQueryOptimization;
            default:
                return false;
        }
    }
    async getUserFeatureOverride(featureName, userId) {
        try {
            const override = await FeatureFlag_1.FeatureFlag.findOne({
                featureName,
                userId,
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } }
                ]
            });
            return override ? override.enabled : null;
        }
        catch (error) {
            logger_1.default.error('Error getting user feature override:', error);
            return null;
        }
    }
    async getWorkspaceFeatureOverride(featureName, workspaceId) {
        try {
            const override = await FeatureFlag_1.FeatureFlag.findOne({
                featureName,
                workspaceId,
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } }
                ]
            });
            return override ? override.enabled : null;
        }
        catch (error) {
            logger_1.default.error('Error getting workspace feature override:', error);
            return null;
        }
    }
    async isInternalUser(userId) {
        try {
            const User = require('../models/User').default;
            const user = await User.findById(userId);
            return user?.email?.endsWith('@pharmacare.com') || false;
        }
        catch (error) {
            logger_1.default.error('Error checking internal user:', error);
            return false;
        }
    }
    async isBetaUser(userId, workspaceId) {
        try {
            const User = require('../models/User').default;
            const user = await User.findById(userId);
            return user?.betaUser === true || false;
        }
        catch (error) {
            logger_1.default.error('Error checking beta user:', error);
            return false;
        }
    }
    getUserPercentile(userId, workspaceId, featureName) {
        const input = `${userId}:${workspaceId}:${featureName}`;
        const hash = (0, crypto_1.createHash)('md5').update(input).digest('hex');
        const hashInt = parseInt(hash.substring(0, 8), 16);
        return hashInt % 100;
    }
    updateMetrics(featureName, enabled) {
        const existing = this.metrics.get(featureName) || {
            featureName,
            totalEvaluations: 0,
            enabledEvaluations: 0,
            enabledPercentage: 0,
            lastEvaluated: new Date(),
        };
        existing.totalEvaluations++;
        if (enabled) {
            existing.enabledEvaluations++;
        }
        existing.enabledPercentage = (existing.enabledEvaluations / existing.totalEvaluations) * 100;
        existing.lastEvaluated = new Date();
        this.metrics.set(featureName, existing);
    }
    getMetrics() {
        return Array.from(this.metrics.values());
    }
    clearCache() {
        this.cache.clear();
    }
    async setUserFeatureOverride(featureName, userId, enabled, expiresAt, reason) {
        try {
            await FeatureFlag_1.FeatureFlag.findOneAndUpdate({ featureName, userId }, {
                featureName,
                userId,
                enabled,
                expiresAt,
                reason,
                updatedAt: new Date(),
            }, { upsert: true });
            const cachePattern = `${featureName}:${userId}:`;
            for (const key of this.cache.keys()) {
                if (key.startsWith(cachePattern)) {
                    this.cache.delete(key);
                }
            }
            logger_1.default.info(`Feature override set: ${featureName} = ${enabled} for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error setting user feature override:', error);
            throw error;
        }
    }
    async setWorkspaceFeatureOverride(featureName, workspaceId, enabled, expiresAt, reason) {
        try {
            await FeatureFlag_1.FeatureFlag.findOneAndUpdate({ featureName, workspaceId }, {
                featureName,
                workspaceId,
                enabled,
                expiresAt,
                reason,
                updatedAt: new Date(),
            }, { upsert: true });
            const cachePattern = `${featureName}:`;
            for (const key of this.cache.keys()) {
                if (key.includes(`:${workspaceId}`)) {
                    this.cache.delete(key);
                }
            }
            logger_1.default.info(`Feature override set: ${featureName} = ${enabled} for workspace ${workspaceId}`);
        }
        catch (error) {
            logger_1.default.error('Error setting workspace feature override:', error);
            throw error;
        }
    }
    async removeFeatureOverride(featureName, userId, workspaceId) {
        try {
            const query = { featureName };
            if (userId)
                query.userId = userId;
            if (workspaceId)
                query.workspaceId = workspaceId;
            await FeatureFlag_1.FeatureFlag.deleteMany(query);
            for (const key of this.cache.keys()) {
                if (key.startsWith(`${featureName}:`)) {
                    if (!userId && !workspaceId) {
                        this.cache.delete(key);
                    }
                    else if (userId && key.includes(`:${userId}:`)) {
                        this.cache.delete(key);
                    }
                    else if (workspaceId && key.includes(`:${workspaceId}`)) {
                        this.cache.delete(key);
                    }
                }
            }
            logger_1.default.info(`Feature override removed: ${featureName}`);
        }
        catch (error) {
            logger_1.default.error('Error removing feature override:', error);
            throw error;
        }
    }
    async getFeatureOverrides(featureName) {
        try {
            const query = featureName ? { featureName } : {};
            return await FeatureFlag_1.FeatureFlag.find(query).sort({ createdAt: -1 });
        }
        catch (error) {
            logger_1.default.error('Error getting feature overrides:', error);
            throw error;
        }
    }
}
exports.default = new FeatureFlagService();
//# sourceMappingURL=FeatureFlagService.js.map