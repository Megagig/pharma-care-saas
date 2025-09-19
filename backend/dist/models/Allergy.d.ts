import mongoose, { Document } from 'mongoose';
export interface IAllergy extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    substance: string;
    reaction?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    notedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAllergy, {}, {}, {}, mongoose.Document<unknown, {}, IAllergy> & IAllergy & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Allergy.d.ts.map