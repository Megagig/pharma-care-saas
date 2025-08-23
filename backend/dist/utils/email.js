"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionReminder = exports.sendWelcomeEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (options) => {
    try {
        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
const sendWelcomeEmail = async (user) => {
    const message = {
        to: user.email,
        subject: 'Welcome to PharmaCare SaaS',
        text: `Welcome ${user.firstName}! Your pharmaceutical care management account is ready.`,
        html: `
      <h1>Welcome to PharmaCare SaaS, ${user.firstName}!</h1>
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
        text: `Your PharmaCare subscription expires on ${subscription.endDate}`,
        html: `
      <h2>Subscription Renewal Reminder</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your PharmaCare subscription (${subscription.plan}) expires on ${subscription.endDate}.</p>
      <p>Renew now to continue accessing all features.</p>
    `
    };
    return await (0, exports.sendEmail)(message);
};
exports.sendSubscriptionReminder = sendSubscriptionReminder;
//# sourceMappingURL=email.js.map