"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const ClinicalIntervention_1 = __importDefault(require("../../models/ClinicalIntervention"));
describe('ClinicalIntervention Model', () => {
    let mongoServer;
    let testWorkplaceId;
    let testUserId;
    let testPatientId;
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
    describe('Schema Validation', () => {
        it('should create a valid clinical intervention', async () => {
            const interventionData = {
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
            };
            const intervention = new ClinicalIntervention_1.default(interventionData);
            const savedIntervention = await intervention.save();
            expect(savedIntervention._id).toBeDefined();
            expect(savedIntervention.workplaceId).toEqual(testWorkplaceId);
            expect(savedIntervention.patientId).toEqual(testPatientId);
            expect(savedIntervention.category).toBe('drug_therapy_problem');
            expect(savedIntervention.priority).toBe('high');
            expect(savedIntervention.status).toBe('identified');
            expect(savedIntervention.isDeleted).toBe(false);
        });
        it('should require mandatory fields', async () => {
            const intervention = new ClinicalIntervention_1.default({});
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate intervention number format', async () => {
            const interventionData = {
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'INVALID-FORMAT',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue description that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
            };
            const intervention = new ClinicalIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow(/Invalid intervention number format/);
        });
        it('should validate issue description length', async () => {
            const interventionData = {
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Short',
                identifiedBy: testUserId,
                createdBy: testUserId,
            };
            const intervention = new ClinicalIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow(/Issue description must be at least 10 characters/);
        });
        it('should validate category enum values', async () => {
            const interventionData = {
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'invalid_category',
                priority: 'high',
                issueDescription: 'Valid issue description that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
            };
            const intervention = new ClinicalIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate priority enum values', async () => {
            const interventionData = {
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'invalid_priority',
                issueDescription: 'Valid issue description that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
            };
            const intervention = new ClinicalIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
    });
    describe('Strategy Management', () => {
        let intervention;
        beforeEach(async () => {
            intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
            });
            await intervention.save();
        });
        it('should add strategy and update status', async () => {
            const strategy = {
                type: 'dose_adjustment',
                description: 'Reduce dose by 50%',
                rationale: 'Patient experiencing dose-related side effects',
                expectedOutcome: 'Reduction in side effects while maintaining therapeutic effect',
                priority: 'primary',
            };
            intervention.addStrategy(strategy);
            await intervention.save();
            expect(intervention.strategies).toHaveLength(1);
            expect(intervention.strategies[0]?.type).toBe('dose_adjustment');
            expect(intervention.status).toBe('planning');
        });
        it('should validate strategy fields', async () => {
            const invalidStrategy = {
                type: 'dose_adjustment',
                description: '',
                rationale: 'Valid rationale',
                expectedOutcome: 'Valid expected outcome that meets minimum length',
                priority: 'primary',
            };
            intervention.strategies.push(invalidStrategy);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate expected outcome minimum length', async () => {
            const strategy = {
                type: 'dose_adjustment',
                description: 'Valid description',
                rationale: 'Valid rationale',
                expectedOutcome: 'Short',
                priority: 'primary',
            };
            intervention.strategies.push(strategy);
            await expect(intervention.save()).rejects.toThrow(/Expected outcome must be at least 20 characters/);
        });
    });
    describe('Team Assignment Management', () => {
        let intervention;
        beforeEach(async () => {
            intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
                status: 'planning',
            });
            await intervention.save();
        });
        it('should assign team member and update status', async () => {
            const assignment = {
                userId: testUserId,
                role: 'pharmacist',
                task: 'Review medication regimen and recommend dose adjustment',
                status: 'pending',
                assignedAt: new Date(),
            };
            intervention.assignTeamMember(assignment);
            await intervention.save();
            expect(intervention.assignments).toHaveLength(1);
            expect(intervention.assignments[0]?.role).toBe('pharmacist');
            expect(intervention.status).toBe('in_progress');
        });
        it('should validate assignment role enum', async () => {
            const invalidAssignment = {
                userId: testUserId,
                role: 'invalid_role',
                task: 'Valid task description',
                status: 'pending',
                assignedAt: new Date(),
            };
            intervention.assignments.push(invalidAssignment);
            await expect(intervention.save()).rejects.toThrow();
        });
    });
    describe('Outcome Recording', () => {
        let intervention;
        beforeEach(async () => {
            intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
                status: 'in_progress',
            });
            await intervention.save();
        });
        it('should record outcome and update status', async () => {
            const outcome = {
                patientResponse: 'improved',
                clinicalParameters: [
                    {
                        parameter: 'Blood Pressure',
                        beforeValue: '160/90',
                        afterValue: '130/80',
                        unit: 'mmHg',
                        improvementPercentage: 20,
                    },
                ],
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: false,
                    qualityOfLifeImproved: true,
                },
            };
            intervention.recordOutcome(outcome);
            await intervention.save();
            expect(intervention.outcomes?.patientResponse).toBe('improved');
            expect(intervention.outcomes?.clinicalParameters).toHaveLength(1);
            expect(intervention.status).toBe('implemented');
        });
        it('should validate clinical parameter values', async () => {
            const outcome = {
                patientResponse: 'improved',
                clinicalParameters: [
                    {
                        parameter: '',
                        beforeValue: '160/90',
                        afterValue: '130/80',
                        unit: 'mmHg',
                    },
                ],
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: false,
                },
            };
            intervention.outcomes = outcome;
            await expect(intervention.save()).rejects.toThrow();
        });
    });
    describe('Virtual Properties', () => {
        let intervention;
        beforeEach(async () => {
            intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
                startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            });
            await intervention.save();
        });
        it('should calculate duration in days', () => {
            expect(intervention.durationDays).toBeGreaterThanOrEqual(2);
        });
        it('should determine overdue status based on priority', () => {
            expect(intervention.isOverdue).toBe(true);
        });
        it('should not be overdue if completed', async () => {
            intervention.status = 'completed';
            intervention.completedAt = new Date();
            await intervention.save();
            expect(intervention.isOverdue).toBe(false);
        });
    });
    describe('Instance Methods', () => {
        let intervention;
        beforeEach(async () => {
            intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Patient experiencing side effects from current medication regimen',
                identifiedBy: testUserId,
                createdBy: testUserId,
            });
            await intervention.save();
        });
        it('should calculate completion percentage', () => {
            expect(intervention.getCompletionPercentage()).toBe(20);
            intervention.status = 'in_progress';
            expect(intervention.getCompletionPercentage()).toBe(60);
            intervention.status = 'completed';
            expect(intervention.getCompletionPercentage()).toBe(100);
        });
        it('should get next step', () => {
            expect(intervention.getNextStep()).toBe('planning');
            intervention.status = 'planning';
            expect(intervention.getNextStep()).toBe('in_progress');
            intervention.status = 'completed';
            expect(intervention.getNextStep()).toBeNull();
        });
        it('should determine if can complete', () => {
            expect(intervention.canComplete()).toBe(false);
            intervention.strategies.push({
                type: 'dose_adjustment',
                description: 'Reduce dose',
                rationale: 'Side effects',
                expectedOutcome: 'Reduced side effects while maintaining efficacy',
                priority: 'primary',
            });
            intervention.status = 'implemented';
            intervention.outcomes = {
                patientResponse: 'improved',
                clinicalParameters: [],
                successMetrics: {
                    problemResolved: true,
                    medicationOptimized: true,
                    adherenceImproved: false,
                },
            };
            expect(intervention.canComplete()).toBe(true);
        });
        it('should generate intervention number', () => {
            const interventionNumber = intervention.generateInterventionNumber();
            expect(interventionNumber).toMatch(/^CI-\d{6}-\d{4}$/);
        });
    });
    describe('Static Methods', () => {
        beforeEach(async () => {
            await ClinicalIntervention_1.default.create([
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    issueDescription: 'Test issue 1 that meets minimum length requirement',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'in_progress',
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0002',
                    category: 'adverse_drug_reaction',
                    priority: 'critical',
                    issueDescription: 'Test issue 2 that meets minimum length requirement',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'completed',
                    completedAt: new Date(),
                },
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0003',
                    category: 'medication_nonadherence',
                    priority: 'low',
                    issueDescription: 'Test issue 3 that meets minimum length requirement',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                    status: 'planning',
                    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                },
            ]);
        });
        it('should find active interventions', async () => {
            const activeInterventions = await ClinicalIntervention_1.default.findActive(testWorkplaceId);
            expect(activeInterventions).toHaveLength(2);
        });
        it('should find overdue interventions', async () => {
            const overdueInterventions = await ClinicalIntervention_1.default.findOverdue(testWorkplaceId);
            expect(overdueInterventions.length).toBeGreaterThan(0);
        });
        it('should find interventions by patient', async () => {
            const patientInterventions = await ClinicalIntervention_1.default.findByPatient(testPatientId, testWorkplaceId);
            expect(patientInterventions).toHaveLength(3);
        });
        it('should generate next intervention number', async () => {
            const nextNumber = await ClinicalIntervention_1.default.generateNextInterventionNumber(testWorkplaceId);
            expect(nextNumber).toMatch(/^CI-\d{6}-\d{4}$/);
            expect(nextNumber).toContain('0004');
        });
    });
    describe('Pre-save Middleware', () => {
        it('should auto-generate intervention number', async () => {
            const intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
            });
            await intervention.save();
            expect(intervention.interventionNumber).toMatch(/^CI-\d{6}-\d{4}$/);
        });
        it('should require strategies for non-identified status', async () => {
            const intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
                status: 'planning',
            });
            await expect(intervention.save()).rejects.toThrow(/At least one intervention strategy is required/);
        });
        it('should require outcome for implemented status', async () => {
            const intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
                status: 'implemented',
                strategies: [
                    {
                        type: 'dose_adjustment',
                        description: 'Reduce dose',
                        rationale: 'Side effects',
                        expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                        priority: 'primary',
                    },
                ],
            });
            await expect(intervention.save()).rejects.toThrow(/Patient response outcome is required/);
        });
        it('should auto-set completedAt when status changes to completed', async () => {
            const intervention = new ClinicalIntervention_1.default({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
                status: 'completed',
                strategies: [
                    {
                        type: 'dose_adjustment',
                        description: 'Reduce dose',
                        rationale: 'Side effects',
                        expectedOutcome: 'Reduced side effects while maintaining therapeutic efficacy',
                        priority: 'primary',
                    },
                ],
                outcomes: {
                    patientResponse: 'improved',
                    clinicalParameters: [],
                    successMetrics: {
                        problemResolved: true,
                        medicationOptimized: true,
                        adherenceImproved: false,
                    },
                },
            });
            await intervention.save();
            expect(intervention.completedAt).toBeDefined();
            expect(intervention.actualDuration).toBeDefined();
        });
    });
    describe('Tenancy Guard Integration', () => {
        it('should apply tenancy filtering', async () => {
            const otherWorkplaceId = new mongoose_1.default.Types.ObjectId();
            await ClinicalIntervention_1.default.create([
                {
                    workplaceId: testWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0001',
                    category: 'drug_therapy_problem',
                    priority: 'high',
                    issueDescription: 'Test issue 1 that meets minimum length requirement',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                },
                {
                    workplaceId: otherWorkplaceId,
                    patientId: testPatientId,
                    interventionNumber: 'CI-202412-0002',
                    category: 'adverse_drug_reaction',
                    priority: 'critical',
                    issueDescription: 'Test issue 2 that meets minimum length requirement',
                    identifiedBy: testUserId,
                    createdBy: testUserId,
                },
            ]);
            const interventions = await ClinicalIntervention_1.default.find().setOptions({
                workplaceId: testWorkplaceId,
            });
            expect(interventions).toHaveLength(1);
            expect(interventions[0]?.workplaceId.toString()).toBe(testWorkplaceId.toString());
        });
        it('should apply soft delete filtering', async () => {
            const intervention = await ClinicalIntervention_1.default.create({
                workplaceId: testWorkplaceId,
                patientId: testPatientId,
                interventionNumber: 'CI-202412-0001',
                category: 'drug_therapy_problem',
                priority: 'high',
                issueDescription: 'Test issue that meets minimum length requirement',
                identifiedBy: testUserId,
                createdBy: testUserId,
            });
            intervention.isDeleted = true;
            await intervention.save();
            const interventions = await ClinicalIntervention_1.default.find().setOptions({
                workplaceId: testWorkplaceId,
            });
            expect(interventions).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=ClinicalIntervention.test.js.map