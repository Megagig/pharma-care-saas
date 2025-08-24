import { apiClient } from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  licenseStatus: string;
  licenseNumber?: string;
  subscriptionTier: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface License {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  licenseNumber: string;
  licenseDocument: {
    fileName: string;
    uploadedAt: string;
  };
  createdAt: string;
}

export interface Analytics {
  users: { _id: string; count: number; active: number }[];
  subscriptions: { _id: string; count: number; active: number; revenue: number }[];
  licenses: { _id: string; count: number }[];
  generated: string;
}

export interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  requiredTiers: string[];
  requiredRoles: string[];
  customRules: {
    field: string;
    operator: string;
    value: any;
  }[];
  environments: string[];
  createdAt: string;
  updatedAt: string;
}

export const adminService = {
  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    licenseStatus?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await apiClient.get(`/admin/users?${queryParams}`);
    return response.data;
  },

  async updateUserRole(userId: string, role: string) {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async updateUserStatus(userId: string, status: string, reason?: string) {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { 
      status, 
      reason 
    });
    return response.data;
  },

  async deleteUser(userId: string) {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async assignUserToTeam(userId: string, teamLeadId: string) {
    const response = await apiClient.put(`/admin/users/${userId}/team`, { 
      teamLeadId 
    });
    return response.data;
  },

  // License Management
  async getPendingLicenses() {
    const response = await apiClient.get('/admin/licenses/pending');
    return response.data;
  },

  async approveLicense(licenseId: string, licenseNumber: string) {
    const response = await apiClient.put(`/admin/licenses/${licenseId}/approve`, {
      licenseNumber
    });
    return response.data;
  },

  async rejectLicense(licenseId: string, reason: string) {
    const response = await apiClient.put(`/admin/licenses/${licenseId}/reject`, {
      reason
    });
    return response.data;
  },

  async downloadLicenseDocument(licenseId: string) {
    const response = await apiClient.get(`/admin/licenses/${licenseId}/document`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Analytics
  async getAnalytics() {
    const response = await apiClient.get('/admin/analytics');
    return response.data;
  },

  async getUserAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await apiClient.get(`/admin/analytics/users?period=${period}`);
    return response.data;
  },

  async getSubscriptionAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await apiClient.get(`/admin/analytics/subscriptions?period=${period}`);
    return response.data;
  },

  async getRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await apiClient.get(`/admin/analytics/revenue?period=${period}`);
    return response.data;
  },

  // Feature Flags Management
  async getFeatureFlags() {
    const response = await apiClient.get('/admin/feature-flags');
    return response.data;
  },

  async createFeatureFlag(flagData: Partial<FeatureFlag>) {
    const response = await apiClient.post('/admin/feature-flags', flagData);
    return response.data;
  },

  async updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>) {
    const response = await apiClient.put(`/admin/feature-flags/${flagId}`, updates);
    return response.data;
  },

  async toggleFeatureFlag(flagId: string, enabled: boolean) {
    const response = await apiClient.patch(`/admin/feature-flags/${flagId}/toggle`, {
      enabled
    });
    return response.data;
  },

  async deleteFeatureFlag(flagId: string) {
    const response = await apiClient.delete(`/admin/feature-flags/${flagId}`);
    return response.data;
  },

  // System Settings
  async getSystemSettings() {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  async updateSystemSettings(settings: Record<string, any>) {
    const response = await apiClient.put('/admin/settings', settings);
    return response.data;
  },

  // Subscription Management
  async getSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await apiClient.get(`/admin/subscriptions?${queryParams}`);
    return response.data;
  },

  async updateSubscription(subscriptionId: string, updates: {
    tier?: string;
    status?: string;
    endDate?: string;
    customFeatures?: string[];
  }) {
    const response = await apiClient.put(`/admin/subscriptions/${subscriptionId}`, updates);
    return response.data;
  },

  async extendSubscription(subscriptionId: string, days: number) {
    const response = await apiClient.post(`/admin/subscriptions/${subscriptionId}/extend`, {
      days
    });
    return response.data;
  },

  async cancelSubscription(subscriptionId: string, reason?: string) {
    const response = await apiClient.delete(`/admin/subscriptions/${subscriptionId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await apiClient.get(`/admin/audit-logs?${queryParams}`);
    return response.data;
  },

  // Bulk Operations
  async bulkUpdateUsers(userIds: string[], updates: {
    role?: string;
    status?: string;
    subscriptionTier?: string;
  }) {
    const response = await apiClient.put('/admin/users/bulk', {
      userIds,
      updates
    });
    return response.data;
  },

  async exportUsers(format: 'csv' | 'xlsx' = 'csv', filters?: Record<string, any>) {
    const response = await apiClient.post('/admin/users/export', {
      format,
      filters
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportAnalytics(period: string, format: 'csv' | 'xlsx' = 'csv') {
    const response = await apiClient.get(`/admin/analytics/export?period=${period}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};