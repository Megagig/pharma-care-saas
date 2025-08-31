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
    patientId: mongoose.Types.ObjectId;
    date: Date;
    soap: ISOAPNotes;
    attachments?: IAttachment[];
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IVisit, {}, {}, {}, mongoose.Document<unknown, {}, IVisit> & IVisit & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Visit.d.ts.map