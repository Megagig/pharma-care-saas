import mongoose, { Document } from 'mongoose';
export interface IMedication extends Document {
    patient: mongoose.Types.ObjectId;
    pharmacist: mongoose.Types.ObjectId;
    drugName: string;
    genericName?: string;
    strength: {
        value?: number;
        unit?: string;
    };
    dosageForm: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'inhaler' | 'other';
    instructions: {
        dosage?: string;
        frequency?: string;
        duration?: string;
        specialInstructions?: string;
    };
    prescriber: {
        name?: string;
        npi?: string;
        contact?: string;
    };
    prescription: {
        rxNumber?: string;
        dateIssued?: Date;
        dateExpires?: Date;
        refillsRemaining?: number;
    };
    therapy: {
        indication?: string;
        goalOfTherapy?: string;
        monitoring?: string[];
    };
    interactions: Array<{
        interactingDrug?: string;
        severity?: 'minor' | 'moderate' | 'major';
        description?: string;
    }>;
    sideEffects: string[];
    status: 'active' | 'discontinued' | 'completed';
    adherence: {
        lastReported?: Date;
        score?: number;
    };
    isManual?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMedication, {}, {}, {}, mongoose.Document<unknown, {}, IMedication> & IMedication & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Medication.d.ts.map