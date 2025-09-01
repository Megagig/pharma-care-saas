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
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const emailService_1 = require("../../utils/emailService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../utils/emailService');
const mockEmailService = emailService_1.emailService;
describe('Team Invitation Journey E2E Tests', () => {
    let ownerUser;
    let workspace;
    let subscription;
    let premiumPlan;
    let ownerAuthToken;
    beforeEach(async () => {
        premiumPlan = await SubscriptionPlan_1.default.create({
            name: 'Premium Plan',
            code: 'premium',
            tier: 'pro',
            tierRank: 2,
            priceNGN: 35000,
            billingInterval: 'monthly',
            features: ['patient_management', 'team_management', 'advanced_reports'],
            limits: {
                patients: 500,
                users: 5,
                locations: 3,
                storage: 5000,
                apiCalls: 5000
            },
            description: 'Premium plan for growing pharmacies',
            isActive: true
        });
        subscription = await Subscription_1.default.create({
            planId: premiumPlan._id,
            workspaceId: new mongoose_1.default.Types.ObjectId(),
            tier: 'pro',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingInterval: 'monthly',
            amount: premiumPlan.priceNGN,
            priceAtPurchase: premiumPlan.priceNGN,
            currency: 'NGN',
            paymentMethod: 'card',
            autoRenew: true,
            isTrial: false
        });
        workspace = await Workplace_1.default.create({
            name: 'Team Test Pharmacy',
            type: 'Community',
            licenseNumber: 'PCN123456789',
            email: 'admin@teamtest.com',
            address: '123 Team Street, Lagos, Nigeria',
            phone: '+234-800-123-4567',
            currentSubscriptionId: subscription._id,
            teamMembers: [],
            ownerId: new mongoose_1.default.Types.ObjectId()
        });
        ownerUser = await User_1.default.create({
            firstName: 'Owner',
            lastName: 'User',
            email: 'owner@teamtest.com',
            password: 'securePassword123',
            role: 'pharmacist',
            workplaceRole: 'Owner',
            workplaceId: workspace._id,
            status: 'active',
            licenseNumber: 'PCN123456'
        });
        workspace.ownerId = ownerUser._id;
        workspace.teamMembers = [ownerUser._id];
        await workspace.save();
        subscription.workspaceId = workspace._id;
        await subscription.save();
        ownerAuthToken = jsonwebtoken_1.default.sign({ userId: ownerUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        mockEmailService.sendInvitationEmail.mockResolvedValue({ success: true, messageId: 'test-id', provider: 'test' });
        mockEmailService.sendInvitationAcceptedNotification.mockResolvedValue({ success: true, messageId: 'test-id', provider: 'test' });
        mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: 'test-id' });
    });
    describe('Complete Team Member Invitation and Onboarding Journey', () => {
        it('should complete full team invitation journey: invite → accept → onboard → collaborate', async () => {
            const invitationData = {
                email: 'pharmacist@teamtest.com',
                role: 'Pharmacist',
                firstName: 'Jane',
                lastName: 'Smith',
                personalMessage: 'Welcome to our team! Looking forward to working with you.'
            };
            const inviteResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(invitationData)
                .expect(201);
            expect(inviteResponse.body.success).toBe(true);
            expect(inviteResponse.body.invitation).toMatchObject({
                email: invitationData.email,
                role: invitationData.role,
                status: 'pending',
                workspaceId: workspace._id.toString()
            });
            const invitationCode = inviteResponse.body.invitation.code;
            expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledWith(invitationData.email, expect.objectContaining({
                workspaceName: workspace.name,
                inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                role: invitationData.role,
                personalMessage: invitationData.personalMessage,
                acceptUrl: expect.stringContaining(invitationCode)
            }));
            const invitationDetailsResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/invitations/details/${invitationCode}`)
                .expect(200);
            expect(invitationDetailsResponse.body).toMatchObject({
                workspaceName: workspace.name,
                workplaceType: workspace.type,
                inviterName: `${ownerUser.firstName} ${ownerUser.lastName}`,
                role: invitationData.role,
                isValid: true,
                expiresAt: expect.any(String)
            });
            const acceptanceData = {
                code: invitationCode,
                userData: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    password: 'newUserPassword123',
                    licenseNumber: 'PCN789012',
                    phone: '+234-800-789-0123',
                    bio: 'Experienced clinical pharmacist with 5 years in hospital pharmacy'
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
            const newUserId = acceptResponse.body.user._id;
            const newUserToken = acceptResponse.body.token;
            const updatedInvitation = await Invitation_1.default.findOne({ code: invitationCode });
            expect(updatedInvitation.status).toBe('used');
            expect(updatedInvitation.usedAt).toBeTruthy();
            const updatedWorkspace = await Workplace_1.default.findById(workspace._id);
            expect(updatedWorkspace.teamMembers.map(id => id.toString())).toContain(newUserId);
            expect(updatedWorkspace.teamMembers).toHaveLength(2);
            expect(mockEmailService.sendInvitationAcceptedNotification).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                newUserName: `${acceptanceData.userData.firstName} ${acceptanceData.userData.lastName}`,
                newUserEmail: invitationData.email,
                role: invitationData.role
            }));
            expect(mockEmailService.sendEmail).toHaveBeenCalledWith(invitationData.email, expect.objectContaining({
                firstName: acceptanceData.userData.firstName,
                workspaceName: workspace.name,
                role: invitationData.role,
                teamSize: 2,
                dashboardUrl: expect.any(String)
            }));
            const dashboardResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${newUserToken}`)
                .expect(200);
            expect(dashboardResponse.body.user.workplaceRole).toBe('Pharmacist');
            expect(dashboardResponse.body.workspace.name).toBe(workspace.name);
            expect(dashboardResponse.body.teamMembers).toHaveLength(2);
            expect(dashboardResponse.body.permissions).toContain('patient.create');
            expect(dashboardResponse.body.permissions).toContain('patient.read');
            const onboardingResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/onboarding/team-member')
                .set('Authorization', `Bearer ${newUserToken}`)
                .expect(200);
            expect(onboardingResponse.body.steps).toContain('meet_team');
            expect(onboardingResponse.body.steps).toContain('learn_workflows');
            expect(onboardingResponse.body.steps).toContain('first_patient_interaction');
            await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding/complete-step')
                .set('Authorization', `Bearer ${newUserToken}`)
                .send({ step: 'meet_team' })
                .expect(200);
            const patientData = {
                firstName: 'Collaborative',
                lastName: 'Patient',
                mrn: 'MRN001',
                dob: '1985-06-15',
                phone: '+234-800-001-0001',
                address: '789 Patient Avenue',
                createdBy: newUserId
            };
            const patientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${newUserToken}`)
                .send(patientData)
                .expect(201);
            expect(patientResponse.body.patient.createdBy).toBe(newUserId);
            expect(patientResponse.body.patient.workplaceId).toBe(workspace._id.toString());
            const activityResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/workspace/activity')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(activityResponse.body.activities).toContainEqual(expect.objectContaining({
                type: 'patient_created',
                userId: newUserId,
                userName: `${acceptanceData.userData.firstName} ${acceptanceData.userData.lastName}`,
                details: expect.objectContaining({
                    patientName: `${patientData.firstName} ${patientData.lastName}`
                })
            }));
            const unauthorizedInviteResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${newUserToken}`)
                .send({
                email: 'another@example.com',
                role: 'Technician'
            })
                .expect(403);
            expect(unauthorizedInviteResponse.body.error).toBe('Insufficient permissions to create invitations');
        });
        it('should handle invitation to technician role with appropriate permissions', async () => {
            const technicianInvitation = {
                email: 'technician@teamtest.com',
                role: 'Technician',
                firstName: 'Mike',
                lastName: 'Johnson'
            };
            const inviteResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(technicianInvitation)
                .expect(201);
            const invitationCode = inviteResponse.body.invitation.code;
            const acceptanceData = {
                code: invitationCode,
                userData: {
                    firstName: 'Mike',
                    lastName: 'Johnson',
                    password: 'techPassword123',
                    licenseNumber: 'TECH456789',
                    phone: '+234-800-456-7890'
                }
            };
            const acceptResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(200);
            const technicianToken = acceptResponse.body.token;
            const permissionsResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/permissions')
                .set('Authorization', `Bearer ${technicianToken}`)
                .expect(200);
            expect(permissionsResponse.body.permissions).toContain('patient.create');
            expect(permissionsResponse.body.permissions).toContain('patient.read');
            expect(permissionsResponse.body.permissions).not.toContain('patient.delete');
            expect(permissionsResponse.body.permissions).not.toContain('invitation.create');
            const patientData = {
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'MRN002',
                dob: '1990-01-01',
                phone: '+234-800-002-0001'
            };
            const patientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${technicianToken}`)
                .send(patientData)
                .expect(201);
            const patientId = patientResponse.body.patient._id;
            await (0, supertest_1.default)(app_1.default)
                .delete(`/api/patients/${patientId}`)
                .set('Authorization', `Bearer ${technicianToken}`)
                .expect(403);
        });
        it('should prevent invitation when user limit would be exceeded', async () => {
            const additionalUsers = [];
            for (let i = 2; i <= 5; i++) {
                const user = await User_1.default.create({
                    firstName: `User`,
                    lastName: `${i}`,
                    email: `user${i}@teamtest.com`,
                    password: 'password123',
                    role: 'pharmacist',
                    workplaceRole: 'Pharmacist',
                    workplaceId: workspace._id,
                    status: 'active',
                    licenseNumber: `PCN${i}23456`
                });
                additionalUsers.push(user);
            }
            workspace.teamMembers.push(...additionalUsers.map(u => u._id));
            await workspace.save();
            const invitationData = {
                email: 'overlimit@teamtest.com',
                role: 'Pharmacist'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(invitationData)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('User limit exceeded for current plan');
            expect(response.body.current).toBe(5);
            expect(response.body.limit).toBe(5);
            expect(response.body.upgradeRequired).toBe(true);
        });
        it('should handle invitation expiry and cleanup', async () => {
            const invitationData = {
                email: 'expired@teamtest.com',
                role: 'Pharmacist'
            };
            const inviteResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(invitationData)
                .expect(201);
            const invitationCode = inviteResponse.body.invitation.code;
            await Invitation_1.default.findOneAndUpdate({ code: invitationCode }, { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });
            const acceptanceData = {
                code: invitationCode,
                userData: {
                    firstName: 'Expired',
                    lastName: 'User',
                    password: 'password123'
                }
            };
            const acceptResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(400);
            expect(acceptResponse.body.success).toBe(false);
            expect(acceptResponse.body.error).toBe('Invitation has expired');
            const user = await User_1.default.findOne({ email: invitationData.email });
            expect(user).toBeNull();
            const cleanupResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/admin/cleanup-expired-invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(cleanupResponse.body.cleanedUp).toBeGreaterThan(0);
            const expiredInvitation = await Invitation_1.default.findOne({ code: invitationCode });
            expect(expiredInvitation.status).toBe('expired');
        });
    });
    describe('Team Management and Collaboration', () => {
        let pharmacistUser;
        let technicianUser;
        let pharmacistToken;
        let technicianToken;
        beforeEach(async () => {
            pharmacistUser = await User_1.default.create({
                firstName: 'Team',
                lastName: 'Pharmacist',
                email: 'pharmacist@teamtest.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                status: 'active',
                licenseNumber: 'PCN789012'
            });
            technicianUser = await User_1.default.create({
                firstName: 'Team',
                lastName: 'Technician',
                email: 'technician@teamtest.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Technician',
                workplaceId: workspace._id,
                status: 'active',
                licenseNumber: 'TECH123456'
            });
            workspace.teamMembers.push(pharmacistUser._id, technicianUser._id);
            await workspace.save();
            pharmacistToken = jsonwebtoken_1.default.sign({ userId: pharmacistUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
            technicianToken = jsonwebtoken_1.default.sign({ userId: technicianUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        });
        it('should enable team collaboration on patient care', async () => {
            const patientData = {
                firstName: 'Collaborative',
                lastName: 'Patient',
                mrn: 'MRN003',
                dob: '1975-03-20',
                phone: '+234-800-003-0001'
            };
            const patientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${pharmacistToken}`)
                .send(patientData)
                .expect(201);
            const patientId = patientResponse.body.patient._id;
            const noteData = {
                content: 'Patient called to confirm medication pickup time',
                type: 'communication',
                isPrivate: false
            };
            const noteResponse = await (0, supertest_1.default)(app_1.default)
                .post(`/api/patients/${patientId}/notes`)
                .set('Authorization', `Bearer ${technicianToken}`)
                .send(noteData)
                .expect(201);
            expect(noteResponse.body.note.createdBy).toBe(technicianUser._id.toString());
            const patientDetailsResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/patients/${patientId}`)
                .set('Authorization', `Bearer ${pharmacistToken}`)
                .expect(200);
            expect(patientDetailsResponse.body.patient.notes).toContainEqual(expect.objectContaining({
                content: noteData.content,
                createdBy: expect.objectContaining({
                    firstName: technicianUser.firstName,
                    lastName: technicianUser.lastName
                })
            }));
            const teamActivityResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/workspace/team-activity')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(teamActivityResponse.body.activities).toContainEqual(expect.objectContaining({
                type: 'patient_note_added',
                userId: technicianUser._id.toString(),
                patientId: patientId
            }));
        });
        it('should handle team member role changes', async () => {
            const roleChangeData = {
                newRole: 'Pharmacist'
            };
            const roleChangeResponse = await (0, supertest_1.default)(app_1.default)
                .put(`/api/team/members/${technicianUser._id}/role`)
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(roleChangeData)
                .expect(200);
            expect(roleChangeResponse.body.success).toBe(true);
            const updatedUser = await User_1.default.findById(technicianUser._id);
            expect(updatedUser.workplaceRole).toBe('Pharmacist');
            const newPermissionsResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/permissions')
                .set('Authorization', `Bearer ${technicianToken}`)
                .expect(200);
            expect(newPermissionsResponse.body.permissions).toContain('patient.delete');
        });
        it('should handle team member removal', async () => {
            const removalResponse = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/team/members/${technicianUser._id}`)
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(removalResponse.body.success).toBe(true);
            const removedUser = await User_1.default.findById(technicianUser._id);
            expect(removedUser.status).toBe('removed');
            expect(removedUser.workplaceId).toBeNull();
            const updatedWorkspace = await Workplace_1.default.findById(workspace._id);
            expect(updatedWorkspace.teamMembers.map(id => id.toString())).not.toContain(technicianUser._id.toString());
            await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${technicianToken}`)
                .expect(403);
        });
    });
});
//# sourceMappingURL=teamInvitationJourney.test.js.map