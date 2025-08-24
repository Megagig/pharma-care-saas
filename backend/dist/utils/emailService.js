"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async loadTemplate(templateName, variables) {
        try {
            const templatePath = path_1.default.join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`);
            let html = fs_1.default.readFileSync(templatePath, 'utf-8');
            Object.keys(variables).forEach((key) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, variables[key]);
            });
            const text = html
                .replace(/<[^>]*>/g, '')
                .replace(/\\s+/g, ' ')
                .trim();
            const subjectMatch = html.match(/<!--\\s*SUBJECT:\\s*(.+?)\\s*-->/);
            const subject = subjectMatch?.[1] || 'PharmaCare Notification';
            return { subject, html, text };
        }
        catch (error) {
            console.error(`Error loading email template ${templateName}:`, error);
            return this.getDefaultTemplate(templateName, variables);
        }
    }
    getDefaultTemplate(templateName, variables) {
        const templates = {
            licenseApproval: {
                subject: 'License Approved - PharmaCare',
                html: `
          <h2>License Approved!</h2>
          <p>Dear ${variables.firstName},</p>
          <p>Your pharmacist license has been approved and verified.</p>
          <p>License Number: <strong>${variables.licenseNumber}</strong></p>
          <p>You now have full access to all features in your account.</p>
          <br>
          <p>Best regards,<br>PharmaCare Team</p>
        `,
                text: `License Approved! Dear ${variables.firstName}, Your pharmacist license has been approved and verified. License Number: ${variables.licenseNumber}. You now have full access to all features in your account.`,
            },
            licenseRejection: {
                subject: 'License Review Update - PharmaCare',
                html: `
          <h2>License Review Update</h2>
          <p>Dear ${variables.firstName},</p>
          <p>We've reviewed your license submission and need additional information.</p>
          <p><strong>Reason:</strong> ${variables.reason}</p>
          <p>Please log in to your account and resubmit your license documentation.</p>
          <p>If you have questions, contact us at ${variables.supportEmail}</p>
          <br>
          <p>Best regards,<br>PharmaCare Team</p>
        `,
                text: `License Review Update. Dear ${variables.firstName}, We've reviewed your license submission and need additional information. Reason: ${variables.reason}. Please log in to your account and resubmit your license documentation.`,
            },
            roleUpdate: {
                subject: 'Account Role Updated - PharmaCare',
                html: `
          <h2>Account Role Updated</h2>
          <p>Dear ${variables.firstName},</p>
          <p>Your account role has been updated to: <strong>${variables.newRole}</strong></p>
          <p>Updated by: ${variables.updatedBy}</p>
          <p>This change affects your access permissions and available features.</p>
          <br>
          <p>Best regards,<br>PharmaCare Team</p>
        `,
                text: `Account Role Updated. Dear ${variables.firstName}, Your account role has been updated to: ${variables.newRole}. Updated by: ${variables.updatedBy}.`,
            },
            subscriptionConfirmation: {
                subject: 'Subscription Confirmed - PharmaCare',
                html: `
          <h2>Subscription Confirmed!</h2>
          <p>Dear ${variables.firstName},</p>
          <p>Thank you for subscribing to PharmaCare <strong>${variables.planName}</strong> plan.</p>
          <p><strong>Amount:</strong> ₦${variables.amount}</p>
          <p><strong>Billing:</strong> ${variables.billingInterval}</p>
          <p><strong>Valid from:</strong> ${variables.startDate} to ${variables.endDate}</p>
          <p>You now have access to all premium features!</p>
          <br>
          <p>Best regards,<br>PharmaCare Team</p>
        `,
                text: `Subscription Confirmed! Dear ${variables.firstName}, Thank you for subscribing to PharmaCare ${variables.planName} plan. Amount: ₦${variables.amount}, Billing: ${variables.billingInterval}.`,
            },
        };
        return (templates[templateName] || {
            subject: 'PharmaCare Notification',
            html: '<p>This is a notification from PharmaCare.</p>',
            text: 'This is a notification from PharmaCare.',
        });
    }
    async sendEmail(to, template, attachments) {
        try {
            const mailOptions = {
                from: `\"PharmaCare\" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to,
                subject: template.subject,
                text: template.text,
                html: template.html,
                attachments,
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        }
        catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }
    async sendLicenseApprovalNotification(email, data) {
        const template = await this.loadTemplate('licenseApproval', data);
        return this.sendEmail(email, template);
    }
    async sendLicenseRejectionNotification(email, data) {
        const template = await this.loadTemplate('licenseRejection', {
            ...data,
            supportEmail: data.supportEmail ||
                process.env.SUPPORT_EMAIL ||
                'support@pharmacare.com',
        });
        return this.sendEmail(email, template);
    }
    async sendLicenseSubmissionNotification(data) {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
            'admin@pharmacare.com',
        ];
        const template = {
            subject: 'New License Submission - PharmaCare Admin',
            html: `
        <h2>New License Submission</h2>
        <p><strong>User:</strong> ${data.userName} (${data.userEmail})</p>
        <p><strong>License Number:</strong> ${data.licenseNumber}</p>
        <p><strong>Submitted:</strong> ${data.submittedAt.toLocaleString()}</p>
        <p>Please review and approve/reject in the admin panel.</p>
      `,
            text: `New License Submission from ${data.userName} (${data.userEmail}). License Number: ${data.licenseNumber}. Submitted: ${data.submittedAt.toLocaleString()}.`,
        };
        const results = [];
        for (const adminEmail of adminEmails) {
            results.push(await this.sendEmail(adminEmail.trim(), template));
        }
        return results;
    }
    async sendRoleUpdateNotification(email, data) {
        const template = await this.loadTemplate('roleUpdate', data);
        return this.sendEmail(email, template);
    }
    async sendAccountSuspensionNotification(email, data) {
        const template = {
            subject: 'Account Suspended - PharmaCare',
            html: `
        <h2>Account Suspended</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your PharmaCare account has been temporarily suspended.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>If you believe this is an error, please contact support at ${data.supportEmail || 'support@pharmacare.com'}</p>
        <br>
        <p>PharmaCare Team</p>
      `,
            text: `Account Suspended. Dear ${data.firstName}, Your PharmaCare account has been temporarily suspended. Reason: ${data.reason}.`,
        };
        return this.sendEmail(email, template);
    }
    async sendAccountReactivationNotification(email, data) {
        const template = {
            subject: 'Account Reactivated - PharmaCare',
            html: `
        <h2>Account Reactivated</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your PharmaCare account has been reactivated. You can now log in and access all your features.</p>
        <p>Welcome back!</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
            text: `Account Reactivated. Dear ${data.firstName}, Your PharmaCare account has been reactivated. You can now log in and access all your features.`,
        };
        return this.sendEmail(email, template);
    }
    async sendSubscriptionConfirmation(email, data) {
        const template = await this.loadTemplate('subscriptionConfirmation', {
            ...data,
            startDate: data.startDate.toLocaleDateString(),
            endDate: data.endDate.toLocaleDateString(),
        });
        return this.sendEmail(email, template);
    }
    async sendSubscriptionCancellation(email, data) {
        const template = {
            subject: 'Subscription Cancelled - PharmaCare',
            html: `
        <h2>Subscription Cancelled</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your ${data.planName} subscription has been cancelled as requested.</p>
        <p>You'll continue to have access until: <strong>${data.gracePeriodEnd.toLocaleDateString()}</strong></p>
        ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
        <p>You can reactivate your subscription anytime before the grace period ends.</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
            text: `Subscription Cancelled. Dear ${data.firstName}, Your ${data.planName} subscription has been cancelled. Access until: ${data.gracePeriodEnd.toLocaleDateString()}.`,
        };
        return this.sendEmail(email, template);
    }
    async sendPaymentConfirmation(email, data) {
        const template = {
            subject: 'Payment Confirmed - PharmaCare',
            html: `
        <h2>Payment Confirmed</h2>
        <p>Dear ${data.firstName},</p>
        <p>We've successfully processed your payment of <strong>₦${data.amount}</strong>.</p>
        <p>Your subscription is active until: <strong>${data.nextBillingDate.toLocaleDateString()}</strong></p>
        <p>Thank you for continuing with PharmaCare!</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
            text: `Payment Confirmed. Dear ${data.firstName}, We've successfully processed your payment of ₦${data.amount}. Your subscription is active until: ${data.nextBillingDate.toLocaleDateString()}.`,
        };
        return this.sendEmail(email, template);
    }
    async sendPaymentFailedNotification(email, data) {
        const template = {
            subject: 'Payment Failed - PharmaCare',
            html: `
        <h2>Payment Failed</h2>
        <p>Dear ${data.firstName},</p>
        <p>We couldn't process your subscription payment (Attempt ${data.attemptNumber}).</p>
        <p>We'll try again on: <strong>${data.nextAttempt.toLocaleDateString()}</strong></p>
        <p>Please ensure your payment method is valid and has sufficient funds.</p>
        <p>You can update your payment method in your account settings.</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
            text: `Payment Failed. Dear ${data.firstName}, We couldn't process your subscription payment (Attempt ${data.attemptNumber}). We'll try again on: ${data.nextAttempt.toLocaleDateString()}.`,
        };
        return this.sendEmail(email, template);
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map