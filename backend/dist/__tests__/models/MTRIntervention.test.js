"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MTRIntervention_1 = __importDefault(require("../../models/MTRIntervention"));
describe('MTRIntervention Model', () => {
    let workplaceId;
    let reviewId;
    let patientId;
    let pharmacistId;
    beforeEach(() => {
        workplaceId = testUtils.createObjectId();
        reviewId = testUtils.createObjectId();
        patientId = testUtils.createObjectId();
        pharmacistId = testUtils.createObjectId();
    });
    describe('Model Creation', () => {
        it('should create a valid MTR intervention', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Recommend discontinuing aspirin due to bleeding risk',
                rationale: 'Patient has high bleeding risk with concurrent warfarin therapy',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called Dr. Smith to discuss discontinuing aspirin. Agreed to stop medication.',
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            const savedIntervention = await intervention.save();
            expect(savedIntervention._id).toBeValidObjectId();
            expect(savedIntervention.workplaceId).toEqual(workplaceId);
            expect(savedIntervention.reviewId).toEqual(reviewId);
            expect(savedIntervention.patientId).toEqual(patientId);
            expect(savedIntervention.type).toBe('recommendation');
            expect(savedIntervention.category).toBe('medication_change');
            expect(savedIntervention.outcome).toBe('pending');
            expect(savedIntervention.priority).toBe('medium');
            expect(savedIntervention.urgency).toBe('routine');
        });
        it('should fail validation without required fields', async () => {
            const intervention = new MTRIntervention_1.default({});
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate enum values', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'invalid_type',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate high priority interventions have detailed documentation', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                priority: 'high',
                documentation: 'This is a detailed documentation for high priority intervention that meets the minimum character requirement for proper validation and compliance with system requirements.',
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow('High priority interventions require detailed documentation');
        });
    });
    describe('Virtual Properties', () => {
        let intervention;
        beforeEach(async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Recommend discontinuing aspirin',
                rationale: 'High bleeding risk',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called prescriber to discuss medication change',
                performedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                createdBy: pharmacistId
            };
            intervention = new MTRIntervention_1.default(interventionData);
            await intervention.save();
        });
        it('should calculate days since intervention', () => {
            expect(intervention.daysSinceIntervention).toBeGreaterThanOrEqual(3);
            expect(intervention.daysSinceIntervention).toBeLessThanOrEqual(4);
        });
        it('should determine follow-up status', () => {
            expect(intervention.followUpStatus).toBe('not_required');
            intervention.followUpRequired = true;
            intervention.followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            expect(intervention.followUpStatus).toBe('pending');
            intervention.followUpCompleted = true;
            expect(intervention.followUpStatus).toBe('completed');
            intervention.followUpCompleted = false;
            intervention.followUpDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(intervention.followUpStatus).toBe('overdue');
        });
        it('should determine intervention effectiveness', () => {
            intervention.outcome = 'accepted';
            expect(intervention.isEffective).toBe(true);
            intervention.outcome = 'modified';
            expect(intervention.isEffective).toBe(true);
            intervention.outcome = 'rejected';
            expect(intervention.isEffective).toBe(false);
            intervention.outcome = 'pending';
            expect(intervention.isEffective).toBe(false);
        });
    });
    describe('Instance Methods', () => {
        let intervention;
        beforeEach(async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Recommend discontinuing aspirin',
                rationale: 'High bleeding risk',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called prescriber to discuss medication change',
                createdBy: pharmacistId
            };
            intervention = new MTRIntervention_1.default(interventionData);
            await intervention.save();
        });
        it('should determine if intervention is overdue', () => {
            expect(intervention.isOverdue()).toBe(false);
            intervention.followUpRequired = true;
            intervention.followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            expect(intervention.isOverdue()).toBe(false);
            intervention.followUpDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(intervention.isOverdue()).toBe(true);
            intervention.followUpCompleted = true;
            expect(intervention.isOverdue()).toBe(false);
        });
        it('should mark intervention as completed', () => {
            intervention.markCompleted('accepted', 'Prescriber agreed to discontinue aspirin');
            expect(intervention.outcome).toBe('accepted');
            expect(intervention.outcomeDetails).toBe('Prescriber agreed to discontinue aspirin');
        });
        it('should mark follow-up as completed for positive outcomes', () => {
            intervention.followUpRequired = true;
            intervention.markCompleted('accepted');
            expect(intervention.followUpCompleted).toBe(true);
        });
        it('should not mark follow-up as completed for negative outcomes', () => {
            intervention.followUpRequired = true;
            intervention.markCompleted('rejected');
            expect(intervention.followUpCompleted).toBe(false);
        });
        it('should determine if follow-up is required', () => {
            expect(intervention.requiresFollowUp()).toBe(false);
            intervention.followUpRequired = true;
            expect(intervention.requiresFollowUp()).toBe(true);
            intervention.followUpCompleted = true;
            expect(intervention.requiresFollowUp()).toBe(false);
        });
    });
    describe('Pre-save Middleware', () => {
        it('should auto-set follow-up date based on urgency', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Urgent intervention',
                rationale: 'Critical safety issue',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Urgent call to prescriber',
                urgency: 'immediate',
                followUpRequired: true,
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await intervention.save();
            expect(intervention.followUpDate).toBeInstanceOf(Date);
            const expectedDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const actualDate = intervention.followUpDate;
            const timeDiff = Math.abs(actualDate.getTime() - expectedDate.getTime());
            expect(timeDiff).toBeLessThan(60 * 1000);
        });
        it('should clear follow-up date if not required', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                followUpRequired: false,
                followUpDate: new Date(),
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await intervention.save();
            expect(intervention.followUpDate).toBeUndefined();
            expect(intervention.followUpCompleted).toBe(false);
        });
    });
    describe('Static Methods', () => {
        beforeEach(async () => {
            const interventionData1 = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'First intervention',
                rationale: 'Safety concern',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Called prescriber to discuss high priority medication intervention and received confirmation of acceptance for the recommended changes to patient therapy plan.',
                outcome: 'accepted',
                priority: 'high',
                createdBy: pharmacistId
            };
            const interventionData2 = {
                workplaceId,
                reviewId: testUtils.createObjectId(),
                patientId: testUtils.createObjectId(),
                pharmacistId,
                type: 'counseling',
                category: 'patient_education',
                description: 'Patient education',
                rationale: 'Improve adherence',
                targetAudience: 'patient',
                communicationMethod: 'in_person',
                documentation: 'Counseled patient on medication use',
                outcome: 'pending',
                priority: 'medium',
                createdBy: pharmacistId
            };
            await MTRIntervention_1.default.create([interventionData1, interventionData2]);
        });
        it('should find interventions by review', async () => {
            const interventions = await MTRIntervention_1.default.findByReview(reviewId, workplaceId);
            expect(interventions).toHaveLength(1);
            expect(interventions[0].reviewId).toEqual(reviewId);
        });
        it('should find interventions by patient', async () => {
            const interventions = await MTRIntervention_1.default.findByPatient(patientId, workplaceId);
            expect(interventions).toHaveLength(1);
            expect(interventions[0].patientId).toEqual(patientId);
        });
        it('should find pending interventions', async () => {
            const pendingInterventions = await MTRIntervention_1.default.findPending(workplaceId);
            expect(pendingInterventions).toHaveLength(1);
            expect(pendingInterventions[0].outcome).toBe('pending');
        });
        it('should find overdue follow-ups', async () => {
            await MTRIntervention_1.default.updateOne({ outcome: 'accepted' }, {
                followUpRequired: true,
                followUpCompleted: false,
                followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });
            const overdueFollowUps = await MTRIntervention_1.default.findOverdueFollowUps(workplaceId);
            expect(overdueFollowUps).toHaveLength(1);
            expect(overdueFollowUps[0].followUpRequired).toBe(true);
            expect(overdueFollowUps[0].followUpCompleted).toBe(false);
        });
        it('should get intervention statistics', async () => {
            const stats = await MTRIntervention_1.default.getStatistics(workplaceId);
            expect(stats.totalInterventions).toBe(2);
            expect(stats.acceptedInterventions).toBe(1);
            expect(stats.pendingInterventions).toBe(1);
            expect(stats.acceptanceRate).toBe(50);
        });
    });
    describe('Validation Rules', () => {
        it('should validate description length', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'A'.repeat(1001),
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate rationale length', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'A'.repeat(1001),
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate documentation length', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'A'.repeat(2001),
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
        it('should validate acceptance rate range', async () => {
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                acceptanceRate: 150,
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow();
        });
    });
    describe('Follow-up Date Validation', () => {
        it('should validate follow-up date is after intervention date', async () => {
            const performedAt = new Date();
            const followUpDate = new Date(performedAt.getTime() - 24 * 60 * 60 * 1000);
            const interventionData = {
                workplaceId,
                reviewId,
                patientId,
                pharmacistId,
                type: 'recommendation',
                category: 'medication_change',
                description: 'Test intervention',
                rationale: 'Test rationale',
                targetAudience: 'prescriber',
                communicationMethod: 'phone',
                documentation: 'Test documentation',
                performedAt,
                followUpRequired: true,
                followUpDate,
                createdBy: pharmacistId
            };
            const intervention = new MTRIntervention_1.default(interventionData);
            await expect(intervention.save()).rejects.toThrow('Follow-up date must be after intervention date');
        });
    });
});
//# sourceMappingURL=MTRIntervention.test.js.map