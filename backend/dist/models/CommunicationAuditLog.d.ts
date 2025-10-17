import mongoose, { Document } from 'mongoose';
export interface ICommunicationAuditLogDetails {
    conversationId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    participantIds?: mongoose.Types.ObjectId[];
    fileId?: string;
    fileName?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface ICommunicationAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    action: 'message_sent' | 'message_read' | 'message_edited' | 'message_deleted' | 'conversation_created' | 'conversation_updated' | 'conversation_archived' | 'participant_added' | 'participant_removed' | 'participant_left' | 'file_uploaded' | 'file_downloaded' | 'file_deleted' | 'notification_sent' | 'notification_read' | 'encryption_key_rotated' | 'conversation_exported' | 'bulk_message_delete' | 'conversation_search' | 'message_search' | 'clinical_context_updated' | 'priority_changed';
    userId: mongoose.Types.ObjectId;
    targetId: mongoose.Types.ObjectId;
    targetType: 'conversation' | 'message' | 'user' | 'file' | 'notification';
    details: ICommunicationAuditLogDetails;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: 'communication_security' | 'data_access' | 'patient_privacy' | 'message_integrity' | 'file_security' | 'audit_trail' | 'encryption_compliance' | 'notification_delivery';
    workplaceId: mongoose.Types.ObjectId;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
    duration?: number;
    createdAt: Date;
    updatedAt: Date;
    setRiskLevel(): void;
    isHighRisk(): boolean;
    getFormattedDetails(): string;
}
export interface ICommunicationAuditLogModel extends mongoose.Model<ICommunicationAuditLog> {
    logAction(action: string, userId: mongoose.Types.ObjectId, targetId: mongoose.Types.ObjectId, targetType: string, details: ICommunicationAuditLogDetails, context: {
        workplaceId: mongoose.Types.ObjectId;
        ipAddress: string;
        userAgent: string;
        sessionId?: string;
        success?: boolean;
        errorMessage?: string;
        duration?: number;
    }): Promise<ICommunicationAuditLog>;
    findByConversation(conversationId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, options?: any): Promise<ICommunicationAuditLog[]>;
    findHighRiskActivities(workplaceId: mongoose.Types.ObjectId, timeRange: {
        start: Date;
        end: Date;
    }): Promise<ICommunicationAuditLog[]>;
    getComplianceReport(workplaceId: mongoose.Types.ObjectId, dateRange: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
    getUserActivitySummary(userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, dateRange: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
}
declare const _default: ICommunicationAuditLogModel;
export default _default;
//# sourceMappingURL=CommunicationAuditLog.d.ts.map