import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Enhanced interfaces matching backend
export interface TargetingRules {
  pharmacies?: string[];
  userGroups?: string[];
  percentage?: number;
  conditions?: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    userAttributes?: Record<string, any>;
    workspaceAttributes?: Record<string, any>;
  };
}

export interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  usagePercentage: number;
  lastUsed: string;
  usageByPlan?: Array<{
    plan: string;
    userCount: number;
    percentage: number;
  }>;
  usageByWorkspace?: Array<{
    workspaceId: string;
    workspaceName: string;
    userCount: number;
  }>;
}

export interface EnhancedFeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  allowedTiers: string[];
  allowedRoles: string[];
  targetingRules?: TargetingRules;
  usageMetrics?: UsageMetrics;
  metadata?: {
    category?: string;
    priority?: string;
    tags?: string[];
    displayOrder?: number;
    marketingDescription?: string;
    isMarketingFeature?: boolean;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason: string;
  targetingApplied: boolean;
}

class EnhancedFeatureFlagService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Update targeting rules for a feature flag
   */
  async updateTargetingRules(featureId: string, targetingRules: TargetingRules): Promise<EnhancedFeatureFlag> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/feature-flags/${featureId}/targeting`,
        { targetingRules },
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update targeting rules');
      }
    } catch (error: any) {
      console.error('Error updating targeting rules:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update targeting rules'
      );
    }
  }

  /**
   * Get usage metrics for a feature flag
   */
  async getFeatureMetrics(featureId: string): Promise<UsageMetrics> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/feature-flags/${featureId}/metrics`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data.data.metrics;
      } else {
        throw new Error(response.data.message || 'Failed to fetch metrics');
      }
    } catch (error: any) {
      console.error('Error fetching feature metrics:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch feature metrics'
      );
    }
  }

  /**
   * Get marketing features for pricing display
   */
  async getMarketingFeatures(tier?: string): Promise<EnhancedFeatureFlag[]> {
    try {
      const params = tier ? { tier } : {};
      const response = await axios.get(
        `${API_BASE_URL}/feature-flags/public/marketing`,
        { params }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch marketing features');
      }
    } catch (error: any) {
      console.error('Error fetching marketing features:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch marketing features'
      );
    }
  }

  /**
   * Check advanced feature access for current user
   */
  async checkFeatureAccess(featureKey: string, workspaceId?: string): Promise<FeatureAccessResult> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/feature-flags/check-access`,
        { featureKey, workspaceId },
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to check feature access');
      }
    } catch (error: any) {
      console.error('Error checking feature access:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to check feature access'
      );
    }
  }

  /**
   * Get enhanced feature flags (with targeting and metrics)
   */
  async getEnhancedFeatureFlags(): Promise<EnhancedFeatureFlag[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/feature-flags`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch enhanced feature flags');
      }
    } catch (error: any) {
      console.error('Error fetching enhanced feature flags:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch enhanced feature flags'
      );
    }
  }

  /**
   * Update feature flag marketing settings
   */
  async updateMarketingSettings(
    featureId: string, 
    settings: {
      isMarketingFeature?: boolean;
      marketingDescription?: string;
      displayOrder?: number;
      icon?: string;
    }
  ): Promise<EnhancedFeatureFlag> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/feature-flags/${featureId}`,
        { 
          metadata: {
            ...settings
          }
        },
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update marketing settings');
      }
    } catch (error: any) {
      console.error('Error updating marketing settings:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update marketing settings'
      );
    }
  }
}

// Export singleton instance
const enhancedFeatureFlagService = new EnhancedFeatureFlagService();
export default enhancedFeatureFlagService;