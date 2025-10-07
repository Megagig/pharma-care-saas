"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionReminder = exports.sendWelcomeEmail = exports.sendEmail = void 0;
const resend_1 = require("resend");
const nodemailer_1 = __importDefault(require("nodemailer"));
let resend = null;
const getResendClient = () => {
    if (!resend && hasValidResendConfig()) {
        resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};
const hasValidResendConfig = () => {
    return (process.env.RESEND_API_KEY &&
        process.env.SENDER_EMAIL &&
        process.env.RESEND_API_KEY.startsWith('re_'));
};
const hasValidSMTPConfig = () => {
    return (process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_HOST !== 'smtp.gmail.com' &&
        process.env.SMTP_USER !== 'your-email@gmail.com');
};
const createSMTPTransporter = () => {
    if (hasValidSMTPConfig()) {
        return nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};
const smtpTransporter = createSMTPTransporter();
const sendWithResend = async (options) => {
    try {
        const resendClient = getResendClient();
        const { data, error } = await resendClient.emails.send({
            from: `${process.env.SENDER_NAME || 'PharmacyCopilot Hub'} <${process.env.SENDER_EMAIL}>`,
            to: [options.to],
            subject: options.subject,
            html: options.html || options.text || '',
            text: options.text,
        });
        if (error) {
            throw new Error(`Resend error: ${error.message}`);
        }
        console.log('✅ Email sent successfully via Resend:', data?.id);
        return {
            messageId: data?.id,
            service: 'resend',
            response: 'Email sent via Resend'
        };
    }
    catch (error) {
        console.error('❌ Resend email failed:', error);
        throw error;
    }
};
const sendWithSMTP = async (options) => {
    if (!smtpTransporter) {
        throw new Error('SMTP transporter not configured');
    }
    try {
        const message = {
            from: `${process.env.FROM_NAME || 'PharmacyCopilot Hub'} <${process.env.FROM_EMAIL || process.env.SENDER_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };
        const info = await smtpTransporter.sendMail(message);
        console.log('✅ Email sent successfully via SMTP:', info.messageId);
        return {
            messageId: info.messageId,
            service: 'smtp',
            response: info.response
        };
    }
    catch (error) {
        console.error('❌ SMTP email failed:', error);
        throw error;
    }
};
const simulateEmail = (options) => {
    console.log('📧 EMAIL SIMULATION (Development Mode)');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Content:', options.text || options.html);
    console.log('---');
    return {
        messageId: 'dev-' + Date.now(),
        service: 'simulation',
        response: 'Email simulated in development mode'
    };
};
const sendEmail = async (options) => {
    try {
        if (hasValidResendConfig()) {
            try {
                return await sendWithResend(options);
            }
            catch (resendError) {
                console.warn('⚠️ Resend failed, trying SMTP fallback:', resendError);
                if (hasValidSMTPConfig()) {
                    return await sendWithSMTP(options);
                }
            }
        }
        if (hasValidSMTPConfig()) {
            return await sendWithSMTP(options);
        }
        if (process.env.NODE_ENV === 'development') {
            return simulateEmail(options);
        }
        throw new Error('No email service configured');
    }
    catch (error) {
        console.error('❌ All email services failed:', error);
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 EMAIL FALLBACK (Development Mode)');
            return simulateEmail(options);
        }
        throw error;
    }
};
exports.sendEmail = sendEmail;
const sendWelcomeEmail = async (user) => {
    const message = {
        to: user.email,
        subject: 'Welcome to PharmacyCopilot SaaS',
        text: `Welcome ${user.firstName}! Your pharmaceutical care management account is ready.`,
        html: `
      <h1>Welcome to PharmacyCopilot SaaS, ${user.firstName}!</h1>
      <p>Your account for ${user.pharmacyName} is now active.</p>
      <p>You can now start managing your patients and clinical notes.</p>
    `
    };
    return await (0, exports.sendEmail)(message);
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendSubscriptionReminder = async (user, subscription) => {
    const message = {
        to: user.email,
        subject: 'Subscription Renewal Reminder',
        text: `Your PharmacyCopilot subscription expires on ${subscription.endDate}`,
        html: `
      <h2>Subscription Renewal Reminder</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your PharmacyCopilot subscription (${subscription.plan}) expires on ${subscription.endDate}.</p>
      <p>Renew now to continue accessing all features.</p>
    `
    };
    return await (0, exports.sendEmail)(message);
};
exports.sendSubscriptionReminder = sendSubscriptionReminder;
//# sourceMappingURL=email.js.map