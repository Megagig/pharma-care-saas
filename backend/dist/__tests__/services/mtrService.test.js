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
const MTRService = __importStar(require("../../services/mtrService"));
const { MTRWorkflowService, DrugInteractionService } = MTRService;
const MedicationTherapyReview_1 = __importDefault(require("../../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../../models/DrugTherapyProblem"));
const Patient_1 = __importDefault(require("../../models/Patient"));
describe('MTR Service', () => {
    let workplaceId;
    let patientId;
    let pharmacistId;
    let patient;
    beforeEach(async () => {
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
    });
    describe('MTRWorkflowService', () => {
        describe('getWorkflowSteps', () => {
            it('should return workflow steps configuration', () => {
                const steps = MTRWorkflowService.getWorkflowSteps();
                expect(steps).toHaveLength(6);
                expect(steps[0].name).toBe('patientSelection');
                expect(steps[1].name).toBe('medicationHistory');
                expect(steps[2].name).toBe('therapyAssessment');
                expect(steps[3].name).toBe('planDevelopment');
                expect(steps[4].name).toBe('interventions');
                expect(steps[5].name).toBe('followUp');
                const requiredSteps = steps.filter(step => step.required);
                expect(requiredSteps).toHaveLength(5);
            });
        });
        describe('getNextStep', () => {
            it('should return first incomplete step', () => {
                const currentSteps = {
                    patientSelection: { completed: false },
                    medicationHistory: { completed: false },
                    therapyAssessment: { completed: false },
                    planDevelopment: { completed: false },
                    interventions: { completed: false },
                    followUp: { completed: false }
                };
                const nextStep = MTRWorkflowService.getNextStep(currentSteps);
                expect(nextStep).toBe('patientSelection');
            });
            it('should return next incomplete step', () => {
                const currentSteps = {
                    patientSelection: { completed: true },
                    medicationHistory: { completed: false },
                    therapyAssessment: { completed: false },
                    planDevelopment: { completed: false },
                    interventions: { completed: false },
                    followUp: { completed: false }
                };
                const nextStep = MTRWorkflowService.getNextStep(currentSteps);
                expect(nextStep).toBe('medicationHistory');
            });
            it('should return null when all steps are complete', () => {
                const currentSteps = {
                    patientSelection: { completed: true },
                    medicationHistory: { completed: true },
                    therapyAssessment: { completed: true },
                    planDevelopment: { completed: true },
                    interventions: { completed: true },
                    followUp: { completed: true }
                };
                const nextStep = MTRWorkflowService.getNextStep(currentSteps);
                expect(nextStep).toBeNull();
            });
        });
        describe('validateStep', () => {
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
            it('should validate patient selection step', async () => {
                const result = await MTRWorkflowService.validateStep('patientSelection', mtrSession);
                expect(result.isValid).toBe(true);
                expect(result.canProceed).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
            it('should fail validation for invalid step name', async () => {
                const result = await MTRWorkflowService.validateStep('invalidStep', mtrSession);
                expect(result.isValid).toBe(false);
                expect(result.canProceed).toBe(false);
                expect(result.errors).toContain('Invalid step name: invalidStep');
            });
            it('should fail validation when dependencies are not met', async () => {
                const result = await MTRWorkflowService.validateStep('medicationHistory', mtrSession);
                expect(result.isValid).toBe(false);
                expect(result.canProceed).toBe(false);
                expect(result.errors).toContain('Dependency not met: patientSelection must be completed first');
            });
            it('should validate medication history step with medications', async () => {
                mtrSession.markStepComplete('patientSelection');
                mtrSession.medications.push({
                    drugName: 'Lisinopril',
                    strength: { value: 10, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: '10 mg',
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: 'Hypertension'
                });
                await mtrSession.save();
                const result = await MTRWorkflowService.validateStep('medicationHistory', mtrSession);
                expect(result.isValid).toBe(true);
                expect(result.canProceed).toBe(true);
            });
            it('should fail medication history validation without medications', async () => {
                mtrSession.markStepComplete('patientSelection');
                await mtrSession.save();
                const result = await MTRWorkflowService.validateStep('medicationHistory', mtrSession);
                expect(result.isValid).toBe(false);
                expect(result.canProceed).toBe(false);
                expect(result.errors).toContain('At least one medication must be recorded');
            });
            it('should validate therapy assessment step', async () => {
                mtrSession.markStepComplete('patientSelection');
                mtrSession.markStepComplete('medicationHistory');
                await mtrSession.save();
                const result = await MTRWorkflowService.validateStep('therapyAssessment', mtrSession);
                expect(result.isValid).toBe(true);
                expect(result.canProceed).toBe(true);
            });
            it('should validate plan development step with therapy plan', async () => {
                mtrSession.markStepComplete('patientSelection');
                mtrSession.markStepComplete('medicationHistory');
                mtrSession.markStepComplete('therapyAssessment');
                mtrSession.plan = {
                    problems: [],
                    recommendations: [{
                            type: 'adjust_dose',
                            medication: 'Lisinopril',
                            rationale: 'Current dose may be subtherapeutic',
                            priority: 'medium',
                            expectedOutcome: 'Better blood pressure control'
                        }],
                    monitoringPlan: [],
                    counselingPoints: [],
                    goals: [],
                    timeline: '2 weeks',
                    pharmacistNotes: 'Patient education provided'
                };
                await mtrSession.save();
                const result = await MTRWorkflowService.validateStep('planDevelopment', mtrSession);
                expect(result.isValid).toBe(true);
                expect(result.canProceed).toBe(true);
            });
            it('should fail plan development validation without therapy plan', async () => {
                mtrSession.markStepComplete('patientSelection');
                mtrSession.markStepComplete('medicationHistory');
                mtrSession.markStepComplete('therapyAssessment');
                await mtrSession.save();
                const result = await MTRWorkflowService.validateStep('planDevelopment', mtrSession);
                expect(result.isValid).toBe(false);
                expect(result.canProceed).toBe(false);
                expect(result.errors).toContain('Therapy plan must be created');
            });
        });
        describe('canCompleteWorkflow', () => {
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
            it('should allow completion when all required steps are done', async () => {
                mtrSession.markStepComplete('patientSelection');
                mtrSession.markStepComplete('medicationHistory');
                mtrSession.markStepComplete('therapyAssessment');
                mtrSession.markStepComplete('planDevelopment');
                mtrSession.markStepComplete('interventions');
                mtrSession.plan = {
                    problems: [],
                    recommendations: [],
                    monitoringPlan: [],
                    counselingPoints: [],
                    goals: [],
                    timeline: '',
                    pharmacistNotes: ''
                };
                await mtrSession.save();
                const result = await MTRWorkflowService.canCompleteWorkflow(mtrSession);
                expect(result.isValid).toBe(true);
                expect(result.canProceed).toBe(true);
            });
            it('should not allow completion when required steps are missing', async () => {
                const result = await MTRWorkflowService.canCompleteWorkflow(mtrSession);
                expect(result.isValid).toBe(false);
                expect(result.canProceed).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });
    });
    describe('DrugInteractionService', () => {
        describe('checkInteractions', () => {
            it('should return no interactions for single medication', async () => {
                const medications = [{
                        drugName: 'Lisinopril',
                        strength: { value: 10, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '10 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Hypertension'
                    }];
                const result = await DrugInteractionService.checkInteractions(medications);
                expect(result.hasInteractions).toBe(false);
                expect(result.interactions).toHaveLength(0);
                expect(result.severity).toBe('none');
            });
            it('should detect drug interactions', async () => {
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
                const result = await DrugInteractionService.checkInteractions(medications);
                expect(result.hasInteractions).toBe(true);
                expect(result.interactions.length).toBeGreaterThan(0);
                expect(result.severity).toBe('major');
                const interaction = result.interactions[0];
                expect(interaction.drug1.toLowerCase()).toBe('warfarin');
                expect(interaction.drug2.toLowerCase()).toBe('aspirin');
                expect(interaction.severity).toBe('major');
            });
            it('should detect duplicate therapies', async () => {
                const medications = [
                    {
                        drugName: 'Lisinopril',
                        strength: { value: 10, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '10 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Hypertension'
                    },
                    {
                        drugName: 'Enalapril',
                        strength: { value: 5, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '5 mg',
                            frequency: 'twice daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Heart failure'
                    }
                ];
                const result = await DrugInteractionService.checkInteractions(medications);
                expect(result.hasInteractions).toBe(true);
                expect(result.duplicateTherapies.length).toBeGreaterThan(0);
                const duplicate = result.duplicateTherapies[0];
                expect(duplicate.therapeuticClass).toBe('ACE Inhibitors');
                expect(duplicate.medications).toContain('Lisinopril');
                expect(duplicate.medications).toContain('Enalapril');
            });
            it('should detect contraindications', async () => {
                const medications = [{
                        drugName: 'Metformin',
                        strength: { value: 500, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '500 mg',
                            frequency: 'twice daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Diabetes'
                    }];
                const result = await DrugInteractionService.checkInteractions(medications);
                expect(result.hasInteractions).toBe(true);
                expect(result.contraindications.length).toBeGreaterThan(0);
                const contraindication = result.contraindications[0];
                expect(contraindication.medication.toLowerCase()).toBe('metformin');
                expect(contraindication.severity).toBe('absolute');
            });
            it('should calculate overall severity correctly', async () => {
                const medications = [
                    {
                        drugName: 'Simvastatin',
                        strength: { value: 20, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '20 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Hyperlipidemia'
                    },
                    {
                        drugName: 'Clarithromycin',
                        strength: { value: 500, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '500 mg',
                            frequency: 'twice daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: new Date(),
                        indication: 'Infection'
                    }
                ];
                const result = await DrugInteractionService.checkInteractions(medications);
                expect(result.hasInteractions).toBe(true);
                expect(result.severity).toBe('major');
            });
        });
        describe('generateProblemsFromInteractions', () => {
            let reviewId;
            let identifiedBy;
            beforeEach(() => {
                reviewId = testUtils.createObjectId();
                identifiedBy = testUtils.createObjectId();
            });
            it('should generate problems from drug interactions', async () => {
                const interactionResult = {
                    hasInteractions: true,
                    interactions: [{
                            drug1: 'Warfarin',
                            drug2: 'Aspirin',
                            severity: 'major',
                            mechanism: 'Additive anticoagulant effects',
                            clinicalEffect: 'Increased bleeding risk',
                            management: 'Monitor INR closely',
                            references: ['Test reference']
                        }],
                    duplicateTherapies: [],
                    contraindications: [],
                    severity: 'major'
                };
                const problems = await DrugInteractionService.generateProblemsFromInteractions(interactionResult, reviewId, patientId, workplaceId, identifiedBy);
                expect(problems).toHaveLength(1);
                expect(problems[0].type).toBe('interaction');
                expect(problems[0].severity).toBe('major');
                expect(problems[0].affectedMedications).toContain('Warfarin');
                expect(problems[0].affectedMedications).toContain('Aspirin');
            });
            it('should generate problems from duplicate therapies', async () => {
                const interactionResult = {
                    hasInteractions: true,
                    interactions: [],
                    duplicateTherapies: [{
                            medications: ['Lisinopril', 'Enalapril'],
                            therapeuticClass: 'ACE Inhibitors',
                            reason: 'Multiple ACE inhibitors prescribed',
                            recommendation: 'Use single ACE inhibitor'
                        }],
                    contraindications: [],
                    severity: 'moderate'
                };
                const problems = await DrugInteractionService.generateProblemsFromInteractions(interactionResult, reviewId, patientId, workplaceId, identifiedBy);
                expect(problems).toHaveLength(1);
                expect(problems[0].type).toBe('duplication');
                expect(problems[0].severity).toBe('moderate');
                expect(problems[0].affectedMedications).toContain('Lisinopril');
                expect(problems[0].affectedMedications).toContain('Enalapril');
            });
            it('should generate problems from contraindications', async () => {
                const interactionResult = {
                    hasInteractions: true,
                    interactions: [],
                    duplicateTherapies: [],
                    contraindications: [{
                            medication: 'Metformin',
                            condition: 'Severe kidney disease',
                            severity: 'absolute',
                            reason: 'Risk of lactic acidosis',
                            alternatives: ['Insulin', 'DPP-4 inhibitors']
                        }],
                    severity: 'critical'
                };
                const problems = await DrugInteractionService.generateProblemsFromInteractions(interactionResult, reviewId, patientId, workplaceId, identifiedBy);
                expect(problems).toHaveLength(1);
                expect(problems[0].type).toBe('contraindication');
                expect(problems[0].severity).toBe('critical');
                expect(problems[0].affectedMedications).toContain('Metformin');
                expect(problems[0].relatedConditions).toContain('Severe kidney disease');
            });
        });
    });
    describe('Integration Tests', () => {
        it('should complete full workflow validation', async () => {
            const mtrSession = await MedicationTherapyReview_1.default.create({
                workplaceId,
                patientId,
                pharmacistId,
                reviewNumber: 'MTR-202412-0001',
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: pharmacistId
            });
            let result = await MTRWorkflowService.validateStep('patientSelection', mtrSession);
            expect(result.isValid).toBe(true);
            mtrSession.markStepComplete('patientSelection');
            mtrSession.medications.push({
                drugName: 'Lisinopril',
                strength: { value: 10, unit: 'mg' },
                dosageForm: 'tablet',
                instructions: {
                    dose: '10 mg',
                    frequency: 'once daily',
                    route: 'oral'
                },
                category: 'prescribed',
                startDate: new Date(),
                indication: 'Hypertension'
            });
            await mtrSession.save();
            result = await MTRWorkflowService.validateStep('medicationHistory', mtrSession);
            expect(result.isValid).toBe(true);
            mtrSession.markStepComplete('medicationHistory');
            result = await MTRWorkflowService.validateStep('therapyAssessment', mtrSession);
            expect(result.isValid).toBe(true);
            mtrSession.markStepComplete('therapyAssessment');
            mtrSession.plan = {
                problems: [],
                recommendations: [{
                        type: 'monitor',
                        rationale: 'Monitor blood pressure response',
                        priority: 'medium',
                        expectedOutcome: 'Optimal blood pressure control'
                    }],
                monitoringPlan: [],
                counselingPoints: [],
                goals: [],
                timeline: '4 weeks',
                pharmacistNotes: 'Continue current therapy'
            };
            await mtrSession.save();
            result = await MTRWorkflowService.validateStep('planDevelopment', mtrSession);
            expect(result.isValid).toBe(true);
            mtrSession.markStepComplete('planDevelopment');
            result = await MTRWorkflowService.validateStep('interventions', mtrSession);
            expect(result.isValid).toBe(true);
            mtrSession.markStepComplete('interventions');
            result = await MTRWorkflowService.canCompleteWorkflow(mtrSession);
            expect(result.isValid).toBe(true);
            expect(result.canProceed).toBe(true);
        });
        it('should integrate drug interaction checking with problem generation', async () => {
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
            const interactionResult = await DrugInteractionService.checkInteractions(medications);
            expect(interactionResult.hasInteractions).toBe(true);
            const reviewId = testUtils.createObjectId();
            const identifiedBy = testUtils.createObjectId();
            const problems = await DrugInteractionService.generateProblemsFromInteractions(interactionResult, reviewId, patientId, workplaceId, identifiedBy);
            expect(problems.length).toBeGreaterThan(0);
            const savedProblems = await DrugTherapyProblem_1.default.create(problems);
            expect(savedProblems.length).toBe(problems.length);
            const retrievedProblems = await DrugTherapyProblem_1.default.find({ reviewId });
            expect(retrievedProblems).toHaveLength(savedProblems.length);
        });
    });
});
//# sourceMappingURL=mtrService.test.js.map