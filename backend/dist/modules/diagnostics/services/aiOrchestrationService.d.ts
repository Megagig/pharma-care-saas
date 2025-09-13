import { DiagnosticInput, DiagnosticResponse } from '../../../services/openRouterService';
export interface AIProcessingOptions {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    retryAttempts?: number;
    promptVersion?: string;
}
export interface AIAnalysisMetadata {
    modelId: string;
    modelVersion: string;
    promptVersion: string;
    processingTime: number;
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    requestId: string;
    temperature?: number;
    maxTokens?: number;
    confidenceScore: number;
    promptHash?: string;
}
export interface EnhancedDiagnosticResponse extends DiagnosticResponse {
    metadata: AIAnalysisMetadata;
    qualityScore: number;
    validationFlags: string[];
    processingNotes: string[];
}
export interface ConsentValidation {
    isValid: boolean;
    consentTimestamp: Date;
    consentMethod: 'verbal' | 'written' | 'electronic';
    patientId: string;
    pharmacistId: string;
    errors?: string[];
}
export declare class AIOrchestrationService {
    private readonly defaultOptions;
    processPatientCase(input: DiagnosticInput, consent: ConsentValidation, options?: AIProcessingOptions): Promise<EnhancedDiagnosticResponse>;
    private validateConsent;
    private validateInputData;
    private validateVitalSigns;
    private validateLabResults;
    private validateMedications;
    private buildStructuredPrompt;
    private generatePromptHash;
    private callOpenRouterWithRetry;
    private isNonRetryableError;
    private validateAndEnhanceResponse;
    private validateAIResponseStructure;
    private calculateQualityScore;
    private generateValidationFlags;
    private generateProcessingNotes;
    private logAIRequest;
    private logAIResponse;
    private logAIError;
    testAIService(): Promise<{
        isConnected: boolean;
        responseTime: number;
        error?: string;
    }>;
    getAIServiceStats(): {
        defaultOptions: Required<AIProcessingOptions>;
        supportedModels: string[];
        maxTokenLimit: number;
    };
}
declare const _default: AIOrchestrationService;
export default _default;
//# sourceMappingURL=aiOrchestrationService.d.ts.map