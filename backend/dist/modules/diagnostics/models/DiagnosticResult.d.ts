import mongoose, { Document } from 'mongoose';
export interface IDiagnosis {
    condition: string;
    probability: number;
    reasoning: string;
    severity: 'low' | 'medium' | 'high';
    icdCode?: string;
    snomedCode?: string;
    confidence: 'low' | 'medium' | 'high';
    evidenceLevel: 'definite' | 'probable' | 'possible' | 'unlikely';
}
export interface ISuggestedTest {
    testName: string;
    priority: 'urgent' | 'routine' | 'optional';
    reasoning: string;
    loincCode?: string;
    expectedCost?: number;
    turnaroundTime?: string;
    clinicalSignificance: string;
}
export interface IMedicationSuggestion {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning: string;
    safetyNotes: string[];
    rxcui?: string;
    contraindications?: string[];
    monitoringParameters?: string[];
    alternativeOptions?: string[];
}
export interface IRedFlag {
    flag: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    timeframe?: string;
    clinicalRationale: string;
}
export interface IReferralRecommendation {
    recommended: boolean;
    urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine';
    specialty: string;
    reason: string;
    suggestedTests?: string[];
    clinicalNotes?: string;
    followUpInstructions?: string;
}
export interface IAIMetadata {
    modelId: string;
    modelVersion: string;
    confidenceScore: number;
    processingTime: number;
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    requestId: string;
    temperature?: number;
    maxTokens?: number;
    promptHash?: string;
}
export interface IPharmacistReview {
    status: 'approved' | 'modified' | 'rejected';
    modifications?: string;
    rejectionReason?: string;
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    reviewNotes?: string;
    clinicalJustification?: string;
}
export interface IDiagnosticResult extends Document {
    _id: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    diagnoses: IDiagnosis[];
    suggestedTests: ISuggestedTest[];
    medicationSuggestions: IMedicationSuggestion[];
    redFlags: IRedFlag[];
    referralRecommendation?: IReferralRecommendation;
    differentialDiagnosis: string[];
    clinicalImpression: string;
    riskAssessment: {
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        riskFactors: string[];
        mitigatingFactors?: string[];
    };
    aiMetadata: IAIMetadata;
    rawResponse: string;
    disclaimer: string;
    validationScore?: number;
    qualityFlags?: string[];
    pharmacistReview?: IPharmacistReview;
    followUpRequired: boolean;
    followUpDate?: Date;
    followUpInstructions?: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    needsReview: boolean;
    isApproved: boolean;
    primaryDiagnosis: IDiagnosis | null;
    approve(reviewedBy: mongoose.Types.ObjectId, modifications?: string): Promise<void>;
    reject(reviewedBy: mongoose.Types.ObjectId, reason: string): Promise<void>;
    modify(reviewedBy: mongoose.Types.ObjectId, modifications: string): Promise<void>;
    calculateOverallConfidence(): number;
    getHighestRiskFlag(): IRedFlag | null;
    requiresImmediateAttention(): boolean;
}
declare const _default: mongoose.Model<IDiagnosticResult, {}, {}, {}, mongoose.Document<unknown, {}, IDiagnosticResult> & IDiagnosticResult & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=DiagnosticResult.d.ts.map