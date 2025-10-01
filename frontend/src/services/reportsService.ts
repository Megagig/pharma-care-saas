import { apiHelpers } from './api';

export interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
    preset?: '7d' | '30d' | '90d' | '1y';
  };
  patientId?: string;
  pharmacistId?: string;
  therapyType?: string;
  priority?: string;
  location?: string;
  status?: string;
}

export interface ReportData {
  summary: {
    totalRecords: number;
    primaryMetric: {
      label: string;
      value: number | string;
      unit?: string;
      trend?: 'up' | 'down' | 'stable';
      changePercent?: number;
    };
    secondaryMetrics: Array<{
      label: string;
      value: number | string;
      unit?: string;
      icon?: string;
      color?: string;
    }>;
  };
  charts: Array<{
    id: string;
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: any[];
  }>;
  tables: Array<{
    id: string;
    title: string;
    headers: string[];
    rows: string[][];
  }>;
  metadata: {
    id: string;
    title: string;
    description: string;
    category: string;
    generatedAt: Date;
    generatedBy: string;
    workspaceId: string;
    filters: ReportFilters;
    dataPoints: number;
    version: string;
  };
}

export interface ReportSummary {
  totalReviews: number;
  completedReviews: number;
  completionRate: number;
  totalInterventions: number;
  interventionAcceptanceRate: number;
  totalProblems: number;
  problemResolutionRate: number;
  totalCostSavings: number;
  avgCompletionTime: number;
  formattedCostSavings: string;
}

class ReportsService {
  /**
   * Get available report types
   */
  async getAvailableReports() {
    try {
      const response = await apiHelpers.get('/reports/types');
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching available reports:', error);
      throw error;
    }
  }

  /**
   * Get report summary statistics
   */
  async getReportSummary(period: string = '30d'): Promise<ReportSummary> {
    try {
      const response = await apiHelpers.get(`/reports/summary?period=${period}`);
      return response.data.data?.summary || {};
    } catch (error) {
      console.error('Error fetching report summary:', error);
      throw error;
    }
  }

  /**
   * Generate specific report data
   */
  async generateReport(reportType: string, filters: ReportFilters = {}): Promise<ReportData> {
    try {
      console.log(`🚀 Generating report: ${reportType}`, filters);
      
      const params = new URLSearchParams();
      
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.startDate.toISOString());
        params.append('endDate', filters.dateRange.endDate.toISOString());
      }
      
