"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../app"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const Invitation_1 = __importDefault(require("../../models/Invitation"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const emailService_1 = require("../../utils/emailService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../utils/emailService');
const mockEmailService = emailService_1.emailService;
describe('Invitation Workflow Integration Tests', () => {
    let ownerUser;
    let workspace;
    let subscriptionPlan;
    let authToken;
    beforeEach(async () => {
        subscriptionPlan = await SubscriptionPlan_1.default.create({
            name: 'Pro Plan',
            priceNGN: 35000,
            billingInterval: 'monthly',
            tier: 'pro',
            popularPlan: true,
            features: {
                patientLimit: 500,
                reminderSmsMonthlyLimit: 100,
                reportsExport: true,
                careNoteExport: true,
                adrModule: true,
                multiUserSupport: true,
                teamSize: 5,
                apiAccess: true,
                auditLogs: true,
                dataBackup: true,
                clinicalNotesLimit: null,
                prioritySupport: true,
                emailReminders: true,
                smsReminders: true,
                advancedReports: true,
                drugTherapyManagement: true,
                teamManagement: true,
                dedicatedSupport: false,
                adrReporting: true,
                drugInteractionChecker: true,
                doseCalculator: true,
                multiLocationDashboard: false,
                sharedPatientRecords: false,
                groupAnalytics: false,
                cdss: true
            },
            description: 'Pro plan for growing pharmacies',
            isActive: true
        });
        workspace = await Workplace_1.default.create({
            name: 'Test Pharmacy',
            type: 'Community',
            licenseNumber: 'PCN123456789',
            email: 'admin@testpharmacy.com',
            address: '123 Test Street',
            phone: '+234-800-123-4567',
            currentSubscriptionId: subscriptionPlan._id,
            currentPlanId: subscriptionPlan._id,
            subscriptionStatus: 'active',
            teamMembers: [],
            ownerId: new mongoose_1.default.Types.ObjectId()
        });
        ownerUser = await User_1.default.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'owner@testpharmacy.com',
            passwordHash: 'securePassword123',
            role: 'pharmacist',
            workplaceRole: 'Owner',
            workplaceId: workspace._id,
            status: 'active',
            licenseNumber: 'PCN123456',
            currentPlanId: subscriptionPlan._id
        });
        const subscription = await Subscription_1.default.create({
            planId: subscriptionPlan._id,
            workspaceId: workspace._id,
            tier: 'pro',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingInterval: 'monthly',
            amount: subscriptionPlan.priceNGN,
            priceAtPurchase: subscriptionPlan.priceNGN,
            currency: 'NGN',
            paymentMethod: 'card',
            autoRenew: true,
            isTrial: false
        });
        workspace.ownerId = ownerUser._id;
        workspace.teamMembers = [ownerUser._id];
        workspace.currentSubscriptionId = subscription._id;
        await workspace.save();
        authToken = jsonwebtoken_1.default.sign({ userId: ownerUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
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
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data).toMatchObject({
                email: invitationData.email,
                role: invitationData.role,
                status: 'active'
            });
            const invitationId = createResponse.body.data.invitationId;
            const invitationCode = createResponse.body.data.code;
            expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledWith(expect.objectContaining({
                email: invitationData.email,
                role: invitationData.role,
                code: invitationCode
            }));
            const dbInvitation = await Invitation_1.default.findById(invitationId);
            expect(dbInvitation).toBeTruthy();
            expect(dbInvitation.status).toBe('active');
            expect(dbInvitation.expiresAt.getTime()).toBeGreaterThan(Date.now());
            const acceptanceData = {
                code: invitationCode,
                userData: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    password: 'newUserPassword123',
                    licenseNumber: 'PCN789012'
                }
            };
            const acceptResponse = await (0, supertest_1.default)(app_1.default)
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
            const updatedInvitation = await Invitation_1.default.findById(invitationId);
            expect(updatedInvitation.status).toBe('used');
            expect(updatedInvitation.usedAt).toBeTruthy();
            const newUser = await User_1.default.findOne({ email: invitationData.email });
            expect(newUser).toBeTruthy();
            expect(newUser?.workplaceId?.toString()).toBe(workspace._id.toString());
            const updatedWorkspace = await Workplace_1.default.findById(workspace._id);
            expect(updatedWorkspace.teamMembers.map(id => id.toString())).toContain(newUser._id.toString());
            expect(updatedWorkspace.teamMembers).toHaveLength(2);
            expect(mockEmailService.sendInvitationAcceptedNotification).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                acceptedUserName: `${acceptanceData.userData.firstName} ${acceptanceData.userData.lastName}`,
                acceptedUserEmail: invitationData.email,
                role: invitationData.role,
                inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`
            }));
        });
        it('should handle invitation expiry correctly', async () => {
            const invitation = await Invitation_1.default.create({
                email: 'expired@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                code: 'EXPIRED1',
                status: 'active',
                expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                metadata: {
                    inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                    workspaceName: workspace.name
                }
            });
            const acceptanceData = {
                code: 'EXPIRED1',
                userData: {
                    firstName: 'Test',
                    lastName: 'User',
                    password: 'password123'
                }
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invitation has expired');
            const user = await User_1.default.findOne({ email: 'expired@example.com' });
            expect(user).toBeNull();
        });
        it('should prevent duplicate invitations', async () => {
            const invitationData = {
                email: 'duplicate@example.com',
                role: 'Pharmacist'
            };
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(201);
            const duplicateResponse = await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(409);
            expect(duplicateResponse.body.success).toBe(false);
            expect(duplicateResponse.body.error).toBe('Pending invitation already exists for this email');
        });
        it('should enforce user limits during invitation creation', async () => {
            const limitedPlan = await SubscriptionPlan_1.default.create({
                name: 'Basic Plan',
                priceNGN: 15000,
                billingInterval: 'monthly',
                tier: 'basic',
                popularPlan: false,
                features: {
                    patientLimit: 100,
                    reminderSmsMonthlyLimit: 50,
                    reportsExport: false,
                    careNoteExport: false,
                    adrModule: false,
                    multiUserSupport: true,
                    teamSize: 2,
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
                    cdss: false
                },
                description: 'Basic plan for small pharmacies',
                isActive: true
            });
            workspace.currentSubscriptionId = limitedPlan._id;
            await workspace.save();
            const existingUser = await User_1.default.create({
                firstName: 'Existing',
                lastName: 'User',
                email: 'existing@example.com',
                passwordHash: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                status: 'active',
                licenseNumber: 'PCN789012',
                currentPlanId: subscriptionPlan._id
            });
            workspace.teamMembers.push(existingUser._id);
            await workspace.save();
            const invitationData = {
                email: 'overlimit@example.com',
                role: 'Pharmacist'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('User limit exceeded for current plan');
        });
    });
    describe('Invitation Management', () => {
        let pendingInvitation;
        beforeEach(async () => {
            pendingInvitation = await Invitation_1.default.create({
                email: 'pending@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                code: 'PENDING1',
                status: 'active',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                metadata: {
                    inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                    workspaceName: workspace.name
                }
            });
        });
        it('should validate invitation successfully', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/invitations/${pendingInvitation.code}/validate`)
                .expect(200);
            expect(response.body.valid).toBe(true);
        });
        it('should revoke invitation successfully', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/invitations/${pendingInvitation._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            const revokedInvitation = await Invitation_1.default.findById(pendingInvitation._id);
            expect(revokedInvitation.status).toBe('canceled');
        });
        it('should list workspace invitations with pagination', async () => {
            await Invitation_1.default.create({
                email: 'test1@example.com',
                role: 'Technician',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                code: 'TOKEN001',
                status: 'active',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                metadata: {
                    inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                    workspaceName: workspace.name
                }
            });
            await Invitation_1.default.create({
                email: 'test2@example.com',
                role: 'Pharmacist',
                workspaceId: workspace._id,
                invitedBy: ownerUser._id,
                code: 'TOKEN002',
                status: 'used',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                usedAt: new Date(),
                metadata: {
                    inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                    workspaceName: workspace.name
                }
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/workspaces/${workspace._id}/invitations`)
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
            const pharmacistUser = await User_1.default.create({
                firstName: 'Regular',
                lastName: 'Pharmacist',
                email: 'pharmacist@testpharmacy.com',
                passwordHash: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                status: 'active',
                licenseNumber: 'PCN654321',
                currentPlanId: subscriptionPlan._id
            });
            const pharmacistToken = jsonwebtoken_1.default.sign({ userId: pharmacistUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
            const invitationData = {
                email: 'unauthorized@example.com',
                role: 'Technician'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${pharmacistToken}`)
                .send(invitationData)
                .expect(403);
            expect(response.body.message).toBe('Insufficient workplace role');
        });
        it('should prevent inviting users to workspaces without team_management feature', async () => {
            const basicPlan = await SubscriptionPlan_1.default.create({
                name: 'Basic Plan',
                priceNGN: 15000,
                billingInterval: 'monthly',
                tier: 'basic',
                popularPlan: false,
                features: {
                    patientLimit: 100,
                    reminderSmsMonthlyLimit: 50,
                    reportsExport: false,
                    careNoteExport: false,
                    adrModule: false,
                    multiUserSupport: false,
                    teamSize: 1,
                    apiAccess: false,
                    auditLogs: false,
                    dataBackup: false,
                    clinicalNotesLimit: 100,
                    prioritySupport: false,
                    emailReminders: true,
                    smsReminders: false,
                    advancedReports: false,
                    drugTherapyManagement: false,
                    teamManagement: false,
                    dedicatedSupport: false,
                    adrReporting: false,
                    drugInteractionChecker: false,
                    doseCalculator: false,
                    multiLocationDashboard: false,
                    sharedPatientRecords: false,
                    groupAnalytics: false,
                    cdss: false
                },
                description: 'Basic plan for individual pharmacists',
                isActive: true
            });
            workspace.currentSubscriptionId = basicPlan._id;
            await workspace.save();
            const invitationData = {
                email: 'nofeature@example.com',
                role: 'Pharmacist'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/api/workspaces/${workspace._id}/invitations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invitationData)
                .expect(403);
            expect(response.body.message).toContain('Feature not available');
            expect(response.body.upgradeRequired).toBe(true);
        });
    });
});
//# sourceMappingURL=invitationWorkflow.test.js.map