import mongoose, { Document } from 'mongoose';
export interface IPatient extends Document {
    pharmacist: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    contactInfo: {
        phone: string;
        email?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            zipCode?: string;
        };
    };
    medicalInfo: {
        allergies: string[];
        chronicConditions: string[];
        emergencyContact?: {
            name?: string;
            relationship?: string;
            phone?: string;
        };
    };
    insuranceInfo?: {
        provider?: string;
        memberId?: string;
        groupNumber?: string;
    };
    medications: mongoose.Types.ObjectId[];
    clinicalNotes: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient> & IPatient & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Patient.d.ts.map