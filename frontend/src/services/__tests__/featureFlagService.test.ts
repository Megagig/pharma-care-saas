import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import featureFlagService, { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../featureFlagService';

// Mock axios
vi.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('featureFlagService', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((successHandler) => {
            // Store the success handler for testing
            mockAxiosInstance._requestInterceptor = successHandler;
            return 0;
          }),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create = vi.fn(() => mockAxiosInstance);
    mockedAxios.isAxiosError = vi.fn((error: any) => {
      return error && error.response !== undefined;
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeatureFlags', () => {
    it('should fetch all feature flags successfully', async () => {
      const mockFeatureFlags: FeatureFlag[] = [
        {
          _id: '1',
          name: 'Clinical Decision Support',
          key: 'clinical_decision_support',
          description: 'Enable clinical decision support features',
          isActive: true,
          allowedTiers: ['pro', 'enterprise'],
          allowedRoles: ['pharmacist', 'owner'],
          customRules: {},
          metadata: {
            category: 'clinical',
            priority: 'high',
            tags: ['clinical', 'decision-support'],
          },
          createdBy: 'admin-1',
          updatedBy: 'admin-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockFeatureFlags,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getFeatureFlags();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/feature-flags');
      expect(result).toEqual(mockFeatureFlags);
    });

    it('should throw error when API returns success: false', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Failed to fetch feature flags',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow(
        'Failed to fetch feature flags'
      );
    });

    it('should handle network errors', async () => {
      const networkError = {
        response: {
          data: {
            message: 'Network connection failed',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('should handle errors without response data', async () => {
      const networkError = {
        response: {},
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow(
        'Failed to fetch feature flags'
      );
    });

    it('should rethrow non-axios errors', async () => {
      const genericError = new Error('Generic error');

      mockAxiosInstance.get.mockRejectedValue(genericError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow('Generic error');
    });
  });

  describe('createFeatureFlag', () => {
    it('should create feature flag with correct payload', async () => {
      const createData: CreateFeatureFlagDto = {
        name: 'New Feature',
        key: 'new_feature',
        description: 'A new feature',
        isActive: true,
        allowedTiers: ['pro', 'enterprise'],
        allowedRoles: ['pharmacist'],
        customRules: {
          maxUsers: 100,
        },
        metadata: {
          category: 'clinical',
          priority: 'medium',
          tags: ['new'],
        },
      };

      const mockCreatedFeature: FeatureFlag = {
        _id: '2',
        ...createData,
        customRules: createData.customRules!,
        metadata: createData.metadata as FeatureFlag['metadata'],
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockCreatedFeature,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await featureFlagService.createFeatureFlag(createData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/feature-flags', createData);
      expect(result).toEqual(mockCreatedFeature);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateFeatureFlagDto = {
        name: 'New Feature',
        key: 'new_feature',
        description: 'A new feature',
      };

      const mockResponse = {
        data: {
          success: false,
          message: 'Feature key already exists',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await expect(featureFlagService.createFeatureFlag(createData)).rejects.toThrow(
        'Feature key already exists'
      );
    });

    it('should handle validation errors from API', async () => {
      const createData: CreateFeatureFlagDto = {
        name: '',
        key: 'invalid',
        description: '',
      };

      const validationError = {
        response: {
          data: {
            message: 'Validation failed: name is required',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(validationError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.createFeatureFlag(createData)).rejects.toThrow(
        'Validation failed: name is required'
      );
    });
  });

  describe('updateFeatureFlag', () => {
    it('should update feature flag with correct payload and ID', async () => {
      const featureId = 'feature-123';
      const updateData: UpdateFeatureFlagDto = {
        name: 'Updated Feature Name',
        description: 'Updated description',
        isActive: false,
        allowedTiers: ['enterprise'],
      };

      const mockUpdatedFeature: FeatureFlag = {
        _id: featureId,
        name: updateData.name!,
        key: 'existing_feature',
        description: updateData.description!,
        isActive: updateData.isActive!,
        allowedTiers: updateData.allowedTiers!,
        allowedRoles: ['pharmacist'],
        customRules: {},
        metadata: {
          category: 'clinical',
          priority: 'high',
          tags: [],
        },
        createdBy: 'admin-1',
        updatedBy: 'admin-2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockUpdatedFeature,
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await featureFlagService.updateFeatureFlag(featureId, updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/feature-flags/${featureId}`, updateData);
      expect(result).toEqual(mockUpdatedFeature);
    });

    it('should throw error when update fails', async () => {
      const featureId = 'feature-123';
      const updateData: UpdateFeatureFlagDto = {
        name: 'Updated Name',
      };

      const mockResponse = {
        data: {
          success: false,
          message: 'Feature flag not found',
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      await expect(
        featureFlagService.updateFeatureFlag(featureId, updateData)
      ).rejects.toThrow('Feature flag not found');
    });

    it('should handle network errors during update', async () => {
      const featureId = 'feature-123';
      const updateData: UpdateFeatureFlagDto = {
        isActive: false,
      };

      const networkError = {
        response: {
          data: {
            message: 'Server error',
          },
        },
      };

      mockAxiosInstance.put.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        featureFlagService.updateFeatureFlag(featureId, updateData)
      ).rejects.toThrow('Server error');
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should send DELETE request with correct ID', async () => {
      const featureId = 'feature-123';

      const mockResponse = {
        data: {
          success: true,
          message: 'Feature flag deleted successfully',
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await featureFlagService.deleteFeatureFlag(featureId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/feature-flags/${featureId}`);
    });

    it('should throw error when deletion fails', async () => {
      const featureId = 'feature-123';

      const mockResponse = {
        data: {
          success: false,
          message: 'Cannot delete feature flag in use',
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await expect(featureFlagService.deleteFeatureFlag(featureId)).rejects.toThrow(
        'Cannot delete feature flag in use'
      );
    });

    it('should handle 404 errors during deletion', async () => {
      const featureId = 'non-existent';

      const notFoundError = {
        response: {
          data: {
            message: 'Feature flag not found',
          },
        },
      };

      mockAxiosInstance.delete.mockRejectedValue(notFoundError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.deleteFeatureFlag(featureId)).rejects.toThrow(
        'Feature flag not found'
      );
    });

    it('should handle authorization errors', async () => {
      const featureId = 'feature-123';

      const authError = {
        response: {
          data: {
            message: 'Unauthorized: Super admin access required',
          },
        },
      };

      mockAxiosInstance.delete.mockRejectedValue(authError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.deleteFeatureFlag(featureId)).rejects.toThrow(
        'Unauthorized: Super admin access required'
      );
    });
  });

  describe('getFeaturesByTier', () => {
    it('should fetch features for specific tier', async () => {
      const tier = 'pro';
      const mockFeatures: FeatureFlag[] = [
        {
          _id: '1',
          name: 'Pro Feature',
          key: 'pro_feature',
          description: 'Feature for pro tier',
          isActive: true,
          allowedTiers: ['pro', 'enterprise'],
          allowedRoles: ['pharmacist'],
          customRules: {},
          metadata: {
            category: 'clinical',
            priority: 'high',
            tags: [],
          },
          createdBy: 'admin-1',
          updatedBy: 'admin-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockFeatures,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getFeaturesByTier(tier);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/feature-flags/tier/${tier}`);
      expect(result).toEqual(mockFeatures);
    });

    it('should throw error for invalid tier', async () => {
      const tier = 'invalid_tier';

      const mockResponse = {
        data: {
          success: false,
          message: 'Invalid tier: invalid_tier',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(featureFlagService.getFeaturesByTier(tier)).rejects.toThrow(
        'Invalid tier: invalid_tier'
      );
    });

    it('should handle network errors when fetching by tier', async () => {
      const tier = 'enterprise';

      const networkError = {
        response: {
          data: {
            message: 'Connection timeout',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.getFeaturesByTier(tier)).rejects.toThrow(
        'Connection timeout'
      );
    });
  });

  describe('updateTierFeatures', () => {
    it('should send correct bulk add operation payload', async () => {
      const tier = 'pro';
      const featureKeys = ['feature_1', 'feature_2', 'feature_3'];
      const action = 'add';

      const mockResponse = {
        data: {
          success: true,
          message: '3 features added to pro tier',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await featureFlagService.updateTierFeatures(tier, featureKeys, action);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/feature-flags/tier/${tier}/features`,
        {
          featureKeys,
          action,
        }
      );
    });

    it('should send correct bulk remove operation payload', async () => {
      const tier = 'basic';
      const featureKeys = ['feature_1'];
      const action = 'remove';

      const mockResponse = {
        data: {
          success: true,
          message: '1 feature removed from basic tier',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await featureFlagService.updateTierFeatures(tier, featureKeys, action);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/feature-flags/tier/${tier}/features`,
        {
          featureKeys,
          action,
        }
      );
    });

    it('should throw error when bulk operation fails', async () => {
      const tier = 'enterprise';
      const featureKeys = ['invalid_feature'];
      const action = 'add';

      const mockResponse = {
        data: {
          success: false,
          message: 'Feature keys not found: invalid_feature',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await expect(
        featureFlagService.updateTierFeatures(tier, featureKeys, action)
      ).rejects.toThrow('Feature keys not found: invalid_feature');
    });

    it('should handle validation errors for bulk operations', async () => {
      const tier = 'pro';
      const featureKeys: string[] = [];
      const action = 'add';

      const validationError = {
        response: {
          data: {
            message: 'featureKeys array cannot be empty',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(validationError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        featureFlagService.updateTierFeatures(tier, featureKeys, action)
      ).rejects.toThrow('featureKeys array cannot be empty');
    });

    it('should handle authorization errors for bulk operations', async () => {
      const tier = 'enterprise';
      const featureKeys = ['feature_1'];
      const action = 'remove';

      const authError = {
        response: {
          data: {
            message: 'Super admin access required',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(authError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        featureFlagService.updateTierFeatures(tier, featureKeys, action)
      ).rejects.toThrow('Super admin access required');
    });

    it('should handle network failures during bulk operations', async () => {
      const tier = 'pro';
      const featureKeys = ['feature_1', 'feature_2'];
      const action = 'add';

      const networkError = new Error('Network request failed');

      mockAxiosInstance.post.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(
        featureFlagService.updateTierFeatures(tier, featureKeys, action)
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('getAllFeatureFlags (alias)', () => {
    it('should return full response object', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          count: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getAllFeatureFlags();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/feature-flags');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getFeatureFlagById', () => {
    it('should fetch single feature flag by ID', async () => {
      const featureId = 'feature-123';
      const mockResponse = {
        data: {
          success: true,
          data: {
            _id: featureId,
            name: 'Test Feature',
            key: 'test_feature',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getFeatureFlagById(featureId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/feature-flags/${featureId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getFeatureFlagsByCategory', () => {
    it('should fetch feature flags by category', async () => {
      const category = 'clinical';
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getFeatureFlagsByCategory(category);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/feature-flags/category/${category}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getFeatureFlagsByTier (alias)', () => {
    it('should return full response object', async () => {
      const tier = 'pro';
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await featureFlagService.getFeatureFlagsByTier(tier);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/feature-flags/tier/${tier}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('toggleFeatureFlagStatus', () => {
    it('should toggle feature flag status', async () => {
      const featureId = 'feature-123';
      const mockResponse = {
        data: {
          success: true,
          data: {
            _id: featureId,
            isActive: false,
          },
        },
      };

      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await featureFlagService.toggleFeatureFlagStatus(featureId);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(`/feature-flags/${featureId}/toggle`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('axios instance configuration', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should configure request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should set withCredentials in request interceptor', () => {
      const config = { withCredentials: false };
      const interceptor = mockAxiosInstance._requestInterceptor;
      
      if (interceptor) {
        const result = interceptor(config);
        expect(result.withCredentials).toBe(true);
      }
    });
  });

  describe('error message handling', () => {
    it('should use custom error message when provided', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Custom error message',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow(
        'Custom error message'
      );
    });

    it('should use default error message when not provided', async () => {
      const mockResponse = {
        data: {
          success: false,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(featureFlagService.getFeatureFlags()).rejects.toThrow(
        'Failed to fetch feature flags'
      );
    });

    it('should handle axios errors with response data message', async () => {
      const axiosError = {
        response: {
          data: {
            message: 'Detailed error from server',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        featureFlagService.createFeatureFlag({
          name: 'Test',
          key: 'test',
          description: 'Test',
        })
      ).rejects.toThrow('Detailed error from server');
    });

    it('should handle axios errors without response data message', async () => {
      const axiosError = {
        response: {
          data: {},
        },
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(featureFlagService.deleteFeatureFlag('test-id')).rejects.toThrow(
        'Failed to delete feature flag'
      );
    });
  });
});
