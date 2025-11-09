import mongoose, { Document } from 'mongoose';
export interface IAttachment {
    kind: 'lab' | 'image' | 'audio' | 'other';
    url: string;
    uploadedAt: Date;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
}
export interface ISOAPNotes {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
}
export interface IVisit extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    patientId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    date: Date;
    soap: ISOAPNotes;
    attachments?: IAttachment[];
    patientSummary?: {
        summary: string;
        keyPoints: string[];
        nextSteps: string[];
        visibleToPatient: boolean;
        summarizedBy?: mongoose.Types.ObjectId;
        summarizedAt?: Date;
    };
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    addPatientSummary(summaryData: any, userId: mongoose.Types.ObjectId): Promise<void>;
    updatePatientSummary(summaryData: any): Promise<void>;
    makeVisibleToPatient(): Promise<void>;
    hideFromPatient(): Promise<void>;
    hasPatientSummary(): boolean;
    isVisibleToPatient(): boolean;
}
declare const _default: mongoose.Model<IVisit, {}, {}, {}, mongoose.Document<unknown, {}, IVisit> & IVisit & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Visit.d.ts.map