"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../../app"));
require("../setup");
const MedicationTherapyReview_1 = __importDefault(require("../../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../../models/DrugTherapyProblem"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const performanceOptimization_1 = __importDefault(require("../../scripts/performanceOptimization"));
const securityAudit_1 = __importDefault(require("../../scripts/securityAudit"));
describe('MTR Complete Integration Tests', () => {
    let authToken;
    let pharmacistId;
    let workplaceId;
    let patientId;
    let subscriptionPlan;
    let subscription;
    beforeAll(async () => {
        subscriptionPlan = await SubscriptionPlan_1.default.create({
            name: 'Test Plan',
            priceNGN: 15000,
            billingInterval: 'monthly',
            tier: 'basic',
            description: 'Test plan for integration tests',
            features: {
                patientLimit: 100,
                reminderSmsMonthlyLimit: 50,
                reportsExport: true,
                careNoteExport: true,
                adrModule: false,
                multiUserSupport: true,
                teamSize: 3,
                apiAccess: true,
                auditLogs: false,
                dataBackup: true,
                clinicalNotesLimit: null,
                patientRecordsLimit: 100,
                prioritySupport: false,
                emailReminders: true,
                smsReminders: true,
                advancedReports: false,
                drugTherapyManagement: true,
                teamManagement: true,
                dedicatedSupport: false,
                integrations: false,
                customIntegrations: false,
                adrReporting: false,
                drugInteractionChecker: true,
                doseCalculator: false,
                multiLocationDashboard: false,
                sharedPatientRecords: false,
                groupAnalytics: false,
                cdss: false
            },
            isActive: true
        });
        const workplace = await Workplace_1.default.create({
            name: 'Test Pharmacy',
            type: 'Community',
            licenseNumber: 'PCN123456',
            email: 'test@pharmacy.com',
            address: '123 Test Street',
            state: 'Lagos',
            ownerId: new mongoose_1.default.Types.ObjectId(),
            verificationStatus: 'verified'
        });
        workplaceId = workplace._id;
        const pharmacist = await User_1.default.create({
            firstName: 'Test',
            lastName: 'Pharmacist',
            email: 'pharmacist@test.com',
            passwordHash: 'hashedpassword',
            role: 'pharmacist',
            workplaceRole: 'Owner',
            workplaceId: workplaceId,
            status: 'active',
            licenseNumber: 'PCN123456',
            licenseStatus: 'approved',
            currentPlanId: subscriptionPlan._id,
            subscriptionTier: 'basic',
            features: ['patient_management', 'mtr_management'],
            permissions: ['mtr:create', 'mtr:read', 'mtr:update']
        });
        pharmacistId = pharmacist._id;
        subscription = await Subscription_1.default.create({
            workspaceId: workplaceId,
            planId: subscriptionPlan._id,
            status: 'active',
            tier: 'basic',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            priceAtPurchase: 15000,
            features: ['patient_management', 'mtr_management'],
            limits: {
                patients: 100,
                users: 3,
                locations: 1,
                storage: 1000,
                apiCalls: 1000
            }
        });
        workplace.currentSubscriptionId = subscription._id;
        workplace.currentPlanId = subscriptionPlan._id;
        await workplace.save();
        const patient = await Patient_1.default.create({
            firstName: 'Test',
            lastName: 'Patient',
            mrn: 'MRN001',
            dob: new Date('1980-01-01'),
            phone: '+2348012345678',
            workplaceId: workplaceId,
            createdBy: pharmacistId,
            isDeleted: false
        });
        patientId = patient._id;
        authToken = jsonwebtoken_1.default.sign({ userId: pharmacistId.toString() }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    });
    afterAll(async () => {
    });
    describe('Complete MTR Workflow Integration', () => {
        let mtrId;
        let problemId;
        let interventionId;
        let followUpId;
        it('should complete full MTR workflow from creation to follow-up', async () => {
            console.log('🔄 Step 1: Creating MTR Session...');
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                priority: 'high_risk',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true,
                referralSource: 'physician',
                reviewReason: 'medication optimization',
                estimatedDuration: 60
            })
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.session).toBeDefined();
            mtrId = createResponse.body.data.session._id;
            console.log('✅ MTR Session created successfully');
            console.log('🔄 Step 2: Adding medications...');
            const medications = [
                {
                    drugName: 'Warfarin',
                    strength: { value: 5, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: '5 mg',
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: 'Anticoagulation'
                },
                {
                    drugName: 'Aspirin',
                    strength: { value: 81, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: '81 mg',
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: 'Cardioprotection'
                }
            ];
            const updateResponse = await (0, supertest_1.default)(app_1.default)
                .put(`/api/mtr/${mtrId}/step/medicationHistory`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                completed: true,
                data: { medications }
            });
            if (updateResponse.status !== 200) {
                console.log('❌ Step update failed:', updateResponse.body);
            }
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.success).toBe(true);
            console.log('✅ Medications added successfully');
            console.log('🔄 Step 3: Identifying drug therapy problem...');
            const problemResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr/problems')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                reviewId: mtrId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Warfarin-Aspirin interaction increases bleeding risk',
                clinicalSignificance: 'Increased risk of major bleeding',
                affectedMedications: ['Warfarin', 'Aspirin'],
                evidenceLevel: 'definite'
            })
                .expect(201);
            expect(problemResponse.body.success).toBe(true);
            problemId = problemResponse.body.data._id;
            console.log('✅ Drug therapy problem identified');
            console.log('🔄 Step 4: Creating intervention...');
            const interventionResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr/interventions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                reviewId: mtrId,
                patientId: patientId.toString(),
                problemId: problemId,
                type: 'recommendation',
                category: 'medication_adjustment',
                description: 'Recommend discontinuing aspirin and monitoring INR more frequently',
                rationale: 'Reduce bleeding risk while maintaining anticoagulation',
                targetAudience: 'physician',
                communicationMethod: 'phone',
                priority: 'high_risk',
                urgency: 'immediate'
            })
                .expect(201);
            expect(interventionResponse.body.success).toBe(true);
            interventionId = interventionResponse.body.data._id;
            console.log('✅ Intervention created successfully');
            console.log('🔄 Step 5: Scheduling follow-up...');
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 7);
            const followUpResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr/follow-ups')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                reviewId: mtrId,
                patientId: patientId.toString(),
                type: 'medication_monitoring',
                description: 'Follow up on aspirin discontinuation and INR monitoring',
                scheduledDate: followUpDate,
                estimatedDuration: 15,
                relatedInterventions: [interventionId]
            })
                .expect(201);
            expect(followUpResponse.body.success).toBe(true);
            followUpId = followUpResponse.body.data._id;
            console.log('✅ Follow-up scheduled successfully');
            console.log('🔄 Step 6: Completing MTR...');
            const completeResponse = await (0, supertest_1.default)(app_1.default)
                .put(`/api/mtr/${mtrId}/complete`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                summary: 'MTR completed successfully. Identified drug interaction and provided recommendations.',
                clinicalOutcomes: {
                    problemsIdentified: 1,
                    interventionsProvided: 1,
                    followUpsScheduled: 1,
                    patientSatisfaction: 'high'
                }
            })
                .expect(200);
            expect(completeResponse.body.success).toBe(true);
            console.log('✅ MTR completed successfully');
            const finalMTR = await MedicationTherapyReview_1.default.findById(mtrId);
            expect(finalMTR?.status).toBe('completed');
            expect(finalMTR?.medications).toHaveLength(2);
            expect(finalMTR?.completedAt).toBeDefined();
            console.log('🎉 Complete MTR workflow integration test passed!');
        });
        it('should handle concurrent MTR sessions', async () => {
            console.log('🔄 Testing concurrent MTR sessions...');
            const concurrentRequests = Array.from({ length: 5 }, (_, index) => (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                priority: 'routine',
                reviewType: 'follow_up',
                patientConsent: true,
                confidentialityAgreed: true,
                referralSource: 'self',
                reviewReason: `Concurrent test ${index + 1}`
            }));
            const responses = await Promise.all(concurrentRequests);
            responses.forEach((response, index) => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                console.log(`✅ Concurrent MTR ${index + 1} created successfully`);
            });
            console.log('🎉 Concurrent MTR sessions test passed!');
        });
        it('should handle large medication lists efficiently', async () => {
            console.log('🔄 Testing large medication lists...');
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                priority: 'routine',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            })
                .expect(201);
            const largeMTRId = createResponse.body.data.review._id;
            const largeMedicationList = Array.from({ length: 50 }, (_, index) => ({
                drugName: `Medication${index + 1}`,
                strength: { value: 10 + index, unit: 'mg' },
                dosageForm: 'tablet',
                instructions: {
                    dose: `${10 + index} mg`,
                    frequency: 'once daily',
                    route: 'oral'
                },
                category: 'prescribed',
                startDate: new Date(),
                indication: `Indication ${index + 1}`
            }));
            const startTime = Date.now();
            const updateResponse = await (0, supertest_1.default)(app_1.default)
                .put(`/api/mtr/${largeMTRId}/step/medicationHistory`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ medications: largeMedicationList })
                .expect(200);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(updateResponse.body.success).toBe(true);
            expect(processingTime).toBeLessThan(5000);
            console.log(`✅ Large medication list (50 items) processed in ${processingTime}ms`);
            console.log('🎉 Large medication list test passed!');
        });
    });
    describe('Performance and Security Integration', () => {
        it('should pass performance optimization checks', async () => {
            console.log('🔄 Running performance optimization checks...');
            const optimizer = new performanceOptimization_1.default();
            await expect(optimizer.runOptimizations()).resolves.not.toThrow();
            console.log('✅ Performance optimization checks passed');
        });
        it('should pass security audit checks', async () => {
            console.log('🔄 Running security audit checks...');
            const auditor = new securityAudit_1.default();
            await expect(auditor.runSecurityAudit()).resolves.not.toThrow();
            console.log('✅ Security audit checks passed');
        });
        it('should handle malicious input safely', async () => {
            console.log('🔄 Testing malicious input handling...');
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                '{"$ne": null}',
                '../../../etc/passwd',
                '; DROP TABLE users; --'
            ];
            for (const maliciousInput of maliciousInputs) {
                const response = await (0, supertest_1.default)(app_1.default)
                    .post('/api/mtr')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                    patientId: maliciousInput,
                    priority: maliciousInput,
                    reviewType: maliciousInput,
                    patientConsent: true,
                    confidentialityAgreed: true
                });
                expect([400, 401, 422]).toContain(response.status);
            }
            console.log('✅ Malicious input handling test passed');
        });
    });
    describe('Data Integrity and Consistency', () => {
        it('should maintain data consistency across related models', async () => {
            console.log('🔄 Testing data consistency...');
            const mtrResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                priority: 'high_risk',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            })
                .expect(201);
            const testMTRId = mtrResponse.body.data.review._id;
            const problemResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr/problems')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                reviewId: testMTRId,
                category: 'effectiveness',
                type: 'doseTooLow',
                severity: 'moderate',
                description: 'Test problem for consistency check',
                clinicalSignificance: 'Test significance',
                affectedMedications: ['TestMed'],
                evidenceLevel: 'probable'
            })
                .expect(201);
            const testProblemId = problemResponse.body.data._id;
            const mtr = await MedicationTherapyReview_1.default.findById(testMTRId);
            const problem = await DrugTherapyProblem_1.default.findById(testProblemId);
            expect(mtr).toBeDefined();
            expect(problem).toBeDefined();
            expect(problem?.reviewId?.toString()).toBe(testMTRId);
            expect(problem?.patientId.toString()).toBe(patientId.toString());
            expect(problem?.workplaceId.toString()).toBe(workplaceId.toString());
            console.log('✅ Data consistency test passed');
        });
        it('should handle database transactions properly', async () => {
            console.log('🔄 Testing database transactions...');
            const mtrResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientId: patientId.toString(),
                priority: 'routine',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            })
                .expect(201);
            const transactionMTRId = mtrResponse.body.data.review._id;
            const mtr = await MedicationTherapyReview_1.default.findById(transactionMTRId);
            expect(mtr?.createdBy.toString()).toBe(pharmacistId.toString());
            expect(mtr?.workplaceId.toString()).toBe(workplaceId.toString());
            expect(mtr?.createdAt).toBeDefined();
            expect(mtr?.isDeleted).toBe(false);
            console.log('✅ Database transaction test passed');
        });
    });
    describe('API Response and Error Handling', () => {
        it('should return consistent API responses', async () => {
            console.log('🔄 Testing API response consistency...');
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.success).toBe(true);
            if (response.body.data.results) {
                expect(response.body.data).toHaveProperty('results');
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data).toHaveProperty('page');
                expect(response.body.data).toHaveProperty('limit');
            }
            console.log('✅ API response consistency test passed');
        });
        it('should handle errors gracefully', async () => {
            console.log('🔄 Testing error handling...');
            const notFoundResponse = await (0, supertest_1.default)(app_1.default)
                .get('/api/mtr/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(notFoundResponse.body.success).toBe(false);
            expect(notFoundResponse.body.error).toBeDefined();
            const validationResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                patientConsent: true
            })
                .expect(400);
            expect(validationResponse.body.success).toBe(false);
            expect(validationResponse.body.error).toBeDefined();
            console.log('✅ Error handling test passed');
        });
    });
});
//# sourceMappingURL=mtrCompleteIntegration.test.js.map