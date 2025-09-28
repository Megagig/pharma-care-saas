interface AIResponseSchema {
    diagnoses: Array<{
        condition: string;
        probability: number;
        reasoning: string;
        severity: 'low' | 'medium' | 'high';
        icdCode?: string;
        snomedCode?: string;
    }>;
    suggestedTests?: Array<{
        testName: string;
        priority: 'urgent' | 'routine' | 'optional';
        reasoning: string;
        loincCode?: string;
    }>;
    medicationSuggestions?: Array<{
        drugName: string;
        dosage: string;
        frequency: string;
        duration: string;
        reasoning: string;
        safetyNotes: string[];
        rxcui?: string;
    }>;
    redFlags?: Array<{
        flag: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        action: string;
    }>;
    referralRecommendation?: {
        recommended: boolean;
        urgency?: 'immediate' | 'within_24h' | 'routine';
        specialty?: string;
        reason?: string;
    };
    confidenceScore: number;
    disclaimer?: string;
}
interface FHIRBundleSchema {
    resourceType: 'Bundle';
    type: string;
    entry?: Array<{
        resource: {
            resourceType: string;
            [key: string]: any;
        };
    }>;
}
interface DrugInteractionSchema {
    interactions: Array<{
        drug1: string;
        drug2: string;
        severity: 'minor' | 'moderate' | 'major';
        description: string;
        clinicalEffect: string;
        mechanism?: string;
        management?: string;
    }>;
    allergicReactions?: Array<{
        drug: string;
        allergy: string;
        severity: 'mild' | 'moderate' | 'severe';
        reaction: string;
    }>;
    contraindications?: Array<{
        drug: string;
        condition: string;
        reason: string;
        severity: 'warning' | 'contraindicated';
    }>;
}
export declare const validateAIResponse: import("ajv").ValidateFunction<unknown>;
export declare const validateFHIRBundle: import("ajv").ValidateFunction<unknown>;
export declare const validateDrugInteraction: import("ajv").ValidateFunction<unknown>;
export declare const isValidAIResponse: (data: unknown) => data is AIResponseSchema;
export declare const isValidFHIRBundle: (data: unknown) => data is FHIRBundleSchema;
export declare const isValidDrugInteraction: (data: unknown) => data is DrugInteractionSchema;
export declare const formatSchemaErrors: (validator: any) => any;
export declare const sanitizeAIResponse: (data: any) => Partial<AIResponseSchema>;
export { AIResponseSchema, FHIRBundleSchema, DrugInteractionSchema };
//# sourceMappingURL=jsonSchemaValidator.d.ts.map