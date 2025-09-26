import mongoose, { Document } from 'mongoose';
export interface IDrugSearchHistory extends Document {
    user: mongoose.Types.ObjectId;
    workplace?: mongoose.Types.ObjectId;
    searchTerm: string;
    searchType: 'drug_search' | 'interaction_check' | 'monograph_view' | 'adverse_effects' | 'formulary_search';
    resultsFound: number;
    selectedResult?: {
        rxcui?: string;
        drugName: string;
        source: string;
    };
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    searchMetadata?: {
        filters?: any;
        sortBy?: string;
        page?: number;
        limit?: number;
    };
    responseTime?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDrugSearchHistory, {}, {}, {}, mongoose.Document<unknown, {}, IDrugSearchHistory> & IDrugSearchHistory & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=DrugSearchHistory.d.ts.map