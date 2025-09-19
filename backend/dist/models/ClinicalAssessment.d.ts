import mongoose, { Document } from 'mongoose';
export interface IVitals {
    bpSys?: number;
    bpDia?: number;
    rr?: number;
    tempC?: number;
    heartSounds?: string;
    pallor?: 'none' | 'mild' | 'moderate' | 'severe';
    dehydration?: 'none' | 'mild' | 'moderate' | 'severe';
}
export interface ILabs {
    pcv?: number;
    mcs?: string;
    eucr?: string;
    fbc?: string;
    fbs?: number;
    hba1c?: number;
    misc?: Record<string, string | number>;
}
export interface IClinicalAssessment extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    visitId?: mongoose.Types.ObjectId;
    vitals?: IVitals;
    labs?: ILabs;
    recordedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IClinicalAssessment, {}, {}, {}, mongoose.Document<unknown, {}, IClinicalAssessment> & IClinicalAssessment & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=ClinicalAssessment.d.ts.map