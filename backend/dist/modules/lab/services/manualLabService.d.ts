import mongoose from 'mongoose';
import { IManualLabOrder, IManualLabTest } from '../models/ManualLabOrder';
import { IManualLabResult, IManualLabResultValue } from '../models/ManualLabResult';
import { AuditContext } from '../../../services/auditService';
export interface CreateOrderRequest {
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    orderedBy: mongoose.Types.ObjectId;
    tests: IManualLabTest[];
    indication: string;
    priority?: 'routine' | 'urgent' | 'stat';
    notes?: string;
    consentObtained: boolean;
    consentObtainedBy: mongoose.Types.ObjectId;
}
export interface AddResultsRequest {
    enteredBy: mongoose.Types.ObjectId;
    values: Array<{
        testCode: string;
        testName: string;
        numericValue?: number;
        unit?: string;
        stringValue?: string;
        comment?: string;
    }>;
    reviewNotes?: string;
}
export interface OrderFilters {
    workplaceId: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    orderedBy?: mongoose.Types.ObjectId;
    status?: IManualLabOrder['status'];
    priority?: IManualLabOrder['priority'];
    locationId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface OrderStatusUpdate {
    status: IManualLabOrder['status'];
    updatedBy: mongoose.Types.ObjectId;
    notes?: string;
}
export interface AIInterpretationRequest {
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    labResults: IManualLabResultValue[];
    indication: string;
    requestedBy: mongoose.Types.ObjectId;
}
declare class ManualLabService {
    static createOrder(orderData: CreateOrderRequest, auditContext: AuditContext): Promise<IManualLabOrder>;
    static getOrderById(orderId: string, workplaceId: mongoose.Types.ObjectId, auditContext?: AuditContext): Promise<IManualLabOrder | null>;
    static getOrdersByPatient(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, options?: {
        page?: number;
        limit?: number;
        status?: IManualLabOrder['status'];
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedResult<IManualLabOrder>>;
    static updateOrderStatus(orderId: string, statusUpdate: OrderStatusUpdate, auditContext: AuditContext): Promise<IManualLabOrder>;
    static addResults(orderId: string, resultData: AddResultsRequest, auditContext: AuditContext): Promise<IManualLabResult>;
    static getResultsByOrder(orderId: string, workplaceId: mongoose.Types.ObjectId, auditContext?: AuditContext): Promise<IManualLabResult | null>;
    static resolveToken(token: string, auditContext?: AuditContext): Promise<IManualLabOrder | null>;
    static getOrders(filters: OrderFilters, auditContext?: AuditContext): Promise<PaginatedResult<IManualLabOrder>>;
    static triggerAIInterpretation(request: AIInterpretationRequest): Promise<any>;
    private static validateAIResponse;
    private static processCriticalAlerts;
    private static getValidStatusTransitions;
    private static generateAutoInterpretations;
    private static interpretNumericValue;
    static logOrderEvent(orderId: string, event: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, details?: any): Promise<void>;
}
export default ManualLabService;
//# sourceMappingURL=manualLabService.d.ts.map