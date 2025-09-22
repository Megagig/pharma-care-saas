export interface QueryPerformanceMetrics {
    query: string;
    executionTime: number;
    documentsExamined: number;
    documentsReturned: number;
    indexUsed: boolean;
    indexName?: string;
    timestamp: Date;
}
export interface IndexRecommendation {
    collection: string;
    indexSpec: Record<string, 1 | -1>;
    reason: string;
    estimatedImprovement: number;
    priority: 'high' | 'medium' | 'low';
}
export interface DatabaseOptimizationReport {
    slowQueries: QueryPerformanceMetrics[];
    indexRecommendations: IndexRecommendation[];
    connectionPoolStats: any;
    collectionStats: Record<string, any>;
    timestamp: Date;
}
declare class DatabaseOptimizationService {
    private static instance;
    private queryMetrics;
    private readonly MAX_METRICS_HISTORY;
    private readonly SLOW_QUERY_THRESHOLD;
    private constructor();
    static getInstance(): DatabaseOptimizationService;
    createOptimizedIndexes(): Promise<void>;
    private createUserIndexes;
    private createRoleIndexes;
    private createUserRoleIndexes;
    private createRolePermissionIndexes;
    private createPermissionIndexes;
    private createAuditLogIndexes;
    private setupQueryProfiling;
    analyzeQueryPerformance(): Promise<DatabaseOptimizationReport>;
    private getSlowQueries;
    private generateIndexRecommendations;
    private getRBACSpecificRecommendations;
    private getConnectionPoolStats;
    private getCollectionStats;
    optimizeConnectionPool(): Promise<void>;
    recordQueryMetrics(metrics: QueryPerformanceMetrics): void;
    getQueryStats(): {
        totalQueries: number;
        slowQueries: number;
        averageExecutionTime: number;
        indexUsageRate: number;
    };
}
export default DatabaseOptimizationService;
//# sourceMappingURL=DatabaseOptimizationService.d.ts.map