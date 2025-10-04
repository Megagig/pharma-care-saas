import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { WorkspaceContext, PermissionResult } from '../types/auth';
export interface DynamicPermissionResult extends PermissionResult {
    source?: 'super_admin' | 'direct_permission' | 'direct_denial' | 'role' | 'inherited' | 'legacy' | 'none';
    roleId?: mongoose.Types.ObjectId;
    roleName?: string;
    inheritedFrom?: string;
    requiredPermissions?: string[];
    suggestions?: string[];
}
export interface PermissionContext {
    workspaceId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    resourceId?: mongoose.Types.ObjectId;
    clientIP?: string;
    currentTime?: Date;
}
declare class DynamicPermissionService {
    private static instance;
    private readonly CACHE_TTL;
    private roleHierarchyService;
    private cacheManager;
    private cacheInvalidationService;
    private dbOptimizationService;
    private aggregationService;
    private constructor();
    static getInstance(): DynamicPermissionService;
    checkPermission(user: IUser, action: string, context: WorkspaceContext, permissionContext?: PermissionContext): Promise<DynamicPermissionResult>;
    resolveUserPermissions(user: IUser, context: WorkspaceContext, permissionContext?: PermissionContext): Promise<{
        permissions: string[];
        sources: Record<string, string>;
        deniedPermissions: string[];
    }>;
    private resolveRolePermissions;
    private checkInheritedPermissions;
    private getAllRolePermissions;
    private getAllPermissionsForRole;
    private checkUserStatus;
    private checkLegacyPermission;
    getPermissionSuggestions(user: IUser, action: string): Promise<string[]>;
    invalidateUserCache(userId: mongoose.Types.ObjectId, workspaceId?: mongoose.Types.ObjectId, reason?: string, initiatedBy?: mongoose.Types.ObjectId): Promise<void>;
    invalidateRoleCache(roleId: mongoose.Types.ObjectId, reason?: string, initiatedBy?: mongoose.Types.ObjectId): Promise<void>;
    invalidateRoleHierarchyCache(roleId: mongoose.Types.ObjectId, reason?: string, initiatedBy?: mongoose.Types.ObjectId): Promise<void>;
    bulkUpdateUserPermissions(updates: Array<{
        userId: mongoose.Types.ObjectId;
        roleIds?: mongoose.Types.ObjectId[];
        directPermissions?: string[];
        deniedPermissions?: string[];
    }>, modifiedBy: mongoose.Types.ObjectId): Promise<void>;
    private updateUserRoles;
    private auditPermissionChange;
    warmPermissionCache(options: {
        userIds?: mongoose.Types.ObjectId[];
        roleIds?: mongoose.Types.ObjectId[];
        commonActions?: string[];
        workspaceId?: mongoose.Types.ObjectId;
    }): Promise<void>;
    getCacheMetrics(): Promise<any>;
    checkCacheConsistency(): Promise<{
        consistent: boolean;
        issues: string[];
        repaired: number;
    }>;
    initializeDatabaseOptimizations(): Promise<void>;
    getDatabaseOptimizationReport(): Promise<any>;
    getQueryPerformanceStats(): any;
    private auditPermissionCheck;
}
export default DynamicPermissionService;
export { DynamicPermissionService };
//# sourceMappingURL=DynamicPermissionService.d.ts.map