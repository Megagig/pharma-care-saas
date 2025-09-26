import { IAuditLog } from '../models/AuditLog';
import { AuditService } from './auditService';
import { Request } from 'express';
import mongoose from 'mongoose';
export interface RBACSecurityContext {
    riskScore: number;
    anomalyDetected: boolean;
    escalationReason?: string;
    previousPermissions?: string[];
    newPermissions?: string[];
}
export interface RBACBulkOperation {
    operationId: string;
    operationType: 'role_assignment' | 'permission_update' | 'role_creation' | 'role_deletion';
    totalItems: number;
    successCount: number;
    failureCount: number;
    startTime: Date;
    endTime?: Date;
    errors?: Array<{
        itemId: string;
        error: string;
        timestamp: Date;
    }>;
}
export interface RBACPermissionChange {
    userId: mongoose.Types.ObjectId;
    action: string;
    roleId?: mongoose.Types.ObjectId;
    roleName?: string;
    permissionAction?: string;
    permissionSource?: 'direct' | 'role' | 'inherited' | 'legacy';
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    securityContext?: RBACSecurityContext;
    hierarchyLevel?: number;
    targetUserId?: mongoose.Types.ObjectId;
}
declare class RBACSecurityMonitor {
    private static instance;
    private suspiciousPatterns;
    private bulkOperations;
    static getInstance(): RBACSecurityMonitor;
    calculateRiskScore(action: string, userId: mongoose.Types.ObjectId, context: any): number;
    detectAnomalies(action: string, userId: mongoose.Types.ObjectId, context: any): {
        detected: boolean;
        reason?: string;
    };
    startBulkOperation(operationType: RBACBulkOperation['operationType'], totalItems: number): string;
    updateBulkOperation(operationId: string, success: boolean, error?: {
        itemId: string;
        error: string;
    }): void;
    completeBulkOperation(operationId: string): RBACBulkOperation | null;
}
declare class RBACSecurityAuditService extends AuditService {
    private static securityMonitor;
    static logPermissionChange(change: RBACPermissionChange, req?: Request): Promise<IAuditLog>;
    static logBulkOperation(operationType: RBACBulkOperation['operationType'], userId: mongoose.Types.ObjectId, items: Array<{
        id: string;
        success: boolean;
        error?: string;
    }>, req?: Request): Promise<{
        operationId: string;
        auditLog: IAuditLog;
    }>;
    static logRoleHierarchyChange(userId: mongoose.Types.ObjectId, roleId: mongoose.Types.ObjectId, roleName: string, action: 'ROLE_HIERARCHY_MODIFIED' | 'ROLE_INHERITANCE_MODIFIED', oldHierarchy: any, newHierarchy: any, req?: Request): Promise<IAuditLog>;
    static logPermissionCheck(userId: mongoose.Types.ObjectId, permissionAction: string, allowed: boolean, source: 'direct' | 'role' | 'inherited' | 'legacy', context: any, req?: Request): Promise<IAuditLog>;
    static getRBACSecuritySummary(startDate: Date, endDate: Date, workspaceId?: mongoose.Types.ObjectId): Promise<{
        summary: {
            totalRBACOperations: number;
            highRiskOperations: number;
            anomalousOperations: number;
            privilegeEscalations: number;
            bulkOperations: number;
            permissionDenials: number;
            securityScore: number;
        };
        roleOperations: any;
        recentAlerts: {
            id: any;
            action: string;
            timestamp: Date;
            user: mongoose.Types.ObjectId;
            riskScore: number | undefined;
            reason: string | undefined;
        }[];
    }>;
    private static triggerSecurityAlert;
    static exportRBACLogs(options: {
        startDate: Date;
        endDate: Date;
        includeSecurityContext?: boolean;
        riskLevelFilter?: string[];
        actionFilter?: string[];
        format: 'csv' | 'json';
    }): Promise<string>;
    private static convertRBACLogsToCSV;
}
export { RBACSecurityAuditService, RBACSecurityMonitor };
export default RBACSecurityAuditService;
//# sourceMappingURL=rbacAuditService.d.ts.map