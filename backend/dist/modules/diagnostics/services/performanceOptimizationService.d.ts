export interface QueryOptimizationResult {
    originalQuery: any;
    optimizedQuery: any;
    estimatedImprovement: number;
    recommendations: string[];
}
export interface ConnectionPoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    averageWaitTime: number;
    connectionErrors: number;
}
export interface BackgroundJob {
    id: string;
    type: 'ai_processing' | 'data_aggregation' | 'cache_warmup' | 'cleanup' | 'analytics';
    priority: 'low' | 'medium' | 'high' | 'critical';
    payload: any;
    createdAt: Date;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    retryCount: number;
    maxRetries: number;
    error?: string;
    progress?: number;
}
export interface PerformanceMetrics {
    queryPerformance: {
        averageQueryTime: number;
        slowQueries: number;
        optimizedQueries: number;
        cacheHitRate: number;
    };
    connectionPool: ConnectionPoolStats;
    backgroundJobs: {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        averageProcessingTime: number;
    };
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
}
declare class PerformanceOptimizationService {
    private backgroundJobs;
    private jobQueue;
    private isProcessingJobs;
    private connectionPoolStats;
    private queryMetrics;
    constructor();
    optimizeAggregationPipeline(pipeline: any[]): QueryOptimizationResult;
    optimizeFindQuery(query: any, options?: any): QueryOptimizationResult;
    getRecommendedIndexes(): Array<{
        collection: string;
        index: any;
        options?: any;
        rationale: string;
    }>;
    updateConnectionPoolStats(stats: Partial<ConnectionPoolStats>): void;
    getConnectionPoolRecommendations(): string[];
    scheduleJob(type: BackgroundJob['type'], payload: any, options?: {
        priority?: BackgroundJob['priority'];
        delay?: number;
        maxRetries?: number;
    }): string;
    scheduleAIProcessing(requestId: string, inputData: any, priority?: BackgroundJob['priority']): string;
    scheduleDataAggregation(aggregationType: string, parameters: any, priority?: BackgroundJob['priority']): string;
    scheduleCacheWarmup(cacheKeys: string[], priority?: BackgroundJob['priority']): string;
    getJobStatus(jobId: string): BackgroundJob | null;
    cancelJob(jobId: string): boolean;
    private addToQueue;
    private startBackgroundJobProcessor;
    private processNextJob;
    private executeJob;
    private executeAIProcessingJob;
    private executeDataAggregationJob;
    private executeCacheWarmupJob;
    private executeCleanupJob;
    private executeAnalyticsJob;
    private generateJobId;
    private sleep;
    private startPerformanceMonitoring;
    private collectPerformanceMetrics;
    getPerformanceMetrics(): PerformanceMetrics;
    getPerformanceRecommendations(): string[];
}
declare const _default: PerformanceOptimizationService;
export default _default;
//# sourceMappingURL=performanceOptimizationService.d.ts.map