export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details: any;
    timestamp: Date;
    error?: string;
}
export interface SystemHealthStatus {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
    summary: {
        healthy: number;
        degraded: number;
        unhealthy: number;
        totalServices: number;
    };
    uptime: number;
    version: string;
    environment: string;
    timestamp: Date;
}
export interface HealthCheckConfig {
    timeout: number;
    retryAttempts: number;
    checkInterval: number;
    alertThresholds: {
        responseTime: number;
        errorRate: number;
        consecutiveFailures: number;
    };
}
declare class HealthCheckService {
    private healthHistory;
    private alertCounts;
    private lastHealthCheck;
    private healthCheckTimer?;
    private readonly config;
    constructor();
    performHealthCheck(): Promise<SystemHealthStatus>;
    private checkDatabaseHealth;
    private checkCacheHealth;
    private checkAIServiceHealth;
    private checkExternalAPIHealth;
    private checkBackgroundJobHealth;
    private checkMemoryHealth;
    private checkDiskHealth;
    private checkNetworkHealth;
    private testAIServiceConnectivity;
    private testNetworkConnectivity;
    private storeHealthHistory;
    private calculateHealthSummary;
    private determineOverallHealth;
    private checkHealthAlerts;
    private triggerAlert;
    private startPeriodicHealthChecks;
    stopPeriodicHealthChecks(): void;
    getHealthHistory(service: string): HealthCheckResult[];
    getHealthTrends(): {
        service: string;
        trend: 'improving' | 'stable' | 'degrading';
        recentAvailability: number;
        averageResponseTime: number;
    }[];
    getLastHealthCheckTime(): Date | null;
    forceHealthCheck(): Promise<SystemHealthStatus>;
}
declare const _default: HealthCheckService;
export default _default;
//# sourceMappingURL=healthCheckService.d.ts.map