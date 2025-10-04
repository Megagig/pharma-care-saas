interface ReportFilters {
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    patientId?: string;
    pharmacistId?: string;
    therapyType?: string;
    priority?: string;
    location?: string;
    status?: string;
}
export declare function getTherapyEffectivenessDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    adherenceMetrics: any[];
}>;
export declare function getQualityImprovementDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    completionTimeAnalysis: any[];
}>;
export declare function getRegulatoryComplianceDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    complianceMetrics: any;
}>;
export declare function getCostEffectivenessDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    costSavings: any[];
}>;
export declare function getTrendForecastingDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    trends: any[];
}>;
export declare function getOperationalEfficiencyDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    workflowMetrics: any[];
}>;
export declare function getMedicationInventoryDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    usagePatterns: any[];
    inventoryTurnover: any[];
    expirationTracking: any[];
}>;
export declare function getPatientDemographicsDataOptimized(workplaceId: string, filters: ReportFilters): Promise<any>;
export declare function getAdverseEventsDataOptimized(workplaceId: string, filters: ReportFilters): Promise<{
    adverseEvents: any[];
}>;
export {};
//# sourceMappingURL=optimizedReportHelpers.d.ts.map