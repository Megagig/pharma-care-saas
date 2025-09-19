export interface DiagnosticMetrics {
    totalCases: number;
    completedCases: number;
    pendingCases: number;
    failedCases: number;
    averageProcessingTime: number;
    successRate: number;
}
export interface AIPerformanceMetrics {
    totalAIRequests: number;
    averageConfidenceScore: number;
    pharmacistOverrideRate: number;
    averageTokenUsage: number;
    modelPerformance: {
        [modelId: string]: {
            requests: number;
            averageConfidence: number;
            overrideRate: number;
        };
    };
}
export interface PatientOutcomeMetrics {
    totalPatients: number;
    followUpCompliance: number;
    adherenceRate: number;
    interventionSuccess: number;
    referralRate: number;
}
export interface UsageAnalytics {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    featureAdoption: {
        [feature: string]: {
            usage: number;
            uniqueUsers: number;
        };
    };
    workflowEfficiency: {
        averageTimeToCompletion: number;
        stepsPerCase: number;
        errorRate: number;
    };
}
export interface TrendAnalysis {
    commonSymptoms: Array<{
        symptom: string;
        frequency: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    commonDiagnoses: Array<{
        diagnosis: string;
        frequency: number;
        confidence: number;
    }>;
    commonInterventions: Array<{
        intervention: string;
        frequency: number;
        successRate: number;
    }>;
}
export interface ComparisonAnalysis {
    manualVsAI: {
        manualCases: number;
        aiAssistedCases: number;
        accuracyComparison: {
            manual: number;
            aiAssisted: number;
        };
        timeComparison: {
            manual: number;
            aiAssisted: number;
        };
    };
}
declare class DiagnosticAnalyticsService {
    getDiagnosticMetrics(workplaceId: string, startDate?: Date, endDate?: Date): Promise<DiagnosticMetrics>;
    getAIPerformanceMetrics(workplaceId: string, startDate?: Date, endDate?: Date): Promise<AIPerformanceMetrics>;
    getPatientOutcomeMetrics(workplaceId: string, startDate?: Date, endDate?: Date): Promise<PatientOutcomeMetrics>;
    getUsageAnalytics(workplaceId: string, startDate?: Date, endDate?: Date): Promise<UsageAnalytics>;
    getTrendAnalysis(workplaceId: string, startDate?: Date, endDate?: Date): Promise<TrendAnalysis>;
    getComparisonAnalysis(workplaceId: string, startDate?: Date, endDate?: Date): Promise<ComparisonAnalysis>;
    generateAnalyticsReport(workplaceId: string, startDate?: Date, endDate?: Date): Promise<{
        diagnosticMetrics: DiagnosticMetrics;
        aiPerformance: AIPerformanceMetrics;
        patientOutcomes: PatientOutcomeMetrics;
        usageAnalytics: UsageAnalytics;
        trendAnalysis: TrendAnalysis;
        comparisonAnalysis: ComparisonAnalysis;
        generatedAt: Date;
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    private buildDateFilter;
}
declare const _default: DiagnosticAnalyticsService;
export default _default;
//# sourceMappingURL=diagnosticAnalyticsService.d.ts.map