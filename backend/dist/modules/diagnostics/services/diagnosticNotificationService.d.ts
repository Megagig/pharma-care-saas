import mongoose from 'mongoose';
import { IAdherenceAlert } from '../models/AdherenceTracking';
export interface NotificationSchedule {
    id: string;
    type: 'follow_up_reminder' | 'adherence_alert' | 'missed_refill' | 'overdue_follow_up' | 'critical_adherence';
    recipientId: mongoose.Types.ObjectId;
    scheduledFor: Date;
    priority: 'high' | 'medium' | 'low';
    channels: ('email' | 'sms' | 'push')[];
    data: any;
    sent: boolean;
    sentAt?: Date;
    attempts: number;
    maxAttempts: number;
    error?: string;
}
export interface DiagnosticAlert {
    type: 'follow_up_overdue' | 'adherence_critical' | 'medication_gap' | 'missed_appointment';
    severity: 'critical' | 'high' | 'medium' | 'low';
    patientId: mongoose.Types.ObjectId;
    followUpId?: mongoose.Types.ObjectId;
    adherenceTrackingId?: mongoose.Types.ObjectId;
    message: string;
    details: any;
    requiresImmediate: boolean;
}
declare class DiagnosticNotificationService {
    private scheduledNotifications;
    scheduleFollowUpReminder(followUpId: mongoose.Types.ObjectId, reminderType?: 'email' | 'sms' | 'push', scheduledFor?: Date): Promise<void>;
    scheduleAdherenceAlert(adherenceTrackingId: mongoose.Types.ObjectId, alert: IAdherenceAlert): Promise<void>;
    sendMissedRefillReminder(adherenceTrackingId: mongoose.Types.ObjectId, medicationName: string, daysOverdue: number): Promise<void>;
    checkOverdueFollowUps(): Promise<void>;
    checkAdherenceIssues(): Promise<void>;
    private scheduleNotification;
    private sendNotification;
    private sendEmailNotification;
    private sendSMSNotification;
    private generateFollowUpReminderEmail;
    private generateAdherenceAlertEmail;
    private generateMissedRefillEmail;
    private generateOverdueFollowUpEmail;
    private getRiskColor;
    private getSeverityColor;
    processPendingNotifications(): Promise<void>;
}
export declare const diagnosticNotificationService: DiagnosticNotificationService;
export default diagnosticNotificationService;
//# sourceMappingURL=diagnosticNotificationService.d.ts.map