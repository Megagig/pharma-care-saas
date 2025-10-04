"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidationService = void 0;
const RedisCacheService_1 = require("./RedisCacheService");
const CacheWarmingService_1 = require("./CacheWarmingService");
const cacheConfig_1 = require("../config/cacheConfig");
const logger_1 = __importDefault(require("../utils/logger"));
class CacheInvalidationService {
    constructor() {
        this.invalidationRules = new Map();
        this.invalidationStats = {
            totalInvalidations: 0,
            successfulInvalidations: 0,
            failedInvalidations: 0,
            lastInvalidationTime: null,
        };
        this.cacheService = RedisCacheService_1.RedisCacheService.getInstance();
        this.warmingService = CacheWarmingService_1.CacheWarmingService.getInstance();
        this.setupInvalidationRules();
    }
    static getInstance() {
        if (!CacheInvalidationService.instance) {
            CacheInvalidationService.instance = new CacheInvalidationService();
        }
        return CacheInvalidationService.instance;
    }
    setupInvalidationRules() {
        this.addInvalidationRule({
            event: 'user.created',
            patterns: ['saas:users:list:*', 'saas:system:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.USERS, cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'user.updated',
            patterns: ['saas:user:*', 'saas:users:list:*'],
            tags: [cacheConfig_1.SaaSCacheTags.USERS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'user.deleted',
            patterns: ['saas:user:*', 'saas:users:list:*', 'saas:system:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.USERS, cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'user.role.changed',
            patterns: ['saas:user:*', 'saas:users:list:*', 'saas:analytics:users:*'],
            tags: [cacheConfig_1.SaaSCacheTags.USERS, cacheConfig_1.SaaSCacheTags.ANALYTICS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'security.settings.updated',
            patterns: ['saas:security:*'],
            tags: [cacheConfig_1.SaaSCacheTags.SECURITY],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'security.session.created',
            patterns: ['saas:security:sessions:*'],
            tags: [cacheConfig_1.SaaSCacheTags.SECURITY],
            warmAfterInvalidation: false,
        });
        this.addInvalidationRule({
            event: 'security.session.terminated',
            patterns: ['saas:security:sessions:*'],
            tags: [cacheConfig_1.SaaSCacheTags.SECURITY],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'security.audit.logged',
            patterns: ['saas:security:audit:*'],
            tags: [cacheConfig_1.SaaSCacheTags.SECURITY],
            warmAfterInvalidation: false,
        });
        this.addInvalidationRule({
            event: 'feature.flag.updated',
            patterns: ['saas:feature:*'],
            tags: [cacheConfig_1.SaaSCacheTags.FEATURE_FLAGS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'feature.flag.toggled',
            patterns: ['saas:feature:flags', 'saas:feature:*:usage'],
            tags: [cacheConfig_1.SaaSCacheTags.FEATURE_FLAGS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'system.metrics.updated',
            patterns: ['saas:system:*'],
            tags: [cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'system.health.changed',
            patterns: ['saas:system:health'],
            tags: [cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'tenant.created',
            patterns: ['saas:tenants:*', 'saas:system:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.TENANTS, cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'tenant.updated',
            patterns: ['saas:tenant:*', 'saas:tenants:*'],
            tags: [cacheConfig_1.SaaSCacheTags.TENANTS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'tenant.deleted',
            patterns: ['saas:tenant:*', 'saas:tenants:*', 'saas:system:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.TENANTS, cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'billing.subscription.created',
            patterns: ['saas:billing:*', 'saas:analytics:*', 'saas:system:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.BILLING, cacheConfig_1.SaaSCacheTags.ANALYTICS, cacheConfig_1.SaaSCacheTags.SYSTEM],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'billing.subscription.updated',
            patterns: ['saas:billing:subscription:*', 'saas:billing:overview'],
            tags: [cacheConfig_1.SaaSCacheTags.BILLING],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'billing.payment.processed',
            patterns: ['saas:billing:*', 'saas:analytics:revenue:*'],
            tags: [cacheConfig_1.SaaSCacheTags.BILLING, cacheConfig_1.SaaSCacheTags.ANALYTICS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'notification.sent',
            patterns: ['saas:notifications:history:*'],
            tags: [cacheConfig_1.SaaSCacheTags.NOTIFICATIONS],
            warmAfterInvalidation: false,
        });
        this.addInvalidationRule({
            event: 'notification.settings.updated',
            patterns: ['saas:notifications:*'],
            tags: [cacheConfig_1.SaaSCacheTags.NOTIFICATIONS],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'support.ticket.created',
            patterns: ['saas:support:tickets:*', 'saas:support:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.SUPPORT],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'support.ticket.updated',
            patterns: ['saas:support:tickets:*', 'saas:support:metrics'],
            tags: [cacheConfig_1.SaaSCacheTags.SUPPORT],
            warmAfterInvalidation: false,
        });
        this.addInvalidationRule({
            event: 'api.endpoint.created',
            patterns: ['saas:api:endpoints'],
            tags: [cacheConfig_1.SaaSCacheTags.API],
            warmAfterInvalidation: true,
        });
        this.addInvalidationRule({
            event: 'api.usage.recorded',
            patterns: ['saas:api:usage:*'],
            tags: [cacheConfig_1.SaaSCacheTags.API],
            warmAfterInvalidation: false,
        });
        logger_1.default.info(`Initialized ${this.invalidationRules.size} cache invalidation rules`);
    }
    addInvalidationRule(rule) {
        this.invalidationRules.set(rule.event, rule);
    }
    async handleInvalidationEvent(event) {
        const startTime = Date.now();
        try {
            const rule = this.invalidationRules.get(event.type);
            if (!rule) {
                logger_1.default.debug(`No invalidation rule found for event: ${event.type}`);
                return;
            }
            logger_1.default.info(`Processing invalidation event: ${event.type}`);
            if (rule.patterns.length > 0) {
                await this.invalidateByPatterns(rule.patterns, event);
            }
            if (rule.tags.length > 0) {
                if (rule.warmAfterInvalidation) {
                    await this.warmingService.invalidateByTagsAndWarm(rule.tags);
                }
                else {
                    await this.cacheService.invalidateByTags(rule.tags);
                }
            }
            this.invalidationStats.successfulInvalidations++;
            this.invalidationStats.totalInvalidations++;
            this.invalidationStats.lastInvalidationTime = new Date();
            const duration = Date.now() - startTime;
            logger_1.default.info(`Invalidation event ${event.type} processed in ${duration}ms`);
        }
        catch (error) {
            this.invalidationStats.failedInvalidations++;
            this.invalidationStats.totalInvalidations++;
            logger_1.default.error(`Failed to process invalidation event ${event.type}:`, error);
        }
    }
    async invalidateByPatterns(patterns, event) {
        for (const pattern of patterns) {
            try {
                const resolvedPattern = this.resolvePattern(pattern, event);
                const deletedCount = await this.cacheService.delPattern(resolvedPattern);
                if (deletedCount > 0) {
                    logger_1.default.debug(`Invalidated ${deletedCount} cache entries matching pattern: ${resolvedPattern}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to invalidate pattern ${pattern}:`, error);
            }
        }
    }
    resolvePattern(pattern, event) {
        let resolvedPattern = pattern;
        if (event.entityId) {
            resolvedPattern = resolvedPattern.replace(/\{entityId\}/g, event.entityId);
        }
        if (event.entityType) {
            resolvedPattern = resolvedPattern.replace(/\{entityType\}/g, event.entityType);
        }
        if (event.metadata) {
            Object.entries(event.metadata).forEach(([key, value]) => {
                resolvedPattern = resolvedPattern.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
            });
        }
        return resolvedPattern;
    }
    async invalidateUserCaches(userId) {
        await this.handleInvalidationEvent({
            type: 'user.updated',
            entityId: userId,
            entityType: 'user',
            timestamp: new Date(),
        });
    }
    async invalidateTenantCaches(tenantId) {
        await this.handleInvalidationEvent({
            type: 'tenant.updated',
            entityId: tenantId,
            entityType: 'tenant',
            timestamp: new Date(),
        });
    }
    async invalidateSystemCaches() {
        await this.handleInvalidationEvent({
            type: 'system.metrics.updated',
            timestamp: new Date(),
        });
    }
    async invalidateSecurityCaches() {
        await this.handleInvalidationEvent({
            type: 'security.settings.updated',
            timestamp: new Date(),
        });
    }
    async invalidateFeatureFlagCaches(flagId) {
        await this.handleInvalidationEvent({
            type: 'feature.flag.updated',
            entityId: flagId,
            entityType: 'feature_flag',
            timestamp: new Date(),
        });
    }
    async invalidateBillingCaches(subscriptionId) {
        await this.handleInvalidationEvent({
            type: 'billing.subscription.updated',
            entityId: subscriptionId,
            entityType: 'subscription',
            timestamp: new Date(),
        });
    }
    async invalidateNotificationCaches() {
        await this.handleInvalidationEvent({
            type: 'notification.settings.updated',
            timestamp: new Date(),
        });
    }
    async invalidateSupportCaches() {
        await this.handleInvalidationEvent({
            type: 'support.ticket.created',
            timestamp: new Date(),
        });
    }
    async invalidateApiCaches() {
        await this.handleInvalidationEvent({
            type: 'api.endpoint.created',
            timestamp: new Date(),
        });
    }
    async smartInvalidate(changes) {
        const eventType = `${changes.collection}.${changes.operation}`;
        await this.handleInvalidationEvent({
            type: eventType,
            entityId: changes.documentId,
            entityType: changes.collection,
            metadata: {
                fields: changes.fields,
            },
            timestamp: new Date(),
        });
    }
    getInvalidationStats() {
        return { ...this.invalidationStats };
    }
    getInvalidationRules() {
        return Array.from(this.invalidationRules.entries()).map(([event, rule]) => ({
            event,
            rule,
        }));
    }
    async clearAllCaches() {
        try {
            logger_1.default.warn('Clearing all caches - this should only be used in emergencies');
            const result = await this.cacheService.clear();
            if (result) {
                await this.warmingService.warmCriticalCaches();
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to clear all caches:', error);
            return false;
        }
    }
}
exports.CacheInvalidationService = CacheInvalidationService;
exports.default = CacheInvalidationService.getInstance();
//# sourceMappingURL=CacheInvalidationService.js.map