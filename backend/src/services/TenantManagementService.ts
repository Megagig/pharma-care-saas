import mongoose from 'mongoose';
import { Tenant, ITenant } from '../models/Tenant';
import { TenantSettings, ITenantSettings } from '../models/TenantSettings';
import User, { IUser } from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';
import logger from '../utils/logger';
import { SecurityAuditLog } from '../models/SecurityAuditLog';

export interface TenantProvisioningData {
  name: string;
  type: 'pharmacy' | 'clinic' | 'hospital' | 'chain';
  contactInfo: {
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    website?: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  subscriptionPlanId: string;
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
  };
  features?: string[];
  limits?: {
    maxUsers?: number;
    maxPatients?: number;
    storageLimit?: number;
    apiCallsPerMonth?: number;
  };
}

export interface TenantStatusUpdate {
  status: 'active' | 'suspended' | 'pending' | 'trial' | 'cancelled';
  reason?: string;
  suspensionDetails?: {
    reason: string;
    suspendedBy: string;
    suspendedAt: Date;
    autoReactivateAt?: Date;
  };
}

export interface TenantUsageUpdate {
  currentUsers?: number;
  currentPatients?: number;
  storageUsed?: number;
  apiCallsThisMonth?: number;
}

export interface TenantFilters {
  status?: string[];
  type?: string[];
  subscriptionStatus?: string[];
  search?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  lastActivityAfter?: Date;
  lastActivityBefore?: Date;
}

export interface TenantListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeUsage?: boolean;
  includeSettings?: boolean;
}

export interface TenantBrandingUpdate {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export interface TenantLimitsUpdate {
  maxUsers?: number;
  maxPatients?: number;
  storageLimit?: number;
  apiCallsPerMonth?: number;
  maxWorkspaces?: number;
  maxIntegrations?: number;
}

export interface TenantCustomizationUpdate {
  branding?: TenantBrandingUpdate;
  limits?: TenantLimitsUpdate;
  features?: string[];
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
  };
}

export class TenantManagementService {
  /**
   * Provision a new tenant workspace
   */
  async provisionTenant(
    tenantData: TenantProvisioningData,
    adminId: string
  ): Promise<ITenant> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate subscription plan exists
      const subscriptionPlan = await SubscriptionPlan.findById(tenantData.subscriptionPlanId);
      if (!subscriptionPlan) {
        throw new Error('Invalid subscription plan');
      }

      // Check if primary contact user exists
      let primaryContactUser = await User.findOne({ email: tenantData.primaryContact.email });
      
      // Create user if doesn't exist
      if (!primaryContactUser) {
        primaryContactUser = await User.create({
          firstName: tenantData.primaryContact.firstName,
          lastName: tenantData.primaryContact.lastName,
          email: tenantData.primaryContact.email,
          phone: tenantData.primaryContact.phone,
          role: 'pharmacist',
          status: 'active',
          passwordHash: 'temporary', // This should be set properly in real implementation
          emailVerified: false,
          licenseStatus: 'not_required',
          currentPlanId: new mongoose.Types.ObjectId(tenantData.subscriptionPlanId),
        });
      }

      // Generate unique slug
      const baseSlug = tenantData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      let slug = baseSlug;
      let counter = 1;
      while (await Tenant.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create tenant
      const tenant = await Tenant.create({
        name: tenantData.name,
        slug,
        type: tenantData.type,
        status: 'pending',
        subscriptionPlan: subscriptionPlan._id,
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        billingCycle: 'monthly',
        contactInfo: tenantData.contactInfo,
        primaryContact: {
          userId: primaryContactUser._id,
          firstName: tenantData.primaryContact.firstName,
          lastName: tenantData.primaryContact.lastName,
          email: tenantData.primaryContact.email,
          phone: tenantData.primaryContact.phone,
        },
        settings: {
          timezone: tenantData.settings?.timezone || 'UTC',
          currency: tenantData.settings?.currency || 'USD',
          language: tenantData.settings?.language || 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
        },
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
        },
        limits: {
          maxUsers: tenantData.limits?.maxUsers || subscriptionPlan.features.teamSize || 10,
          maxPatients: tenantData.limits?.maxPatients || subscriptionPlan.features.patientLimit || 1000,
          storageLimit: tenantData.limits?.storageLimit || 5000,
          apiCallsPerMonth: tenantData.limits?.apiCallsPerMonth || 10000,
          maxWorkspaces: 1,
          maxIntegrations: 5,
        },
        features: tenantData.features || [],
        integrations: [],
        usageMetrics: {
          currentUsers: 1, // Primary contact user
          currentPatients: 0,
          storageUsed: 0,
          apiCallsThisMonth: 0,
          lastCalculatedAt: new Date(),
        },
        complianceSettings: {
          dataRetentionDays: 2555, // 7 years
          auditLogsEnabled: true,
          encryptionEnabled: true,
          backupEnabled: true,
          gdprCompliant: true,
        },
        billingInfo: {
          outstandingBalance: 0,
        },
        metadata: {},
        tags: [],
        createdBy: new mongoose.Types.ObjectId(adminId),
        lastModifiedBy: new mongoose.Types.ObjectId(adminId),
        lastActivity: new Date(),
      });

