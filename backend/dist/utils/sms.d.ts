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
export declare const sendSMS: (to: string, message: string) => Promise<any>;
export declare const sendMedicationReminder: (patient: Patient, medication: Medication) => Promise<any>;
export declare const sendAppointmentReminder: (patient: Patient, appointmentDate: string) => Promise<any>;
export {};
//# sourceMappingURL=sms.d.ts.map