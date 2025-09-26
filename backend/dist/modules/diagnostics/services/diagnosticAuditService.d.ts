export interface DiagnosticAuditEvent {
    eventType: 'diagnostic_request_created' | 'diagnostic_processing_started' | 'diagnostic_processing_completed' | 'diagnostic_processing_failed' | 'ai_analysis_requested' | 'ai_analysis_completed' | 'ai_analysis_failed' | 'pharmacist_review_started' | 'pharmacist_review_completed' | 'diagnostic_approved' | 'diagnostic_modified' | 'diagnostic_rejected' | 'intervention_created' | 'lab_order_created' | 'lab_result_added' | 'follow_up_scheduled' | 'adherence_tracked' | 'security_violation' | 'data_access' | 'data_export' | 'consent_obtained' | 'consent_revoked' | 'data_retention_policy_updated';
    entityType: 'diagnostic_request' | 'diagnostic_result' | 'lab_order' | 'lab_result' | 'follow_up' | 'adherence';
    entityId: string;
    userId: string;
    workplaceId: string;
    patientId?: string;
    details: {
        [key: string]: any;
    };
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
        apiVersion?: string;
        requestId?: string;
    };
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    regulatoryContext?: {
        hipaaCompliant: boolean;
        gdprCompliant: boolean;
        dataRetentionPeriod: number;
        consentRequired: boolean;
        consentObtained?: boolean;
    };
    aiMetadata?: {
        modelId: string;
        modelVersion: string;
        promptHash: string;
        responseHash: string;
        tokenUsage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        confidenceScore?: number;
        processingTime: number;
    };
}
export interface AuditSearchCriteria {
    workplaceId: string;
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
    entityTypes?: string[];
    userIds?: string[];
    patientIds?: string[];
    severity?: string[];
    entityId?: string;
    searchText?: string;
    limit?: number;
    offset?: number;
}
export interface ComplianceReport {
    reportId: string;
    workplaceId: string;
    reportType: 'hipaa' | 'gdpr' | 'audit_trail' | 'data_access' | 'ai_usage';
    period: {
        startDate: Date;
        endDate: Date;
    };
    generatedAt: Date;
    generatedBy: string;
    summary: {
        totalEvents: number;
        criticalEvents: number;
        securityViolations: number;
        dataAccessEvents: number;
        aiUsageEvents: number;
        consentEvents: number;
    };
    findings: Array<{
        category: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        count: number;
        recommendation?: string;
    }>;
    dataRetention: {
        totalRecords: number;
        recordsNearingExpiry: number;
        expiredRecords: number;
        retentionPolicy: string;
    };
    aiUsage: {
        totalRequests: number;
        uniqueUsers: number;
        averageConfidence: number;
        modelUsage: {
            [modelId: string]: {
                requests: number;
                averageTokens: number;
                averageProcessingTime: number;
            };
        };
    };
    complianceStatus: {
        hipaaCompliant: boolean;
        gdprCompliant: boolean;
        issues: string[];
        recommendations: string[];
    };
}
declare class DiagnosticAuditService {
    logAuditEvent(event: DiagnosticAuditEvent): Promise<void>;
    logDiagnosticRequestCreated(requestId: string, userId: string, workplaceId: string, patientId: string, details: any, metadata?: any): Promise<void>;
    logAIAnalysisRequested(requestId: string, userId: string, workplaceId: string, patientId: string, aiMetadata: any, metadata?: any): Promise<void>;
    logAIAnalysisCompleted(requestId: string, resultId: string, userId: string, workplaceId: string, patientId: string, aiMetadata: any, metadata?: any): Promise<void>;
    logPharmacistReview(resultId: string, userId: string, workplaceId: string, patientId: string, reviewDetails: any, metadata?: any): Promise<void>;
    logSecurityViolation(userId: string, workplaceId: string, violationType: string, details: any, metadata?: any): Promise<void>;
    searchAuditEvents(criteria: AuditSearchCriteria): Promise<{
        events: any[];
        total: number;
        hasMore: boolean;
    }>;
    generateComplianceReport(workplaceId: string, reportType: ComplianceReport['reportType'], startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport>;
    private analyzeEventsForCompliance;
    private generateComplianceFindings;
    private analyzeDataRetention;
    private analyzeAIUsage;
    private assessComplianceStatus;
    getEntityAuditTrail(entityType: string, entityId: string, workplaceId: string): Promise<any[]>;
    archiveOldRecords(workplaceId: string, retentionDays?: number): Promise<{
        archivedCount: number;
        deletedCount: number;
    }>;
}
declare const _default: DiagnosticAuditService;
export default _default;
//# sourceMappingURL=diagnosticAuditService.d.ts.map