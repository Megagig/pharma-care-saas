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
const Patient_1 = __importDefault(require("../../models/Patient"));
const emailService_1 = require("../../utils/emailService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock('../../utils/emailService');
const mockEmailService = emailService_1.emailService;
describe('Plan Upgrade and Trial Expiration Journey E2E Tests', () => {
    let ownerUser;
    let workspace;
    let trialSubscription;
    let trialPlan;
    let basicPlan;
    let premiumPlan;
    let ownerAuthToken;
    beforeEach(async () => {
        trialPlan = await SubscriptionPlan_1.default.create({
            name: 'Trial Plan',
            code: 'trial',
            tier: 'free_trial',
            tierRank: 0,
            priceNGN: 0,
            billingInterval: 'monthly',
            features: ['patient_management', 'basic_reports'],
            limits: {
                patients: 10,
                users: 1,
                locations: 1,
                storage: 100,
                apiCalls: 100
            },
            description: '14-day free trial',
            isActive: true,
            isTrial: true
        });
        basicPlan = await SubscriptionPlan_1.default.create({
            name: 'Basic Plan',
            code: 'basic',
            tier: 'basic',
            tierRank: 1,
            priceNGN: 15000,
            billingInterval: 'monthly',
            features: ['patient_management', 'basic_reports', 'team_management'],
            limits: {
                patients: 100,
                users: 3,
                locations: 1,
                storage: 1000,
                apiCalls: 1000
            },
            description: 'Basic plan for small pharmacies',
            isActive: true
        });
        premiumPlan = await SubscriptionPlan_1.default.create({
            name: 'Premium Plan',
            code: 'premium',
            tier: 'pro',
            tierRank: 2,
            priceNGN: 35000,
            billingInterval: 'monthly',
            features: ['patient_management', 'team_management', 'advanced_reports', 'inventory_management'],
            limits: {
                patients: 500,
                users: 5,
                locations: 3,
                storage: 5000,
                apiCalls: 5000
            },
            description: 'Premium plan for growing pharmacies',
            isActive: true,
            popularPlan: true
        });
        trialSubscription = await Subscription_1.default.create({
            planId: trialPlan._id,
            workspaceId: new mongoose_1.default.Types.ObjectId(),
            tier: 'free_trial',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            billingInterval: 'monthly',
            amount: 0,
            priceAtPurchase: 0,
            currency: 'NGN',
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
        workspace = await Workplace_1.default.create({
            name: 'Upgrade Test Pharmacy',
            type: 'pharmacy',
            address: '123 Upgrade Street, Lagos, Nigeria',
            phone: '+234-800-123-4567',
            currentSubscriptionId: trialSubscription._id,
            teamMembers: []
        });
        ownerUser = await User_1.default.create({
            firstName: 'Upgrade',
            lastName: 'Owner',
            email: 'owner@upgradetest.com',
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
        trialSubscription.workspaceId = workspace._id;
        await trialSubscription.save();
        ownerAuthToken = jsonwebtoken_1.default.sign({ userId: ownerUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        mockEmailService.sendSubscriptionUpgrade.mockResolvedValue({ success: true, messageId: 'test-id' });
        mockEmailService.sendSubscriptionDowngrade.mockResolvedValue({ success: true, messageId: 'test-id' });
        mockEmailService.sendTrialExpiryWarning.mockResolvedValue({ provider: 'test', success: true, messageId: 'test-id' });
        mockEmailService.sendTrialExpired.mockResolvedValue({ success: true, messageId: 'test-id' });
    });
    describe('Trial to Paid Plan Upgrade Journey', () => {
        it('should complete full upgrade journey: trial usage → upgrade decision → payment → immediate access', async () => {
            const patients = [];
            for (let i = 1; i <= 8; i++) {
                const patientData = {
                    firstName: `Patient`,
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: '1980-01-01',
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`
                };
                const patientResponse = await (0, supertest_1.default)(app_1.default)
                    .post('/api/patients')
                    .set('Authorization', `Bearer ${ownerAuthToken}`)
                    .send(patientData)
                    .expect(201);
                patients.push(patientResponse.body.patient);
            }
            const usageResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/usage')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(usageResponse.body.usage.patients.current).toBe(8);
            expect(usageResponse.body.usage.patients.percentage).toBe(80);
            expect(usageResponse.body.warnings).toContain('Approaching patient limit');
            const recommendationsResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/recommendations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(recommendationsResponse.body.recommendedPlan).toBe('basic');
            expect(recommendationsResponse.body.reasons).toContain('Patient limit nearly reached');
            const plansResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/plans')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            const availablePlans = plansResponse.body.plans;
            expect(availablePlans).toHaveLength(3);
            const premiumPlanOption = availablePlans.find((p) => p.code === 'premium');
            expect(premiumPlanOption.upgradeHighlights).toContain('500 patient limit');
            expect(premiumPlanOption.upgradeHighlights).toContain('Team management');
            const upgradeData = {
                newPlanId: premiumPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly',
                paymentDetails: {
                    cardToken: 'card_token_123',
                    billingAddress: {
                        street: '123 Upgrade Street',
                        city: 'Lagos',
                        state: 'Lagos',
                        country: 'Nigeria'
                    }
                }
            };
            const upgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/upgrade')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(upgradeData)
                .expect(200);
            expect(upgradeResponse.body.success).toBe(true);
            expect(upgradeResponse.body.subscription.plan.code).toBe('premium');
            expect(upgradeResponse.body.subscription.status).toBe('active');
            expect(upgradeResponse.body.subscription.isTrial).toBe(false);
            const newSubscriptionId = upgradeResponse.body.subscription._id;
            const oldSubscription = await Subscription_1.default.findById(trialSubscription._id);
            expect(oldSubscription.status).toBe('canceled');
            const updatedWorkspace = await Workplace_1.default.findById(workspace._id);
            expect(updatedWorkspace.currentSubscriptionId.toString()).toBe(newSubscriptionId);
            expect(mockEmailService.sendSubscriptionUpgrade).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                oldPlan: 'Trial Plan',
                newPlan: 'Premium Plan',
                newFeatures: expect.arrayContaining(['inventory_management', 'advanced_reports']),
                effectiveDate: expect.any(String)
            }));
            const featuresResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/features')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(featuresResponse.body.features).toContain('inventory_management');
            expect(featuresResponse.body.features).toContain('advanced_reports');
            expect(featuresResponse.body.limits.patients).toBe(500);
            expect(featuresResponse.body.limits.users).toBe(5);
            const inventoryData = {
                name: 'Paracetamol 500mg',
                sku: 'PAR500',
                category: 'analgesic',
                quantity: 100,
                unitPrice: 50,
                expiryDate: '2025-12-31'
            };
            const inventoryResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(inventoryData)
                .expect(201);
            expect(inventoryResponse.body.item.name).toBe(inventoryData.name);
            for (let i = 9; i <= 15; i++) {
                const patientData = {
                    firstName: `Patient`,
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: '1980-01-01',
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`
                };
                await (0, supertest_1.default)(app_1.default)
                    .post('/api/patients')
                    .set('Authorization', `Bearer ${ownerAuthToken}`)
                    .send(patientData)
                    .expect(201);
            }
            const newUsageResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/usage')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(newUsageResponse.body.usage.patients.current).toBe(15);
            expect(newUsageResponse.body.usage.patients.limit).toBe(500);
            expect(newUsageResponse.body.usage.patients.percentage).toBe(3);
        });
        it('should handle upgrade with team member invitation capability', async () => {
            const upgradeData = {
                newPlanId: premiumPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly'
            };
            await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/upgrade')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(upgradeData)
                .expect(200);
            const invitationData = {
                email: 'pharmacist@upgradetest.com',
                role: 'Pharmacist',
                firstName: 'Team',
                lastName: 'Member'
            };
            const inviteResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(invitationData)
                .expect(201);
            expect(inviteResponse.body.success).toBe(true);
            expect(inviteResponse.body.invitation.email).toBe(invitationData.email);
            const acceptanceData = {
                token: inviteResponse.body.invitation.token,
                userData: {
                    firstName: 'Team',
                    lastName: 'Member',
                    password: 'teamPassword123',
                    licenseNumber: 'PCN789012'
                }
            };
            const acceptResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/invitations/accept')
                .send(acceptanceData)
                .expect(200);
            expect(acceptResponse.body.success).toBe(true);
            const teamMemberToken = acceptResponse.body.token;
            const dashboardResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${teamMemberToken}`)
                .expect(200);
            expect(dashboardResponse.body.workspace.name).toBe(workspace.name);
            expect(dashboardResponse.body.user.workplaceRole).toBe('Pharmacist');
        });
    });
    describe('Trial Expiration and Paywall Mode Journey', () => {
        it('should handle trial expiration with grace period and paywall activation', async () => {
            const soonToExpire = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            trialSubscription.trialEndsAt = soonToExpire;
            trialSubscription.endDate = soonToExpire;
            await trialSubscription.save();
            const trialStatusResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/trial-status')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(trialStatusResponse.body.isTrial).toBe(true);
            expect(trialStatusResponse.body.daysRemaining).toBe(3);
            expect(trialStatusResponse.body.showUpgradePrompt).toBe(true);
            expect(trialStatusResponse.body.urgencyLevel).toBe('high');
            const warningEmailResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/admin/send-trial-warnings')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(warningEmailResponse.body.emailsSent).toBeGreaterThan(0);
            expect(mockEmailService.sendTrialExpiryWarning).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                daysRemaining: 3,
                upgradeUrl: expect.any(String),
                planRecommendations: expect.any(Array)
            }));
            trialSubscription.trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
            trialSubscription.status = 'trial_expired';
            await trialSubscription.save();
            const expiredStatusResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/trial-status')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(expiredStatusResponse.body.isTrial).toBe(true);
            expect(expiredStatusResponse.body.isExpired).toBe(true);
            expect(expiredStatusResponse.body.paywallMode).toBe(true);
            expect(expiredStatusResponse.body.gracePeriodDays).toBe(7);
            const dashboardResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(dashboardResponse.body.paywallMode).toBe(true);
            expect(dashboardResponse.body.availableFeatures).toEqual(['basic_access', 'view_data']);
            expect(dashboardResponse.body.blockedFeatures).toContain('patient_management');
            const blockedPatientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send({
                firstName: 'Blocked',
                lastName: 'Patient',
                mrn: 'MRN999'
            })
                .expect(402);
            expect(blockedPatientResponse.body.error).toBe('Trial expired - subscription required');
            expect(blockedPatientResponse.body.upgradeRequired).toBe(true);
            expect(blockedPatientResponse.body.upgradeUrl).toBeTruthy();
            const existingPatients = await Patient_1.default.create([
                {
                    firstName: 'Existing',
                    lastName: 'Patient',
                    mrn: 'MRN001',
                    dob: new Date('1980-01-01'),
                    workplaceId: workspace._id
                }
            ]);
            const readPatientResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/patients/${existingPatients[0]._id}`)
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(readPatientResponse.body.patient.firstName).toBe('Existing');
            expect(readPatientResponse.body.readOnly).toBe(true);
            const upgradeFromExpiredData = {
                newPlanId: basicPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly'
            };
            const upgradeFromExpiredResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/upgrade')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(upgradeFromExpiredData)
                .expect(200);
            expect(upgradeFromExpiredResponse.body.success).toBe(true);
            expect(upgradeFromExpiredResponse.body.subscription.status).toBe('active');
            expect(upgradeFromExpiredResponse.body.subscription.isTrial).toBe(false);
            const restoredAccessResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send({
                firstName: 'Restored',
                lastName: 'Patient',
                mrn: 'MRN002',
                dob: '1985-05-15'
            })
                .expect(201);
            expect(restoredAccessResponse.body.patient.firstName).toBe('Restored');
        });
        it('should handle grace period expiration and account suspension', async () => {
            const expiredBeyondGrace = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            trialSubscription.trialEndsAt = expiredBeyondGrace;
            trialSubscription.status = 'suspended';
            await trialSubscription.save();
            const suspendedResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(403);
            expect(suspendedResponse.body.error).toBe('Account suspended - payment required');
            expect(suspendedResponse.body.suspensionReason).toBe('trial_expired');
            expect(suspendedResponse.body.reactivationRequired).toBe(true);
            const reactivationData = {
                newPlanId: basicPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly'
            };
            const reactivationResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/reactivate')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(reactivationData)
                .expect(200);
            expect(reactivationResponse.body.success).toBe(true);
            expect(reactivationResponse.body.subscription.status).toBe('active');
            const restoredDashboardResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .expect(200);
            expect(restoredDashboardResponse.body.workspace.name).toBe(workspace.name);
            expect(restoredDashboardResponse.body.subscription.status).toBe('active');
        });
    });
    describe('Plan Downgrade Journey', () => {
        beforeEach(async () => {
            const premiumSubscription = await Subscription_1.default.create({
                planId: premiumPlan._id,
                workspaceId: workspace._id,
                tier: 'pro',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                billingInterval: 'monthly',
                amount: premiumPlan.priceNGN,
                priceAtPurchase: premiumPlan.priceNGN,
                currency: 'NGN',
                isTrial: false
            });
            workspace.currentSubscriptionId = premiumSubscription._id;
            await workspace.save();
            trialSubscription.status = 'cancelled';
            await trialSubscription.save();
        });
        it('should handle downgrade with usage validation and scheduling', async () => {
            const teamMember = await User_1.default.create({
                firstName: 'Team',
                lastName: 'Member',
                email: 'team@upgradetest.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                status: 'active',
                licenseNumber: 'PCN789012'
            });
            workspace.teamMembers.push(teamMember._id);
            await workspace.save();
            const immediateDowngradeData = {
                newPlanId: basicPlan._id,
                effectiveDate: 'immediate'
            };
            const blockedDowngradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/downgrade')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(immediateDowngradeData)
                .expect(400);
            expect(blockedDowngradeResponse.body.success).toBe(false);
            expect(blockedDowngradeResponse.body.error).toBe('Cannot downgrade: current usage exceeds new plan limits');
            expect(blockedDowngradeResponse.body.violations).toContain('users');
            const scheduledDowngradeData = {
                newPlanId: basicPlan._id,
                effectiveDate: 'end_of_period'
            };
            const scheduledDowngradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/downgrade')
                .set('Authorization', `Bearer ${ownerAuthToken}`)
                .send(scheduledDowngradeData)
                .expect(200);
            expect(scheduledDowngradeResponse.body.success).toBe(true);
            expect(scheduledDowngradeResponse.body.scheduledChange.type).toBe('downgrade');
            expect(scheduledDowngradeResponse.body.warnings).toContain('Downgrade scheduled but current usage may exceed new plan limits');
            expect(mockEmailService.sendSubscriptionDowngrade).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                oldPlan: 'Premium Plan',
                newPlan: 'Basic Plan',
                effectiveDate: expect.any(String),
                removedFeatures: expect.arrayContaining(['inventory_management', 'advanced_reports'])
            }));
        });
    });
});
//# sourceMappingURL=planUpgradeJourney.test.js.map