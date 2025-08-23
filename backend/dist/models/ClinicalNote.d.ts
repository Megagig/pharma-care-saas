import mongoose, { Document } from 'mongoose';
export interface IClinicalNote extends Document {
    patient: mongoose.Types.ObjectId;
    pharmacist: mongoose.Types.ObjectId;
    type: 'consultation' | 'medication_review' | 'follow_up' | 'adverse_event' | 'other';
    title: string;
    content: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    };
    medications: mongoose.Types.ObjectId[];
    vitalSigns: {
        bloodPressure?: {
            systolic?: number;
            diastolic?: number;
        };
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
    };
    laborResults: Array<{
        test: string;
        result: string;
        normalRange: string;
        date: Date;
    }>;
    recommendations: string[];
    followUpRequired: boolean;
    followUpDate?: Date;
    attachments: string[];
    priority: 'low' | 'medium' | 'high';
    isConfidential: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IClinicalNote, {}, {}, {}, mongoose.Document<unknown, {}, IClinicalNote> & IClinicalNote & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=ClinicalNote.d.ts.map