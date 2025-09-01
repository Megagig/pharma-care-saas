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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../utils/emailService');
const mockEmailService = emailService_1.emailService;
describe('Subscription Workflow Integration Tests', () => {
    let ownerUser;
    let workspace;
    let basicPlan;
    let premiumPlan;
    let enterprisePlan;
    let currentSubscription;
    let authToken;
    beforeEach(async () => {
        basicPlan = await SubscriptionPlan_1.default.create({
            name: 'Basic Plan',
            code: 'basic',
            tier: 'basic',
            tierRank: 1,
            priceNGN: 15000,
            billingInterval: 'monthly',
            features: ['patient_management', 'basic_reports'],
            limits: {
                patients: 100,
                users: 2,
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
        enterprisePlan = await SubscriptionPlan_1.default.create({
            name: 'Enterprise Plan',
            code: 'enterprise',
            tier: 'enterprise',
            tierRank: 3,
            priceNGN: 75000,
            billingInterval: 'monthly',
            features: ['*'],
            limits: {
                patients: -1,
                users: -1,
                locations: -1,
                storage: -1,
                apiCalls: -1
            },
            description: 'Enterprise plan for large organizations',
            isActive: true
        });
        currentSubscription = await Subscription_1.default.create({
            planId: basicPlan._id,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingInterval: 'monthly',
            amount: basicPlan.priceNGN,
            currency: 'NGN',
            paymentMethod: 'card',
            autoRenew: true
        });
        workspace = await Workplace_1.default.create({
            name: 'Test Pharmacy',
            type: 'pharmacy',
            address: '123 Test Street',
            phone: '+234-800-123-4567',
            subscriptionId: currentSubscription._id,
            teamMembers: []
        });
        ownerUser = await User_1.default.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'owner@testpharmacy.com',
            passwordHash: 'securePassword123',
            role: 'pharmacist',
            workplaceRole: 'Owner',
            workplaceId: workspace._id,
            currentPlanId: basicPlan._id,
            status: 'active',
            licenseNumber: 'PCN123456'
        });
        workspace.ownerId = ownerUser._id;
        workspace.teamMembers = [ownerUser._id];
        await workspace.save();
        currentSubscription.workspaceId = workspace._id;
        await currentSubscription.save();
        authToken = jsonwebtoken_1.default.sign({ userId: ownerUser._id, workplaceId: workspace._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        mockEmailService.sendSubscriptionStatusChange.mockResolvedValue({
            success: true,
            messageId: 'test-message-id'
        });
    });
    describe('Subscription Upgrade Workflow', () => {
        it('should upgrade from basic to premium plan successfully', async () => {
            const currentResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/current')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(currentResponse.body.subscription.plan.code).toBe('basic');
            expect(currentResponse.body.subscription.status).toBe('active');
            const plansResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/plans')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            const availablePlans = plansResponse.body.plans;
            expect(availablePlans).toHaveLength(3);
            const premiumPlanOption = availablePlans.find((p) => p.code === 'premium');
            expect(premiumPlanOption).toBeTruthy();
            const upgradeData = {
                newPlanId: premiumPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly'
            };
            const upgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/upgrade')
                .set('Authorization', `Bearer ${authToken}`)
                .send(upgradeData)
                .expect(200);
            expect(upgradeResponse.body.success).toBe(true);
            expect(upgradeResponse.body.subscription.plan.code).toBe('premium');
            expect(upgradeResponse.body.subscription.status).toBe('active');
            expect(upgradeResponse.body.prorationAmount).toBeDefined();
            const oldSubscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(oldSubscription.status).toBe('cancelled');
            expect(oldSubscription.cancelledAt).toBeTruthy();
            const newSubscription = await Subscription_1.default.findById(upgradeResponse.body.subscription._id);
            expect(newSubscription.planId.toString()).toBe(premiumPlan._id.toString());
            expect(newSubscription.status).toBe('active');
            expect(newSubscription.amount).toBe(premiumPlan.priceNGN);
            const updatedWorkspace = await Workplace_1.default.findById(workspace._id);
            expect(updatedWorkspace.subscriptionId.toString()).toBe(newSubscription._id.toString());
            expect(mockEmailService.sendSubscriptionStatusChange).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                changeType: 'upgrade',
                oldPlan: 'Basic Plan',
                newPlan: 'Premium Plan',
                effectiveDate: expect.any(String),
                newFeatures: expect.arrayContaining(['team_management', 'inventory_management'])
            }));
            const featureCheckResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/features')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(featureCheckResponse.body.features).toContain('team_management');
            expect(featureCheckResponse.body.features).toContain('inventory_management');
            expect(featureCheckResponse.body.limits.users).toBe(5);
            expect(featureCheckResponse.body.limits.patients).toBe(500);
        });
        it('should handle upgrade with proration calculation', async () => {
            const halfwayDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            currentSubscription.endDate = halfwayDate;
            await currentSubscription.save();
            const upgradeData = {
                newPlanId: premiumPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly'
            };
            const upgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/upgrade')
                .set('Authorization', `Bearer ${authToken}`)
                .send(upgradeData)
                .expect(200);
            const priceDifference = premiumPlan.priceNGN - basicPlan.priceNGN;
            const daysRemaining = 15;
            const expectedProration = Math.round((priceDifference * daysRemaining) / 30);
            expect(upgradeResponse.body.prorationAmount).toBe(expectedProration);
            expect(upgradeResponse.body.prorationDetails).toMatchObject({
                daysRemaining: daysRemaining,
                priceDifference: priceDifference,
                prorationAmount: expectedProration
            });
        });
    });
    describe('Subscription Downgrade Workflow', () => {
        beforeEach(async () => {
            currentSubscription.planId = premiumPlan._id;
            currentSubscription.amount = premiumPlan.priceNGN;
            await currentSubscription.save();
        });
        it('should downgrade from premium to basic plan successfully', async () => {
            const downgradeData = {
                newPlanId: basicPlan._id,
                effectiveDate: 'end_of_period'
            };
            const downgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/downgrade')
                .set('Authorization', `Bearer ${authToken}`)
                .send(downgradeData)
                .expect(200);
            expect(downgradeResponse.body.success).toBe(true);
            expect(downgradeResponse.body.effectiveDate).toBeTruthy();
            expect(downgradeResponse.body.currentSubscription.status).toBe('active');
            expect(downgradeResponse.body.scheduledChange).toMatchObject({
                type: 'downgrade',
                newPlanId: basicPlan._id.toString(),
                effectiveDate: expect.any(String)
            });
            const currentSub = await Subscription_1.default.findById(currentSubscription._id);
            expect(currentSub.status).toBe('active');
            expect(currentSub.scheduledPlanChange).toMatchObject({
                newPlanId: basicPlan._id,
                changeType: 'downgrade',
                effectiveDate: expect.any(Date)
            });
            expect(mockEmailService.sendSubscriptionStatusChange).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                changeType: 'downgrade',
                oldPlan: 'Premium Plan',
                newPlan: 'Basic Plan',
                effectiveDate: expect.any(String),
                removedFeatures: expect.arrayContaining(['team_management', 'inventory_management'])
            }));
        });
        it('should prevent immediate downgrade if usage exceeds new plan limits', async () => {
            const user2 = await User_1.default.create({
                firstName: 'User',
                lastName: 'Two',
                email: 'user2@testpharmacy.com',
                passwordHash: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                currentPlanId: basicPlan._id,
                status: 'active'
            });
            const user3 = await User_1.default.create({
                firstName: 'User',
                lastName: 'Three',
                email: 'user3@testpharmacy.com',
                passwordHash: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Technician',
                workplaceId: workspace._id,
                currentPlanId: basicPlan._id,
                status: 'active'
            });
            workspace.teamMembers = [ownerUser._id, user2._id, user3._id];
            await workspace.save();
            const downgradeData = {
                newPlanId: basicPlan._id,
                effectiveDate: 'immediate'
            };
            const downgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/downgrade')
                .set('Authorization', `Bearer ${authToken}`)
                .send(downgradeData)
                .expect(400);
            expect(downgradeResponse.body.success).toBe(false);
            expect(downgradeResponse.body.error).toBe('Cannot downgrade: current usage exceeds new plan limits');
            expect(downgradeResponse.body.violations).toContain('users');
            expect(downgradeResponse.body.currentUsage.users).toBe(3);
            expect(downgradeResponse.body.newLimits.users).toBe(2);
        });
        it('should allow scheduled downgrade even with usage violations', async () => {
            const user2 = await User_1.default.create({
                firstName: 'User',
                lastName: 'Two',
                email: 'user2@testpharmacy.com',
                passwordHash: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: workspace._id,
                currentPlanId: basicPlan._id,
                status: 'active'
            });
            workspace.teamMembers = [ownerUser._id, user2._id];
            await workspace.save();
            const downgradeData = {
                newPlanId: basicPlan._id,
                effectiveDate: 'end_of_period'
            };
            const downgradeResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/downgrade')
                .set('Authorization', `Bearer ${authToken}`)
                .send(downgradeData)
                .expect(200);
            expect(downgradeResponse.body.success).toBe(true);
            expect(downgradeResponse.body.warnings).toContain('Downgrade scheduled but current usage may exceed new plan limits');
        });
    });
    describe('Trial to Paid Conversion', () => {
        beforeEach(async () => {
            const trialPlan = await SubscriptionPlan_1.default.create({
                name: 'Trial Plan',
                code: 'trial',
                tier: 'free_trial',
                tierRank: 0,
                priceNGN: 0,
                billingInterval: 'monthly',
                features: ['patient_management'],
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
            currentSubscription.planId = trialPlan._id;
            currentSubscription.amount = 0;
            currentSubscription.isTrial = true;
            currentSubscription.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            await currentSubscription.save();
        });
        it('should convert trial to paid subscription successfully', async () => {
            const conversionData = {
                newPlanId: premiumPlan._id,
                paymentMethod: 'card',
                billingInterval: 'monthly',
                paymentDetails: {
                    cardToken: 'card_token_123',
                    billingAddress: {
                        street: '123 Test Street',
                        city: 'Lagos',
                        state: 'Lagos',
                        country: 'Nigeria'
                    }
                }
            };
            const conversionResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/convert-trial')
                .set('Authorization', `Bearer ${authToken}`)
                .send(conversionData)
                .expect(200);
            expect(conversionResponse.body.success).toBe(true);
            expect(conversionResponse.body.subscription.plan.code).toBe('premium');
            expect(conversionResponse.body.subscription.isTrial).toBe(false);
            expect(conversionResponse.body.subscription.trialEndsAt).toBeNull();
            const oldSubscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(oldSubscription.status).toBe('cancelled');
            const newSubscription = await Subscription_1.default.findById(conversionResponse.body.subscription._id);
            expect(newSubscription.isTrial).toBe(false);
            expect(newSubscription.amount).toBe(premiumPlan.priceNGN);
            expect(newSubscription.paymentMethod).toBe('card');
        });
        it('should handle trial expiration and paywall mode', async () => {
            currentSubscription.trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
            currentSubscription.status = 'trial_expired';
            await currentSubscription.save();
            const featureResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/subscriptions/features')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(featureResponse.body.trialExpired).toBe(true);
            expect(featureResponse.body.paywallMode).toBe(true);
            expect(featureResponse.body.availableFeatures).toEqual(['basic_access']);
            const patientResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                firstName: 'Test',
                lastName: 'Patient',
                mrn: 'MRN123'
            })
                .expect(402);
            expect(patientResponse.body.error).toBe('Trial expired - subscription required');
            expect(patientResponse.body.upgradeRequired).toBe(true);
        });
    });
    describe('Subscription Cancellation', () => {
        it('should cancel subscription at end of period', async () => {
            const cancellationData = {
                reason: 'switching_providers',
                feedback: 'Found a better solution for our needs',
                effectiveDate: 'end_of_period'
            };
            const cancellationResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/cancel')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cancellationData)
                .expect(200);
            expect(cancellationResponse.body.success).toBe(true);
            expect(cancellationResponse.body.effectiveDate).toBeTruthy();
            expect(cancellationResponse.body.accessUntil).toBeTruthy();
            const subscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(subscription.status).toBe('active');
            expect(subscription.cancelledAt).toBeTruthy();
            expect(subscription.cancellationReason).toBe('switching_providers');
            expect(subscription.willCancelAt).toBeTruthy();
            expect(mockEmailService.sendSubscriptionStatusChange).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                changeType: 'cancellation',
                effectiveDate: expect.any(String),
                accessUntil: expect.any(String)
            }));
        });
        it('should handle immediate cancellation', async () => {
            const cancellationData = {
                reason: 'no_longer_needed',
                effectiveDate: 'immediate'
            };
            const cancellationResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/cancel')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cancellationData)
                .expect(200);
            expect(cancellationResponse.body.success).toBe(true);
            const subscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(subscription.status).toBe('cancelled');
            expect(subscription.endDate.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });
    describe('Billing and Payment', () => {
        it('should handle failed payment and retry logic', async () => {
            const failedPaymentData = {
                subscriptionId: currentSubscription._id,
                paymentStatus: 'failed',
                errorCode: 'insufficient_funds',
                errorMessage: 'Insufficient funds in account'
            };
            const paymentResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/payment-webhook')
                .send(failedPaymentData)
                .expect(200);
            expect(paymentResponse.body.success).toBe(true);
            const subscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(subscription.status).toBe('payment_failed');
            expect(subscription.paymentFailures).toBe(1);
            expect(subscription.nextRetryDate).toBeTruthy();
            expect(mockEmailService.sendPaymentFailedNotification).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                amount: basicPlan.priceNGN,
                nextRetryDate: expect.any(String),
                updatePaymentUrl: expect.any(String)
            }));
        });
        it('should suspend subscription after multiple payment failures', async () => {
            currentSubscription.paymentFailures = 3;
            currentSubscription.status = 'payment_failed';
            await currentSubscription.save();
            const failedPaymentData = {
                subscriptionId: currentSubscription._id,
                paymentStatus: 'failed',
                errorCode: 'card_declined'
            };
            await (0, supertest_1.default)(app_1.default)
                .post('/api/subscriptions/payment-webhook')
                .send(failedPaymentData)
                .expect(200);
            const subscription = await Subscription_1.default.findById(currentSubscription._id);
            expect(subscription.status).toBe('suspended');
            expect(subscription.suspendedAt).toBeTruthy();
            expect(mockEmailService.sendSubscriptionSuspended).toHaveBeenCalledWith(ownerUser.email, expect.objectContaining({
                workspaceName: workspace.name,
                suspensionReason: 'payment_failure',
                reactivationUrl: expect.any(String)
            }));
        });
    });
});
//# sourceMappingURL=subscriptionWorkflow.test.js.map