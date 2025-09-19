import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    action: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    interventionId?: mongoose.Types.ObjectId;
    details: Record<string, any>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: string;
    changedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    workspaceId?: mongoose.Types.ObjectId;
    sessionId?: string;
    metadata?: {
        source: string;
        version: string;
        environment: string;
    };
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog> & IAuditLog & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=AuditLog.d.ts.map