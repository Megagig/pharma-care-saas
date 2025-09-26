interface RxNavInteractionConcept {
    minConceptItem: {
        rxcui: string;
        name: string;
        tty: string;
    };
    sourceConceptItem: {
        id: string;
        name: string;
        url: string;
    };
}
interface RxNavInteractionPair {
    interactionConcept: RxNavInteractionConcept[];
    severity: string;
    description: string;
}
interface RxNavInteractionType {
    minConceptItem: {
        rxcui: string;
        name: string;
        tty: string;
    };
    interactionPair: RxNavInteractionPair[];
}
interface RxNavInteractionGroup {
    interactionType: RxNavInteractionType[];
}
interface RxNavInteractionResult {
    interactionTypeGroup?: RxNavInteractionGroup[];
}
interface RxNavFullInteractionType {
    minConcept: {
        rxcui: string;
        name: string;
        tty: string;
    };
    fullInteractionType: Array<{
        interactionPair: RxNavInteractionPair[];
    }>;
}
interface RxNavFullInteractionResult {
    fullInteractionTypeGroup?: Array<{
        sourceDisclaimer: string;
        drugGroup: {
            name: string;
            rxnormId: string[];
        };
        fullInteractionType: RxNavFullInteractionType[];
    }>;
}
declare class InteractionService {
    getInteractionsForDrug(rxcui: string): Promise<RxNavInteractionResult>;
    getInteractionsForMultipleDrugs(rxcuis: string[]): Promise<RxNavFullInteractionResult>;
}
declare const _default: InteractionService;
export default _default;
//# sourceMappingURL=interactionService.d.ts.map