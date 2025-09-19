export interface OpenFDAAdverseEvent {
    receiptdate?: string;
    receiptdateformat?: string;
    patient?: {
        patientonsetage?: string;
        patientonsetageunit?: string;
        patientsex?: string;
        patientweight?: string;
        drug?: Array<{
            medicinalproduct?: string;
            drugindication?: string;
            drugstartdate?: string;
            drugenddate?: string;
            drugdosagetext?: string;
            actiondrug?: string;
            drugrecurrence?: string;
        }>;
        reaction?: Array<{
            reactionmeddrapt?: string;
            reactionoutcome?: string;
        }>;
    };
    sender?: {
        sendertype?: string;
        senderorganization?: string;
    };
    serious?: string;
    seriousnesscongenitalanomali?: string;
    seriousnessdeath?: string;
    seriousnessdisabling?: string;
    seriousnesshospitalization?: string;
    seriousnesslifethreatening?: string;
    seriousnessother?: string;
}
export interface OpenFDAAdverseEventResult {
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
    results: OpenFDAAdverseEvent[];
}
export interface OpenFDADrugLabel {
    id: string;
    set_id: string;
    version?: string;
    effective_time?: string;
    openfda?: {
        application_number?: string[];
        brand_name?: string[];
        generic_name?: string[];
        manufacturer_name?: string[];
        product_ndc?: string[];
        product_type?: string[];
        route?: string[];
        substance_name?: string[];
        rxcui?: string[];
        spl_id?: string[];
        spl_set_id?: string[];
        package_ndc?: string[];
        nui?: string[];
        pharm_class_moa?: string[];
        pharm_class_cs?: string[];
        pharm_class_pe?: string[];
        pharm_class_epc?: string[];
    };
    purpose?: string[];
    indications_and_usage?: string[];
    contraindications?: string[];
    dosage_and_administration?: string[];
    warnings?: string[];
    adverse_reactions?: string[];
    drug_interactions?: string[];
    boxed_warning?: string[];
    warnings_and_cautions?: string[];
    pregnancy?: string[];
    pediatric_use?: string[];
    geriatric_use?: string[];
    overdosage?: string[];
    clinical_pharmacology?: string[];
    mechanism_of_action?: string[];
    pharmacodynamics?: string[];
    pharmacokinetics?: string[];
}
export interface OpenFDADrugLabelResult {
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
    results: OpenFDADrugLabel[];
}
export declare class OpenFDAService {
    private client;
    constructor();
    getAdverseEvents(drugName: string, limit?: number, skip?: number): Promise<OpenFDAAdverseEventResult>;
    getDrugLabeling(drugName: string, limit?: number, skip?: number): Promise<OpenFDADrugLabelResult>;
    getAdverseEventsBySeverity(drugName: string, serious?: boolean): Promise<OpenFDAAdverseEventResult>;
    analyzeAdverseEventPatterns(events: OpenFDAAdverseEvent[]): any;
    extractSafetyInformation(labeling: OpenFDADrugLabel): any;
    private categorizeAge;
}
declare const _default: OpenFDAService;
export default _default;
//# sourceMappingURL=openfdaService.d.ts.map