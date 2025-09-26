export interface CacheEntry<T = any> {
    key: string;
    value: T;
    createdAt: Date;
    expiresAt: Date;
    accessCount: number;
    lastAccessed: Date;
    tags: string[];
    size: number;
}
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    averageAccessTime: number;
}
export interface CacheConfig {
    maxSize: number;
    maxEntries: number;
    defaultTTL: number;
    cleanupInterval: number;
    enableCompression: boolean;
    enableMetrics: boolean;
}
declare class DiagnosticCacheService {
    private cache;
    private stats;
    private readonly config;
    private cleanupTimer?;
    constructor(config?: Partial<CacheConfig>);
    cacheAIResult(inputHash: string, result: any, ttl?: number): Promise<void>;
    getCachedAIResult(inputHash: string): Promise<any | null>;
    cacheDrugInteractions(medicationHash: string, interactions: any, ttl?: number): Promise<void>;
    getCachedDrugInteractions(medicationHash: string): Promise<any | null>;
    cacheLabReferenceRanges(testCode: string, referenceRanges: any, ttl?: number): Promise<void>;
    getCachedLabReferenceRanges(testCode: string): Promise<any | null>;
    cacheFHIRMapping(mappingKey: string, mapping: any, ttl?: number): Promise<void>;
    getCachedFHIRMapping(mappingKey: string): Promise<any | null>;
    cachePatientSummary(patientId: string, workplaceId: string, summary: any, ttl?: number): Promise<void>;
    getCachedPatientSummary(patientId: string, workplaceId: string): Promise<any | null>;
    private set;
    private get;
    delete(key: string): Promise<boolean>;
    clearByTag(tag: string): Promise<number>;
    clear(): Promise<void>;
    generateCacheKey(prefix: string, data: any): string;
    private normalizeForHashing;
    private ensureCapacity;
    private evictLRU;
    private cleanupExpired;
    private calculateSize;
    private getTotalSize;
    private compress;
    private decompress;
    private updateAccessMetrics;
    getStats(): CacheStats;
    getEntriesByTag(tag: string): CacheEntry[];
    getHealthStatus(): {
        isHealthy: boolean;
        issues: string[];
        recommendations: string[];
    };
    private startCleanupTimer;
    stopCleanupTimer(): void;
    warmUp(warmupData: Array<{
        key: string;
        value: any;
        ttl?: number;
        tags?: string[];
    }>): Promise<void>;
    exportCache(): Array<{
        key: string;
        value: any;
        expiresAt: Date;
        tags: string[];
    }>;
    importCache(importData: Array<{
        key: string;
        value: any;
        expiresAt: Date;
        tags: string[];
    }>): Promise<void>;
}
declare const _default: DiagnosticCacheService;
export default _default;
//# sourceMappingURL=diagnosticCacheService.d.ts.map