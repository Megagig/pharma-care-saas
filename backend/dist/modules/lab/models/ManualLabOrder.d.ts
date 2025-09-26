import mongoose, { Document } from 'mongoose';
export interface IManualLabTest {
    name: string;
    code: string;
    loincCode?: string;
    specimenType: string;
    unit?: string;
    refRange?: string;
    category?: string;
}
export interface IManualLabOrder extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    orderedBy: mongoose.Types.ObjectId;
    tests: IManualLabTest[];
    indication: string;
    requisitionFormUrl: string;
    barcodeData: string;
    status: 'requested' | 'sample_collected' | 'result_awaited' | 'completed' | 'referred';
    priority?: 'routine' | 'urgent' | 'stat';
    notes?: string;
    consentObtained: boolean;
    consentTimestamp: Date;
    consentObtainedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    updateStatus(status: IManualLabOrder['status'], updatedBy?: mongoose.Types.ObjectId): Promise<void>;
    generateOrderId(workplaceCode: string): Promise<string>;
    canBeModified(): boolean;
    isActive(): boolean;
}
interface IManualLabOrderModel extends mongoose.Model<IManualLabOrder> {
    generateNextOrderId(workplaceId: mongoose.Types.ObjectId): Promise<string>;
    findActiveOrders(workplaceId: mongoose.Types.ObjectId): mongoose.Query<IManualLabOrder[], IManualLabOrder>;
    findByPatient(workplaceId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId): mongoose.Query<IManualLabOrder[], IManualLabOrder>;
    findByBarcodeData(barcodeData: string): mongoose.Query<IManualLabOrder | null, IManualLabOrder>;
    findByStatus(workplaceId: mongoose.Types.ObjectId, status: IManualLabOrder['status']): mongoose.Query<IManualLabOrder[], IManualLabOrder>;
}
declare const _default: IManualLabOrderModel;
export default _default;
//# sourceMappingURL=ManualLabOrder.d.ts.map