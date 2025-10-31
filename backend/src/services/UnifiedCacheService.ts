/**
 * Unified Cache Service
 * Tries Upstash REST API first, falls back to in-memory cache
 */

import { getUpstashRedis, testUpstashRedisConnection } from '../config/upstashRedis';
import logger from '../utils/logger';

class UnifiedCacheService {
  private memoryCache: Map<string, { value: any; expiry: number }>;
  private useUpstash: boolean = false;

  constructor() {
    this.memoryCache = new Map();
    this.initialize();
  }

  private async initialize() {
    try {
      const isConnected = await testUpstashRedisConnection();
      this.useUpstash = isConnected;
      
      if (this.useUpstash) {
        logger.info('✅ Using Upstash Redis (REST API) for caching');
      } else {
        logger.info('ℹ️ Using in-memory cache (Upstash not available)');
      }
    } catch (error) {
      logger.warn('Failed to test Upstash connection, using memory cache:', error);
      this.useUpstash = false;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (this.useUpstash) {
        const redis = getUpstashRedis();
        if (redis) {
          if (ttlSeconds) {
            await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
          } else {
            await redis.set(key, JSON.stringify(value));
          }
          return;
        }
      }

      // Fallback to memory cache
      const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
      this.memoryCache.set(key, { value, expiry });
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      // Fallback to memory
      const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
      this.memoryCache.set(key, { value, expiry });
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useUpstash) {
        const redis = getUpstashRedis();
        if (redis) {
          const result = await redis.get(key);
          if (result) {
            return JSON.parse(result as string) as T;
          }
          return null;
        }
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached) {
        if (cached.expiry > Date.now()) {
          return cached.value as T;
        } else {
          this.memoryCache.delete(key);
        }
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.useUpstash) {
        const redis = getUpstashRedis();
        if (redis) {
          await redis.del(key);
          return;
        }
      }

      // Fallback to memory cache
      this.memoryCache.delete(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      this.memoryCache.delete(key);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useUpstash) {
        const redis = getUpstashRedis();
        if (redis) {
          const result = await redis.exists(key);
          return result === 1;
        }
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.useUpstash) {
        const redis = getUpstashRedis();
        if (redis) {
          await redis.flushdb();
        }
      }

      // Always clear memory cache
      this.memoryCache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      type: this.useUpstash ? 'upstash-rest' : 'memory',
      memoryKeys: this.memoryCache.size,
      isUpstashConnected: this.useUpstash,
    };
  }
}

// Export singleton instance
export const unifiedCache = new UnifiedCacheService();
export default unifiedCache;
