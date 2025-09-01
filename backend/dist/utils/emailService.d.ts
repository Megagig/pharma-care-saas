import { IInvitation } from '../models/Invitation';
import { EmailDeliveryResult } from '../services/emailDeliveryService';
import mongoose from 'mongoose';
interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
declare class EmailService {
    private transporter;
    private resend;
    constructor();
    loadTemplate(templateName: string, variables: Record<string, any>): Promise<EmailTemplate>;
    private getDefaultTemplate;
    sendTrackedEmail(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
        templateName?: string;
        workspaceId?: mongoose.Types.ObjectId;
        userId?: mongoose.Types.ObjectId;
        relatedEntity?: {
            type: 'invitation' | 'subscription' | 'user' | 'workspace';
            id: mongoose.Types.ObjectId;
        };
        metadata?: Record<string, any>;
    }): Promise<EmailDeliveryResult>;
    sendEmail(toOrOptions: string | {
        to: string;
        subject: string;
        text: string;
        html: string;
    }, templateOrAttachments?: EmailTemplate | any[], attachments?: any[]): Promise<{
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
    sendSubscriptionUpgrade(email: string, data: {
        firstName: string;
        oldPlanName: string;
        newPlanName: string;
        upgradeAmount: number;
        effectiveDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionDowngrade(email: string, data: {
        firstName: string;
        currentPlanName: string;
        newPlanName: string;
        effectiveDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendInvitationAcceptedNotification(inviterEmail: string, data: {
        inviterName: string;
        acceptedUserName: string;
        acceptedUserEmail: string;
        workspaceName: string;
        role: string;
        acceptedDate?: Date;
    }): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendInvitationExpiredNotification(inviterEmail: string, data: {
        inviterName: string;
        invitedEmail: string;
        workspaceName: string;
        role: string;
        expiryDate?: Date;
    }): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendInvitationExpiredToInvitee(invitation: IInvitation): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendInvitationEmail(invitation: IInvitation): Promise<EmailDeliveryResult>;
    sendInvitationReminderEmail(invitation: IInvitation): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendTrialActivation(email: string, data: {
        firstName: string;
        workspaceName: string;
        trialEndDate: Date;
        trialDurationDays: number;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendWorkspaceSubscriptionConfirmation(email: string, data: {
        firstName: string;
        workspaceName: string;
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
    sendSubscriptionPastDue(email: string, data: {
        firstName: string;
        workspaceName: string;
        gracePeriodEnd: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionExpired(email: string, data: {
        firstName: string;
        workspaceName: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionCanceled(email: string, data: {
        firstName: string;
        workspaceName: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendTrialExpiryWarning(email: string, data: {
        firstName: string;
        workspaceName: string;
        trialStartDate: Date;
        trialEndDate: Date;
        daysLeft: number;
    }): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendUsageLimitWarning(email: string, data: {
        firstName: string;
        workspaceName: string;
        currentPlan: string;
        resourceType: string;
        currentUsage: number;
        limit: number;
        usagePercentage: number;
        recommendedPlan?: string;
        recommendedLimit?: number;
        currentPlanPrice?: number;
        recommendedPlanPrice?: number;
    }): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendSubscriptionStatusChange(email: string, data: {
        firstName: string;
        workspaceName: string;
        planName: string;
        oldStatus: string;
        newStatus: string;
        effectiveDate?: Date;
        nextBillingDate?: Date;
        gracePeriodEnd?: Date;
        actionRequired?: boolean;
        actionMessage?: string;
    }): Promise<{
        provider: string;
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        provider: string;
        success: boolean;
        error: string;
        messageId?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    sendSubscriptionSuspended(email: string, data: {
        firstName: string;
        workspaceName: string;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendTrialExtension(email: string, data: {
        firstName: string;
        workspaceName: string;
        extensionDays: number;
        newEndDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendTrialExpired(email: string, data: {
        firstName: string;
        workspaceName: string;
        trialEndDate: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    }>;
    sendSubscriptionExpiryWarning(email: string, data: {
        firstName: string;
        workspaceName: string;
        daysRemaining: number;
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
    sendSubscriptionDowngradeApplied(email: string, data: {
        firstName: string;
        workspaceName: string;
        newPlanName: string;
        effectiveDate: Date;
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
export default emailService;
//# sourceMappingURL=emailService.d.ts.map