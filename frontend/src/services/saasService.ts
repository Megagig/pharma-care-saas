import { apiClient } from '../lib/apiClient';

// Types for SaaS Settings
export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  activeSubscriptions: number;
  totalWorkspaces: number;
  monthlyRevenue: number;
  systemUptime: string;
  activeFeatureFlags: number;
  pendingLicenses: number;
  supportTickets: {
    open: number;
    resolved: number;
    critical: number;
  };
}

export interface SystemHealth {
  database: HealthStatus;
  api: HealthStatus;
  memory: HealthStatus;
  cache: HealthStatus;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  value: string | number;
  threshold?: number;
  message?: string;
}

export interface Activity {
  id: string;
  type: 'user_registration' | 'feature_flag_change' | 'license_approval' | 'system_alert';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  workspaceId?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedUsers {
  users: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: UserFilters;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export interface ImpersonationSession {
  sessionToken: string;
  expiresAt: Date;
  targetUser: any;
}

export interface FeatureFlagTargeting {
  pharmacies?: string[];
  userGroups?: string[];
  subscriptionPlans?: string[];
  percentage?: number;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
    preventReuse: number;
  };
  sessionSettings: {
    maxDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
  };
  accountLockout: {
    maxFailedAttempts: number;
    lockoutDuration: number;
    autoUnlock: boolean;
  };
  twoFactorAuth: {
    enforced: boolean;
    methods: string[];
    gracePeriod: number;
  };
}

export interface UserSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
}

/**
 * SaaS Service - Handles all SaaS Settings API calls
 */
class SaaSService {
  private baseUrl = '/api/admin/saas';

  // System Overview APIs
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get(`${this.baseUrl}/overview/metrics`);
    return response.data.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get(`${this.baseUrl}/overview/health`);
    return response.data.data;
  }

  async getRecentActivities(): Promise<Activity[]> {
    const response = await apiClient.get(`${this.baseUrl}/overview/activities`);
    return response.data.data;
  }

  // User Management APIs
  async getUsers(filters: UserFilters = {}, pagination: Pagination = { page: 1, limit: 20 }): Promise<PaginatedUsers> {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...filters,
    });
    
    const response = await apiClient.get(`${this.baseUrl}/users?${params}`);
    return response.data.data;
  }

  async updateUserRole(userId: string, roleId: string, workspaceId?: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/users/${userId}/role`, {
      roleId,
      workspaceId,
    });
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/users/${userId}/suspend`, { reason });
  }

  async reactivateUser(userId: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/users/${userId}/reactivate`);
  }

  async bulkAssignRoles(userIds: string[], roleId: string): Promise<BulkOperationResult> {
    const response = await apiClient.post(`${this.baseUrl}/users/bulk/assign-roles`, {
      userIds,
      roleId,
    });
    return response.data.data;
  }

  async impersonateUser(targetUserId: string): Promise<ImpersonationSession> {
    const response = await apiClient.post(`${this.baseUrl}/users/${targetUserId}/impersonate`);
    return response.data.data;
  }

  // Feature Flags APIs
  async getFeatureFlags(): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/feature-flags`);
    return response.data.data.flags;
  }

  async updateFeatureFlagTargeting(flagId: string, targeting: FeatureFlagTargeting): Promise<void> {
    await apiClient.put(`${this.baseUrl}/feature-flags/${flagId}/targeting`, {
      targetingRules: targeting,
    });
  }

  async getFeatureFlagUsageMetrics(flagId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/feature-flags/${flagId}/usage-metrics`);
    return response.data.data;
  }

  // Security APIs
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await apiClient.get(`${this.baseUrl}/security/settings`);
    return response.data.data;
  }

  async updatePasswordPolicy(policy: SecuritySettings['passwordPolicy']): Promise<void> {
    await apiClient.put(`${this.baseUrl}/security/password-policy`, policy);
  }

  async getActiveSessions(): Promise<UserSession[]> {
    const response = await apiClient.get(`${this.baseUrl}/security/sessions`);
    return response.data.data;
  }

  async terminateSession(sessionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/security/sessions/${sessionId}`);
  }
}

export const saasService = new SaaSService();
export default saasService;