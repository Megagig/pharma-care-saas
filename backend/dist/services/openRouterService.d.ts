import { z } from 'zod';
import { symptomDataSchema, vitalSignsSchema, medicationEntrySchema } from '../modules/diagnostics/validators/diagnosticValidators';
export type ISymptomData = z.infer<typeof symptomDataSchema>;
export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type MedicationEntry = z.infer<typeof medicationEntrySchema>;
export interface LabResult {
    testName: string;
    value: string;
    referenceRange: string;
    abnormal?: boolean;
}
interface OpenRouterUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
export interface DiagnosticInput {
    symptoms: ISymptomData;
    labResults?: LabResult[];
    currentMedications?: MedicationEntry[];
    vitalSigns?: VitalSigns;
    patientAge?: number;
    patientGender?: string;
    allergies?: string[];
    medicalHistory?: string[];
    workplaceId?: string;
}
interface DiagnosticResponse {
    differentialDiagnoses: {
        condition: string;
        probability: number;
        reasoning: string;
        severity: 'low' | 'medium' | 'high';
    }[];
    recommendedTests: {
        testName: string;
        priority: 'urgent' | 'routine' | 'optional';
        reasoning: string;
    }[];
    therapeuticOptions: {
        medication: string;
        dosage: string;
        frequency: string;
        duration: string;
        reasoning: string;
        safetyNotes: string[];
    }[];
    redFlags: {
        flag: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        action: string;
    }[];
    referralRecommendation?: {
        recommended: boolean;
        urgency: 'immediate' | 'within_24h' | 'routine';
        specialty: string;
        reason: string;
    };
    disclaimer: string;
    confidenceScore: number;
}
declare class OpenRouterService {
    private baseURL;
    private apiKey;
    private defaultModel;
    private timeout;
    private retryConfig;
    constructor();
    generateDiagnosticAnalysis(input: DiagnosticInput): Promise<{
        analysis: DiagnosticResponse;
        usage: OpenRouterUsage;
        requestId: string;
        processingTime: number;
    }>;
    private executeWithRetry;
    private shouldRetryError;
    private calculateRetryDelay;
    private sleep;
    private enhanceError;
    private createSystemPrompt;
    private formatDiagnosticPrompt;
    private parseAndValidateAIResponse;
    private validateDiagnosticResponse;
    testConnection(): Promise<boolean>;
}
declare const _default: OpenRouterService;
export default _default;
export { DiagnosticResponse };
//# sourceMappingURL=openRouterService.d.ts.map