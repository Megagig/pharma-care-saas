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

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const sendSMS = async (to: string, message: string): Promise<any> => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return result;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

export const sendMedicationReminder = async (patient: Patient, medication: Medication): Promise<any> => {
  const message = `Reminder: Time to take your ${medication.drugName}. Instructions: ${medication.instructions.dosage}`;
  return await sendSMS(patient.contactInfo.phone, message);
};

export const sendAppointmentReminder = async (patient: Patient, appointmentDate: string): Promise<any> => {
  const message = `Reminder: You have a pharmacy consultation scheduled for ${appointmentDate}. Please bring your medications.`;
  return await sendSMS(patient.contactInfo.phone, message);
};