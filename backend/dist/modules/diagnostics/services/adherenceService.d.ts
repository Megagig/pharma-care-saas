import mongoose from 'mongoose';
import { IAdherenceTracking, IMedicationAdherence, IAdherenceIntervention } from '../models/AdherenceTracking';
import { IDiagnosticResult } from '../models/DiagnosticResult';
export interface CreateAdherenceTrackingRequest {
    patientId: mongoose.Types.ObjectId;
    diagnosticRequestId?: mongoose.Types.ObjectId;
    diagnosticResultId?: mongoose.Types.ObjectId;
    medications: Array<Omit<IMedicationAdherence, 'adherenceScore' | 'adherenceStatus' | 'refillHistory'>>;
    monitoringFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    alertPreferences?: IAdherenceTracking['alertPreferences'];
}
export interface RefillData {
    medicationName: string;
    date: Date;
    daysSupply: number;
    source: 'pharmacy' | 'patient_report' | 'system_estimate';
    notes?: string;
}
export interface AdherenceAssessment {
    patientId: mongoose.Types.ObjectId;
    overallScore: number;
    category: 'excellent' | 'good' | 'fair' | 'poor';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    medicationsAtRisk: Array<{
        name: string;
        score: number;
        status: string;
        issues: string[];
    }>;
    recommendations: string[];
    nextAssessmentDate: Date;
}
export interface AdherenceReport {
    patientId: mongoose.Types.ObjectId;
    reportPeriod: {
        start: Date;
        end: Date;
    };
    overallAdherence: number;
    medicationDetails: Array<{
        name: string;
        adherenceScore: number;
        refillPattern: string;
        issues: string[];
        interventions: number;
    }>;
    alerts: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    interventions: {
        total: number;
        byType: Record<string, number>;
        effectiveness: Record<string, number>;
    };
    outcomes: {
        symptomsImproved: boolean;
        adherenceImproved: boolean;
        qualityOfLife?: number;
    };
}
declare class AdherenceService {
    createAdherenceTracking(workplaceId: mongoose.Types.ObjectId, trackingData: CreateAdherenceTrackingRequest, createdBy: mongoose.Types.ObjectId): Promise<IAdherenceTracking>;
    createFromDiagnosticResult(diagnosticResult: IDiagnosticResult, createdBy: mongoose.Types.ObjectId): Promise<IAdherenceTracking | null>;
    addRefill(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, refillData: RefillData): Promise<IAdherenceTracking>;
    updateMedicationAdherence(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, medicationName: string, adherenceData: Partial<IMedicationAdherence>): Promise<IAdherenceTracking>;
    assessPatientAdherence(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<AdherenceAssessment>;
    checkAdherenceAlerts(tracking: IAdherenceTracking): Promise<void>;
    addIntervention(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, intervention: Omit<IAdherenceIntervention, 'implementedAt'>, implementedBy: mongoose.Types.ObjectId): Promise<IAdherenceTracking>;
    generateAdherenceReport(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, reportPeriod: {
        start: Date;
        end: Date;
    }): Promise<AdherenceReport>;
    getPatientsWithPoorAdherence(workplaceId: mongoose.Types.ObjectId, threshold?: number): Promise<IAdherenceTracking[]>;
    processAdherenceAssessments(): Promise<void>;
    private determineMonitoringFrequency;
    private determineAlertPreferences;
    private generateAdherenceRecommendations;
    private identifyMedicationIssues;
    private analyzeRefillPattern;
    private calculateRefillGaps;
    private calculateAdherenceImprovement;
}
export declare const adherenceService: AdherenceService;
export default adherenceService;
//# sourceMappingURL=adherenceService.d.ts.map