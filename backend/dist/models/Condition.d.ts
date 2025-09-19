import mongoose, { Document } from 'mongoose';
export interface ICondition extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    name: string;
    snomedId?: string;
    onsetDate?: Date;
    status?: 'active' | 'resolved' | 'remission';
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICondition, {}, {}, {}, mongoose.Document<unknown, {}, ICondition> & ICondition & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Condition.d.ts.map