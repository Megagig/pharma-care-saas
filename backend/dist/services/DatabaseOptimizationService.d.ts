import mongoose from 'mongoose';
interface PerformanceMetrics {
    collection: string;
    operation: string;
    executionTime: number;
    documentsExamined: number;
    documentsReturned: number;
    indexUsed: boolean;
    timestamp: Date;
}
export declare class DatabaseOptimizationService {
    private static instance;
    private performanceMetrics;
    private readonly MAX_METRICS_HISTORY;
    constructor();
    static getInstance(): DatabaseOptimizationService;
    private setupIndexes;
    private createIndexes;
    analyzeQueryPerformance(collection: string, operation: string, query: any): Promise<PerformanceMetrics>;
    getOptimizedUserAnalyticsPipeline(timeRange: {
        start: Date;
        end: Date;
    }): any[];
    getOptimizedSubscriptionAnalyticsPipeline(timeRange: {
        start: Date;
        end: Date;
    }): any[];
    getOptimizedActiveSessionsQuery(): any;
    getOptimizedSecurityAuditQuery(filters: {
        userId?: string;
        action?: string;
        ipAddress?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
    }): any;
    getCursorPaginatedResults<T>(model: mongoose.Model<T>, query?: any, options?: {
        limit?: number;
        cursor?: string;
        sortField?: string;
        sortOrder?: 1 | -1;
    }): Promise<{
        data: T[];
        nextCursor?: string;
        hasMore: boolean;
        totalCount?: number;
    }>;
    executeOptimizedAggregation<T>(model: mongoose.Model<T>, pipeline: any[], options?: {
        allowDiskUse?: boolean;
        maxTimeMS?: number;
    }): Promise<any[]>;
    private recordPerformanceMetrics;
    getPerformanceStats(): {
        totalQueries: number;
        averageExecutionTime: number;
        slowQueries: number;
        indexUsageRate: number;
        recentMetrics: PerformanceMetrics[];
    };
    analyzeIndexUsage(): Promise<{
        collections: string[];
        suggestions: string[];
        unusedIndexes: string[];
    }>;
    clearPerformanceMetrics(): void;
}
declare const _default: DatabaseOptimizationService;
export default _default;
//# sourceMappingURL=DatabaseOptimizationService.d.ts.map