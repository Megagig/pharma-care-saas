import mongoose, { Document } from 'mongoose';
export interface IPatientVitals {
    bpSystolic?: number;
    bpDiastolic?: number;
    rr?: number;
    tempC?: number;
    heartSounds?: string;
    pallor?: 'none' | 'mild' | 'moderate' | 'severe';
    dehydration?: 'none' | 'mild' | 'moderate' | 'severe';
    recordedAt?: Date;
}
export interface IPatient extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    mrn: string;
    firstName: string;
    lastName: string;
    otherNames?: string;
    dob?: Date;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    email?: string;
    address?: string;
    state?: string;
    lga?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    genotype?: 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'CC';
    weightKg?: number;
    latestVitals?: IPatientVitals;
    notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
        resultNotifications: boolean;
        orderReminders: boolean;
    };
    metadata?: {
        sharedAccess?: {
            patientId: mongoose.Types.ObjectId;
            sharedWithLocations: string[];
            sharedBy: mongoose.Types.ObjectId;
            sharedAt: Date;
            accessLevel: 'read' | 'write' | 'full';
            expiresAt?: Date;
        };
        transferWorkflow?: {
            transferId: string;
            patientId: mongoose.Types.ObjectId;
            fromLocationId: string;
            toLocationId: string;
            transferredBy: mongoose.Types.ObjectId;
            transferReason?: string;
            status: 'pending' | 'approved' | 'completed';
            createdAt: Date;
            completedAt?: Date;
            completedBy?: mongoose.Types.ObjectId;
            steps: Array<{
                step: string;
                completedAt: Date;
                completedBy: mongoose.Types.ObjectId;
            }>;
        };
    };
    hasActiveDTP?: boolean;
    hasActiveInterventions?: boolean;
    isDeleted: boolean;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    getAge(): number;
    getDisplayName(): string;
    updateLatestVitals(vitals: IPatientVitals): void;
    getInterventionCount(): Promise<number>;
    getActiveInterventionCount(): Promise<number>;
    updateInterventionFlags(): Promise<void>;
    getDiagnosticHistoryCount(): Promise<number>;
    getLatestDiagnosticHistory(): Promise<any>;
}
declare const Patient: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient> & IPatient & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export { Patient };
export default Patient;
//# sourceMappingURL=Patient.d.ts.map