import mongoose from 'mongoose';
import { IRole } from '../models/Role';
export interface RoleHierarchyNode {
    role: IRole;
    children: RoleHierarchyNode[];
    permissions: string[];
    inheritedPermissions: string[];
    level: number;
}
export interface RoleConflict {
    type: 'circular_dependency' | 'permission_conflict' | 'hierarchy_depth' | 'invalid_parent';
    roleId: mongoose.Types.ObjectId;
    conflictingRoleId?: mongoose.Types.ObjectId;
    message: string;
    severity: 'warning' | 'error' | 'critical';
}
export interface PermissionInheritanceResult {
    permissions: string[];
    sources: Record<string, {
        roleId: mongoose.Types.ObjectId;
        roleName: string;
        source: 'direct' | 'inherited';
        level: number;
    }>;
    conflicts: RoleConflict[];
}
declare class RoleHierarchyService {
    private static instance;
    private readonly MAX_HIERARCHY_DEPTH;
    private readonly CACHE_TTL;
    private hierarchyCache;
    private constructor();
    static getInstance(): RoleHierarchyService;
    getAllRolePermissions(roleId: mongoose.Types.ObjectId, visited?: Set<string>): Promise<PermissionInheritanceResult>;
    detectCircularDependency(roleId: mongoose.Types.ObjectId, parentRoleId: mongoose.Types.ObjectId): Promise<boolean>;
    calculateHierarchyLevel(roleId: mongoose.Types.ObjectId): Promise<number>;
    validateRoleHierarchy(roleId: mongoose.Types.ObjectId, parentRoleId?: mongoose.Types.ObjectId): Promise<RoleConflict[]>;
    getRoleHierarchyTree(rootRoleId?: mongoose.Types.ObjectId): Promise<RoleHierarchyNode[]>;
    private buildHierarchyNode;
    resolveRoleConflicts(conflicts: RoleConflict[]): Promise<Array<{
        conflict: RoleConflict;
        resolutions: string[];
    }>>;
    getRoleInheritancePath(roleId: mongoose.Types.ObjectId): Promise<IRole[]>;
    updateHierarchyLevels(startingRoleId: mongoose.Types.ObjectId): Promise<void>;
    clearHierarchyCache(roleId?: mongoose.Types.ObjectId): void;
    getRolesWithPermission(permission: string): Promise<Array<{
        role: IRole;
        source: 'direct' | 'inherited';
        inheritedFrom?: IRole;
    }>>;
}
export default RoleHierarchyService;
//# sourceMappingURL=RoleHierarchyService.d.ts.map