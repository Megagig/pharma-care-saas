import mongoose from 'mongoose';
import { IMedicationTherapyReview, IMTRMedicationEntry } from '../models/MedicationTherapyReview';
import { IDrugTherapyProblem } from '../models/DrugTherapyProblem';
export interface MTRWorkflowStep {
    name: string;
    title: string;
    description: string;
    required: boolean;
    dependencies: string[];
    validationRules: string[];
}
export interface StepValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    canProceed: boolean;
}
export interface DrugInteractionResult {
    hasInteractions: boolean;
    interactions: DrugInteraction[];
    duplicateTherapies: DuplicateTherapy[];
    contraindications: Contraindication[];
    severity: 'critical' | 'major' | 'moderate' | 'minor' | 'none';
}
export interface DrugInteraction {
    drug1: string;
    drug2: string;
    severity: 'critical' | 'major' | 'moderate' | 'minor';
    mechanism: string;
    clinicalEffect: string;
    management: string;
    references: string[];
}
export interface DuplicateTherapy {
    medications: string[];
    therapeuticClass: string;
    reason: string;
    recommendation: string;
}
export interface Contraindication {
    medication: string;
    condition: string;
    severity: 'absolute' | 'relative';
    reason: string;
    alternatives: string[];
}
export interface AuditLogEntry {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    timestamp: Date;
    details: any;
    ipAddress?: string;
    userAgent?: string;
}
declare class MTRWorkflowService {
    private static readonly WORKFLOW_STEPS;
    static getWorkflowSteps(): MTRWorkflowStep[];
    static getNextStep(currentSteps: any): string | null;
    static validateStep(stepName: string, session: IMedicationTherapyReview, data?: any): Promise<StepValidationResult>;
    private static validatePatientSelection;
    private static validateMedicationHistory;
    private static validateTherapyAssessment;
    private static validatePlanDevelopment;
    private static validateInterventions;
    private static validateFollowUp;
    static canCompleteWorkflow(session: IMedicationTherapyReview): Promise<StepValidationResult>;
}
declare class DrugInteractionService {
    static checkInteractions(medications: IMTRMedicationEntry[]): Promise<DrugInteractionResult>;
    private static getMockInteractions;
    private static getMockDuplicateTherapies;
    private static getMockContraindications;
    private static groupMedicationsByClass;
    private static calculateOverallSeverity;
    static generateProblemsFromInteractions(interactions: DrugInteractionResult, reviewId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, identifiedBy: mongoose.Types.ObjectId): Promise<IDrugTherapyProblem[]>;
}
declare class MTRAuditService {
    private static auditLogs;
    static logActivity(action: string, resourceType: string, resourceId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, details: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static getAuditLogs(workplaceId?: mongoose.Types.ObjectId, userId?: mongoose.Types.ObjectId, resourceType?: string, action?: string, startDate?: Date, endDate?: Date, limit?: number): Promise<AuditLogEntry[]>;
    static logSessionCreation(sessionId: string, patientId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, sessionData: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logStepCompletion(sessionId: string, stepName: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, stepData: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logProblemIdentification(problemId: string, sessionId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, problemData: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logInterventionRecording(interventionId: string, sessionId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, interventionData: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logSessionCompletion(sessionId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, completionData: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logDataAccess(resourceType: string, resourceId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, accessType: 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT', ipAddress?: string, userAgent?: string): Promise<void>;
    static generateComplianceReport(workplaceId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any>;
    private static aggregateUserActivity;
    private static aggregateDailyActivity;
    private static identifyRiskEvents;
}
export { MTRWorkflowService, DrugInteractionService, MTRAuditService };
//# sourceMappingURL=mtrService.d.ts.map