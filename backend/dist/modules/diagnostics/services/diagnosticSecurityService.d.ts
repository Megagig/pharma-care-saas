import { AuthRequest } from '../../../types/auth';
export interface SecurityThreat {
    id: string;
    type: 'RATE_LIMIT_ABUSE' | 'DATA_EXFILTRATION' | 'SUSPICIOUS_PATTERN' | 'API_ABUSE' | 'INJECTION_ATTEMPT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId: string;
    workplaceId: string;
    description: string;
    evidence: any;
    timestamp: Date;
    mitigated: boolean;
}
export interface SecurityMetrics {
    totalThreats: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
    mitigatedThreats: number;
    activeThreats: number;
    averageResponseTime: number;
}
export interface ApiKeyRotationConfig {
    rotationInterval: number;
    warningThreshold: number;
    autoRotate: boolean;
    notifyAdmins: boolean;
}
declare class DiagnosticSecurityService {
    private threats;
    private apiKeyRotationConfig;
    analyzeRequest(req: AuthRequest, requestType: string): Promise<SecurityThreat[]>;
    private analyzeRateLimitPatterns;
    private analyzeDataPatterns;
    private analyzeInjectionAttempts;
    private analyzeApiAbusePatterns;
    private detectBurstPattern;
    private detectSustainedPattern;
    private detectDataExfiltrationPattern;
    private detectUnusualDataVolume;
    private detectInjectionPatterns;
    private scanObjectForPatterns;
    private detectBotBehavior;
    private extractFieldNames;
    private processThreat;
    private mitigateThreat;
    private temporaryRateLimit;
    private flagUserForReview;
    private requireAdditionalVerification;
    private alertAdministrators;
    getSecurityMetrics(): SecurityMetrics;
    getActiveThreats(): SecurityThreat[];
    clearOldThreats(olderThanMs?: number): void;
}
declare const _default: DiagnosticSecurityService;
export default _default;
//# sourceMappingURL=diagnosticSecurityService.d.ts.map