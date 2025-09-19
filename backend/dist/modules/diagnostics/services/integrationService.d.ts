import mongoose from 'mongoose';
import { IClinicalNote } from '../../../models/ClinicalNote';
import { IMedicationTherapyReview } from '../../../models/MedicationTherapyReview';
export interface DiagnosticIntegrationData {
    diagnosticRequestId: mongoose.Types.ObjectId;
    diagnosticResultId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    pharmacistId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
}
export interface ClinicalNoteFromDiagnostic {
    title: string;
    content: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    };
    type: 'consultation' | 'medication_review' | 'follow_up' | 'adverse_event' | 'other';
    priority: 'low' | 'medium' | 'high';
    followUpRequired: boolean;
    followUpDate?: Date;
    tags: string[];
    recommendations: string[];
}
export interface MTRIntegrationData {
    diagnosticData: {
        symptoms: string[];
        diagnoses: Array<{
            condition: string;
            probability: number;
            reasoning: string;
        }>;
        medicationSuggestions: Array<{
            drugName: string;
            dosage: string;
            frequency: string;
            reasoning: string;
        }>;
        redFlags: Array<{
            flag: string;
            severity: string;
            action: string;
        }>;
    };
    reviewReason: string;
    priority: 'routine' | 'urgent' | 'high_risk';
}
export declare class DiagnosticIntegrationService {
    createClinicalNoteFromDiagnostic(integrationData: DiagnosticIntegrationData, noteData?: Partial<ClinicalNoteFromDiagnostic>): Promise<IClinicalNote>;
    addDiagnosticDataToMTR(mtrId: mongoose.Types.ObjectId, integrationData: DiagnosticIntegrationData): Promise<IMedicationTherapyReview>;
    createMTRFromDiagnostic(integrationData: DiagnosticIntegrationData, mtrData?: Partial<MTRIntegrationData>): Promise<IMedicationTherapyReview>;
    getUnifiedPatientTimeline(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, options?: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<Array<{
        type: 'diagnostic' | 'clinical_note' | 'mtr';
        id: mongoose.Types.ObjectId;
        date: Date;
        title: string;
        summary: string;
        priority?: string;
        status?: string;
        data: any;
    }>>;
    crossReferenceWithExistingRecords(diagnosticRequestId: mongoose.Types.ObjectId): Promise<{
        relatedClinicalNotes: IClinicalNote[];
        relatedMTRs: IMedicationTherapyReview[];
        correlations: Array<{
            type: 'medication_match' | 'symptom_match' | 'diagnosis_match';
            recordType: 'clinical_note' | 'mtr';
            recordId: mongoose.Types.ObjectId;
            correlation: string;
            confidence: number;
        }>;
    }>;
    private buildClinicalNoteFromDiagnostic;
    private buildMTRFromDiagnostic;
    private enrichMTRWithDiagnosticData;
    private formatVitals;
    private summarizeDiagnosticRequest;
    private summarizeClinicalNote;
    private summarizeMTR;
    private findCorrelations;
}
declare const _default: DiagnosticIntegrationService;
export default _default;
//# sourceMappingURL=integrationService.d.ts.map