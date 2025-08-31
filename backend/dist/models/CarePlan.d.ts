import mongoose, { Document } from 'mongoose';
export interface ICarePlan extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    visitId?: mongoose.Types.ObjectId;
    goals: string[];
    objectives: string[];
    followUpDate?: Date;
    planQuality: 'adequate' | 'needsReview';
    dtpSummary?: 'resolved' | 'unresolved';
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICarePlan, {}, {}, {}, mongoose.Document<unknown, {}, ICarePlan> & ICarePlan & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=CarePlan.d.ts.map