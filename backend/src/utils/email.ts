import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface User {
  email: string;
  firstName: string;
  pharmacyName: string;
}

interface Subscription {
  plan: string;
  endDate: Date;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<any> => {
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
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (user: User): Promise<any> => {
  const message: EmailOptions = {
    to: user.email,
    subject: 'Welcome to PharmaCare SaaS',
    text: `Welcome ${user.firstName}! Your pharmaceutical care management account is ready.`,
    html: `
      <h1>Welcome to PharmaCare SaaS, ${user.firstName}!</h1>
      <p>Your account for ${user.pharmacyName} is now active.</p>
      <p>You can now start managing your patients and clinical notes.</p>
    `
  };

  return await sendEmail(message);
};

export const sendSubscriptionReminder = async (user: User, subscription: Subscription): Promise<any> => {
  const message: EmailOptions = {
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

  return await sendEmail(message);
};