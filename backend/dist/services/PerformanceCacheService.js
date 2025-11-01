"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../config/redis");
class PerformanceCacheService {
    constructor() {
        this.DEFAULT_TTL = 300;
        this.COMPRESSION_THRESHOLD = 1024;
        this.PREFIXES = {
            API_RESPONSE: 'api:',
            DASHBOARD: 'dashboard:',
            USER_PROFILE: 'user_profile:',
            PATIENT_LIST: 'patient_list:',
            CLINICAL_NOTES: 'clinical_notes:',
            MEDICATIONS: 'medications:',
            REPORTS: 'reports:',
            SEARCH_RESULTS: 'search:',
            AGGREGATIONS: 'agg:',
        };
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            memoryUsage: 0,
            keyCount: 0,
        };
    }
    static getInstance() {
        if (!PerformanceCacheService.instance) {
            PerformanceCacheService.instance = new PerformanceCacheService();
        }
        return PerformanceCacheService.instance;
    }
    async cacheApiResponse(key, data, options = {}) {
        try {
            if (!(0, redis_1.isRedisAvailable)()) {
                logger_1.default.debug('Performance cache: Redis not available');
                return false;
            }
            const redis = await (0, redis_1.getRedisClient)();
            if (!redis) {
                return false;
            }
            const ttl = options.ttl || this.DEFAULT_TTL;
            const serialized = JSON.stringify(data);
            await redis.setex(key, ttl, serialized);
            this.stats.sets++;
            return true;
        }
        catch (error) {
            logger_1.default.error('Performance cache: Error caching API response:', error);
            return false;
        }
    }
    async getCachedApiResponse(key) {
        try {
            if (!(0, redis_1.isRedisAvailable)()) {
                this.stats.misses++;
                return null;
            }
            const redis = await (0, redis_1.getRedisClient)();
            if (!redis) {
                this.stats.misses++;
                return null;
            }
            const cached = await redis.get(key);
            if (!cached) {
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            return JSON.parse(cached);
        }
        catch (error) {
            logger_1.default.error('Performance cache: Error getting cached API response:', error);
            this.stats.misses++;
            return null;
        }
    }
    async cacheDashboardOverview(userId, workspaceId, data, ttl = 300) {
        const key = `${this.PREFIXES.DASHBOARD}${workspaceId}:${userId}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['dashboard', 'user-specific']
        });
    }
    async getCachedDashboardOverview(userId, workspaceId) {
        const key = `${this.PREFIXES.DASHBOARD}${workspaceId}:${userId}`;
        return this.getCachedApiResponse(key);
    }
    async cacheUserProfile(userId, data, ttl = 600) {
        const key = `${this.PREFIXES.USER_PROFILE}${userId}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['user-profile']
        });
    }
    async getCachedUserProfile(userId) {
        const key = `${this.PREFIXES.USER_PROFILE}${userId}`;
        return this.getCachedApiResponse(key);
    }
    async cachePatientList(workspaceId, filters, data, ttl = 180) {
        const filterHash = this.hashFilters(filters);
        const key = `${this.PREFIXES.PATIENT_LIST}${workspaceId}:${filterHash}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['patients', 'list']
        });
    }
    async getCachedPatientList(workspaceId, filters) {
        const filterHash = this.hashFilters(filters);
        const key = `${this.PREFIXES.PATIENT_LIST}${workspaceId}:${filterHash}`;
        return this.getCachedApiResponse(key);
    }
    async cacheClinicalNotes(patientId, data, ttl = 300) {
        const key = `${this.PREFIXES.CLINICAL_NOTES}${patientId}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['clinical-notes', 'patient-specific']
        });
    }
    async getCachedClinicalNotes(patientId) {
        const key = `${this.PREFIXES.CLINICAL_NOTES}${patientId}`;
        return this.getCachedApiResponse(key);
    }
    async cacheSearchResults(query, type, workspaceId, data, ttl = 600) {
        const queryHash = this.hashQuery(query);
        const key = `${this.PREFIXES.SEARCH_RESULTS}${type}:${workspaceId}:${queryHash}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['search', type]
        });
    }
    async getCachedSearchResults(query, type, workspaceId) {
        const queryHash = this.hashQuery(query);
        const key = `${this.PREFIXES.SEARCH_RESULTS}${type}:${workspaceId}:${queryHash}`;
        return this.getCachedApiResponse(key);
    }
    async cacheAggregation(name, params, data, ttl = 900) {
        const paramsHash = this.hashFilters(params);
        const key = `${this.PREFIXES.AGGREGATIONS}${name}:${paramsHash}`;
        return this.cacheApiResponse(key, data, {
            ttl,
            tags: ['aggregation', name]
        });
    }
    async getCachedAggregation(name, params) {
        const paramsHash = this.hashFilters(params);
        const key = `${this.PREFIXES.AGGREGATIONS}${name}:${paramsHash}`;
        return this.getCachedApiResponse(key);
    }
    async invalidateByTags(tags) {
        try {
            if (!(0, redis_1.isRedisAvailable)()) {
                return 0;
            }
            let deletedCount = 0;
            for (const tag of tags) {
                const pattern = `*:tag:${tag}:*`;
                const deleted = await this.invalidateByPattern(pattern);
                deletedCount += deleted;
            }
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Performance cache: Error invalidating by tags:', error);
            return 0;
        }
    }
    async invalidateByPattern(pattern) {
        try {
            if (!(0, redis_1.isRedisAvailable)()) {
                return 0;
            }
            const redis = await (0, redis_1.getRedisClient)();
            if (!redis) {
                return 0;
            }
            const keys = await redis.keys(pattern);
            if (keys.length === 0)
                return 0;
            const deleted = await redis.del(...keys);
            this.stats.deletes += deleted;
            logger_1.default.debug(`Performance cache: Invalidated ${deleted} cache entries by pattern: ${pattern}`);
            return deleted;
        }
        catch (error) {
            logger_1.default.error('Performance cache: Error invalidating cache by pattern:', error);
            return 0;
        }
    }
    async invalidateUserCache(userId) {
        await Promise.all([
            this.invalidateByPattern(`${this.PREFIXES.USER_PROFILE}${userId}*`),
            this.invalidateByPattern(`${this.PREFIXES.DASHBOARD}*:${userId}`),
            this.invalidateByTags(['user-specific']),
        ]);
    }
    async invalidatePatientCache(patientId) {
        await Promise.all([
            this.invalidateByPattern(`${this.PREFIXES.CLINICAL_NOTES}${patientId}*`),
            this.invalidateByPattern(`${this.PREFIXES.MEDICATIONS}${patientId}*`),
            this.invalidateByTags(['patient-specific']),
        ]);
    }
    async getStats() {
        if (!(0, redis_1.isRedisAvailable)()) {
            return this.stats;
        }
        try {
            const redis = await (0, redis_1.getRedisClient)();
            if (!redis) {
                return this.stats;
            }
            const info = await redis.info('memory');
            const memoryMatch = info.match(/used_memory:(\d+)/);
            this.stats.memoryUsage = memoryMatch?.[1] ? parseInt(memoryMatch[1]) : 0;
            this.stats.keyCount = await redis.dbsize();
            const totalOperations = this.stats.hits + this.stats.misses;
            this.stats.hitRate = totalOperations > 0
                ? (this.stats.hits / totalOperations) * 100
                : 0;
            return { ...this.stats };
        }
        catch (error) {
            logger_1.default.error('Error getting cache stats:', error);
            return this.stats;
        }
    }
    async clearAll() {
        try {
            if (!(0, redis_1.isRedisAvailable)()) {
                return;
            }
            const redis = await (0, redis_1.getRedisClient)();
            if (!redis) {
                return;
            }
            await redis.flushdb();
            this.resetStats();
            logger_1.default.info('Performance cache cleared');
        }
        catch (error) {
            logger_1.default.error('Performance cache: Error clearing cache:', error);
        }
    }
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            memoryUsage: 0,
            keyCount: 0,
        };
    }
    hashFilters(filters) {
        const crypto = require('crypto');
        const normalized = JSON.stringify(filters, Object.keys(filters).sort());
        return crypto.createHash('md5').update(normalized).digest('hex');
    }
    hashQuery(query) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
    }
    async close() {
        logger_1.default.info('Performance cache: Connection managed by RedisConnectionManager');
    }
    async get(key) {
        return this.getCachedApiResponse(key);
    }
    async set(key, value, ttl) {
        return this.cacheApiResponse(key, value, { ttl });
    }
    async invalidate(pattern) {
        return this.invalidateByPattern(pattern);
    }
}
exports.default = PerformanceCacheService;
//# sourceMappingURL=PerformanceCacheService.js.map