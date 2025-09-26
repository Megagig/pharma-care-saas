import { IAuditLog } from '../models/AuditLog';
import { Request } from 'express';
import mongoose from 'mongoose';
export interface AuditLogData {
    action: string;
    userId: string;
    interventionId?: string;
    resourceType?: string;
    resourceId?: mongoose.Types.ObjectId | string;
    patientId?: mongoose.Types.ObjectId | string;
    details: Record<string, any>;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: string;
    changedFields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    workspaceId?: string;
}
export interface AuditQueryOptions {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    riskLevel?: string;
    userId?: string;
    action?: string;
    interventionId?: string;
    complianceCategory?: string;
}
declare class AuditService {
    static createAuditLog(data: AuditLogData, req?: Request): Promise<IAuditLog>;
    static getAuditLogs(options?: AuditQueryOptions): Promise<{
        logs: (mongoose.FlattenMaps<IAuditLog> & {
            _id: mongoose.Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
        summary: {
            totalActions: number;
            uniqueUsers: number;
            riskActivities: number;
            lastActivity: Date;
        };
    }>;
    static getInterventionAuditLogs(interventionId: string, options?: AuditQueryOptions): Promise<{
        logs: (mongoose.FlattenMaps<IAuditLog> & {
            _id: mongoose.Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
        summary: {
            totalActions: number;
            uniqueUsers: number;
            riskActivities: number;
            lastActivity: Date;
        };
    }>;
    static calculateSummary(query?: any): Promise<{
        totalActions: number;
        uniqueUsers: number;
        riskActivities: number;
        lastActivity: Date;
    }>;
    static exportAuditLogs(options: AuditQueryOptions & {
        format: 'csv' | 'json';
    }): Promise<string>;
    private static convertToCSV;
    private static calculateRiskLevel;
    private static getClientIP;
    static cleanupOldLogs(daysToKeep?: number): Promise<number>;
    static getComplianceReport(options: {
        startDate: string;
        endDate: string;
        includeDetails?: boolean;
        interventionIds?: string[];
    }): Promise<{
        summary: {
            totalInterventions: number;
            auditedActions: number;
            complianceScore: number;
            riskActivities: number;
        };
        complianceByCategory: any;
    }>;
    static createAuditContext(req: Request): {
        userId: any;
        ipAddress: string;
        userAgent: string;
        sessionId: any;
        workspaceId: any;
    };
    static logActivity(context: any, data: Partial<AuditLogData>): Promise<IAuditLog>;
    static logMTRActivity(context: any, action: string, session: any, oldValues?: any, newValues?: any): Promise<IAuditLog>;
}
export { AuditService };
export default AuditService;
//# sourceMappingURL=auditService.d.ts.map