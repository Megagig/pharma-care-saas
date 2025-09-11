import mongoose, { Document } from 'mongoose';
export interface IDiagnosticCase extends Document {
    caseId: string;
    patientId: mongoose.Types.ObjectId;
    pharmacistId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    symptoms: {
        subjective: string[];
        objective: string[];
        duration: string;
        severity: 'mild' | 'moderate' | 'severe';
        onset: 'acute' | 'chronic' | 'subacute';
    };
    labResults?: {
        testName: string;
        value: string;
        referenceRange: string;
        abnormal: boolean;
    }[];
    currentMedications?: {
        name: string;
        dosage: string;
        frequency: string;
        startDate: Date;
    }[];
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
    };
    aiAnalysis: {
        differentialDiagnoses: {
            condition: string;
            probability: number;
            reasoning: string;
            severity: 'low' | 'medium' | 'high';
        }[];
        recommendedTests: {
            testName: string;
            priority: 'urgent' | 'routine' | 'optional';
            reasoning: string;
        }[];
        therapeuticOptions: {
            medication: string;
            dosage: string;
            frequency: string;
            duration: string;
            reasoning: string;
            safetyNotes: string[];
        }[];
        redFlags: {
            flag: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            action: string;
        }[];
        referralRecommendation?: {
            recommended: boolean;
            urgency: 'immediate' | 'within_24h' | 'routine';
            specialty: string;
            reason: string;
        };
        disclaimer: string;
        confidenceScore: number;
        processingTime: number;
    };
    drugInteractions?: {
        drug1: string;
        drug2: string;
        severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
        description: string;
        clinicalEffect: string;
        management: string;
    }[];
    pharmacistDecision: {
        accepted: boolean;
        modifications: string;
        finalRecommendation: string;
        counselingPoints: string[];
        followUpRequired: boolean;
        followUpDate?: Date;
    };
    patientConsent: {
        provided: boolean;
        consentDate: Date;
        consentMethod: 'verbal' | 'written' | 'electronic';
    };
    aiRequestData: {
        model: string;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        requestId: string;
        processingTime: number;
    };
    status: 'draft' | 'completed' | 'referred' | 'cancelled';
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDiagnosticCase, {}, {}, {}, mongoose.Document<unknown, {}, IDiagnosticCase> & IDiagnosticCase & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=DiagnosticCase.d.ts.map