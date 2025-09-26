import mongoose, { Document } from 'mongoose';
export interface IMedicationHistory {
    name?: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    startDate?: Date;
    endDate?: Date;
    indication?: string;
    prescriber?: string;
    cost?: number;
    sellingPrice?: number;
    status?: 'active' | 'archived' | 'cancelled';
    updatedAt: Date;
    updatedBy?: mongoose.Types.ObjectId;
    notes?: string;
}
export interface IMedicationManagement extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate?: Date;
    endDate?: Date;
    indication?: string;
    prescriber?: string;
    allergyCheck: {
        status: boolean;
        details?: string;
    };
    interactionCheck?: {
        status: boolean;
        details?: string;
        severity?: 'minor' | 'moderate' | 'severe';
    };
    cost?: number;
    sellingPrice?: number;
    status: 'active' | 'archived' | 'cancelled';
    history: IMedicationHistory[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IMedicationManagement, {}, {}, {}, mongoose.Document<unknown, {}, IMedicationManagement> & IMedicationManagement & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=MedicationManagement.d.ts.map