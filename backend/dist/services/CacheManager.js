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
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class CacheManager {
    constructor() {
        this.redis = null;
        this.isConnected = false;
        this.DEFAULT_TTL = 5 * 60;
        this.MAX_MEMORY_USAGE = 100 * 1024 * 1024;
        this.CACHE_VERSION = '1.0.0';
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            totalOperations: 0,
            memoryUsage: 0,
            keyCount: 0
        };
        this.PREFIXES = {
            USER_PERMISSIONS: 'user_perms:',
            ROLE_PERMISSIONS: 'role_perms:',
            ROLE_HIERARCHY: 'role_hier:',
            PERMISSION_CHECK: 'perm_check:',
            USER_ROLES: 'user_roles:',
            METRICS: 'cache_metrics:'
        };
        this.initializeRedis();
    }
    static getInstance() {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
    async initializeRedis() {
        const cacheProvider = process.env.CACHE_PROVIDER || 'redis';
        if (cacheProvider === 'memory') {
            logger_1.default.info('CacheManager: Using memory cache provider instead of Redis');
            this.redis = null;
            this.isConnected = false;
            return;
        }
        try {
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                logger_1.default.info('CacheManager: REDIS_URL not configured, using in-memory fallback');
                this.redis = null;
                this.isConnected = false;
                return;
            }
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: false,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                enableReadyCheck: true,
                enableOfflineQueue: false,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 200, 3000);
                    if (times > 10) {
                        logger_1.default.error('CacheManager: Max Redis retry attempts reached, disabling cache');
                        this.isConnected = false;
                        return null;
                    }
                    return delay;
                },
                reconnectOnError: (err) => {
                    logger_1.default.warn('CacheManager: Redis reconnect attempt:', err.message);
                    return true;
                },
            });
            this.redis.on('connect', () => {
                this.isConnected = true;
                logger_1.default.info('✅ CacheManager: Redis connected');
            });
            this.redis.on('ready', () => {
                this.isConnected = true;
            });
            this.redis.on('error', (error) => {
                this.isConnected = false;
                logger_1.default.error('CacheManager: Redis error:', error.message);
            });
            this.redis.on('close', () => {
                this.isConnected = false;
                logger_1.default.warn('CacheManager: Redis connection closed');
            });
            this.redis.on('end', () => {
                this.isConnected = false;
                logger_1.default.warn('CacheManager: Redis connection ended');
            });
            await this.redis.ping();
            this.isConnected = true;
            logger_1.default.info('CacheManager: Redis connection verified');
        }
        catch (error) {
            logger_1.default.error('CacheManager: Failed to initialize Redis, falling back to memory cache:', error);
            this.redis = null;
            this.isConnected = false;
        }
    }
    async cacheUserPermissions(userId, permissions, sources, deniedPermissions = [], workspaceId, ttl = this.DEFAULT_TTL) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            const key = this.getUserPermissionKey(userId, workspaceId);
            const cacheEntry = {
                permissions,
                sources,
                deniedPermissions,
                userId: userId.toString(),
                workspaceId: workspaceId?.toString(),
                lastUpdated: Date.now(),
                expiresAt: Date.now() + (ttl * 1000)
            };
            await this.redis.setex(key, ttl, JSON.stringify(cacheEntry));
            this.metrics.sets++;
            logger_1.default.debug(`Cached permissions for user ${userId}`, {
                permissionCount: permissions.length,
                ttl,
                workspaceId: workspaceId?.toString()
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Error caching user permissions:', error);
            return false;
        }
    }
    async getCachedUserPermissions(userId, workspaceId) {
        if (!this.isConnected || !this.redis) {
            this.metrics.misses++;
            return null;
        }
        try {
            const key = this.getUserPermissionKey(userId, workspaceId);
            const cached = await this.redis.get(key);
            if (!cached) {
                this.metrics.misses++;
                return null;
            }
            const cacheEntry = JSON.parse(cached);
            if (Date.now() > cacheEntry.expiresAt) {
                await this.redis.del(key);
                this.metrics.misses++;
                return null;
            }
            this.metrics.hits++;
            return cacheEntry;
        }
        catch (error) {
            logger_1.default.error('Error getting cached user permissions:', error);
            this.metrics.misses++;
            return null;
        }
    }
    async cacheRolePermissions(roleId, permissions, inheritedPermissions, hierarchyLevel, parentRoleId, ttl = this.DEFAULT_TTL) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            const key = this.getRolePermissionKey(roleId);
            const cacheEntry = {
                roleId: roleId.toString(),
                permissions,
                inheritedPermissions,
                hierarchyLevel,
                parentRoleId: parentRoleId?.toString(),
                lastUpdated: Date.now(),
                expiresAt: Date.now() + (ttl * 1000)
            };
            await this.redis.setex(key, ttl, JSON.stringify(cacheEntry));
            this.metrics.sets++;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error caching role permissions:', error);
            return false;
        }
    }
    async getCachedRolePermissions(roleId) {
        if (!this.isConnected || !this.redis) {
            this.metrics.misses++;
            return null;
        }
        try {
            const key = this.getRolePermissionKey(roleId);
            const cached = await this.redis.get(key);
            if (!cached) {
                this.metrics.misses++;
                return null;
            }
            const cacheEntry = JSON.parse(cached);
            if (Date.now() > cacheEntry.expiresAt) {
                await this.redis.del(key);
                this.metrics.misses++;
                return null;
            }
            this.metrics.hits++;
            return cacheEntry;
        }
        catch (error) {
            logger_1.default.error('Error getting cached role permissions:', error);
            this.metrics.misses++;
            return null;
        }
    }
    async cachePermissionCheck(userId, action, allowed, source, workspaceId, ttl = this.DEFAULT_TTL) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            const key = this.getPermissionCheckKey(userId, action, workspaceId);
            const cacheEntry = {
                allowed,
                source,
                timestamp: Date.now(),
                expiresAt: Date.now() + (ttl * 1000)
            };
            await this.redis.setex(key, ttl, JSON.stringify(cacheEntry));
            this.metrics.sets++;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error caching permission check:', error);
            return false;
        }
    }
    async getCachedPermissionCheck(userId, action, workspaceId) {
        if (!this.isConnected || !this.redis) {
            this.metrics.misses++;
            return null;
        }
        try {
            const key = this.getPermissionCheckKey(userId, action, workspaceId);
            const cached = await this.redis.get(key);
            if (!cached) {
                this.metrics.misses++;
                return null;
            }
            const cacheEntry = JSON.parse(cached);
            if (Date.now() > cacheEntry.expiresAt) {
                await this.redis.del(key);
                this.metrics.misses++;
                return null;
            }
            this.metrics.hits++;
            return {
                allowed: cacheEntry.allowed,
                source: cacheEntry.source,
                timestamp: cacheEntry.timestamp
            };
        }
        catch (error) {
            logger_1.default.error('Error getting cached permission check:', error);
            this.metrics.misses++;
            return null;
        }
    }
    async invalidateUserCache(userId, workspaceId) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const patterns = [
                this.getUserPermissionKey(userId, workspaceId),
                `${this.PREFIXES.PERMISSION_CHECK}${userId}:*`,
                `${this.PREFIXES.USER_ROLES}${userId}:*`
            ];
            for (const pattern of patterns) {
                if (pattern.includes('*')) {
                    const keys = await this.redis.keys(pattern);
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                        this.metrics.deletes += keys.length;
                    }
                }
                else {
                    await this.redis.del(pattern);
                    this.metrics.deletes++;
                }
            }
            logger_1.default.debug(`Invalidated cache for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error invalidating user cache:', error);
        }
    }
    async invalidateRoleCache(roleId) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const patterns = [
                this.getRolePermissionKey(roleId),
                `${this.PREFIXES.ROLE_HIERARCHY}${roleId}:*`,
                `${this.PREFIXES.ROLE_HIERARCHY}*:${roleId}`
            ];
            for (const pattern of patterns) {
                if (pattern.includes('*')) {
                    const keys = await this.redis.keys(pattern);
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                        this.metrics.deletes += keys.length;
                    }
                }
                else {
                    await this.redis.del(pattern);
                    this.metrics.deletes++;
                }
            }
            logger_1.default.debug(`Invalidated cache for role ${roleId}`);
        }
        catch (error) {
            logger_1.default.error('Error invalidating role cache:', error);
        }
    }
    async invalidatePattern(pattern) {
        if (!this.isConnected || !this.redis) {
            return 0;
        }
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.metrics.deletes += keys.length;
                return keys.length;
            }
            return 0;
        }
        catch (error) {
            logger_1.default.error('Error invalidating cache pattern:', error);
            return 0;
        }
    }
    async warmCache(warmingStrategies) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            logger_1.default.info('Starting cache warming process');
            for (const strategy of warmingStrategies) {
                switch (strategy.type) {
                    case 'user_permissions':
                        await this.warmUserPermissions(strategy.targets);
                        break;
                    case 'role_permissions':
                        await this.warmRolePermissions(strategy.targets);
                        break;
                    case 'permission_checks':
                        await this.warmPermissionChecks(strategy.targets);
                        break;
                }
            }
            logger_1.default.info('Cache warming completed');
        }
        catch (error) {
            logger_1.default.error('Error warming cache:', error);
        }
    }
    async warmUserPermissions(userIds) {
        logger_1.default.debug(`Warming user permissions cache for ${userIds.length} users`);
    }
    async warmRolePermissions(roleIds) {
        logger_1.default.debug(`Warming role permissions cache for ${roleIds.length} roles`);
    }
    async warmPermissionChecks(userIds) {
        logger_1.default.debug(`Warming permission checks cache for ${userIds.length} users`);
    }
    async checkConsistency() {
        if (!this.isConnected || !this.redis) {
            return {
                consistent: false,
                issues: ['Redis not connected'],
                repaired: 0
            };
        }
        const issues = [];
        let repaired = 0;
        try {
            const allKeys = await this.redis.keys('*');
            const now = Date.now();
            for (const key of allKeys) {
                try {
                    const value = await this.redis.get(key);
                    if (value) {
                        const parsed = JSON.parse(value);
                        if (parsed.expiresAt && now > parsed.expiresAt) {
                            await this.redis.del(key);
                            repaired++;
                        }
                    }
                }
                catch (error) {
                    await this.redis.del(key);
                    issues.push(`Removed invalid cache entry: ${key}`);
                    repaired++;
                }
            }
            await this.checkOrphanedEntries(issues, repaired);
            await this.validateCacheKeyPatterns(issues);
            try {
                const memoryStats = await this.redis.memory('STATS');
                const memoryUsage = memoryStats.length > 0 && memoryStats[0] ? parseInt(memoryStats[0]) : 0;
                if (memoryUsage > this.MAX_MEMORY_USAGE) {
                    issues.push(`Memory usage (${memoryUsage}) exceeds limit (${this.MAX_MEMORY_USAGE})`);
                    await this.performMemoryCleanup();
                    repaired++;
                }
            }
            catch (error) {
                logger_1.default.debug('Memory stats not available:', error);
            }
            await this.checkCacheFragmentation(issues);
            return {
                consistent: issues.length === 0,
                issues,
                repaired
            };
        }
        catch (error) {
            logger_1.default.error('Error checking cache consistency:', error);
            return {
                consistent: false,
                issues: ['Error checking consistency'],
                repaired
            };
        }
    }
    async checkOrphanedEntries(issues, repaired) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const userPermKeys = await this.redis.keys(`${this.PREFIXES.USER_PERMISSIONS}*`);
            for (const key of userPermKeys) {
                const userId = key.replace(this.PREFIXES.USER_PERMISSIONS, '').split(':')[0];
                if (userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    try {
                        const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
                        const userExists = await User.exists({ _id: userId });
                        if (!userExists) {
                            await this.redis.del(key);
                            issues.push(`Removed orphaned user permission cache: ${userId}`);
                            repaired++;
                        }
                    }
                    catch (error) {
                        logger_1.default.debug(`Error checking user existence for ${userId}:`, error);
                    }
                }
            }
            const rolePermKeys = await this.redis.keys(`${this.PREFIXES.ROLE_PERMISSIONS}*`);
            for (const key of rolePermKeys) {
                const roleId = key.replace(this.PREFIXES.ROLE_PERMISSIONS, '');
                if (roleId && mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                    try {
                        const Role = (await Promise.resolve().then(() => __importStar(require('../models/Role')))).default;
                        const roleExists = await Role.exists({ _id: roleId, isActive: true });
                        if (!roleExists) {
                            await this.redis.del(key);
                            issues.push(`Removed orphaned role permission cache: ${roleId}`);
                            repaired++;
                        }
                    }
                    catch (error) {
                        logger_1.default.debug(`Error checking role existence for ${roleId}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error checking orphaned entries:', error);
        }
    }
    async validateCacheKeyPatterns(issues) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const allKeys = await this.redis.keys('*');
            const validPrefixes = Object.values(this.PREFIXES);
            for (const key of allKeys) {
                const hasValidPrefix = validPrefixes.some(prefix => key.startsWith(prefix));
                if (!hasValidPrefix) {
                    issues.push(`Invalid cache key pattern: ${key}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error validating cache key patterns:', error);
        }
    }
    async performMemoryCleanup() {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const allKeys = await this.redis.keys('*');
            const now = Date.now();
            let cleanedCount = 0;
            for (const key of allKeys) {
                try {
                    const value = await this.redis.get(key);
                    if (value) {
                        const parsed = JSON.parse(value);
                        if (parsed.expiresAt && now > parsed.expiresAt) {
                            await this.redis.del(key);
                            cleanedCount++;
                        }
                    }
                }
                catch (error) {
                    await this.redis.del(key);
                    cleanedCount++;
                }
            }
            const memoryStats = await this.redis.memory('STATS');
            const memoryUsage = memoryStats.length > 0 && memoryStats[0] ? parseInt(memoryStats[0]) : 0;
            if (memoryUsage > this.MAX_MEMORY_USAGE * 0.8) {
                const keysToRemove = Math.floor(allKeys.length * 0.1);
                const sortedKeys = allKeys.sort();
                for (let i = 0; i < keysToRemove && i < sortedKeys.length; i++) {
                    const key = sortedKeys[i];
                    if (key) {
                        await this.redis.del(key);
                        cleanedCount++;
                    }
                }
            }
            logger_1.default.info(`Memory cleanup completed, removed ${cleanedCount} cache entries`);
        }
        catch (error) {
            logger_1.default.error('Error performing memory cleanup:', error);
        }
    }
    async checkCacheFragmentation(issues) {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            const info = await this.redis.info('memory');
            const fragmentationMatch = info.match(/mem_fragmentation_ratio:(\d+\.?\d*)/);
            if (fragmentationMatch && fragmentationMatch[1]) {
                const fragmentationRatio = parseFloat(fragmentationMatch[1]);
                if (fragmentationRatio > 1.5) {
                    issues.push(`High memory fragmentation ratio: ${fragmentationRatio}`);
                }
            }
        }
        catch (error) {
            logger_1.default.debug('Error checking cache fragmentation:', error);
        }
    }
    async getMetrics() {
        if (!this.isConnected || !this.redis) {
            return this.metrics;
        }
        try {
            const info = await this.redis.info('memory');
            const memoryMatch = info.match(/used_memory:(\d+)/);
            this.metrics.memoryUsage = memoryMatch && memoryMatch[1] ? parseInt(memoryMatch[1]) : 0;
            this.metrics.keyCount = await this.redis.dbsize();
            this.metrics.totalOperations = this.metrics.hits + this.metrics.misses;
            this.metrics.hitRate = this.metrics.totalOperations > 0
                ? (this.metrics.hits / this.metrics.totalOperations) * 100
                : 0;
            return { ...this.metrics };
        }
        catch (error) {
            logger_1.default.error('Error getting cache metrics:', error);
            return this.metrics;
        }
    }
    async clearAll() {
        if (!this.isConnected || !this.redis) {
            return;
        }
        try {
            await this.redis.flushdb();
            this.resetMetrics();
            logger_1.default.info('All cache cleared');
        }
        catch (error) {
            logger_1.default.error('Error clearing cache:', error);
        }
    }
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            totalOperations: 0,
            memoryUsage: 0,
            keyCount: 0
        };
    }
    getUserPermissionKey(userId, workspaceId) {
        const base = `${this.PREFIXES.USER_PERMISSIONS}${userId}`;
        return workspaceId ? `${base}:${workspaceId}` : base;
    }
    getRolePermissionKey(roleId) {
        return `${this.PREFIXES.ROLE_PERMISSIONS}${roleId}`;
    }
    getPermissionCheckKey(userId, action, workspaceId) {
        const base = `${this.PREFIXES.PERMISSION_CHECK}${userId}:${action}`;
        return workspaceId ? `${base}:${workspaceId}` : base;
    }
    async close() {
        try {
            if (this.redis) {
                logger_1.default.info('CacheManager: Closing Redis connection...');
                await this.redis.quit();
                this.redis = null;
                this.isConnected = false;
                logger_1.default.info('CacheManager: Redis connection closed gracefully');
            }
        }
        catch (error) {
            logger_1.default.error('CacheManager: Error during close:', error);
            if (this.redis) {
                this.redis.disconnect();
                this.redis = null;
                this.isConnected = false;
            }
        }
    }
}
exports.default = CacheManager;
//# sourceMappingURL=CacheManager.js.map