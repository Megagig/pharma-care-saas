"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const mtrValidators_1 = require("../../validators/mtrValidators");
const createMockRequest = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query
});
const runValidation = async (validators, req) => {
    for (const validator of validators) {
        await validator.run(req);
    }
    return (0, express_validator_1.validationResult)(req);
};
describe('MTR Validators', () => {
    describe('createMTRSessionSchema', () => {
        it('should validate valid MTR session data', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                priority: 'routine',
                reviewType: 'initial',
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should require patientId', async () => {
            const req = createMockRequest({
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'patientId')).toBe(true);
        });
        it('should validate ObjectId format for patientId', async () => {
            const req = createMockRequest({
                patientId: 'invalid-id',
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'patientId' && error.msg === 'Invalid patient ID format')).toBe(true);
        });
        it('should validate priority enum values', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                priority: 'invalid-priority',
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'priority')).toBe(true);
        });
        it('should validate reviewType enum values', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                reviewType: 'invalid-type',
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'reviewType')).toBe(true);
        });
        it('should require patient consent', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                patientConsent: false,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'patientConsent' && error.msg === 'Patient consent is required')).toBe(true);
        });
        it('should require confidentiality agreement', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                patientConsent: true,
                confidentialityAgreed: false
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'confidentialityAgreed' && error.msg === 'Confidentiality agreement is required')).toBe(true);
        });
        it('should validate string length limits', async () => {
            const req = createMockRequest({
                patientId: '507f1f77bcf86cd799439011',
                referralSource: 'A'.repeat(101),
                reviewReason: 'A'.repeat(501),
                patientConsent: true,
                confidentialityAgreed: true
            });
            const result = await runValidation(mtrValidators_1.createMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'referralSource')).toBe(true);
            expect(errors.some((error) => error.path === 'reviewReason')).toBe(true);
        });
    });
    describe('updateMTRSessionSchema', () => {
        it('should validate valid update data', async () => {
            const req = createMockRequest({
                status: 'completed',
                priority: 'urgent',
                nextReviewDate: '2024-12-31T00:00:00.000Z',
                estimatedDuration: 60
            });
            const result = await runValidation(mtrValidators_1.updateMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate status enum values', async () => {
            const req = createMockRequest({
                status: 'invalid-status'
            });
            const result = await runValidation(mtrValidators_1.updateMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'status')).toBe(true);
        });
        it('should validate date format', async () => {
            const req = createMockRequest({
                nextReviewDate: 'invalid-date'
            });
            const result = await runValidation(mtrValidators_1.updateMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'nextReviewDate')).toBe(true);
        });
        it('should validate estimated duration is positive', async () => {
            const req = createMockRequest({
                estimatedDuration: -10
            });
            const result = await runValidation(mtrValidators_1.updateMTRSessionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'estimatedDuration')).toBe(true);
        });
    });
    describe('updateStepSchema', () => {
        it('should validate valid step update', async () => {
            const req = createMockRequest({ completed: true, data: { notes: 'Step completed' } }, { stepName: 'patientSelection' });
            const result = await runValidation(mtrValidators_1.updateStepSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate step name enum', async () => {
            const req = createMockRequest({ completed: true }, { stepName: 'invalidStep' });
            const result = await runValidation(mtrValidators_1.updateStepSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'stepName')).toBe(true);
        });
        it('should require completed field to be boolean', async () => {
            const req = createMockRequest({ completed: 'yes' }, { stepName: 'patientSelection' });
            const result = await runValidation(mtrValidators_1.updateStepSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'completed')).toBe(true);
        });
    });
    describe('medicationSchema', () => {
        it('should validate valid medication array', async () => {
            const req = createMockRequest({
                medications: [{
                        drugName: 'Lisinopril',
                        genericName: 'Lisinopril',
                        strength: { value: 10, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '10 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: '2024-01-01T00:00:00.000Z',
                        indication: 'Hypertension'
                    }]
            });
            const result = await runValidation(mtrValidators_1.medicationSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should require medications to be an array', async () => {
            const req = createMockRequest({
                medications: 'not-an-array'
            });
            const result = await runValidation(mtrValidators_1.medicationSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications')).toBe(true);
        });
        it('should validate required medication fields', async () => {
            const req = createMockRequest({
                medications: [{
                        strength: { value: 10, unit: 'mg' }
                    }]
            });
            const result = await runValidation(mtrValidators_1.medicationSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications[0].drugName')).toBe(true);
            expect(errors.some((error) => error.path === 'medications[0].dosageForm')).toBe(true);
            expect(errors.some((error) => error.path === 'medications[0].instructions.dose')).toBe(true);
        });
        it('should validate strength value is positive', async () => {
            const req = createMockRequest({
                medications: [{
                        drugName: 'Lisinopril',
                        strength: { value: -10, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '10 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: '2024-01-01T00:00:00.000Z',
                        indication: 'Hypertension'
                    }]
            });
            const result = await runValidation(mtrValidators_1.medicationSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications[0].strength.value')).toBe(true);
        });
        it('should validate adherence score range', async () => {
            const req = createMockRequest({
                medications: [{
                        drugName: 'Lisinopril',
                        strength: { value: 10, unit: 'mg' },
                        dosageForm: 'tablet',
                        instructions: {
                            dose: '10 mg',
                            frequency: 'once daily',
                            route: 'oral'
                        },
                        category: 'prescribed',
                        startDate: '2024-01-01T00:00:00.000Z',
                        indication: 'Hypertension',
                        adherenceScore: 150
                    }]
            });
            const result = await runValidation(mtrValidators_1.medicationSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications[0].adherenceScore')).toBe(true);
        });
    });
    describe('createProblemSchema', () => {
        it('should validate valid problem data', async () => {
            const req = createMockRequest({
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin causing increased bleeding risk',
                clinicalSignificance: 'Additive anticoagulant effects increase the risk of bleeding complications',
                evidenceLevel: 'definite',
                affectedMedications: ['Warfarin', 'Aspirin'],
                relatedConditions: ['Atrial fibrillation'],
                riskFactors: ['Age > 65', 'History of bleeding']
            });
            const result = await runValidation(mtrValidators_1.createProblemSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate enum values', async () => {
            const req = createMockRequest({
                category: 'invalid-category',
                type: 'invalid-type',
                severity: 'invalid-severity',
                description: 'Valid description with sufficient length',
                clinicalSignificance: 'Valid clinical significance with sufficient length',
                evidenceLevel: 'invalid-evidence'
            });
            const result = await runValidation(mtrValidators_1.createProblemSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'category')).toBe(true);
            expect(errors.some((error) => error.path === 'type')).toBe(true);
            expect(errors.some((error) => error.path === 'severity')).toBe(true);
            expect(errors.some((error) => error.path === 'evidenceLevel')).toBe(true);
        });
        it('should validate description length', async () => {
            const req = createMockRequest({
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Short',
                clinicalSignificance: 'Valid clinical significance with sufficient length',
                evidenceLevel: 'definite'
            });
            const result = await runValidation(mtrValidators_1.createProblemSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'description')).toBe(true);
        });
        it('should validate clinical significance length', async () => {
            const req = createMockRequest({
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Valid description with sufficient length for testing',
                clinicalSignificance: 'Short',
                evidenceLevel: 'definite'
            });
            const result = await runValidation(mtrValidators_1.createProblemSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'clinicalSignificance')).toBe(true);
        });
    });
    describe('createInterventionSchema', () => {
        it('should validate valid intervention data', async () => {
            const req = createMockRequest({
                type: 'recommendation',
                category: 'medication_change',
                description: 'Recommend discontinuing aspirin due to bleeding risk with concurrent warfarin therapy',
                rationale: 'Patient has high bleeding risk with concurrent warfarin therapy and aspirin provides minimal additional benefit',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called Dr. Smith at 2:00 PM to discuss discontinuing aspirin. Dr. Smith agreed to stop aspirin and will reassess in 2 weeks.',
                priority: 'high',
                urgency: 'within_24h',
                followUpRequired: true,
                followUpDate: '2024-12-31T00:00:00.000Z'
            });
            const result = await runValidation(mtrValidators_1.createInterventionSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate enum values', async () => {
            const req = createMockRequest({
                type: 'invalid-type',
                category: 'invalid-category',
                description: 'Valid description',
                rationale: 'Valid rationale',
                targetAudience: 'invalid-audience',
                communicationMethod: 'invalid-method',
                documentation: 'Valid documentation',
                priority: 'invalid-priority',
                urgency: 'invalid-urgency'
            });
            const result = await runValidation(mtrValidators_1.createInterventionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'type')).toBe(true);
            expect(errors.some((error) => error.path === 'category')).toBe(true);
            expect(errors.some((error) => error.path === 'targetAudience')).toBe(true);
            expect(errors.some((error) => error.path === 'communicationMethod')).toBe(true);
            expect(errors.some((error) => error.path === 'priority')).toBe(true);
            expect(errors.some((error) => error.path === 'urgency')).toBe(true);
        });
        it('should require description, rationale, and documentation', async () => {
            const req = createMockRequest({
                type: 'recommendation',
                category: 'medication_change',
                targetAudience: 'prescriber',
                communicationMethod: 'phone'
            });
            const result = await runValidation(mtrValidators_1.createInterventionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'description')).toBe(true);
            expect(errors.some((error) => error.path === 'rationale')).toBe(true);
            expect(errors.some((error) => error.path === 'documentation')).toBe(true);
        });
        it('should validate field length limits', async () => {
            const req = createMockRequest({
                type: 'recommendation',
                category: 'medication_change',
                description: 'A'.repeat(1001),
                rationale: 'A'.repeat(1001),
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'A'.repeat(2001)
            });
            const result = await runValidation(mtrValidators_1.createInterventionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'description')).toBe(true);
            expect(errors.some((error) => error.path === 'rationale')).toBe(true);
            expect(errors.some((error) => error.path === 'documentation')).toBe(true);
        });
    });
    describe('createFollowUpSchema', () => {
        it('should validate valid follow-up data', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const req = createMockRequest({
                type: 'phone_call',
                description: 'Follow-up call to assess medication adherence and side effects',
                scheduledDate: futureDate,
                estimatedDuration: 30,
                priority: 'medium',
                objectives: ['Check adherence', 'Assess side effects', 'Review lab results'],
                assignedTo: '507f1f77bcf86cd799439011'
            });
            const result = await runValidation(mtrValidators_1.createFollowUpSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate type enum values', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const req = createMockRequest({
                type: 'invalid-type',
                description: 'Valid description',
                scheduledDate: futureDate
            });
            const result = await runValidation(mtrValidators_1.createFollowUpSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'type')).toBe(true);
        });
        it('should require description', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const req = createMockRequest({
                type: 'phone_call',
                scheduledDate: futureDate
            });
            const result = await runValidation(mtrValidators_1.createFollowUpSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'description')).toBe(true);
        });
        it('should validate scheduled date is in future', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const req = createMockRequest({
                type: 'phone_call',
                description: 'Valid description',
                scheduledDate: pastDate
            });
            const result = await runValidation(mtrValidators_1.createFollowUpSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'scheduledDate')).toBe(true);
        });
        it('should validate duration range', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const req = createMockRequest({
                type: 'phone_call',
                description: 'Valid description',
                scheduledDate: futureDate,
                estimatedDuration: 500
            });
            const result = await runValidation(mtrValidators_1.createFollowUpSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'estimatedDuration')).toBe(true);
        });
    });
    describe('mtrParamsSchema', () => {
        it('should validate valid ObjectId', async () => {
            const req = createMockRequest({}, { id: '507f1f77bcf86cd799439011' });
            const result = await runValidation(mtrValidators_1.mtrParamsSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should reject invalid ObjectId format', async () => {
            const req = createMockRequest({}, { id: 'invalid-id' });
            const result = await runValidation(mtrValidators_1.mtrParamsSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'id')).toBe(true);
        });
    });
    describe('mtrQuerySchema', () => {
        it('should validate valid query parameters', async () => {
            const req = createMockRequest({}, {}, {
                page: '1',
                limit: '10',
                status: 'in_progress',
                priority: 'urgent',
                reviewType: 'initial',
                pharmacistId: '507f1f77bcf86cd799439011',
                patientId: '507f1f77bcf86cd799439011'
            });
            const result = await runValidation(mtrValidators_1.mtrQuerySchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should validate page and limit ranges', async () => {
            const req = createMockRequest({}, {}, {
                page: '0',
                limit: '100'
            });
            const result = await runValidation(mtrValidators_1.mtrQuerySchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'page')).toBe(true);
            expect(errors.some((error) => error.path === 'limit')).toBe(true);
        });
        it('should validate enum values in query', async () => {
            const req = createMockRequest({}, {}, {
                status: 'invalid-status',
                priority: 'invalid-priority',
                reviewType: 'invalid-type'
            });
            const result = await runValidation(mtrValidators_1.mtrQuerySchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'status')).toBe(true);
            expect(errors.some((error) => error.path === 'priority')).toBe(true);
            expect(errors.some((error) => error.path === 'reviewType')).toBe(true);
        });
    });
    describe('drugInteractionSchema', () => {
        it('should validate valid medication array for interaction checking', async () => {
            const req = createMockRequest({
                medications: [
                    {
                        drugName: 'Warfarin',
                        genericName: 'Warfarin sodium'
                    },
                    {
                        drugName: 'Aspirin'
                    }
                ]
            });
            const result = await runValidation(mtrValidators_1.drugInteractionSchema, req);
            expect(result.isEmpty()).toBe(true);
        });
        it('should require medications array', async () => {
            const req = createMockRequest({});
            const result = await runValidation(mtrValidators_1.drugInteractionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications')).toBe(true);
        });
        it('should require non-empty medications array', async () => {
            const req = createMockRequest({
                medications: []
            });
            const result = await runValidation(mtrValidators_1.drugInteractionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications')).toBe(true);
        });
        it('should require drug name for each medication', async () => {
            const req = createMockRequest({
                medications: [
                    {
                        genericName: 'Warfarin sodium'
                    }
                ]
            });
            const result = await runValidation(mtrValidators_1.drugInteractionSchema, req);
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.some((error) => error.path === 'medications[0].drugName')).toBe(true);
        });
    });
});
//# sourceMappingURL=mtrValidators.test.js.map