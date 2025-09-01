"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mtrController = __importStar(require("../../controllers/mtrController"));
const MedicationTherapyReview_1 = __importDefault(require("../../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../../models/DrugTherapyProblem"));
const MTRIntervention_1 = __importDefault(require("../../models/MTRIntervention"));
const MTRFollowUp_1 = __importDefault(require("../../models/MTRFollowUp"));
const Patient_1 = __importDefault(require("../../models/Patient"));
let mockAuthMiddleware = (req, res, next) => {
    req.user = {
        _id: testUtils.createObjectId(),
        workplaceId: testUtils.createObjectId(),
        role: 'pharmacist'
    };
    next();
};
jest.mock('../../utils/responseHelpers', () => ({
    sendSuccess: jest.fn((res, data, message, status = 200) => {
        res.status(status).json({ success: true, data, message });
    }),
    sendError: jest.fn((res, type, message, status = 400, details = null) => {
        res.status(status).json({ success: false, error: { type, message, details } });
    }),
    respondWithPaginatedResults: jest.fn((res, data, total, page, limit, message) => {
        res.json({
            success: true,
            data,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            message
        });
    }),
    asyncHandler: (fn) => fn,
    ensureResourceExists: jest.fn((resource, name, id) => {
        if (!resource) {
            throw new Error(`${name} not found`);
        }
    }),
    checkTenantAccess: jest.fn(),
    getRequestContext: jest.fn((req) => ({
        userId: req.user._id,
        workplaceId: req.user.workplaceId,
        isAdmin: req.user.role === 'admin'
    })),
    createAuditLog: jest.fn()
}));
jest.mock('../../services/auditService', () => ({
    default: {
        logMTRActivity: jest.fn(),
        createAuditContext: jest.fn()
    }
}));
describe('MTR Controller', () => {
    let app;
    let workplaceId;
    let patientId;
    let pharmacistId;
    let patient;
    beforeEach(async () => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(mockAuthMiddleware);
        workplaceId = testUtils.createObjectId();
        patientId = testUtils.createObjectId();
        pharmacistId = testUtils.createObjectId();
        patient = await Patient_1.default.create({
            workplaceId,
            firstName: 'John',
            lastName: 'Doe',
            mrn: 'MRN123456',
            dob: new Date('1980-01-01'),
            phone: '+2348012345678',
            createdBy: pharmacistId
        });
        patientId = patient._id;
        mockAuthMiddleware = (req, res, next) => {
            req.user = {
                _id: pharmacistId,
                workplaceId: workplaceId,
                role: 'pharmacist'
            };
            next();
        };
    });
    describe('GET /api/mtr', () => {
        beforeEach(async () => {
            await MedicationTherapyReview_1.default.create([
                {
                    workplaceId,
                    patientId,
                    pharmacistId,
                    reviewNumber: 'MTR-202412-0001',
                    status: 'in_progress',
                    priority: 'routine',
                    patientConsent: true,
                    confidentialityAgreed: true,
                    createdBy: pharmacistId
                },
                {
                    workplaceId,
                    patientId,
                    pharmacistId,
                    reviewNumber: 'MTR-202412-0002',
                    status: 'completed',
                    priority: 'urgent',
                    patientConsent: true,
                    confidentialityAgreed: true,
                    createdBy: pharmacistId
                }
            ]);
        });
        it('should get MTR sessions with pagination', async () => {
            app.get('/api/mtr', mtrController.getMTRSessions);
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr?page=1&limit=10')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination).toBeDefined();
        });
        it('should filter MTR sessions by status', async () => {
            app.get('/api/mtr', mtrController.getMTRSessions);
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr?status=in_progress')
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].status).toBe('in_progress');
        });
        it('should filter MTR sessions by priority', async () => {
            app.get('/api/mtr', mtrController.getMTRSessions);
            const response = await (0, supertest_1.default)(app)
                .get('/api/mtr?priority=urgent')
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].priority).toBe('urgent');
        });
    });
    describe('GET /api/mtr/:id', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        it('should get specific MTR session', async () => {
            app.get('/api/mtr/:id', mtrController.getMTRSession);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/mtr/${mtrSession._id}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session._id).toBe(mtrSession._id.toString());
            expect(response.body.data.session.completionPercentage).toBeDefined();
            expect(response.body.data.session.nextStep).toBeDefined();
        });
        it('should return 404 for non-existent MTR session', async () => {
            app.get('/api/mtr/:id', mtrController.getMTRSession);
            const nonExistentId = testUtils.createObjectId();
            await (0, supertest_1.default)(app)
                .get(`/api/mtr/${nonExistentId}`)
                .expect(404);
        });
    });
    describe('POST /api/mtr', () => {
        it('should create new MTR session', async () => {
            app.post('/api/mtr', mtrController.createMTRSession);
            const mtrData = {
                patientId: patientId.toString(),
                priority: 'routine',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/mtr')
                .send(mtrData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session.patientId).toBe(patientId.toString());
            expect(response.body.data.session.reviewNumber).toMatch(/^MTR-\d{6}-\d{4}$/);
        });
        it('should fail without patient consent', async () => {
            app.post('/api/mtr', mtrController.createMTRSession);
            const mtrData = {
                patientId: patientId.toString(),
                patientConsent: false,
                confidentialityAgreed: true
            };
            await (0, supertest_1.default)(app)
                .post('/api/mtr')
                .send(mtrData)
                .expect(400);
        });
        it('should fail without confidentiality agreement', async () => {
            app.post('/api/mtr', mtrController.createMTRSession);
            const mtrData = {
                patientId: patientId.toString(),
                patientConsent: true,
                confidentialityAgreed: false
            };
            await (0, supertest_1.default)(app)
                .post('/api/mtr')
                .send(mtrData)
                .expect(400);
        });
    });
    describe('PUT /api/mtr/:id', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        it('should update MTR session', async () => {
            app.put('/api/mtr/:id', mtrController.updateMTRSession);
            const updates = {
                priority: 'urgent',
                reviewReason: 'Patient experiencing side effects'
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrSession._id}`)
                .send(updates)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session.priority).toBe('urgent');
        });
        it('should not allow updating completed sessions by non-admin', async () => {
            app.put('/api/mtr/:id', mtrController.updateMTRSession);
            mtrSession.status = 'completed';
            await mtrSession.save();
            const updates = { priority: 'urgent' };
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrSession._id}`)
                .send(updates)
                .expect(403);
        });
    });
    describe('DELETE /api/mtr/:id', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        it('should soft delete MTR session', async () => {
            app.delete('/api/mtr/:id', mtrController.deleteMTRSession);
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/mtr/${mtrSession._id}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            const deletedSession = await MedicationTherapyReview_1.default.findById(mtrSession._id);
            expect(deletedSession?.isDeleted).toBe(true);
        });
        it('should not allow deleting completed sessions by non-admin', async () => {
            app.delete('/api/mtr/:id', mtrController.deleteMTRSession);
            mtrSession.status = 'completed';
            await mtrSession.save();
            await (0, supertest_1.default)(app)
                .delete(`/api/mtr/${mtrSession._id}`)
                .expect(403);
        });
    });
    describe('PUT /api/mtr/:id/step/:stepName', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        it('should update workflow step', async () => {
            app.put('/api/mtr/:id/step/:stepName', mtrController.updateMTRStep);
            const stepData = {
                completed: true,
                data: { medicationsCollected: 5 }
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrSession._id}/step/medicationHistory`)
                .send(stepData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session.steps.medicationHistory.completed).toBe(true);
        });
        it('should reject invalid step names', async () => {
            app.put('/api/mtr/:id/step/:stepName', mtrController.updateMTRStep);
            const stepData = { completed: true };
            await (0, supertest_1.default)(app)
                .put(`/api/mtr/${mtrSession._id}/step/invalidStep`)
                .send(stepData)
                .expect(400);
        });
    });
    describe('GET /api/mtr/:id/progress', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        it('should get workflow progress', async () => {
            app.get('/api/mtr/:id/progress', mtrController.getMTRProgress);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/mtr/${mtrSession._id}/progress`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.completionPercentage).toBeDefined();
            expect(response.body.data.nextStep).toBeDefined();
            expect(response.body.data.canComplete).toBeDefined();
            expect(response.body.data.steps).toBeDefined();
        });
    });
    describe('Drug Therapy Problems', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        describe('GET /api/mtr/:id/problems', () => {
            it('should get problems for MTR session', async () => {
                await DrugTherapyProblem_1.default.create({
                    workplaceId,
                    patientId,
                    reviewId: mtrSession._id,
                    category: 'safety',
                    type: 'interaction',
                    severity: 'major',
                    description: 'Drug interaction detected',
                    clinicalSignificance: 'Increased bleeding risk',
                    evidenceLevel: 'definite',
                    identifiedBy: pharmacistId,
                    createdBy: pharmacistId
                });
                app.get('/api/mtr/:id/problems', mtrController.getMTRProblems);
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/mtr/${mtrSession._id}/problems`)
                    .expect(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.problems).toHaveLength(1);
            });
        });
        describe('POST /api/mtr/:id/problems', () => {
            it('should create new problem', async () => {
                app.post('/api/mtr/:id/problems', mtrController.createMTRProblem);
                const problemData = {
                    category: 'safety',
                    type: 'interaction',
                    severity: 'major',
                    description: 'Drug interaction between warfarin and aspirin',
                    clinicalSignificance: 'Increased bleeding risk due to additive effects',
                    evidenceLevel: 'definite',
                    affectedMedications: ['Warfarin', 'Aspirin']
                };
                const response = await (0, supertest_1.default)(app)
                    .post(`/api/mtr/${mtrSession._id}/problems`)
                    .send(problemData)
                    .expect(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.problem.type).toBe('interaction');
            });
        });
    });
    describe('Interventions', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        describe('GET /api/mtr/:id/interventions', () => {
            it('should get interventions for MTR session', async () => {
                await MTRIntervention_1.default.create({
                    workplaceId,
                    reviewId: mtrSession._id,
                    patientId,
                    pharmacistId,
                    type: 'recommendation',
                    category: 'medication_change',
                    description: 'Recommend discontinuing aspirin',
                    rationale: 'High bleeding risk with warfarin',
                    targetAudience: 'prescriber',
                    communicationMethod: 'phone',
                    documentation: 'Called prescriber to discuss',
                    createdBy: pharmacistId
                });
                app.get('/api/mtr/:id/interventions', mtrController.getMTRInterventions);
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/mtr/${mtrSession._id}/interventions`)
                    .expect(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.interventions).toHaveLength(1);
            });
        });
        describe('POST /api/mtr/:id/interventions', () => {
            it('should create new intervention', async () => {
                app.post('/api/mtr/:id/interventions', mtrController.createMTRIntervention);
                const interventionData = {
                    type: 'recommendation',
                    category: 'medication_change',
                    description: 'Recommend discontinuing aspirin due to bleeding risk',
                    rationale: 'Patient has high bleeding risk with concurrent warfarin therapy',
                    targetAudience: 'prescriber',
                    communicationMethod: 'phone',
                    documentation: 'Called Dr. Smith to discuss discontinuing aspirin'
                };
                const response = await (0, supertest_1.default)(app)
                    .post(`/api/mtr/${mtrSession._id}/interventions`)
                    .send(interventionData)
                    .expect(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.intervention.type).toBe('recommendation');
            });
        });
    });
    describe('Follow-ups', () => {
        let mtrSession;
        beforeEach(async () => {
            mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
        });
        describe('GET /api/mtr/:id/followups', () => {
            it('should get follow-ups for MTR session', async () => {
                await MTRFollowUp_1.default.create({
                    workplaceId,
                    reviewId: mtrSession._id,
                    patientId,
                    type: 'phone_call',
                    description: 'Follow-up call to assess adherence',
                    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    assignedTo: pharmacistId,
                    createdBy: pharmacistId
                });
                app.get('/api/mtr/:id/followups', mtrController.getMTRFollowUps);
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/mtr/${mtrSession._id}/followups`)
                    .expect(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.followUps).toHaveLength(1);
            });
        });
        describe('POST /api/mtr/:id/followups', () => {
            it('should create new follow-up', async () => {
                app.post('/api/mtr/:id/followups', mtrController.createMTRFollowUp);
                const followUpData = {
                    type: 'phone_call',
                    description: 'Follow-up call to assess medication adherence',
                    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    objectives: ['Check adherence', 'Assess side effects']
                };
                const response = await (0, supertest_1.default)(app)
                    .post(`/api/mtr/${mtrSession._id}/followups`)
                    .send(followUpData)
                    .expect(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.followUp.type).toBe('phone_call');
            });
        });
    });
    describe('Patient-specific operations', () => {
        describe('GET /api/mtr/patient/:patientId', () => {
            beforeEach(async () => {
                await MedicationTherapyReview_1.default.create([
                    {
                        workplaceId,
                        patientId,
                        pharmacistId,
                        reviewNumber: 'MTR-202412-0001',
                        patientConsent: true,
                        confidentialityAgreed: true,
                        createdBy: pharmacistId
                    },
                    {
                        workplaceId,
                        patientId,
                        pharmacistId,
                        reviewNumber: 'MTR-202412-0002',
                        patientConsent: true,
                        confidentialityAgreed: true,
                        createdBy: pharmacistId
                    }
                ]);
            });
            it('should get patient MTR history', async () => {
                app.get('/api/mtr/patient/:patientId', mtrController.getPatientMTRHistory);
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/mtr/patient/${patientId}`)
                    .expect(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
            });
        });
        describe('POST /api/mtr/patient/:patientId', () => {
            it('should create MTR session for specific patient', async () => {
                app.post('/api/mtr/patient/:patientId', mtrController.createPatientMTRSession);
                const mtrData = {
                    priority: 'routine',
                    reviewType: 'initial',
                    patientConsent: true,
                    confidentialityAgreed: true
                };
                const response = await (0, supertest_1.default)(app)
                    .post(`/api/mtr/patient/${patientId}`)
                    .send(mtrData)
                    .expect(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.session.patientId).toBe(patientId.toString());
            });
            it('should prevent creating duplicate active sessions', async () => {
                await MedicationTherapyReview_1.default.create({
                    workplaceId,
                    patientId,
                    pharmacistId,
                    reviewNumber: 'MTR-202412-0001',
                    status: 'in_progress',
                    patientConsent: true,
                    confidentialityAgreed: true,
                    createdBy: pharmacistId
                });
                app.post('/api/mtr/patient/:patientId', mtrController.createPatientMTRSession);
                const mtrData = {
                    patientConsent: true,
                    confidentialityAgreed: true
                };
                await (0, supertest_1.default)(app)
                    .post(`/api/mtr/patient/${patientId}`)
                    .send(mtrData)
                    .expect(409);
            });
        });
    });
});
//# sourceMappingURL=mtrController.test.js.map