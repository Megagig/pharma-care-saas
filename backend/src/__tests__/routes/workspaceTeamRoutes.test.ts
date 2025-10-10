import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import workspaceTeamRoutes from '../../routes/workspaceTeamRoutes';
import { User } from '../../models/User';
import Workplace from '../../models/Workplace';
import SubscriptionPlan from '../../models/SubscriptionPlan';

describe('Workspace Team Routes', () => {
  let app: express.Application;
  let workspaceOwner: any;
  let testWorkplace: any;
  let teamMember1: any;
  let teamMember2: any;
  let ownerToken: string;
  let nonOwnerToken: string;
  let testPlan: any;

  beforeAll(async () => {
    // Create a test subscription plan
    testPlan = await SubscriptionPlan.create({
      name: 'Test Plan',
      priceNGN: 0,
      billingInterval: 'monthly',
      tier: 'free_trial',
      description: 'Test subscription plan',
      popularPlan: false,
      features: {
        patientLimit: 100,
        reminderSmsMonthlyLimit: 50,
        reportsExport: true,
        careNoteExport: true,
        adrModule: false,
        multiUserSupport: true,
        teamSize: 10,
        apiAccess: false,
        auditLogs: false,
        dataBackup: false,
        clinicalNotesLimit: 100,
        prioritySupport: false,
        emailReminders: true,
        smsReminders: false,
        advancedReports: false,
        drugTherapyManagement: false,
        teamManagement: true,
        dedicatedSupport: false,
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
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock workspace context middleware
    app.use((req: any, res, next) => {
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
          req.user = decoded.user;
          
          // Mock workspace context
          if (req.user && req.user.workplaceId) {
            req.workspaceContext = {
              workspace: {
                _id: req.user.workplaceId,
                ownerId: req.user.role === 'pharmacy_outlet' ? req.user._id : null,
              },
            };
          }
        } catch (error) {
          // Invalid token
        }
      }
      next();
    });
    
    app.use('/api/workspace/team', workspaceTeamRoutes);

    // Create a temporary owner ID (will be updated after creating the owner)
    const tempOwnerId = new mongoose.Types.ObjectId();
    
    // Create test workplace
    testWorkplace = await Workplace.create({
      name: 'Test Pharmacy',
      type: 'Community',
      address: 'Test Address',
      phone: '1234567890',
      email: 'test@pharmacy.com',
      licenseNumber: 'TEST123',
      ownerId: tempOwnerId,
      subscriptionStatus: 'active',
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      verificationStatus: 'verified',
      inviteCode: 'TEST123',
      teamMembers: [],
      documents: [],
      stats: {
        patientsCount: 0,
        usersCount: 0,
        lastUpdated: new Date(),
      },
      locations: [],
      settings: {
        maxPendingInvites: 10,
        allowSharedPatients: false,
      },
    });

    // Create workspace owner
    workspaceOwner = await User.create({
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner@pharmacy.com',
      passwordHash: 'hashedpassword',
      role: 'pharmacy_outlet',
      workplaceId: testWorkplace._id,
      workplaceRole: 'Owner',
      status: 'active',
      licenseStatus: 'not_required',
      currentPlanId: testPlan._id,
      permissions: [],
      directPermissions: [],
      deniedPermissions: [],
      assignedRoles: [],
    });
    
    // Update workplace with actual owner ID
    testWorkplace.ownerId = workspaceOwner._id;
    await testWorkplace.save();

    // Create team members
    teamMember1 = await User.create({
      firstName: 'John',
      lastName: 'Pharmacist',
      email: 'john@pharmacy.com',
      passwordHash: 'hashedpassword',
      role: 'pharmacist',
      workplaceId: testWorkplace._id,
      workplaceRole: 'Pharmacist',
      status: 'active',
      licenseStatus: 'approved',
      currentPlanId: testPlan._id,
      permissions: [],
      directPermissions: [],
      deniedPermissions: [],
      assignedRoles: [],
    });

    teamMember2 = await User.create({
      firstName: 'Jane',
      lastName: 'Cashier',
      email: 'jane@pharmacy.com',
      passwordHash: 'hashedpassword',
      role: 'pharmacy_team',
      workplaceId: testWorkplace._id,
      workplaceRole: 'Cashier',
      status: 'active',
      licenseStatus: 'not_required',
      currentPlanId: testPlan._id,
      permissions: [],
      directPermissions: [],
      deniedPermissions: [],
      assignedRoles: [],
    });

    // Generate auth tokens
    ownerToken = jwt.sign(
      {
        user: {
          _id: workspaceOwner._id,
          email: workspaceOwner.email,
          role: workspaceOwner.role,
          workplaceId: testWorkplace._id,
        },
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    nonOwnerToken = jwt.sign(
      {
        user: {
          _id: teamMember1._id,
          email: teamMember1.email,
          role: teamMember1.role,
          workplaceId: testWorkplace._id,
        },
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup is handled by global setup
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests from non-workspace owners', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('workspace owner');
    });

    it('should allow requests from workspace owners', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/workspace/team/members', () => {
    it('should return all members in the workspace', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.members).toBeDefined();
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members?page=1&limit=1')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members?role=Pharmacist')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.members).toBeDefined();
      response.body.members.forEach((member: any) => {
        expect(member.workplaceRole).toBe('Pharmacist');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members?status=active')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.members).toBeDefined();
      response.body.members.forEach((member: any) => {
        expect(member.status).toBe('active');
      });
    });

    it('should search by name or email', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members?search=John')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.members).toBeDefined();
      expect(response.body.members.length).toBeGreaterThan(0);
    });

    it('should not expose sensitive fields', async () => {
      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.members.forEach((member: any) => {
        expect(member.passwordHash).toBeUndefined();
        expect(member.resetToken).toBeUndefined();
        expect(member.verificationToken).toBeUndefined();
      });
    });

    it('should only return members from the same workspace', async () => {
      // Create another workplace and user
      const otherWorkplace = await Workplace.create({
        name: 'Other Pharmacy',
        type: 'Community',
        address: 'Other Address',
        phone: '9876543210',
        email: 'other@pharmacy.com',
        licenseNumber: 'OTHER123',
        ownerId: new mongoose.Types.ObjectId(),
        subscriptionStatus: 'active',
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationStatus: 'verified',
        inviteCode: 'OTHER123',
        teamMembers: [],
        documents: [],
        stats: { patientsCount: 0, usersCount: 0, lastUpdated: new Date() },
        locations: [],
        settings: { maxPendingInvites: 10, allowSharedPatients: false },
      });

      await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@user.com',
        passwordHash: 'hashedpassword',
        role: 'pharmacist',
        workplaceId: otherWorkplace._id,
        workplaceRole: 'Pharmacist',
        status: 'active',
        licenseStatus: 'approved',
        currentPlanId: testPlan._id,
        permissions: [],
        directPermissions: [],
        deniedPermissions: [],
        assignedRoles: [],
      });

      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.members.forEach((member: any) => {
        expect(member._id.toString()).not.toBe(otherWorkplace._id.toString());
      });
    });
  });

  describe('PUT /api/workspace/team/members/:id', () => {
    it('should update member role successfully', async () => {
      const response = await request(app)
        .put(`/api/workspace/team/members/${teamMember1._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workplaceRole: 'Staff',
          reason: 'Promotion',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member).toBeDefined();
      expect(response.body.member.workplaceRole).toBe('Staff');
      expect(response.body.audit).toBeDefined();
      expect(response.body.audit.oldRole).toBe('Pharmacist');
      expect(response.body.audit.newRole).toBe('Staff');
    });

    it('should reject invalid workplace role', async () => {
      const response = await request(app)
        .put(`/api/workspace/team/members/${teamMember1._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workplaceRole: 'InvalidRole',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update for member not in workspace', async () => {
      const otherWorkplace = await Workplace.create({
        name: 'Another Pharmacy',
        type: 'Community',
        address: 'Another Address',
        phone: '5555555555',
        email: 'another@pharmacy.com',
        licenseNumber: 'ANOTHER123',
        ownerId: new mongoose.Types.ObjectId(),
        subscriptionStatus: 'active',
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationStatus: 'verified',
        inviteCode: 'ANOTHER123',
        teamMembers: [],
        documents: [],
        stats: { patientsCount: 0, usersCount: 0, lastUpdated: new Date() },
        locations: [],
        settings: { maxPendingInvites: 10, allowSharedPatients: false },
      });

      const otherMember = await User.create({
        firstName: 'Other',
        lastName: 'Member',
        email: 'other@member.com',
        passwordHash: 'hashedpassword',
        role: 'pharmacist',
        workplaceId: otherWorkplace._id,
        workplaceRole: 'Pharmacist',
        status: 'active',
        licenseStatus: 'approved',
        permissions: [],
        directPermissions: [],
        deniedPermissions: [],
        assignedRoles: [],
      });

      const response = await request(app)
        .put(`/api/workspace/team/members/${otherMember._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workplaceRole: 'Staff',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should validate member ID format', async () => {
      const response = await request(app)
        .put('/api/workspace/team/members/invalid-id')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workplaceRole: 'Staff',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/workspace/team/members/:id', () => {
    it('should remove member from workspace successfully', async () => {
      const response = await request(app)
        .delete(`/api/workspace/team/members/${teamMember2._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          reason: 'No longer needed',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.audit).toBeDefined();
      expect(response.body.audit.memberId).toBe(teamMember2._id.toString());

      // Verify member was removed
      const updatedMember = await User.findById(teamMember2._id);
      expect(updatedMember?.workplaceId).toBeUndefined();
      expect(updatedMember?.status).toBe('suspended');
    });

    it('should prevent removing workspace owner', async () => {
      const response = await request(app)
        .delete(`/api/workspace/team/members/${workspaceOwner._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          reason: 'Test removal',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot remove workspace owner');
    });

    it('should reject removal for member not in workspace', async () => {
      const otherWorkplace = await Workplace.create({
        name: 'Yet Another Pharmacy',
        type: 'Community',
        address: 'Yet Another Address',
        phone: '4444444444',
        email: 'yetanother@pharmacy.com',
        licenseNumber: 'YETANOTHER123',
        ownerId: new mongoose.Types.ObjectId(),
        subscriptionStatus: 'active',
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationStatus: 'verified',
        inviteCode: 'YETANOTHER123',
        teamMembers: [],
        documents: [],
        stats: { patientsCount: 0, usersCount: 0, lastUpdated: new Date() },
        locations: [],
        settings: { maxPendingInvites: 10, allowSharedPatients: false },
      });

      const otherMember = await User.create({
        firstName: 'Yet',
        lastName: 'Another',
        email: 'yet@another.com',
        passwordHash: 'hashedpassword',
        role: 'pharmacist',
        workplaceId: otherWorkplace._id,
        workplaceRole: 'Pharmacist',
        status: 'active',
        licenseStatus: 'approved',
        permissions: [],
        directPermissions: [],
        deniedPermissions: [],
        assignedRoles: [],
      });

      const response = await request(app)
        .delete(`/api/workspace/team/members/${otherMember._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          reason: 'Test removal',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should validate member ID format', async () => {
      const response = await request(app)
        .delete('/api/workspace/team/members/invalid-id')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          reason: 'Test removal',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Workspace Isolation', () => {
    it('should enforce workspace isolation across all endpoints', async () => {
      // Create second workspace with owner and members
      const workspace2 = await Workplace.create({
        name: 'Second Pharmacy',
        type: 'Community',
        address: 'Second Address',
        phone: '2222222222',
        email: 'second@pharmacy.com',
        licenseNumber: 'SECOND123',
        ownerId: new mongoose.Types.ObjectId(),
        subscriptionStatus: 'active',
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationStatus: 'verified',
        inviteCode: 'SECOND123',
        teamMembers: [],
        documents: [],
        stats: { patientsCount: 0, usersCount: 0, lastUpdated: new Date() },
        locations: [],
        settings: { maxPendingInvites: 10, allowSharedPatients: false },
      });

      const owner2 = await User.create({
        firstName: 'Second',
        lastName: 'Owner',
        email: 'owner2@pharmacy.com',
        passwordHash: 'hashedpassword',
        role: 'pharmacy_outlet',
        workplaceId: workspace2._id,
        workplaceRole: 'Owner',
        status: 'active',
        licenseStatus: 'not_required',
        permissions: [],
        directPermissions: [],
        deniedPermissions: [],
        assignedRoles: [],
      });

      const member2 = await User.create({
        firstName: 'Second',
        lastName: 'Member',
        email: 'member2@pharmacy.com',
        passwordHash: 'hashedpassword',
        role: 'pharmacist',
        workplaceId: workspace2._id,
        workplaceRole: 'Pharmacist',
        status: 'active',
        licenseStatus: 'approved',
        permissions: [],
        directPermissions: [],
        deniedPermissions: [],
        assignedRoles: [],
      });

      const owner2Token = jwt.sign(
        {
          user: {
            _id: owner2._id,
            email: owner2.email,
            role: owner2.role,
            workplaceId: workspace2._id,
          },
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Owner 2 should not see members from workspace 1
      const response = await request(app)
        .get('/api/workspace/team/members')
        .set('Authorization', `Bearer ${owner2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.members).toBeDefined();
      
      // Should only see members from workspace 2
      response.body.members.forEach((member: any) => {
        expect(member.email).not.toBe(teamMember1.email);
        expect(member.email).not.toBe(workspaceOwner.email);
      });
    });
  });
});
