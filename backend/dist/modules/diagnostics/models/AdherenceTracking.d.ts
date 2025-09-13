import mongoose, { Document } from 'mongoose';
export interface IMedicationAdherence {
    medicationName: string;
    rxcui?: string;
    dosage: string;
    frequency: string;
    prescribedDate: Date;
    expectedRefillDate?: Date;
    lastRefillDate?: Date;
    daysSupply?: number;
    adherenceScore: number;
    adherenceStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    missedDoses?: number;
    totalDoses?: number;
    refillHistory: Array<{
        date: Date;
        daysSupply: number;
        source: 'pharmacy' | 'patient_report' | 'system_estimate';
        notes?: string;
    }>;
}
export interface IAdherenceAlert {
    type: 'missed_refill' | 'low_adherence' | 'medication_gap' | 'overdue_follow_up' | 'side_effects';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    triggeredAt: Date;
    acknowledged: boolean;
    acknowledgedBy?: mongoose.Types.ObjectId;
    acknowledgedAt?: Date;
    actionTaken?: string;
    resolved: boolean;
    resolvedAt?: Date;
}
export interface IAdherenceIntervention {
    type: 'counseling' | 'reminder_system' | 'dose_adjustment' | 'medication_change' | 'follow_up_scheduled';
    description: string;
    implementedBy: mongoose.Types.ObjectId;
    implementedAt: Date;
    expectedOutcome: string;
    actualOutcome?: string;
    effectiveness?: 'very_effective' | 'effective' | 'somewhat_effective' | 'not_effective';
    notes?: string;
}
export interface IAdherenceTracking extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    diagnosticRequestId?: mongoose.Types.ObjectId;
    diagnosticResultId?: mongoose.Types.ObjectId;
    medications: IMedicationAdherence[];
    overallAdherenceScore: number;
    adherenceCategory: 'excellent' | 'good' | 'fair' | 'poor';
    lastAssessmentDate: Date;
    nextAssessmentDate: Date;
    monitoringActive: boolean;
    monitoringStartDate: Date;
    monitoringEndDate?: Date;
    monitoringFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    alerts: IAdherenceAlert[];
    alertPreferences: {
        enableRefillReminders: boolean;
        enableAdherenceAlerts: boolean;
        reminderDaysBefore: number;
        escalationThreshold: number;
    };
    interventions: IAdherenceIntervention[];
    patientReportedAdherence?: {
        lastReportDate: Date;
        selfReportedScore: number;
        reportingMethod: 'phone' | 'app' | 'in_person' | 'survey';
        barriers?: string[];
        notes?: string;
    };
    clinicalOutcomes?: {
        symptomsImproved: boolean;
        vitalSignsImproved: boolean;
        labValuesImproved: boolean;
        qualityOfLifeScore?: number;
        sideEffectsReported?: string[];
        hospitalizations?: number;
        emergencyVisits?: number;
    };
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    activeAlerts: IAdherenceAlert[];
    criticalAlerts: IAdherenceAlert[];
    averageAdherence: number;
    medicationsAtRisk: IMedicationAdherence[];
    calculateOverallAdherence(): number;
    addMedication(medication: Omit<IMedicationAdherence, 'adherenceScore' | 'adherenceStatus' | 'refillHistory'>): void;
    updateMedicationAdherence(medicationName: string, adherenceData: Partial<IMedicationAdherence>): void;
    addRefill(medicationName: string, refillData: IMedicationAdherence['refillHistory'][0]): void;
    createAlert(alert: Omit<IAdherenceAlert, 'triggeredAt' | 'acknowledged' | 'resolved'>): void;
    acknowledgeAlert(alertIndex: number, acknowledgedBy: mongoose.Types.ObjectId, actionTaken?: string): void;
    resolveAlert(alertIndex: number): void;
    addIntervention(intervention: Omit<IAdherenceIntervention, 'implementedAt'>): void;
    assessAdherenceRisk(): 'low' | 'medium' | 'high' | 'critical';
    generateAdherenceReport(): any;
}
declare const _default: mongoose.Model<IAdherenceTracking, {}, {}, {}, mongoose.Document<unknown, {}, IAdherenceTracking> & IAdherenceTracking & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=AdherenceTracking.d.ts.map