import api from './api';

// Usage Monitoring Types
export interface UsageStats {
  workspaceId: string;
  workspaceName: string;
  period: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalPatients: number;
    totalMTRs: number;
    totalNotes: number;
    totalMedications: number;
    totalAssessments: number;
    storageUsed: number; // in MB
    apiCallsCount: number;
    lastUpdated: string;
  };
  usage: {
    usersByRole: {
      [role: string]: number;
    };
    featureUsage: {
      [feature: string]: {
        count: number;
        lastUsed: string;
      };
    };
    timeSpentByFeature: {
      [feature: string]: number; // in minutes
    };
  };
  limits: {
    maxUsers: number;
    maxPatients: number;
    maxStorage: number; // in MB
    maxApiCalls: number;
  };
  utilization: {
    users: number; // percentage
    patients: number; // percentage
    storage: number; // percentage
    apiCalls: number; // percentage
  };
}

export interface UsageAnalytics {
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{
    date: string;
    totalUsers: number;
    activeUsers: number;
    newPatients: number;
    completedMTRs: number;
    apiCalls: number;
    storageUsed: number;
    sessionDuration: number;
    errors: number;
  }>;
  trends: {
    userGrowth: number; // percentage
    patientGrowth: number; // percentage
    mtrGrowth: number; // percentage
    storageGrowth: number; // percentage
    apiGrowth: number; // percentage
  };
  topFeatures: Array<{
    feature: string;
    usageCount: number;
    growthRate: number;
  }>;
}

export interface UsageAlert {
  _id: string;
  type:
    | 'limit_approaching'
    | 'limit_exceeded'
    | 'unusual_activity'
    | 'performance_issue';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  percentage: number;
  timestamp: string;
  acknowledged: boolean;
  resolveAction?: string;
  estimatedTimeToLimit?: string;
}

export interface UsageComparison {
  currentPeriod: {
    start: string;
    end: string;
    metrics: Partial<UsageStats['metrics']>;
  };
  previousPeriod: {
    start: string;
    end: string;
    metrics: Partial<UsageStats['metrics']>;
  };
  changes: {
    [key: string]: {
      value: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
}

export interface UsageFilters {
  startDate?: string;
  endDate?: string;
  workspaceId?: string;
  feature?: string;
  metric?: string;
}

export interface UsageReportConfig {
  format: 'pdf' | 'csv' | 'json';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  includeAnalytics: boolean;
  includeAlerts: boolean;
  includeComparisons: boolean;
  workspaceIds?: string[];
}

class UsageMonitoringService {
  // Get current workspace usage statistics
  async getWorkspaceUsageStats(workspaceId?: string): Promise<UsageStats> {
    const url = workspaceId
      ? `/usage/stats?workspaceId=${workspaceId}`
      : '/usage/stats';
    const response = await api.get(url);
    return response.data;
  }

  // Get detailed usage analytics
  async getUsageAnalytics(
    filters: UsageFilters & {
      period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    } = {}
  ): Promise<UsageAnalytics> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/usage/analytics?${params}`);
    return response.data;
  }

  // Get usage alerts
  async getUsageAlerts(workspaceId?: string): Promise<UsageAlert[]> {
    const url = workspaceId
      ? `/usage/alerts?workspaceId=${workspaceId}`
      : '/usage/alerts';
    const response = await api.get(url);
    return response.data;
  }

  // Acknowledge usage alert
  async acknowledgeAlert(alertId: string, note?: string) {
    const response = await api.patch(`/usage/alerts/${alertId}/acknowledge`, {
      note,
    });
    return response.data;
  }

  // Recalculate usage statistics
  async recalculateUsageStats(workspaceId?: string) {
    const response = await api.post('/usage/recalculate', {
      workspaceId,
    });
    return response.data;
  }

  // Get usage comparison between periods
  async getUsageComparison(
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string,
    workspaceId?: string
  ): Promise<UsageComparison> {
    const params = new URLSearchParams({
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    });

    if (workspaceId) {
      params.append('workspaceId', workspaceId);
    }

    const response = await api.get(`/usage/comparison?${params}`);
    return response.data;
  }

  // Get usage by feature
  async getFeatureUsage(feature: string, filters: UsageFilters = {}) {
    const params = new URLSearchParams({ feature });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/usage/features?${params}`);
    return response.data;
  }

  // Get real-time usage metrics
  async getRealTimeUsage(workspaceId?: string) {
    const url = workspaceId
      ? `/usage/realtime?workspaceId=${workspaceId}`
      : '/usage/realtime';
    const response = await api.get(url);
    return response.data;
  }

  // Generate usage report
  async generateUsageReport(config: UsageReportConfig) {
    const response = await api.post('/usage/reports/generate', config, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get usage forecasting
  async getUsageForecast(
    metric: string,
    days: number = 30,
    workspaceId?: string
  ) {
    const params = new URLSearchParams({
      metric,
      days: days.toString(),
    });

    if (workspaceId) {
      params.append('workspaceId', workspaceId);
    }

    const response = await api.get(`/usage/forecast?${params}`);
    return response.data;
  }

  // Update usage limits
  async updateUsageLimits(
    workspaceId: string,
    limits: Partial<UsageStats['limits']>
  ) {
    const response = await api.patch(`/usage/limits/${workspaceId}`, limits);
    return response.data;
  }

  // Get workspace usage history
  async getUsageHistory(
    workspaceId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 30
  ) {
    const response = await api.get(
      `/usage/history/${workspaceId}?period=${period}&limit=${limit}`
    );
    return response.data;
  }

  // Export usage data
  async exportUsageData(format: 'csv' | 'json', filters: UsageFilters = {}) {
    const params = new URLSearchParams({ format });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/usage/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get usage quota information
  async getUsageQuota(workspaceId?: string) {
    const url = workspaceId
      ? `/usage/quota?workspaceId=${workspaceId}`
      : '/usage/quota';
    const response = await api.get(url);
    return response.data;
  }

  // Set usage alert thresholds
  async setAlertThresholds(
    workspaceId: string,
    thresholds: {
      [metric: string]: {
        warning: number; // percentage
        critical: number; // percentage
      };
    }
  ) {
    const response = await api.patch(`/usage/thresholds/${workspaceId}`, {
      thresholds,
    });
    return response.data;
  }
}

export const usageMonitoringService = new UsageMonitoringService();
