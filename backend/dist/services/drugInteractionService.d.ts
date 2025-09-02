export interface DrugInfo {
    drugName: string;
    genericName?: string;
    brandName?: string;
    activeIngredient: string;
    dosage?: string;
    route?: string;
    frequency?: string;
    therapeuticClass?: string;
    mechanism?: string;
}
export interface DrugInteraction {
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
export interface TherapeuticDuplication {
    drugs: string[];
    therapeuticClass: string;
    severity: 'major' | 'moderate' | 'minor';
    recommendation: string;
    clinicalRisk: string;
}
export interface ContraindicationCheck {
    drug: string;
    contraindication: string;
    condition?: string;
    severity: 'absolute' | 'relative';
    reason: string;
}
export declare class DrugInteractionService {
    private interactionDB;
    constructor();
    checkDrugInteractions(medications: DrugInfo[]): Promise<DrugInteraction[]>;
    checkTherapeuticDuplications(medications: DrugInfo[]): Promise<TherapeuticDuplication[]>;
    checkContraindications(medications: DrugInfo[], patientConditions: string[]): Promise<ContraindicationCheck[]>;
    getInteractionReport(medications: DrugInfo[], patientConditions?: string[]): Promise<{
        summary: {
            totalMedications: number;
            totalInteractions: number;
            criticalInteractions: number;
            majorInteractions: number;
            therapeuticDuplications: number;
            contraindications: number;
            overallRiskLevel: "low" | "high" | "critical" | "moderate";
        };
        interactions: DrugInteraction[];
        therapeuticDuplications: TherapeuticDuplication[];
        contraindications: ContraindicationCheck[];
        criticalIssues: (DrugInteraction | TherapeuticDuplication | ContraindicationCheck)[];
        recommendations: string[];
    }>;
    private checkPairwiseInteraction;
    private getTherapeuticClass;
    private evaluateTherapeuticDuplication;
    private checkDrugConditionContraindication;
    private calculateDuplicationSeverity;
    private getDuplicationRecommendation;
    private getDuplicationRisk;
    private calculateOverallRisk;
    private generateRecommendations;
}
export declare const drugInteractionService: DrugInteractionService;
//# sourceMappingURL=drugInteractionService.d.ts.map