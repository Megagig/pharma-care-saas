import twilio from 'twilio';

interface Patient {
   contactInfo: {
      phone: string;
   };
}

interface Medication {
   drugName: string;
   instructions: {
      dosage: string;
   };
}

// Check if Twilio credentials are properly configured
const isValidTwilioConfig = () => {
   const accountSid = process.env.TWILIO_ACCOUNT_SID;
   const authToken = process.env.TWILIO_AUTH_TOKEN;
   const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

   return (
      accountSid &&
      authToken &&
      phoneNumber &&
      accountSid.startsWith('AC') &&
      accountSid !== 'your-twilio-account-sid' &&
      authToken !== 'your-twilio-auth-token'
   );
};

// Initialize Twilio client only if credentials are valid
let client: twilio.Twilio | null = null;

if (isValidTwilioConfig()) {
   try {
      client = twilio(
         process.env.TWILIO_ACCOUNT_SID!,
         process.env.TWILIO_AUTH_TOKEN!
      );
      console.log('Twilio SMS service initialized successfully');
   } catch (error) {
      console.warn('Failed to initialize Twilio client:', error);
      client = null;
   }
} else {
   console.warn(
      'Twilio SMS service not configured - using mock mode. Please set valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file'
   );
}

export const sendSMS = async (to: string, message: string): Promise<any> => {
   if (!client) {
      console.log(
         'SMS Mock Mode - Would send SMS to:',
         to,
         'Message:',
         message
      );
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
   } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
   }
};

export const sendMedicationReminder = async (
   patient: Patient,
   medication: Medication
): Promise<any> => {
   const message = `Reminder: Time to take your ${medication.drugName}. Instructions: ${medication.instructions.dosage}`;
   return await sendSMS(patient.contactInfo.phone, message);
};

export const sendAppointmentReminder = async (
   patient: Patient,
   appointmentDate: string
): Promise<any> => {
   const message = `Reminder: You have a pharmacy consultation scheduled for ${appointmentDate}. Please bring your medications.`;
   return await sendSMS(patient.contactInfo.phone, message);
};
