import mongoose from 'mongoose';
export interface AuditContext {
    userId: string;
    workspaceId: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface AuditLogData {
    action: string;
    userId: string;
    interventionId?: string;
    details: Record<string, any>;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: string;
    changedFields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    workspaceId?: string;
}
import { IManualLabOrder } from '../models/ManualLabOrder';
import { IManualLabResult } from '../models/ManualLabResult';
export interface ManualLabAuditContext extends AuditContext {
    orderId?: string;
    patientId?: mongoose.Types.ObjectId;
    testCount?: number;
    priority?: string;
    hasAbnormalResults?: boolean;
}
export interface PDFAccessAuditData {
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    fileName: string;
    fileSize: number;
    downloadMethod: 'direct_link' | 'qr_scan' | 'barcode_scan';
    accessDuration?: number;
    userAgent?: string;
    referrer?: string;
}
export interface ResultEntryAuditData {
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    testCount: number;
    abnormalResultCount: number;
    criticalResultCount: number;
    entryDuration?: number;
    validationErrors?: string[];
    aiProcessingTriggered: boolean;
}
export interface ComplianceReportData {
    workplaceId: mongoose.Types.ObjectId;
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
    dateRange: {
        start: Date;
        end: Date;
    };
    totalOrders: number;
    totalResults: number;
    pdfAccesses: number;
    complianceViolations: number;
    securityIncidents: number;
}
declare class ManualLabAuditService {
    static logOrderCreation(context: ManualLabAuditContext, order: IManualLabOrder, pdfGenerated?: boolean, generationTime?: number): Promise<void>;
    static logPDFAccess(context: ManualLabAuditContext, auditData: PDFAccessAuditData): Promise<void>;
    static logResultEntry(context: ManualLabAuditContext, result: IManualLabResult, auditData: ResultEntryAuditData): Promise<void>;
    static logResultModification(context: ManualLabAuditContext, orderId: string, oldValues: any, newValues: any, modificationReason?: string): Promise<void>;
    static logStatusChange(context: ManualLabAuditContext, orderId: string, oldStatus: string, newStatus: string, statusChangeReason?: string): Promise<void>;
    static logTokenResolution(context: ManualLabAuditContext, orderId: string, tokenType: 'qr_code' | 'barcode' | 'manual_entry', success: boolean, errorReason?: string): Promise<void>;
    static generateComplianceReport(reportData: ComplianceReportData): Promise<any>;
    private static trackPDFAccessPattern;
    private static logIndividualTestResult;
    private static validateStatusTransition;
    private static getChangedFields;
    private static analyzeComplianceMetrics;
    private static generateComplianceRecommendations;
}
export default ManualLabAuditService;
//# sourceMappingURL=manualLabAuditService.d.ts.map