import mongoose, { Document } from 'mongoose';
export interface IPatientVitals {
    bpSystolic?: number;
    bpDiastolic?: number;
    rr?: number;
    tempC?: number;
    heartSounds?: string;
    pallor?: 'none' | 'mild' | 'moderate' | 'severe';
    dehydration?: 'none' | 'mild' | 'moderate' | 'severe';
    recordedAt?: Date;
}
export interface IPatient extends Document {
    _id: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    mrn: string;
    firstName: string;
    lastName: string;
    otherNames?: string;
    dob?: Date;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    email?: string;
    address?: string;
    state?: string;
    lga?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    genotype?: 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'CC';
    weightKg?: number;
    latestVitals?: IPatientVitals;
    hasActiveDTP?: boolean;
    isDeleted: boolean;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    getAge(): number;
    getDisplayName(): string;
    updateLatestVitals(vitals: IPatientVitals): void;
}
declare const _default: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient> & IPatient & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Patient.d.ts.map