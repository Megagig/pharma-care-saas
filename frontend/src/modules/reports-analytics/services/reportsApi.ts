// Reports API Service - Real data fetching
import { ReportType } from '../types/reports';
import { API_CONFIG, getApiUrl } from '../../../config/api';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

interface ReportSummary {
    totalRecords: number;
    dateRange: string;
    status: 'completed' | 'pending' | 'error';
    lastUpdated: Date;
}

interface ChartData {
    id: string;
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: Array<{
        label: string;
        value: number;
        date?: string;
        category?: string;
    }>;
}

interface TableData {
    id: string;
    title: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    totalRows: number;
    currentPage: number;
    pageSize: number;
}

export interface ReportData {
    id: string;
    type: ReportType;
    title: string;
    generatedAt: Date;
    summary: ReportSummary;
    charts: ChartData[];
    tables: TableData[];
    metadata: {
        filters: any;
        exportFormats: string[];
        permissions: string[];
    };
}

// API helper function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            data: null as T,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Report-specific API functions
export const reportsApi = {
    // Generate a new report
    async generateReport(reportType: ReportType, filters?: any): Promise<ApiResponse<ReportData>> {
        return apiRequest<ReportData>('/reports/generate', {
            method: 'POST',
            body: JSON.stringify({
                type: reportType,
                filters: filters || {
                    dateRange: {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        endDate: new Date(),
                        preset: '30d',
                    },
                },
            }),
        });
    },

    // Get existing report data
    async getReport(reportId: string): Promise<ApiResponse<ReportData>> {
        return apiRequest<ReportData>(`/reports/${reportId}`);
    },

    // Get report summary/stats
    async getReportSummary(reportType: ReportType): Promise<ApiResponse<ReportSummary>> {
        return apiRequest<ReportSummary>(`/reports/summary/${reportType}`);
    },

    // Get dashboard statistics
    async getDashboardStats(): Promise<ApiResponse<{
        totalReports: number;
        recentReports: number;
        activeReports: number;
        categories: number;
    }>> {
        return apiRequest('/reports/dashboard-stats');
    },

    // Get patient outcomes data
    async getPatientOutcomes(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        outcomesTrend: ChartData;
        outcomesByCategory: ChartData;
        detailedResults: TableData;
    }>> {
        return apiRequest('/reports/patient-outcomes', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Get pharmacist interventions data
    async getPharmacistInterventions(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        interventionsTrend: ChartData;
        interventionsByType: ChartData;
        detailedResults: TableData;
    }>> {
        return apiRequest('/reports/pharmacist-interventions', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Get therapy effectiveness data
    async getTherapyEffectiveness(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        effectivenessTrend: ChartData;
        adherenceRates: ChartData;
        detailedResults: TableData;
    }>> {
        return apiRequest('/reports/therapy-effectiveness', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Get quality improvement data
    async getQualityImprovement(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        qualityMetrics: ChartData;
        improvementTrends: ChartData;
        detailedResults: TableData;
    }>> {
        return apiRequest('/reports/quality-improvement', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Get regulatory compliance data
    async getRegulatoryCompliance(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        complianceScores: ChartData;
        auditTrail: TableData;
    }>> {
        return apiRequest('/reports/regulatory-compliance', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Get cost effectiveness data
    async getCostEffectiveness(filters?: any): Promise<ApiResponse<{
        summary: ReportSummary;
        costSavings: ChartData;
        roiAnalysis: ChartData;
        detailedResults: TableData;
    }>> {
        return apiRequest('/reports/cost-effectiveness', {
            method: 'POST',
            body: JSON.stringify({ filters }),
        });
    },

    // Export report
    async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<ApiResponse<{ downloadUrl: string }>> {
        return apiRequest(`/reports/${reportId}/export/${format}`, {
            method: 'POST',
        });
    },
};

// Fallback data for development/testing when API is not available
export const getFallbackData = (reportType: ReportType): ReportData => {
    const baseData = {
        id: `fallback-${reportType}-${Date.now()}`,
        type: reportType,
        title: getReportTitle(reportType),
        generatedAt: new Date(),
        summary: {
            totalRecords: 0,
            dateRange: 'No data available',
            status: 'error' as const,
            lastUpdated: new Date(),
        },
        charts: [],
        tables: [],
        metadata: {
            filters: {},
            exportFormats: [],
            permissions: ['view'],
        },
    };

    return baseData;
};

function getReportTitle(reportType: ReportType): string {
    const titles = {
        [ReportType.PATIENT_OUTCOMES]: 'Patient Outcomes',
        [ReportType.PHARMACIST_INTERVENTIONS]: 'Pharmacist Interventions',
        [ReportType.THERAPY_EFFECTIVENESS]: 'Therapy Effectiveness',
        [ReportType.QUALITY_IMPROVEMENT]: 'Quality Improvement',
        [ReportType.REGULATORY_COMPLIANCE]: 'Regulatory Compliance',
        [ReportType.COST_EFFECTIVENESS]: 'Cost Effectiveness',
        [ReportType.TREND_FORECASTING]: 'Trend Forecasting',
        [ReportType.OPERATIONAL_EFFICIENCY]: 'Operational Efficiency',
        [ReportType.MEDICATION_INVENTORY]: 'Medication Inventory',
        [ReportType.PATIENT_DEMOGRAPHICS]: 'Patient Demographics',
        [ReportType.ADVERSE_EVENTS]: 'Adverse Events',
        [ReportType.CUSTOM_TEMPLATES]: 'Custom Templates',
    };
    return titles[reportType] || reportType;
}