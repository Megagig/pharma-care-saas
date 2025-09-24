import mongoose from "mongoose";
import { ICommunicationAuditLog, ICommunicationAuditLogDetails } from "../models/CommunicationAuditLog";
import { AuthRequest } from "../types/auth";
export interface CommunicationAuditContext {
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
}
export interface CreateCommunicationAuditLogData {
    action: ICommunicationAuditLog["action"];
    targetId: mongoose.Types.ObjectId;
    targetType: ICommunicationAuditLog["targetType"];
    details: ICommunicationAuditLogDetails;
    success?: boolean;
    errorMessage?: string;
    duration?: number;
}
export interface CommunicationAuditFilters {
    userId?: string;
    action?: string;
    targetType?: string;
    conversationId?: string;
    patientId?: string;
    riskLevel?: string;
    complianceCategory?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare class CommunicationAuditService {
    static createAuditLog(context: CommunicationAuditContext, data: CreateCommunicationAuditLogData): Promise<ICommunicationAuditLog>;
    static logMessageSent(context: CommunicationAuditContext, messageId: mongoose.Types.ObjectId, conversationId: mongoose.Types.ObjectId, details: {
        messageType: string;
        hasAttachments?: boolean;
        mentionCount?: number;
        priority?: string;
        patientId?: mongoose.Types.ObjectId;
    }): Promise<ICommunicationAuditLog>;
    static logMessageRead(context: CommunicationAuditContext, messageId: mongoose.Types.ObjectId, conversationId: mongoose.Types.ObjectId, patientId?: mongoose.Types.ObjectId): Promise<ICommunicationAuditLog>;
    static logConversationCreated(context: CommunicationAuditContext, conversationId: mongoose.Types.ObjectId, details: {
        conversationType: string;
        participantCount: number;
        patientId?: mongoose.Types.ObjectId;
        priority?: string;
    }): Promise<ICommunicationAuditLog>;
    static logParticipantAdded(context: CommunicationAuditContext, conversationId: mongoose.Types.ObjectId, addedUserId: mongoose.Types.ObjectId, details: {
        role: string;
        patientId?: mongoose.Types.ObjectId;
    }): Promise<ICommunicationAuditLog>;
    static logFileUploaded(context: CommunicationAuditContext, fileId: string, conversationId: mongoose.Types.ObjectId, details: {
        fileName: string;
        fileSize: number;
        mimeType: string;
        patientId?: mongoose.Types.ObjectId;
    }): Promise<ICommunicationAuditLog>;
    static logConversationExported(context: CommunicationAuditContext, conversationId: mongoose.Types.ObjectId, details: {
        exportFormat: string;
        messageCount: number;
        dateRange?: {
            start: Date;
            end: Date;
        };
        patientId?: mongoose.Types.ObjectId;
    }): Promise<ICommunicationAuditLog>;
    static getAuditLogs(workplaceId: string, filters?: CommunicationAuditFilters): Promise<{
        logs: ICommunicationAuditLog[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    static getConversationAuditLogs(conversationId: string, workplaceId: string, options?: {
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ICommunicationAuditLog[]>;
    static getHighRiskActivities(workplaceId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<ICommunicationAuditLog[]>;
    static generateComplianceReport(workplaceId: string, dateRange: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
    static exportAuditLogs(workplaceId: string, filters: CommunicationAuditFilters, format?: "csv" | "json"): Promise<string>;
    private static convertToCSV;
    static createAuditContext(req: AuthRequest): CommunicationAuditContext;
    static getUserActivitySummary(userId: string, workplaceId: string, dateRange: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
    static logBulkOperation(context: CommunicationAuditContext, action: string, targetIds: mongoose.Types.ObjectId[], targetType: ICommunicationAuditLog["targetType"], details: ICommunicationAuditLogDetails): Promise<ICommunicationAuditLog>;
    static cleanupOldLogs(daysToKeep?: number): Promise<number>;
}
export default CommunicationAuditService;
//# sourceMappingURL=communicationAuditService.d.ts.map