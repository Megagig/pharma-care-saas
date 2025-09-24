import mongoose from 'mongoose';
export interface SecurityAlert {
    id: string;
    type: 'privilege_escalation' | 'rapid_changes' | 'bulk_suspicious' | 'unauthorized_admin' | 'permission_bypass';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
    description: string;
    details: Record<string, any>;
    resolved: boolean;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    actions: string[];
}
export interface SuspiciousPattern {
    userId: mongoose.Types.ObjectId;
    patternType: string;
    occurrences: number;
    firstSeen: Date;
    lastSeen: Date;
    riskScore: number;
    details: Record<string, any>;
}
export interface PrivilegeEscalationAttempt {
    userId: mongoose.Types.ObjectId;
    targetUserId?: mongoose.Types.ObjectId;
    attemptType: 'self_escalation' | 'unauthorized_admin_assignment' | 'role_manipulation' | 'permission_bypass';
    timestamp: Date;
    details: Record<string, any>;
    blocked: boolean;
    riskScore: number;
}
declare class RBACSecurityMonitoringService {
    private static instance;
    private activeAlerts;
    private suspiciousPatterns;
    private privilegeEscalationAttempts;
    private readonly RAPID_ROLE_ASSIGNMENT_THRESHOLD;
    private readonly BULK_OPERATION_THRESHOLD;
    private readonly PRIVILEGE_ESCALATION_RISK_THRESHOLD;
    private readonly ADMIN_ROLE_ASSIGNMENT_COOLDOWN;
    static getInstance(): RBACSecurityMonitoringService;
    monitorRoleAssignment(assignerId: mongoose.Types.ObjectId, targetUserId: mongoose.Types.ObjectId, roleId: mongoose.Types.ObjectId, roleName: string, context: any): Promise<{
        allowed: boolean;
        alerts: SecurityAlert[];
    }>;
    monitorBulkOperation(userId: mongoose.Types.ObjectId, operationType: string, itemCount: number, affectedUsers: mongoose.Types.ObjectId[], context: any): Promise<{
        allowed: boolean;
        alerts: SecurityAlert[];
    }>;
    monitorPermissionBypass(userId: mongoose.Types.ObjectId, attemptedAction: string, deniedReason: string, context: any): Promise<SecurityAlert | null>;
    private detectSelfPrivilegeEscalation;
    private detectRapidRoleAssignments;
    private detectUnauthorizedAdminAssignment;
    private detectSuspiciousBulkPatterns;
    private calculateBypassRiskScore;
    private createSecurityAlert;
    private logSecurityAlert;
    private verifyAdminPermission;
    private isAdminRole;
    private isSuperAdminRole;
    private hasHigherPrivileges;
    private severityToRiskScore;
    getActiveAlerts(userId?: mongoose.Types.ObjectId): SecurityAlert[];
    resolveAlert(alertId: string, resolvedBy: mongoose.Types.ObjectId, resolution: string): Promise<boolean>;
    getSecurityStatistics(startDate: Date, endDate: Date): Promise<{
        totalAlerts: number;
        alertsBySeverity: Record<string, number>;
        alertsByType: Record<string, number>;
        privilegeEscalationAttempts: number;
        resolvedAlerts: number;
        averageResolutionTime: number;
    }>;
    cleanupOldData(daysToKeep?: number): void;
}
export { RBACSecurityMonitoringService };
export default RBACSecurityMonitoringService;
//# sourceMappingURL=rbacSecurityMonitoringService.d.ts.map