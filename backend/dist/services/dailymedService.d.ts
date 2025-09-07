export interface DailyMedSPL {
    setid: string;
    title: string;
    effective_time?: string;
    version_number?: string;
    spl_product_data_elements?: string;
}
export interface DailyMedSearchResult {
    data: DailyMedSPL[];
    metadata: {
        total_elements: number;
        elements_per_page: number;
        current_page: number;
        total_pages: number;
    };
}
export interface DailyMedMonograph {
    setid: string;
    title: string;
    effective_time: string;
    version_number: string;
    spl_product_data_elements: any[];
    spl_unstructured_data_elements: any[];
    packaging?: any[];
    product_ndc?: string[];
    generic_medicine?: any[];
    brand_name?: string[];
    active_ingredient?: any[];
    inactive_ingredient?: any[];
    dosage_form?: string[];
    route?: string[];
    marketing_category?: string[];
    application_number?: string[];
    labeler?: any[];
    dea_schedule?: string;
    controlled_substance?: string;
    boxed_warning?: string[];
    recent_major_changes?: any[];
    indications_and_usage?: string[];
    dosage_and_administration?: string[];
    contraindications?: string[];
    warnings_and_precautions?: string[];
    adverse_reactions?: string[];
    drug_interactions?: string[];
    use_in_specific_populations?: string[];
    overdosage?: string[];
    description?: string[];
    clinical_pharmacology?: string[];
    nonclinical_toxicology?: string[];
    clinical_studies?: string[];
    how_supplied?: string[];
    storage_and_handling?: string[];
    patient_counseling_information?: string[];
}
export declare class DailyMedService {
    private client;
    constructor();
    searchDrugs(drugName: string, page?: number, pageSize?: number): Promise<DailyMedSearchResult>;
    getMonograph(setid: string): Promise<DailyMedMonograph>;
    searchByNDC(ndc: string): Promise<DailyMedSearchResult>;
}
//# sourceMappingURL=dailymedService.d.ts.map