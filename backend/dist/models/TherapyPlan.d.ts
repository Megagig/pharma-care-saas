import mongoose, { Document } from 'mongoose';
export interface ITherapyPlan extends Document {
    user: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    workplace?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'completed' | 'discontinued';
    drugs: Array<{
        rxcui?: string;
        drugName: string;
        genericName?: string;
        strength?: string;
        dosageForm?: string;
        indication: string;
        dosing: {
            dose?: string;
            frequency?: string;
            duration?: string;
            instructions?: string;
        };
        monitoring?: {
            parameters?: string[];
            frequency?: string;
            notes?: string;
        };
        alternatives?: Array<{
            rxcui?: string;
            drugName: string;
            reason: string;
            therapeuticEquivalence?: boolean;
        }>;
        interactions?: Array<{
            interactingDrug: string;
            severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
            description: string;
            management?: string;
        }>;
        adverseEffects?: Array<{
            effect: string;
            frequency?: string;
            severity?: 'mild' | 'moderate' | 'severe';
            management?: string;
        }>;
        contraindications?: string[];
        precautions?: string[];
        patientCounseling?: string[];
        addedAt: Date;
        addedBy: mongoose.Types.ObjectId;
    }>;
    guidelines?: Array<{
        title: string;
        content: string;
        source: string;
        url?: string;
        dateAccessed?: Date;
    }>;
    clinicalNotes?: string;
    reviewDates?: Array<{
        date: Date;
        reviewedBy: mongoose.Types.ObjectId;
        notes?: string;
        changes?: string[];
    }>;
    isTemplate: boolean;
    sharedWith?: Array<{
        user: mongoose.Types.ObjectId;
        permission: 'view' | 'edit';
        sharedAt: Date;
    }>;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITherapyPlan, {}, {}, {}, mongoose.Document<unknown, {}, ITherapyPlan> & ITherapyPlan & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=TherapyPlan.d.ts.map