export interface RxNormDrug {
    rxcui: string;
    name: string;
    synonym?: string;
    tty: string;
    language?: string;
    suppress?: string;
}
export interface RxNormSearchResult {
    drugGroup: {
        name?: string;
        conceptGroup?: Array<{
            tty: string;
            conceptProperties?: RxNormDrug[];
        }>;
    };
}
export interface RxNormRelatedResult {
    relatedGroup: {
        conceptGroup?: Array<{
            tty: string;
            conceptProperties?: RxNormDrug[];
        }>;
    };
}
export interface RxCuiResult {
    idGroup: {
        rxnormId: string[];
    };
}
export declare class RxNormService {
    private client;
    constructor();
    searchDrugs(drugName: string, maxEntries?: number): Promise<RxNormDrug[]>;
    getRxCui(drugName: string): Promise<string[]>;
    getTherapeuticEquivalents(rxcui: string): Promise<RxNormDrug[]>;
    getRelatedDrugs(rxcui: string): Promise<RxNormDrug[]>;
    getDrugDetails(rxcui: string): Promise<any>;
    getSpellingSuggestions(drugName: string): Promise<string[]>;
}
declare const _default: RxNormService;
export default _default;
//# sourceMappingURL=rxnormService.d.ts.map