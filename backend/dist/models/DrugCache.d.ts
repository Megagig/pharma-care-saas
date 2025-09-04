import mongoose, { Document } from 'mongoose';
export interface IDrugCache extends Document {
    rxcui?: string;
    drugName: string;
    genericName?: string;
    brandNames?: string[];
    strength?: string;
    dosageForm?: string;
    manufacturer?: string;
    apiSource: 'rxnorm' | 'dailymed' | 'openfda' | 'rxnav';
    apiResponseData: any;
    searchTerms: string[];
    lastUpdated: Date;
    expiresAt: Date;
    isActive: boolean;
    therapeuticClass?: string;
    dea?: string;
    ndc?: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDrugCache, {}, {}, {}, mongoose.Document<unknown, {}, IDrugCache> & IDrugCache & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=DrugCache.d.ts.map