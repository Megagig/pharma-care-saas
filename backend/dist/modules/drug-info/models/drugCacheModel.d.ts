import mongoose, { Document } from 'mongoose';
interface DrugSearchHistoryDocument extends Document {
    userId: mongoose.Types.ObjectId;
    searchTerm: string;
    searchResults: any;
    createdAt: Date;
}
interface DrugDocument {
    rxCui?: string;
    name: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    notes?: string;
    monograph?: any;
    interactions?: any;
    adverseEffects?: any;
    formularyInfo?: any;
}
interface TherapyPlanDocument extends Document {
    userId: mongoose.Types.ObjectId;
    planName: string;
    drugs: DrugDocument[];
    guidelines?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DrugSearchHistory: mongoose.Model<DrugSearchHistoryDocument, {}, {}, {}, mongoose.Document<unknown, {}, DrugSearchHistoryDocument> & DrugSearchHistoryDocument & {
    _id: mongoose.Types.ObjectId;
}, any>;
export declare const TherapyPlan: mongoose.Model<TherapyPlanDocument, {}, {}, {}, mongoose.Document<unknown, {}, TherapyPlanDocument> & TherapyPlanDocument & {
    _id: mongoose.Types.ObjectId;
}, any>;
export {};
//# sourceMappingURL=drugCacheModel.d.ts.map