import { apiClient } from '../services/apiClient';
import {
  DynamicUser,
  Role,
  Permission,
  BulkUserUpdate,
  RoleConflict,
  RoleConflictResolution,
  SystemConfig,
  SecuritySettings,
  MaintenanceStatus,
  ApiKey,
  FeatureFlag,
  SystemAnalytics,
} from '../types/rbac';

// User role management
export const getUserRoles = async (
  userId: string
): Promise<{ success: boolean; data: { userRoles: Role[] } }> => {
  try {
    const response = await apiClient.get(`/admin/users/${userId}/roles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

export const assignUserRoles = async (data: {
  userIds: string[];
  roleIds: string[];
  workspaceId?: string;
  isTemporary?: boolean;
  expiresAt?: string;
  assignmentReason?: string;
}): Promise<{ success: boolean; message: string; data?: unknown }> => {
  try {
    const response = await apiClient.post(`/admin/users/assign-roles`, data);
    return response.data;
  } catch (error) {
    console.error('Error assigning user roles:', error);
    throw error;
  }
};

export const revokeUserRole = async (
  userId: string,
  roleId: string,
  workspaceId?: string,
  revocationReason?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(
      `/admin/users/${userId}/roles/${roleId}`,
      {
        data: { workspaceId, revocationReason },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error revoking user role:', error);
    throw error;
  }
};

export const updateUserPermissions = async (
  userId: string,
  data: {
    directPermissions?: string[];
    deniedPermissions?: string[];
    replaceExisting?: boolean;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.put(
      `/admin/users/${userId}/permissions`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error updating user permissions:', error);
    throw error;
  }
};

export const getUserEffectivePermissions = async (
  userId: string,
  workspaceId?: string,
  includeInherited?: boolean,
  includeRoleDetails?: boolean
): Promise<{ success: boolean; data: unknown }> => {
  try {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (includeInherited !== undefined)
      params.append('includeInherited', includeInherited.toString());
    if (includeRoleDetails !== undefined)
      params.append('includeRoleDetails', includeRoleDetails.toString());

    const response = await apiClient.get(
      `/admin/users/${userId}/effective-permissions?${params}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user effective permissions:', error);
    throw error;
  }
};

export const bulkUpdateUsers = async (
  updates: BulkUserUpdate[],
  dryRun?: boolean
): Promise<{ success: boolean; message: string; data?: unknown }> => {
  try {
    const response = await apiClient.post(`/admin/users/bulk-update`, {
      updates,
      dryRun,
    });
    return response.data;
  } catch (error) {
    console.error('Error in bulk user update:', error);
    throw error;
  }
};

export const checkUserPermission = async (
  userId: string,
  permission: string,
  context?: Record<string, unknown>
): Promise<{
  success: boolean;
  data: { allowed: boolean; source: string; reason: string };
}> => {
  try {
    const response = await apiClient.post(
      `/admin/users/${userId}/check-permission`,
      { permission, context }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking user permission:', error);
    throw error;
  }
};

export const previewPermissionChanges = async (
  userId: string,
  data: {
    roleIds?: string[];
    directPermissions?: string[];
    deniedPermissions?: string[];
  }
): Promise<{ success: boolean; data: unknown }> => {
  try {
    const response = await apiClient.post(
      `/admin/users/${userId}/preview-permissions`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing permission changes:', error);
    throw error;
  }
};

export const detectRoleConflicts = async (
  userId: string,
  roleIds: string[]
): Promise<{ success: boolean; data: { conflicts: RoleConflict[] } }> => {
  try {
    const response = await apiClient.post(
      `/admin/users/${userId}/detect-conflicts`,
      { roleIds }
    );
    return response.data;
  } catch (error) {
    console.error('Error detecting role conflicts:', error);
    throw error;
  }
};

export const resolveRoleConflicts = async (
  userId: string,
  resolutions: RoleConflictResolution[]
): Promise<{ success: boolean; message: string; data?: unknown }> => {
  try {
    const response = await apiClient.post(
      `/admin/users/${userId}/resolve-conflicts`,
      { resolutions }
    );
    return response.data;
  } catch (error) {
    console.error('Error resolving role conflicts:', error);
    throw error;
  }
};

export const refreshUserPermissionCache = async (
  userId: string,
  workspaceId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(
      `/admin/users/${userId}/refresh-cache`,
      { workspaceId }
    );
    return response.data;
  } catch (error) {
    console.error('Error refreshing user permission cache:', error);
    throw error;
  }
};

// Admin management
export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { users: DynamicUser[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/users?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (
  userId: string
): Promise<{ success: boolean; data: { user: DynamicUser } }> => {
  try {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

export const updateUserRole = async (
  userId: string,
  roleId: string,
  workspaceId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, {
      roleId,
      workspaceId,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const suspendUser = async (
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/suspend`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const reactivateUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/reactivate`);
    return response.data;
  } catch (error) {
    console.error('Error reactivating user:', error);
    throw error;
  }
};

export const bulkAssignRoles = async (
  userIds: string[],
  roleId: string,
  workspaceId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/users/bulk-assign-roles`, {
      userIds,
      roleId,
      workspaceId,
    });
    return response.data;
  } catch (error) {
    console.error('Error in bulk role assignment:', error);
    throw error;
  }
};

export const bulkRevokeRoles = async (
  userIds: string[],
  roleId: string,
  workspaceId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/users/bulk-revoke-roles`, {
      userIds,
      roleId,
      workspaceId,
    });
    return response.data;
  } catch (error) {
    console.error('Error in bulk role revocation:', error);
    throw error;
  }
};

export const getAllRoles = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { roles: Role[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/roles?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getAllPermissions = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  riskLevel?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { permissions: Permission[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/permissions?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

export const getSystemStatistics = async (): Promise<{
  success: boolean;
  data: unknown;
}> => {
  try {
    const response = await apiClient.get(`/admin/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    throw error;
  }
};

export const getAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { auditLogs: unknown[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/audit-logs?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

export const getSystemHealth = async (): Promise<{
  success: boolean;
  data: unknown;
}> => {
  try {
    const response = await apiClient.get(`/admin/system-health`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};

export const getSystemConfig = async (): Promise<{
  success: boolean;
  data: { config: SystemConfig };
}> => {
  try {
    const response = await apiClient.get(`/admin/system-config`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system config:', error);
    throw error;
  }
};

export const updateSystemConfig = async (
  config: SystemConfig
): Promise<{
  success: boolean;
  message: string;
  data?: { config: SystemConfig };
}> => {
  try {
    const response = await apiClient.put(`/admin/system-config`, {
      config,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};

export const getActivityLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { activityLogs: unknown[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/activity-logs?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

export const getSystemNotifications = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  isRead?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { notifications: unknown[]; unreadCount: number; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/notifications?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<{
  success: boolean;
  message: string;
  data?: { notification: unknown };
}> => {
  try {
    const response = await apiClient.put(
      `/admin/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
  message: string;
  data?: { count: number };
}> => {
  try {
    const response = await apiClient.put(`/admin/notifications/read-all`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(
      `/admin/notifications/${notificationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const getBackupStatus = async (): Promise<{
  success: boolean;
  data: { backupStatus: unknown };
}> => {
  try {
    const response = await apiClient.get(`/admin/backup-status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching backup status:', error);
    throw error;
  }
};

export const createBackup = async (): Promise<{
  success: boolean;
  message: string;
  data?: { backupId: string; status: string; estimatedDuration: string };
}> => {
  try {
    const response = await apiClient.post(`/admin/create-backup`);
    return response.data;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const getSecuritySettings = async (): Promise<{
  success: boolean;
  data: { securitySettings: SecuritySettings };
}> => {
  try {
    const response = await apiClient.get(`/admin/security-settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching security settings:', error);
    throw error;
  }
};

export const updateSecuritySettings = async (
  securitySettings: SecuritySettings
): Promise<{
  success: boolean;
  message: string;
  data?: { securitySettings: SecuritySettings };
}> => {
  try {
    const response = await apiClient.put(`/admin/security-settings`, {
      securitySettings,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }
};

export const getMaintenanceStatus = async (): Promise<{
  success: boolean;
  data: { maintenanceStatus: MaintenanceStatus };
}> => {
  try {
    const response = await apiClient.get(`/admin/maintenance-status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    throw error;
  }
};

export const updateMaintenanceStatus = async (
  maintenanceStatus: MaintenanceStatus
): Promise<{
  success: boolean;
  message: string;
  data?: { maintenanceStatus: MaintenanceStatus };
}> => {
  try {
    const response = await apiClient.put(`/admin/maintenance-status`, {
      maintenanceStatus,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    throw error;
  }
};

export const getApiKeys = async (): Promise<{
  success: boolean;
  data: { apiKeys: ApiKey[] };
}> => {
  try {
    const response = await apiClient.get(`/admin/api-keys`);
    return response.data;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
};

export const createApiKey = async (data: {
  name: string;
  permissions: string[];
  expiresAt?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: { apiKey: ApiKey };
}> => {
  try {
    const response = await apiClient.post(`/admin/api-keys`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
};

export const revokeApiKey = async (
  apiKeyId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(`/admin/api-keys/${apiKeyId}`);
    return response.data;
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw error;
  }
};

export const getPendingLicenses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { licenses: unknown[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(
      `/admin/licenses/pending?${queryParams}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching pending licenses:', error);
    throw error;
  }
};

export const approveLicense = async (
  userId: string,
  expirationDate?: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/licenses/${userId}/approve`, {
      expirationDate,
      notes,
    });
    return response.data;
  } catch (error) {
    console.error('Error approving license:', error);
    throw error;
  }
};

export const rejectLicense = async (
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post(`/admin/licenses/${userId}/reject`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting license:', error);
    throw error;
  }
};

export const getAllFeatureFlags = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  success: boolean;
  data: { featureFlags: FeatureFlag[]; pagination: unknown };
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await apiClient.get(`/admin/feature-flags?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }
};

export const createFeatureFlag = async (data: {
  name: string;
  description?: string;
  isActive?: boolean;
  conditions?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  message: string;
  data?: { featureFlag: FeatureFlag };
}> => {
  try {
    const response = await apiClient.post(`/admin/feature-flags`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating feature flag:', error);
    throw error;
  }
};

export const updateFeatureFlag = async (
  flagId: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    conditions?: Record<string, unknown>;
  }
): Promise<{
  success: boolean;
  message: string;
  data?: { featureFlag: FeatureFlag };
}> => {
  try {
    const response = await apiClient.put(
      `/admin/feature-flags/${flagId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error updating feature flag:', error);
    throw error;
  }
};

export const getSystemAnalytics = async (
  period?: string
): Promise<{ success: boolean; data: SystemAnalytics }> => {
  try {
    const params = new URLSearchParams();
    if (period) params.append('period', period);

    const response = await apiClient.get(`/admin/analytics?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    throw error;
  }
};
