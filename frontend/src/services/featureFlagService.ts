import axios from 'axios';

// Create API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://PharmaPilot-nttq.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Ensure credentials are included for httpOnly cookies
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

export interface FeatureFlag {
  _id: string;
  name: string;
  key: string;
  description: string;
  isActive: boolean;
  allowedTiers: string[];
  allowedRoles: string[];
  customRules: {
    maxUsers?: number;
    requiredLicense?: boolean;
    customLogic?: string;
    [key: string]: unknown;
  };
  metadata: {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    [key: string]: unknown;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureFlagDto {
  name: string;
  key: string;
  description: string;
  isActive?: boolean;
  allowedTiers?: string[];
  allowedRoles?: string[];
  customRules?: {
    maxUsers?: number;
    requiredLicense?: boolean;
    customLogic?: string;
    [key: string]: unknown;
  };
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface UpdateFeatureFlagDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  allowedTiers?: string[];
  allowedRoles?: string[];
  customRules?: {
    maxUsers?: number;
    requiredLicense?: boolean;
    customLogic?: string;
    [key: string]: unknown;
  };
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface FeatureFlagResponse {
  success: boolean;
  message?: string;
  data: FeatureFlag | FeatureFlag[];
  count?: number;
}

// Feature Flag API Service
const featureFlagService = {
  getAllFeatureFlags: async (): Promise<FeatureFlagResponse> => {
    const response = await api.get('/feature-flags');
    return response.data;
  },

  getFeatureFlagById: async (id: string): Promise<FeatureFlagResponse> => {
    const response = await api.get(`/feature-flags/${id}`);
    return response.data;
  },

  getFeatureFlagsByCategory: async (
    category: string
  ): Promise<FeatureFlagResponse> => {
    const response = await api.get(`/feature-flags/category/${category}`);
    return response.data;
  },

  getFeatureFlagsByTier: async (tier: string): Promise<FeatureFlagResponse> => {
    const response = await api.get(`/feature-flags/tier/${tier}`);
    return response.data;
  },

  createFeatureFlag: async (
    data: CreateFeatureFlagDto
  ): Promise<FeatureFlagResponse> => {
    const response = await api.post('/feature-flags', data);
    return response.data;
  },

  updateFeatureFlag: async (
    id: string,
    data: UpdateFeatureFlagDto
  ): Promise<FeatureFlagResponse> => {
    const response = await api.put(`/feature-flags/${id}`, data);
    return response.data;
  },

  toggleFeatureFlagStatus: async (id: string): Promise<FeatureFlagResponse> => {
    const response = await api.patch(`/feature-flags/${id}/toggle`);
    return response.data;
  },

  deleteFeatureFlag: async (id: string): Promise<FeatureFlagResponse> => {
    const response = await api.delete(`/feature-flags/${id}`);
    return response.data;
  },
};

export default featureFlagService;
