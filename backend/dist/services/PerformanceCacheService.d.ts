export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    tags?: string[];
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
    memoryUsage: number;
    keyCount: number;
}
export default class PerformanceCacheService {
    private static instance;
    private redis;
    private isConnected;
    private isInitializing;
    private initializationFailed;
    private readonly DEFAULT_TTL;
    private readonly COMPRESSION_THRESHOLD;
    private readonly PREFIXES;
    private stats;
    private constructor();
    static getInstance(): PerformanceCacheService;
    private initializeRedis;
    private ensureConnection;
    cacheApiResponse(key: string, data: any, options?: CacheOptions): Promise<boolean>;
    getCachedApiResponse<T = any>(key: string): Promise<T | null>;
    cacheDashboardOverview(userId: string, workspaceId: string, data: any, ttl?: number): Promise<boolean>;
    getCachedDashboardOverview(userId: string, workspaceId: string): Promise<any | null>;
    cacheUserProfile(userId: string, data: any, ttl?: number): Promise<boolean>;
    getCachedUserProfile(userId: string): Promise<any | null>;
    cachePatientList(workspaceId: string, filters: Record<string, any>, data: any, ttl?: number): Promise<boolean>;
    getCachedPatientList(workspaceId: string, filters: Record<string, any>): Promise<any | null>;
    cacheClinicalNotes(patientId: string, data: any, ttl?: number): Promise<boolean>;
    getCachedClinicalNotes(patientId: string): Promise<any | null>;
    cacheSearchResults(query: string, type: string, workspaceId: string, data: any, ttl?: number): Promise<boolean>;
    getCachedSearchResults(query: string, type: string, workspaceId: string): Promise<any | null>;
    cacheAggregation(name: string, params: Record<string, any>, data: any, ttl?: number): Promise<boolean>;
    getCachedAggregation(name: string, params: Record<string, any>): Promise<any | null>;
    invalidateByTags(tags: string[]): Promise<number>;
    invalidateByPattern(pattern: string): Promise<number>;
    invalidateUserCache(userId: string): Promise<void>;
    invalidatePatientCache(patientId: string): Promise<void>;
    getStats(): Promise<CacheStats>;
    clearAll(): Promise<void>;
    resetStats(): void;
    private hashFilters;
    private hashQuery;
    close(): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    set<T = any>(key: string, value: T, ttl: number): Promise<boolean>;
    invalidate(pattern: string): Promise<number>;
}
//# sourceMappingURL=PerformanceCacheService.d.ts.map