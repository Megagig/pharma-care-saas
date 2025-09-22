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
exports.BackwardCompatibilityService = void 0;
const PermissionService_1 = __importDefault(require("./PermissionService"));
const DynamicPermissionService_1 = __importDefault(require("./DynamicPermissionService"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const logger_1 = __importDefault(require("../utils/logger"));
class BackwardCompatibilityService {
    constructor() {
        this.config = {
            enableDynamicRBAC: false,
            enableLegacyFallback: true,
            enableDeprecationWarnings: true,
            migrationPhase: 'preparation',
            rolloutPercentage: 0
        };
        this.metrics = {
            dynamicChecks: 0,
            legacyChecks: 0,
            fallbackUsage: 0,
            errors: 0,
            averageResponseTime: 0
        };
        this.legacyPermissionService = PermissionService_1.default.getInstance();
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
    }
    static getInstance() {
        if (!BackwardCompatibilityService.instance) {
            BackwardCompatibilityService.instance = new BackwardCompatibilityService();
        }
        return BackwardCompatibilityService.instance;
    }
    async initialize() {
        try {
            await this.loadConfiguration();
            logger_1.default.info('Backward compatibility service initialized', {
                config: this.config
            });
        }
        catch (error) {
            logger_1.default.error('Failed to initialize backward compatibility service:', error);
            this.config.enableDynamicRBAC = false;
            this.config.enableLegacyFallback = true;
        }
    }
    async checkPermission(context, user, action, options = {}) {
        const startTime = Date.now();
        const { forceMethod, enableMetrics = true } = options;
        try {
            const useMethod = await this.determinePermissionMethod(user, forceMethod);
            let result;
            if (useMethod === 'dynamic') {
                result = await this.checkDynamicPermission(context, user, action);
            }
            else {
                result = await this.checkLegacyPermission(context, user, action);
            }
            if (enableMetrics) {
                const responseTime = Date.now() - startTime;
                result.responseTime = responseTime;
                this.updateMetrics(useMethod, responseTime);
            }
            if (this.config.enableDeprecationWarnings && result.source === 'legacy') {
                this.logDeprecationWarning(action, user);
            }
            return result;
        }
        catch (error) {
            this.metrics.errors++;
            logger_1.default.error('Permission check failed in compatibility layer:', error);
            return {
                allowed: false,
                reason: 'Permission check failed',
                source: 'error_fallback',
                responseTime: enableMetrics ? Date.now() - startTime : undefined
            };
        }
    }
    async checkDynamicPermission(context, user, action) {
        try {
            const dynamicResult = await this.dynamicPermissionService.checkPermission(user, action, context, {
                workspaceId: context.workspace?._id,
                currentTime: new Date()
            });
            this.metrics.dynamicChecks++;
            if (!dynamicResult.allowed && this.config.enableLegacyFallback) {
                logger_1.default.debug(`Dynamic permission check failed for ${action}, trying legacy fallback`);
                const legacyResult = await this.legacyPermissionService.checkPermission(context, user, action);
                if (legacyResult.allowed) {
                    this.metrics.fallbackUsage++;
                    logger_1.default.info(`Legacy fallback succeeded for ${action}`, {
                        userId: user._id,
                        action,
                        dynamicReason: dynamicResult.reason
                    });
                    return {
                        ...legacyResult,
                        source: 'legacy_fallback'
                    };
                }
            }
            return {
                allowed: dynamicResult.allowed,
                reason: dynamicResult.reason,
                requiredPermissions: dynamicResult.requiredPermissions,
                upgradeRequired: dynamicResult.upgradeRequired,
                source: dynamicResult.source || 'dynamic'
            };
        }
        catch (error) {
            logger_1.default.error('Dynamic permission check failed:', error);
            if (this.config.enableLegacyFallback) {
                logger_1.default.debug('Falling back to legacy permission check due to error');
                this.metrics.fallbackUsage++;
                const legacyResult = await this.legacyPermissionService.checkPermission(context, user, action);
                return {
                    ...legacyResult,
                    source: 'legacy_error_fallback'
                };
            }
            throw error;
        }
    }
    async checkLegacyPermission(context, user, action) {
        this.metrics.legacyChecks++;
        const result = await this.legacyPermissionService.checkPermission(context, user, action);
        return {
            ...result,
            source: 'legacy'
        };
    }
    async determinePermissionMethod(user, forceMethod) {
        if (forceMethod) {
            return forceMethod;
        }
        if (!this.config.enableDynamicRBAC) {
            return 'legacy';
        }
        if (this.config.rolloutPercentage < 100) {
            const userHash = this.hashUserId(user._id.toString());
            const userPercentile = userHash % 100;
            if (userPercentile >= this.config.rolloutPercentage) {
                return 'legacy';
            }
        }
        if (user.assignedRoles && user.assignedRoles.length > 0) {
            return 'dynamic';
        }
        switch (this.config.migrationPhase) {
            case 'preparation':
                return 'legacy';
            case 'migration':
                return user.roleLastModifiedAt ? 'dynamic' : 'legacy';
            case 'validation':
                return 'dynamic';
            case 'cleanup':
                return 'dynamic';
            default:
                return 'legacy';
        }
    }
    async loadConfiguration() {
        try {
            const flags = await FeatureFlag_1.default.find({
                key: { $regex: /^rbac_/ },
                isActive: true
            });
            for (const flag of flags) {
                switch (flag.key) {
                    case 'rbac_enable_dynamic':
                        this.config.enableDynamicRBAC = flag.value === true;
                        break;
                    case 'rbac_enable_legacy_fallback':
                        this.config.enableLegacyFallback = flag.value === true;
                        break;
                    case 'rbac_enable_deprecation_warnings':
                        this.config.enableDeprecationWarnings = flag.value === true;
                        break;
                    case 'rbac_migration_phase':
                        if (['preparation', 'migration', 'validation', 'cleanup'].includes(flag.value)) {
                            this.config.migrationPhase = flag.value;
                        }
                        break;
                    case 'rbac_rollout_percentage':
                        const percentage = parseInt(flag.value);
                        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
                            this.config.rolloutPercentage = percentage;
                        }
                        break;
                }
            }
            logger_1.default.debug('Loaded RBAC configuration from feature flags', this.config);
        }
        catch (error) {
            logger_1.default.error('Failed to load RBAC configuration from feature flags:', error);
            throw error;
        }
    }
    async updateConfiguration(updates) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...updates };
        for (const [key, value] of Object.entries(updates)) {
            const flagKey = `rbac_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
            try {
                await FeatureFlag_1.default.findOneAndUpdate({ key: flagKey }, {
                    key: flagKey,
                    value: value,
                    isActive: true,
                    lastModifiedAt: new Date()
                }, { upsert: true });
            }
            catch (error) {
                logger_1.default.error(`Failed to update feature flag ${flagKey}:`, error);
            }
        }
        logger_1.default.info('RBAC configuration updated', {
            oldConfig,
            newConfig: this.config
        });
    }
    getMetrics() {
        return {
            ...this.metrics,
            config: { ...this.config }
        };
    }
    resetMetrics() {
        this.metrics = {
            dynamicChecks: 0,
            legacyChecks: 0,
            fallbackUsage: 0,
            errors: 0,
            averageResponseTime: 0
        };
    }
    async validatePermissionConsistency(context, user, actions) {
        const inconsistencies = [];
        for (const action of actions) {
            try {
                const dynamicResult = await this.checkDynamicPermission(context, user, action);
                const legacyResult = await this.checkLegacyPermission(context, user, action);
                if (dynamicResult.allowed !== legacyResult.allowed) {
                    inconsistencies.push({
                        action,
                        dynamicResult: dynamicResult.allowed,
                        legacyResult: legacyResult.allowed,
                        dynamicReason: dynamicResult.reason,
                        legacyReason: legacyResult.reason
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`Error validating permission consistency for ${action}:`, error);
                inconsistencies.push({
                    action,
                    dynamicResult: false,
                    legacyResult: false,
                    dynamicReason: 'Validation error',
                    legacyReason: 'Validation error'
                });
            }
        }
        return {
            consistent: inconsistencies.length === 0,
            inconsistencies
        };
    }
    async generateMigrationReadinessReport() {
        const issues = [];
        const recommendations = [];
        if (!this.config.enableDynamicRBAC) {
            issues.push('Dynamic RBAC is not enabled');
            recommendations.push('Enable dynamic RBAC feature flag');
        }
        const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
        const UserRole = (await Promise.resolve().then(() => __importStar(require('../models/UserRole')))).default;
        const totalUsers = await User.countDocuments();
        const migratedUsers = await User.countDocuments({ roleLastModifiedAt: { $exists: true } });
        const usersWithDynamicRoles = await User.countDocuments({ assignedRoles: { $exists: true, $ne: [] } });
        const usersWithDirectPermissions = await User.countDocuments({ directPermissions: { $exists: true, $ne: [] } });
        const statistics = {
            totalUsers,
            migratedUsers,
            usersWithDynamicRoles,
            usersWithDirectPermissions
        };
        if (migratedUsers < totalUsers) {
            issues.push(`${totalUsers - migratedUsers} users have not been migrated`);
            recommendations.push('Complete user role migration before proceeding');
        }
        const orphanedAssignments = await UserRole.countDocuments({
            isActive: true,
            userId: { $nin: await User.distinct('_id') }
        });
        if (orphanedAssignments > 0) {
            issues.push(`${orphanedAssignments} orphaned role assignments found`);
            recommendations.push('Clean up orphaned role assignments');
        }
        const readyForMigration = issues.length === 0;
        return {
            readyForMigration,
            issues,
            recommendations,
            statistics
        };
    }
    updateMetrics(method, responseTime) {
        const totalChecks = this.metrics.dynamicChecks + this.metrics.legacyChecks;
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (totalChecks - 1) + responseTime) / totalChecks;
    }
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    logDeprecationWarning(action, user) {
        logger_1.default.warn('Legacy RBAC usage detected', {
            action,
            userId: user._id,
            userEmail: user.email,
            message: 'This user is still using legacy RBAC. Consider migrating to dynamic RBAC.',
            migrationPhase: this.config.migrationPhase
        });
    }
}
exports.BackwardCompatibilityService = BackwardCompatibilityService;
exports.default = BackwardCompatibilityService;
//# sourceMappingURL=BackwardCompatibilityService.js.map