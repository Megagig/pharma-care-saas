import mongoose, { Document, Model } from 'mongoose';
export interface IReportAuditLog extends Document {
    _id: string;
    eventType: string;
    reportType?: string;
    reportId?: mongoose.Types.ObjectId;
    templateId?: mongoose.Types.ObjectId;
    scheduleId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    eventDetails: {
        action: string;
        resource: string;
        resourceId?: string;
        filters?: Record<string, any>;
        exportFormat?: string;
        recipients?: string[];
        duration?: number;
        recordCount?: number;
        fileSize?: number;
        success: boolean;
        errorMessage?: string;
        metadata?: Record<string, any>;
    };
    compliance: {
        dataAccessed: string[];
        sensitiveData: boolean;
        retentionPeriod?: number;
        anonymized: boolean;
        encryptionUsed: boolean;
        accessJustification?: string;
    };
    performance: {
        queryTime?: number;
        renderTime?: number;
        exportTime?: number;
        memoryUsage?: number;
        cpuUsage?: number;
    };
    geolocation?: {
        country?: string;
        region?: string;
        city?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    deviceInfo?: {
        deviceType: 'desktop' | 'mobile' | 'tablet' | 'server';
        operatingSystem?: string;
        browser?: string;
        screenResolution?: string;
    };
    riskScore: number;
    flagged: boolean;
    flagReason?: string;
    reviewStatus?: 'pending' | 'reviewed' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
    relatedEvents?: mongoose.Types.ObjectId[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IReportAuditLogModel extends Model<IReportAuditLog> {
    logEvent(eventData: Partial<IReportAuditLog>): Promise<IReportAuditLog>;
    getSecuritySummary(workplaceId: string, days?: number): Promise<any>;
    getUserActivity(userId: string, workplaceId: string, days?: number): Promise<IReportAuditLog[]>;
    getComplianceReport(workplaceId: string, startDate: Date, endDate: Date): Promise<any>;
}
declare const _default: IReportAuditLogModel;
export default _default;
//# sourceMappingURL=ReportAuditLog.d.ts.map