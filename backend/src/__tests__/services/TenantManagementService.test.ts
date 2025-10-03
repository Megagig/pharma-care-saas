import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TenantManagementService, TenantProvisioningData, TenantStatusUpdate } from '../../services/TenantManagementService';
import { Tenant } from '../../models/Tenant';
import { TenantSettings } from '../../models/TenantSettings';
import User from '../../models/User';
import SubscriptionPlan from '../../models/SubscriptionPlan';
import { SecurityAuditLog } from '../../models/SecurityAuditLog';

describe('TenantManagementService', () => {
  let mongoServer: MongoMemoryServer;
  let tenantService: TenantManagementService;
  let adminId: string;
  let subscriptionPlanId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      Tenant.deleteMany({}),
      TenantSettings.deleteMany({}),
      User.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      SecurityAuditLog.deleteMany({}),
    ]);

    tenantService = new TenantManagementService();
    adminId = new mongoose.Types.ObjectId().toString();

    // Create a test subscription plan
    const subscriptionPlan = await SubscriptionPlan.create({
      name: 'Basic Plan',
      description: 'Basic subscription plan for testing',
      priceNGN: 29.99,
      billingInterval: 'monthly',
      tier: 'basic',
      popularPlan: false,
      features: {
        patientLimit: 1000,
        reminderSmsMonthlyLimit: 100,
        reportsExport: true,
        careNoteExport: true,
        adrModule: false,
        multiUserSupport: true,
        teamSize: 10,
        apiAccess: false,
        auditLogs: false,
        dataBackup: true,
        clinicalNotesLimit: 500,
        patientRecordsLimit: 1000,
        prioritySupport: false,
        emailReminders: true,
        smsReminders: true,
        advancedReports: false,
        drugTherapyManagement: false,
        teamManagement: true,
        dedicatedSupport: false,
        integrations: false,
        customIntegrations: false,
        adrReporting: false,
        drugInteractionChecker: false,
        doseCalculator: false,
        multiLocationDashboard: false,
        sharedPatientRecords: false,
        groupAnalytics: false,
        cdss: false,
      },
      isActive: true,
    });

    subscriptionPlanId = subscriptionPlan._id.toString();
  });

  describe('provisionTenant', () => {
    it('should successfully provision a new tenant', async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          phone: '+1234567890',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
          website: 'https://testpharmacy.com',
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
          phone: '+1234567890',
        },
        subscriptionPlanId,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
        },
        features: ['patient-management', 'prescription-processing'],
        limits: {
          maxUsers: 15,
          maxPatients: 1500,
        },
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe(tenantData.name);
      expect(tenant.type).toBe(tenantData.type);
      expect(tenant.status).toBe('pending');
      expect(tenant.subscriptionStatus).toBe('trialing');
      expect(tenant.slug).toBe('test-pharmacy');
      expect(tenant.limits.maxUsers).toBe(15);
      expect(tenant.limits.maxPatients).toBe(1500);

      // Check that tenant settings were created
      const tenantSettings = await TenantSettings.findOne({ tenantId: tenant._id });
      expect(tenantSettings).toBeDefined();
      expect(tenantSettings?.general.tenantName).toBe(tenantData.name);

      // Check that primary contact user was created
      const user = await User.findOne({ email: tenantData.primaryContact.email });
      expect(user).toBeDefined();
      expect(user?.workplaceId?.toString()).toBe(tenant._id.toString());

      // Check audit log
      const auditLog = await SecurityAuditLog.findOne({ action: 'tenant_provisioned' });
      expect(auditLog).toBeDefined();
      expect(auditLog?.resourceId?.toString()).toBe(tenant._id.toString());
    });

    it('should generate unique slug when name conflicts exist', async () => {
      // Create first tenant
      const tenantData1: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact1@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe1@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant1 = await tenantService.provisionTenant(tenantData1, adminId);
      expect(tenant1.slug).toBe('test-pharmacy');

      // Create second tenant with same name
      const tenantData2: TenantProvisioningData = {
        ...tenantData1,
        contactInfo: {
          ...tenantData1.contactInfo,
          email: 'contact2@testpharmacy.com',
        },
        primaryContact: {
          ...tenantData1.primaryContact,
          email: 'john.doe2@testpharmacy.com',
        },
      };

      const tenant2 = await tenantService.provisionTenant(tenantData2, adminId);
      expect(tenant2.slug).toBe('test-pharmacy-1');
    });

    it('should throw error for invalid subscription plan', async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId: new mongoose.Types.ObjectId().toString(),
      };

      await expect(tenantService.provisionTenant(tenantData, adminId))
        .rejects.toThrow('Invalid subscription plan');
    });
  });

  describe('deprovisionTenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();

      // Set tenant to suspended status so it can be deprovisioned
      await Tenant.findByIdAndUpdate(tenantId, { 
        status: 'suspended',
        subscriptionStatus: 'cancelled',
      });
    });

    it('should successfully deprovision a tenant', async () => {
      await tenantService.deprovisionTenant(tenantId, adminId, {
        reason: 'Test deprovisioning',
        deleteData: false,
      });

      const tenant = await Tenant.findById(tenantId);
      expect(tenant?.status).toBe('cancelled');
      expect(tenant?.subscriptionStatus).toBe('cancelled');
      expect(tenant?.metadata.deprovisionReason).toBe('Test deprovisioning');

      // Check that tenant settings were deactivated
      const tenantSettings = await TenantSettings.findOne({ tenantId });
      expect(tenantSettings?.isActive).toBe(false);

      // Check that users were deactivated
      const users = await User.find({ workplaceId: tenantId });
      users.forEach(user => {
        expect(user.status).toBe('suspended');
      });

      // Check audit log
      const auditLog = await SecurityAuditLog.findOne({ action: 'tenant_deprovisioned' });
      expect(auditLog).toBeDefined();
    });

    it('should throw error when trying to deprovision active tenant', async () => {
      // Set tenant back to active
      await Tenant.findByIdAndUpdate(tenantId, { 
        status: 'active',
        subscriptionStatus: 'active',
      });

      await expect(tenantService.deprovisionTenant(tenantId, adminId))
        .rejects.toThrow('Cannot deprovision active tenant with active subscription');
    });

    it('should throw error for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(tenantService.deprovisionTenant(nonExistentId, adminId))
        .rejects.toThrow('Tenant not found');
    });
  });

  describe('updateTenantStatus', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();
    });

    it('should successfully update tenant status to suspended', async () => {
      const statusUpdate: TenantStatusUpdate = {
        status: 'suspended',
        reason: 'Payment overdue',
      };

      const updatedTenant = await tenantService.updateTenantStatus(tenantId, statusUpdate, adminId);

      expect(updatedTenant.status).toBe('suspended');
      expect(updatedTenant.metadata.suspensionReason).toBe('Payment overdue');
      expect(updatedTenant.metadata.suspendedBy).toBe(adminId);

      // Check that users were deactivated
      const users = await User.find({ workplaceId: tenantId });
      users.forEach(user => {
        expect(user.status).toBe('suspended');
      });

      // Check audit log
      const auditLog = await SecurityAuditLog.findOne({ action: 'tenant_status_updated' });
      expect(auditLog).toBeDefined();
      expect(auditLog?.details.newStatus).toBe('suspended');
    });

    it('should successfully reactivate suspended tenant', async () => {
      // First suspend the tenant
      await tenantService.updateTenantStatus(tenantId, { status: 'suspended' }, adminId);

      // Then reactivate it
      const statusUpdate: TenantStatusUpdate = {
        status: 'active',
      };

      const updatedTenant = await tenantService.updateTenantStatus(tenantId, statusUpdate, adminId);

      expect(updatedTenant.status).toBe('active');
      expect(updatedTenant.metadata.suspensionReason).toBeUndefined();
      expect(updatedTenant.metadata.suspendedBy).toBeUndefined();

      // Check that users were reactivated
      const users = await User.find({ workplaceId: tenantId });
      users.forEach(user => {
        expect(user.status).toBe('active');
      });
    });

    it('should throw error for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(tenantService.updateTenantStatus(nonExistentId, { status: 'active' }, adminId))
        .rejects.toThrow('Tenant not found');
    });
  });

  describe('getTenantById', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();
    });

    it('should return tenant by ID', async () => {
      const tenant = await tenantService.getTenantById(tenantId);

      expect(tenant).toBeDefined();
      expect(tenant?._id.toString()).toBe(tenantId);
      expect(tenant?.name).toBe('Test Pharmacy');
    });

    it('should return tenant with users when includeUsers is true', async () => {
      const tenant = await tenantService.getTenantById(tenantId, { includeUsers: true });

      expect(tenant).toBeDefined();
      expect((tenant as any).users).toBeDefined();
      expect(Array.isArray((tenant as any).users)).toBe(true);
      expect((tenant as any).users.length).toBeGreaterThan(0);
    });

    it('should return tenant with updated usage when includeUsage is true', async () => {
      const tenant = await tenantService.getTenantById(tenantId, { includeUsage: true });

      expect(tenant).toBeDefined();
      expect(tenant?.usageMetrics.currentUsers).toBeGreaterThan(0);
    });

    it('should return null for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const tenant = await tenantService.getTenantById(nonExistentId);

      expect(tenant).toBeNull();
    });
  });

  describe('listTenants', () => {
    beforeEach(async () => {
      // Create multiple test tenants
      const tenantData1: TenantProvisioningData = {
        name: 'Pharmacy One',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact1@pharmacy.com',
          address: {
            street: '123 Main St',
            city: 'City One',
            state: 'State One',
            country: 'Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john1@pharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenantData2: TenantProvisioningData = {
        name: 'Clinic Two',
        type: 'clinic',
        contactInfo: {
          email: 'contact2@clinic.com',
          address: {
            street: '456 Oak Ave',
            city: 'City Two',
            state: 'State Two',
            country: 'Country',
            postalCode: '67890',
          },
        },
        primaryContact: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane2@clinic.com',
        },
        subscriptionPlanId,
      };

      await Promise.all([
        tenantService.provisionTenant(tenantData1, adminId),
        tenantService.provisionTenant(tenantData2, adminId),
      ]);
    });

    it('should list all tenants with pagination', async () => {
      const result = await tenantService.listTenants({}, { page: 1, limit: 10 });

      expect(result.tenants).toBeDefined();
      expect(result.tenants.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.pages).toBe(1);
    });

    it('should filter tenants by type', async () => {
      const result = await tenantService.listTenants({ type: ['pharmacy'] });

      expect(result.tenants.length).toBe(1);
      expect(result.tenants[0].type).toBe('pharmacy');
    });

    it('should filter tenants by status', async () => {
      const result = await tenantService.listTenants({ status: ['pending'] });

      expect(result.tenants.length).toBe(2);
      result.tenants.forEach(tenant => {
        expect(tenant.status).toBe('pending');
      });
    });

    it('should search tenants by name', async () => {
      const result = await tenantService.listTenants({ search: 'Pharmacy' });

      expect(result.tenants.length).toBe(1);
      expect(result.tenants[0].name).toContain('Pharmacy');
    });

    it('should sort tenants by name', async () => {
      const result = await tenantService.listTenants({}, { 
        sortBy: 'name', 
        sortOrder: 'asc' 
      });

      expect(result.tenants[0].name).toBe('Clinic Two');
      expect(result.tenants[1].name).toBe('Pharmacy One');
    });
  });

  describe('updateTenantUsage', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();
    });

    it('should update tenant usage metrics', async () => {
      const usageUpdate = {
        currentUsers: 5,
        currentPatients: 100,
        storageUsed: 1000,
        apiCallsThisMonth: 500,
      };

      const updatedTenant = await tenantService.updateTenantUsage(tenantId, usageUpdate);

      expect(updatedTenant.usageMetrics.currentUsers).toBe(5);
      expect(updatedTenant.usageMetrics.currentPatients).toBe(100);
      expect(updatedTenant.usageMetrics.storageUsed).toBe(1000);
      expect(updatedTenant.usageMetrics.apiCallsThisMonth).toBe(500);
      expect(updatedTenant.usageMetrics.lastCalculatedAt).toBeDefined();
    });

    it('should throw error for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(tenantService.updateTenantUsage(nonExistentId, { currentUsers: 5 }))
        .rejects.toThrow('Tenant not found');
    });
  });

  describe('validateDataIsolation', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();
    });

    it('should validate data isolation for properly configured tenant', async () => {
      const result = await tenantService.validateDataIsolation(tenantId);

      expect(result.isIsolated).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should detect users without workspace assignment', async () => {
      // Create a user without workspace
      await User.create({
        firstName: 'Orphan',
        lastName: 'User',
        email: 'orphan@example.com',
        role: 'pharmacist',
        status: 'active',
        passwordHash: 'temporary',
        emailVerified: false,
        licenseStatus: 'not_required',
        currentPlanId: new mongoose.Types.ObjectId(subscriptionPlanId),
      });

      const result = await tenantService.validateDataIsolation(tenantId);

      expect(result.isIsolated).toBe(false);
      expect(result.violations.some(v => v.includes('users found without workspace assignment'))).toBe(true);
    });

    it('should throw error for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(tenantService.validateDataIsolation(nonExistentId))
        .rejects.toThrow('Tenant not found');
    });
  });

  describe('getTenantStatistics', () => {
    beforeEach(async () => {
      // Create test tenants with different statuses
      const tenantData1: TenantProvisioningData = {
        name: 'Active Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'active@pharmacy.com',
          address: {
            street: '123 Main St',
            city: 'City',
            state: 'State',
            country: 'Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@pharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenantData2: TenantProvisioningData = {
        name: 'Trial Clinic',
        type: 'clinic',
        contactInfo: {
          email: 'trial@clinic.com',
          address: {
            street: '456 Oak Ave',
            city: 'City',
            state: 'State',
            country: 'Country',
            postalCode: '67890',
          },
        },
        primaryContact: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@clinic.com',
        },
        subscriptionPlanId,
      };

      const tenant1 = await tenantService.provisionTenant(tenantData1, adminId);
      const tenant2 = await tenantService.provisionTenant(tenantData2, adminId);

      // Update first tenant to active
      await Tenant.findByIdAndUpdate(tenant1._id, { status: 'active' });
    });

    it('should return tenant statistics', async () => {
      const stats = await tenantService.getTenantStatistics();

      expect(stats.totalTenants).toBe(2);
      expect(stats.activeTenants).toBe(1);
      expect(stats.trialTenants).toBe(2);
      expect(stats.tenantsByType.pharmacy).toBe(1);
      expect(stats.tenantsByType.clinic).toBe(1);
      expect(stats.tenantsByStatus.active).toBe(1);
      expect(stats.tenantsByStatus.pending).toBe(1);
      expect(stats.averageUsersPerTenant).toBeGreaterThan(0);
    });
  });

  describe('enforceDataIsolation', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenantData: TenantProvisioningData = {
        name: 'Test Pharmacy',
        type: 'pharmacy',
        contactInfo: {
          email: 'contact@testpharmacy.com',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345',
          },
        },
        primaryContact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testpharmacy.com',
        },
        subscriptionPlanId,
      };

      const tenant = await tenantService.provisionTenant(tenantData, adminId);
      tenantId = tenant._id.toString();
    });

    it('should fix users without workspace assignment', async () => {
      // Create a user without workspace
      await User.create({
        firstName: 'Orphan',
        lastName: 'User',
        email: 'orphan@example.com',
        role: 'pharmacist',
        status: 'active',
        passwordHash: 'temporary',
        emailVerified: false,
        licenseStatus: 'not_required',
        currentPlanId: new mongoose.Types.ObjectId(subscriptionPlanId),
      });

      const result = await tenantService.enforceDataIsolation(tenantId);

      expect(result.fixed.length).toBeGreaterThan(0);
      expect(result.fixed.some(f => f.includes('Deactivated user orphan@example.com'))).toBe(true);

      // Verify user was deactivated
      const orphanUser = await User.findOne({ email: 'orphan@example.com' });
      expect(orphanUser?.status).toBe('suspended');
    });

    it('should create tenant settings if missing', async () => {
      // Remove tenant settings
      await TenantSettings.deleteOne({ tenantId });

      const result = await tenantService.enforceDataIsolation(tenantId);

      expect(result.fixed.some(f => f.includes('Created default tenant settings'))).toBe(true);

      // Verify settings were created
      const settings = await TenantSettings.findOne({ tenantId });
      expect(settings).toBeDefined();
    });

    it('should throw error for non-existent tenant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(tenantService.enforceDataIsolation(nonExistentId))
        .rejects.toThrow('Tenant not found');
    });
  });
});