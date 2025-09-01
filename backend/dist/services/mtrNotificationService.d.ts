import mongoose from 'mongoose';
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    followUpReminders: boolean;
    criticalAlerts: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
}
export interface ScheduledNotification {
    id?: string;
    type: 'follow_up_reminder' | 'critical_alert' | 'daily_digest' | 'weekly_report' | 'overdue_alert';
    recipientId: mongoose.Types.ObjectId;
    recipientType: 'pharmacist' | 'patient' | 'admin';
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
export interface CriticalAlert {
    type: 'drug_interaction' | 'contraindication' | 'high_severity_dtp' | 'overdue_follow_up';
    severity: 'critical' | 'major' | 'moderate';
    patientId: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
    problemId?: mongoose.Types.ObjectId;
    message: string;
    details: any;
    requiresImmediate: boolean;
}
declare class MTRNotificationService {
    private scheduledNotifications;
    scheduleFollowUpReminder(followUpId: mongoose.Types.ObjectId, reminderType?: 'email' | 'sms' | 'push', scheduledFor?: Date): Promise<void>;
    sendCriticalAlert(alert: CriticalAlert): Promise<void>;
    checkOverdueFollowUps(): Promise<void>;
    private scheduleNotification;
    private sendNotification;
    private sendEmailNotification;
    private sendSMSNotification;
    private generateFollowUpReminderEmail;
    private generateCriticalAlertEmail;
    private generateOverdueAlertEmail;
    updateNotificationPreferences(userId: mongoose.Types.ObjectId, preferences: Partial<NotificationPreferences>): Promise<void>;
    getNotificationStatistics(workplaceId?: mongoose.Types.ObjectId): Promise<any>;
    processPendingReminders(): Promise<void>;
}
export declare const mtrNotificationService: MTRNotificationService;
export default mtrNotificationService;
//# sourceMappingURL=mtrNotificationService.d.ts.map