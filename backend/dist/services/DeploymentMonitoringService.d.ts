import { EventEmitter } from 'events';
export interface DeploymentMetrics {
    timestamp: Date;
    lighthouse: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    webVitals: {
        FCP: number;
        LCP: number;
        CLS: number;
        TTFB: number;
        FID: number;
    };
    apiLatency: {
        p50: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    throughput: number;
    activeUsers: number;
    featureFlagMetrics: any[];
}
export interface DeploymentThresholds {
    lighthouse: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    webVitals: {
        FCP: number;
        LCP: number;
        CLS: number;
        TTFB: number;
        FID: number;
    };
    apiLatency: {
        p95: number;
        maxIncrease: number;
    };
    errorRate: number;
    throughputDecrease: number;
}
export interface RollbackTrigger {
    type: 'performance' | 'error_rate' | 'api_latency' | 'user_complaints';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface DeploymentStatus {
    id: string;
    startTime: Date;
    endTime?: Date;
    status: 'starting' | 'monitoring' | 'validating' | 'success' | 'failed' | 'rolled_back';
    rolloutPercentage: number;
    metrics: DeploymentMetrics[];
    alerts: any[];
    rollbackTriggers: RollbackTrigger[];
    rollbackExecuted: boolean;
}
declare class DeploymentMonitoringService extends EventEmitter {
    private activeDeployments;
    private monitoringIntervals;
    private rollbackTimeouts;
    private defaultThresholds;
    startDeploymentMonitoring(deploymentId: string, rolloutPercentage: number, thresholds?: Partial<DeploymentThresholds>): Promise<void>;
    private collectMetrics;
    private getCurrentMetrics;
    private getLighthouseScore;
    private getWebVitalsMetrics;
    private getAPILatencyMetrics;
    private getErrorRate;
    private getThroughput;
    private getActiveUsers;
    private checkThresholds;
    private executeRollback;
    completeDeployment(deploymentId: string): Promise<void>;
    private stopMonitoring;
    getDeploymentStatus(deploymentId: string): DeploymentStatus | null;
    getActiveDeployments(): DeploymentStatus[];
    forceRollback(deploymentId: string, reason: string): Promise<void>;
    updateRolloutPercentage(deploymentId: string, newPercentage: number): Promise<void>;
    cleanup(): void;
}
declare const _default: DeploymentMonitoringService;
export default _default;
//# sourceMappingURL=DeploymentMonitoringService.d.ts.map