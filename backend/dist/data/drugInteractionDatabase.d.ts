export interface InteractionRecord {
    drug1: string;
    drug2: string;
    severity: 'critical' | 'major' | 'moderate' | 'minor';
    mechanism: string;
    clinicalEffect: string;
    recommendation: string;
    monitoringParameters?: string[];
    alternativeTherapies?: string[];
    onsetTime?: 'immediate' | 'rapid' | 'delayed' | 'variable';
    documentation: 'established' | 'probable' | 'suspected' | 'possible' | 'unlikely';
    references?: string[];
}
export interface ContraindicationRecord {
    drug: string;
    condition: string;
    type: string;
    severity: 'absolute' | 'relative';
    reason: string;
}
export interface TherapeuticClassRecord {
    activeIngredient: string;
    therapeuticClass: string;
    mechanism: string;
    subclass?: string;
}
export declare class DrugInteractionDB {
    private interactions;
    private therapeuticClasses;
    private contraindications;
    constructor();
    private initializeDatabase;
    private loadTherapeuticClasses;
    private loadDrugInteractions;
    private loadContraindications;
    findInteraction(drug1: string, drug2: string): Promise<InteractionRecord | null>;
    getTherapeuticClass(activeIngredient: string): Promise<string>;
    findContraindication(drug: string, condition: string): Promise<ContraindicationRecord | null>;
    isValidCombination(therapeuticClass: string, activeIngredients: string[]): Promise<boolean>;
    addInteraction(interaction: InteractionRecord): Promise<void>;
    getAllInteractions(): Promise<InteractionRecord[]>;
    getInteractionsByDrug(drug: string): Promise<InteractionRecord[]>;
}
//# sourceMappingURL=drugInteractionDatabase.d.ts.map