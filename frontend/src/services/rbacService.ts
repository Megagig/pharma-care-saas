/**
 * Dynamic RBAC Service
 * Handles API calls for role and permission management
 */

import { apiClient } from './apiClient';
import type {
  Role,
  Permission,
  DynamicUser,
  UserRole,
  RolePermission,
  RoleListResponse,
  PermissionListResponse,
  UserRoleResponse,
  RoleHierarchyResponse,
  BulkRoleAssignment,
  BulkOperationResult,
  RoleFormData,
  UserRoleAssignmentFormData,
  PermissionFormData,
  RoleSearchParams,
  UserSearchParams,
  PermissionSearchParams,
  PermissionResult,
  PermissionPreview,
  RoleHierarchyNode,
  PermissionCategory,
} from '../types/rbac';

export class RBACService {
  // Role Management
  async getRoles(params: RoleSearchParams = {}): Promise<RoleListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/roles?${queryParams}`);
    return response.data;
  }

  async getRole(roleId: string): Promise<{ success: boolean; data: Role }> {
    const response = await apiClient.get(`/admin/roles/${roleId}`);
    return response.data;
  }

  async createRole(roleData: RoleFormData): Promise<{ success: boolean; data: Role }> {
    const response = await apiClient.post('/admin/roles', roleData);
    return response.data;
  }

  async updateRole(roleId: string, updates: Partial<RoleFormData>): Promise<{ success: boolean; data: Role }> {
    const response = await apiClient.put(`/admin/roles/${roleId}`, updates);
    return response.data;
  }

  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/roles/${roleId}`);
    return response.data;
  }

  async getRolePermissions(roleId: string): Promise<{ success: boolean; data: { permissions: string[] } }> {
    const response = await apiClient.get(`/admin/roles/${roleId}/permissions`);
    return response.data;
  }

  async cloneRole(roleId: string, newName: string): Promise<{ success: boolean; data: Role }> {
    const response = await apiClient.post(`/admin/roles/${roleId}/clone`, { name: newName });
    return response.data;
  }

  // Permission Management
  async getPermissions(params: PermissionSearchParams = {}): Promise<PermissionListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/permissions?${queryParams}`);
    return response.data;
  }

  async getPermissionCategories(): Promise<{ success: boolean; data: PermissionCategory[] }> {
    const response = await apiClient.get('/admin/permissions/categories');
    return response.data;
  }

  async getPermissionDependencies(): Promise<{ success: boolean; data: Record<string, string[]> }> {
    const response = await apiClient.get('/admin/permissions/dependencies');
    return response.data;
  }

  async createPermission(permissionData: PermissionFormData): Promise<{ success: boolean; data: Permission }> {
    const response = await apiClient.post('/admin/permissions', permissionData);
    return response.data;
  }

  async updatePermission(permissionId: string, updates: Partial<PermissionFormData>): Promise<{ success: boolean; data: Permission }> {
    const response = await apiClient.put(`/admin/permissions/${permissionId}`, updates);
    return response.data;
  }

  async deletePermission(permissionId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/permissions/${permissionId}`);
    return response.data;
  }

  // User Role Management
  async getUsers(params: UserSearchParams = {}): Promise<{ success: boolean; data: { users: DynamicUser[]; total: number; page: number; limit: number; totalPages: number } }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/users?${queryParams}`);
    return response.data;
  }

  async getUserRoles(userId: string): Promise<UserRoleResponse> {
    const response = await apiClient.get(`/admin/users/${userId}/roles`);
    return response.data;
  }

  async assignUserRoles(assignmentData: UserRoleAssignmentFormData): Promise<BulkOperationResult> {
    const response = await apiClient.post('/admin/users/assign-roles', assignmentData);
    return response.data;
  }

  async revokeUserRole(userId: string, roleId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/users/${userId}/roles/${roleId}`);
    return response.data;
  }

  async bulkAssignRoles(bulkData: BulkRoleAssignment): Promise<BulkOperationResult> {
    const response = await apiClient.post('/admin/users/bulk-assign-roles', bulkData);
    return response.data;
  }

  async bulkRevokeRoles(userIds: string[], roleIds: string[]): Promise<BulkOperationResult> {
    const response = await apiClient.post('/admin/users/bulk-revoke-roles', { userIds, roleIds });
    return response.data;
  }

  // Permission Checking
  async checkUserPermission(userId: string, permission: string, context?: Record<string, unknown>): Promise<PermissionResult> {
    const response = await apiClient.post(`/admin/users/${userId}/check-permission`, {
      permission,
      context
    });
    return response.data.data;
  }

  async getUserEffectivePermissions(userId: string): Promise<{ success: boolean; data: { permissions: string[]; sources: Record<string, string> } }> {
    const response = await apiClient.get(`/admin/users/${userId}/effective-permissions`);
    return response.data;
  }

  async previewPermissionChanges(userId: string, roleIds: string[], directPermissions?: string[], deniedPermissions?: string[]): Promise<{ success: boolean; data: PermissionPreview }> {
    const response = await apiClient.post(`/admin/users/${userId}/preview-permissions`, {
      roleIds,
      directPermissions,
      deniedPermissions
    });
    return response.data;
  }

  // Role Hierarchy Management
  async getRoleHierarchy(): Promise<RoleHierarchyResponse> {
    const response = await apiClient.get('/admin/roles/hierarchy');
    return response.data;
  }

  async updateRoleHierarchy(roleId: string, parentRoleId?: string): Promise<{ success: boolean; data: RoleHierarchyNode[] }> {
    const response = await apiClient.put(`/admin/roles/${roleId}/hierarchy`, { parentRoleId });
    return response.data;
  }

  async reorderRoleHierarchy(hierarchyUpdates: Array<{ roleId: string; parentRoleId?: string; order: number }>): Promise<{ success: boolean; data: RoleHierarchyNode[] }> {
    const response = await apiClient.put('/admin/roles/hierarchy/reorder', { updates: hierarchyUpdates });
    return response.data;
  }

  // Permission Matrix
  async getPermissionMatrix(): Promise<{ success: boolean; data: { roles: Role[]; permissions: Permission[]; matrix: Record<string, Record<string, boolean>> } }> {
    const response = await apiClient.get('/admin/permissions/matrix');
    return response.data;
  }

  async updatePermissionMatrix(roleId: string, permissions: Record<string, boolean>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/admin/roles/${roleId}/permissions`, { permissions });
    return response.data;
  }

  // Conflict Detection
  async detectRoleConflicts(userId: string, newRoleIds: string[]): Promise<{ success: boolean; data: { conflicts: Array<{ type: string; message: string; severity: 'warning' | 'error' }> } }> {
    const response = await apiClient.post(`/admin/users/${userId}/detect-conflicts`, { roleIds: newRoleIds });
    return response.data;
  }

  async resolveRoleConflicts(userId: string, resolutions: Array<{ conflictId: string; resolution: 'allow' | 'deny' | 'prioritize'; priority?: string }>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/admin/users/${userId}/resolve-conflicts`, { resolutions });
    return response.data;
  }

  // Analytics and Reporting
  async getRoleUsageAnalytics(): Promise<{ success: boolean; data: { roleUsage: Array<{ roleId: string; roleName: string; userCount: number; lastUsed: string }> } }> {
    const response = await apiClient.get('/admin/analytics/role-usage');
    return response.data;
  }

  async getPermissionUsageAnalytics(): Promise<{ success: boolean; data: { permissionUsage: Array<{ permission: string; roleCount: number; userCount: number }> } }> {
    const response = await apiClient.get('/admin/analytics/permission-usage');
    return response.data;
  }

  async exportRoleAssignments(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/admin/roles/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Real-time Updates
  async subscribeToPermissionUpdates(userId: string, callback: (notification: unknown) => void): Promise<() => void> {
    // This would typically use WebSocket or Server-Sent Events
    // For now, return a mock unsubscribe function
    console.log(`Subscribing to permission updates for user ${userId}`);
    return () => {
      console.log(`Unsubscribing from permission updates for user ${userId}`);
    };
  }

  // Cache Management
  async refreshUserPermissionCache(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/admin/users/${userId}/refresh-cache`);
    return response.data;
  }

  async clearAllPermissionCaches(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/admin/permissions/clear-cache');
    return response.data;
  }
}

export const rbacService = new RBACService();
export default rbacService;