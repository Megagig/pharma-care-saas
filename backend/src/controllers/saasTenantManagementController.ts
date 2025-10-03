import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { tenantManagementService, TenantProvisioningData, TenantStatusUpdate, TenantFilters, TenantListOptions, TenantBrandingUpdate, TenantLimitsUpdate, TenantCustomizationUpdate } from '../services/TenantManagementService';
import logger from '../utils/logger';
import { validateObjectId } from '../utils/validation';

export class SaasTenantManagementController {
  /**
   * Provision a new tenant workspace
   */
  async provisionTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Validate required fields
      const {
        name,
        type,
        contactInfo,
        primaryContact,
        subscriptionPlanId,
        settings,
        features,
        limits,
      } = req.body;

      if (!name || !type || !contactInfo || !primaryContact || !subscriptionPlanId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: name, type, contactInfo, primaryContact, subscriptionPlanId',
          },
        });
        return;
      }

      // Validate subscription plan ID
      if (!validateObjectId(subscriptionPlanId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription plan ID',
          },
        });
        return;
      }

      const tenantData: TenantProvisioningData = {
        name,
        type,
        contactInfo,
        primaryContact,
        subscriptionPlanId,
        settings,
        features,
        limits,
      };

      const tenant = await tenantManagementService.provisionTenant(tenantData, adminId);

      res.status(201).json({
        success: true,
        data: {
          tenant,
          message: 'Tenant provisioned successfully',
        },
      });
    } catch (error) {
      logger.error('Error provisioning tenant:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_PROVISIONING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to provision tenant',
        },
      });
    }
  }

  /**
   * Deprovision a tenant workspace
   */
  async deprovisionTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const { deleteData = false, reason, transferDataTo } = req.body;

      await tenantManagementService.deprovisionTenant(tenantId, adminId, {
        deleteData,
        reason,
        transferDataTo,
      });

      res.json({
        success: true,
        data: {
          message: 'Tenant deprovisioned successfully',
        },
      });
    } catch (error) {
      logger.error('Error deprovisioning tenant:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_DEPROVISIONING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to deprovision tenant',
        },
      });
    }
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const { status, reason, suspensionDetails } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status is required',
          },
        });
        return;
      }

      const validStatuses = ['active', 'suspended', 'pending', 'trial', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
        });
        return;
      }

      const statusUpdate: TenantStatusUpdate = {
        status,
        reason,
        suspensionDetails,
      };

      const updatedTenant = await tenantManagementService.updateTenantStatus(
        tenantId,
        statusUpdate,
        adminId
      );

      res.json({
        success: true,
        data: {
          tenant: updatedTenant,
          message: 'Tenant status updated successfully',
        },
      });
    } catch (error) {
      logger.error('Error updating tenant status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_STATUS_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant status',
        },
      });
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const { includeSettings, includeUsers, includeUsage } = req.query;

      const tenant = await tenantManagementService.getTenantById(tenantId, {
        includeSettings: includeSettings === 'true',
        includeUsers: includeUsers === 'true',
        includeUsage: includeUsage === 'true',
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          tenant,
        },
      });
    } catch (error) {
      logger.error('Error getting tenant by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch tenant',
        },
      });
    }
  }

  /**
   * List tenants with filtering and pagination
   */
  async listTenants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        status,
        type,
        subscriptionStatus,
        search,
        tags,
        createdAfter,
        createdBefore,
        lastActivityAfter,
        lastActivityBefore,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeUsage,
        includeSettings,
      } = req.query;

      // Parse filters
      const filters: TenantFilters = {};

      if (status) {
        filters.status = Array.isArray(status) ? status as string[] : [status as string];
      }

      if (type) {
        filters.type = Array.isArray(type) ? type as string[] : [type as string];
      }

      if (subscriptionStatus) {
        filters.subscriptionStatus = Array.isArray(subscriptionStatus)
          ? subscriptionStatus as string[]
          : [subscriptionStatus as string];
      }

      if (search) {
        filters.search = search as string;
      }

      if (tags) {
        filters.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      }

      if (createdAfter) {
        filters.createdAfter = new Date(createdAfter as string);
      }

      if (createdBefore) {
        filters.createdBefore = new Date(createdBefore as string);
      }

      if (lastActivityAfter) {
        filters.lastActivityAfter = new Date(lastActivityAfter as string);
      }

      if (lastActivityBefore) {
        filters.lastActivityBefore = new Date(lastActivityBefore as string);
      }

      // Parse options
      const options: TenantListOptions = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeUsage: includeUsage === 'true',
        includeSettings: includeSettings === 'true',
      };

      // Validate pagination
      if (options.page < 1) options.page = 1;
      if (options.limit < 1 || options.limit > 100) options.limit = 20;

      const result = await tenantManagementService.listTenants(filters, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error listing tenants:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_LIST_FAILED',
          message: error instanceof Error ? error.message : 'Failed to list tenants',
        },
      });
    }
  }

  /**
   * Update tenant usage metrics
   */
  async updateTenantUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const { currentUsers, currentPatients, storageUsed, apiCallsThisMonth } = req.body;

      const updatedTenant = await tenantManagementService.updateTenantUsage(tenantId, {
        currentUsers,
        currentPatients,
        storageUsed,
        apiCallsThisMonth,
      });

      res.json({
        success: true,
        data: {
          tenant: updatedTenant,
          message: 'Tenant usage updated successfully',
        },
      });
    } catch (error) {
      logger.error('Error updating tenant usage:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_USAGE_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant usage',
        },
      });
    }
  }

  /**
   * Validate data isolation for a tenant
   */
  async validateDataIsolation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const result = await tenantManagementService.validateDataIsolation(tenantId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error validating data isolation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATA_ISOLATION_VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to validate data isolation',
        },
      });
    }
  }

  /**
   * Enforce data isolation for a tenant
   */
  async enforceDataIsolation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { tenantId } = req.params;
      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const result = await tenantManagementService.enforceDataIsolation(tenantId);

      res.json({
        success: true,
        data: {
          ...result,
          message: 'Data isolation enforcement completed',
        },
      });
    } catch (error) {
      logger.error('Error enforcing data isolation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATA_ISOLATION_ENFORCEMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to enforce data isolation',
        },
      });
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const statistics = await tenantManagementService.getTenantStatistics();

      res.json({
        success: true,
        data: {
          statistics,
        },
      });
    } catch (error) {
      logger.error('Error getting tenant statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_STATISTICS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get tenant statistics',
        },
      });
    }
  }

  /**
   * Update tenant branding
   * PUT /api/admin/saas/tenants/:tenantId/branding
   */
  async updateTenantBranding(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const brandingUpdate: TenantBrandingUpdate = req.body;
      const tenant = await tenantManagementService.updateTenantBranding(tenantId, brandingUpdate, adminId);

      res.json({
        success: true,
        data: { tenant },
      });
    } catch (error) {
      logger.error('Error updating tenant branding:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BRANDING_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant branding',
        },
      });
    }
  }

  /**
   * Update tenant limits
   * PUT /api/admin/saas/tenants/:tenantId/limits
   */
  async updateTenantLimits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const limitsUpdate: TenantLimitsUpdate = req.body;
      const tenant = await tenantManagementService.updateTenantLimits(tenantId, limitsUpdate, adminId);

      res.json({
        success: true,
        data: { tenant },
      });
    } catch (error) {
      logger.error('Error updating tenant limits:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LIMITS_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant limits',
        },
      });
    }
  }

  /**
   * Update tenant features
   * PUT /api/admin/saas/tenants/:tenantId/features
   */
  async updateTenantFeatures(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { features } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      if (!Array.isArray(features)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Features must be an array',
          },
        });
        return;
      }

      const tenant = await tenantManagementService.updateTenantFeatures(tenantId, features, adminId);

      res.json({
        success: true,
        data: { tenant },
      });
    } catch (error) {
      logger.error('Error updating tenant features:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FEATURES_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant features',
        },
      });
    }
  }

  /**
   * Update tenant customization
   * PUT /api/admin/saas/tenants/:tenantId/customization
   */
  async updateTenantCustomization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const customizationUpdate: TenantCustomizationUpdate = req.body;
      const tenant = await tenantManagementService.updateTenantCustomization(tenantId, customizationUpdate, adminId);

      res.json({
        success: true,
        data: { tenant },
      });
    } catch (error) {
      logger.error('Error updating tenant customization:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMIZATION_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tenant customization',
        },
      });
    }
  }

  /**
   * Get tenant customization
   * GET /api/admin/saas/tenants/:tenantId/customization
   */
  async getTenantCustomization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!validateObjectId(tenantId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID',
          },
        });
        return;
      }

      const tenant = await tenantManagementService.getTenantById(tenantId);

      res.json({
        success: true,
        data: {
          customization: {
            branding: tenant.branding,
            settings: tenant.settings,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting tenant customization:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMIZATION_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get tenant customization',
        },
      });
    }
  }
}

export const saasTenantManagementController = new SaasTenantManagementController();
