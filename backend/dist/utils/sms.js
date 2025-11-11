"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppointmentReminder = exports.sendMedicationReminder = exports.sendSMS = void 0;
const twilio_1 = __importDefault(require("twilio"));
const logger_1 = __importDefault(require("./logger"));
const isValidTwilioConfig = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    return (accountSid &&
        authToken &&
        phoneNumber &&
        accountSid.startsWith('AC') &&
        accountSid !== 'your-twilio-account-sid' &&
        authToken !== 'your-twilio-auth-token');
};
let client = null;
if (isValidTwilioConfig()) {
    try {
        client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        logger_1.default.info('Twilio SMS service initialized successfully');
    }
    catch (error) {
        logger_1.default.warn('Failed to initialize Twilio client', { error });
        client = null;
    }
}
else {
    logger_1.default.debug('Twilio SMS service not configured - using mock mode. SMS features will be simulated.');
}
const sendSMS = async (to, message) => {
    if (!client) {
        logger_1.default.debug(`SMS Mock Mode - Would send SMS to: ${to} Message: ${message}`);
        return {
            sid: 'mock_' + Date.now(),
            status: 'delivered',
            to: to,
            body: message,
            mock: true,
        };
    }
    try {
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });
        return result;
    }
    catch (error) {
        logger_1.default.error('SMS sending failed', { error });
        throw error;
    }
};
exports.sendSMS = sendSMS;
const sendMedicationReminder = async (patient, medication) => {
    const message = `Reminder: Time to take your ${medication.drugName}. Instructions: ${medication.instructions.dosage}`;
    return await (0, exports.sendSMS)(patient.contactInfo.phone, message);
};
exports.sendMedicationReminder = sendMedicationReminder;
const sendAppointmentReminder = async (patient, appointmentDate) => {
    const message = `Reminder: You have a pharmacy consultation scheduled for ${appointmentDate}. Please bring your medications.`;
    return await (0, exports.sendSMS)(patient.contactInfo.phone, message);
};
exports.sendAppointmentReminder = sendAppointmentReminder;
//# sourceMappingURL=sms.js.map