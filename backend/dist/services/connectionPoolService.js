"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionPool = exports.dbConnectionPool = exports.RedisConnectionPool = exports.DatabaseConnectionPool = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
class DatabaseConnectionPool {
    constructor(config = {}) {
        this.connections = new Map();
        this.activeConnections = new Set();
        this.pendingRequests = [];
        this.config = {
            maxConnections: config.maxConnections || 10,
            minConnections: config.minConnections || 2,
            acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
            idleTimeoutMillis: config.idleTimeoutMillis || 300000,
            reapIntervalMillis: config.reapIntervalMillis || 60000,
        };
        this.startCleanupInterval();
    }
    async initialize() {
        try {
            for (let i = 0; i < this.config.minConnections; i++) {
                await this.createConnection();
            }
            logger_1.default.info(`Database connection pool initialized with ${this.config.minConnections} connections`);
        }
        catch (error) {
            logger_1.default.error("Failed to initialize database connection pool:", error);
            throw error;
        }
    }
    async acquire() {
        return new Promise((resolve, reject) => {
            const availableConnection = this.getIdleConnection();
            if (availableConnection) {
                this.activeConnections.add(availableConnection.id.toString());
                resolve(availableConnection);
                return;
            }
            if (this.connections.size < this.config.maxConnections) {
                this.createConnection()
                    .then((connection) => {
                    this.activeConnections.add(connection.id.toString());
                    resolve(connection);
                })
                    .catch(reject);
                return;
            }
            const timeout = setTimeout(() => {
                const index = this.pendingRequests.findIndex((req) => req.resolve === resolve);
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
    release(connection) {
        this.activeConnections.delete(connection.id.toString());
        const pendingRequest = this.pendingRequests.shift();
        if (pendingRequest) {
            this.activeConnections.add(connection.id.toString());
            pendingRequest.resolve(connection);
            return;
        }
        logger_1.default.debug(`Connection ${connection.id} released to pool`);
    }
    async withConnection(fn) {
        const connection = await this.acquire();
        try {
            return await fn(connection);
        }
        finally {
            this.release(connection);
        }
    }
    getStats() {
        return {
            total: this.connections.size,
            active: this.activeConnections.size,
            idle: this.connections.size - this.activeConnections.size,
            pending: this.pendingRequests.length,
        };
    }
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.pendingRequests.forEach((request) => {
            request.reject(new Error("Connection pool is closing"));
        });
        this.pendingRequests = [];
        const closePromises = Array.from(this.connections.values()).map((connection) => connection.close());
        await Promise.all(closePromises);
        this.connections.clear();
        this.activeConnections.clear();
        logger_1.default.info("Database connection pool closed");
    }
    async createConnection() {
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connection = mongoose_1.default.createConnection(process.env.MONGODB_URI, {
            maxPoolSize: 1,
            minPoolSize: 1,
            maxIdleTimeMS: this.config.idleTimeoutMillis,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        connection.id = connectionId;
        connection.on("error", (error) => {
            logger_1.default.error(`Database connection ${connectionId} error:`, error);
            this.removeConnection(connectionId);
        });
        connection.on("disconnected", () => {
            logger_1.default.warn(`Database connection ${connectionId} disconnected`);
            this.removeConnection(connectionId);
        });
        await new Promise((resolve, reject) => {
            connection.once("open", () => {
                logger_1.default.debug(`Database connection ${connectionId} established`);
                resolve();
            });
            connection.once("error", reject);
        });
        this.connections.set(connectionId, connection);
        return connection;
    }
    getIdleConnection() {
        for (const [id, connection] of this.connections.entries()) {
            if (!this.activeConnections.has(id) && connection.readyState === 1) {
                return connection;
            }
        }
        return null;
    }
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.delete(connectionId);
            this.activeConnections.delete(connectionId);
            connection.close().catch((error) => {
                logger_1.default.error(`Error closing connection ${connectionId}:`, error);
            });
        }
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.config.reapIntervalMillis);
    }
    cleanup() {
        const now = Date.now();
        this.pendingRequests = this.pendingRequests.filter((request) => {
            if (now - request.timestamp > this.config.acquireTimeoutMillis) {
                request.reject(new Error("Connection acquire timeout"));
                return false;
            }
            return true;
        });
        const idleConnections = Array.from(this.connections.entries())
            .filter(([id]) => !this.activeConnections.has(id))
            .map(([id, connection]) => ({ id, connection }));
        const excessConnections = Math.max(0, idleConnections.length - this.config.minConnections);
        if (excessConnections > 0) {
            const connectionsToClose = idleConnections.slice(0, excessConnections);
            connectionsToClose.forEach(({ id }) => {
                this.removeConnection(id);
            });
            logger_1.default.debug(`Cleaned up ${excessConnections} excess idle connections`);
        }
    }
}
exports.DatabaseConnectionPool = DatabaseConnectionPool;
class RedisConnectionPool {
    constructor(config = {}) {
        this.connections = new Map();
        this.activeConnections = new Set();
        this.pendingRequests = [];
        this.config = {
            maxConnections: config.maxConnections || 5,
            minConnections: config.minConnections || 1,
            acquireTimeoutMillis: config.acquireTimeoutMillis || 10000,
            idleTimeoutMillis: config.idleTimeoutMillis || 300000,
            reapIntervalMillis: config.reapIntervalMillis || 60000,
        };
        this.startCleanupInterval();
    }
    async initialize() {
        try {
            for (let i = 0; i < this.config.minConnections; i++) {
                await this.createConnection();
            }
            logger_1.default.info(`Redis connection pool initialized with ${this.config.minConnections} connections`);
        }
        catch (error) {
            logger_1.default.error("Failed to initialize Redis connection pool:", error);
            throw error;
        }
    }
    async acquire() {
        return new Promise((resolve, reject) => {
            const availableConnection = this.getIdleConnection();
            if (availableConnection) {
                this.activeConnections.add(availableConnection.id);
                resolve(availableConnection);
                return;
            }
            if (this.connections.size < this.config.maxConnections) {
                this.createConnection()
                    .then((connection) => {
                    this.activeConnections.add(connection.id);
                    resolve(connection);
                })
                    .catch(reject);
                return;
            }
            const timeout = setTimeout(() => {
                const index = this.pendingRequests.findIndex((req) => req.resolve === resolve);
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
    release(connection) {
        this.activeConnections.delete(connection.id);
        const pendingRequest = this.pendingRequests.shift();
        if (pendingRequest) {
            this.activeConnections.add(connection.id);
            pendingRequest.resolve(connection);
            return;
        }
    }
    async withConnection(fn) {
        const connection = await this.acquire();
        try {
            return await fn(connection);
        }
        finally {
            this.release(connection);
        }
    }
    getStats() {
        return {
            total: this.connections.size,
            active: this.activeConnections.size,
            idle: this.connections.size - this.activeConnections.size,
            pending: this.pendingRequests.length,
        };
    }
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.pendingRequests.forEach((request) => {
            request.reject(new Error("Redis connection pool is closing"));
        });
        this.pendingRequests = [];
        const closePromises = Array.from(this.connections.values()).map((connection) => connection.quit());
        await Promise.all(closePromises);
        this.connections.clear();
        this.activeConnections.clear();
        logger_1.default.info("Redis connection pool closed");
    }
    async createConnection() {
        const connectionId = `redis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0"),
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        redis.id = connectionId;
        redis.on("error", (error) => {
            logger_1.default.error(`Redis connection ${connectionId} error:`, error);
            this.removeConnection(connectionId);
        });
        redis.on("close", () => {
            logger_1.default.warn(`Redis connection ${connectionId} closed`);
            this.removeConnection(connectionId);
        });
        await redis.connect();
        this.connections.set(connectionId, redis);
        logger_1.default.debug(`Redis connection ${connectionId} established`);
        return redis;
    }
    getIdleConnection() {
        for (const [id, connection] of this.connections.entries()) {
            if (!this.activeConnections.has(id) && connection.status === "ready") {
                return connection;
            }
        }
        return null;
    }
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.delete(connectionId);
            this.activeConnections.delete(connectionId);
            connection.quit().catch((error) => {
                logger_1.default.error(`Error closing Redis connection ${connectionId}:`, error);
            });
        }
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.config.reapIntervalMillis);
    }
    cleanup() {
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
        const excessConnections = Math.max(0, idleConnections.length - this.config.minConnections);
        if (excessConnections > 0) {
            const connectionsToClose = idleConnections.slice(0, excessConnections);
            connectionsToClose.forEach(({ id }) => {
                this.removeConnection(id);
            });
        }
    }
}
exports.RedisConnectionPool = RedisConnectionPool;
exports.dbConnectionPool = new DatabaseConnectionPool({
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
    minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || "2"),
});
exports.redisConnectionPool = new RedisConnectionPool({
    maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || "5"),
    minConnections: parseInt(process.env.REDIS_MIN_CONNECTIONS || "1"),
});
//# sourceMappingURL=connectionPoolService.js.map