import mongoose, { Document } from 'mongoose';
export interface IDrugTherapyProblem extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    visitId?: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
    category: 'indication' | 'effectiveness' | 'safety' | 'adherence';
    subcategory: string;
    type: 'unnecessary' | 'wrongDrug' | 'doseTooLow' | 'doseTooHigh' | 'adverseReaction' | 'inappropriateAdherence' | 'needsAdditional' | 'interaction' | 'duplication' | 'contraindication' | 'monitoring';
    severity: 'critical' | 'major' | 'moderate' | 'minor';
    description: string;
    clinicalSignificance: string;
    affectedMedications: string[];
    relatedConditions: string[];
    evidenceLevel: 'definite' | 'probable' | 'possible' | 'unlikely';
    riskFactors: string[];
    status: 'identified' | 'addressed' | 'monitoring' | 'resolved' | 'not_applicable';
    resolution?: {
        action: string;
        outcome: string;
        resolvedAt?: Date;
        resolvedBy?: mongoose.Types.ObjectId;
    };
    identifiedBy: mongoose.Types.ObjectId;
    identifiedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    priority: string;
    typeDisplay: string;
    resolutionDurationDays: number | null;
    resolve(action: string, outcome: string, resolvedBy?: mongoose.Types.ObjectId): void;
    reopen(reopenedBy: mongoose.Types.ObjectId): void;
    isHighSeverity(): boolean;
    isCritical(): boolean;
    isOverdue(): boolean;
}
declare const _default: mongoose.Model<IDrugTherapyProblem, {}, {}, {}, mongoose.Document<unknown, {}, IDrugTherapyProblem> & IDrugTherapyProblem & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=DrugTherapyProblem.d.ts.map