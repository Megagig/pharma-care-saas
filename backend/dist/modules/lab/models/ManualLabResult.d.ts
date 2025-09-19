import mongoose, { Document } from 'mongoose';
export interface IManualLabResultValue {
    testCode: string;
    testName: string;
    numericValue?: number;
    unit?: string;
    stringValue?: string;
    comment?: string;
    abnormalFlag?: boolean;
}
export interface IManualLabResultInterpretation {
    testCode: string;
    interpretation: 'low' | 'normal' | 'high' | 'critical';
    note?: string;
}
export interface IManualLabResult extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: string;
    enteredBy: mongoose.Types.ObjectId;
    enteredAt: Date;
    values: IManualLabResultValue[];
    interpretation: IManualLabResultInterpretation[];
    aiProcessed: boolean;
    aiProcessedAt?: Date;
    diagnosticResultId?: mongoose.Types.ObjectId;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    addValue(testCode: string, testName: string, value: number | string, unit?: string): void;
    interpretValue(testCode: string, interpretation: IManualLabResultInterpretation['interpretation'], note?: string): void;
    markAsAIProcessed(diagnosticResultId: mongoose.Types.ObjectId): Promise<void>;
    addReview(reviewedBy: mongoose.Types.ObjectId, notes?: string): Promise<void>;
    hasAbnormalResults(): boolean;
    getCriticalResults(): IManualLabResultValue[];
}
interface IManualLabResultModel extends mongoose.Model<IManualLabResult> {
    findByOrderId(orderId: string): mongoose.Query<IManualLabResult | null, IManualLabResult>;
    findPendingAIProcessing(): mongoose.Query<IManualLabResult[], IManualLabResult>;
    findAbnormalResults(): mongoose.Query<IManualLabResult[], IManualLabResult>;
    findCriticalResults(): mongoose.Query<IManualLabResult[], IManualLabResult>;
    findPendingReview(): mongoose.Query<IManualLabResult[], IManualLabResult>;
    findByEnteredBy(enteredBy: mongoose.Types.ObjectId, fromDate?: Date, toDate?: Date): mongoose.Query<IManualLabResult[], IManualLabResult>;
}
declare const _default: IManualLabResultModel;
export default _default;
//# sourceMappingURL=ManualLabResult.d.ts.map