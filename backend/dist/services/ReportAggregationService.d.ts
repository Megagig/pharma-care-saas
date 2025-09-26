import mongoose from 'mongoose';
interface AggregationOptions {
    allowDiskUse?: boolean;
    maxTimeMS?: number;
    hint?: string | object;
    collation?: object;
    batchSize?: number;
}
interface PipelineStage {
    [key: string]: any;
}
interface AggregationResult<T = any> {
    data: T[];
    executionTime: number;
    totalDocuments?: number;
    indexesUsed?: string[];
}
export declare class ReportAggregationService {
    private static instance;
    private performanceMetrics;
    static getInstance(): ReportAggregationService;
    executeAggregation<T = any>(model: mongoose.Model<any>, pipeline: PipelineStage[], options?: AggregationOptions, cacheKey?: string): Promise<AggregationResult<T>>;
    buildOptimizedMatchStage(workplaceId: string, filters?: any, indexHints?: string[]): PipelineStage;
    buildOptimizedGroupStage(groupBy: string, metrics: string[]): PipelineStage;
    buildTimeSeriesAggregation(workplaceId: string, filters: any, interval?: 'hour' | 'day' | 'week' | 'month'): PipelineStage[];
    buildFacetedAggregation(workplaceId: string, filters: any, facets: Record<string, PipelineStage[]>): PipelineStage[];
    buildOptimizedLookup(from: string, localField: string, foreignField: string, as: string, pipeline?: PipelineStage[]): PipelineStage;
    buildPaginationPipeline(page?: number, limit?: number, sortField?: string, sortOrder?: 1 | -1): PipelineStage[];
    private trackPerformance;
    getPerformanceStats(modelName?: string): Record<string, any>;
    private calculatePercentile;
    clearPerformanceMetrics(): void;
    getIndexRecommendations(modelName: string, queries: any[]): string[];
}
declare const _default: ReportAggregationService;
export default _default;
//# sourceMappingURL=ReportAggregationService.d.ts.map