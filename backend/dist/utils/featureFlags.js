"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFeatureFlags = exports.featureFlagMiddleware = exports.FeatureFlagManager = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const environments_1 = require("../config/environments");
const featureFlagSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: false,
        index: true,
    },
    rolloutPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    conditions: {
        workplaceIds: [String],
        userRoles: [String],
        subscriptionPlans: [String],
        environment: [String],
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: String,
        required: true,
    },
});
featureFlagSchema.pre('save', function () {
    this.updatedAt = new Date();
});
const FeatureFlagModel = mongoose_1.default.model('FeatureFlag', featureFlagSchema);
class FeatureFlagManager {
    static async initializeDefaultFlags() {
        const defaultFlags = [
            {
                name: 'clinical_interventions_enabled',
                description: 'Enable Clinical Interventions module',
                enabled: environments_1.config.featureFlags.enableClinicalInterventions,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'core',
                },
            },
            {
                name: 'advanced_reporting_enabled',
                description: 'Enable advanced reporting features',
                enabled: environments_1.config.featureFlags.enableAdvancedReporting,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'reporting',
                },
            },
            {
                name: 'bulk_operations_enabled',
                description: 'Enable bulk operations for interventions',
                enabled: environments_1.config.featureFlags.enableBulkOperations,
                rolloutPercentage: 0,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'operations',
                },
            },
            {
                name: 'mtr_integration_enabled',
                description: 'Enable MTR integration features',
                enabled: environments_1.config.featureFlags.enableMTRIntegration,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'integration',
                },
            },
            {
                name: 'performance_monitoring_enabled',
                description: 'Enable performance monitoring and metrics',
                enabled: environments_1.config.featureFlags.enablePerformanceMonitoring,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'monitoring',
                },
            },
            {
                name: 'export_features_enabled',
                description: 'Enable data export features',
                enabled: environments_1.config.featureFlags.enableExportFeatures,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'export',
                },
            },
            {
                name: 'notifications_enabled',
                description: 'Enable notification features',
                enabled: environments_1.config.featureFlags.enableNotifications,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'notifications',
                },
            },
            {
                name: 'audit_logging_enabled',
                description: 'Enable comprehensive audit logging',
                enabled: environments_1.config.featureFlags.enableAuditLogging,
                rolloutPercentage: 100,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'security',
                },
            },
            {
                name: 'intervention_templates_enabled',
                description: 'Enable intervention templates feature',
                enabled: false,
                rolloutPercentage: 0,
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'templates',
                    experimental: true,
                },
            },
            {
                name: 'ai_recommendations_enabled',
                description: 'Enable AI-powered intervention recommendations',
                enabled: false,
                rolloutPercentage: 0,
                conditions: {
                    environment: ['staging', 'development'],
                },
                createdBy: 'system',
                metadata: {
                    module: 'clinical_interventions',
                    category: 'ai',
                    experimental: true,
                },
            },
        ];
        for (const flagData of defaultFlags) {
            try {
                await FeatureFlagModel.findOneAndUpdate({ name: flagData.name }, {
                    ...flagData,
                    updatedAt: new Date(),
                }, {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                });
            }
            catch (error) {
                logger_1.default.error(`Failed to initialize feature flag ${flagData.name}:`, error);
            }
        }
        logger_1.default.info('Default feature flags initialized');
    }
    static async getAllFlags() {
        try {
            return await FeatureFlagModel.find({}).sort({ name: 1 }).lean();
        }
        catch (error) {
            logger_1.default.error('Failed to get feature flags:', error);
            return [];
        }
    }
    static async getFlag(name) {
        try {
            if (this.isCacheValid() && this.cache.has(name)) {
                return this.cache.get(name) || null;
            }
            const flag = await FeatureFlagModel.findOne({ name }).lean();
            if (flag) {
                this.cache.set(name, flag);
            }
            return flag;
        }
        catch (error) {
            logger_1.default.error(`Failed to get feature flag ${name}:`, error);
            return null;
        }
    }
    static async updateFlag(name, updates, updatedBy) {
        try {
            const flag = await FeatureFlagModel.findOneAndUpdate({ name }, {
                ...updates,
                updatedAt: new Date(),
            }, { new: true }).lean();
            if (flag) {
                this.cache.set(name, flag);
                logger_1.default.info(`Feature flag ${name} updated by ${updatedBy}`, {
                    flagName: name,
                    updates,
                    updatedBy,
                });
            }
            return flag;
        }
        catch (error) {
            logger_1.default.error(`Failed to update feature flag ${name}:`, error);
            return null;
        }
    }
    static async createFlag(flagData) {
        try {
            const flag = await FeatureFlagModel.create({
                ...flagData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const flagObj = flag.toObject();
            this.cache.set(flagObj.name, flagObj);
            logger_1.default.info(`Feature flag ${flagData.name} created by ${flagData.createdBy}`);
            return flagObj;
        }
        catch (error) {
            logger_1.default.error(`Failed to create feature flag ${flagData.name}:`, error);
            return null;
        }
    }
    static async deleteFlag(name, deletedBy) {
        try {
            const result = await FeatureFlagModel.deleteOne({ name });
            if (result.deletedCount > 0) {
                this.cache.delete(name);
                logger_1.default.info(`Feature flag ${name} deleted by ${deletedBy}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error(`Failed to delete feature flag ${name}:`, error);
            return false;
        }
    }
    static async isEnabled(flagName, context = {}) {
        try {
            const flag = await this.getFlag(flagName);
            if (!flag) {
                return {
                    flagName,
                    enabled: false,
                    reason: 'Flag not found',
                };
            }
            if (!flag.enabled) {
                return {
                    flagName,
                    enabled: false,
                    reason: 'Flag globally disabled',
                };
            }
            if (flag.conditions?.environment && flag.conditions.environment.length > 0) {
                if (!flag.conditions.environment.includes(environments_1.config.environment)) {
                    return {
                        flagName,
                        enabled: false,
                        reason: `Environment ${environments_1.config.environment} not in allowed list`,
                    };
                }
            }
            if (flag.conditions?.workplaceIds && flag.conditions.workplaceIds.length > 0) {
                if (!context.workplaceId || !flag.conditions.workplaceIds.includes(context.workplaceId)) {
                    return {
                        flagName,
                        enabled: false,
                        reason: 'Workplace not in allowed list',
                    };
                }
            }
            if (flag.conditions?.userRoles && flag.conditions.userRoles.length > 0) {
                if (!context.userRole || !flag.conditions.userRoles.includes(context.userRole)) {
                    return {
                        flagName,
                        enabled: false,
                        reason: 'User role not in allowed list',
                    };
                }
            }
            if (flag.conditions?.subscriptionPlans && flag.conditions.subscriptionPlans.length > 0) {
                if (!context.subscriptionPlan || !flag.conditions.subscriptionPlans.includes(context.subscriptionPlan)) {
                    return {
                        flagName,
                        enabled: false,
                        reason: 'Subscription plan not in allowed list',
                    };
                }
            }
            if (flag.rolloutPercentage < 100) {
                const hash = this.hashString(flagName + (context.workplaceId || context.userId || ''));
                const percentage = hash % 100;
                if (percentage >= flag.rolloutPercentage) {
                    return {
                        flagName,
                        enabled: false,
                        reason: `Not in rollout percentage (${percentage}% >= ${flag.rolloutPercentage}%)`,
                    };
                }
            }
            return {
                flagName,
                enabled: true,
                reason: 'All conditions met',
                metadata: flag.metadata,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to evaluate feature flag ${flagName}:`, error);
            return {
                flagName,
                enabled: false,
                reason: `Evaluation error: ${error.message}`,
            };
        }
    }
    static async evaluateFlags(flagNames, context = {}) {
        const results = {};
        await Promise.all(flagNames.map(async (flagName) => {
            results[flagName] = await this.isEnabled(flagName, context);
        }));
        return results;
    }
    static async getModuleFlags(module) {
        try {
            return await FeatureFlagModel.find({
                'metadata.module': module,
            }).sort({ name: 1 }).lean();
        }
        catch (error) {
            logger_1.default.error(`Failed to get module flags for ${module}:`, error);
            return [];
        }
    }
    static clearCache() {
        this.cache.clear();
        this.cacheExpiry = 0;
        logger_1.default.debug('Feature flag cache cleared');
    }
    static async refreshCache() {
        try {
            const flags = await this.getAllFlags();
            this.cache.clear();
            for (const flag of flags) {
                this.cache.set(flag.name, flag);
            }
            this.cacheExpiry = Date.now() + this.cacheTTL;
            logger_1.default.debug(`Feature flag cache refreshed with ${flags.length} flags`);
        }
        catch (error) {
            logger_1.default.error('Failed to refresh feature flag cache:', error);
        }
    }
    static isCacheValid() {
        return Date.now() < this.cacheExpiry;
    }
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
exports.FeatureFlagManager = FeatureFlagManager;
FeatureFlagManager.cache = new Map();
FeatureFlagManager.cacheExpiry = 0;
FeatureFlagManager.cacheTTL = 5 * 60 * 1000;
const featureFlagMiddleware = async (req, res, next) => {
    try {
        const context = {
            workplaceId: req.user?.workplaceId?.toString(),
            userId: req.user?._id?.toString(),
            userRole: req.user?.role,
            subscriptionPlan: req.user?.subscriptionPlan,
        };
        const commonFlags = [
            'clinical_interventions_enabled',
            'advanced_reporting_enabled',
            'bulk_operations_enabled',
            'mtr_integration_enabled',
            'export_features_enabled',
            'notifications_enabled',
        ];
        req.featureFlags = await FeatureFlagManager.evaluateFlags(commonFlags, context);
        req.evaluateFlag = (flagName) => FeatureFlagManager.isEnabled(flagName, context);
        next();
    }
    catch (error) {
        logger_1.default.error('Feature flag middleware error:', error);
        req.featureFlags = {};
        req.evaluateFlag = () => Promise.resolve({ flagName: '', enabled: false, reason: 'Middleware error' });
        next();
    }
};
exports.featureFlagMiddleware = featureFlagMiddleware;
const initializeFeatureFlags = async () => {
    try {
        await FeatureFlagManager.initializeDefaultFlags();
        await FeatureFlagManager.refreshCache();
        setInterval(() => {
            FeatureFlagManager.refreshCache();
        }, FeatureFlagManager['cacheTTL']);
        logger_1.default.info('Feature flags system initialized');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize feature flags system:', error);
        throw error;
    }
};
exports.initializeFeatureFlags = initializeFeatureFlags;
exports.default = FeatureFlagManager;
//# sourceMappingURL=featureFlags.js.map