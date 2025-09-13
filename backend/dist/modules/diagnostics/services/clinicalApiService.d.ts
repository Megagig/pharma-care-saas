export interface DrugInfo {
    rxcui: string;
    name: string;
    brandNames: string[];
    genericNames: string[];
    strength?: string;
    dosageForm?: string;
    route?: string;
    manufacturer?: string;
    ndcs: string[];
    therapeuticClass?: string;
    pharmacologicalClass?: string;
    indication?: string;
    contraindications: string[];
    warnings: string[];
    adverseEffects: string[];
    dosing?: {
        adult?: string;
        pediatric?: string;
        renal?: string;
        hepatic?: string;
    };
}
export interface InteractionResult {
    drugPair: {
        drug1: string;
        drug2: string;
        rxcui1?: string;
        rxcui2?: string;
    };
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    mechanism?: string;
    clinicalEffects: string[];
    management: string;
    source: string;
    references?: string[];
}
export interface AllergyAlert {
    allergen: string;
    medication: string;
    rxcui?: string;
    alertType: 'allergy' | 'cross_sensitivity' | 'intolerance';
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    description: string;
    recommendations: string[];
}
export interface ContraindicationAlert {
    medication: string;
    rxcui?: string;
    condition: string;
    severity: 'relative' | 'absolute';
    description: string;
    alternatives?: string[];
}
export interface ClinicalApiResponse<T> {
    data: T;
    cached: boolean;
    timestamp: Date;
    source: string;
}
export declare class ClinicalApiService {
    private rxnormClient;
    private openfdaClient;
    private cache;
    private readonly cacheTimeout;
    private readonly maxCacheSize;
    constructor();
    getDrugInfo(drugName: string): Promise<ClinicalApiResponse<DrugInfo>>;
    checkDrugInteractions(medications: string[]): Promise<ClinicalApiResponse<InteractionResult[]>>;
    checkDrugAllergies(medications: string[], knownAllergies: string[]): Promise<ClinicalApiResponse<AllergyAlert[]>>;
    checkContraindications(medications: string[], conditions: string[]): Promise<ClinicalApiResponse<ContraindicationAlert[]>>;
    private getFDADrugInfo;
    private extractBrandNames;
    private extractGenericNames;
    private getInteractionMechanism;
    private extractClinicalEffects;
    private checkSingleDrugAllergy;
    private checkSingleContraindication;
    private countBySeverity;
    private getFromCache;
    private setCache;
    private cleanExpiredCache;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
    };
}
declare const _default: ClinicalApiService;
export default _default;
//# sourceMappingURL=clinicalApiService.d.ts.map