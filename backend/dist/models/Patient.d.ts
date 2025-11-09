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
    name?: string;
    allergies: Array<{
        _id?: mongoose.Types.ObjectId;
        allergen: string;
        reaction: string;
        severity: 'mild' | 'moderate' | 'severe';
        recordedDate: Date;
        recordedBy?: mongoose.Types.ObjectId;
        notes?: string;
    }>;
    chronicConditions: Array<{
        _id?: mongoose.Types.ObjectId;
        condition: string;
        diagnosedDate: Date;
        managementPlan?: string;
        status: 'active' | 'managed' | 'resolved';
        recordedBy?: mongoose.Types.ObjectId;
        notes?: string;
    }>;
    enhancedEmergencyContacts: Array<{
        _id?: mongoose.Types.ObjectId;
        name: string;
        relationship: string;
        phone: string;
        email?: string;
        isPrimary: boolean;
        priority: number;
    }>;
    insuranceInfo: {
        provider?: string;
        policyNumber?: string;
        expiryDate?: Date;
        coverageDetails?: string;
        copayAmount?: number;
        isActive?: boolean;
    };
    patientLoggedVitals: Array<{
        _id?: mongoose.Types.ObjectId;
        recordedDate: Date;
        appointmentId?: mongoose.Types.ObjectId;
        bloodPressure?: {
            systolic: number;
            diastolic: number;
        };
        heartRate?: number;
        temperature?: number;
        weight?: number;
        glucose?: number;
        oxygenSaturation?: number;
        notes?: string;
        source: 'patient_portal';
        verifiedBy?: mongoose.Types.ObjectId;
        isVerified?: boolean;
    }>;
    latestVitals?: IPatientVitals;
    notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
        resultNotifications: boolean;
        orderReminders: boolean;
    };
    appointmentPreferences?: {
        preferredDays: number[];
        preferredTimeSlots: Array<{
            start: string;
            end: string;
        }>;
        preferredPharmacist?: mongoose.Types.ObjectId;
        reminderPreferences: {
            email: boolean;
            sms: boolean;
            push: boolean;
            whatsapp: boolean;
        };
        language: string;
        timezone: string;
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
    engagementMetrics?: {
        totalAppointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        noShowAppointments: number;
        completionRate: number;
        totalFollowUps: number;
        completedFollowUps: number;
        overdueFollowUps: number;
        followUpCompletionRate: number;
        averageResponseTime: number;
        lastEngagementDate?: Date;
        engagementScore: number;
        lastUpdated?: Date;
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
    addAllergy(allergyData: any, recordedBy?: mongoose.Types.ObjectId): void;
    removeAllergy(allergyId: string): boolean;
    updateAllergy(allergyId: string, updates: any): boolean;
    addChronicCondition(conditionData: any, recordedBy?: mongoose.Types.ObjectId): void;
    removeChronicCondition(conditionId: string): boolean;
    updateChronicCondition(conditionId: string, updates: any): boolean;
    addEmergencyContact(contactData: any): void;
    removeEmergencyContact(contactId: string): boolean;
    updateEmergencyContact(contactId: string, updates: any): boolean;
    setPrimaryEmergencyContact(contactId: string): boolean;
    updateInsuranceInfo(insuranceData: any): void;
    logVitals(vitalsData: any): void;
    getVitalsHistory(limit?: number): any[];
    getLatestVitals(): any;
    verifyVitals(vitalsId: string, verifiedBy: mongoose.Types.ObjectId): boolean;
    unverifyVitals(vitalsId: string): boolean;
    getUnverifiedVitals(): any[];
    getVerifiedVitals(limit?: number): any[];
}
interface IPatientModel extends mongoose.Model<IPatient> {
    generateNextMRN(workplaceId: mongoose.Types.ObjectId, workplaceCode: string): Promise<string>;
}
declare const Patient: IPatientModel;
export { Patient };
export default Patient;
//# sourceMappingURL=Patient.d.ts.map