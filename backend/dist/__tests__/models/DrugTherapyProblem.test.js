"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DrugTherapyProblem_1 = __importDefault(require("../../models/DrugTherapyProblem"));
describe('DrugTherapyProblem Model', () => {
    let workplaceId;
    let patientId;
    let reviewId;
    let identifiedBy;
    beforeEach(() => {
        workplaceId = testUtils.createObjectId();
        patientId = testUtils.createObjectId();
        reviewId = testUtils.createObjectId();
        identifiedBy = testUtils.createObjectId();
    });
    describe('Model Creation', () => {
        it('should create a valid drug therapy problem', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                affectedMedications: ['Warfarin', 'Aspirin'],
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            const savedDtp = await dtp.save();
            expect(savedDtp._id).toBeValidObjectId();
            expect(savedDtp.workplaceId).toEqual(workplaceId);
            expect(savedDtp.patientId).toEqual(patientId);
            expect(savedDtp.reviewId).toEqual(reviewId);
            expect(savedDtp.category).toBe('safety');
            expect(savedDtp.type).toBe('interaction');
            expect(savedDtp.severity).toBe('major');
            expect(savedDtp.status).toBe('identified');
            expect(savedDtp.evidenceLevel).toBe('definite');
        });
        it('should fail validation without required fields', async () => {
            const dtp = new DrugTherapyProblem_1.default({});
            await expect(dtp.save()).rejects.toThrow();
        });
        it('should validate enum values', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'invalid_category',
                type: 'interaction',
                severity: 'major',
                description: 'Test problem',
                clinicalSignificance: 'Test significance',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow();
        });
        it('should validate description length for critical severity', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'critical',
                description: 'Short',
                clinicalSignificance: 'Test significance',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow('critical severity DTPs require detailed description');
        });
        it('should validate clinical significance for high evidence levels', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin causing bleeding risk',
                clinicalSignificance: 'Short',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow('DTPs with definite evidence level require clinical significance explanation');
        });
    });
    describe('Virtual Properties', () => {
        let dtp;
        beforeEach(async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            dtp = new DrugTherapyProblem_1.default(dtpData);
            await dtp.save();
        });
        it('should calculate priority based on severity and evidence level', () => {
            dtp.severity = 'critical';
            expect(dtp.priority).toBe('high');
            dtp.severity = 'major';
            dtp.evidenceLevel = 'definite';
            expect(dtp.priority).toBe('high');
            dtp.evidenceLevel = 'probable';
            expect(dtp.priority).toBe('high');
            dtp.evidenceLevel = 'possible';
            expect(dtp.priority).toBe('medium');
            dtp.severity = 'moderate';
            dtp.evidenceLevel = 'definite';
            expect(dtp.priority).toBe('medium');
            dtp.severity = 'minor';
            expect(dtp.priority).toBe('low');
        });
        it('should provide human-readable type display', () => {
            dtp.type = 'interaction';
            expect(dtp.typeDisplay).toBe('Drug Interaction');
            dtp.type = 'doseTooHigh';
            expect(dtp.typeDisplay).toBe('Dose Too High');
            dtp.type = 'unnecessaryMedication';
            expect(dtp.typeDisplay).toBe('unnecessaryMedication');
        });
        it('should calculate resolution duration', async () => {
            expect(dtp.resolutionDurationDays).toBeNull();
            dtp.resolution = {
                action: 'Discontinued aspirin',
                outcome: 'Bleeding risk reduced',
                resolvedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                resolvedBy: identifiedBy
            };
            expect(dtp.resolutionDurationDays).toBeGreaterThanOrEqual(3);
            expect(dtp.resolutionDurationDays).toBeLessThanOrEqual(4);
        });
    });
    describe('Instance Methods', () => {
        let dtp;
        beforeEach(async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            dtp = new DrugTherapyProblem_1.default(dtpData);
            await dtp.save();
        });
        it('should resolve problem correctly', () => {
            const resolvedBy = testUtils.createObjectId();
            dtp.resolve('Discontinued aspirin', 'Bleeding risk eliminated', resolvedBy);
            expect(dtp.status).toBe('resolved');
            expect(dtp.resolution?.action).toBe('Discontinued aspirin');
            expect(dtp.resolution?.outcome).toBe('Bleeding risk eliminated');
            expect(dtp.resolution?.resolvedBy).toEqual(resolvedBy);
            expect(dtp.resolution?.resolvedAt).toBeInstanceOf(Date);
            expect(dtp.updatedBy).toEqual(resolvedBy);
        });
        it('should reopen problem correctly', () => {
            const reopenedBy = testUtils.createObjectId();
            dtp.resolve('Test action', 'Test outcome');
            expect(dtp.status).toBe('resolved');
            dtp.reopen(reopenedBy);
            expect(dtp.status).toBe('identified');
            expect(dtp.resolution?.resolvedAt).toBeUndefined();
            expect(dtp.updatedBy).toEqual(reopenedBy);
        });
        it('should identify high severity problems', () => {
            dtp.severity = 'critical';
            expect(dtp.isHighSeverity()).toBe(true);
            dtp.severity = 'major';
            expect(dtp.isHighSeverity()).toBe(true);
            dtp.severity = 'moderate';
            expect(dtp.isHighSeverity()).toBe(false);
            dtp.severity = 'minor';
            expect(dtp.isHighSeverity()).toBe(false);
        });
        it('should identify critical problems', () => {
            dtp.severity = 'critical';
            expect(dtp.isCritical()).toBe(true);
            dtp.severity = 'major';
            expect(dtp.isCritical()).toBe(false);
        });
        it('should determine overdue status', () => {
            dtp.severity = 'critical';
            dtp.identifiedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            expect(dtp.isOverdue()).toBe(true);
            dtp.identifiedAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
            expect(dtp.isOverdue()).toBe(false);
            dtp.severity = 'major';
            dtp.identifiedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
            expect(dtp.isOverdue()).toBe(true);
            dtp.status = 'resolved';
            expect(dtp.isOverdue()).toBe(false);
        });
    });
    describe('Pre-save Middleware', () => {
        it('should auto-set resolution details when status changes to resolved', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await dtp.save();
            dtp.status = 'resolved';
            await dtp.save();
            expect(dtp.resolution).toBeDefined();
            if (dtp.resolution) {
                expect(dtp.resolution.action).toBe('Status updated to resolved');
                expect(dtp.resolution.outcome).toBe('Problem resolved');
                expect(dtp.resolution.resolvedAt).toBeInstanceOf(Date);
            }
        });
        it('should clear resolution details when status changes from resolved', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy,
                status: 'resolved',
                resolution: {
                    action: 'Test action',
                    outcome: 'Test outcome',
                    resolvedAt: new Date()
                }
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await dtp.save();
            dtp.status = 'identified';
            await dtp.save();
            expect(dtp.resolution?.resolvedAt).toBeUndefined();
        });
    });
    describe('Static Methods', () => {
        beforeEach(async () => {
            const dtpData1 = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'critical',
                description: 'Critical drug interaction',
                clinicalSignificance: 'High risk of adverse events',
                evidenceLevel: 'definite',
                status: 'identified',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtpData2 = {
                workplaceId,
                patientId: testUtils.createObjectId(),
                reviewId: testUtils.createObjectId(),
                category: 'effectiveness',
                type: 'doseTooLow',
                severity: 'moderate',
                description: 'Subtherapeutic dose',
                clinicalSignificance: 'May not achieve therapeutic goals',
                evidenceLevel: 'probable',
                status: 'resolved',
                identifiedBy,
                createdBy: identifiedBy
            };
            await DrugTherapyProblem_1.default.create([dtpData1, dtpData2]);
        });
        it('should find problems by patient', async () => {
            const problems = await DrugTherapyProblem_1.default.findByPatient(patientId, undefined, workplaceId);
            expect(problems).toHaveLength(1);
            expect(problems[0].patientId).toEqual(patientId);
        });
        it('should find problems by type', async () => {
            const problems = await DrugTherapyProblem_1.default.findByType('interaction', undefined, workplaceId);
            expect(problems).toHaveLength(1);
            expect(problems[0].type).toBe('interaction');
        });
        it('should find active problems', async () => {
            const activeProblems = await DrugTherapyProblem_1.default.findActive(workplaceId);
            expect(activeProblems).toHaveLength(1);
            expect(activeProblems[0].status).toBe('identified');
        });
        it('should find problems by review', async () => {
            const problems = await DrugTherapyProblem_1.default.findByReview(reviewId, workplaceId);
            expect(problems).toHaveLength(1);
            expect(problems[0].reviewId).toEqual(reviewId);
        });
        it('should get statistics', async () => {
            const stats = await DrugTherapyProblem_1.default.getStatistics(workplaceId);
            expect(stats.totalDTPs).toBe(2);
            expect(stats.resolvedDTPs).toBe(1);
            expect(stats.resolutionRate).toBe(50);
        });
    });
    describe('Validation Rules', () => {
        it('should validate affected medications array', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                affectedMedications: ['A'.repeat(201)],
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow();
        });
        it('should validate risk factors array', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'Drug interaction between warfarin and aspirin',
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                riskFactors: ['A'.repeat(201)],
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow();
        });
        it('should validate description length limits', async () => {
            const dtpData = {
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                type: 'interaction',
                severity: 'major',
                description: 'A'.repeat(1001),
                clinicalSignificance: 'Increased bleeding risk due to additive anticoagulant effects',
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            };
            const dtp = new DrugTherapyProblem_1.default(dtpData);
            await expect(dtp.save()).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=DrugTherapyProblem.test.js.map