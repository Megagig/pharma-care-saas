"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppointmentReminder = exports.sendMedicationReminder = exports.sendSMS = void 0;
const twilio_1 = __importDefault(require("twilio"));
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        return result;
    }
    catch (error) {
        console.error('SMS sending failed:', error);
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