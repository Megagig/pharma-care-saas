export interface RegulatoryReport {
    reportId: string;
    workplaceId: string;
    reportType: 'hipaa' | 'gdpr' | 'fda_21cfr11' | 'sox' | 'pci_dss';
    period: {
        startDate: Date;
        endDate: Date;
    };
    generatedAt: Date;
    generatedBy: string;
    executiveSummary: {
        complianceScore: number;
        criticalIssues: number;
        recommendations: string[];
        overallStatus: 'compliant' | 'non_compliant' | 'needs_attention';
    };
    dataGovernance: {
        dataRetentionCompliance: {
            totalRecords: number;
            recordsWithinPolicy: number;
            recordsNearingExpiry: number;
            expiredRecords: number;
            orphanedRecords: number;
        };
        dataClassification: {
            phi: number;
            pii: number;
            sensitive: number;
            public: number;
        };
        accessControls: {
            totalUsers: number;
            privilegedUsers: number;
            inactiveUsers: number;
            usersWithExcessivePermissions: number;
        };
    };
    auditTrail: {
        completeness: number;
        integrity: number;
        availability: number;
        nonRepudiation: number;
    };
    securityMetrics: {
        accessViolations: number;
        dataBreaches: number;
        unauthorizedAccess: number;
        failedLogins: number;
        suspiciousActivities: number;
    };
    aiGovernance?: {
        modelTransparency: number;
        biasDetection: number;
        explainabilityScore: number;
        consentCompliance: number;
        dataMinimization: number;
    };
    recommendations: Array<{
        priority: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        description: string;
        remediation: string;
        timeline: string;
        impact: string;
    }>;
}
export interface DataRetentionPolicy {
    recordType: string;
    retentionPeriod: number;
    archivalRequired: boolean;
    deletionMethod: 'soft' | 'hard' | 'crypto_shred';
    legalHold: boolean;
    regulatoryBasis: string[];
}
export interface AnomalyDetectionResult {
    anomalyId: string;
    detectedAt: Date;
    anomalyType: 'access_pattern' | 'data_volume' | 'time_pattern' | 'user_behavior' | 'system_behavior';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedEntities: string[];
    riskScore: number;
    recommendedActions: string[];
    falsePositiveProbability: number;
}
declare class ComplianceReportingService {
    private readonly dataRetentionPolicies;
    generateRegulatoryReport(workplaceId: string, reportType: RegulatoryReport['reportType'], startDate: Date, endDate: Date, generatedBy: string): Promise<RegulatoryReport>;
    private analyzeDataGovernance;
    private analyzeAuditTrail;
    private analyzeSecurityMetrics;
    private analyzeAIGovernance;
    private calculateComplianceScore;
    private generateRecommendations;
    detectAnomalies(workplaceId: string, lookbackDays?: number): Promise<AnomalyDetectionResult[]>;
    private getAuditEvents;
    getDataRetentionPolicies(): DataRetentionPolicy[];
    updateDataRetentionPolicy(recordType: string, policy: Partial<DataRetentionPolicy>): void;
}
declare const _default: ComplianceReportingService;
export default _default;
//# sourceMappingURL=complianceReportingService.d.ts.map