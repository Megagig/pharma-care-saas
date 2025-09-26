import mongoose, { Document } from 'mongoose';
export interface IReportSchedule extends Document {
    _id: string;
    name: string;
    description?: string;
    reportType: string;
    templateId?: mongoose.Types.ObjectId;
    filters: {
        dateRange?: {
            type: 'relative' | 'absolute';
            startDate?: Date;
            endDate?: Date;
            relativePeriod?: string;
        };
        patientId?: mongoose.Types.ObjectId;
        pharmacistId?: mongoose.Types.ObjectId;
        therapyType?: string;
        priority?: string;
        location?: string;
        status?: string;
        customFilters?: Record<string, any>;
    };
    frequency: {
        type: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
        interval?: number;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        monthOfYear?: number;
        time: string;
        timezone: string;
    };
    recipients: Array<{
        email: string;
        name?: string;
        role?: string;
        notificationPreferences: {
            onSuccess: boolean;
            onFailure: boolean;
            onEmpty: boolean;
        };
    }>;
    deliveryOptions: {
        formats: Array<'pdf' | 'csv' | 'excel' | 'json'>;
        emailTemplate: {
            subject: string;
            body: string;
            includeCharts: boolean;
            includeSummary: boolean;
        };
        attachmentOptions: {
            compress: boolean;
            password?: string;
            watermark?: string;
        };
    };
    isActive: boolean;
    nextRun: Date;
    lastRun?: Date;
    lastRunStatus?: 'success' | 'failure' | 'partial' | 'cancelled';
    lastRunDetails?: {
        startTime: Date;
        endTime: Date;
        recordsProcessed: number;
        filesGenerated: string[];
        emailsSent: number;
        errors?: string[];
    };
    executionHistory: Array<{
        runId: string;
        startTime: Date;
        endTime: Date;
        status: 'success' | 'failure' | 'partial' | 'cancelled';
        recordsProcessed: number;
        filesGenerated: string[];
        emailsSent: number;
        errors?: string[];
        duration: number;
    }>;
    retryPolicy: {
        maxRetries: number;
        retryInterval: number;
        backoffMultiplier: number;
    };
    createdBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    permissions: {
        view: string[];
        edit: string[];
        delete: string[];
        execute: string[];
    };
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReportSchedule, {}, {}, {}, mongoose.Document<unknown, {}, IReportSchedule> & IReportSchedule & Required<{
    _id: string;
}>, any>;
export default _default;
//# sourceMappingURL=ReportSchedule.d.ts.map