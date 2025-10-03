import mongoose, { Document } from 'mongoose';
export interface IInterventionStrategy {
    type: 'medication_review' | 'dose_adjustment' | 'alternative_therapy' | 'discontinuation' | 'additional_monitoring' | 'patient_counseling' | 'physician_consultation' | 'custom';
    description: string;
    rationale: string;
    expectedOutcome: string;
    priority: 'primary' | 'secondary';
}
export interface ITeamAssignment {
    userId: mongoose.Types.ObjectId;
    role: 'pharmacist' | 'physician' | 'nurse' | 'patient' | 'caregiver';
    task: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    assignedAt: Date;
    completedAt?: Date;
    notes?: string;
}
export interface IClinicalParameter {
    parameter: string;
    beforeValue?: string;
    afterValue?: string;
    unit?: string;
    improvementPercentage?: number;
}
export interface ISuccessMetrics {
    problemResolved: boolean;
    medicationOptimized: boolean;
    adherenceImproved: boolean;
    adherenceImprovement?: number;
    costSavings?: number;
    qualityOfLifeImproved?: boolean;
    patientSatisfaction?: number;
}
export interface IInterventionOutcome {
    patientResponse: 'improved' | 'no_change' | 'worsened' | 'unknown';
    clinicalParameters: IClinicalParameter[];
    adverseEffects?: string;
    additionalIssues?: string;
    successMetrics: ISuccessMetrics;
}
export interface IFollowUp {
    required: boolean;
    scheduledDate?: Date;
    completedDate?: Date;
    notes?: string;
    nextReviewDate?: Date;
}
export interface IClinicalIntervention extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    interventionNumber: string;
    category: 'drug_therapy_problem' | 'adverse_drug_reaction' | 'medication_nonadherence' | 'drug_interaction' | 'dosing_issue' | 'contraindication' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    issueDescription: string;
    identifiedDate: Date;
    identifiedBy: mongoose.Types.ObjectId;
    strategies: IInterventionStrategy[];
    assignments: ITeamAssignment[];
    status: 'identified' | 'planning' | 'in_progress' | 'implemented' | 'completed' | 'cancelled';
    implementationNotes?: string;
    type?: string;
    outcome?: 'successful' | 'partially_successful' | 'unsuccessful' | 'unknown';
    outcomes?: IInterventionOutcome;
    adherenceImprovement?: number;
    costSavings?: number;
    patientSatisfaction?: number;
    followUp: IFollowUp;
    startedAt: Date;
    completedAt?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    relatedMTRId?: mongoose.Types.ObjectId;
    relatedDTPIds: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    durationDays: number;
    isOverdue: boolean;
    getCompletionPercentage(): number;
    getNextStep(): string | null;
    canComplete(): boolean;
    addStrategy(strategy: IInterventionStrategy): void;
    assignTeamMember(assignment: ITeamAssignment): void;
    recordOutcome(outcome: IInterventionOutcome): void;
    generateInterventionNumber(): string;
}
export interface IClinicalInterventionModel extends mongoose.Model<IClinicalIntervention> {
    generateNextInterventionNumber(workplaceId: mongoose.Types.ObjectId): Promise<string>;
    findActive(workplaceId?: mongoose.Types.ObjectId): mongoose.Query<IClinicalIntervention[], IClinicalIntervention>;
    findOverdue(workplaceId?: mongoose.Types.ObjectId): mongoose.Query<IClinicalIntervention[], IClinicalIntervention>;
    findByPatient(patientId: mongoose.Types.ObjectId, workplaceId?: mongoose.Types.ObjectId): mongoose.Query<IClinicalIntervention[], IClinicalIntervention>;
    findAssignedToUser(userId: mongoose.Types.ObjectId, workplaceId?: mongoose.Types.ObjectId): mongoose.Query<IClinicalIntervention[], IClinicalIntervention>;
}
declare const ClinicalIntervention: IClinicalInterventionModel;
export { ClinicalIntervention };
export default ClinicalIntervention;
//# sourceMappingURL=ClinicalIntervention.d.ts.map