"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const MedicationTherapyReview_1 = __importDefault(require("../../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../../models/DrugTherapyProblem"));
const MTRIntervention_1 = __importDefault(require("../../models/MTRIntervention"));
const MTRFollowUp_1 = __importDefault(require("../../models/MTRFollowUp"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const createTestApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        req.user = {
            _id: testUtils.createObjectId(),
            workplaceId: testUtils.createObjectId(),
            role: 'pharmacist'
        };
        next();
    });
    return app;
};
describe('MTR Integration Tests', () => {
    let app;
    let workplace;
    let user;
    let patient;
    beforeEach(async () => {
        app = createTestApp();
        const subscriptionPlan = await SubscriptionPlan_1.default.create({
            name: 'Basic Plan',
            tier: 'basic',
            priceNGN: 15000,
            billingInterval: 'monthly',
            description: 'Basic plan for testing',
            features: {
                patientLimit: 100,
                reminderSmsMonthlyLimit: 50,
                reportsExport: true,
                careNoteExport: true,
                adrModule: false,
                multiUserSupport: true,
                teamSize: 5,
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
        workplace = await Workplace_1.default.create({
            name: 'Test Pharmacy',
            type: 'Community',
            licenseNumber: 'LIC123456',
            email: 'test@pharmacy.com',
            address: '123 Test St, Test City, Lagos 12345',
            state: 'Lagos',
            ownerId: testUtils.createObjectId(),
            verificationStatus: 'verified',
            documents: [],
            inviteCode: 'TEST123',
            teamMembers: []
        });
        user = await User_1.default.create({
            workplaceId: workplace._id,
            firstName: 'Test',
            lastName: 'Pharmacist',
            email: 'pharmacist@test.com',
            passwordHash: 'hashedpassword',
            role: 'pharmacist',
            currentPlanId: subscriptionPlan._id,
            status: 'active'
        });
        patient = await Patient_1.default.create({
            workplaceId: workplace._id,
            firstName: 'John',
            lastName: 'Doe',
            mrn: 'MRN123456',
            dob: new Date('1980-01-01'),
            phone: '+2348012345678',
            createdBy: user._id
        });
        app.use((req, res, next) => {
            req.user = {
                _id: user._id,
                workplaceId: workplace._id,
                role: 'pharmacist'
            };
            next();
        });
    });
    describe('Complete MTR Workflow', () => {
        it('should complete full MTR workflow from creation to completion', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/mtr')
                .send({
                patientId: patient._id.toString(),
                priority: 'routine',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            });
            expect(createResponse.status).toBe(201);
            const mtrId = createResponse.body.data.session._id;
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
            const mtr = await MedicationTherapyReview_1.default.findById(mtrId);
            mtr.medications = medications;
            await mtr.save();
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrId}/step/medicationHistory`)
                .send({
                completed: true,
                data: { medicationsCollected: medications.length }
            });
            const problemResponse = await (0, supertest_1.default)(app)
                .post(`/api/mtr/${mtrId}/problems`)
                .send({
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin causing increased bleeding risk',
                clinicalSignificance: 'Additive anticoagulant effects increase the risk of bleeding complications',
                evidenceLevel: 'definite',
                affectedMedications: ['Warfarin', 'Aspirin']
            });
            expect(problemResponse.status).toBe(201);
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrId}/step/therapyAssessment`)
                .send({
                completed: true,
                data: { interactionsChecked: true, problemsIdentified: 1 }
            });
            const updatedMtr = await MedicationTherapyReview_1.default.findById(mtrId);
            updatedMtr.plan = {
                problems: [problemResponse.body.data.problem._id],
                recommendations: [{
                        type: 'discontinue',
                        medication: 'Aspirin',
                        rationale: 'High bleeding risk with concurrent warfarin therapy',
                        priority: 'high',
                        expectedOutcome: 'Reduced bleeding risk while maintaining anticoagulation'
                    }],
                monitoringPlan: [{
                        parameter: 'INR',
                        frequency: 'Weekly',
                        targetValue: '2.0-3.0',
                        notes: 'Monitor closely after aspirin discontinuation'
                    }],
                counselingPoints: ['Discuss bleeding precautions', 'Review signs of bleeding'],
                goals: [{
                        description: 'Maintain therapeutic anticoagulation without bleeding complications',
                        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        achieved: false
                    }],
                timeline: '2 weeks',
                pharmacistNotes: 'Patient counseled on bleeding risks and aspirin discontinuation'
            };
            await updatedMtr.save();
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrId}/step/planDevelopment`)
                .send({
                completed: true,
                data: { planCreated: true, recommendationsCount: 1 }
            });
            const interventionResponse = await (0, supertest_1.default)(app)
                .post(`/api/mtr/${mtrId}/interventions`)
                .send({
                type: 'recommendation',
                category: 'medication_change',
                description: 'Recommend discontinuing aspirin due to bleeding risk with concurrent warfarin therapy',
                rationale: 'Patient has high bleeding risk with concurrent warfarin therapy and aspirin provides minimal additional benefit',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called Dr. Smith at 2:00 PM to discuss discontinuing aspirin. Dr. Smith agreed to stop aspirin and will reassess in 2 weeks.',
                priority: 'high',
                urgency: 'within_24h',
                followUpRequired: true
            });
            expect(interventionResponse.status).toBe(201);
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrId}/step/interventions`)
                .send({
                completed: true,
                data: { interventionsRecorded: 1 }
            });
            const followUpResponse = await (0, supertest_1.default)(app)
                .post(`/api/mtr/${mtrId}/followups`)
                .send({
                type: 'phone_call',
                description: 'Follow-up call to assess bleeding status and INR results after aspirin discontinuation',
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                objectives: ['Check for bleeding symptoms', 'Review INR results', 'Assess adherence to warfarin'],
                priority: 'high'
            });
            expect(followUpResponse.status).toBe(201);
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrId}/step/followUp`)
                .send({
                completed: true,
                data: { followUpScheduled: true }
            });
            const finalMtr = await MedicationTherapyReview_1.default.findById(mtrId);
            expect(finalMtr.status).toBe('completed');
            expect(finalMtr.completedAt).toBeDefined();
            const problems = await DrugTherapyProblem_1.default.find({ reviewId: mtrId });
            expect(problems).toHaveLength(1);
            const interventions = await MTRIntervention_1.default.find({ reviewId: mtrId });
            expect(interventions).toHaveLength(1);
            const followUps = await MTRFollowUp_1.default.find({ reviewId: mtrId });
            expect(followUps).toHaveLength(1);
        });
        it('should handle drug interaction checking workflow', async () => {
            const mtr = await MedicationTherapyReview_1.default.create({
                workplaceId: workplace._id,
                patientId: patient._id,
                pharmacistId: user._id,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: user._id
            });
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
            const interactionResponse = await (0, supertest_1.default)(app)
                .post('/api/mtr/check-interactions')
                .send({ medications });
            expect(interactionResponse.status).toBe(200);
            expect(interactionResponse.body.data.hasInteractions).toBe(true);
            expect(interactionResponse.body.data.interactions.length).toBeGreaterThan(0);
            const interaction = interactionResponse.body.data.interactions[0];
            expect(interaction.severity).toBe('major');
            expect([interaction.drug1.toLowerCase(), interaction.drug2.toLowerCase()]).toContain('warfarin');
            expect([interaction.drug1.toLowerCase(), interaction.drug2.toLowerCase()]).toContain('aspirin');
        });
        it('should handle MTR reports and analytics', async () => {
            const mtr = await MedicationTherapyReview_1.default.create({
                workplaceId: workplace._id,
                patientId: patient._id,
                pharmacistId: user._id,
                reviewNumber: 'MTR-202412-0001',
                status: 'completed',
                patientConsent: true,
                confidentialityAgreed: true,
                completedAt: new Date(),
                clinicalOutcomes: {
                    problemsResolved: 2,
                    medicationsOptimized: 1,
                    adherenceImproved: true,
                    adverseEventsReduced: true,
                    costSavings: 150.00
                },
                createdBy: user._id
            });
            Object.keys(mtr.steps).forEach(stepName => {
                mtr.markStepComplete(stepName);
            });
            await mtr.save();
            await DrugTherapyProblem_1.default.create({
                workplaceId: workplace._id,
                patientId: patient._id,
                reviewId: mtr._id,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction resolved',
                clinicalSignificance: 'Bleeding risk eliminated',
                evidenceLevel: 'definite',
                status: 'resolved',
                identifiedBy: user._id,
                createdBy: user._id
            });
            await MTRIntervention_1.default.create({
                workplaceId: workplace._id,
                reviewId: mtr._id,
                patientId: patient._id,
                pharmacistId: user._id,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Medication discontinued',
                rationale: 'Safety concern',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Successful intervention',
                outcome: 'accepted',
                createdBy: user._id
            });
            const summaryResponse = await (0, supertest_1.default)(app)
                .get('/api/mtr/reports/summary')
                .query({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            });
            expect(summaryResponse.status).toBe(200);
            expect(summaryResponse.body.data.totalReviews).toBe(1);
            expect(summaryResponse.body.data.completedReviews).toBe(1);
            expect(summaryResponse.body.data.totalProblemsResolved).toBe(2);
            const effectivenessResponse = await (0, supertest_1.default)(app)
                .get('/api/mtr/reports/outcomes')
                .query({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            });
            expect(effectivenessResponse.status).toBe(200);
            expect(effectivenessResponse.body.data.interventionAcceptanceRate).toBeGreaterThan(0);
        });
        it('should handle error scenarios gracefully', async () => {
            const response1 = await (0, supertest_1.default)(app)
                .post('/api/mtr')
                .send({
                patientId: patient._id.toString(),
                patientConsent: false,
                confidentialityAgreed: true
            });
            expect(response1.status).toBe(400);
            const nonExistentId = testUtils.createObjectId();
            const response2 = await (0, supertest_1.default)(app)
                .get(`/api/mtr/${nonExistentId}`);
            expect(response2.status).toBe(404);
            const mtr = await MedicationTherapyReview_1.default.create({
                workplaceId: workplace._id,
                patientId: patient._id,
                pharmacistId: user._id,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: user._id
            });
            const response3 = await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtr._id}/step/invalidStep`)
                .send({ completed: true });
            expect(response3.status).toBe(400);
            await (0, supertest_1.default)(app)
                .post(`/api/mtr/patient/${patient._id}`)
                .send({
                patientConsent: true,
                confidentialityAgreed: true
            });
            const response4 = await (0, supertest_1.default)(app)
                .post(`/api/mtr/patient/${patient._id}`)
                .send({
                patientConsent: true,
                confidentialityAgreed: true
            });
            expect(response4.status).toBe(409);
        });
        it('should handle pagination and filtering correctly', async () => {
            const sessions = [];
            for (let i = 0; i < 15; i++) {
                const session = await MedicationTherapyReview_1.default.create({
                    workplaceId: workplace._id,
                    patientId: patient._id,
                    pharmacistId: user._id,
                    reviewNumber: `MTR-202412-${String(i + 1).padStart(4, '0')}`,
                    status: i % 2 === 0 ? 'in_progress' : 'completed',
                    priority: i % 3 === 0 ? 'urgent' : 'routine',
                    patientConsent: true,
                    confidentialityAgreed: true,
                    createdBy: user._id
                });
                sessions.push(session);
            }
            const paginationResponse = await (0, supertest_1.default)(app)
                .get('/api/mtr')
                .query({ page: 1, limit: 10 });
            expect(paginationResponse.status).toBe(200);
            expect(paginationResponse.body.data).toHaveLength(10);
            expect(paginationResponse.body.pagination.total).toBe(15);
            expect(paginationResponse.body.pagination.pages).toBe(2);
            const statusResponse = await (0, supertest_1.default)(app)
                .get('/api/mtr')
                .query({ status: 'in_progress' });
            expect(statusResponse.status).toBe(200);
            expect(statusResponse.body.data.length).toBe(8);
            const priorityResponse = await (0, supertest_1.default)(app)
                .get('/api/mtr')
                .query({ priority: 'urgent' });
            expect(priorityResponse.status).toBe(200);
            expect(priorityResponse.body.data.length).toBe(5);
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle large medication lists efficiently', async () => {
            const mtr = await MedicationTherapyReview_1.default.create({
                workplaceId: workplace._id,
                patientId: patient._id,
                pharmacistId: user._id,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: user._id
            });
            const medications = [];
            for (let i = 0; i < 50; i++) {
                medications.push({
                    drugName: `Medication ${i + 1}`,
                    strength: { value: 10 + i, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: `${10 + i} mg`,
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: `Condition ${i + 1}`
                });
            }
            const startTime = Date.now();
            mtr.medications = medications;
            await mtr.save();
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(1000);
            expect(mtr.medications).toHaveLength(50);
        });
        it('should handle concurrent MTR operations', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                const promise = MedicationTherapyReview_1.default.create({
                    workplaceId: workplace._id,
                    patientId: patient._id,
                    pharmacistId: user._id,
                    reviewNumber: `MTR-202412-${String(i + 1).padStart(4, '0')}`,
                    patientConsent: true,
                    confidentialityAgreed: true,
                    createdBy: user._id
                });
                promises.push(promise);
            }
            const startTime = Date.now();
            const results = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(results).toHaveLength(10);
            expect(duration).toBeLessThan(2000);
            const reviewNumbers = results.map(r => r.reviewNumber);
            const uniqueNumbers = new Set(reviewNumbers);
            expect(uniqueNumbers.size).toBe(10);
        });
    });
});
//# sourceMappingURL=mtrIntegration.test.js.map