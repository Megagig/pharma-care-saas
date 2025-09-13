import mongoose from 'mongoose';
import { AuditContext } from '../../../services/auditService';
interface SecurityThreat {
    type: 'rate_limit_exceeded' | 'suspicious_pattern' | 'unauthorized_access' | 'data_exfiltration' | 'injection_attempt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: mongoose.Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
    details: any;
    timestamp: Date;
}
interface SecurityMetrics {
    userId: string;
    totalRequests: number;
    failedRequests: number;
    pdfAccesses: number;
    orderCreations: number;
    suspiciousActivities: number;
    lastActivity: Date;
    riskScore: number;
}
declare class ManualLabSecurityService {
    private static securityMetrics;
    private static threatLog;
    private static readonly MAX_THREAT_LOG_SIZE;
    static analyzeRequest(context: AuditContext, requestData: {
        method: string;
        url: string;
        body?: any;
        query?: any;
        headers?: any;
    }): Promise<SecurityThreat[]>;
    private static detectInjectionAttempts;
    private static detectSuspiciousPatterns;
    private static detectDataExfiltration;
    private static updateSecurityMetrics;
    private static logSecurityThreat;
    private static getSecurityMetrics;
    private static calculateRiskScore;
    private static triggerSecurityAlert;
    static getSecuritySummary(userId: string): SecurityMetrics | null;
    static getRecentThreats(limit?: number): SecurityThreat[];
    static clearUserMetrics(userId: string): boolean;
    static getSecurityStatistics(): {
        totalUsers: number;
        highRiskUsers: number;
        totalThreats: number;
        threatsByType: {
            [key: string]: number;
        };
        threatsBySeverity: {
            [key: string]: number;
        };
    };
}
export default ManualLabSecurityService;
//# sourceMappingURL=manualLabSecurityService.d.ts.map