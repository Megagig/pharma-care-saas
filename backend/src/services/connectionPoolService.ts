import mongoose from "mongoose";
import Redis from "ioredis";
import logger from "../utils/logger";

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
}

interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
}

/**
 * Database connection pool service
 */
export class DatabaseConnectionPool {
  private config: PoolConfig;
  private connections: Map<string, mongoose.Connection> = new Map();
  private activeConnections: Set<string> = new Set();
  private pendingRequests: Array<{
    resolve: (connection: mongoose.Connection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      minConnections: config.minConnections || 2,
      acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000, // 5 minutes
      reapIntervalMillis: config.reapIntervalMillis || 60000, // 1 minute
    };

    this.startCleanupInterval();
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    try {
      // Create minimum number of connections
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      logger.info(
        `Database connection pool initialized with ${this.config.minConnections} connections`,
      );
    } catch (error) {
      logger.error("Failed to initialize database connection pool:", error);
      throw error;
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<mongoose.Connection> {
    return new Promise((resolve, reject) => {
      // Check for available idle connection
      const availableConnection = this.getIdleConnection();
      if (availableConnection) {
        this.activeConnections.add(availableConnection.id.toString());
        resolve(availableConnection);
        return;
      }

      // If we can create more connections, do so
      if (this.connections.size < this.config.maxConnections) {
        this.createConnection()
          .then((connection) => {
            this.activeConnections.add(connection.id.toString());
            resolve(connection);
          })
          .catch(reject);
        return;
      }

      // Add to pending queue
      const timeout = setTimeout(() => {
        const index = this.pendingRequests.findIndex(
          (req) => req.resolve === resolve,
        );
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
          reject(new Error("Connection acquire timeout"));
        }
      }, this.config.acquireTimeoutMillis);

      this.pendingRequests.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: mongoose.Connection): void {
    this.activeConnections.delete(connection.id.toString());

    // Check if there are pending requests
    const pendingRequest = this.pendingRequests.shift();
    if (pendingRequest) {
      this.activeConnections.add(connection.id.toString());
      pendingRequest.resolve(connection);
      return;
    }

    // Connection is now idle
    logger.debug(`Connection ${connection.id} released to pool`);
  }

  /**
   * Execute a function with a pooled connection
   */
  async withConnection<T>(
    fn: (connection: mongoose.Connection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.acquire();
    try {
      return await fn(connection);
    } finally {
      this.release(connection);
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return {
      total: this.connections.size,
      active: this.activeConnections.size,
      idle: this.connections.size - this.activeConnections.size,
      pending: this.pendingRequests.length,
    };
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error("Connection pool is closing"));
    });
    this.pendingRequests = [];

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(
      (connection) => connection.close(),
    );

    await Promise.all(closePromises);
    this.connections.clear();
    this.activeConnections.clear();

    logger.info("Database connection pool closed");
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<mongoose.Connection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const connection = mongoose.createConnection(process.env.MONGODB_URI!, {
      maxPoolSize: 1, // Each connection handles one pool slot
      minPoolSize: 1,
      maxIdleTimeMS: this.config.idleTimeoutMillis,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Set connection ID for tracking
    (connection as any).id = connectionId;

    // Handle connection events
    connection.on("error", (error) => {
      logger.error(`Database connection ${connectionId} error:`, error);
      this.removeConnection(connectionId);
    });

    connection.on("disconnected", () => {
      logger.warn(`Database connection ${connectionId} disconnected`);
      this.removeConnection(connectionId);
    });

    await new Promise<void>((resolve, reject) => {
      connection.once("open", () => {
        logger.debug(`Database connection ${connectionId} established`);
        resolve();
      });

      connection.once("error", reject);
    });

    this.connections.set(connectionId, connection);
    return connection;
  }

  /**
   * Get an idle connection
   */
  private getIdleConnection(): mongoose.Connection | null {
    for (const [id, connection] of this.connections.entries()) {
      if (!this.activeConnections.has(id) && connection.readyState === 1) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Remove a connection from the pool
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.activeConnections.delete(connectionId);

      // Try to close the connection gracefully
      connection.close().catch((error) => {
        logger.error(`Error closing connection ${connectionId}:`, error);
      });
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.reapIntervalMillis);
  }

  /**
   * Cleanup idle connections and expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();

    // Remove expired pending requests
    this.pendingRequests = this.pendingRequests.filter((request) => {
      if (now - request.timestamp > this.config.acquireTimeoutMillis) {
        request.reject(new Error("Connection acquire timeout"));
        return false;
      }
      return true;
    });

    // Close excess idle connections
    const idleConnections = Array.from(this.connections.entries())
      .filter(([id]) => !this.activeConnections.has(id))
      .map(([id, connection]) => ({ id, connection }));

    const excessConnections = Math.max(
      0,
      idleConnections.length - this.config.minConnections,
    );

    if (excessConnections > 0) {
      const connectionsToClose = idleConnections.slice(0, excessConnections);
      connectionsToClose.forEach(({ id }) => {
        this.removeConnection(id);
      });

      logger.debug(`Cleaned up ${excessConnections} excess idle connections`);
    }
  }
}

/**
 * Redis connection pool service
 */
export class RedisConnectionPool {
  private config: PoolConfig;
  private connections: Map<string, Redis> = new Map();
  private activeConnections: Set<string> = new Set();
  private pendingRequests: Array<{
    resolve: (connection: Redis) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 5,
      minConnections: config.minConnections || 1,
      acquireTimeoutMillis: config.acquireTimeoutMillis || 10000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000,
      reapIntervalMillis: config.reapIntervalMillis || 60000,
    };

    this.startCleanupInterval();
  }

  /**
   * Initialize the Redis connection pool
   */
  async initialize(): Promise<void> {
    try {
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      logger.info(
        `Redis connection pool initialized with ${this.config.minConnections} connections`,
      );
    } catch (error) {
      logger.error("Failed to initialize Redis connection pool:", error);
      throw error;
    }
  }

  /**
   * Acquire a Redis connection
   */
  async acquire(): Promise<Redis> {
    return new Promise((resolve, reject) => {
      const availableConnection = this.getIdleConnection();
      if (availableConnection) {
        this.activeConnections.add((availableConnection as any).id);
        resolve(availableConnection);
        return;
      }

      if (this.connections.size < this.config.maxConnections) {
        this.createConnection()
          .then((connection) => {
            this.activeConnections.add((connection as any).id);
            resolve(connection);
          })
          .catch(reject);
        return;
      }

      const timeout = setTimeout(() => {
        const index = this.pendingRequests.findIndex(
          (req) => req.resolve === resolve,
        );
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
          reject(new Error("Redis connection acquire timeout"));
        }
      }, this.config.acquireTimeoutMillis);

      this.pendingRequests.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Release a Redis connection
   */
  release(connection: Redis): void {
    this.activeConnections.delete((connection as any).id);

    const pendingRequest = this.pendingRequests.shift();
    if (pendingRequest) {
      this.activeConnections.add((connection as any).id);
      pendingRequest.resolve(connection);
      return;
    }
  }

  /**
   * Execute a function with a Redis connection
   */
  async withConnection<T>(fn: (redis: Redis) => Promise<T>): Promise<T> {
    const connection = await this.acquire();
    try {
      return await fn(connection);
    } finally {
      this.release(connection);
    }
  }

  /**
   * Get Redis connection statistics
   */
  getStats(): ConnectionStats {
    return {
      total: this.connections.size,
      active: this.activeConnections.size,
      idle: this.connections.size - this.activeConnections.size,
      pending: this.pendingRequests.length,
    };
  }

  /**
   * Close all Redis connections
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.pendingRequests.forEach((request) => {
      request.reject(new Error("Redis connection pool is closing"));
    });
    this.pendingRequests = [];

    const closePromises = Array.from(this.connections.values()).map(
      (connection) => connection.quit(),
    );

    await Promise.all(closePromises);
    this.connections.clear();
    this.activeConnections.clear();

    logger.info("Redis connection pool closed");
  }

  /**
   * Create a new Redis connection
   */
  private async createConnection(): Promise<Redis> {
    const connectionId = `redis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    (redis as any).id = connectionId;

    redis.on("error", (error) => {
      logger.error(`Redis connection ${connectionId} error:`, error);
      this.removeConnection(connectionId);
    });

    redis.on("close", () => {
      logger.warn(`Redis connection ${connectionId} closed`);
      this.removeConnection(connectionId);
    });

    await redis.connect();
    this.connections.set(connectionId, redis);

    logger.debug(`Redis connection ${connectionId} established`);
    return redis;
  }

  /**
   * Get an idle Redis connection
   */
  private getIdleConnection(): Redis | null {
    for (const [id, connection] of this.connections.entries()) {
      if (!this.activeConnections.has(id) && connection.status === "ready") {
        return connection;
      }
    }
    return null;
  }

  /**
   * Remove a Redis connection
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.activeConnections.delete(connectionId);

      connection.quit().catch((error) => {
        logger.error(`Error closing Redis connection ${connectionId}:`, error);
      });
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.reapIntervalMillis);
  }

  /**
   * Cleanup connections
   */
  private cleanup(): void {
    const now = Date.now();

    this.pendingRequests = this.pendingRequests.filter((request) => {
      if (now - request.timestamp > this.config.acquireTimeoutMillis) {
        request.reject(new Error("Redis connection acquire timeout"));
        return false;
      }
      return true;
    });

    const idleConnections = Array.from(this.connections.entries())
      .filter(([id]) => !this.activeConnections.has(id))
      .map(([id, connection]) => ({ id, connection }));

    const excessConnections = Math.max(
      0,
      idleConnections.length - this.config.minConnections,
    );

    if (excessConnections > 0) {
      const connectionsToClose = idleConnections.slice(0, excessConnections);
      connectionsToClose.forEach(({ id }) => {
        this.removeConnection(id);
      });
    }
  }
}

// Create singleton instances
export const dbConnectionPool = new DatabaseConnectionPool({
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || "2"),
});

export const redisConnectionPool = new RedisConnectionPool({
  maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || "5"),
  minConnections: parseInt(process.env.REDIS_MIN_CONNECTIONS || "1"),
});
