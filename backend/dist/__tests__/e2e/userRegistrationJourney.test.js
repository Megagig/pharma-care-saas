"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const emailService_1 = require("../../utils/emailService");
jest.mock('../../utils/emailService');
const mockEmailService = emailService_1.emailService;
describe('User Registration Journey E2E Tests', () => {
    let trialPlan;
    let basicPlan;
    beforeEach(async () => {
        trialPlan = await SubscriptionPlan_1.default.create({
            name: 'Free Trial',
            tier: 'free_trial',
            priceNGN: 0,
            billingInterval: 'monthly',
            trialDuration: 14,
            description: '14-day free trial',
            isActive: true,
            features: {
                patientLimit: null,
                reminderSmsMonthlyLimit: null,
                reportsExport: true,
                careNoteExport: true,
                adrModule: true,
                multiUserSupport: false,
                teamSize: 1,
                apiAccess: true,
                auditLogs: true,
                dataBackup: true,
                clinicalNotesLimit: null,
                prioritySupport: false,
                emailReminders: true,
                smsReminders: false,
                advancedReports: true,
                drugTherapyManagement: true,
                teamManagement: false,
                dedicatedSupport: false,
                adrReporting: true,
                drugInteractionChecker: true,
                doseCalculator: true,
                multiLocationDashboard: false,
                sharedPatientRecords: false,
                groupAnalytics: false,
                cdss: true
            }
        });
        basicPlan = await SubscriptionPlan_1.default.create({
            name: 'Basic Plan',
            tier: 'basic',
            priceNGN: 15000,
            billingInterval: 'monthly',
            description: 'Basic plan for small pharmacies',
            isActive: true,
            features: {
                patientLimit: 100,
                reminderSmsMonthlyLimit: 50,
                reportsExport: true,
                careNoteExport: true,
                adrModule: false,
                multiUserSupport: true,
                teamSize: 3,
                apiAccess: false,
                auditLogs: false,
                dataBackup: true,
                clinicalNotesLimit: null,
                prioritySupport: false,
                emailReminders: true,
                smsReminders: true,
                advancedReports: false,
                drugTherapyManagement: true,
                teamManagement: true,
                dedicatedSupport: false,
                adrReporting: false,
                drugInteractionChecker: true,
                doseCalculator: true,
                multiLocationDashboard: false,
                sharedPatientRecords: false,
                groupAnalytics: false,
                cdss: false
            }
        });
        mockEmailService.sendTrialActivation.mockResolvedValue({ success: true, messageId: 'test-message-id' });
    });
    describe('New User Registration with Workspace Creation', () => {
        it('should complete full registration journey: signup → workspace creation → trial activation', async () => {
            const registrationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@newpharmacy.com',
                password: 'SecurePassword123!',
                licenseNumber: 'PCN123456',
                workplaceFlow: 'create',
                workplace: {
                    name: 'Doe Family Pharmacy',
                    type: 'pharmacy',
                    licenseNumber: 'PH123456',
                    email: 'info@doepharmacy.com',
                    address: '123 Main Street, Lagos, Nigeria',
                    phone: '+234-800-123-4567'
                }
            };
            const registrationResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(registrationData);
            if (registrationResponse.status !== 201) {
                console.log('Registration failed:', registrationResponse.status, registrationResponse.body);
            }
            expect(registrationResponse.status).toBe(201);
            expect(registrationResponse.body.success).toBe(true);
            expect(registrationResponse.body.user).toMatchObject({
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                email: registrationData.email,
                role: 'pharmacist',
                workplaceRole: 'Owner',
                status: 'active'
            });
            const userId = registrationResponse.body.user._id;
            const workspaceId = registrationResponse.body.user.workplaceId;
            const authToken = registrationResponse.body.token;
            const workspace = await Workplace_1.default.findById(workspaceId);
            expect(workspace).toBeTruthy();
            expect(workspace.name).toBe(registrationData.workplace.name);
            expect(workspace.type).toBe(registrationData.workplace.type);
            expect(workspace.address).toBe(registrationData.workplace.address);
            expect(workspace.ownerId.toString()).toBe(userId);
            expect(workspace.teamMembers.map((id) => id.toString())).toContain(userId);
            expect(workspace.currentSubscriptionId).toBeTruthy();
            const subscription = await Subscription_1.default.findById(workspace.currentSubscriptionId).populate('planId');
            expect(subscription).toBeTruthy();
            expect(subscription.status).toBe('active');
            expect(subscription.isTrial).toBe(true);
            expect(subscription.trialEndDate).toBeTruthy();
            expect(subscription.planId.tier).toBe('trial');
            const trialDays = Math.ceil((subscription.trialEndDate.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
            expect(trialDays).toBe(14);
            expect(mockEmailService.sendTrialActivation).toHaveBeenCalledWith(registrationData.email, expect.objectContaining({
                firstName: registrationData.firstName,
                workspaceName: registrationData.workplace.name,
                trialEndsAt: expect.any(String),
                dashboardUrl: expect.any(String)
            }));
            expect(mockEmailService.sendTrialActivation).toHaveBeenCalledWith(registrationData.email, expect.objectContaining({
                workspaceName: registrationData.workplace.name,
                trialDuration: 14,
                trialEndsAt: expect.any(String),
                planFeatures: expect.arrayContaining(['patient_management', 'basic_reports']),
                upgradeUrl: expect.any(String)
            }));
            const dashboardResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(dashboardResponse.body.workspace).toMatchObject({
                name: registrationData.workplace.name,
                type: registrationData.workplace.type
            });
            expect(dashboardResponse.body.subscription).toMatchObject({
                status: 'active',
                isTrial: true,
                plan: { code: 'trial' }
            });
            expect(dashboardResponse.body.availableFeatures).toContain('patient_management');
            expect(dashboardResponse.body.limits).toMatchObject({
                patients: 10,
                users: 1,
                locations: 1
            });
            const patientData = {
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'MRN001',
                dob: '1980-01-01',
                phone: '+234-800-001-0001',
                address: '456 Patient Street'
            };
            const patientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData)
                .expect(201);
            expect(patientResponse.body.patient).toMatchObject({
                firstName: patientData.firstName,
                lastName: patientData.lastName,
                mrn: patientData.mrn,
                workplaceId: workspaceId
            });
            const usageResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/usage')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(usageResponse.body.usage).toMatchObject({
                patients: { current: 1, limit: 10, percentage: 10 },
                users: { current: 1, limit: 1, percentage: 100 },
                locations: { current: 1, limit: 1, percentage: 100 }
            });
        });
        it('should handle registration with existing email gracefully', async () => {
            const registrationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'existing@example.com',
                password: 'SecurePassword123!',
                licenseNumber: 'PCN123456',
                workplaceName: 'First Pharmacy',
                workplaceType: 'pharmacy',
                workplaceAddress: '123 Main Street',
                workplacePhone: '+234-800-123-4567'
            };
            await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(registrationData)
                .expect(201);
            const duplicateData = {
                ...registrationData,
                firstName: 'Jane',
                workplaceName: 'Second Pharmacy'
            };
            const duplicateResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(duplicateData)
                .expect(400);
            expect(duplicateResponse.body.success).toBe(false);
            expect(duplicateResponse.body.error).toBe('User with this email already exists');
            const workspaces = await Workplace_1.default.find({ name: 'Second Pharmacy' });
            expect(workspaces).toHaveLength(0);
        });
        it('should validate required fields during registration', async () => {
            const incompleteData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'incomplete@example.com',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(incompleteData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Password is required');
            expect(response.body.errors).toContain('License number is required');
            expect(response.body.errors).toContain('Workplace name is required');
        });
        it('should handle registration failure and cleanup partial data', async () => {
            const originalCreate = Subscription_1.default.create;
            Subscription_1.default.create = jest.fn().mockRejectedValue(new Error('Database error'));
            const registrationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'cleanup.test@example.com',
                password: 'SecurePassword123!',
                licenseNumber: 'PCN123456',
                workplaceName: 'Cleanup Test Pharmacy',
                workplaceType: 'pharmacy',
                workplaceAddress: '123 Test Street',
                workplacePhone: '+234-800-123-4567'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(registrationData)
                .expect(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Registration failed');
            const user = await User_1.default.findOne({ email: registrationData.email });
            expect(user).toBeNull();
            const workspace = await Workplace_1.default.findOne({ name: registrationData.workplaceName });
            expect(workspace).toBeNull();
            Subscription_1.default.create = originalCreate;
        });
    });
    describe('Registration with Different Workplace Types', () => {
        it('should handle hospital registration with appropriate defaults', async () => {
            const hospitalData = {
                firstName: 'Dr. Sarah',
                lastName: 'Johnson',
                email: 'sarah.johnson@cityhospital.com',
                password: 'SecurePassword123!',
                licenseNumber: 'MD789012',
                workplaceName: 'City General Hospital',
                workplaceType: 'hospital',
                workplaceAddress: '789 Hospital Drive, Abuja, Nigeria',
                workplacePhone: '+234-800-789-0123'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(hospitalData)
                .expect(201);
            expect(response.body.success).toBe(true);
            const workspaceId = response.body.user.workplaceId;
            const workspace = await Workplace_1.default.findById(workspaceId).populate({
                path: 'subscriptionId',
                populate: { path: 'planId' }
            });
            expect(workspace.type).toBe('hospital');
            const subscription = workspace.currentSubscriptionId;
            expect(subscription.planId.code).toBe('trial');
            expect(subscription.isTrial).toBe(true);
        });
        it('should handle clinic registration with appropriate defaults', async () => {
            const clinicData = {
                firstName: 'Dr. Michael',
                lastName: 'Brown',
                email: 'michael.brown@familyclinic.com',
                password: 'SecurePassword123!',
                licenseNumber: 'MD345678',
                workplaceName: 'Family Health Clinic',
                workplaceType: 'clinic',
                workplaceAddress: '456 Clinic Avenue, Port Harcourt, Nigeria',
                workplacePhone: '+234-800-456-7890'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(clinicData)
                .expect(201);
            expect(response.body.success).toBe(true);
            const workspaceId = response.body.user.workplaceId;
            const workspace = await Workplace_1.default.findById(workspaceId);
            expect(workspace.type).toBe('clinic');
            expect(workspace.name).toBe(clinicData.workplaceName);
        });
    });
    describe('Post-Registration User Experience', () => {
        let authToken;
        let userId;
        let workspaceId;
        beforeEach(async () => {
            const registrationData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test.user@example.com',
                password: 'SecurePassword123!',
                licenseNumber: 'PCN999999',
                workplaceName: 'Test Pharmacy',
                workplaceType: 'pharmacy',
                workplaceAddress: '999 Test Street',
                workplacePhone: '+234-800-999-9999'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register-with-workplace')
                .send(registrationData)
                .expect(201);
            authToken = response.body.token;
            userId = response.body.user._id;
            workspaceId = response.body.user.workplaceId;
        });
        it('should provide onboarding guidance for new users', async () => {
            const onboardingResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/onboarding/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(onboardingResponse.body.isNewUser).toBe(true);
            expect(onboardingResponse.body.completedSteps).toEqual([]);
            expect(onboardingResponse.body.nextSteps).toContain('complete_profile');
            expect(onboardingResponse.body.nextSteps).toContain('add_first_patient');
            expect(onboardingResponse.body.nextSteps).toContain('explore_features');
        });
        it('should track onboarding progress', async () => {
            await (0, supertest_1.default)(app_1.default)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bio: 'Experienced pharmacist with 10 years in community pharmacy',
                specializations: ['clinical_pharmacy', 'medication_therapy_management']
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding/complete-step')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ step: 'complete_profile' })
                .expect(200);
            const statusResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/onboarding/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(statusResponse.body.completedSteps).toContain('complete_profile');
            expect(statusResponse.body.nextSteps).not.toContain('complete_profile');
            expect(statusResponse.body.progress).toBe(33);
        });
        it('should provide trial usage guidance and warnings', async () => {
            for (let i = 1; i <= 8; i++) {
                await (0, supertest_1.default)(app_1.default)
                    .post('/api/patients')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                    firstName: `Patient`,
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: '1980-01-01',
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`
                })
                    .expect(201);
            }
            const usageResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/usage')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(usageResponse.body.usage.patients.current).toBe(8);
            expect(usageResponse.body.usage.patients.percentage).toBe(80);
            expect(usageResponse.body.warnings).toContain('Approaching patient limit');
            expect(usageResponse.body.recommendations).toContain('Consider upgrading to Basic plan');
            for (let i = 9; i <= 10; i++) {
                await (0, supertest_1.default)(app_1.default)
                    .post('/api/patients')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                    firstName: `Patient`,
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: '1980-01-01',
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`
                })
                    .expect(201);
            }
            const blockedResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                firstName: 'Patient',
                lastName: '11',
                mrn: 'MRN011',
                dob: '1980-01-01',
                phone: '+234-800-001-0011'
            })
                .expect(403);
            expect(blockedResponse.body.error).toBe('Patient limit exceeded');
            expect(blockedResponse.body.upgradeRequired).toBe(true);
        });
        it('should provide upgrade recommendations based on usage patterns', async () => {
            for (let i = 1; i <= 10; i++) {
                await (0, supertest_1.default)(app_1.default)
                    .post('/api/patients')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                    firstName: `Patient`,
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: '1980-01-01',
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`
                })
                    .expect(201);
            }
            const recommendationsResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/recommendations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(recommendationsResponse.body.currentPlan).toBe('trial');
            expect(recommendationsResponse.body.recommendedPlan).toBe('basic');
            expect(recommendationsResponse.body.reasons).toContain('Patient limit reached');
            expect(recommendationsResponse.body.benefits).toContain('100 patient limit');
            expect(recommendationsResponse.body.benefits).toContain('Team management features');
        });
    });
});
//# sourceMappingURL=userRegistrationJourney.test.js.map