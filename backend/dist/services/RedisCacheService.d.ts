interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    tags?: string[];
}
interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalOperations: number;
    avgResponseTime: number;
}
export declare class RedisCacheService {
    private static instance;
    private redis;
    private stats;
    private responseTimes;
    constructor();
    static getInstance(): RedisCacheService;
    private setupEventHandlers;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    get<T>(key: string): Promise<T | null>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    invalidateByTags(tags: string[]): Promise<number>;
    clear(): Promise<boolean>;
    getStats(): CacheStats;
    resetStats(): void;
    getInfo(): Promise<any>;
    healthCheck(): Promise<boolean>;
    close(): Promise<void>;
    private addCacheTags;
    private updateStats;
}
export declare class CacheKeyGenerator {
    private static readonly PREFIX;
    static reportData(reportType: string, workplaceId: string, filters: any): string;
    static reportSummary(workplaceId: string, period: string): string;
    static aggregationResult(modelName: string, pipelineHash: string): string;
    static userReports(userId: string): string;
    static reportTemplate(templateId: string): string;
    private static hashObject;
}
export declare class CachedReportService {
    private cache;
    constructor();
    getCachedReportData<T>(reportType: string, workplaceId: string, filters: any, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
    invalidateReportCache(reportType?: string, workplaceId?: string): Promise<void>;
}
declare const _default: RedisCacheService;
export default _default;
//# sourceMappingURL=RedisCacheService.d.ts.map