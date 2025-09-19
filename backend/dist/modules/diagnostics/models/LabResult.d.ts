import mongoose, { Document } from 'mongoose';
export interface IReferenceRange {
    low?: number;
    high?: number;
    text?: string;
    unit?: string;
    ageGroup?: string;
    gender?: 'male' | 'female' | 'all';
    condition?: string;
}
export interface ILabResult extends Document {
    _id: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    testCode: string;
    testName: string;
    testCategory?: string;
    loincCode?: string;
    value: string;
    numericValue?: number;
    unit?: string;
    referenceRange: IReferenceRange;
    interpretation: 'low' | 'normal' | 'high' | 'critical' | 'abnormal' | 'inconclusive';
    flags?: string[];
    criticalValue: boolean;
    deltaCheck?: {
        previousValue?: string;
        percentChange?: number;
        significantChange: boolean;
    };
    qualityFlags?: string[];
    technicalNotes?: string;
    methodUsed?: string;
    instrumentId?: string;
    specimenCollectedAt?: Date;
    performedAt: Date;
    reportedAt: Date;
    recordedAt: Date;
    recordedBy: mongoose.Types.ObjectId;
    source: 'manual' | 'fhir' | 'lis' | 'external' | 'imported';
    externalResultId?: string;
    fhirReference?: string;
    labSystemId?: string;
    clinicalNotes?: string;
    followUpRequired: boolean;
    followUpInstructions?: string;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    reviewStatus: 'pending' | 'reviewed' | 'flagged' | 'approved';
    reviewNotes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    isVerified: boolean;
    turnaroundTime: number | null;
    daysSinceResult: number;
    interpretResult(): string;
    isCritical(): boolean;
    isAbnormal(): boolean;
    calculatePercentChange(previousValue: number): number;
    flagForReview(reason: string, flaggedBy: mongoose.Types.ObjectId): Promise<void>;
    verify(verifiedBy: mongoose.Types.ObjectId): Promise<void>;
    addClinicalNote(note: string, addedBy: mongoose.Types.ObjectId): Promise<void>;
}
declare const _default: mongoose.Model<ILabResult, {}, {}, {}, mongoose.Document<unknown, {}, ILabResult> & ILabResult & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=LabResult.d.ts.map