import mongoose, { Document } from 'mongoose';
export interface IAttachment {
    _id?: mongoose.Types.ObjectId;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
}
export interface ILabResult {
    test: string;
    result: string;
    normalRange: string;
    date: Date;
    status: 'normal' | 'abnormal' | 'critical';
}
export interface IVitalSigns {
    bloodPressure?: {
        systolic?: number;
        diastolic?: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    recordedAt?: Date;
}
export interface IClinicalNote extends Document {
    patient: mongoose.Types.ObjectId;
    pharmacist: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    type: 'consultation' | 'medication_review' | 'follow_up' | 'adverse_event' | 'other';
    title: string;
    content: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    };
    medications: mongoose.Types.ObjectId[];
    vitalSigns?: IVitalSigns;
    laborResults: ILabResult[];
    recommendations: string[];
    followUpRequired: boolean;
    followUpDate?: Date;
    attachments: IAttachment[];
    priority: 'low' | 'medium' | 'high';
    isConfidential: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IClinicalNote, {}, {}, {}, mongoose.Document<unknown, {}, IClinicalNote> & IClinicalNote & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=ClinicalNote.d.ts.map