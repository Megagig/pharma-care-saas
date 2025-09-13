import mongoose, { Document } from 'mongoose';
export interface IFollowUpReminder {
    type: 'email' | 'sms' | 'push' | 'system';
    scheduledFor: Date;
    sent: boolean;
    sentAt?: Date;
    recipientId?: mongoose.Types.ObjectId;
    message?: string;
    channel?: string;
}
export interface IFollowUpOutcome {
    status: 'successful' | 'partially_successful' | 'unsuccessful' | 'no_show';
    notes: string;
    nextActions: string[];
    nextFollowUpDate?: Date;
    adherenceImproved?: boolean;
    symptomsResolved?: string[];
    newSymptomsIdentified?: string[];
    medicationChanges?: Array<{
        action: 'started' | 'stopped' | 'modified' | 'continued';
        medication: string;
        reason: string;
    }>;
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        bloodGlucose?: number;
        weight?: number;
    };
    labResultsReviewed?: boolean;
    referralMade?: {
        specialty: string;
        urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine';
        reason: string;
    };
}
export interface IDiagnosticFollowUp extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    diagnosticRequestId: mongoose.Types.ObjectId;
    diagnosticResultId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    type: 'symptom_check' | 'medication_review' | 'lab_review' | 'adherence_check' | 'outcome_assessment' | 'referral_follow_up';
    priority: 'high' | 'medium' | 'low';
    description: string;
    objectives: string[];
    scheduledDate: Date;
    estimatedDuration: number;
    assignedTo: mongoose.Types.ObjectId;
    status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
    completedAt?: Date;
    rescheduledFrom?: Date;
    rescheduledReason?: string;
    reminders: IFollowUpReminder[];
    outcome?: IFollowUpOutcome;
    relatedDiagnoses?: string[];
    relatedMedications?: string[];
    triggerConditions?: Array<{
        condition: string;
        threshold: string;
        action: string;
    }>;
    autoScheduled: boolean;
    schedulingRule?: {
        basedOn: 'diagnosis_severity' | 'medication_type' | 'red_flags' | 'patient_risk' | 'manual';
        interval: number;
        maxFollowUps?: number;
        conditions?: string[];
    };
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    daysUntilFollowUp: number | null;
    daysSinceScheduled: number;
    isOverdue: boolean;
    reminderStatus: string;
    markCompleted(outcome: IFollowUpOutcome): Promise<void>;
    scheduleReminder(type: string, scheduledFor: Date): void;
    reschedule(newDate: Date, reason?: string): void;
    canReschedule(): boolean;
    scheduleDefaultReminders(): void;
    calculateNextFollowUp(): Date | null;
}
declare const _default: mongoose.Model<IDiagnosticFollowUp, {}, {}, {}, mongoose.Document<unknown, {}, IDiagnosticFollowUp> & IDiagnosticFollowUp & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=DiagnosticFollowUp.d.ts.map