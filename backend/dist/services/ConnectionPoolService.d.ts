import mongoose from 'mongoose';
interface ConnectionConfig {
    uri: string;
    options: mongoose.ConnectOptions;
    weight: number;
    maxConnections: number;
    currentConnections: number;
    isHealthy: boolean;
    lastHealthCheck: Date;
}
interface PoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    pendingConnections: number;
    connectionErrors: number;
    avgResponseTime: number;
}
export declare class ConnectionPoolService {
    private static instance;
    private connections;
    private connectionConfigs;
    private healthCheckInterval;
    private stats;
    private responseTimes;
    static getInstance(): ConnectionPoolService;
    initializePool(): Promise<void>;
    private addConnection;
    getConnection(preferredType?: 'read' | 'write' | 'analytics'): mongoose.Connection;
    releaseConnection(connection: mongoose.Connection): void;
    executeWithConnection<T>(operation: (connection: mongoose.Connection) => Promise<T>, preferredType?: 'read' | 'write' | 'analytics'): Promise<T>;
    private setupConnectionEventHandlers;
    private startHealthChecking;
    private performHealthChecks;
    private updateStats;
    private trackResponseTime;
    getStats(): PoolStats & {
        connections: Array<{
            name: string;
            config: ConnectionConfig;
        }>;
    };
    getHealthStatus(): Record<string, {
        healthy: boolean;
        lastCheck: Date;
        load: number;
    }>;
    closeAll(): Promise<void>;
    reconnectFailedConnections(): Promise<void>;
}
export default ConnectionPoolService;
//# sourceMappingURL=ConnectionPoolService.d.ts.map