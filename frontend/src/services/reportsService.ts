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
      console.log(`🔗 Full URL: ${import.meta.env.VITE_API_BASE_URL || 'https://pharmacare-nttq.onrender.com/api'}${url}`);
      
      // Add timeout and better error handling
      console.log('🔐 Making authenticated API request...');
      const response = await Promise.race([
        apiHelpers.get(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 2 minutes')), 120000)
        )
      ]) as any;
      
      console.log('📊 API Response status:', response.status);
      console.log('📊 API Response data:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      // Transform backend response to match frontend ReportData interface
      const transformedData = this.transformBackendResponse(response.data.data || response.data, reportType, filters);
      
      console.log('✅ Transformed data:', transformedData);
      
      return transformedData;
    } catch (error: any) {
      console.error(`❌ Error generating ${reportType} report:`, error);
      
      // Provide detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
        
        // Create a more specific error message
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (statusCode === 403) {
          throw new Error('Access denied. You do not have permission to view this report.');
        } else if (statusCode === 404) {
          throw new Error(`Report type "${reportType}" not found or not implemented.`);
        } else if (statusCode === 500) {
          throw new Error(`Server error: ${errorData?.message || 'Internal server error'}`);
        } else {
          throw new Error(`API Error ${statusCode}: ${errorData?.message || error.response.statusText}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error.message === 'Request timeout after 2 minutes') {
        throw new Error('Request timeout: The server is taking too long to respond. Please try again.');
      } else {
        console.error('Error setting up request:', error.message);
        throw new Error(`Request error: ${error.message}`);
      }
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


}

export const reportsService = new ReportsService();
export default reportsService;