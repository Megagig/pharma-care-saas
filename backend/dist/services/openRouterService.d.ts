interface OpenRouterUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
interface DiagnosticInput {
    symptoms: {
        subjective: string[];
        objective: string[];
        duration: string;
        severity: 'mild' | 'moderate' | 'severe';
        onset: 'acute' | 'chronic' | 'subacute';
    };
    labResults?: {
        testName: string;
        value: string;
        referenceRange: string;
        abnormal: boolean;
    }[];
    currentMedications?: {
        name: string;
        dosage: string;
        frequency: string;
    }[];
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
    };
    patientAge?: number;
    patientGender?: string;
    allergies?: string[];
    medicalHistory?: string[];
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
export { DiagnosticInput, DiagnosticResponse };
//# sourceMappingURL=openRouterService.d.ts.map