      // Create default tenant settings
      await (TenantSettings as any).createDefaultSettings(
        tenant._id,
        tenant.name,
        new mongoose.Types.ObjectId(adminId)
      );

      // Update user's workspace
      await User.findByIdAndUpdate(primaryContactUser._id, {
        workplaceId: tenant._id,
      });

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_provisioned',
        resource: 'tenant',
        resourceId: tenant._id,
        ipAddress: '127.0.0.1',
        userAgent: 'TenantManagementService',
        success: true,
        severity: 'medium',
        category: 'tenant_management',
        details: {
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          tenantType: tenant.type,
        },
      });
      
      logger.info(`Audit: Tenant provisioned by ${adminId} - ${tenant.name}`);

      await session.commitTransaction();
      
      logger.info(`Tenant provisioned successfully: ${tenant.name} (${tenant.slug})`);
      
      return tenant;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error provisioning tenant:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Deprovision a tenant workspace
   */
  async deprovisionTenant(
    tenantId: string,
    adminId: string,
    options: {
      deleteData?: boolean;
      reason?: string;
      transferDataTo?: string;
    } = {}
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if tenant can be deprovisioned
      if (tenant.status === 'active' && tenant.subscriptionStatus === 'active') {
        throw new Error('Cannot deprovision active tenant with active subscription');
      }

      // Update tenant status
      tenant.status = 'cancelled';
      tenant.subscriptionStatus = 'cancelled';
      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.metadata.deprovisionedAt = new Date();
      tenant.metadata.deprovisionedBy = adminId;
      tenant.metadata.deprovisionReason = options.reason || 'Manual deprovisioning';

      if (options.deleteData) {
        // Mark for data deletion (actual deletion should be handled by a background job)
        tenant.metadata.scheduleDataDeletion = true;
        tenant.metadata.dataDeletionScheduledAt = new Date();
      }

      await tenant.save();

      // Deactivate tenant settings
      await TenantSettings.findOneAndUpdate(
        { tenantId: tenant._id },
        { 
          isActive: false,
          lastModifiedBy: new mongoose.Types.ObjectId(adminId),
        }
      );

      // Deactivate all users in the tenant
      await User.updateMany(
        { workplaceId: tenant._id },
        { 
          status: 'suspended',
          lastModifiedBy: new mongoose.Types.ObjectId(adminId),
        }
      );

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_deprovisioned',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'high',
        details: {
          tenantName: tenant.name,
          reason: options.reason,
          deleteData: options.deleteData,
          transferDataTo: options.transferDataTo,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      await session.commitTransaction();
      
      logger.info(`Tenant deprovisioned: ${tenant.name} (${tenant.slug})`);
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error deprovisioning tenant:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(
    tenantId: string,
    statusUpdate: TenantStatusUpdate,
    adminId: string
  ): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const previousStatus = tenant.status;
      tenant.status = statusUpdate.status;
      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.lastActivity = new Date();

      // Handle suspension
      if (statusUpdate.status === 'suspended') {
        tenant.metadata.suspensionReason = statusUpdate.reason;
        tenant.metadata.suspendedAt = new Date();
        tenant.metadata.suspendedBy = adminId;
        
        if (statusUpdate.suspensionDetails?.autoReactivateAt) {
          tenant.metadata.autoReactivateAt = statusUpdate.suspensionDetails.autoReactivateAt;
        }

        // Deactivate all users in the tenant
        await User.updateMany(
          { workplaceId: tenant._id },
          { status: 'suspended' }
        );
      }

      // Handle reactivation
      if (statusUpdate.status === 'active' && previousStatus === 'suspended') {
        delete tenant.metadata.suspensionReason;
        delete tenant.metadata.suspendedAt;
        delete tenant.metadata.suspendedBy;
        delete tenant.metadata.autoReactivateAt;

        // Reactivate all users in the tenant
        await User.updateMany(
          { workplaceId: tenant._id },
          { status: 'active' }
        );
      }

      await tenant.save();

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_status_updated',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'medium',
        details: {
          tenantName: tenant.name,
          previousStatus,
          newStatus: statusUpdate.status,
          reason: statusUpdate.reason,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      logger.info(`Tenant status updated: ${tenant.name} (${previousStatus} -> ${statusUpdate.status})`);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant status:', error);
      throw error;
    }
  }

  /**
   * Get tenant by ID with optional population
   */
  async getTenantById(
    tenantId: string,
    options: {
      includeSettings?: boolean;
      includeUsers?: boolean;
      includeUsage?: boolean;
    } = {}
  ): Promise<ITenant | null> {
    try {
      let query = Tenant.findById(tenantId);

      // Note: Settings are stored in a separate collection, not as a reference

      const tenant = await query.exec();
      
      if (!tenant) {
        return null;
      }

      // Include additional data if requested
      if (options.includeUsers) {
        const users = await User.find({ workplaceId: tenant._id }).select('firstName lastName email role status');
        (tenant as any).users = users;
      }

      if (options.includeUsage) {
        // Calculate real-time usage metrics
        const [userCount, patientCount] = await Promise.all([
          User.countDocuments({ workplaceId: tenant._id, status: 'active' }),
          // Add patient count query when Patient model is available
          Promise.resolve(tenant.usageMetrics.currentPatients),
        ]);

        tenant.usageMetrics.currentUsers = userCount;
        // tenant.usageMetrics.currentPatients = patientCount;
      }

      return tenant;
    } catch (error) {
      logger.error('Error getting tenant by ID:', error);
      throw error;
    }
  }

  /**
   * List tenants with filtering and pagination
   */
  async listTenants(
    filters: TenantFilters = {},
    options: TenantListOptions = {}
  ): Promise<{
    tenants: ITenant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeUsage = false,
        includeSettings = false,
      } = options;

      // Build query
      const query: any = {};

      if (filters.status?.length) {
        query.status = { $in: filters.status };
      }

      if (filters.type?.length) {
        query.type = { $in: filters.type };
      }

      if (filters.subscriptionStatus?.length) {
        query.subscriptionStatus = { $in: filters.subscriptionStatus };
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { slug: { $regex: filters.search, $options: 'i' } },
          { 'contactInfo.email': { $regex: filters.search, $options: 'i' } },
          { 'primaryContact.email': { $regex: filters.search, $options: 'i' } },
        ];
      }

      if (filters.tags?.length) {
        query.tags = { $in: filters.tags };
      }

      if (filters.createdAfter || filters.createdBefore) {
        query.createdAt = {};
        if (filters.createdAfter) {
          query.createdAt.$gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
          query.createdAt.$lte = filters.createdBefore;
        }
      }

      if (filters.lastActivityAfter || filters.lastActivityBefore) {
        query.lastActivity = {};
        if (filters.lastActivityAfter) {
          query.lastActivity.$gte = filters.lastActivityAfter;
        }
        if (filters.lastActivityBefore) {
          query.lastActivity.$lte = filters.lastActivityBefore;
        }
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      let tenantQuery = Tenant.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      // Note: Settings are stored in a separate collection, not as a reference

      const [tenants, total] = await Promise.all([
        tenantQuery.exec(),
        Tenant.countDocuments(query),
      ]);

      // Include usage data if requested
      if (includeUsage) {
        for (const tenant of tenants) {
          const userCount = await User.countDocuments({ 
            workplaceId: tenant._id, 
            status: 'active' 
          });
          tenant.usageMetrics.currentUsers = userCount;
        }
      }

      return {
        tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error listing tenants:', error);
      throw error;
    }
  }

  /**
   * Update tenant usage metrics
   */
  async updateTenantUsage(
    tenantId: string,
    usageUpdate: TenantUsageUpdate
  ): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update usage metrics
      if (usageUpdate.currentUsers !== undefined) {
        tenant.usageMetrics.currentUsers = usageUpdate.currentUsers;
      }
      if (usageUpdate.currentPatients !== undefined) {
        tenant.usageMetrics.currentPatients = usageUpdate.currentPatients;
      }
      if (usageUpdate.storageUsed !== undefined) {
        tenant.usageMetrics.storageUsed = usageUpdate.storageUsed;
      }
      if (usageUpdate.apiCallsThisMonth !== undefined) {
        tenant.usageMetrics.apiCallsThisMonth = usageUpdate.apiCallsThisMonth;
      }

      tenant.usageMetrics.lastCalculatedAt = new Date();
      tenant.lastActivity = new Date();

      await tenant.save();

      logger.info(`Tenant usage updated: ${tenant.name}`);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant usage:', error);
      throw error;
    }
  }

  /**
   * Check data isolation for a tenant
   */
  async validateDataIsolation(tenantId: string): Promise<{
    isIsolated: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    try {
      const violations: string[] = [];
      const recommendations: string[] = [];

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check user isolation
      const usersWithoutWorkspace = await User.find({
        $or: [
          { workplaceId: { $exists: false } },
          { workplaceId: null },
        ],
      });

      if (usersWithoutWorkspace.length > 0) {
        violations.push(`${usersWithoutWorkspace.length} users found without workspace assignment`);
        recommendations.push('Assign all users to appropriate workspaces');
      }

      // Check cross-tenant data access
      const usersInMultipleWorkspaces = await User.aggregate([
        { $match: { workspaces: { $exists: true, $ne: [] } } },
        { $project: { workspaceCount: { $size: '$workspaces' } } },
        { $match: { workspaceCount: { $gt: 1 } } },
      ]);

      if (usersInMultipleWorkspaces.length > 0) {
        violations.push(`${usersInMultipleWorkspaces.length} users have access to multiple workspaces`);
        recommendations.push('Review and restrict cross-workspace access');
      }

      // Check tenant settings isolation
      const settingsCount = await TenantSettings.countDocuments({ tenantId });
      if (settingsCount === 0) {
        violations.push('No tenant settings found');
        recommendations.push('Create default tenant settings');
      } else if (settingsCount > 1) {
        violations.push('Multiple tenant settings found');
        recommendations.push('Consolidate tenant settings to single document');
      }

      return {
        isIsolated: violations.length === 0,
        violations,
        recommendations,
      };
    } catch (error) {
      logger.error('Error validating data isolation:', error);
      throw error;
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStatistics(): Promise<{
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    tenantsByType: Record<string, number>;
    tenantsByStatus: Record<string, number>;
    averageUsersPerTenant: number;
    tenantsExceedingLimits: number;
  }> {
    try {
      const [
        totalStats,
        typeStats,
        statusStats,
        usageStats,
        limitsViolations,
      ] = await Promise.all([
        Tenant.aggregate([
          {
            $group: {
              _id: null,
              totalTenants: { $sum: 1 },
              activeTenants: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
              trialTenants: { $sum: { $cond: [{ $eq: ['$subscriptionStatus', 'trialing'] }, 1, 0] } },
              suspendedTenants: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
              totalUsers: { $sum: '$usageMetrics.currentUsers' },
            },
          },
        ]),
        Tenant.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Tenant.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Tenant.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: '$usageMetrics.currentUsers' },
              totalTenants: { $sum: 1 },
            },
          },
        ]),
        Tenant.countDocuments({
          $or: [
            { $expr: { $gt: ['$usageMetrics.currentUsers', '$limits.maxUsers'] } },
            { $expr: { $gt: ['$usageMetrics.currentPatients', '$limits.maxPatients'] } },
            { $expr: { $gt: ['$usageMetrics.storageUsed', '$limits.storageLimit'] } },
            { $expr: { $gt: ['$usageMetrics.apiCallsThisMonth', '$limits.apiCallsPerMonth'] } },
          ],
        }),
      ]);

      const stats = totalStats[0] || {
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        suspendedTenants: 0,
        totalUsers: 0,
      };

      const tenantsByType: Record<string, number> = {};
      typeStats.forEach((item: any) => {
        tenantsByType[item._id] = item.count;
      });

      const tenantsByStatus: Record<string, number> = {};
      statusStats.forEach((item: any) => {
        tenantsByStatus[item._id] = item.count;
      });

      const usageData = usageStats[0] || { totalUsers: 0, totalTenants: 1 };
      const averageUsersPerTenant = usageData.totalTenants > 0 
        ? Math.round(usageData.totalUsers / usageData.totalTenants * 100) / 100 
        : 0;

      return {
        totalTenants: stats.totalTenants,
        activeTenants: stats.activeTenants,
        trialTenants: stats.trialTenants,
        suspendedTenants: stats.suspendedTenants,
        tenantsByType,
        tenantsByStatus,
        averageUsersPerTenant,
        tenantsExceedingLimits: limitsViolations,
      };
    } catch (error) {
      logger.error('Error getting tenant statistics:', error);
      throw error;
    }
  }

  /**
   * Update tenant branding and theming
   */
  async updateTenantBranding(
    tenantId: string,
    brandingUpdate: TenantBrandingUpdate,
    adminId: string
  ): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate color formats if provided
      const colorFields = ['primaryColor', 'secondaryColor', 'accentColor'];
      for (const field of colorFields) {
        const color = brandingUpdate[field as keyof TenantBrandingUpdate];
        if (color && typeof color === 'string' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
          throw new Error(`Invalid ${field} format. Use hex format (#RRGGBB or #RGB)`);
        }
      }

      // Update branding
      Object.assign(tenant.branding, brandingUpdate);
      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.lastActivity = new Date();

      await tenant.save();

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_branding_updated',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'low',
        details: {
          tenantName: tenant.name,
          updatedFields: Object.keys(brandingUpdate),
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      logger.info(`Tenant branding updated: ${tenant.name}`);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant branding:', error);
      throw error;
    }
  }

  /**
   * Update tenant limits and quotas
   */
  async updateTenantLimits(
    tenantId: string,
    limitsUpdate: TenantLimitsUpdate,
    adminId: string
  ): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate limits
      if (limitsUpdate.maxUsers !== undefined && limitsUpdate.maxUsers < 1) {
        throw new Error('maxUsers must be at least 1');
      }
      if (limitsUpdate.maxPatients !== undefined && limitsUpdate.maxPatients < 0) {
        throw new Error('maxPatients cannot be negative');
      }
      if (limitsUpdate.storageLimit !== undefined && limitsUpdate.storageLimit < 100) {
        throw new Error('storageLimit must be at least 100MB');
      }
      if (limitsUpdate.apiCallsPerMonth !== undefined && limitsUpdate.apiCallsPerMonth < 1000) {
        throw new Error('apiCallsPerMonth must be at least 1000');
      }

      // Check if current usage exceeds new limits
      const violations: string[] = [];
      if (limitsUpdate.maxUsers !== undefined && tenant.usageMetrics.currentUsers > limitsUpdate.maxUsers) {
        violations.push(`Current users (${tenant.usageMetrics.currentUsers}) exceeds new limit (${limitsUpdate.maxUsers})`);
      }
      if (limitsUpdate.maxPatients !== undefined && tenant.usageMetrics.currentPatients > limitsUpdate.maxPatients) {
        violations.push(`Current patients (${tenant.usageMetrics.currentPatients}) exceeds new limit (${limitsUpdate.maxPatients})`);
      }
      if (limitsUpdate.storageLimit !== undefined && tenant.usageMetrics.storageUsed > limitsUpdate.storageLimit) {
        violations.push(`Current storage (${tenant.usageMetrics.storageUsed}MB) exceeds new limit (${limitsUpdate.storageLimit}MB)`);
      }

      if (violations.length > 0) {
        throw new Error(`Cannot update limits: ${violations.join(', ')}`);
      }

      // Update limits
      Object.assign(tenant.limits, limitsUpdate);
      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.lastActivity = new Date();

      await tenant.save();

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_limits_updated',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'medium',
        details: {
          tenantName: tenant.name,
          updatedLimits: limitsUpdate,
          previousLimits: tenant.limits,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      logger.info(`Tenant limits updated: ${tenant.name}`);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant limits:', error);
      throw error;
    }
  }

  /**
   * Update tenant feature configuration
   */
  async updateTenantFeatures(
    tenantId: string,
    features: string[],
    adminId: string
  ): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const previousFeatures = [...tenant.features];
      tenant.features = features;
      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.lastActivity = new Date();

      await tenant.save();

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_features_updated',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'medium',
        details: {
          tenantName: tenant.name,
          previousFeatures,
          newFeatures: features,
          addedFeatures: features.filter(f => !previousFeatures.includes(f)),
          removedFeatures: previousFeatures.filter(f => !features.includes(f)),
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      logger.info(`Tenant features updated: ${tenant.name}`);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant features:', error);
      throw error;
    }
  }

  /**
   * Update comprehensive tenant customization
   */
  async updateTenantCustomization(
    tenantId: string,
    customization: TenantCustomizationUpdate,
    adminId: string
  ): Promise<ITenant> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const updates: string[] = [];

      // Update branding if provided
      if (customization.branding) {
        // Validate color formats
        const colorFields = ['primaryColor', 'secondaryColor', 'accentColor'];
        for (const field of colorFields) {
          const color = customization.branding[field as keyof TenantBrandingUpdate];
          if (color && typeof color === 'string' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            throw new Error(`Invalid ${field} format. Use hex format (#RRGGBB or #RGB)`);
          }
        }

        Object.assign(tenant.branding, customization.branding);
        updates.push('branding');
      }

      // Update limits if provided
      if (customization.limits) {
        // Validate limits
        if (customization.limits.maxUsers !== undefined && customization.limits.maxUsers < 1) {
          throw new Error('maxUsers must be at least 1');
        }
        if (customization.limits.maxPatients !== undefined && customization.limits.maxPatients < 0) {
          throw new Error('maxPatients cannot be negative');
        }
        if (customization.limits.storageLimit !== undefined && customization.limits.storageLimit < 100) {
          throw new Error('storageLimit must be at least 100MB');
        }

        // Check usage violations
        const violations: string[] = [];
        if (customization.limits.maxUsers !== undefined && tenant.usageMetrics.currentUsers > customization.limits.maxUsers) {
          violations.push(`Current users (${tenant.usageMetrics.currentUsers}) exceeds new limit (${customization.limits.maxUsers})`);
        }

        if (violations.length > 0) {
          throw new Error(`Cannot update limits: ${violations.join(', ')}`);
        }

        Object.assign(tenant.limits, customization.limits);
        updates.push('limits');
      }

      // Update features if provided
      if (customization.features) {
        tenant.features = customization.features;
        updates.push('features');
      }

      // Update settings if provided
      if (customization.settings) {
        Object.assign(tenant.settings, customization.settings);
        updates.push('settings');
      }

      tenant.lastModifiedBy = new mongoose.Types.ObjectId(adminId);
      tenant.lastActivity = new Date();

      await tenant.save();

      // Log audit event
      await (SecurityAuditLog as any).createLog({
        userId: new mongoose.Types.ObjectId(adminId),
        action: 'tenant_customization_updated',
        resource: 'tenant',
        resourceId: tenant._id,
        category: 'tenant_management',
        severity: 'medium',
        details: {
          tenantName: tenant.name,
          updatedSections: updates,
          customization,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        success: true,
      });

      await session.commitTransaction();
      
      logger.info(`Tenant customization updated: ${tenant.name} (${updates.join(', ')})`);
      
      return tenant;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error updating tenant customization:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get tenant customization settings
   */
  async getTenantCustomization(tenantId: string): Promise<{
    branding: any;
    limits: any;
    features: string[];
    settings: any;
    usageMetrics: any;
  }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return {
        branding: tenant.branding,
        limits: tenant.limits,
        features: tenant.features,
        settings: tenant.settings,
        usageMetrics: tenant.usageMetrics,
      };
    } catch (error) {
      logger.error('Error getting tenant customization:', error);
      throw error;
    }
  }

  /**
   * Get tenant analytics and usage tracking
   */
  async getTenantAnalytics(
    tenantId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    usage: {
      users: { current: number; trend: number; history: Array<{ date: string; count: number }> };
      patients: { current: number; trend: number; history: Array<{ date: string; count: number }> };
      storage: { current: number; trend: number; history: Array<{ date: string; usage: number }> };
      apiCalls: { current: number; trend: number; history: Array<{ date: string; calls: number }> };
    };
    performance: {
      responseTime: { average: number; p95: number; trend: number };
      uptime: { percentage: number; incidents: number };
      errorRate: { percentage: number; trend: number };
    };
    billing: {
      currentCost: number;
      projectedCost: number;
      costTrend: number;
      costBreakdown: Array<{ category: string; amount: number; percentage: number }>;
    };
    features: {
      mostUsed: Array<{ feature: string; usage: number; percentage: number }>;
      leastUsed: Array<{ feature: string; usage: number; percentage: number }>;
    };
  }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get current usage metrics
      const currentUsers = await User.countDocuments({ 
        workplaceId: tenant._id, 
        status: 'active' 
      });

      // Mock historical data (in a real implementation, this would come from a time-series database)
      const generateMockHistory = (current: number, days: number) => {
        const history = [];
        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const variance = Math.random() * 0.2 - 0.1; // ±10% variance
          const value = Math.max(0, Math.floor(current * (1 + variance)));
          history.push({
            date: date.toISOString().split('T')[0],
            count: value,
            usage: value,
            calls: value * 100, // Mock API calls
          });
        }
        return history;
      };

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const userHistory = generateMockHistory(currentUsers, days);
      const patientHistory = generateMockHistory(tenant.usageMetrics.currentPatients, days);
      const storageHistory = generateMockHistory(tenant.usageMetrics.storageUsed, days);
      const apiHistory = generateMockHistory(tenant.usageMetrics.apiCallsThisMonth, days);

      // Calculate trends (percentage change from previous period)
      const calculateTrend = (current: number, history: any[]) => {
        if (history.length < 2) return 0;
        const previous = history[0].count || history[0].usage || history[0].calls;
        return previous > 0 ? ((current - previous) / previous) * 100 : 0;
      };

      // Calculate performance metrics (mock data)
      const performance = {
        responseTime: {
          average: 150 + Math.random() * 100, // 150-250ms
          p95: 300 + Math.random() * 200, // 300-500ms
          trend: (Math.random() - 0.5) * 20, // ±10%
        },
        uptime: {
          percentage: 99.5 + Math.random() * 0.5, // 99.5-100%
          incidents: Math.floor(Math.random() * 3), // 0-2 incidents
        },
        errorRate: {
          percentage: Math.random() * 0.5, // 0-0.5%
          trend: (Math.random() - 0.5) * 0.2, // ±0.1%
        },
      };

      // Calculate billing metrics (mock data)
      const baseCost = tenant.limits.maxUsers * 10; // $10 per user
      const storageCost = (tenant.usageMetrics.storageUsed / 1000) * 5; // $5 per GB
      const apiCost = (tenant.usageMetrics.apiCallsThisMonth / 1000) * 0.1; // $0.1 per 1000 calls
      
      const billing = {
        currentCost: baseCost + storageCost + apiCost,
        projectedCost: (baseCost + storageCost + apiCost) * 1.1, // 10% growth projection
        costTrend: 5 + Math.random() * 10, // 5-15% increase
        costBreakdown: [
          { category: 'Users', amount: baseCost, percentage: (baseCost / (baseCost + storageCost + apiCost)) * 100 },
          { category: 'Storage', amount: storageCost, percentage: (storageCost / (baseCost + storageCost + apiCost)) * 100 },
          { category: 'API Calls', amount: apiCost, percentage: (apiCost / (baseCost + storageCost + apiCost)) * 100 },
        ],
      };

      // Calculate feature usage (mock data based on enabled features)
      const featureUsage = tenant.features.map(feature => ({
        feature: feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        usage: Math.floor(Math.random() * 1000),
        percentage: Math.random() * 100,
      }));

      featureUsage.sort((a, b) => b.usage - a.usage);

      const analytics = {
        usage: {
          users: {
            current: currentUsers,
            trend: calculateTrend(currentUsers, userHistory),
            history: userHistory.map(h => ({ date: h.date, count: h.count })),
          },
          patients: {
            current: tenant.usageMetrics.currentPatients,
            trend: calculateTrend(tenant.usageMetrics.currentPatients, patientHistory),
            history: patientHistory.map(h => ({ date: h.date, count: h.count })),
          },
          storage: {
            current: tenant.usageMetrics.storageUsed,
            trend: calculateTrend(tenant.usageMetrics.storageUsed, storageHistory),
            history: storageHistory.map(h => ({ date: h.date, usage: h.usage })),
          },
          apiCalls: {
            current: tenant.usageMetrics.apiCallsThisMonth,
            trend: calculateTrend(tenant.usageMetrics.apiCallsThisMonth, apiHistory),
            history: apiHistory.map(h => ({ date: h.date, calls: h.calls })),
          },
        },
        performance,
        billing,
        features: {
          mostUsed: featureUsage.slice(0, 5),
          leastUsed: featureUsage.slice(-3),
        },
      };

      logger.info(`Tenant analytics retrieved: ${tenant.name}`);
      
      return analytics;
    } catch (error) {
      logger.error('Error getting tenant analytics:', error);
      throw error;
    }
  }

  /**
   * Get tenant performance monitoring dashboard
   */
  async getTenantPerformanceMetrics(tenantId: string): Promise<{
    realTime: {
      activeUsers: number;
      requestsPerSecond: number;
      averageResponseTime: number;
      errorRate: number;
    };
    alerts: Array<{
      id: string;
      type: 'warning' | 'critical';
      message: string;
      timestamp: Date;
      resolved: boolean;
    }>;
    systemHealth: {
      cpu: { usage: number; status: 'healthy' | 'warning' | 'critical' };
      memory: { usage: number; status: 'healthy' | 'warning' | 'critical' };
      disk: { usage: number; status: 'healthy' | 'warning' | 'critical' };
      network: { latency: number; status: 'healthy' | 'warning' | 'critical' };
    };
  }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Mock real-time metrics (in production, this would come from monitoring systems)
      const realTime = {
        activeUsers: Math.floor(tenant.usageMetrics.currentUsers * (0.7 + Math.random() * 0.3)), // 70-100% of total users
        requestsPerSecond: Math.floor(10 + Math.random() * 50), // 10-60 RPS
        averageResponseTime: 100 + Math.random() * 200, // 100-300ms
        errorRate: Math.random() * 2, // 0-2%
      };

      // Mock alerts
      const alerts = [];
      if (realTime.errorRate > 1) {
        alerts.push({
          id: 'alert-1',
          type: 'warning' as const,
          message: 'Error rate is above 1%',
          timestamp: new Date(),
          resolved: false,
        });
      }
      if (tenant.usageMetrics.storageUsed > tenant.limits.storageLimit * 0.9) {
        alerts.push({
          id: 'alert-2',
          type: 'critical' as const,
          message: 'Storage usage is above 90%',
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Mock system health
      const getHealthStatus = (usage: number) => {
        if (usage < 70) return 'healthy';
        if (usage < 90) return 'warning';
        return 'critical';
      };

      const cpuUsage = 20 + Math.random() * 60; // 20-80%
      const memoryUsage = 30 + Math.random() * 50; // 30-80%
      const diskUsage = (tenant.usageMetrics.storageUsed / tenant.limits.storageLimit) * 100;
      const networkLatency = 10 + Math.random() * 40; // 10-50ms

      const systemHealth = {
        cpu: { usage: cpuUsage, status: getHealthStatus(cpuUsage) as any },
        memory: { usage: memoryUsage, status: getHealthStatus(memoryUsage) as any },
        disk: { usage: diskUsage, status: getHealthStatus(diskUsage) as any },
        network: { latency: networkLatency, status: getHealthStatus(networkLatency) as any },
      };

      return {
        realTime,
        alerts,
        systemHealth,
      };
    } catch (error) {
      logger.error('Error getting tenant performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get tenant billing and cost tracking
   */
  async getTenantBillingAnalytics(
    tenantId: string,
    timeRange: '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    currentPeriod: {
      totalCost: number;
      breakdown: Array<{ category: string; amount: number; percentage: number }>;
      usage: Array<{ metric: string; current: number; limit: number; cost: number }>;
    };
    trends: {
      costHistory: Array<{ date: string; amount: number }>;
      usageHistory: Array<{ date: string; users: number; storage: number; apiCalls: number }>;
      projections: {
        nextMonth: number;
        nextQuarter: number;
        nextYear: number;
      };
    };
    optimization: {
      recommendations: Array<{ type: string; description: string; potentialSavings: number }>;
      unusedFeatures: string[];
      overageAlerts: Array<{ metric: string; current: number; limit: number; overage: number }>;
    };
  }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Calculate current costs
      const userCost = tenant.usageMetrics.currentUsers * 10; // $10 per user
      const storageCost = (tenant.usageMetrics.storageUsed / 1000) * 5; // $5 per GB
      const apiCost = (tenant.usageMetrics.apiCallsThisMonth / 1000) * 0.1; // $0.1 per 1000 calls
      const totalCost = userCost + storageCost + apiCost;

      const breakdown = [
        { category: 'User Licenses', amount: userCost, percentage: (userCost / totalCost) * 100 },
        { category: 'Storage', amount: storageCost, percentage: (storageCost / totalCost) * 100 },
        { category: 'API Usage', amount: apiCost, percentage: (apiCost / totalCost) * 100 },
      ];

      const usage = [
        {
          metric: 'Users',
          current: tenant.usageMetrics.currentUsers,
          limit: tenant.limits.maxUsers,
          cost: userCost,
        },
        {
          metric: 'Storage (MB)',
          current: tenant.usageMetrics.storageUsed,
          limit: tenant.limits.storageLimit,
          cost: storageCost,
        },
        {
          metric: 'API Calls',
          current: tenant.usageMetrics.apiCallsThisMonth,
          limit: tenant.limits.apiCallsPerMonth,
          cost: apiCost,
        },
      ];

      // Generate mock historical data
      const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const costHistory = [];
      const usageHistory = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const variance = Math.random() * 0.2 - 0.1; // ±10% variance
        const historicalCost = totalCost * (1 + variance);
        
        costHistory.push({
          date: date.toISOString().split('T')[0],
          amount: Math.max(0, historicalCost),
        });

        usageHistory.push({
          date: date.toISOString().split('T')[0],
          users: Math.max(0, Math.floor(tenant.usageMetrics.currentUsers * (1 + variance))),
          storage: Math.max(0, Math.floor(tenant.usageMetrics.storageUsed * (1 + variance))),
          apiCalls: Math.max(0, Math.floor(tenant.usageMetrics.apiCallsThisMonth * (1 + variance))),
        });
      }

      // Calculate projections
      const growthRate = 0.05; // 5% monthly growth
      const projections = {
        nextMonth: totalCost * (1 + growthRate),
        nextQuarter: totalCost * Math.pow(1 + growthRate, 3),
        nextYear: totalCost * Math.pow(1 + growthRate, 12),
      };

      // Generate optimization recommendations
      const recommendations = [];
      const unusedFeatures = [];
      const overageAlerts = [];

      // Check for unused features
      const allFeatures = ['patient-management', 'prescription-processing', 'inventory-management', 'clinical-notes', 'ai-diagnostics', 'reports-analytics'];
      allFeatures.forEach(feature => {
        if (!tenant.features.includes(feature)) {
          unusedFeatures.push(feature);
        }
      });

      // Check for overages
      if (tenant.usageMetrics.currentUsers > tenant.limits.maxUsers) {
        overageAlerts.push({
          metric: 'Users',
          current: tenant.usageMetrics.currentUsers,
          limit: tenant.limits.maxUsers,
          overage: tenant.usageMetrics.currentUsers - tenant.limits.maxUsers,
        });
      }

      if (tenant.usageMetrics.storageUsed > tenant.limits.storageLimit) {
        overageAlerts.push({
          metric: 'Storage',
          current: tenant.usageMetrics.storageUsed,
          limit: tenant.limits.storageLimit,
          overage: tenant.usageMetrics.storageUsed - tenant.limits.storageLimit,
        });
      }

      // Generate recommendations based on usage patterns
      if (tenant.usageMetrics.currentUsers < tenant.limits.maxUsers * 0.5) {
        recommendations.push({
          type: 'Downgrade Plan',
          description: 'Consider downgrading to a smaller plan to reduce costs',
          potentialSavings: userCost * 0.3,
        });
      }

      if (unusedFeatures.length > 0) {
        recommendations.push({
          type: 'Remove Unused Features',
          description: `Consider removing unused features: ${unusedFeatures.join(', ')}`,
          potentialSavings: unusedFeatures.length * 5,
        });
      }

      return {
        currentPeriod: {
          totalCost,
          breakdown,
          usage,
        },
        trends: {
          costHistory,
          usageHistory,
          projections,
        },
        optimization: {
          recommendations,
          unusedFeatures,
          overageAlerts,
        },
      };
    } catch (error) {
      logger.error('Error getting tenant billing analytics:', error);
      throw error;
    }
  }

  /**
   * Enforce data isolation between tenants
   */
  async enforceDataIsolation(tenantId: string): Promise<{
    fixed: string[];
    errors: string[];
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fixed: string[] = [];
      const errors: string[] = [];

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Fix users without workspace assignment
      const usersWithoutWorkspace = await User.find({
        $or: [
          { workspaceId: { $exists: false } },
          { workspaceId: null },
        ],
      });

      for (const user of usersWithoutWorkspace) {
        try {
          // Assign to default workspace or remove if no valid workspace
          await User.findByIdAndUpdate(user._id, {
            workplaceId: null,
            workspaces: [],
            status: 'suspended',
          });
          fixed.push(`Deactivated user ${user.email} without valid workspace`);
        } catch (error) {
          errors.push(`Failed to fix user ${user.email}: ${error}`);
        }
      }

      // Ensure tenant settings exist
      const settingsCount = await TenantSettings.countDocuments({ tenantId });
      if (settingsCount === 0) {
        try {
          await (TenantSettings as any).createDefaultSettings(
            tenant._id,
            tenant.name,
            tenant.createdBy
          );
          fixed.push('Created default tenant settings');
        } catch (error) {
          errors.push(`Failed to create tenant settings: ${error}`);
        }
      }

      await session.commitTransaction();
      
      logger.info(`Data isolation enforced for tenant: ${tenant.name}`);
      
      return { fixed, errors };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error enforcing data isolation:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const tenantManagementService = new TenantManagementService();