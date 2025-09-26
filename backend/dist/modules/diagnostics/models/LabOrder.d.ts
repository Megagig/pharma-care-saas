import mongoose, { Document } from 'mongoose';
export interface ILabTest {
    code: string;
    name: string;
    loincCode?: string;
    indication: string;
    priority: 'stat' | 'urgent' | 'routine';
    category?: string;
    specimen?: string;
    expectedTurnaround?: string;
    estimatedCost?: number;
    clinicalNotes?: string;
}
export interface ILabOrder extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    orderedBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    orderNumber: string;
    tests: ILabTest[];
    status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled' | 'rejected';
    orderDate: Date;
    expectedDate?: Date;
    completedDate?: Date;
    clinicalIndication: string;
    urgentReason?: string;
    patientInstructions?: string;
    labInstructions?: string;
    collectionDate?: Date;
    collectedBy?: mongoose.Types.ObjectId;
    collectionNotes?: string;
    specimenType?: string;
    collectionSite?: string;
    externalOrderId?: string;
    fhirReference?: string;
    labSystemId?: string;
    trackingNumber?: string;
    notificationsSent: {
        ordered: boolean;
        collected: boolean;
        processing: boolean;
        completed: boolean;
    };
    validationFlags?: string[];
    rejectionReason?: string;
    totalEstimatedCost?: number;
    insurancePreAuth?: boolean;
    paymentStatus?: 'pending' | 'authorized' | 'paid' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    isActive: boolean;
    daysSinceOrder: number;
    updateStatus(status: ILabOrder['status'], updatedBy?: mongoose.Types.ObjectId): Promise<void>;
    markAsCollected(collectedBy: mongoose.Types.ObjectId, notes?: string): Promise<void>;
    markAsCompleted(): Promise<void>;
    cancel(reason: string, cancelledBy: mongoose.Types.ObjectId): Promise<void>;
    calculateTotalCost(): number;
    getHighestPriority(): 'stat' | 'urgent' | 'routine';
    isOverdue(): boolean;
    canBeModified(): boolean;
}
interface ILabOrderModel extends mongoose.Model<ILabOrder> {
    generateOrderNumber(workplaceId: mongoose.Types.ObjectId): Promise<string>;
    findActiveOrders(workplaceId: mongoose.Types.ObjectId): mongoose.Query<ILabOrder[], ILabOrder>;
    findOverdueOrders(workplaceId: mongoose.Types.ObjectId): mongoose.Query<ILabOrder[], ILabOrder>;
    findByPatient(workplaceId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId): mongoose.Query<ILabOrder[], ILabOrder>;
    findByPriority(workplaceId: mongoose.Types.ObjectId, priority: 'stat' | 'urgent' | 'routine'): mongoose.Query<ILabOrder[], ILabOrder>;
}
declare const _default: ILabOrderModel;
export default _default;
//# sourceMappingURL=LabOrder.d.ts.map