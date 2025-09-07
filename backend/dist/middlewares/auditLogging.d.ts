import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/auth';
interface SystemAuditLog {
    _id?: mongoose.Types.ObjectId;
    timestamp: Date;
    action: string;
    category: 'authentication' | 'authorization' | 'invitation' | 'subscription' | 'workspace' | 'user_management' | 'security' | 'data_access' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: mongoose.Types.ObjectId;
    userEmail?: string;
    userRole?: string;
    workspaceId?: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    requestMethod: string;
    requestUrl: string;
    requestId?: string;
    sessionId?: string;
    resourceType?: string;
    resourceId?: mongoose.Types.ObjectId;
    resourceName?: string;
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
    details: any;
    errorMessage?: string;
    statusCode?: number;
    duration?: number;
    suspicious?: boolean;
    riskScore?: number;
    complianceRelevant: boolean;
    retentionPeriod?: number;
}
export declare const createAuditLog: (logData: Partial<SystemAuditLog>) => Promise<void>;
export declare const auditMiddleware: (options: {
    action: string;
    category: SystemAuditLog["category"];
    severity?: SystemAuditLog["severity"];
    resourceType?: string;
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
}) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditOperations: {
    login: (req: Request, user: any, success: boolean) => Promise<void>;
    logout: (req: AuthRequest) => Promise<void>;
    invitationCreated: (req: AuthRequest, invitation: any) => Promise<void>;
    invitationAccepted: (req: AuthRequest, invitation: any, newUser: any) => Promise<void>;
    subscriptionChanged: (req: AuthRequest, oldSubscription: any, newSubscription: any) => Promise<void>;
    permissionDenied: (req: AuthRequest, requiredPermission: string, reason: string) => Promise<void>;
    dataAccess: (req: AuthRequest, resourceType: string, resourceId: string, action: string) => Promise<void>;
    noteAccess: (req: AuthRequest, noteId: string, action: string, details?: any) => Promise<void>;
    unauthorizedAccess: (req: AuthRequest, resourceType: string, resourceId: string, reason: string) => Promise<void>;
    confidentialDataAccess: (req: AuthRequest, resourceType: string, resourceId: string, action: string, details?: any) => Promise<void>;
    bulkOperation: (req: AuthRequest, action: string, resourceType: string, resourceIds: string[], details?: any) => Promise<void>;
    dataExport: (req: AuthRequest, exportType: string, recordCount: number, details?: any) => Promise<void>;
};
export declare const getAuditLogs: (filters: {
    userId?: string;
    workspaceId?: string;
    category?: SystemAuditLog["category"];
    severity?: SystemAuditLog["severity"];
    startDate?: Date;
    endDate?: Date;
    suspicious?: boolean;
    limit?: number;
}) => SystemAuditLog[];
declare const _default: {
    createAuditLog: (logData: Partial<SystemAuditLog>) => Promise<void>;
    auditMiddleware: (options: {
        action: string;
        category: SystemAuditLog["category"];
        severity?: SystemAuditLog["severity"];
        resourceType?: string;
        includeRequestBody?: boolean;
        includeResponseBody?: boolean;
    }) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    auditOperations: {
        login: (req: Request, user: any, success: boolean) => Promise<void>;
        logout: (req: AuthRequest) => Promise<void>;
        invitationCreated: (req: AuthRequest, invitation: any) => Promise<void>;
        invitationAccepted: (req: AuthRequest, invitation: any, newUser: any) => Promise<void>;
        subscriptionChanged: (req: AuthRequest, oldSubscription: any, newSubscription: any) => Promise<void>;
        permissionDenied: (req: AuthRequest, requiredPermission: string, reason: string) => Promise<void>;
        dataAccess: (req: AuthRequest, resourceType: string, resourceId: string, action: string) => Promise<void>;
        noteAccess: (req: AuthRequest, noteId: string, action: string, details?: any) => Promise<void>;
        unauthorizedAccess: (req: AuthRequest, resourceType: string, resourceId: string, reason: string) => Promise<void>;
        confidentialDataAccess: (req: AuthRequest, resourceType: string, resourceId: string, action: string, details?: any) => Promise<void>;
        bulkOperation: (req: AuthRequest, action: string, resourceType: string, resourceIds: string[], details?: any) => Promise<void>;
        dataExport: (req: AuthRequest, exportType: string, recordCount: number, details?: any) => Promise<void>;
    };
    getAuditLogs: (filters: {
        userId?: string;
        workspaceId?: string;
        category?: SystemAuditLog["category"];
        severity?: SystemAuditLog["severity"];
        startDate?: Date;
        endDate?: Date;
        suspicious?: boolean;
        limit?: number;
    }) => SystemAuditLog[];
};
export default _default;
//# sourceMappingURL=auditLogging.d.ts.map