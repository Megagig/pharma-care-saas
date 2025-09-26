export interface AuditVisualizationData {
    timeline: Array<{
        date: string;
        events: number;
        criticalEvents: number;
        eventTypes: {
            [key: string]: number;
        };
    }>;
    userActivity: Array<{
        userId: string;
        userName?: string;
        totalEvents: number;
        riskScore: number;
        lastActivity: Date;
        eventBreakdown: {
            [key: string]: number;
        };
    }>;
    entityFlow: Array<{
        entityId: string;
        entityType: string;
        events: Array<{
            timestamp: Date;
            action: string;
            userId: string;
            details: any;
        }>;
    }>;
    riskHeatmap: Array<{
        category: string;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        count: number;
        percentage: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    complianceMetrics: {
        auditCoverage: number;
        dataIntegrity: number;
        accessCompliance: number;
        retentionCompliance: number;
    };
}
export interface AuditSearchFilters {
    workplaceId: string;
    startDate?: Date;
    endDate?: Date;
    userIds?: string[];
    eventTypes?: string[];
    entityTypes?: string[];
    entityIds?: string[];
    riskLevels?: string[];
    searchText?: string;
    ipAddresses?: string[];
    sessionIds?: string[];
    hasErrors?: boolean;
    complianceCategories?: string[];
}
export interface AuditSearchResult {
    events: Array<{
        id: string;
        timestamp: Date;
        action: string;
        entityType: string;
        entityId: string;
        userId: string;
        userName?: string;
        riskLevel: string;
        complianceCategory: string;
        details: any;
        ipAddress?: string;
        userAgent?: string;
        duration?: number;
        errorMessage?: string;
        changedFields?: string[];
        relatedEvents?: string[];
    }>;
    aggregations: {
        totalEvents: number;
        uniqueUsers: number;
        uniqueEntities: number;
        eventsByType: {
            [key: string]: number;
        };
        eventsByRisk: {
            [key: string]: number;
        };
        eventsByCompliance: {
            [key: string]: number;
        };
        timeDistribution: {
            [key: string]: number;
        };
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
declare class AuditVisualizationService {
    generateVisualizationData(workplaceId: string, startDate: Date, endDate: Date): Promise<AuditVisualizationData>;
    searchAuditEvents(filters: AuditSearchFilters, page?: number, limit?: number): Promise<AuditSearchResult>;
    private generateTimeline;
    private generateUserActivity;
    private generateEntityFlow;
    private generateRiskHeatmap;
    private calculateComplianceMetrics;
    private generateAggregations;
    exportVisualizationData(workplaceId: string, startDate: Date, endDate: Date, format?: 'json' | 'csv' | 'pdf'): Promise<{
        data: any;
        filename: string;
        contentType: string;
    }>;
}
declare const _default: AuditVisualizationService;
export default _default;
//# sourceMappingURL=auditVisualizationService.d.ts.map