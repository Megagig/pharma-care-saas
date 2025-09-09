import mongoose, { Document } from 'mongoose';
export interface IAdherenceLog extends Document {
    _id: mongoose.Types.ObjectId;
    medicationId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    refillDate: Date;
    adherenceScore: number;
    pillCount?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IAdherenceLog, {}, {}, {}, mongoose.Document<unknown, {}, IAdherenceLog> & IAdherenceLog & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=AdherenceLog.d.ts.map