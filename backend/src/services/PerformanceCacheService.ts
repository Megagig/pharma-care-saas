import Redis from 'ioredis';
import logger from '../utils/logger';
import CacheManager from './CacheManager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large payloads
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
}

/**
 * Performance-focused caching service for API responses and expensive operations
 * Extends the existing CacheManager with general-purpose caching capabilities
 */
export default class PerformanceCacheService {
  private static instance: PerformanceCacheService;
  private redis: Redis | null = null;
  private isConnected = false;
  private isInitializing = false;
  private initializationFailed = false;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  // Cache prefixes for different data types
  private readonly PREFIXES = {
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

  // Performance metrics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    memoryUsage: 0,
    keyCount: 0,
  };

  private constructor() {
    // Don't initialize Redis immediately - do it lazily
    this.redis = null;
    this.isConnected = false;
  }

  public static getInstance(): PerformanceCacheService {
    if (!PerformanceCacheService.instance) {
      PerformanceCacheService.instance = new PerformanceCacheService();
    }
    return PerformanceCacheService.instance;
  }

  /**
   * Initialize Redis connection (reuse existing CacheManager connection if possible)
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Try to reuse existing CacheManager connection
      const cacheManager = CacheManager.getInstance();

      // Create our own Redis connection for performance caching
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: false, // Connect immediately
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableReadyCheck: true,
        enableOfflineQueue: true, // Enable offline queue to prevent errors
        db: 1, // Use different database than CacheManager
        retryStrategy: (times) => {
          // Retry with exponential backoff, max 3 seconds
          const delay = Math.min(times * 50, 3000);
          return delay;
        },
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Performance cache service connected to Redis');
      });

      this.redis.on('ready', () => {
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        // Only log error once, not repeatedly
        if (!error.message.includes('ECONNREFUSED')) {
          logger.error('Performance cache service Redis error:', error);
        }
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });

      // Wait for connection to be ready
      await this.redis.ping();
      this.isConnected = true;
      this.initializationFailed = false;

    } catch (error) {
      // Silently fail - caching is optional
      logger.warn('Performance cache service unavailable, continuing without cache');
      this.redis = null;
      this.isConnected = false;
      this.initializationFailed = true;
      
      // Reset failure flag after 30 seconds to allow retry
      setTimeout(() => {
        this.initializationFailed = false;
      }, 30000);
    }
  }

  /**
   * Ensure Redis connection is initialized
   */
  private async ensureConnection(): Promise<boolean> {
    // If already connected, return true
    if (this.isConnected && this.redis) {
      return true;
    }

    // If initialization failed before, don't retry immediately
    if (this.initializationFailed) {
      return false;
    }

    // If currently initializing, wait a bit
    if (this.isInitializing) {
      return false;
    }

    // Try to initialize if not already done
    if (!this.redis) {
      this.isInitializing = true;
      try {
        await this.initializeRedis();
      } finally {
        this.isInitializing = false;
      }
    }

    return this.isConnected;
  }

  /**
   * Cache API response with automatic compression for large payloads
   */
  public async cacheApiResponse(
    key: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!(await this.ensureConnection())) {
      return false;
    }

