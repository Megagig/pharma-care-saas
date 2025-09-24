import mongoose from 'mongoose';
import { IUser } from '../models/User';
export interface PermissionSource {
    type: 'direct' | 'role' | 'inherited' | 'legacy';
    roleId?: mongoose.Types.ObjectId;
    roleName?: string;
    inheritedFrom?: string;
    priority: number;
    conditions?: any;
}
export interface AggregatedPermission {
    action: string;
    granted: boolean;
    sources: PermissionSource[];
    conflicts: PermissionConflict[];
    finalDecision: 'allow' | 'deny' | 'conditional';
    conditions?: any;
}
export interface PermissionConflict {
    type: 'explicit_deny_override' | 'role_conflict' | 'dependency_missing' | 'circular_dependency';
    permission: string;
    conflictingSources: PermissionSource[];
    resolution: 'deny_wins' | 'highest_priority' | 'explicit_resolution_required';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface PermissionDependency {
    permission: string;
    dependsOn: string[];
    conflicts: string[];
    satisfied: boolean;
    missingSources: string[];
}
export interface PermissionAggregationResult {
    userId: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    permissions: AggregatedPermission[];
    conflicts: PermissionConflict[];
    dependencies: PermissionDependency[];
    suggestions: string[];
    timestamp: Date;
}
declare class PermissionAggregationService {
    private static instance;
    private roleHierarchyService;
    private cacheManager;
    private readonly PRIORITY_LEVELS;
    private constructor();
    static getInstance(): PermissionAggregationService;
    aggregateUserPermissions(user: IUser, workspaceId?: mongoose.Types.ObjectId): Promise<PermissionAggregationResult>;
    private collectDirectPermissions;
    private collectRolePermissions;
    private collectInheritedPermissions;
    private collectLegacyPermissions;
    private applyExplicitDenials;
    private resolvePermissionConflicts;
    private validatePermissionDependencies;
    private generatePermissionSuggestions;
    private addOrMergePermission;
    private isGrantingSource;
    checkAggregatedPermission(user: IUser, action: string, workspaceId?: mongoose.Types.ObjectId): Promise<{
        allowed: boolean;
        source: string;
        conflicts: PermissionConflict[];
        conditions?: any;
    }>;
}
export default PermissionAggregationService;
//# sourceMappingURL=PermissionAggregationService.d.ts.map