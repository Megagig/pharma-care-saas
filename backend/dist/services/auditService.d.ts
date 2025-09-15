import mongoose from 'mongoose';
import { IMTRAuditLog } from '../models/MTRAuditLog';
export interface AuditContext {
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    userRole: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestMethod?: string;
    requestUrl?: string;
}
export interface AuditLogData {
    action: string;
    resourceType: 'MedicationTherapyReview' | 'DrugTherapyProblem' | 'MTRIntervention' | 'MTRFollowUp' | 'Patient' | 'User' | 'ClinicalIntervention' | 'ClinicalNote' | 'System' | 'diagnostic_request' | 'diagnostic_result' | 'lab_order' | 'lab_result' | 'follow_up' | 'adherence';
    resourceId: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
    details: any;
    errorMessage?: string;
    duration?: number;
    complianceCategory?: 'clinical_documentation' | 'patient_safety' | 'data_access' | 'system_security' | 'workflow_compliance';
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}
export interface ExportOptions {
    format: 'json' | 'csv' | 'pdf';
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: {
        userId?: mongoose.Types.ObjectId;
        action?: string;
        resourceType?: string;
        complianceCategory?: string;
        riskLevel?: string;
        patientId?: mongoose.Types.ObjectId;
        reviewId?: mongoose.Types.ObjectId;
    };
    includeDetails?: boolean;
    includeSensitiveData?: boolean;
}
declare class AuditService {
    static logActivity(context: AuditContext, auditData: AuditLogData): Promise<IMTRAuditLog>;
    static logMTRActivity(context: AuditContext, action: string, session: any, oldValues?: any, newValues?: any): Promise<IMTRAuditLog>;
    static logPatientAccess(context: AuditContext, patientId: mongoose.Types.ObjectId, accessType: 'view' | 'edit' | 'create' | 'delete', details?: any): Promise<IMTRAuditLog>;
    static logEvent(context: AuditContext, eventData: {
        action: string;
        resourceType?: any;
        resourceId?: mongoose.Types.ObjectId;
        patientId?: mongoose.Types.ObjectId;
        details?: any;
        complianceCategory?: string;
        riskLevel?: string;
    }): Promise<IMTRAuditLog>;
    static logAuthEvent(context: Partial<AuditContext>, action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN', details?: any): Promise<IMTRAuditLog | null>;
    static getAuditLogs(workplaceId: mongoose.Types.ObjectId, filters?: {
        userId?: mongoose.Types.ObjectId;
        action?: string;
        resourceType?: string;
        complianceCategory?: string;
        riskLevel?: string;
        patientId?: mongoose.Types.ObjectId;
        reviewId?: mongoose.Types.ObjectId;
        startDate?: Date;
        endDate?: Date;
        ipAddress?: string;
    }, options?: {
        page?: number;
        limit?: number;
        sort?: string;
    }): Promise<{
        logs: IMTRAuditLog[];
        total: number;
    }>;
    static exportAuditData(workplaceId: mongoose.Types.ObjectId, options: ExportOptions): Promise<{
        data: any;
        filename: string;
        contentType: string;
    }>;
    static getAuditSummary(workplaceId: mongoose.Types.ObjectId, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    static getComplianceReport(workplaceId: mongoose.Types.ObjectId, dateRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
    private static determineComplianceCategory;
    private static determineRiskLevel;
    private static getChangedFields;
    private static convertToCSV;
    private static calculateComplianceScore;
    private static generateComplianceRecommendations;
    private static triggerSecurityAlert;
    static createAuditContext(req: any): AuditContext;
}
export default AuditService;
//# sourceMappingURL=auditService.d.ts.map