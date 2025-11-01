/**
 * Centralized Redis Connection Manager
 * Provides a SINGLE shared Redis connection to prevent "max clients reached" error
 */

import Redis from 'ioredis';
import logger from '../utils/logger';

class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private client: Redis | null = null;
  private isConnected = false;
  private isConnecting = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  /**
   * Get the shared Redis client (creates it if needed)
   */
  public async getClient(): Promise<Redis | null> {
    // Return existing client if available
    if (this.client && this.isConnected) {
      return this.client;
    }

    // If already connecting, wait
    if (this.isConnecting) {
      // Wait for connection to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getClient();
    }

    // Initialize connection
    return this.connect();
  }

  /**
   * Connect to Redis (called only once)
   */
  private async connect(): Promise<Redis | null> {
    if (this.client) {
      return this.client;
    }

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.info('📭 Redis: REDIS_URL not configured - caching disabled');
      return null;
    }

    this.isConnecting = true;

    try {
      logger.info('🔌 Redis: Connecting to Redis...');

      this.client = new Redis(redisUrl, {
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
            logger.error('❌ Redis: Max retry attempts reached');
            this.isConnected = false;
            return null;
          }
          return delay;
        },
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          if (targetErrors.some(e => err.message.includes(e))) {
            return true;
          }
          return false;
        },
      });

      // Set up event handlers
      this.client.on('connect', () => {
        logger.info('✅ Redis: Connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis: Ready to accept commands');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('❌ Redis: Connection error:', err.message);
        this.isConnected = false;

        // If max clients error, prevent further attempts
        if (err.message.includes('max number of clients reached')) {
          logger.error('🚫 Redis: Max clients reached - closing connection');
          this.closeConnection();
        }
      });

      this.client.on('close', () => {
        logger.warn('⚠️ Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('⚠️ Redis: Connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('🔄 Redis: Reconnecting...');
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      this.isConnecting = false;

      logger.info('✅ Redis: Connection verified and ready');
      return this.client;

    } catch (error) {
      logger.error('❌ Redis: Failed to connect:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.client = null;
      return null;
    }
  }

  /**
   * Check if Redis is connected
   */
  public isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Close the Redis connection
   */
  public async closeConnection(): Promise<void> {
    if (this.client) {
      try {
        logger.info('🔌 Redis: Closing connection...');
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        logger.info('✅ Redis: Connection closed gracefully');
      } catch (error) {
        logger.error('❌ Redis: Error closing connection:', error);
        // Force disconnect
        if (this.client) {
          this.client.disconnect();
          this.client = null;
          this.isConnected = false;
        }
      }
    }
  }

  /**
   * Get connection status for monitoring
   */
  public getStatus(): {
    connected: boolean;
    client: boolean;
  } {
    return {
      connected: this.isConnected,
      client: this.client !== null,
    };
  }
}

// Export singleton instance
export const redisManager = RedisConnectionManager.getInstance();

// Export convenience functions
export async function getRedisClient(): Promise<Redis | null> {
  return redisManager.getClient();
}

export function isRedisAvailable(): boolean {
  return redisManager.isRedisConnected();
}

export async function closeRedis(): Promise<void> {
  return redisManager.closeConnection();
}
