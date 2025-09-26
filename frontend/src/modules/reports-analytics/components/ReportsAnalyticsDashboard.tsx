import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Store,
  BarChart3,
  Star,
  Shield,
  DollarSign,
  Clock,
  Zap,
  Package,
  Users,
  AlertTriangle,
  Wrench,
  Search,
  X
} from 'lucide-react';

// Reports Analytics Dashboard - Safe store integration
import { FixedGrid } from '../../../components/common/FixedGrid';
import { useReportsStore, ReportType } from '../stores/reportsStore';
import { useDashboardStore } from '@/store/dashboardStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportsAnalyticsDashboardProps {
  initialReportType?: string;
  workspaceId?: string;
  userPermissions?: string[];
}

const ReportsAnalyticsDashboard: React.FC = () => {
  // Get store state directly for reactive updates
  const activeReport = useReportsStore((state: any) => state.activeReport);
  const setActiveReportStore = useReportsStore(
    (state: any) => state.setActiveReport
  );
  const addToHistory = useReportsStore((state: any) => state.addToHistory);
  const reportData = useReportsStore((state: any) => state.reportData);
  const loading = useReportsStore((state: any) => state.loading);
  const getCurrentReportData = useReportsStore(
    (state: any) => state.getCurrentReportData
  );
  const isCurrentReportLoading = useReportsStore(
    (state: any) => state.isCurrentReportLoading
  );
  const searchQuery = useDashboardStore((state: any) => state.searchQuery);
  const selectedCategory = useDashboardStore((state: any) => state.selectedCategory);
  const favoriteReports = useDashboardStore((state: any) => state.favoriteReports);
  const setSearchQueryStore = useDashboardStore(
    (state: any) => state.setSearchQuery
  );
  const setSelectedCategoryStore = useDashboardStore(
    (state: any) => state.setSelectedCategory
  );
  const toggleFavoriteStore = useDashboardStore(
    (state: any) => state.toggleFavorite
  );
  const addToRecentlyViewed = useDashboardStore(
    (state: any) => state.addToRecentlyViewed
  );
  const recentlyViewed = useDashboardStore((state: any) => state.recentlyViewed);

  // Get store instances for fallback
  const reportsStore = useReportsStore();
  const dashboardStore = useDashboardStore();

  // Create icon elements once to prevent recreation
  const icons = useMemo(
    () => ({
      trendingUp: <TrendingUp />,
      localPharmacy: <Store />,
      analytics: <BarChart3 />,
      star: <Star />,
      security: <Shield />,
      attachMoney: <DollarSign />,
      timeline: <Clock />,
      speed: <Zap />,
      inventory: <Package />,
      people: <Users />,
      warning: <AlertTriangle />,
      build: <Wrench />,
    }
    ),
    []
  );

  // Report configuration with categories, icons, and metadata
  const reportConfig = useMemo(() => {
    const config = {
      [ReportType.PATIENT_OUTCOMES]: {
        label: 'Patient Outcomes',
        description:
          'Analyze patient therapy outcomes, clinical improvements, and quality of life metrics.',
        icon: icons.trendingUp,
        category: 'Clinical',
        priority: 1,
        tags: ['outcomes', 'clinical', 'therapy'],
        color: '#4caf50',
      },
      [ReportType.PHARMACIST_INTERVENTIONS]: {
        label: 'Pharmacist Interventions',
        description:
          'Track pharmacist interventions, acceptance rates, and clinical impact.',
        icon: icons.localPharmacy,
        category: 'Clinical',
        priority: 2,
        tags: ['interventions', 'pharmacist', 'clinical'],
        color: '#2196f3',
      },
      [ReportType.THERAPY_EFFECTIVENESS]: {
        label: 'Therapy Effectiveness',
        description:
          'Evaluate medication adherence, therapy completion rates, and effectiveness.',
        icon: icons.analytics,
        category: 'Clinical',
        priority: 3,
        tags: ['therapy', 'effectiveness', 'adherence'],
        color: '#03a9f4',
      },
      [ReportType.QUALITY_IMPROVEMENT]: {
        label: 'Quality Improvement',
        description:
          'Monitor quality metrics, completion times, and process improvements.',
        icon: icons.star,
        category: 'Quality',
        priority: 4,
        tags: ['quality', 'improvement', 'metrics'],
        color: '#ff9800',
      },
      [ReportType.REGULATORY_COMPLIANCE]: {
        label: 'Regulatory Compliance',
        description:
          'Ensure regulatory compliance with audit trails and documentation.',
        icon: icons.security,
        category: 'Compliance',
        priority: 5,
        tags: ['compliance', 'regulatory', 'audit'],
        color: '#f44336',
      },
      [ReportType.COST_EFFECTIVENESS]: {
        label: 'Cost Effectiveness',
        description:
          'Analyze cost savings, ROI, and financial impact of interventions.',
        icon: icons.attachMoney,
        category: 'Financial',
        priority: 6,
        tags: ['cost', 'financial', 'roi'],
        color: '#388e3c',
      },
      [ReportType.TREND_FORECASTING]: {
        label: 'Trend Forecasting',
        description:
          'Identify trends and generate forecasts for strategic planning.',
        icon: icons.timeline,
        category: 'Analytics',
        priority: 7,
        tags: ['trends', 'forecasting', 'analytics'],
        color: '#9c27b0',
      },
      [ReportType.OPERATIONAL_EFFICIENCY]: {
        label: 'Operational Efficiency',
        description:
          'Optimize workflows, resource utilization, and operational performance.',
        icon: icons.speed,
        category: 'Operations',
        priority: 8,
        tags: ['operations', 'efficiency', 'workflow'],
        color: '#0288d1',
      },
      [ReportType.MEDICATION_INVENTORY]: {
        label: 'Medication Inventory',
        description:
          'Manage inventory, track usage patterns, and forecast demand.',
        icon: icons.inventory,
        category: 'Operations',
        priority: 9,
        tags: ['inventory', 'medication', 'demand'],
        color: '#1565c0',
      },
      [ReportType.PATIENT_DEMOGRAPHICS]: {
        label: 'Patient Demographics',
        description:
          'Understand patient populations and service utilization patterns.',
        icon: icons.people,
        category: 'Analytics',
        priority: 10,
        tags: ['demographics', 'patients', 'population'],
        color: '#7b1fa2',
      },
      [ReportType.ADVERSE_EVENTS]: {
        label: 'Adverse Events',
        description:
          'Monitor adverse events, safety patterns, and risk assessment.',
        icon: icons.warning,
        category: 'Safety',
        priority: 11,
        tags: ['safety', 'adverse', 'events'],
        color: '#d32f2f',
      },
      [ReportType.CUSTOM_TEMPLATES]: {
        label: 'Custom Templates',
        description:
          'Create and manage custom report templates for specific needs.',
        icon: icons.build,
        category: 'Templates',
        priority: 12,
        tags: ['templates', 'custom', 'builder'],
        color: '#757575',
      },
    };
    return config;
  }, [icons]);

  // Get report categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(Object.values(reportConfig).map((r) => r.category))
    );
    return ['all', ...cats.sort()];
  }, [reportConfig]);

  // Get recent reports from store
  const recentReports = recentlyViewed.slice(0, 5);

  // Store interaction functions
  const handleReportClick = useCallback(
    (reportType: string) => {
      console.log('🎯 Report clicked:', reportType);
      try {
        const reportTypeEnum = reportType as ReportType;
        // Update stores directly using the store functions
        setActiveReportStore(reportTypeEnum);
        console.log('✅ Active report set to:', reportTypeEnum);
        // Add to recent reports
        const filters = {
          dateRange: {
            startDate: new Date(),
            endDate: new Date(),
            preset: '30d' as const,
          },
        };
        addToHistory(reportTypeEnum, filters);
        console.log('✅ Added to reports history');
        // Add to dashboard recents
        addToRecentlyViewed(reportTypeEnum, filters);
        console.log('✅ Added to dashboard recents');
        console.log('🎉 Report activation completed successfully');
      } catch (error) {
        console.error('❌ Error handling report click:', error);
      }
    },
    [setActiveReportStore, addToHistory, addToRecentlyViewed]
  );

  const handleFavoriteToggle = useCallback(
    (reportType: string) => {
      console.log('⭐ Favorite toggle clicked:', reportType);
      try {
        const reportTypeEnum = reportType as ReportType;
        // Update store directly
        toggleFavoriteStore(reportTypeEnum);
        console.log('✅ Store favorite toggled');
        console.log('🎉 Favorite toggle completed successfully');
      } catch (error) {
        console.error('❌ Error toggling favorite:', error);
      }
    },
    [toggleFavoriteStore]
  );

  const isFavoriteReport = (reportType: string) =>
    favoriteReports.includes(reportType as ReportType);

  // Handle report generation
  const handleGenerateReport = useCallback(
    (reportType: ReportType) => {
      console.log('🚀 Generate report clicked for:', reportType);
      // Set loading state for the report
      if (reportsStore?.setLoading) {
        reportsStore.setLoading(reportType, true);
      }
      // Generate mock report data
      setTimeout(() => {
        const mockReportData = {
          id: `report-${reportType}-${Date.now()}`,
          type: reportType,
          title: reportConfig[reportType]?.label || reportType,
          generatedAt: new Date(),
          data: {
            summary: {
              totalRecords: Math.floor(Math.random() * 1000) + 100,
              dateRange: '30 days',
              status: 'completed',
            },
            charts: [
              {
                id: 'chart-1',
                type: 'line',
                title: 'Trend Analysis',
                data: Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                  value: Math.floor(Math.random() * 100) + 50,
                }
                )),
              },
              {
                id: 'chart-2',
                type: 'bar',
                title: 'Category Breakdown',
                data: [
                  {
                    category: 'Category A',
                    value: Math.floor(Math.random() * 50) + 20,
                  },
                  {
                    category: 'Category B',
                    value: Math.floor(Math.random() * 50) + 20,
                  },
                  {
                    category: 'Category C',
                    value: Math.floor(Math.random() * 50) + 20,
                  },
                  {
                    category: 'Category D',
                    value: Math.floor(Math.random() * 50) + 20,
                  },
                ],
              },
            ],
            tables: [
              {
                id: 'table-1',
                title: 'Detailed Results',
                headers: ['ID', 'Name', 'Value', 'Status', 'Date'],
                rows: Array.from({ length: 10 }, (_, i) => [
                  `${i + 1}`,
                  `Item ${i + 1}`,
                  `${Math.floor(Math.random() * 100)}%`,
                  Math.random() > 0.5 ? 'Active' : 'Inactive',
                  new Date(
                    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString(),
                ]),
              },
            ],
          },
          metadata: {
            filters: {
              dateRange: {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                preset: '30d' as const,
              },
            },
            exportFormats: ['pdf', 'excel', 'csv'],
            permissions: ['view', 'export'],
          },
        };
        // Store the generated report data
        if (reportsStore?.setReportData) {
          reportsStore.setReportData(reportType, mockReportData);
        }
        console.log('✅ Report generated successfully:', mockReportData);
      }, 1000);
    },
    [reportConfig, reportsStore]
  );

  // Filter reports based on search and category
  const filteredReports = useMemo(() => {
    let reports = Object.entries(reportConfig);
    // Filter by category
    if (selectedCategory !== 'all') {
      reports = reports.filter(
        ([, config]) => config.category === selectedCategory
      );
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      reports = reports.filter(
        ([, config]) =>
          config.label.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query) ||
          config.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    // Sort by priority
    return reports.sort(([, a], [, b]) => a.priority - b.priority);
  }, [reportConfig, selectedCategory, searchQuery]);

  // Handle search with store sync
  const handleSearchChange = useCallback(
    (value: string) => {
      console.log('🔍 Search query changed:', value);
      // Update store directly
      setSearchQueryStore(value);
      console.log('✅ Store search query updated');
    },
    [setSearchQueryStore]
  );

  // Handle category change with store sync
  const handleCategoryChange = useCallback(
    (category: string) => {
      console.log('📂 Category changed:', category);
      // Update store directly
      setSelectedCategoryStore(category);
      console.log('✅ Store category updated');
    },
    [setSelectedCategoryStore]
  );

  // Render main dashboard
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate comprehensive reports and gain actionable insights into your
          pharmacy operations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
            {Object.keys(reportConfig).length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Report Types
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-green-600 dark:text-green-400 text-2xl font-bold">
            {categories.length - 1}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Categories
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
            {recentReports.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Recent Reports
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-amber-600 dark:text-amber-400 text-2xl font-bold">
            Live
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Real-time Data
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleCategoryChange(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No reports found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search terms or category filter.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(([reportType, config]) => (
            <div
              key={reportType}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-all duration-200 hover:shadow-lg hover:translate-y-1 ${activeReport === reportType ? 'ring-2 ring-blue-500' : ''
                }`}
              style={{
                backgroundColor:
                  activeReport === reportType
                    ? `${config.color}08`
                    : '',
              }}
              onClick={() => handleReportClick(reportType)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-blue-600 dark:text-blue-400">
                    {config.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {config.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {config.label}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {config.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {config.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-5 flex justify-between items-center">
                <Button size="sm" variant="outline">
                  View Report
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteToggle(reportType);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${isFavoriteReport(reportType) ? "text-yellow-500 fill-yellow-500" : ""}`}
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Report Display */}
      {activeReport && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {reportConfig[activeReport]?.label || activeReport}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {reportConfig[activeReport]?.description}
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                onClick={() => handleGenerateReport(activeReport)}
                disabled={isCurrentReportLoading()}
              >
                {isCurrentReportLoading() ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveReportStore(null)}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isCurrentReportLoading() && (
            <div className="text-center py-8">
              <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                Generating Report...
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Please wait while we compile your data
              </div>
            </div>
          )}

          {/* Report Data Display */}
          {getCurrentReportData() && !isCurrentReportLoading() && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Summary
              </h3>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getCurrentReportData()?.data?.summary?.totalRecords || 0}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Total Records</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getCurrentReportData()?.data?.summary?.dateRange ||
                      'N/A'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Date Range</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getCurrentReportData()?.data?.summary?.status || 'N/A'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Status</div>
                </div>
              </div>

              {/* Charts Section */}
              {getCurrentReportData()?.data?.charts && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Data Visualization
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getCurrentReportData()?.data?.charts?.map(
                      (chart: any) => (
                        <div key={chart.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {chart.title}
                          </h4>
                          <div className="text-gray-600 dark:text-gray-400">
                            {chart.type === 'line' ? '📈' : '📊'}{' '}
                            {chart.title} Chart
                            <br />({chart.data?.length || 0} data points)
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Data Table */}
              {getCurrentReportData()?.data?.tables?.[0] && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {getCurrentReportData()?.data?.tables?.[0]?.title ||
                      'Data Table'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          {getCurrentReportData()?.data?.tables?.[0]?.headers?.map(
                            (header: string, index: number) => (
                              <th
                                key={index}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {getCurrentReportData()?.data?.tables?.[0]?.rows?.map(
                          (row: string[], rowIndex: number) => (
                            <tr key={rowIndex}>
                              {row.map((cell: string, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Export Options
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getCurrentReportData()?.metadata?.exportFormats?.map(
                    (format: string) => (
                      <Button
                        key={format}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log(`Exporting report as ${format}`);
                          // Here you would implement actual export functionality
                        }}
                      >
                        Export as {format.toUpperCase()}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!getCurrentReportData() && !isCurrentReportLoading() && (
            <div className="text-center py-8">
              <div className="text-gray-600 dark:text-gray-400 mb-2">
                No Report Data Available
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Click "Generate Report" to create a new report with current data
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalyticsDashboard;
