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
exports.CachedReportService = exports.CacheKeyGenerator = exports.RedisCacheService = void 0;
const perf_hooks_1 = require("perf_hooks");
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../config/redis");
class RedisCacheService {
    constructor() {
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalOperations: 0,
            avgResponseTime: 0,
        };
        this.responseTimes = [];
    }
    static getInstance() {
        if (!RedisCacheService.instance) {
            RedisCacheService.instance = new RedisCacheService();
        }
        return RedisCacheService.instance;
    }
    async set(key, value, options = {}) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        const startTime = perf_hooks_1.performance.now();
        try {
            const { ttl = 300, compress = true, tags = [], } = options;
            let serializedValue = JSON.stringify(value);
            if (compress && serializedValue.length > 1024) {
                const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
                serializedValue = zlib.gzipSync(serializedValue).toString('base64');
                key = `compressed:${key}`;
            }
            const result = await redis.setex(key, ttl, serializedValue);
            if (tags.length > 0) {
                await this.addCacheTags(key, tags, ttl);
            }
            await redis.setex(`meta:${key}`, ttl, JSON.stringify({
                createdAt: new Date().toISOString(),
                ttl,
                tags,
                compressed: compress && serializedValue.length > 1024,
            }));
            this.updateStats(perf_hooks_1.performance.now() - startTime);
            return result === 'OK';
        }
        catch (error) {
            logger_1.default.error('RedisCacheService: Set error:', error);
            return false;
        }
    }
    async get(key) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return null;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            this.stats.misses++;
            return null;
        }
        const startTime = perf_hooks_1.performance.now();
        try {
            let value = await redis.get(key);
            if (value === null) {
                const compressedValue = await redis.get(`compressed:${key}`);
                if (compressedValue) {
                    const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
                    value = zlib.gunzipSync(Buffer.from(compressedValue, 'base64')).toString();
                }
                else {
                    this.stats.misses++;
                    this.updateStats(perf_hooks_1.performance.now() - startTime);
                    return null;
                }
            }
            this.stats.hits++;
            this.updateStats(perf_hooks_1.performance.now() - startTime);
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.default.error('RedisCacheService: Get error:', error);
            this.stats.misses++;
            this.updateStats(perf_hooks_1.performance.now() - startTime);
            return null;
        }
    }
    async mget(keys) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return keys.map(() => null);
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            this.stats.misses += keys.length;
            return keys.map(() => null);
        }
        const startTime = perf_hooks_1.performance.now();
        try {
            const values = await redis.mget(...keys);
            const results = [];
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (value === null) {
                    const compressedValue = await redis.get(`compressed:${keys[i]}`);
                    if (compressedValue) {
                        const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
                        const decompressed = zlib.gunzipSync(Buffer.from(compressedValue, 'base64')).toString();
                        results.push(JSON.parse(decompressed));
                        this.stats.hits++;
                    }
                    else {
                        results.push(null);
                        this.stats.misses++;
                    }
                }
                else {
                    results.push(JSON.parse(value));
                    this.stats.hits++;
                }
            }
            this.updateStats(perf_hooks_1.performance.now() - startTime);
            return results;
        }
        catch (error) {
            logger_1.default.error('Redis mget error:', error);
            this.stats.misses += keys.length;
            this.updateStats(perf_hooks_1.performance.now() - startTime);
            return keys.map(() => null);
        }
    }
    async del(key) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            const pipeline = redis.pipeline();
            pipeline.del(key);
            pipeline.del(`compressed:${key}`);
            pipeline.del(`meta:${key}`);
            const results = await pipeline.exec();
            return results?.some(([err, result]) => !err && result === 1) || false;
        }
        catch (error) {
            logger_1.default.error('Redis del error:', error);
            return false;
        }
    }
    async delPattern(pattern) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return 0;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return 0;
        }
        try {
            const keys = await redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const pipeline = redis.pipeline();
            keys.forEach(key => {
                pipeline.del(key);
                pipeline.del(`compressed:${key}`);
                pipeline.del(`meta:${key}`);
            });
            const results = await pipeline.exec();
            return results?.filter(([err, result]) => !err && result).length || 0;
        }
        catch (error) {
            logger_1.default.error('Redis delPattern error:', error);
            return 0;
        }
    }
    async ping() {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            const result = await redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.default.error('Redis ping error:', error);
            return false;
        }
    }
    async exists(key) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            const exists = await redis.exists(key);
            if (exists === 0) {
                return (await redis.exists(`compressed:${key}`)) === 1;
            }
            return exists === 1;
        }
        catch (error) {
            logger_1.default.error('Redis exists error:', error);
            return false;
        }
    }
    async expire(key, ttl) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            const pipeline = redis.pipeline();
            pipeline.expire(key, ttl);
            pipeline.expire(`compressed:${key}`, ttl);
            pipeline.expire(`meta:${key}`, ttl);
            const results = await pipeline.exec();
            return results?.some(([err, result]) => !err && result === 1) || false;
        }
        catch (error) {
            logger_1.default.error('Redis expire error:', error);
            return false;
        }
    }
    async ttl(key) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return -1;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return -1;
        }
        try {
            let ttl = await redis.ttl(key);
            if (ttl === -2) {
                ttl = await redis.ttl(`compressed:${key}`);
            }
            return ttl;
        }
        catch (error) {
            logger_1.default.error('Redis ttl error:', error);
            return -1;
        }
    }
    async invalidateByTags(tags) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return 0;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return 0;
        }
        try {
            let deletedCount = 0;
            for (const tag of tags) {
                const keys = await redis.smembers(`tag:${tag}`);
                if (keys.length > 0) {
                    const pipeline = redis.pipeline();
                    keys.forEach(key => {
                        pipeline.del(key);
                        pipeline.del(`compressed:${key}`);
                        pipeline.del(`meta:${key}`);
                    });
                    pipeline.del(`tag:${tag}`);
                    const results = await pipeline.exec();
                    deletedCount += results?.filter(([err, result]) => !err && result === 1).length || 0;
                }
            }
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Redis invalidateByTags error:', error);
            return 0;
        }
    }
    async clear() {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            await redis.flushdb();
            this.resetStats();
            return true;
        }
        catch (error) {
            logger_1.default.error('Redis clear error:', error);
            return false;
        }
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalOperations: 0,
            avgResponseTime: 0,
        };
        this.responseTimes = [];
    }
    async getInfo() {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return null;
        }
        try {
            const info = await redis.info();
            const memory = await redis.info('memory');
            const stats = await redis.info('stats');
            return {
                info,
                memory,
                stats,
                cacheStats: this.getStats(),
            };
        }
        catch (error) {
            logger_1.default.error('Redis getInfo error:', error);
            return null;
        }
    }
    async healthCheck() {
        if (!(0, redis_1.isRedisAvailable)()) {
            return false;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return false;
        }
        try {
            const result = await redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.default.error('Redis health check failed:', error);
            return false;
        }
    }
    async close() {
        logger_1.default.info('RedisCacheService: Using shared Redis connection (no individual close needed)');
    }
    async addCacheTags(key, tags, ttl) {
        if (!(0, redis_1.isRedisAvailable)()) {
            return;
        }
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis) {
            return;
        }
        if (!redis) {
            return;
        }
        const pipeline = redis.pipeline();
        tags.forEach(tag => {
            pipeline.sadd(`tag:${tag}`, key);
            pipeline.expire(`tag:${tag}`, ttl);
        });
        await pipeline.exec();
    }
    updateStats(responseTime) {
        this.stats.totalOperations++;
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
        this.stats.hitRate = (this.stats.hits / this.stats.totalOperations) * 100;
        this.stats.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }
}
exports.RedisCacheService = RedisCacheService;
class CacheKeyGenerator {
    static reportData(reportType, workplaceId, filters) {
        const filterHash = this.hashObject(filters);
        return `${this.PREFIX}data:${reportType}:${workplaceId}:${filterHash}`;
    }
    static reportSummary(workplaceId, period) {
        return `${this.PREFIX}summary:${workplaceId}:${period}`;
    }
    static aggregationResult(modelName, pipelineHash) {
        return `${this.PREFIX}agg:${modelName}:${pipelineHash}`;
    }
    static userReports(userId) {
        return `${this.PREFIX}user:${userId}`;
    }
    static reportTemplate(templateId) {
        return `${this.PREFIX}template:${templateId}`;
    }
    static hashObject(obj) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
    }
}
exports.CacheKeyGenerator = CacheKeyGenerator;
CacheKeyGenerator.PREFIX = 'reports:';
class CachedReportService {
    constructor() {
        this.cache = RedisCacheService.getInstance();
    }
    async getCachedReportData(reportType, workplaceId, filters, fetchFn, ttl = 300) {
        const cacheKey = CacheKeyGenerator.reportData(reportType, workplaceId, filters);
        const cached = await this.cache.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
        const data = await fetchFn();
        await this.cache.set(cacheKey, data, {
            ttl,
            tags: [`report:${reportType}`, `workplace:${workplaceId}`],
        });
        return data;
    }
    async invalidateReportCache(reportType, workplaceId) {
        const tags = [];
        if (reportType) {
            tags.push(`report:${reportType}`);
        }
        if (workplaceId) {
            tags.push(`workplace:${workplaceId}`);
        }
        if (tags.length > 0) {
            await this.cache.invalidateByTags(tags);
        }
        else {
            await this.cache.invalidateByTags(['reports']);
        }
    }
}
exports.CachedReportService = CachedReportService;
exports.default = RedisCacheService.getInstance();
//# sourceMappingURL=RedisCacheService.js.map