import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async loadTemplate(
    templateName: string,
    variables: Record<string, any>
  ): Promise<EmailTemplate> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        'email',
        `${templateName}.html`
      );
      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace variables in template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, variables[key]);
      });

      // Extract text content (basic implementation)
      const text = html
        .replace(/<[^>]*>/g, '')
        .replace(/\\s+/g, ' ')
        .trim();

      // Extract subject from template (assuming it's in a comment at the top)
      const subjectMatch = html.match(/<!--\\s*SUBJECT:\\s*(.+?)\\s*-->/);
      const subject: string = subjectMatch?.[1] || 'PharmaCare Notification';

      return { subject, html, text };
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName, variables);
    }
  }

  private getDefaultTemplate(
    templateName: string,
    variables: Record<string, any>
  ): EmailTemplate {
    // Fallback templates
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

    return (
      templates[templateName as keyof typeof templates] || {
        subject: 'PharmaCare Notification',
        html: '<p>This is a notification from PharmaCare.</p>',
        text: 'This is a notification from PharmaCare.',
      }
    );
  }

  async sendEmail(
    toOrOptions:
      | string
      | { to: string; subject: string; text: string; html: string },
    templateOrAttachments?: EmailTemplate | any[],
    attachments?: any[]
  ) {
    try {
      let mailOptions: any;

      // Handle object format
      if (typeof toOrOptions === 'object') {
        mailOptions = {
          from: `\"PharmaCare\" <${
            process.env.SMTP_FROM || process.env.SMTP_USER
          }>`,
          ...toOrOptions,
          attachments: templateOrAttachments as any[],
        };
      }
      // Handle original parameter format
      else {
        mailOptions = {
          from: `\"PharmaCare\" <${
            process.env.SMTP_FROM || process.env.SMTP_USER
          }>`,
          to: toOrOptions,
          subject: (templateOrAttachments as EmailTemplate).subject,
          text: (templateOrAttachments as EmailTemplate).text,
          html: (templateOrAttachments as EmailTemplate).html,
          attachments,
        };
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // License-related emails
  async sendLicenseApprovalNotification(
    email: string,
    data: { firstName: string; licenseNumber: string; notes?: string }
  ) {
    const template = await this.loadTemplate('licenseApproval', data);
    return this.sendEmail(email, template);
  }

  async sendLicenseRejectionNotification(
    email: string,
    data: { firstName: string; reason: string; supportEmail?: string }
  ) {
    const template = await this.loadTemplate('licenseRejection', {
      ...data,
      supportEmail:
        data.supportEmail ||
        process.env.SUPPORT_EMAIL ||
        'support@pharmacare.com',
    });
    return this.sendEmail(email, template);
  }

  async sendLicenseSubmissionNotification(data: {
    userEmail: string;
    userName: string;
    licenseNumber: string;
    submittedAt: Date;
  }) {
    // Send to admin
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
      text: `New License Submission from ${data.userName} (${
        data.userEmail
      }). License Number: ${
        data.licenseNumber
      }. Submitted: ${data.submittedAt.toLocaleString()}.`,
    };

    const results = [];
    for (const adminEmail of adminEmails) {
      results.push(await this.sendEmail(adminEmail.trim(), template));
    }
    return results;
  }

  // Role and permission emails
  async sendRoleUpdateNotification(
    email: string,
    data: { firstName: string; newRole: string; updatedBy: string }
  ) {
    const template = await this.loadTemplate('roleUpdate', data);
    return this.sendEmail(email, template);
  }

  async sendAccountSuspensionNotification(
    email: string,
    data: { firstName: string; reason: string; supportEmail?: string }
  ) {
    const template = {
      subject: 'Account Suspended - PharmaCare',
      html: `
        <h2>Account Suspended</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your PharmaCare account has been temporarily suspended.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>If you believe this is an error, please contact support at ${
          data.supportEmail || 'support@pharmacare.com'
        }</p>
        <br>
        <p>PharmaCare Team</p>
      `,
      text: `Account Suspended. Dear ${data.firstName}, Your PharmaCare account has been temporarily suspended. Reason: ${data.reason}.`,
    };
    return this.sendEmail(email, template);
  }

  async sendAccountReactivationNotification(
    email: string,
    data: { firstName: string }
  ) {
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

  // Subscription-related emails
  async sendSubscriptionConfirmation(
    email: string,
    data: {
      firstName: string;
      planName: string;
      amount: number;
      billingInterval: string;
      startDate: Date;
      endDate: Date;
    }
  ) {
    const template = await this.loadTemplate('subscriptionConfirmation', {
      ...data,
      startDate: data.startDate.toLocaleDateString(),
      endDate: data.endDate.toLocaleDateString(),
    });
    return this.sendEmail(email, template);
  }

  async sendSubscriptionCancellation(
    email: string,
    data: {
      firstName: string;
      planName: string;
      gracePeriodEnd: Date;
      reason?: string;
    }
  ) {
    const template = {
      subject: 'Subscription Cancelled - PharmaCare',
      html: `
        <h2>Subscription Cancelled</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your ${
          data.planName
        } subscription has been cancelled as requested.</p>
        <p>You'll continue to have access until: <strong>${data.gracePeriodEnd.toLocaleDateString()}</strong></p>
        ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
        <p>You can reactivate your subscription anytime before the grace period ends.</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
      text: `Subscription Cancelled. Dear ${data.firstName}, Your ${
        data.planName
      } subscription has been cancelled. Access until: ${data.gracePeriodEnd.toLocaleDateString()}.`,
    };
    return this.sendEmail(email, template);
  }

  async sendPaymentConfirmation(
    email: string,
    data: { firstName: string; amount: number; nextBillingDate: Date }
  ) {
    const template = {
      subject: 'Payment Confirmed - PharmaCare',
      html: `
        <h2>Payment Confirmed</h2>
        <p>Dear ${data.firstName},</p>
        <p>We've successfully processed your payment of <strong>₦${
          data.amount
        }</strong>.</p>
        <p>Your subscription is active until: <strong>${data.nextBillingDate.toLocaleDateString()}</strong></p>
        <p>Thank you for continuing with PharmaCare!</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
      text: `Payment Confirmed. Dear ${
        data.firstName
      }, We've successfully processed your payment of ₦${
        data.amount
      }. Your subscription is active until: ${data.nextBillingDate.toLocaleDateString()}.`,
    };
    return this.sendEmail(email, template);
  }

  async sendPaymentFailedNotification(
    email: string,
    data: { firstName: string; attemptNumber: number; nextAttempt: Date }
  ) {
    const template = {
      subject: 'Payment Failed - PharmaCare',
      html: `
        <h2>Payment Failed</h2>
        <p>Dear ${data.firstName},</p>
        <p>We couldn't process your subscription payment (Attempt ${
          data.attemptNumber
        }).</p>
        <p>We'll try again on: <strong>${data.nextAttempt.toLocaleDateString()}</strong></p>
        <p>Please ensure your payment method is valid and has sufficient funds.</p>
        <p>You can update your payment method in your account settings.</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
      text: `Payment Failed. Dear ${
        data.firstName
      }, We couldn't process your subscription payment (Attempt ${
        data.attemptNumber
      }). We'll try again on: ${data.nextAttempt.toLocaleDateString()}.`,
    };
    return this.sendEmail(email, template);
  }

  async sendSubscriptionUpgrade(
    email: string,
    data: {
      firstName: string;
      oldPlanName: string;
      newPlanName: string;
      upgradeAmount: number;
      effectiveDate: Date;
    }
  ) {
    const template = {
      subject: 'Subscription Upgraded - PharmaCare',
      html: `
        <h2>Subscription Upgraded!</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your subscription has been successfully upgraded from <strong>${
          data.oldPlanName
        }</strong> to <strong>${data.newPlanName}</strong>.</p>
        <p><strong>Upgrade Amount:</strong> ₦${data.upgradeAmount.toLocaleString()}</p>
        <p><strong>Effective Date:</strong> ${data.effectiveDate.toLocaleDateString()}</p>
        <p>You now have access to all the enhanced features of your new plan!</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
      text: `Subscription Upgraded! Dear ${
        data.firstName
      }, Your subscription has been upgraded from ${data.oldPlanName} to ${
        data.newPlanName
      }. Upgrade Amount: ₦${data.upgradeAmount.toLocaleString()}. Effective Date: ${data.effectiveDate.toLocaleDateString()}.`,
    };
    return this.sendEmail(email, template);
  }

  async sendSubscriptionDowngrade(
    email: string,
    data: {
      firstName: string;
      currentPlanName: string;
      newPlanName: string;
      effectiveDate: Date;
    }
  ) {
    const template = {
      subject: 'Subscription Downgrade Scheduled - PharmaCare',
      html: `
        <h2>Subscription Downgrade Scheduled</h2>
        <p>Dear ${data.firstName},</p>
        <p>Your subscription downgrade from <strong>${
          data.currentPlanName
        }</strong> to <strong>${
        data.newPlanName
      }</strong> has been scheduled.</p>
        <p><strong>Effective Date:</strong> ${data.effectiveDate.toLocaleDateString()}</p>
        <p>You'll continue to have access to your current plan features until the effective date.</p>
        <p>You can cancel this downgrade anytime before the effective date in your account settings.</p>
        <br>
        <p>Best regards,<br>PharmaCare Team</p>
      `,
      text: `Subscription Downgrade Scheduled. Dear ${
        data.firstName
      }, Your downgrade from ${data.currentPlanName} to ${
        data.newPlanName
      } is scheduled for ${data.effectiveDate.toLocaleDateString()}.`,
    };
    return this.sendEmail(email, template);
  }
}

export const emailService = new EmailService();
export default emailService;
