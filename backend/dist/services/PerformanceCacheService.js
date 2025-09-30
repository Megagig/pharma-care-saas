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
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
const CacheManager_1 = __importDefault(require("./CacheManager"));
class PerformanceCacheService {
    constructor() {
        this.redis = null;
        this.isConnected = false;
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
        this.redis = null;
        this.isConnected = false;
    }
    static getInstance() {
        if (!PerformanceCacheService.instance) {
            PerformanceCacheService.instance = new PerformanceCacheService();
        }
        return PerformanceCacheService.instance;
    }
    async initializeRedis() {
        try {
            const cacheManager = CacheManager_1.default.getInstance();
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                enableReadyCheck: true,
                enableOfflineQueue: false,
                db: 1,
            });
            this.redis.on('connect', () => {
                this.isConnected = true;
                logger_1.default.info('Performance cache service connected to Redis');
            });
            this.redis.on('error', (error) => {
                this.isConnected = false;
                logger_1.default.error('Performance cache service Redis error:', error);
            });
            this.redis.on('close', () => {
                this.isConnected = false;
                logger_1.default.warn('Performance cache service Redis connection closed');
            });
            await this.redis.ping();
        }
        catch (error) {
            logger_1.default.error('Failed to initialize performance cache service:', error);
            this.redis = null;
            this.isConnected = false;
        }
    }
    async ensureConnection() {
        if (this.isConnected && this.redis) {
            return true;
        }
        if (!this.redis) {
            await this.initializeRedis();
        }
        return this.isConnected;
    }
    async cacheApiResponse(key, data, options = {}) {
        if (!(await this.ensureConnection())) {
            return false;
        }
        try {
            const { ttl = this.DEFAULT_TTL, compress = true, tags = [] } = options;
            const cacheKey = `${this.PREFIXES.API_RESPONSE}${key}`;
            let serializedData = JSON.stringify(data);
            if (compress && serializedData.length > this.COMPRESSION_THRESHOLD) {
                const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
                const compressed = zlib.gzipSync(Buffer.from(serializedData));
                serializedData = compressed.toString('base64');
                await this.redis.hset(`${cacheKey}:meta`, {
                    compressed: 'true',
                    originalSize: serializedData.length,
                    compressedSize: compressed.length,
                    tags: JSON.stringify(tags),
                    timestamp: Date.now(),
                });
            }
            else {
                await this.redis.hset(`${cacheKey}:meta`, {
                    compressed: 'false',
                    size: serializedData.length,
                    tags: JSON.stringify(tags),
                    timestamp: Date.now(),
                });
            }
            await this.redis.setex(cacheKey, ttl, serializedData);
            await this.redis.expire(`${cacheKey}:meta`, ttl);
            this.stats.sets++;
            logger_1.default.debug(`Cached API response: ${key}`, {
                size: serializedData.length,
                ttl,
                compressed: compress && serializedData.length > this.COMPRESSION_THRESHOLD,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Error caching API response:', error);
            return false;
        }
    }
    async getCachedApiResponse(key) {
        if (!(await this.ensureConnection())) {
            this.stats.misses++;
            return null;
        }
        try {
            const cacheKey = `${this.PREFIXES.API_RESPONSE}${key}`;
            const [data, metadata] = await Promise.all([
                this.redis.get(cacheKey),
                this.redis.hgetall(`${cacheKey}:meta`),
            ]);
            if (!data) {
                this.stats.misses++;
                return null;
            }
            let deserializedData = data;
            if (metadata.compressed === 'true') {
                const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
                const compressed = Buffer.from(data, 'base64');
                deserializedData = zlib.gunzipSync(compressed).toString();
            }
            const result = JSON.parse(deserializedData);
            this.stats.hits++;
            return result;
        }
        catch (error) {
            logger_1.default.error('Error getting cached API response:', error);
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
        if (!this.isConnected || !this.redis) {
            return 0;
        }
        try {
            let deletedCount = 0;
            const metaKeys = await this.redis.keys('*:meta');
            for (const metaKey of metaKeys) {
                const metadata = await this.redis.hgetall(metaKey);
                if (metadata.tags) {
                    const keyTags = JSON.parse(metadata.tags);
                    const hasMatchingTag = tags.some(tag => keyTags.includes(tag));
                    if (hasMatchingTag) {
                        const dataKey = metaKey.replace(':meta', '');
                        await Promise.all([
                            this.redis.del(dataKey),
                            this.redis.del(metaKey),
                        ]);
                        deletedCount++;
                    }
                }
            }
            this.stats.deletes += deletedCount;
            logger_1.default.debug(`Invalidated ${deletedCount} cache entries by tags:`, tags);
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error invalidating cache by tags:', error);
            return 0;
        }
    }
    async invalidateByPattern(pattern) {
        if (!this.isConnected || !this.redis) {
            return 0;
        }
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.stats.deletes += keys.length;
                const metaKeys = keys.map(key => `${key}:meta`);
                const existingMetaKeys = await this.redis.exists(...metaKeys);
                if (existingMetaKeys > 0) {
                    await this.redis.del(...metaKeys);
                }
                logger_1.default.debug(`Invalidated ${keys.length} cache entries by pattern: ${pattern}`);
                return keys.length;
            }
            return 0;
        }
        catch (error) {
            logger_1.default.error('Error invalidating cache by pattern:', error);
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
        if (!(await this.ensureConnection())) {
            return this.stats;
        }
        try {
            const info = await this.redis.info('memory');
            const memoryMatch = info.match(/used_memory:(\d+)/);
            this.stats.memoryUsage = memoryMatch?.[1] ? parseInt(memoryMatch[1]) : 0;
            this.stats.keyCount = await this.redis.dbsize();
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
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            await this.redis.flushdb();
            this.resetStats();
            logger_1.default.info('Performance cache cleared');
        }
        catch (error) {
            logger_1.default.error('Error clearing performance cache:', error);
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
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
            this.isConnected = false;
            logger_1.default.info('Performance cache service connection closed');
        }
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