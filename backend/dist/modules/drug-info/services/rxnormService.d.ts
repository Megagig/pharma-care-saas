interface RxNormDrugGroup {
    name: string;
    conceptGroup: Array<{
        tty: string;
        conceptProperties: Array<{
            rxcui: string;
            name: string;
            synonym: string;
            tty: string;
            language: string;
            suppress: string;
            umlscui: string;
        }>;
    }>;
}
interface RxNormSearchResult {
    drugGroup?: RxNormDrugGroup;
}
interface RxNormRxCuiResult {
    idGroup: {
        name: string;
        rxnormId: string[];
    };
}
interface RxNormRelatedGroup {
    rxCui: string;
    termType: string;
    conceptGroup: Array<{
        tty: string;
        conceptProperties: Array<{
            rxcui: string;
            name: string;
            synonym: string;
            tty: string;
            language: string;
            suppress: string;
            umlscui: string;
        }>;
    }>;
}
interface RxNormRelatedResult {
    relatedGroup?: RxNormRelatedGroup;
}
declare class RxNormService {
    searchDrugs(name: string): Promise<RxNormSearchResult>;
    getRxCuiByName(name: string): Promise<RxNormRxCuiResult>;
    getTherapeuticEquivalents(rxcui: string): Promise<RxNormRelatedResult>;
}
declare const _default: RxNormService;
export default _default;
//# sourceMappingURL=rxnormService.d.ts.map