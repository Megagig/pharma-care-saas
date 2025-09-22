/**
 * Dynamic RBAC Types for Frontend
 * Matches backend models for type safety
 */

export type ObjectId = string;

// Role Types
export interface Role {
    _id: ObjectId;
    name: string;
    displayName: string;
    description: string;
    category: 'system' | 'workplace' | 'custom';

    // Role hierarchy
    parentRole?: ObjectId;
    childRoles: ObjectId[];
    hierarchyLevel: number;

    // Permission assignments
    permissions: string[];

    // Role metadata
    isActive: boolean;
    isSystemRole: boolean;
    isDefault: boolean;

    // Workspace context
    workspaceId?: ObjectId;

    // Audit fields
    createdBy: ObjectId;
    lastModifiedBy: ObjectId;
    createdAt: string;
    updatedAt: string;
}

// Permission Types
export interface Permission {
    _id: ObjectId;
    action: string;
    displayName: string;
    description: string;
    category: string;

    // Permission metadata
    isSystemPermission: boolean;
    requiresSubscription: boolean;
    allowTrialAccess: boolean;
    requiredPlanTiers: string[];
    requiredFeatures: string[];

    // Dependencies
    dependsOn: string[];
    conflicts: string[];

    // Audit fields
    createdBy: ObjectId;
    lastModifiedBy: ObjectId;
    createdAt: string;
    updatedAt: string;
}

// User Role Assignment
export interface UserRole {
    _id: ObjectId;
    userId: ObjectId;
    roleId: ObjectId;

    // Assignment context
    workspaceId?: ObjectId;
    assignedBy: ObjectId;
    assignedAt: string;

    // Temporary assignments
    expiresAt?: string;
    isTemporary: boolean;

    // Status
    isActive: boolean;

    // Audit fields
    lastModifiedBy: ObjectId;
    lastModifiedAt: string;
}

// Role Permission Assignment
export interface RolePermission {
    _id: ObjectId;
    roleId: ObjectId;
    permission: string;
    granted: boolean;

    // Context and conditions
    conditions?: {
        workspaceOnly?: boolean;
        timeRestricted?: {
            startTime: string;
            endTime: string;
        };
        ipRestricted?: string[];
    };

    // Audit fields
    grantedBy: ObjectId;
    grantedAt: string;
    lastModifiedBy: ObjectId;
    lastModifiedAt: string;
}

// Enhanced User Type for Dynamic RBAC
export interface DynamicUser {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    status: 'pending' | 'active' | 'suspended' | 'license_pending' | 'license_rejected';

    // Legacy role fields (for backward compatibility)
    systemRole: 'pharmacist' | 'pharmacy_team' | 'pharmacy_outlet' | 'intern_pharmacist' | 'super_admin' | 'owner';
    workplaceRole?: 'Owner' | 'Staff' | 'Pharmacist' | 'Cashier' | 'Technician' | 'Assistant';

    // Dynamic role assignments
    assignedRoles: ObjectId[];
    directPermissions: string[];
    deniedPermissions: string[];

    // Permission cache
    cachedPermissions?: {
        permissions: string[];
        lastUpdated: string;
        expiresAt: string;
    };

    // Audit fields
    roleLastModifiedBy?: ObjectId;
    roleLastModifiedAt?: string;

    createdAt: string;
    updatedAt: string;
}

// Permission Resolution Result
export interface PermissionResult {
    allowed: boolean;
    source?: 'super_admin' | 'direct_permission' | 'role' | 'inherited' | 'legacy' | 'direct_denial' | 'none';
    reason?: string;
    roleId?: ObjectId;
    roleName?: string;
    inheritedFrom?: string;
    requiredPermissions?: string[];
    upgradeRequired?: boolean;
}

// Role Hierarchy Tree Node
export interface RoleHierarchyNode {
    role: Role;
    children: RoleHierarchyNode[];
    level: number;
    path: string[];
}

// Permission Matrix Category
export interface PermissionCategory {
    name: string;
    displayName: string;
    description: string;
    permissions: Permission[];
}

// Bulk Operation Types
export interface BulkRoleAssignment {
    userIds: ObjectId[];
    roleIds: ObjectId[];
    directPermissions?: string[];
    deniedPermissions?: string[];
    workspaceId?: ObjectId;
    expiresAt?: string;
}

export interface BulkOperationResult {
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{
        userId: ObjectId;
        error: string;
    }>;
}

// Real-time Update Types
export interface PermissionChangeNotification {
    type: 'role_assigned' | 'role_revoked' | 'permission_granted' | 'permission_denied' | 'role_updated';
    userId: ObjectId;
    affectedUsers?: ObjectId[];
    roleId?: ObjectId;
    roleName?: string;
    permission?: string;
    timestamp: string;
    modifiedBy: ObjectId;
}

// UI State Types
export interface RoleAssignmentState {
    selectedUsers: ObjectId[];
    selectedRoles: ObjectId[];
    bulkOperationInProgress: boolean;
    conflictWarnings: Array<{
        userId: ObjectId;
        conflicts: string[];
    }>;
}

export interface PermissionPreview {
    userId: ObjectId;
    currentPermissions: string[];
    newPermissions: string[];
    addedPermissions: string[];
    removedPermissions: string[];
    conflicts: string[];
}

// API Response Types
export interface RoleListResponse {
    success: boolean;
    data: {
        roles: Role[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PermissionListResponse {
    success: boolean;
    data: {
        permissions: Permission[];
        categories: PermissionCategory[];
        total: number;
    };
}

export interface UserRoleResponse {
    success: boolean;
    data: {
        userRoles: UserRole[];
        effectivePermissions: string[];
        roleHierarchy: RoleHierarchyNode[];
    };
}

export interface RoleHierarchyResponse {
    success: boolean;
    data: {
        hierarchy: RoleHierarchyNode[];
        flatRoles: Role[];
    };
}

// Form Data Types
export interface RoleFormData {
    name: string;
    displayName: string;
    description: string;
    category: 'system' | 'workplace' | 'custom';
    parentRoleId?: ObjectId;
    permissions: string[];
    isActive: boolean;
    workspaceId?: ObjectId;
}

export interface UserRoleAssignmentFormData {
    userIds: ObjectId[];
    roleIds: ObjectId[];
    workspaceId?: ObjectId;
    expiresAt?: string;
    isTemporary: boolean;
}

export interface PermissionFormData {
    action: string;
    displayName: string;
    description: string;
    category: string;
    requiresSubscription: boolean;
    allowTrialAccess: boolean;
    requiredPlanTiers: string[];
    dependsOn: string[];
    conflicts: string[];
}

// Search and Filter Types
export interface RoleSearchParams {
    search?: string;
    category?: 'system' | 'workplace' | 'custom';
    isActive?: boolean;
    workspaceId?: ObjectId;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UserSearchParams {
    search?: string;
    status?: string;
    systemRole?: string;
    workplaceRole?: string;
    hasRole?: ObjectId;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PermissionSearchParams {
    search?: string;
    category?: string;
    requiresSubscription?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Error Types
export interface RBACError {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

// Audit Types
export interface RoleAuditLog {
    _id: ObjectId;
    action: 'role_created' | 'role_updated' | 'role_deleted' | 'role_assigned' | 'role_revoked' | 'permission_granted' | 'permission_denied';
    userId?: ObjectId;
    roleId?: ObjectId;
    permission?: string;
    oldValue?: unknown;
    newValue?: unknown;
    modifiedBy: ObjectId;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
}