import mongoose, { Document } from 'mongoose';
export interface IMTRMedicationEntry {
    drugName: string;
    genericName?: string;
    strength: {
        value: number;
        unit: string;
    };
    dosageForm: string;
    instructions: {
        dose: string;
        frequency: string;
        route: string;
        duration?: string;
    };
    category: 'prescribed' | 'otc' | 'herbal' | 'supplement';
    prescriber?: {
        name: string;
        license?: string;
        contact?: string;
    };
    startDate: Date;
    endDate?: Date;
    indication: string;
    adherenceScore?: number;
    notes?: string;
}
export interface ITherapyPlan {
    problems: mongoose.Types.ObjectId[];
    recommendations: {
        type: 'discontinue' | 'adjust_dose' | 'switch_therapy' | 'add_therapy' | 'monitor';
        medication?: string;
        rationale: string;
        priority: 'high' | 'medium' | 'low';
        expectedOutcome: string;
    }[];
    monitoringPlan: {
        parameter: string;
        frequency: string;
        targetValue?: string;
        notes?: string;
    }[];
    counselingPoints: string[];
    goals: {
        description: string;
        targetDate?: Date;
        achieved: boolean;
        achievedDate?: Date;
    }[];
    timeline: string;
    pharmacistNotes: string;
}
export interface IClinicalOutcomes {
    problemsResolved: number;
    medicationsOptimized: number;
    adherenceImproved: boolean;
    adverseEventsReduced: boolean;
    costSavings?: number;
    qualityOfLifeImproved?: boolean;
    clinicalParametersImproved?: boolean;
}
export interface IMedicationTherapyReview extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    pharmacistId: mongoose.Types.ObjectId;
    reviewNumber: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
    priority: 'routine' | 'urgent' | 'high_risk';
    reviewType: 'initial' | 'follow_up' | 'annual' | 'targeted';
    steps: {
        patientSelection: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
        medicationHistory: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
        therapyAssessment: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
        planDevelopment: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
        interventions: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
        followUp: {
            completed: boolean;
            completedAt?: Date;
            data?: any;
        };
    };
    medications: IMTRMedicationEntry[];
    problems: mongoose.Types.ObjectId[];
    plan?: ITherapyPlan;
    interventions: mongoose.Types.ObjectId[];
    followUps: mongoose.Types.ObjectId[];
    clinicalOutcomes: IClinicalOutcomes;
    startedAt: Date;
    completedAt?: Date;
    nextReviewDate?: Date;
    estimatedDuration?: number;
    referralSource?: string;
    reviewReason?: string;
    patientConsent: boolean;
    confidentialityAgreed: boolean;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    durationDays: number;
    isOverdue: boolean;
    getCompletionPercentage(): number;
    getNextStep(): string | null;
    canComplete(): boolean;
    markStepComplete(stepName: string, data?: any): void;
    generateReviewNumber(): string;
}
declare const _default: mongoose.Model<IMedicationTherapyReview, {}, {}, {}, mongoose.Document<unknown, {}, IMedicationTherapyReview> & IMedicationTherapyReview & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=MedicationTherapyReview.d.ts.map