import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import User from '../../models/User';
import Workplace from '../../models/Workplace';
import Invitation from '../../models/Invitation';
import SubscriptionPlan from '../../models/SubscriptionPlan';
import { emailService } from '../../utils/emailService';
import jwt from 'jsonwebtoken';

// Mock email service
jest.mock('../../utils/emailService');
const mockEmailService = emailService as any;

describe('Invitation Workflow Integration Tests', () => {
    let ownerUser: any;
    let workspace: any;
    let subscriptionPlan: any;
    let authToken: string;

    beforeEach(async () => {
        // Create subscription plan
        subscriptionPlan = await SubscriptionPlan.create({
            name: 'Premium Plan',
            code: 'premium',
            tier: 'premium',
            tierRank: 2,
            priceNGN: 35000,
            billingInterval: 'monthly',
            features: ['team_management', 'patient_management', 'advanced_reports'],
            limits: {
                patients: 500,
                users: 5,
                locations: 3,
                storage: 5000,
                apiCalls: 5000
            },
            description: 'Premium plan for growing pharmacies',
            isActive: true,
            isTrial: false,
            isCustom: false,
            popularPlan: true
        });

        // Create workspace
        workspace = await Workplace.create({
            name: 'Test Pharmacy',
            type: 'Community',
            licenseNumber: 'PCN123456789',
            email: 'admin@testpharmacy.com',
            address: '123 Test Street',
            phone: '+234-800-123-4567',
            currentSubscriptionId: subscriptionPlan._id,
            teamMembers: [],
            ownerId: new mongoose.Types.ObjectId() // Temporary, will be updated after user creation
        });

        // Create owner user
        ownerUser = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'owner@testpharmacy.com',
            password: 'securePassword123',
            role: 'pharmacist',
            workplaceRole: 'Owner',
            workplaceId: workspace._id,
            status: 'active',
            licenseNumber: 'PCN123456'
        });

        // Update workspace with owner
        workspace.ownerId = ownerUser._id;
        workspace.teamMembers = [ownerUser._id];
        await workspace.save();

        // Generate auth token
        authToken = jwt.sign(
            { userId: ownerUser._id, workplaceId: workspace._id },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Mock email service
        mockEmailService.sendInvitationEmail.mockResolvedValue({ success: true, messageId: 'test-id', provider: 'test' });
        mockEmailService.sendInvitationAcceptedNotification.mockResolvedValue({ success: true, messageId: 'test-id', provider: 'test' });
    });

    describe('Complete Invitation Flow', () => {
        it('should complete full invitation workflow: create → send → accept', async () => {
            const invitationData = {
                email: 'newpharmacist@example.com',
                role: 'Pharmacist',
                firstName: 'Jane',
                lastName: 'Smith'
            };

            // Step 1: Create invitation
            const createResponse = await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.invitation).toMatchObject({
                email: invitationData.email,
                role: invitationData.role,
                status: 'pending',
                workspaceId: workspace._id.toString()
            });

            const invitationId = createResponse.body.invitation._id;
            const invitationCode = createResponse.body.invitation.code;

            // Verify email was sent
            expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: invitationData.email,
                    role: invitationData.role,
                    code: invitationCode
                })
            );

            // Step 2: Verify invitation exists in database
            const dbInvitation = await Invitation.findById(invitationId);
            expect(dbInvitation).toBeTruthy();
            expect(dbInvitation!.status).toBe('pending');
            expect(dbInvitation!.expiresAt.getTime()).toBeGreaterThan(Date.now());

            // Step 3: Accept invitation
            const acceptanceData = {
                code: invitationCode,
                userData: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    password: 'newUserPassword123',
                    licenseNumber: 'PCN789012'
                }
            };

            const acceptResponse = await request(app)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(200);

            expect(acceptResponse.body.success).toBe(true);
            expect(acceptResponse.body.user).toMatchObject({
                firstName: acceptanceData.userData.firstName,
                lastName: acceptanceData.userData.lastName,
                email: invitationData.email,
                workplaceRole: invitationData.role,
                workplaceId: workspace._id.toString(),
                status: 'active'
            });

            // Step 4: Verify invitation status updated
            const updatedInvitation = await Invitation.findById(invitationId);
            expect(updatedInvitation!.status).toBe('used');
            expect(updatedInvitation!.usedAt).toBeTruthy();

            // Step 5: Verify user was created and added to workspace
            const newUser = await User.findOne({ email: invitationData.email });
            expect(newUser).toBeTruthy();
            expect(newUser?.workplaceId?.toString()).toBe(workspace._id.toString());

            const updatedWorkspace = await Workplace.findById(workspace._id);
            expect(updatedWorkspace!.teamMembers).toContain(newUser!._id);
            expect(updatedWorkspace!.teamMembers).toHaveLength(2);

            // Step 6: Verify acceptance notification email was sent
            expect(mockEmailService.sendInvitationAcceptedNotification).toHaveBeenCalledWith(
                ownerUser.email,
                expect.objectContaining({
                    workspaceName: workspace.name,
                    newUserName: `${acceptanceData.userData.firstName} ${acceptanceData.userData.lastName}`,
                    newUserEmail: invitationData.email,
                    role: invitationData.role
                })
            );
        });

        it('should handle invitation expiry correctly', async () => {
            // Create invitation
            const invitation = await Invitation.create({
                email: 'expired@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                code: 'EXPIRED1',
                status: 'active',
                expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
                metadata: {
                    inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                    workspaceName: workspace.name
                }
            });

            // Try to accept expired invitation
            const acceptanceData = {
                code: 'EXPIRED1',
                userData: {
                    firstName: 'Test',
                    lastName: 'User',
                    password: 'password123'
                }
            };

            const response = await request(app)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invitation has expired');

            // Verify no user was created
            const user = await User.findOne({ email: 'expired@example.com' });
            expect(user).toBeNull();
        });

        it('should prevent duplicate invitations', async () => {
            const invitationData = {
                email: 'duplicate@example.com',
                role: 'Pharmacist'
            };

            // Create first invitation
            await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(201);

            // Try to create duplicate invitation
            const duplicateResponse = await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(400);

            expect(duplicateResponse.body.success).toBe(false);
            expect(duplicateResponse.body.error).toBe('Pending invitation already exists for this email');
        });

        it('should enforce user limits during invitation creation', async () => {
            // Create a plan with user limit of 2 (owner + 1 more)
            const limitedPlan = await SubscriptionPlan.create({
                name: 'Basic Plan',
                code: 'basic',
                tier: 'basic',
                features: ['team_management'],
                limits: { users: 2, patients: 100, locations: 1, storage: 1000, apiCalls: 1000 }
            });

            // Update workspace to use limited plan
            workspace.currentSubscriptionId = limitedPlan._id;
            await workspace.save();

            // Add one more user to reach the limit
            const existingUser = await User.create({
                firstName: 'Existing',
                lastName: 'User',
                email: 'existing@example.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                status: 'active'
            });

            workspace.teamMembers.push(existingUser._id);
            await workspace.save();

            // Try to invite another user (should exceed limit)
            const invitationData = {
                email: 'overlimit@example.com',
                role: 'Pharmacist'
            };

            const response = await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('User limit exceeded for current plan');
        });
    });

    describe('Invitation Management', () => {
        let pendingInvitation: any;

        beforeEach(async () => {
            pendingInvitation = await Invitation.create({
                email: 'pending@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                token: 'pending-token',
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date()
            });
        });

        it('should resend invitation successfully', async () => {
            const response = await request(app)
                .post(`/api/invitations/${pendingInvitation._id}/resend`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledTimes(1);
        });

        it('should revoke invitation successfully', async () => {
            const response = await request(app)
                .delete(`/api/invitations/${pendingInvitation._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify invitation was revoked
            const revokedInvitation = await Invitation.findById(pendingInvitation._id);
            expect(revokedInvitation!.status).toBe('canceled');
        });

        it('should list workspace invitations with pagination', async () => {
            // Create additional invitations
            await Invitation.create({
                email: 'test1@example.com',
                role: 'Technician',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                token: 'token1',
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date()
            });

            await Invitation.create({
                email: 'test2@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                token: 'token2',
                status: 'used',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                usedAt: new Date()
            });

            const response = await request(app)
                .get('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.invitations).toHaveLength(3);
            expect(response.body.total).toBe(3);
            expect(response.body.page).toBe(1);
            expect(response.body.totalPages).toBe(1);
        });
    });

    describe('Permission Validation', () => {
        it('should prevent non-owners from creating invitations', async () => {
            // Create a regular pharmacist user
            const pharmacistUser = await User.create({
                firstName: 'Regular',
                lastName: 'Pharmacist',
                email: 'pharmacist@testpharmacy.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist', // Not Owner
                workplaceId: workspace._id,
                status: 'active'
            });

            const pharmacistToken = jwt.sign(
                { userId: pharmacistUser._id, workplaceId: workspace._id },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            const invitationData = {
                email: 'unauthorized@example.com',
                role: 'Technician'
            };

            const response = await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${pharmacistToken}`)
                .send(invitationData)
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions to create invitations');
        });

        it('should prevent inviting users to workspaces without team_management feature', async () => {
            // Create a plan without team_management feature
            const basicPlan = await SubscriptionPlan.create({
                name: 'Basic Plan',
                code: 'basic',
                tier: 'basic',
                features: ['patient_management'], // Missing team_management
                limits: { users: 5, patients: 100, locations: 1, storage: 1000, apiCalls: 1000 }
            });

            workspace.currentSubscriptionId = basicPlan._id;
            await workspace.save();

            const invitationData = {
                email: 'nofeature@example.com',
                role: 'Pharmacist'
            };

            const response = await request(app)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(402);

            expect(response.body.error).toBe('Feature not available in current plan');
            expect(response.body.feature).toBe('team_management');
            expect(response.body.upgradeRequired).toBe(true);
        });
    });
});