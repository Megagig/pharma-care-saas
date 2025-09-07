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
const mongoose_1 = __importDefault(require("mongoose"));
const clinicalInterventionController = __importStar(require("../../controllers/clinicalInterventionController"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
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
    asyncHandler: (fn) => fn,
    getRequestContext: jest.fn((req) => ({
        userId: req.user._id,
        workplaceId: req.user.workplaceId,
        isAdmin: req.user.role === 'admin'
    })),
    createValidationError: jest.fn((message) => {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }),
    createNotFoundError: jest.fn((message) => {
        const error = new Error(message);
        error.name = 'NotFoundError';
        return error;
    }),
    createBusinessRuleError: jest.fn((message) => {
        const error = new Error(message);
        error.name = 'BusinessRuleError';
        return error;
    })
}));
jest.mock('../../services/clinicalInterventionService', () => ({
    default: {
        createIntervention: jest.fn(),
        updateIntervention: jest.fn(),
        getInterventions: jest.fn(),
        getInterventionById: jest.fn(),
        deleteIntervention: jest.fn(),
        addStrategy: jest.fn(),
        updateStrategy: jest.fn(),
        assignTeamMember: jest.fn(),
        updateAssignmentStatus: jest.fn(),
        recordOutcome: jest.fn(),
        scheduleFollowUp: jest.fn(),
        advancedSearch: jest.fn(),
        getPatientInterventionSummary: jest.fn(),
        getUserAssignments: jest.fn(),
        getUserAssignmentStats: jest.fn(),
        getDashboardMetrics: jest.fn(),
        logInterventionAccess: jest.fn()
    }
}));
describe('ClinicalInterventionController - Comprehensive Tests', () => {
    let app;
    let workplaceId;
    let patientId;
    let pharmacistId;
    let patient;
    let user;
    let workplace;
    beforeEach(async () => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(mockAuthMiddleware);
        workplaceId = testUtils.createObjectId();
        patientId = testUtils.createObjectId();
        pharmacistId = testUtils.createObjectId();
        workplace = await Workplace_1.default.create({
            _id: workplaceId,
            name: 'Test Pharmacy',
            type: 'pharmacy',
            address: '123 Test St',
            phone: '+2348012345678',
            email: 'test@pharmacy.com',
            createdBy: pharmacistId
        });
        user = await User_1.default.create({
            _id: pharmacistId,
            firstName: 'Test',
            lastName: 'Pharmacist',
            email: 'pharmacist@test.com',
            password: 'hashedpassword',
            role: 'pharmacist',
            workplaceId: workplaceId,
            isEmailVerified: true,
            createdBy: pharmacistId
        });
        patient = await Patient_1.default.create({
            _id: patientId,
            workplaceId: workplaceId,
            firstName: 'John',
            lastName: 'Doe',
            mrn: 'MRN123456',
            dob: new Date('1980-01-01'),
            phone: '+2348012345678',
            email: 'john.doe@email.com',
            createdBy: pharmacistId
        });
        mockAuthMiddleware = (req, res, next) => {
            req.user = {
                _id: pharmacistId,
                workplaceId: workplaceId,
                role: 'pharmacist'
            };
            next();
        };
        jest.clearAllMocks();
    });
    describe('GET /api/clinical-interventions', () => {
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getInterventions.mockResolvedValue({
                data: [
                    {
                        _id: testUtils.createObjectId(),
                        interventionNumber: 'CI-202412-0001',
                        category: 'drug_therapy_problem',
                        priority: 'high',
                        status: 'in_progress',
                        issueDescription: 'Test issue description',
                        patientId: patientId,
                        identifiedBy: pharmacistId
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    pages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            });
        });
        it('should get interventions with default pagination', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            const response = await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.pagination).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                workplaceId: workplaceId,
                page: 1,
                limit: 20,
                sortBy: 'identifiedDate',
                sortOrder: 'desc'
            }));
        });
        it('should handle query parameters correctly', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .query({
                page: '2',
                limit: '10',
                category: 'drug_therapy_problem',
                priority: 'high',
                status: 'in_progress',
                patientId: patientId.toString(),
                search: 'test search',
                sortBy: 'priority',
                sortOrder: 'asc'
            })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                workplaceId: workplaceId,
                page: 2,
                limit: 10,
                category: 'drug_therapy_problem',
                priority: 'high',
                status: 'in_progress',
                patientId: patientId,
                search: 'test search',
                sortBy: 'priority',
                sortOrder: 'asc'
            }));
        });
        it('should handle date filters', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            const dateFrom = '2024-12-01';
            const dateTo = '2024-12-31';
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .query({ dateFrom, dateTo })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo)
            }));
        });
        it('should validate ObjectId formats', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .query({ patientId: 'invalid-id' })
                .expect(400);
        });
        it('should validate date formats', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .query({ dateFrom: 'invalid-date' })
                .expect(400);
        });
        it('should enforce pagination limits', async () => {
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .query({ limit: '100' })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                limit: 50
            }));
        });
    });
    describe('POST /api/clinical-interventions', () => {
        const validInterventionData = {
            patientId: patientId.toString(),
            category: 'drug_therapy_problem',
            priority: 'high',
            issueDescription: 'Patient experiencing side effects from current medication regimen',
            strategies: [{
                    type: 'dose_adjustment',
                    description: 'Reduce dose by 50%',
                    rationale: 'Patient experiencing side effects',
                    expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                    priority: 'primary'
                }],
            estimatedDuration: 60
        };
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.createIntervention.mockResolvedValue({
                _id: testUtils.createObjectId(),
                interventionNumber: 'CI-202412-0001',
                ...validInterventionData,
                patientId: patientId,
                identifiedBy: pharmacistId,
                workplaceId: workplaceId,
                status: 'planning'
            });
        });
        it('should create intervention with valid data', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            const response = await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(validInterventionData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.createIntervention).toHaveBeenCalledWith(expect.objectContaining({
                patientId: patientId,
                category: 'drug_therapy_problem',
                priority: 'high',
                identifiedBy: pharmacistId,
                workplaceId: workplaceId
            }));
        });
        it('should validate required fields', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            const invalidData = {
                category: 'drug_therapy_problem',
                priority: 'high'
            };
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(invalidData)
                .expect(400);
        });
        it('should validate ObjectId formats', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            const invalidData = {
                ...validInterventionData,
                patientId: 'invalid-id'
            };
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(invalidData)
                .expect(400);
        });
        it('should handle related MTR and DTP IDs', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            const dataWithRelations = {
                ...validInterventionData,
                relatedMTRId: testUtils.createObjectId().toString(),
                relatedDTPIds: [testUtils.createObjectId().toString(), testUtils.createObjectId().toString()]
            };
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(dataWithRelations)
                .expect(201);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.createIntervention).toHaveBeenCalledWith(expect.objectContaining({
                relatedMTRId: expect.any(mongoose_1.default.Types.ObjectId),
                relatedDTPIds: expect.arrayContaining([
                    expect.any(mongoose_1.default.Types.ObjectId),
                    expect.any(mongoose_1.default.Types.ObjectId)
                ])
            }));
        });
        it('should validate related ID formats', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            const invalidData = {
                ...validInterventionData,
                relatedMTRId: 'invalid-id'
            };
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(invalidData)
                .expect(400);
        });
        it('should log intervention access', async () => {
            app.post('/api/clinical-interventions', clinicalInterventionController.createClinicalIntervention);
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions')
                .send(validInterventionData)
                .expect(201);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.logInterventionAccess).toHaveBeenCalledWith(expect.any(String), pharmacistId, workplaceId, 'create', expect.any(Object), expect.objectContaining({
                category: 'drug_therapy_problem',
                priority: 'high'
            }));
        });
    });
    describe('GET /api/clinical-interventions/:id', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getInterventionById.mockResolvedValue({
                _id: interventionId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                status: 'in_progress',
                issueDescription: 'Test issue description',
                patientId: patientId,
                identifiedBy: pharmacistId,
                strategies: [],
                assignments: []
            });
        });
        it('should get intervention by ID', async () => {
            app.get('/api/clinical-interventions/:id', clinicalInterventionController.getClinicalIntervention);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/clinical-interventions/${interventionId}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventionById).toHaveBeenCalledWith(interventionId, workplaceId);
        });
        it('should validate ID format', async () => {
            app.get('/api/clinical-interventions/:id', clinicalInterventionController.getClinicalIntervention);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/invalid-id')
                .expect(400);
        });
        it('should log intervention access', async () => {
            app.get('/api/clinical-interventions/:id', clinicalInterventionController.getClinicalIntervention);
            await (0, supertest_1.default)(app)
                .get(`/api/clinical-interventions/${interventionId}`)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.logInterventionAccess).toHaveBeenCalledWith(interventionId, pharmacistId, workplaceId, 'view', expect.any(Object), expect.objectContaining({
                interventionNumber: 'CI-202412-0001',
                status: 'in_progress',
                category: 'drug_therapy_problem'
            }));
        });
    });
    describe('PATCH /api/clinical-interventions/:id', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.updateIntervention.mockResolvedValue({
                _id: interventionId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'critical',
                status: 'in_progress',
                issueDescription: 'Updated issue description',
                patientId: patientId,
                identifiedBy: pharmacistId
            });
        });
        it('should update intervention with valid data', async () => {
            app.patch('/api/clinical-interventions/:id', clinicalInterventionController.updateClinicalIntervention);
            const updates = {
                priority: 'critical',
                issueDescription: 'Updated issue description with more detailed information',
                implementationNotes: 'Added implementation notes'
            };
            const response = await (0, supertest_1.default)(app)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .send(updates)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.updateIntervention).toHaveBeenCalledWith(interventionId, updates, pharmacistId, workplaceId);
        });
        it('should validate ID format', async () => {
            app.patch('/api/clinical-interventions/:id', clinicalInterventionController.updateClinicalIntervention);
            await (0, supertest_1.default)(app)
                .patch('/api/clinical-interventions/invalid-id')
                .send({ priority: 'high' })
                .expect(400);
        });
        it('should require at least one field to update', async () => {
            app.patch('/api/clinical-interventions/:id', clinicalInterventionController.updateClinicalIntervention);
            await (0, supertest_1.default)(app)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .send({})
                .expect(400);
        });
        it('should handle outcomes update', async () => {
            app.patch('/api/clinical-interventions/:id', clinicalInterventionController.updateClinicalIntervention);
            const updates = {
                outcomes: {
                    patientResponse: 'improved',
                    clinicalParameters: [{
                            parameter: 'Blood Pressure',
                            beforeValue: '160/90',
                            afterValue: '130/80',
                            unit: 'mmHg',
                            improvementPercentage: 20
                        }],
                    successMetrics: {
                        problemResolved: true,
                        medicationOptimized: true,
                        adherenceImproved: false
                    }
                }
            };
            await (0, supertest_1.default)(app)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .send(updates)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.updateIntervention).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                outcomes: expect.objectContaining({
                    patientResponse: 'improved'
                })
            }), pharmacistId, workplaceId);
        });
        it('should log intervention access', async () => {
            app.patch('/api/clinical-interventions/:id', clinicalInterventionController.updateClinicalIntervention);
            const updates = { priority: 'critical' };
            await (0, supertest_1.default)(app)
                .patch(`/api/clinical-interventions/${interventionId}`)
                .send(updates)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.logInterventionAccess).toHaveBeenCalledWith(interventionId, pharmacistId, workplaceId, 'edit', expect.any(Object), expect.objectContaining({
                updatedFields: ['priority']
            }));
        });
    });
    describe('DELETE /api/clinical-interventions/:id', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.deleteIntervention.mockResolvedValue(true);
        });
        it('should delete intervention', async () => {
            app.delete('/api/clinical-interventions/:id', clinicalInterventionController.deleteClinicalIntervention);
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/clinical-interventions/${interventionId}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deleted).toBe(true);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.deleteIntervention).toHaveBeenCalledWith(interventionId, pharmacistId, workplaceId);
        });
        it('should validate ID format', async () => {
            app.delete('/api/clinical-interventions/:id', clinicalInterventionController.deleteClinicalIntervention);
            await (0, supertest_1.default)(app)
                .delete('/api/clinical-interventions/invalid-id')
                .expect(400);
        });
        it('should handle deletion failure', async () => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.deleteIntervention.mockResolvedValue(false);
            app.delete('/api/clinical-interventions/:id', clinicalInterventionController.deleteClinicalIntervention);
            await (0, supertest_1.default)(app)
                .delete(`/api/clinical-interventions/${interventionId}`)
                .expect(404);
        });
        it('should log intervention access', async () => {
            app.delete('/api/clinical-interventions/:id', clinicalInterventionController.deleteClinicalIntervention);
            await (0, supertest_1.default)(app)
                .delete(`/api/clinical-interventions/${interventionId}`)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.logInterventionAccess).toHaveBeenCalledWith(interventionId, pharmacistId, workplaceId, 'delete', expect.any(Object), expect.objectContaining({
                reason: 'soft_delete'
            }));
        });
    });
    describe('POST /api/clinical-interventions/:id/strategies', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.addStrategy.mockResolvedValue({
                _id: interventionId,
                strategies: [{
                        type: 'dose_adjustment',
                        description: 'Reduce dose by 50%',
                        rationale: 'Patient experiencing side effects',
                        expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                        priority: 'primary'
                    }]
            });
        });
        it('should add strategy to intervention', async () => {
            app.post('/api/clinical-interventions/:id/strategies', clinicalInterventionController.addInterventionStrategy);
            const strategyData = {
                type: 'dose_adjustment',
                description: 'Reduce dose by 50% to minimize side effects',
                rationale: 'Patient experiencing dose-related adverse effects',
                expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                priority: 'primary'
            };
            const response = await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .send(strategyData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.addStrategy).toHaveBeenCalledWith(interventionId, strategyData, pharmacistId, workplaceId);
        });
        it('should validate required strategy fields', async () => {
            app.post('/api/clinical-interventions/:id/strategies', clinicalInterventionController.addInterventionStrategy);
            const invalidStrategy = {
                type: 'dose_adjustment',
                description: 'Reduce dose'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .send(invalidStrategy)
                .expect(400);
        });
        it('should validate ID format', async () => {
            app.post('/api/clinical-interventions/:id/strategies', clinicalInterventionController.addInterventionStrategy);
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions/invalid-id/strategies')
                .send({
                type: 'dose_adjustment',
                description: 'Test',
                rationale: 'Test',
                expectedOutcome: 'Test outcome that meets minimum length'
            })
                .expect(400);
        });
        it('should default priority to secondary', async () => {
            app.post('/api/clinical-interventions/:id/strategies', clinicalInterventionController.addInterventionStrategy);
            const strategyData = {
                type: 'dose_adjustment',
                description: 'Reduce dose by 50%',
                rationale: 'Patient experiencing side effects',
                expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/strategies`)
                .send(strategyData)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.addStrategy).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                priority: 'secondary'
            }), pharmacistId, workplaceId);
        });
    });
    describe('POST /api/clinical-interventions/:id/assignments', () => {
        const interventionId = testUtils.createObjectId().toString();
        const assigneeId = testUtils.createObjectId();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.assignTeamMember.mockResolvedValue({
                _id: interventionId,
                assignments: [{
                        userId: assigneeId,
                        role: 'pharmacist',
                        task: 'Review medication regimen',
                        status: 'pending',
                        assignedAt: new Date()
                    }]
            });
        });
        it('should assign team member to intervention', async () => {
            app.post('/api/clinical-interventions/:id/assignments', clinicalInterventionController.assignTeamMember);
            const assignmentData = {
                userId: assigneeId.toString(),
                role: 'pharmacist',
                task: 'Review medication regimen and recommend adjustments',
                notes: 'Urgent review needed'
            };
            const response = await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .send(assignmentData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.assignTeamMember).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                userId: assigneeId,
                role: 'pharmacist',
                task: 'Review medication regimen and recommend adjustments',
                status: 'pending',
                notes: 'Urgent review needed'
            }), pharmacistId, workplaceId);
        });
        it('should validate required assignment fields', async () => {
            app.post('/api/clinical-interventions/:id/assignments', clinicalInterventionController.assignTeamMember);
            const invalidAssignment = {
                userId: assigneeId.toString(),
                role: 'pharmacist'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .send(invalidAssignment)
                .expect(400);
        });
        it('should validate user ID format', async () => {
            app.post('/api/clinical-interventions/:id/assignments', clinicalInterventionController.assignTeamMember);
            const invalidAssignment = {
                userId: 'invalid-id',
                role: 'pharmacist',
                task: 'Review medication regimen'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/assignments`)
                .send(invalidAssignment)
                .expect(400);
        });
        it('should validate intervention ID format', async () => {
            app.post('/api/clinical-interventions/:id/assignments', clinicalInterventionController.assignTeamMember);
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions/invalid-id/assignments')
                .send({
                userId: assigneeId.toString(),
                role: 'pharmacist',
                task: 'Review medication regimen'
            })
                .expect(400);
        });
    });
    describe('POST /api/clinical-interventions/:id/outcomes', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.recordOutcome.mockResolvedValue({
                _id: interventionId,
                outcomes: {
                    patientResponse: 'improved',
                    clinicalParameters: [],
                    successMetrics: {
                        problemResolved: true,
                        medicationOptimized: true,
                        adherenceImproved: false
                    }
                }
            });
        });
        it('should record intervention outcome', async () => {
            app.post('/api/clinical-interventions/:id/outcomes', clinicalInterventionController.recordOutcome);
            const outcomeData = {
                patientResponse: 'improved',
                clinicalParameters: [{
                        parameter: 'Blood Pressure',
                        beforeValue: '160/90',
                        afterValue: '130/80',
                        unit: 'mmHg',
                        improvementPercentage: 20
                    }],
                adverseEffects: 'None reported',
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: false,
                    qualityOfLifeImproved: true
                }
            };
            const response = await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .send(outcomeData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.recordOutcome).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                patientResponse: 'improved',
                clinicalParameters: expect.arrayContaining([
                    expect.objectContaining({
                        parameter: 'Blood Pressure'
                    })
                ])
            }), pharmacistId, workplaceId);
        });
        it('should validate required patient response', async () => {
            app.post('/api/clinical-interventions/:id/outcomes', clinicalInterventionController.recordOutcome);
            const invalidOutcome = {
                clinicalParameters: [],
                successMetrics: {}
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .send(invalidOutcome)
                .expect(400);
        });
        it('should validate ID format', async () => {
            app.post('/api/clinical-interventions/:id/outcomes', clinicalInterventionController.recordOutcome);
            await (0, supertest_1.default)(app)
                .post('/api/clinical-interventions/invalid-id/outcomes')
                .send({ patientResponse: 'improved' })
                .expect(400);
        });
        it('should handle minimal outcome data', async () => {
            app.post('/api/clinical-interventions/:id/outcomes', clinicalInterventionController.recordOutcome);
            const minimalOutcome = {
                patientResponse: 'no_change'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/outcomes`)
                .send(minimalOutcome)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.recordOutcome).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                patientResponse: 'no_change',
                clinicalParameters: [],
                successMetrics: {}
            }), pharmacistId, workplaceId);
        });
    });
    describe('POST /api/clinical-interventions/:id/follow-up', () => {
        const interventionId = testUtils.createObjectId().toString();
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.scheduleFollowUp.mockResolvedValue({
                _id: interventionId,
                followUp: {
                    required: true,
                    scheduledDate: new Date(),
                    notes: 'Follow-up scheduled'
                }
            });
        });
        it('should schedule follow-up', async () => {
            app.post('/api/clinical-interventions/:id/follow-up', clinicalInterventionController.scheduleFollowUp);
            const followUpData = {
                required: true,
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                notes: 'Follow-up call to assess medication adherence',
                nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            };
            const response = await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/follow-up`)
                .send(followUpData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.intervention).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.scheduleFollowUp).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                required: true,
                scheduledDate: expect.any(Date),
                notes: 'Follow-up call to assess medication adherence',
                nextReviewDate: expect.any(Date)
            }), pharmacistId, workplaceId);
        });
        it('should validate required flag', async () => {
            app.post('/api/clinical-interventions/:id/follow-up', clinicalInterventionController.scheduleFollowUp);
            const invalidFollowUp = {
                scheduledDate: new Date().toISOString()
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/follow-up`)
                .send(invalidFollowUp)
                .expect(400);
        });
        it('should validate date formats', async () => {
            app.post('/api/clinical-interventions/:id/follow-up', clinicalInterventionController.scheduleFollowUp);
            const invalidFollowUp = {
                required: true,
                scheduledDate: 'invalid-date'
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/follow-up`)
                .send(invalidFollowUp)
                .expect(400);
        });
        it('should handle follow-up not required', async () => {
            app.post('/api/clinical-interventions/:id/follow-up', clinicalInterventionController.scheduleFollowUp);
            const followUpData = {
                required: false
            };
            await (0, supertest_1.default)(app)
                .post(`/api/clinical-interventions/${interventionId}/follow-up`)
                .send(followUpData)
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.scheduleFollowUp).toHaveBeenCalledWith(interventionId, expect.objectContaining({
                required: false
            }), pharmacistId, workplaceId);
        });
    });
    describe('GET /api/clinical-interventions/patient/:patientId', () => {
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getInterventions.mockResolvedValue({
                data: [{
                        _id: testUtils.createObjectId(),
                        interventionNumber: 'CI-202412-0001',
                        category: 'drug_therapy_problem',
                        priority: 'high',
                        status: 'completed',
                        patientId: patientId
                    }],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    pages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            });
            ClinicalInterventionService.getPatientInterventionSummary.mockResolvedValue({
                totalInterventions: 1,
                activeInterventions: 0,
                completedInterventions: 1,
                successfulInterventions: 1,
                categoryBreakdown: { 'drug_therapy_problem': 1 },
                recentInterventions: []
            });
        });
        it('should get patient interventions with summary', async () => {
            app.get('/api/clinical-interventions/patient/:patientId', clinicalInterventionController.getPatientInterventions);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/clinical-interventions/patient/${patientId}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.summary).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                workplaceId: workplaceId,
                patientId: patientId
            }));
            expect(ClinicalInterventionService.getPatientInterventionSummary).toHaveBeenCalledWith(patientId, workplaceId);
        });
        it('should validate patient ID format', async () => {
            app.get('/api/clinical-interventions/patient/:patientId', clinicalInterventionController.getPatientInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/patient/invalid-id')
                .expect(400);
        });
        it('should handle query filters', async () => {
            app.get('/api/clinical-interventions/patient/:patientId', clinicalInterventionController.getPatientInterventions);
            await (0, supertest_1.default)(app)
                .get(`/api/clinical-interventions/patient/${patientId}`)
                .query({
                status: 'completed',
                category: 'drug_therapy_problem',
                page: '1',
                limit: '10'
            })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getInterventions).toHaveBeenCalledWith(expect.objectContaining({
                patientId: patientId,
                status: 'completed',
                category: 'drug_therapy_problem'
            }));
        });
    });
    describe('GET /api/clinical-interventions/assigned-to-me', () => {
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getUserAssignments.mockResolvedValue([{
                    _id: testUtils.createObjectId(),
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    status: 'in_progress',
                    assignments: [{
                            userId: pharmacistId,
                            role: 'pharmacist',
                            task: 'Review medication regimen',
                            status: 'pending'
                        }]
                }]);
            ClinicalInterventionService.getUserAssignmentStats.mockResolvedValue({
                totalAssignments: 5,
                activeAssignments: 3,
                completedAssignments: 2,
                overdueAssignments: 1
            });
        });
        it('should get user assigned interventions', async () => {
            app.get('/api/clinical-interventions/assigned-to-me', clinicalInterventionController.getAssignedInterventions);
            const response = await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/assigned-to-me')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.interventions).toHaveLength(1);
            expect(response.body.data.stats).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getUserAssignments).toHaveBeenCalledWith(pharmacistId, workplaceId, undefined);
            expect(ClinicalInterventionService.getUserAssignmentStats).toHaveBeenCalledWith(pharmacistId, workplaceId);
        });
        it('should handle status filter', async () => {
            app.get('/api/clinical-interventions/assigned-to-me', clinicalInterventionController.getAssignedInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/assigned-to-me')
                .query({ status: 'pending' })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getUserAssignments).toHaveBeenCalledWith(pharmacistId, workplaceId, ['pending']);
        });
    });
    describe('GET /api/clinical-interventions/analytics/summary', () => {
        beforeEach(() => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getDashboardMetrics.mockResolvedValue({
                totalInterventions: 25,
                activeInterventions: 8,
                completedInterventions: 15,
                overdueInterventions: 2,
                successRate: 85.5,
                averageResolutionTime: 3.2,
                totalCostSavings: 12500,
                categoryDistribution: [],
                priorityDistribution: [],
                monthlyTrends: [],
                recentInterventions: []
            });
        });
        it('should get analytics with default date range', async () => {
            app.get('/api/clinical-interventions/analytics/summary', clinicalInterventionController.getInterventionAnalytics);
            const response = await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/analytics/summary')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.metrics).toBeDefined();
            expect(response.body.data.dateRange).toBeDefined();
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getDashboardMetrics).toHaveBeenCalledWith(workplaceId, expect.objectContaining({
                from: expect.any(Date),
                to: expect.any(Date)
            }));
        });
        it('should handle custom date range', async () => {
            app.get('/api/clinical-interventions/analytics/summary', clinicalInterventionController.getInterventionAnalytics);
            const dateFrom = '2024-12-01';
            const dateTo = '2024-12-31';
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/analytics/summary')
                .query({ dateFrom, dateTo })
                .expect(200);
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            expect(ClinicalInterventionService.getDashboardMetrics).toHaveBeenCalledWith(workplaceId, expect.objectContaining({
                from: new Date(dateFrom),
                to: new Date(dateTo)
            }));
        });
        it('should validate date formats', async () => {
            app.get('/api/clinical-interventions/analytics/summary', clinicalInterventionController.getInterventionAnalytics);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/analytics/summary')
                .query({ dateFrom: 'invalid-date' })
                .expect(400);
        });
    });
    describe('Error Handling', () => {
        it('should handle service errors gracefully', async () => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            ClinicalInterventionService.getInterventions.mockRejectedValue(new Error('Database error'));
            app.get('/api/clinical-interventions', clinicalInterventionController.getClinicalInterventions);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions')
                .expect(500);
        });
        it('should handle validation errors', async () => {
            app.get('/api/clinical-interventions/:id', clinicalInterventionController.getClinicalIntervention);
            await (0, supertest_1.default)(app)
                .get('/api/clinical-interventions/invalid-id')
                .expect(400);
        });
        it('should handle not found errors', async () => {
            const ClinicalInterventionService = require('../../services/clinicalInterventionService').default;
            const notFoundError = new Error('Clinical intervention not found');
            notFoundError.name = 'NotFoundError';
            ClinicalInterventionService.getInterventionById.mockRejectedValue(notFoundError);
            app.get('/api/clinical-interventions/:id', clinicalInterventionController.getClinicalIntervention);
            const validId = testUtils.createObjectId().toString();
            await (0, supertest_1.default)(app)
                .get(`/api/clinical-interventions/${validId}`)
                .expect(404);
        });
    });
});
//# sourceMappingURL=clinicalInterventionController.comprehensive.test.js.map