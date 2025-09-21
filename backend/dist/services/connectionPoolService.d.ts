import mongoose from "mongoose";
import Redis from "ioredis";
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
export declare class DatabaseConnectionPool {
    private config;
    private connections;
    private activeConnections;
    private pendingRequests;
    private cleanupInterval?;
    constructor(config?: Partial<PoolConfig>);
    initialize(): Promise<void>;
    acquire(): Promise<mongoose.Connection>;
    release(connection: mongoose.Connection): void;
    withConnection<T>(fn: (connection: mongoose.Connection) => Promise<T>): Promise<T>;
    getStats(): ConnectionStats;
    close(): Promise<void>;
    private createConnection;
    private getIdleConnection;
    private removeConnection;
    private startCleanupInterval;
    private cleanup;
}
export declare class RedisConnectionPool {
    private config;
    private connections;
    private activeConnections;
    private pendingRequests;
    private cleanupInterval?;
    constructor(config?: Partial<PoolConfig>);
    initialize(): Promise<void>;
    acquire(): Promise<Redis>;
    release(connection: Redis): void;
    withConnection<T>(fn: (redis: Redis) => Promise<T>): Promise<T>;
    getStats(): ConnectionStats;
    close(): Promise<void>;
    private createConnection;
    private getIdleConnection;
    private removeConnection;
    private startCleanupInterval;
    private cleanup;
}
export declare const dbConnectionPool: DatabaseConnectionPool;
export declare const redisConnectionPool: RedisConnectionPool;
export {};
//# sourceMappingURL=connectionPoolService.d.ts.map