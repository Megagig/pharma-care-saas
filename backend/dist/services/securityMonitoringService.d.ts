import mongoose from 'mongoose';
import { AuthRequest } from '../types/auth';
interface SecurityThreat {
    id: string;
    type: 'brute_force' | 'suspicious_activity' | 'permission_escalation' | 'data_exfiltration' | 'session_hijacking' | 'invitation_spam';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    description: string;
    evidence: any;
    timestamp: Date;
    resolved: boolean;
    actions: string[];
}
declare class SecurityMonitoringService {
    private static instance;
    private alertCooldowns;
    static getInstance(): SecurityMonitoringService;
    analyzeSecurityEvent(req: AuthRequest, eventType: string, eventData: any): Promise<void>;
    private detectBruteForceAttack;
    private detectPermissionEscalation;
    private detectInvitationSpam;
    private detectDataExfiltration;
    private detectSessionAnomalies;
    private detectSuspiciousActivity;
    private processThreat;
    private executeThreatResponse;
    private sendSecurityAlerts;
    private sendAlert;
    isIPBlocked(ipAddress: string): boolean;
    getUserSuspiciousScore(userId: string): number;
    getSecurityThreats(filters?: {
        type?: SecurityThreat['type'];
        severity?: SecurityThreat['severity'];
        resolved?: boolean;
        userId?: string;
        workspaceId?: string;
        limit?: number;
    }): SecurityThreat[];
    resolveThreat(threatId: string, resolvedBy: string, notes?: string): Promise<boolean>;
    validateUserSession(userId: mongoose.Types.ObjectId, sessionId: string): Promise<boolean>;
    cleanup(): void;
}
export declare const securityMonitoringService: SecurityMonitoringService;
export declare const cleanupSecurityMonitoring: () => void;
export default securityMonitoringService;
//# sourceMappingURL=securityMonitoringService.d.ts.map