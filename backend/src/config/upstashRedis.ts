/**
 * Upstash Redis Configuration using REST API
 * This bypasses DNS issues by using HTTP/HTTPS instead of direct Redis protocol
 */

import { Redis } from '@upstash/redis';
import logger from '../utils/logger';

let upstashRedis: Redis | null = null;
let isConnected = false;

/**
 * Initialize Upstash Redis using REST API
 */
export const initializeUpstashRedis = (): Redis | null => {
  try {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!restUrl || !restToken) {
      logger.warn('Upstash Redis REST credentials not found. Redis features will be disabled.');
      return null;
    }

    upstashRedis = new Redis({
      url: restUrl,
      token: restToken,
    });

    isConnected = true;
    logger.info('✅ Upstash Redis (REST API) initialized successfully');

    return upstashRedis;
  } catch (error) {
    logger.error('Failed to initialize Upstash Redis:', error);
    return null;
  }
};

/**
 * Get Upstash Redis instance
 */
export const getUpstashRedis = (): Redis | null => {
  if (!upstashRedis) {
    return initializeUpstashRedis();
  }
  return upstashRedis;
};

/**
 * Check if Upstash Redis is connected
 */
export const isUpstashRedisConnected = (): boolean => {
  return isConnected && upstashRedis !== null;
};

/**
 * Test Upstash Redis connection
 */
export const testUpstashRedisConnection = async (): Promise<boolean> => {
  try {
    const redis = getUpstashRedis();
    if (!redis) {
      return false;
    }

    // Test with a simple ping
    await redis.set('upstash:test', 'ok', { ex: 10 });
    const result = await redis.get('upstash:test');
    
    if (result === 'ok') {
      logger.info('✅ Upstash Redis connection test successful');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Upstash Redis connection test failed:', error);
    return false;
  }
};

export default {
  initializeUpstashRedis,
  getUpstashRedis,
  isUpstashRedisConnected,
  testUpstashRedisConnection,
};
