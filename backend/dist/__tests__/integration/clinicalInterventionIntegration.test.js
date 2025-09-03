"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const app_1 = __importDefault(require("../../app"));
const ClinicalIntervention_1 = __importDefault(require("../../models/ClinicalIntervention"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
describe('Clinical Intervention Integration Tests', () => {
    let mongoServer;
    let testWorkplaceId;
    let testUserId;
    let testPatientId;
    let authToken;
    let testUser;
    let testPatient;
    let testWorkplace;
    beforeAll(async () => {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose_1.default.connect(mongoUri);
        testWorkplaceId = new mongoose_1.default.Types.ObjectId();
        testUserId = new mongoose_1.default.Types.ObjectId();
        testPatientId = new mongoose_1.default.Types.ObjectId();
        testWorkplace = await Workplace_1.default.create({
            _id: testWorkplaceId,
            name: 'Test Pharmacy',
            type: 'pharmacy',
            address: '123 Test St',
            phone: '+2348012345678',
            email: 'test@pharmacy.com',
            createdBy: testUserId
        });
        testUser = await User_1.default.create({
            _id: testUserId,
            firstName: 'Test',
            lastName: 'Pharmacist',
            email: 'pharmacist@test.com',
            password: 'hashedpassword',
            role: 'pharmacist',
            workplaceId: testWorkplaceId,
            isEmailVerified: true,
            createdBy: testUserId
        });
        testPatient = await Patient_1.default.create({
            _id: testPatientId,
            workplaceId: testWorkplaceId,
            firstName: 'John',
            lastName: 'Doe',
            mrn: 'MRN123456',
            dob: new Date('1980-01-01'),
            phone: '+2348012345678',
            email: 'john.doe@email.com',
            createdBy: testUserId
        });
        authToken = 'Bearer mock-jwt-token';
    });
    afterAll(async () => {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
        await mongoServer.stop();
    });
    beforeEach(async () => {
        await ClinicalIntervention_1.default.deleteMany({});
    });
    describe('Complete Intervention Workflow', () => {
        it('should handle complete intervention lifecycle', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen that requires immediate attention',
                estimatedDuration: 60
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            expect(interventionId).toBeDefined();
            expect(createResponse.body.data.intervention.status).toBe('identified');
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .set('Authorization', authToken)
                .send({
                type: 'dose_adjustment',
                description: 'Reduce dose by 50% to minimize side effects',
                rationale: 'Patient experiencing dose-related adverse effects',
                expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                priority: 'primary'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .set('Authorization', authToken)
                .send({
                userId: testUserId.toString(),
                role: 'pharmacist',
                task: 'Review medication regimen and implement dose adjustment',
                notes: 'Urgent review needed due to side effects'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'in_progress',
                implementationNotes: 'Started dose adjustment process'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .set('Authorization', authToken)
                .send({
                patientResponse: 'improved',
                clinicalParameters: [{
                        parameter: 'Side Effects Severity',
                        beforeValue: '8/10',
                        afterValue: '3/10',
                        unit: 'scale',
                        improvementPercentage: 62.5
                    }],
                adverseEffects: 'None reported after dose adjustment',
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: true,
                    qualityOfLifeImproved: true
                }
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'completed'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/follow-up`)
                .set('Authorization', authToken)
                .send({
                required: true,
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                notes: 'Follow-up call to ensure continued improvement',
                nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
                .expect(200);
            const finalResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .expect(200);
            const finalIntervention = finalResponse.body.data.intervention;
            expect(finalIntervention.status).toBe('completed');
            expect(finalIntervention.strategies).toHaveLength(1);
            expect(finalIntervention.assignments).toHaveLength(1);
            expect(finalIntervention.outcomes).toBeDefined();
            expect(finalIntervention.followUp.required).toBe(true);
            expect(finalIntervention.completedAt).toBeDefined();
        });
        it('should prevent invalid status transitions', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Test intervention for status transition validation'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'completed'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'implemented'
            })
                .expect(400);
        });
        it('should enforce business rules for completion', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'adverse_drug_reaction',
                priority: 'critical',
                issueDescription: 'Patient experiencing severe adverse drug reaction requiring immediate intervention'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .set('Authorization', authToken)
                .send({
                type: 'discontinuation',
                description: 'Discontinue offending medication immediately',
                rationale: 'Severe adverse reaction poses patient safety risk',
                expectedOutcome: 'Resolution of adverse effects and improved patient safety',
                priority: 'primary'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'implemented'
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'completed'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .set('Authorization', authToken)
                .send({
                patientResponse: 'improved',
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: false
                }
            })
                .expect(200);
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({
                status: 'completed'
            })
                .expect(200);
        });
    });
    describe('Data Integrity and Validation', () => {
        it('should validate intervention data integrity', async () => {
            await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Short'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'invalid_category',
                priority: 'medium',
                issueDescription: 'Valid description that meets minimum length requirements'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'invalid_priority',
                issueDescription: 'Valid description that meets minimum length requirements'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: 'invalid-id',
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Valid description that meets minimum length requirements'
            })
                .expect(400);
        });
        it('should validate strategy data', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Valid intervention for strategy testing'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .set('Authorization', authToken)
                .send({
                type: 'invalid_type',
                description: 'Valid description',
                rationale: 'Valid rationale',
                expectedOutcome: 'Valid expected outcome that meets minimum length requirements'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .set('Authorization', authToken)
                .send({
                type: 'dose_adjustment',
                description: 'Valid description'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .set('Authorization', authToken)
                .send({
                type: 'dose_adjustment',
                description: 'Valid description',
                rationale: 'Valid rationale',
                expectedOutcome: 'Short'
            })
                .expect(400);
        });
        it('should validate assignment data', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Valid intervention for assignment testing'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .set('Authorization', authToken)
                .send({
                userId: 'invalid-id',
                role: 'pharmacist',
                task: 'Valid task description'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .set('Authorization', authToken)
                .send({
                userId: testUserId.toString(),
                role: 'invalid_role',
                task: 'Valid task description'
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .set('Authorization', authToken)
                .send({
                userId: testUserId.toString(),
                role: 'pharmacist'
            })
                .expect(400);
        });
        it('should validate outcome data', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Valid intervention for outcome testing'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .set('Authorization', authToken)
                .send({
                clinicalParameters: [],
                successMetrics: {}
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .set('Authorization', authToken)
                .send({
                patientResponse: 'invalid_response',
                clinicalParameters: [],
                successMetrics: {}
            })
                .expect(400);
            await (0, supertest_1.default)(app_1.default)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .set('Authorization', authToken)
                .send({
                patientResponse: 'improved',
                clinicalParameters: [{
                        parameter: '',
                        beforeValue: '160/90',
                        afterValue: '130/80'
                    }],
                successMetrics: {}
            })
                .expect(400);
        });
    });
    describe('Search and Filtering', () => {
        beforeEach(async () => {
            await ClinicalIntervention_1.default.create([
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    issueDescription: 'High priority drug therapy problem requiring immediate attention',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'in_progress',
                    identifiedDate: new Date('2024-12-01')
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0002',
                    category: 'adverse_drug_reaction',
                    priority: 'critical',
                    issueDescription: 'Critical adverse drug reaction requiring emergency intervention',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'completed',
                    identifiedDate: new Date('2024-12-02'),
                    completedAt: new Date('2024-12-03')
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0003',
                    category: 'medication_nonadherence',
                    priority: 'medium',
                    issueDescription: 'Medium priority medication adherence issue needing follow-up',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'planning',
                    identifiedDate: new Date('2024-12-03')
                }
            ]);
        });
        it('should filter interventions by category', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({ category: 'drug_therapy_problem' })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.interventions[0].category).toBe('drug_therapy_problem');
        });
        it('should filter interventions by priority', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({ priority: 'critical' })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.interventions[0].priority).toBe('critical');
        });
        it('should filter interventions by status', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({ status: 'completed' })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.interventions[0].status).toBe('completed');
        });
        it('should filter interventions by date range', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({
                dateFrom: '2024-12-02',
                dateTo: '2024-12-03'
            })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(2);
        });
        it('should search interventions by text', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({ search: 'CI-202412-0001' })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.interventions[0].interventionNumber).toBe('CI-202412-0001');
        });
        it('should sort interventions', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({
                sortBy: 'priority',
                sortOrder: 'asc'
            })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(3);
            expect(response.body.data.interventions[0].priority).toBe('critical');
            expect(response.body.data.interventions[1].priority).toBe('high');
            expect(response.body.data.interventions[2].priority).toBe('medium');
        });
        it('should handle pagination', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({
                page: 2,
                limit: 2
            })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.pagination.page).toBe(2);
            expect(response.body.data.pagination.limit).toBe(2);
            expect(response.body.data.pagination.total).toBe(3);
            expect(response.body.data.pagination.pages).toBe(2);
            expect(response.body.data.pagination.hasNext).toBe(false);
            expect(response.body.data.pagination.hasPrev).toBe(true);
        });
        it('should combine multiple filters', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({
                category: 'drug_therapy_problem',
                priority: 'high',
                status: 'in_progress'
            })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            const intervention = response.body.data.interventions[0];
            expect(intervention.category).toBe('drug_therapy_problem');
            expect(intervention.priority).toBe('high');
            expect(intervention.status).toBe('in_progress');
        });
    });
    describe('Patient-Specific Operations', () => {
        let otherPatientId;
        beforeEach(async () => {
            const otherPatient = await Patient_1.default.create({
                workplaceId: testWorkplaceId,
                firstName: 'Jane',
                lastName: 'Smith',
                mrn: 'MRN789012',
                dob: new Date('1975-05-15'),
                phone: '+2348087654321',
                email: 'jane.smith@email.com',
                createdBy: testUserId
            });
            otherPatientId = otherPatient._id;
            await ClinicalIntervention_1.default.create([
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    issueDescription: 'Intervention for John Doe',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'completed'
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0002',
                    category: 'adverse_drug_reaction',
                    priority: 'medium',
                    issueDescription: 'Another intervention for John Doe',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'in_progress'
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: otherPatientId,
                    interventionNumber: 'CI-202412-0003',
                    category: 'medication_nonadherence',
                    priority: 'low',
                    issueDescription: 'Intervention for Jane Smith',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'planning'
                }
            ]);
        });
        it('should get patient-specific interventions', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/clinical-interventions/patient/${testPatientId}`)
                .set('Authorization', authToken)
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(2);
            expect(response.body.data.summary).toBeDefined();
            expect(response.body.data.summary.totalInterventions).toBe(2);
            expect(response.body.data.summary.activeInterventions).toBe(1);
            expect(response.body.data.summary.completedInterventions).toBe(1);
            response.body.data.interventions.forEach((intervention) => {
                expect(intervention.patientId).toBe(testPatientId.toString());
            });
        });
        it('should filter patient interventions', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/clinical-interventions/patient/${testPatientId}`)
                .set('Authorization', authToken)
                .query({ status: 'completed' })
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.interventions[0].status).toBe('completed');
        });
        it('should return empty results for patient with no interventions', async () => {
            const newPatient = await Patient_1.default.create({
                workplaceId: testWorkplaceId,
                firstName: 'Empty',
                lastName: 'Patient',
                mrn: 'MRN000000',
                dob: new Date('1990-01-01'),
                phone: '+2348000000000',
                email: 'empty@email.com',
                createdBy: testUserId
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/clinical-interventions/patient/${newPatient._id}`)
                .set('Authorization', authToken)
                .expect(200);
            expect(response.body.data.interventions).toHaveLength(0);
            expect(response.body.data.summary.totalInterventions).toBe(0);
        });
    });
    describe('Analytics and Reporting', () => {
        beforeEach(async () => {
            await ClinicalIntervention_1.default.create([
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    issueDescription: 'Successful intervention 1',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'completed',
                    completedAt: new Date(),
                    outcomes: {
                        patientResponse: 'improved',
                        clinicalParameters: [],
                        successMetrics: {
                            problemResolved: true,
                            medicationOptimized: true,
                            adherenceImproved: true,
                            costSavings: 500
                        }
                    }
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0002',
                    category: 'adverse_drug_reaction',
                    priority: 'critical',
                    issueDescription: 'Partially successful intervention',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'completed',
                    completedAt: new Date(),
                    outcomes: {
                        patientResponse: 'improved',
                        clinicalParameters: [],
                        successMetrics: {
                            problemResolved: false,
                            medicationOptimized: true,
                            adherenceImproved: false,
                            costSavings: 200
                        }
                    }
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0003',
                    category: 'medication_nonadherence',
                    priority: 'medium',
                    issueDescription: 'Active intervention',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'in_progress'
                }
            ]);
        });
        it('should get analytics summary', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions/analytics/summary')
                .set('Authorization', authToken)
                .expect(200);
            expect(response.body.data.metrics).toBeDefined();
            expect(response.body.data.metrics.totalInterventions).toBeGreaterThan(0);
            expect(response.body.data.metrics.activeInterventions).toBeGreaterThan(0);
            expect(response.body.data.metrics.completedInterventions).toBeGreaterThan(0);
            expect(response.body.data.dateRange).toBeDefined();
        });
        it('should handle custom date range for analytics', async () => {
            const dateFrom = '2024-12-01';
            const dateTo = '2024-12-31';
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions/analytics/summary')
                .set('Authorization', authToken)
                .query({ dateFrom, dateTo })
                .expect(200);
            expect(response.body.data.dateRange.from).toBe(new Date(dateFrom).toISOString());
            expect(response.body.data.dateRange.to).toBe(new Date(dateTo).toISOString());
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle non-existent intervention ID', async () => {
            const nonExistentId = new mongoose_1.default.Types.ObjectId();
            await (0, supertest_1.default)(app_1.default)
                .get(`/api/clinical-interventions/${nonExistentId}`)
                .set('Authorization', authToken)
                .expect(404);
        });
        it('should handle non-existent patient ID', async () => {
            const nonExistentId = new mongoose_1.default.Types.ObjectId();
            await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: nonExistentId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Test intervention for non-existent patient'
            })
                .expect(404);
        });
        it('should handle malformed ObjectId', async () => {
            await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions/invalid-id')
                .set('Authorization', authToken)
                .expect(400);
        });
        it('should handle missing authorization', async () => {
            await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .expect(401);
        });
        it('should handle database connection errors gracefully', async () => {
            await mongoose_1.default.disconnect();
            await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .expect(500);
            await mongoose_1.default.connect(mongoServer.getUri());
        });
        it('should handle concurrent modifications', async () => {
            const createResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/clinical-interventions')
                .set('Authorization', authToken)
                .send({
                patientId: testPatientId.toString(),
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Test intervention for concurrent modification'
            })
                .expect(201);
            const interventionId = createResponse.body.data.intervention._id;
            const update1Promise = (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({ priority: 'high' });
            const update2Promise = (0, supertest_1.default)(app_1.default)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .set('Authorization', authToken)
                .send({ priority: 'critical' });
            const [response1, response2] = await Promise.all([update1Promise, update2Promise]);
            expect([200, 200]).toContain(response1.status);
            expect([200, 200]).toContain(response2.status);
        });
    });
    describe('Performance Tests', () => {
        beforeEach(async () => {
            const interventions = [];
            for (let i = 0; i < 50; i++) {
                interventions.push({
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: `CI-202412-${String(i + 1).padStart(4, '0')}`,
                    category: 'drug_therapy_problem',
                    priority: 'medium',
                    issueDescription: `Performance test intervention ${i + 1} with sufficient description length`,
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'identified'
                });
            }
            await ClinicalIntervention_1.default.insertMany(interventions);
        });
        it('should handle large result sets efficiently', async () => {
            const startTime = Date.now();
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({ limit: 50 })
                .expect(200);
            const endTime = Date.now();
            const executionTime = endTime - startTime;
            expect(response.body.data.interventions).toHaveLength(50);
            expect(executionTime).toBeLessThan(2000);
        });
        it('should handle complex filtering efficiently', async () => {
            const startTime = Date.now();
            await (0, supertest_1.default)(app_1.default)
                .get('/api/clinical-interventions')
                .set('Authorization', authToken)
                .query({
                category: 'drug_therapy_problem',
                priority: 'medium',
                status: 'identified',
                search: 'Performance test',
                sortBy: 'identifiedDate',
                sortOrder: 'desc'
            })
                .expect(200);
            const endTime = Date.now();
            const executionTime = endTime - startTime;
            expect(executionTime).toBeLessThan(2000);
        });
    });
});
//# sourceMappingURL=clinicalInterventionIntegration.test.js.map