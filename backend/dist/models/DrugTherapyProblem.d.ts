import mongoose, { Document } from 'mongoose';
export interface IDrugTherapyProblem extends Document {
    _id: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    visitId?: mongoose.Types.ObjectId;
    type: 'unnecessary' | 'wrongDrug' | 'doseTooLow' | 'doseTooHigh' | 'adverseReaction' | 'inappropriateAdherence' | 'needsAdditional';
    description?: string;
    status: 'unresolved' | 'resolved';
    resolvedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDrugTherapyProblem, {}, {}, {}, mongoose.Document<unknown, {}, IDrugTherapyProblem> & IDrugTherapyProblem & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=DrugTherapyProblem.d.ts.map