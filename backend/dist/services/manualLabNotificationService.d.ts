import mongoose from 'mongoose';
export interface ManualLabNotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    criticalAlerts: boolean;
    resultNotifications: boolean;
    orderReminders: boolean;
}
export interface ManualLabNotification {
    id?: string;
    type: 'critical_alert' | 'result_ready' | 'order_reminder' | 'ai_interpretation_complete';
    recipientId: mongoose.Types.ObjectId;
    recipientType: 'pharmacist' | 'patient' | 'admin';
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    priority: 'high' | 'medium' | 'low';
    channels: ('email' | 'sms' | 'push')[];
    data: any;
    sent: boolean;
    sentAt?: Date;
    attempts: number;
    maxAttempts: number;
    error?: string;
    scheduledFor?: Date;
}
export interface CriticalLabAlert {
    type: 'critical_result' | 'red_flag_detected' | 'urgent_referral_needed' | 'drug_interaction';
    severity: 'critical' | 'major' | 'moderate';
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    message: string;
    details: any;
    requiresImmediate: boolean;
    aiInterpretation?: any;
}
declare class ManualLabNotificationService {
    private notifications;
    sendCriticalLabAlert(alert: CriticalLabAlert): Promise<void>;
    sendAIInterpretationComplete(orderId: string, patientId: mongoose.Types.ObjectId, pharmacistId: mongoose.Types.ObjectId, interpretation: any): Promise<void>;
    sendPatientResultNotification(orderId: string, patientId: mongoose.Types.ObjectId, includeInterpretation?: boolean): Promise<void>;
    sendOrderReminder(orderId: string, patientId: mongoose.Types.ObjectId, pharmacistId: mongoose.Types.ObjectId, daysOverdue: number): Promise<void>;
    private scheduleNotification;
    private sendNotification;
    private sendEmailNotification;
    private sendSMSNotification;
    private generateCriticalAlertEmail;
    private generateInterpretationCompleteEmail;
    private generateResultReadyEmail;
    private generateOrderReminderEmail;
    getNotificationStatistics(workplaceId?: mongoose.Types.ObjectId): Promise<any>;
    updateNotificationPreferences(userId: mongoose.Types.ObjectId, preferences: Partial<ManualLabNotificationPreferences>): Promise<void>;
}
export declare const manualLabNotificationService: ManualLabNotificationService;
export default manualLabNotificationService;
//# sourceMappingURL=manualLabNotificationService.d.ts.map