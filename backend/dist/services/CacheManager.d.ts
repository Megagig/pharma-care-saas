import mongoose from 'mongoose';
export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    version: string;
}
export interface PermissionCacheEntry {
    permissions: string[];
    sources: Record<string, string>;
    deniedPermissions: string[];
    userId: string;
    workspaceId?: string;
    lastUpdated: number;
    expiresAt: number;
}
export interface RoleCacheEntry {
    roleId: string;
    permissions: string[];
    inheritedPermissions: string[];
    hierarchyLevel: number;
    parentRoleId?: string;
    lastUpdated: number;
    expiresAt: number;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
    totalOperations: number;
    memoryUsage: number;
    keyCount: number;
}
declare class CacheManager {
    private static instance;
    private readonly DEFAULT_TTL;
    private readonly MAX_MEMORY_USAGE;
    private readonly CACHE_VERSION;
    private metrics;
    private readonly PREFIXES;
    private constructor();
    static getInstance(): CacheManager;
    private getRedis;
    cacheUserPermissions(userId: mongoose.Types.ObjectId, permissions: string[], sources: Record<string, string>, deniedPermissions?: string[], workspaceId?: mongoose.Types.ObjectId, ttl?: number): Promise<boolean>;
    getCachedUserPermissions(userId: mongoose.Types.ObjectId, workspaceId?: mongoose.Types.ObjectId): Promise<PermissionCacheEntry | null>;
    cacheRolePermissions(roleId: mongoose.Types.ObjectId, permissions: string[], inheritedPermissions: string[], hierarchyLevel: number, parentRoleId?: mongoose.Types.ObjectId, ttl?: number): Promise<boolean>;
    getCachedRolePermissions(roleId: mongoose.Types.ObjectId): Promise<RoleCacheEntry | null>;
    cachePermissionCheck(userId: mongoose.Types.ObjectId, action: string, allowed: boolean, source: string, workspaceId?: mongoose.Types.ObjectId, ttl?: number): Promise<boolean>;
    getCachedPermissionCheck(userId: mongoose.Types.ObjectId, action: string, workspaceId?: mongoose.Types.ObjectId): Promise<{
        allowed: boolean;
        source: string;
        timestamp: number;
    } | null>;
    invalidateUserCache(userId: mongoose.Types.ObjectId, workspaceId?: mongoose.Types.ObjectId): Promise<void>;
    invalidateRoleCache(roleId: mongoose.Types.ObjectId): Promise<void>;
    invalidatePattern(pattern: string): Promise<number>;
    warmCache(warmingStrategies: Array<{
        type: 'user_permissions' | 'role_permissions' | 'permission_checks';
        targets: mongoose.Types.ObjectId[];
        priority: 'high' | 'medium' | 'low';
    }>): Promise<void>;
    private warmUserPermissions;
    private warmRolePermissions;
    private warmPermissionChecks;
    checkConsistency(): Promise<{
        consistent: boolean;
        issues: string[];
        repaired: number;
    }>;
    private checkOrphanedEntries;
    private validateCacheKeyPatterns;
    private performMemoryCleanup;
    private checkCacheFragmentation;
    getMetrics(): Promise<CacheMetrics>;
    clearAll(): Promise<void>;
    resetMetrics(): void;
    private getUserPermissionKey;
    private getRolePermissionKey;
    private getPermissionCheckKey;
    close(): Promise<void>;
}
export default CacheManager;
//# sourceMappingURL=CacheManager.d.ts.map