import mongoose, { Document } from 'mongoose';
export interface IMedicationRecord extends Document {
    _id: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    phase: 'past' | 'current';
    medicationName: string;
    purposeIndication?: string;
    dose?: string;
    frequency?: string;
    route?: string;
    duration?: string;
    startDate?: Date;
    endDate?: Date;
    adherence?: 'good' | 'poor' | 'unknown';
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMedicationRecord, {}, {}, {}, mongoose.Document<unknown, {}, IMedicationRecord> & IMedicationRecord & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=MedicationRecord.d.ts.map