    try {
      const { ttl = this.DEFAULT_TTL, compress = true, tags = [] } = options;
      // Return early if Redis not available
      if (!this.redis) {
        return;
      }

      const cacheKey = `${this.PREFIXES.API_RESPONSE}${key}`;

      let serializedData = JSON.stringify(data);

      // Compress large payloads
      if (compress && serializedData.length > this.COMPRESSION_THRESHOLD) {
        const zlib = await import('zlib');
        const compressed = zlib.gzipSync(Buffer.from(serializedData));
        serializedData = compressed.toString('base64');

        // Store metadata about compression
        await this.redis.hset(`${cacheKey}:meta`, {
          compressed: 'true',
          originalSize: serializedData.length,
          compressedSize: compressed.length,
          tags: JSON.stringify(tags),
          timestamp: Date.now(),
        });
      } else {
        await this.redis.hset(`${cacheKey}:meta`, {
          compressed: 'false',
          size: serializedData.length,
          tags: JSON.stringify(tags),
          timestamp: Date.now(),
        });
      }

      await this.redis.setex(cacheKey, ttl, serializedData);

      // Set expiration for metadata
      await this.redis.expire(`${cacheKey}:meta`, ttl);

      this.stats.sets++;

      logger.debug(`Cached API response: ${key}`, {
        size: serializedData.length,
        ttl,
        compressed: compress && serializedData.length > this.COMPRESSION_THRESHOLD,
      });

      return true;

    } catch (error) {
      logger.error('Error caching API response:', error);
      return false;
    }
  }

  /**
   * Get cached API response with automatic decompression
   */
  public async getCachedApiResponse<T = any>(key: string): Promise<T | null> {
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

      let deserializedData: string = data;

      // Decompress if needed
      if (metadata.compressed === 'true') {
        const zlib = await import('zlib');
        const compressed = Buffer.from(data, 'base64');
        deserializedData = zlib.gunzipSync(compressed).toString();
      }

      const result = JSON.parse(deserializedData);
      this.stats.hits++;

      return result;

    } catch (error) {
      logger.error('Error getting cached API response:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Cache dashboard overview data
   */
  public async cacheDashboardOverview(
    userId: string,
    workspaceId: string,
    data: any,
    ttl: number = 300
  ): Promise<boolean> {
    const key = `${this.PREFIXES.DASHBOARD}${workspaceId}:${userId}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['dashboard', 'user-specific']
    });
  }

  /**
   * Get cached dashboard overview
   */
  public async getCachedDashboardOverview(
    userId: string,
    workspaceId: string
  ): Promise<any | null> {
    const key = `${this.PREFIXES.DASHBOARD}${workspaceId}:${userId}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Cache user profile data
   */
  public async cacheUserProfile(
    userId: string,
    data: any,
    ttl: number = 600
  ): Promise<boolean> {
    const key = `${this.PREFIXES.USER_PROFILE}${userId}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['user-profile']
    });
  }

  /**
   * Get cached user profile
   */
  public async getCachedUserProfile(userId: string): Promise<any | null> {
    const key = `${this.PREFIXES.USER_PROFILE}${userId}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Cache patient list with filters
   */
  public async cachePatientList(
    workspaceId: string,
    filters: Record<string, any>,
    data: any,
    ttl: number = 180
  ): Promise<boolean> {
    const filterHash = this.hashFilters(filters);
    const key = `${this.PREFIXES.PATIENT_LIST}${workspaceId}:${filterHash}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['patients', 'list']
    });
  }

  /**
   * Get cached patient list
   */
  public async getCachedPatientList(
    workspaceId: string,
    filters: Record<string, any>
  ): Promise<any | null> {
    const filterHash = this.hashFilters(filters);
    const key = `${this.PREFIXES.PATIENT_LIST}${workspaceId}:${filterHash}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Cache clinical notes for a patient
   */
  public async cacheClinicalNotes(
    patientId: string,
    data: any,
    ttl: number = 300
  ): Promise<boolean> {
    const key = `${this.PREFIXES.CLINICAL_NOTES}${patientId}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['clinical-notes', 'patient-specific']
    });
  }

  /**
   * Get cached clinical notes
   */
  public async getCachedClinicalNotes(patientId: string): Promise<any | null> {
    const key = `${this.PREFIXES.CLINICAL_NOTES}${patientId}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Cache search results
   */
  public async cacheSearchResults(
    query: string,
    type: string,
    workspaceId: string,
    data: any,
    ttl: number = 600
  ): Promise<boolean> {
    const queryHash = this.hashQuery(query);
    const key = `${this.PREFIXES.SEARCH_RESULTS}${type}:${workspaceId}:${queryHash}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['search', type]
    });
  }

  /**
   * Get cached search results
   */
  public async getCachedSearchResults(
    query: string,
    type: string,
    workspaceId: string
  ): Promise<any | null> {
    const queryHash = this.hashQuery(query);
    const key = `${this.PREFIXES.SEARCH_RESULTS}${type}:${workspaceId}:${queryHash}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Cache aggregation results
   */
  public async cacheAggregation(
    name: string,
    params: Record<string, any>,
    data: any,
    ttl: number = 900
  ): Promise<boolean> {
    const paramsHash = this.hashFilters(params);
    const key = `${this.PREFIXES.AGGREGATIONS}${name}:${paramsHash}`;
    return this.cacheApiResponse(key, data, {
      ttl,
      tags: ['aggregation', name]
    });
  }

  /**
   * Get cached aggregation results
   */
  public async getCachedAggregation(
    name: string,
    params: Record<string, any>
  ): Promise<any | null> {
    const paramsHash = this.hashFilters(params);
    const key = `${this.PREFIXES.AGGREGATIONS}${name}:${paramsHash}`;
    return this.getCachedApiResponse(key);
  }

  /**
   * Invalidate cache by tags
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      let deletedCount = 0;

      // Find all keys with metadata
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
      logger.debug(`Invalidated ${deletedCount} cache entries by tags:`, tags);

      return deletedCount;

    } catch (error) {
      logger.error('Error invalidating cache by tags:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.stats.deletes += keys.length;

        // Also delete associated metadata
        const metaKeys = keys.map(key => `${key}:meta`);
        const existingMetaKeys = await this.redis.exists(...metaKeys);
        if (existingMetaKeys > 0) {
          await this.redis.del(...metaKeys);
        }

        logger.debug(`Invalidated ${keys.length} cache entries by pattern: ${pattern}`);
        return keys.length;
      }

      return 0;

    } catch (error) {
      logger.error('Error invalidating cache by pattern:', error);
      return 0;
    }
  }

  /**
   * Invalidate user-specific cache
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateByPattern(`${this.PREFIXES.USER_PROFILE}${userId}*`),
      this.invalidateByPattern(`${this.PREFIXES.DASHBOARD}*:${userId}`),
      this.invalidateByTags(['user-specific']),
    ]);
  }

  /**
   * Invalidate patient-specific cache
   */
  public async invalidatePatientCache(patientId: string): Promise<void> {
    await Promise.all([
      this.invalidateByPattern(`${this.PREFIXES.CLINICAL_NOTES}${patientId}*`),
      this.invalidateByPattern(`${this.PREFIXES.MEDICATIONS}${patientId}*`),
      this.invalidateByTags(['patient-specific']),
    ]);
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    if (!(await this.ensureConnection())) {
      return this.stats;
    }

    try {
      // Update memory usage and key count
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      this.stats.memoryUsage = memoryMatch?.[1] ? parseInt(memoryMatch[1]) : 0;

      this.stats.keyCount = await this.redis.dbsize();

      // Calculate hit rate
      const totalOperations = this.stats.hits + this.stats.misses;
      this.stats.hitRate = totalOperations > 0
        ? (this.stats.hits / totalOperations) * 100
        : 0;

      return { ...this.stats };

    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return this.stats;
    }
  }

  /**
   * Clear all performance cache
   */
  public async clearAll(): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return;
    }

    try {
      await this.redis.flushdb();
      this.resetStats();
      logger.info('Performance cache cleared');

    } catch (error) {
      logger.error('Error clearing performance cache:', error);
    }
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
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

  /**
   * Hash filters for consistent cache keys
   */
  private hashFilters(filters: Record<string, any>): string {
    const crypto = require('crypto');
    const normalized = JSON.stringify(filters, Object.keys(filters).sort());
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Hash query string for consistent cache keys
   */
  private hashQuery(query: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      logger.info('Performance cache service connection closed');
    }
  }

  /**
   * Generic get method for backward compatibility
   */
  public async get<T = any>(key: string): Promise<T | null> {
    return this.getCachedApiResponse(key);
  }

  /**
   * Generic set method for backward compatibility
   */
  public async set<T = any>(key: string, value: T, ttl: number): Promise<boolean> {
    return this.cacheApiResponse(key, value, { ttl });
  }

  /**
   * Generic invalidate method for backward compatibility
   */
  public async invalidate(pattern: string): Promise<number> {
    return this.invalidateByPattern(pattern);
  }
}
