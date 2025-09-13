import mongoose, { Document } from 'mongoose';
export interface ISymptomData {
    subjective: string[];
    objective: string[];
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    onset: 'acute' | 'chronic' | 'subacute';
}
export interface IVitalSigns {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    bloodGlucose?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
}
export interface IMedicationEntry {
    name: string;
    dosage: string;
    frequency: string;
    route?: string;
    startDate?: Date;
    indication?: string;
}
export interface IClinicalContext {
    chiefComplaint?: string;
    presentingSymptoms?: string[];
    relevantHistory?: string;
    assessment?: string;
    plan?: string;
}
export interface IInputSnapshot {
    symptoms: ISymptomData;
    vitals?: IVitalSigns;
    currentMedications?: IMedicationEntry[];
    allergies?: string[];
    medicalHistory?: string[];
    labResultIds?: mongoose.Types.ObjectId[];
    socialHistory?: {
        smoking?: 'never' | 'former' | 'current';
        alcohol?: 'never' | 'occasional' | 'regular' | 'heavy';
        exercise?: 'sedentary' | 'light' | 'moderate' | 'active';
    };
    familyHistory?: string[];
}
export interface IDiagnosticRequest extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    pharmacistId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    inputSnapshot: IInputSnapshot;
    clinicalContext?: IClinicalContext;
    consentObtained: boolean;
    consentTimestamp: Date;
    promptVersion: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    processingStartedAt?: Date;
    processingCompletedAt?: Date;
    errorMessage?: string;
    retryCount: number;
    priority: 'routine' | 'urgent' | 'stat';
    clinicalUrgency?: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    processingDuration?: number;
    updateStatus(status: IDiagnosticRequest['status']): Promise<void>;
    markAsProcessing(): Promise<void>;
    markAsCompleted(): Promise<void>;
    markAsFailed(error: string): Promise<void>;
    incrementRetryCount(): Promise<void>;
    canRetry(): boolean;
}
declare const _default: mongoose.Model<IDiagnosticRequest, {}, {}, {}, mongoose.Document<unknown, {}, IDiagnosticRequest> & IDiagnosticRequest & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=DiagnosticRequest.d.ts.map