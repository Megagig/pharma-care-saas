"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClinicalIntervention_1 = __importDefault(require("../../models/ClinicalIntervention"));
describe('ClinicalIntervention Model - Simple Test', () => {
    it('should import the model without errors', () => {
        expect(ClinicalIntervention_1.default).toBeDefined();
        expect(ClinicalIntervention_1.default.modelName).toBe('ClinicalIntervention');
    });
    it('should have the correct schema structure', () => {
        const schema = ClinicalIntervention_1.default.schema;
        expect(schema.paths.workplaceId).toBeDefined();
        expect(schema.paths.patientId).toBeDefined();
        expect(schema.paths.interventionNumber).toBeDefined();
        expect(schema.paths.category).toBeDefined();
        expect(schema.paths.priority).toBeDefined();
        expect(schema.paths.issueDescription).toBeDefined();
        expect(schema.paths.identifiedBy).toBeDefined();
        expect(schema.paths.strategies).toBeDefined();
        expect(schema.paths.assignments).toBeDefined();
        expect(schema.paths.status).toBeDefined();
        expect(schema.paths.outcomes || schema.paths['outcomes.patientResponse']).toBeDefined();
        expect(schema.paths.followUp || schema.paths['followUp.required']).toBeDefined();
        expect(schema.paths.startedAt).toBeDefined();
    });
    it('should have correct enum values for category', () => {
        const categoryPath = ClinicalIntervention_1.default.schema.paths.category;
        const enumValues = categoryPath.enumValues;
        expect(enumValues).toContain('drug_therapy_problem');
        expect(enumValues).toContain('adverse_drug_reaction');
        expect(enumValues).toContain('medication_nonadherence');
        expect(enumValues).toContain('drug_interaction');
        expect(enumValues).toContain('dosing_issue');
        expect(enumValues).toContain('contraindication');
        expect(enumValues).toContain('other');
    });
    it('should have correct enum values for priority', () => {
        const priorityPath = ClinicalIntervention_1.default.schema.paths.priority;
        const enumValues = priorityPath.enumValues;
        expect(enumValues).toContain('low');
        expect(enumValues).toContain('medium');
        expect(enumValues).toContain('high');
        expect(enumValues).toContain('critical');
    });
    it('should have correct enum values for status', () => {
        const statusPath = ClinicalIntervention_1.default.schema.paths.status;
        const enumValues = statusPath.enumValues;
        expect(enumValues).toContain('identified');
        expect(enumValues).toContain('planning');
        expect(enumValues).toContain('in_progress');
        expect(enumValues).toContain('implemented');
        expect(enumValues).toContain('completed');
        expect(enumValues).toContain('cancelled');
    });
    it('should have static methods defined', () => {
        expect(typeof ClinicalIntervention_1.default.generateNextInterventionNumber).toBe('function');
        expect(typeof ClinicalIntervention_1.default.findActive).toBe('function');
        expect(typeof ClinicalIntervention_1.default.findOverdue).toBe('function');
        expect(typeof ClinicalIntervention_1.default.findByPatient).toBe('function');
        expect(typeof ClinicalIntervention_1.default.findAssignedToUser).toBe('function');
    });
});
//# sourceMappingURL=ClinicalIntervention.simple.test.js.map