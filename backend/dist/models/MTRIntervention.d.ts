import mongoose, { Document } from 'mongoose';
export interface IMTRIntervention extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    reviewId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    type: 'recommendation' | 'counseling' | 'monitoring' | 'communication' | 'education';
    category: 'medication_change' | 'adherence_support' | 'monitoring_plan' | 'patient_education';
    description: string;
    rationale: string;
    targetAudience: 'patient' | 'prescriber' | 'caregiver' | 'healthcare_team';
    communicationMethod: 'verbal' | 'written' | 'phone' | 'email' | 'fax' | 'in_person';
    outcome: 'accepted' | 'rejected' | 'modified' | 'pending' | 'not_applicable';
    outcomeDetails: string;
    acceptanceRate?: number;
    followUpRequired: boolean;
    followUpDate?: Date;
    followUpCompleted: boolean;
    documentation: string;
    attachments: string[];
    priority: 'high' | 'medium' | 'low';
    urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine';
    pharmacistId: mongoose.Types.ObjectId;
    performedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    daysSinceIntervention: number;
    followUpStatus: string;
    isEffective: boolean;
    isOverdue(): boolean;
    markCompleted(outcome: string, details?: string): void;
    requiresFollowUp(): boolean;
}
declare const _default: mongoose.Model<IMTRIntervention, {}, {}, {}, mongoose.Document<unknown, {}, IMTRIntervention> & IMTRIntervention & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=MTRIntervention.d.ts.map