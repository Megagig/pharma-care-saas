import { ILabOrder } from '../models/LabOrder';
import { ILabResult } from '../models/LabResult';
import { FHIRBundle, PatientMapping, FHIRImportResult } from './fhirService';
export interface CreateLabOrderRequest {
    patientId: string;
    orderedBy: string;
    workplaceId: string;
    locationId?: string;
    tests: Array<{
        code: string;
        name: string;
        loincCode?: string;
        indication: string;
        priority: 'stat' | 'urgent' | 'routine';
    }>;
    expectedDate?: Date;
    externalOrderId?: string;
}
export interface CreateLabResultRequest {
    orderId?: string;
    patientId: string;
    workplaceId: string;
    testCode: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange: {
        low?: number;
        high?: number;
        text?: string;
    };
    performedAt: Date;
    recordedBy: string;
    source?: 'manual' | 'fhir' | 'lis' | 'external';
    externalResultId?: string;
    loincCode?: string;
}
export interface ValidationResult {
    isValid: boolean;
    interpretation: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
    flags: string[];
    recommendations: string[];
}
export interface TrendData {
    testCode: string;
    testName: string;
    results: Array<{
        value: number;
        unit: string;
        performedAt: Date;
        interpretation: string;
    }>;
    trend: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
    analysis: {
        averageValue: number;
        changePercent: number;
        timeSpan: number;
    };
}
export interface LabOrderFilters {
    patientId?: string;
    status?: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
    priority?: 'stat' | 'urgent' | 'routine';
    dateFrom?: Date;
    dateTo?: Date;
    testCode?: string;
}
export interface LabResultFilters {
    patientId?: string;
    testCode?: string;
    interpretation?: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
    dateFrom?: Date;
    dateTo?: Date;
    source?: 'manual' | 'fhir' | 'lis' | 'external';
}
export declare class LabService {
    createLabOrder(orderData: CreateLabOrderRequest): Promise<ILabOrder>;
    getLabOrders(workplaceId: string, filters?: LabOrderFilters, page?: number, limit?: number): Promise<{
        orders: ILabOrder[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    updateLabOrderStatus(orderId: string, status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled', workplaceId: string): Promise<ILabOrder>;
    addLabResult(resultData: CreateLabResultRequest): Promise<ILabResult>;
    getLabResults(workplaceId: string, filters?: LabResultFilters, page?: number, limit?: number): Promise<{
        results: ILabResult[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    validateResult(result: ILabResult): Promise<ValidationResult>;
    getResultTrends(patientId: string, testCode: string, workplaceId: string, daysBack?: number): Promise<TrendData>;
    private parseNumericValue;
    private isCriticalLow;
    private isCriticalHigh;
    private interpretQualitativeResult;
    private getTestSpecificRecommendations;
    private isImprovingTrend;
    getLabOrderById(orderId: string, workplaceId: string): Promise<ILabOrder | null>;
    getLabResultById(resultId: string, workplaceId: string): Promise<ILabResult | null>;
    updateLabOrder(orderId: string, updates: Partial<ILabOrder>, updatedBy: string): Promise<ILabOrder>;
    cancelLabOrder(orderId: string, cancelledBy: string): Promise<ILabOrder>;
    updateLabResult(resultId: string, updates: Partial<ILabResult>, updatedBy: string): Promise<ILabResult>;
    importFHIRResults(fhirBundle: FHIRBundle, patientMappings: PatientMapping[], workplaceId: string, importedBy: string): Promise<FHIRImportResult>;
    exportLabOrderToFHIR(orderId: string, workplaceId: string): Promise<any>;
    syncLabResultsFromFHIR(patientId: string, workplaceId: string, fromDate?: Date, toDate?: Date): Promise<{
        synced: number;
        errors: string[];
    }>;
    testFHIRConnection(): Promise<{
        connected: boolean;
        error?: string;
    }>;
    deleteLabOrder(orderId: string, workplaceId: string): Promise<boolean>;
}
declare const _default: LabService;
export default _default;
//# sourceMappingURL=labService.d.ts.map