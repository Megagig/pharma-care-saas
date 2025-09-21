import { AuthRequest } from '../types/auth';
interface SecurityEvent {
    id: string;
    userId?: string;
    sessionId?: string;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    ipAddress: string;
    userAgent: string;
    details: Record<string, any>;
    riskScore: number;
    actionTaken?: string;
}
interface ThreatIndicator {
    type: 'ip' | 'user' | 'pattern' | 'anomaly';
    value: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    firstSeen: number;
    lastSeen: number;
    occurrences: number;
    description: string;
}
interface SecurityMetrics {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topThreats: ThreatIndicator[];
    riskScore: number;
    lastUpdated: number;
}
declare class CommunicationSecurityMonitoringService {
    private securityEvents;
    private threatIndicators;
    private userRiskScores;
    private ipRiskScores;
    private blockedIPs;
    private suspiciousUsers;
    private readonly MAX_EVENTS;
    private readonly RISK_THRESHOLD_HIGH;
    private readonly RISK_THRESHOLD_MEDIUM;
    private readonly CLEANUP_INTERVAL;
    private readonly EVENT_RETENTION;
    constructor();
    recordSecurityEvent(eventType: string, req: AuthRequest, details?: Record<string, any>, severity?: SecurityEvent['severity']): void;
    private analyzeImmediateThreats;
    private checkThreatPatterns;
    private containsXSSPattern;
    private getRecentEventsByType;
    private calculateEventRiskScore;
    private updateThreatIndicators;
    private updateRiskScores;
    private getSeverityLevel;
    private generateEventId;
    private cleanupOldEvents;
    isIPBlocked(ipAddress: string): boolean;
    isUserSuspicious(userId: string): boolean;
    getUserRiskScore(userId: string): number;
    getIPRiskScore(ipAddress: string): number;
    getSecurityMetrics(): SecurityMetrics;
    getRecentEvents(limit?: number): SecurityEvent[];
    getEventsByUser(userId: string, limit?: number): SecurityEvent[];
    unblockIP(ipAddress: string): boolean;
    clearUserSuspicion(userId: string): boolean;
    reset(): void;
}
export declare const communicationSecurityMonitoringService: CommunicationSecurityMonitoringService;
export default communicationSecurityMonitoringService;
//# sourceMappingURL=communicationSecurityMonitoring.d.ts.map