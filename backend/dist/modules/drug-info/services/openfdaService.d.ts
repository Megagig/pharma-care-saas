interface OpenFDAEventResult {
    meta: {
        disclaimer: string;
        terms: string;
        license: string;
        last_updated: string;
        results: {
            skip: number;
            limit: number;
            total: number;
        };
    };
    results: Array<{
        safetyreportid: string;
        receivedate: string;
        receiptdate: string;
        seriousnessdeath: string;
        seriousnesslifethreatening: string;
        seriousnesshospitalization: string;
        patient: {
            drug: Array<{
                medicinalproduct: string;
                drugcharacterization: string;
                medicinalproductversion: string;
                drugdosagetext: string;
                drugadministrationroute: string;
                drugindication: string;
            }>;
            reaction: Array<{
                reactionmeddrapt: string;
                reactionoutcome: string;
            }>;
        };
    }>;
}
interface OpenFDALabelResult {
    meta: {
        disclaimer: string;
        terms: string;
        license: string;
        last_updated: string;
        results: {
            skip: number;
            limit: number;
            total: number;
        };
    };
    results: Array<{
        effective_time: string;
        version: string;
        openfda: {
            brand_name: string[];
            generic_name: string[];
            manufacturer_name: string[];
            product_type: string[];
        };
        indications_and_usage: string[];
        dosage_and_administration: string[];
    }>;
}
declare class OpenFdaService {
    getAdverseEffects(drugName: string, limit?: number): Promise<OpenFDAEventResult>;
    getDrugIndications(drugId: string): Promise<OpenFDALabelResult>;
    getDrugLabeling(brandName: string): Promise<OpenFDALabelResult>;
}
declare const _default: OpenFdaService;
export default _default;
//# sourceMappingURL=openfdaService.d.ts.map