      if (filters.patientId) params.append('patientId', filters.patientId);
      if (filters.pharmacistId) params.append('pharmacistId', filters.pharmacistId);
      if (filters.therapyType) params.append('therapyType', filters.therapyType);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.location) params.append('location', filters.location);
      if (filters.status) params.append('status', filters.status);

      const queryString = params.toString();
      const url = `/reports/${reportType}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`📡 Making API call to: ${url}`);
      
      const response = await apiHelpers.get(url);
      
      console.log('📊 API Response:', response.data);
      
      // Transform backend response to match frontend ReportData interface
      const transformedData = this.transformBackendResponse(response.data.data || {}, reportType, filters);
      
      console.log('✅ Transformed data:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error(`❌ Error generating ${reportType} report:`, error);
      
      // If it's a network error, provide more details
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // For development/testing, provide fallback data so we can see the UI working
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Providing fallback data for development');
        return this.createFallbackData(reportType, filters);
      }
      
      throw error;
    }
  }

  /**
   * Queue report export job
   */
  async exportReport(reportType: string, format: 'pdf' | 'excel' | 'csv', filters: ReportFilters = {}) {
    try {
      const response = await apiHelpers.post('/reports/export', {
        reportType,
        format,
        filters,
        fileName: `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`
      });
      return response.data.data || {};
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string) {
    try {
      const response = await apiHelpers.get(`/reports/export/${jobId}/status`);
      return response.data.data || {};
    } catch (error) {
      console.error('Error getting export status:', error);
      throw error;
    }
  }

  /**
   * Transform backend response to frontend format
   */
  private transformBackendResponse(backendData: any, reportType: string, filters: ReportFilters): ReportData {
    // Transform the backend response to match the frontend ReportData interface
    const transformedData: ReportData = {
      summary: {
        totalRecords: this.extractTotalRecords(backendData),
        primaryMetric: {
          label: 'Total Records',
          value: this.extractTotalRecords(backendData),
          unit: 'records',
          trend: 'stable'
        },
        secondaryMetrics: this.extractSecondaryMetrics(backendData, reportType)
      },
      charts: this.transformChartsData(backendData, reportType),
      tables: this.transformTablesData(backendData, reportType),
      metadata: {
        id: `report-${reportType}-${Date.now()}`,
        title: this.getReportTitle(reportType),
        description: `Generated ${reportType} report`,
        category: this.getReportCategory(reportType),
        generatedAt: new Date(),
        generatedBy: 'System',
        workspaceId: 'current-workspace',
        filters,
        dataPoints: this.extractTotalRecords(backendData),
        version: '1.0'
      }
    };

    return transformedData;
  }

  private getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      'patient-outcomes': 'Patient Outcomes Report',
      'pharmacist-interventions': 'Pharmacist Interventions Report',
      'therapy-effectiveness': 'Therapy Effectiveness Report',
      'quality-improvement': 'Quality Improvement Report',
      'regulatory-compliance': 'Regulatory Compliance Report',
      'cost-effectiveness': 'Cost Effectiveness Report',
      'trend-forecasting': 'Trend Forecasting Report',
      'operational-efficiency': 'Operational Efficiency Report',
      'medication-inventory': 'Medication Inventory Report',
      'patient-demographics': 'Patient Demographics Report',
      'adverse-events': 'Adverse Events Report'
    };
    return titles[reportType] || reportType;
  }

  private getReportCategory(reportType: string): string {
    const categories: Record<string, string> = {
      'patient-outcomes': 'Clinical',
      'pharmacist-interventions': 'Clinical',
      'therapy-effectiveness': 'Clinical',
      'quality-improvement': 'Quality',
      'regulatory-compliance': 'Compliance',
      'cost-effectiveness': 'Financial',
      'trend-forecasting': 'Analytics',
      'operational-efficiency': 'Operations',
      'medication-inventory': 'Operations',
      'patient-demographics': 'Analytics',
      'adverse-events': 'Safety'
    };
    return categories[reportType] || 'General';
  }

  private extractSecondaryMetrics(backendData: any, reportType: string): Array<any> {
    const metrics = [];

    switch (reportType) {
      case 'patient-outcomes':
        if (backendData.therapyEffectiveness?.length) {
          const completionRate = backendData.therapyEffectiveness.reduce((sum: number, item: any) => {
            return sum + (item.totalReviews > 0 ? (item.completedReviews / item.totalReviews) * 100 : 0);
          }, 0) / backendData.therapyEffectiveness.length;
          
          metrics.push({
            label: 'Completion Rate',
            value: `${Math.round(completionRate)}%`,
            icon: 'CheckCircle',
            color: 'success'
          });
        }
        break;

      case 'pharmacist-interventions':
        if (backendData.interventionMetrics?.length) {
          const totalAccepted = backendData.interventionMetrics.reduce((sum: number, item: any) => sum + (item.acceptedInterventions || 0), 0);
          const totalInterventions = backendData.interventionMetrics.reduce((sum: number, item: any) => sum + (item.totalInterventions || 0), 0);
          const acceptanceRate = totalInterventions > 0 ? (totalAccepted / totalInterventions) * 100 : 0;
          
          metrics.push({
            label: 'Acceptance Rate',
            value: `${Math.round(acceptanceRate)}%`,
            icon: 'ThumbsUp',
            color: 'primary'
          });
        }
        break;

      default:
        metrics.push({
          label: 'Status',
          value: 'Active',
          icon: 'Activity',
          color: 'info'
        });
    }

    return metrics;
  }

  private extractTotalRecords(backendData: any): number {
    console.log('🔍 Extracting total records from:', backendData);
    
    // Extract total records from various possible backend response structures
    if (backendData.therapyEffectiveness?.length) {
      return backendData.therapyEffectiveness.reduce((sum: number, item: any) => sum + (item.totalReviews || 0), 0);
    }
    if (backendData.interventionMetrics?.length) {
      return backendData.interventionMetrics.reduce((sum: number, item: any) => sum + (item.totalInterventions || 0), 0);
    }
    if (backendData.adherenceMetrics?.length) {
      return backendData.adherenceMetrics.reduce((sum: number, item: any) => sum + (item.totalReviews || 0), 0);
    }
    
    // If no data found, return a placeholder value to show the report is working
    console.log('⚠️ No data found in backend response, using placeholder');
    return 0;
  }

  private formatDateRange(dateRange?: { startDate: Date; endDate: Date }): string {
    if (!dateRange) return '30 days';
    
    const diffTime = Math.abs(dateRange.endDate.getTime() - dateRange.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days`;
  }

  private transformChartsData(backendData: any, reportType: string): Array<any> {
    const charts = [];

    // Transform based on report type and available data
    switch (reportType) {
      case 'patient-outcomes':
        if (backendData.therapyEffectiveness) {
          charts.push({
            id: 'therapy-effectiveness-chart',
            type: 'bar',
            title: 'Therapy Effectiveness by Type',
            data: backendData.therapyEffectiveness.map((item: any) => ({
              category: item._id || 'Unknown',
              value: item.completedReviews || 0,
              total: item.totalReviews || 0
            }))
          });
        }
        break;

      case 'pharmacist-interventions':
        if (backendData.interventionMetrics) {
          charts.push({
            id: 'intervention-metrics-chart',
            type: 'pie',
            title: 'Interventions by Type',
            data: backendData.interventionMetrics.map((item: any) => ({
              category: item._id || 'Unknown',
              value: item.totalInterventions || 0
            }))
          });
        }
        break;

      case 'therapy-effectiveness':
        if (backendData.adherenceMetrics) {
          charts.push({
            id: 'adherence-chart',
            type: 'line',
            title: 'Adherence Improvement Trends',
            data: backendData.adherenceMetrics.map((item: any) => ({
              category: item._id || 'Unknown',
              value: item.avgAdherenceScore || 0
            }))
          });
        }
        break;

      default:
        // Generic chart for other report types
        charts.push({
          id: 'generic-chart',
          type: 'bar',
          title: 'Data Overview',
          data: [
            { category: 'Sample Data', value: 1 }
          ]
        });
    }

    // If no charts were created, add a placeholder
    if (charts.length === 0) {
      charts.push({
        id: 'placeholder-chart',
        type: 'bar',
        title: 'Report Data',
        data: [
          { category: 'No Data Available', value: 0 }
        ]
      });
    }

    return charts;
  }

  private transformTablesData(backendData: any, reportType: string): Array<any> {
    const tables = [];

    // Transform based on report type and available data
    switch (reportType) {
      case 'patient-outcomes':
        if (backendData.therapyEffectiveness) {
          tables.push({
            id: 'therapy-effectiveness-table',
            title: 'Therapy Effectiveness Details',
            headers: ['Review Type', 'Total Reviews', 'Completed', 'Completion Rate', 'Cost Savings'],
            rows: backendData.therapyEffectiveness.map((item: any) => [
              item._id || 'Unknown',
              (item.totalReviews || 0).toString(),
              (item.completedReviews || 0).toString(),
              item.totalReviews > 0 ? `${Math.round((item.completedReviews / item.totalReviews) * 100)}%` : '0%',
              `₦${(item.totalCostSavings || 0).toLocaleString()}`
            ])
          });
        }
        break;

      case 'pharmacist-interventions':
        if (backendData.interventionMetrics) {
          tables.push({
            id: 'intervention-metrics-table',
            title: 'Intervention Metrics',
            headers: ['Intervention Type', 'Total', 'Accepted', 'Acceptance Rate'],
            rows: backendData.interventionMetrics.map((item: any) => [
              item._id || 'Unknown',
              (item.totalInterventions || 0).toString(),
              (item.acceptedInterventions || 0).toString(),
              item.totalInterventions > 0 ? `${Math.round((item.acceptedInterventions / item.totalInterventions) * 100)}%` : '0%'
            ])
          });
        }
        break;

      default:
        // Generic table for other report types
        const entries = Object.entries(backendData).slice(0, 10);
        if (entries.length > 0) {
          tables.push({
            id: 'generic-table',
            title: 'Report Data',
            headers: ['Item', 'Value'],
            rows: entries.map(([key, value]) => [
              key,
              typeof value === 'object' ? JSON.stringify(value) : String(value)
            ])
          });
        }
    }

    // If no tables were created, add a placeholder
    if (tables.length === 0) {
      tables.push({
        id: 'placeholder-table',
        title: 'Report Summary',
        headers: ['Status', 'Message'],
        rows: [
          ['Data Status', 'No data available for the selected criteria'],
          ['Suggestion', 'Try adjusting the date range or filters'],
          ['Report Type', reportType]
        ]
      });
    }

    return tables;
  }

  /**
   * Create fallback data for development/testing when API is not available
   */
  private createFallbackData(reportType: string, filters: ReportFilters): ReportData {
    console.log('🔧 Creating fallback data for:', reportType);
    
    return {
      summary: {
        totalRecords: 25,
        primaryMetric: {
          label: 'Total Records',
          value: 25,
          unit: 'records',
          trend: 'stable'
        },
        secondaryMetrics: [
          {
            label: 'Success Rate',
            value: '85%',
            icon: 'CheckCircle',
            color: 'success'
          },
          {
            label: 'Status',
            value: 'Demo Mode',
            icon: 'Info',
            color: 'info'
          }
        ]
      },
      charts: [
        {
          id: 'demo-chart-1',
          type: 'bar',
          title: 'Sample Data Overview',
          data: [
            { category: 'Category A', value: 15 },
            { category: 'Category B', value: 8 },
            { category: 'Category C', value: 2 }
          ]
        },
        {
          id: 'demo-chart-2',
          type: 'line',
          title: 'Trend Analysis',
          data: [
            { category: 'Week 1', value: 10 },
            { category: 'Week 2', value: 15 },
            { category: 'Week 3', value: 12 },
            { category: 'Week 4', value: 18 }
          ]
        }
      ],
      tables: [
        {
          id: 'demo-table',
          title: 'Sample Report Data',
          headers: ['Item', 'Value', 'Status', 'Date'],
          rows: [
            ['Demo Item 1', '85%', 'Active', '2024-10-01'],
            ['Demo Item 2', '92%', 'Active', '2024-10-01'],
            ['Demo Item 3', '78%', 'Pending', '2024-10-01'],
            ['Demo Item 4', '95%', 'Complete', '2024-10-01'],
            ['Demo Item 5', '88%', 'Active', '2024-10-01']
          ]
        }
      ],
      metadata: {
        id: `demo-report-${reportType}-${Date.now()}`,
        title: `${this.getReportTitle(reportType)} (Demo)`,
        description: 'This is demo data shown when the API is not available',
        category: this.getReportCategory(reportType),
        generatedAt: new Date(),
        generatedBy: 'Demo System',
        workspaceId: 'demo-workspace',
        filters: filters || {},
        dataPoints: 25,
        version: '1.0-demo'
      }
    };
  }
}

export const reportsService = new ReportsService();
export default reportsService;