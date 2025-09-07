export interface DrugInteraction {
    interactionPairs: Array<{
        interactionConcept: Array<{
            minConceptItem: {
                rxcui: string;
                name: string;
                tty: string;
            };
            sourceConceptItem: {
                id: string;
                name: string;
                url?: string;
            };
        }>;
        severity?: string;
        description?: string;
    }>;
}
export interface InteractionResult {
    nlmDisclaimer?: string;
    interactions: DrugInteraction[];
}
export interface SingleDrugInteraction {
    nlmDisclaimer?: string;
    interactionTypeGroup?: Array<{
        sourceDisclaimer: string;
        sourceName: string;
        interactionType: Array<{
            comment?: string;
            minConcept: Array<{
                rxcui: string;
                name: string;
                tty: string;
            }>;
        }>;
    }>;
}
export interface DrugInteractionCheck {
    drugName: string;
    rxcui?: string;
    interactions: Array<{
        interactingDrug: string;
        interactingRxcui?: string;
        severity?: 'minor' | 'moderate' | 'major' | 'contraindicated';
        description: string;
        source: string;
        management?: string;
    }>;
}
export declare class DrugInteractionService {
    private client;
    constructor();
    checkSingleDrugInteractions(rxcui: string): Promise<SingleDrugInteraction>;
    checkMultiDrugInteractions(rxcuis: string[]): Promise<InteractionResult>;
    formatInteractionResults(interactionData: SingleDrugInteraction | InteractionResult, primaryRxcui?: string): DrugInteractionCheck[];
    private determineSeverity;
    getManagementRecommendations(severity: string, description: string): string;
    quickInteractionCheck(drugName: string): Promise<{
        hasInteractions: boolean;
        count: number;
    }>;
}
declare const _default: DrugInteractionService;
export default _default;
//# sourceMappingURL=drugInteractionService.d.ts.map