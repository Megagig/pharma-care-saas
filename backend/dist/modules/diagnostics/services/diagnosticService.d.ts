import { IDiagnosticRequest, IInputSnapshot } from '../models/DiagnosticRequest';
import { IDiagnosticResult } from '../models/DiagnosticResult';
export interface CreateDiagnosticRequestData {
    patientId: string;
    pharmacistId: string;
    workplaceId: string;
    locationId?: string;
    inputSnapshot: IInputSnapshot;
    priority?: 'routine' | 'urgent' | 'stat';
    consentObtained: boolean;
}
export interface DiagnosticProcessingOptions {
    skipInteractionCheck?: boolean;
    skipLabValidation?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
}
export interface DiagnosticAnalysisResult {
    request: IDiagnosticRequest;
    result: IDiagnosticResult;
    processingTime: number;
    interactionResults?: any[];
    labValidation?: any[];
}
export interface PatientDataAggregation {
    demographics: {
        age: number;
        gender: string;
        weight?: number;
        height?: number;
    };
    symptoms: IInputSnapshot['symptoms'];
    vitals?: IInputSnapshot['vitals'];
    medications: IInputSnapshot['currentMedications'];
    allergies: string[];
    medicalHistory: string[];
    labResults: any[];
    socialHistory?: IInputSnapshot['socialHistory'];
    familyHistory?: string[];
}
export declare class DiagnosticService {
    private readonly maxRetries;
    private readonly processingTimeout;
    createDiagnosticRequest(data: CreateDiagnosticRequestData): Promise<IDiagnosticRequest>;
    processDiagnosticRequest(requestId: string, options?: DiagnosticProcessingOptions): Promise<DiagnosticAnalysisResult>;
    private aggregatePatientData;
    private prepareAIInput;
    private createDiagnosticResult;
    private mapConfidenceLevel;
    private mapEvidenceLevel;
    private calculateOverallRisk;
    private extractRiskFactors;
    private extractMitigatingFactors;
    private generateClinicalImpression;
    private determineFollowUpRequired;
    getDiagnosticRequest(requestId: string, workplaceId: string): Promise<IDiagnosticRequest | null>;
    getDiagnosticResult(requestId: string, workplaceId: string): Promise<IDiagnosticResult | null>;
    getPatientDiagnosticHistory(patientId: string, workplaceId: string, page?: number, limit?: number): Promise<{
        requests: IDiagnosticRequest[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    retryDiagnosticRequest(requestId: string, options?: DiagnosticProcessingOptions): Promise<DiagnosticAnalysisResult>;
    cancelDiagnosticRequest(requestId: string, workplaceId: string, cancelledBy: string, reason?: string): Promise<void>;
}
declare const _default: DiagnosticService;
export default _default;
//# sourceMappingURL=diagnosticService.d.ts.map