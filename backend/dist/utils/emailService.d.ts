interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
declare class EmailService {
    private transporter;
    constructor();
    private loadTemplate;
    private getDefaultTemplate;
    sendEmail(to: string, template: EmailTemplate, attachments?: any[]): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendLicenseApprovalNotification(email: string, data: {
        firstName: string;
        licenseNumber: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendLicenseRejectionNotification(email: string, data: {
        firstName: string;
        reason: string;
        supportEmail?: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendLicenseSubmissionNotification(data: {
        userEmail: string;
        userName: string;
        licenseNumber: string;
        submittedAt: Date;
    }): Promise<({
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    })[]>;
    sendRoleUpdateNotification(email: string, data: {
        firstName: string;
        newRole: string;
        updatedBy: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendAccountSuspensionNotification(email: string, data: {
        firstName: string;
        reason: string;
        supportEmail?: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendAccountReactivationNotification(email: string, data: {
        firstName: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionConfirmation(email: string, data: {
        firstName: string;
        planName: string;
        amount: number;
        billingInterval: string;
        startDate: Date;
        endDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionCancellation(email: string, data: {
        firstName: string;
        planName: string;
        gracePeriodEnd: Date;
        reason?: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendPaymentConfirmation(email: string, data: {
        firstName: string;
        amount: number;
        nextBillingDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendPaymentFailedNotification(email: string, data: {
        firstName: string;
        attemptNumber: number;
        nextAttempt: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map