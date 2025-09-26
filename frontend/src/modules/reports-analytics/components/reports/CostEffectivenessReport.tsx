// Cost-Effectiveness Analysis Report Component
import ChartComponent from '../shared/ChartComponent';

import { Card, CardContent, Progress, Alert, Tabs } from '@/components/ui/button';

interface CostEffectivenessReportProps {
  filters: CostEffectivenessFilters;
  onFilterChange?: (filters: CostEffectivenessFilters) => void;
}
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <div className="">{children}</div>}
  </div>
);
// Nigerian Naira formatter
const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, }.format(amount);
};
const CostEffectivenessReport: React.FC<CostEffectivenessReportProps> = ({ 
  filters,
  onFilterChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mock data - in real implementation, this would come from API
  const mockData = useMemo(
    () => ({ 
      // KPI Cards Data
      kpiData: [
        {
          title: 'Total Cost Savings',
          value: '₦45.2M',
          unit: '',
          trend: {
            direction: 'up' as const,
            value: 23.8,
            period: 'vs last year'}
          },
          status: 'success' as const,
          sparkline: [
            { name: 'Q1', value: 38.5 },
            { name: 'Q2', value: 41.2 },
            { name: 'Q3', value: 43.8 },
            { name: 'Q4', value: 45.2 },
          ],
        },
        {
          title: 'Return on Investment',
          value: 340,
          unit: '%',
          trend: {
            direction: 'up' as const,
            value: 45.2,
            period: 'vs last year',
          },
          status: 'success' as const,
          target: { value: 250, label: 'Target ROI' },
        },
        {
          title: 'Cost per Patient',
          value: '₦12,450',
          unit: '',
          trend: {
            direction: 'down' as const,
            value: 18.3,
            period: 'reduction',
          },
          status: 'success' as const,
        },
        {
          title: 'Revenue Impact',
          value: '₦78.9M',
          unit: '',
          trend: {
            direction: 'up' as const,
            value: 31.7,
            period: 'vs last year',
          },
          status: 'info' as const,
        },
      ],
      // Cost Savings Waterfall Chart Data
      costSavingsData: {
        id: 'cost-savings-waterfall',
        title: 'Cost Savings Breakdown (Waterfall Analysis)',
        subtitle: 'Cumulative cost savings by intervention type',
        type: 'bar' as const,
        data: [
          {
            category: 'Baseline Cost',
            value: 0,
            cumulative: 120000000,
            type: 'baseline',
          },
          {
            category: 'Medication Optimization',
            value: -15200000,
            cumulative: 104800000,
            type: 'saving',
          },
          {
            category: 'Reduced Hospitalizations',
            value: -18500000,
            cumulative: 86300000,
            type: 'saving',
          },
          {
            category: 'Prevented Complications',
            value: -8900000,
            cumulative: 77400000,
            type: 'saving',
          },
          {
            category: 'Improved Adherence',
            value: -6200000,
            cumulative: 71200000,
            type: 'saving',
          },
          {
            category: 'Early Interventions',
            value: -4100000,
            cumulative: 67100000,
            type: 'saving',
          },
          {
            category: 'Program Costs',
            value: 12300000,
            cumulative: 79400000,
            type: 'cost',
          },
          {
            category: 'Net Savings',
            value: 0,
            cumulative: 40600000,
            type: 'total',
          },
        ],
        config: {
          title: {
            text: 'Cost Savings Breakdown (Waterfall Analysis)',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'category',
              type: 'category' as const,
              grid: false,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 10,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
            y: {
              label: 'value',
              type: 'number' as const,
              grid: true,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
          },
          series: [
            {
              name: 'Cost Impact',
              type: 'bar' as const,
              dataKey: 'value',
              style: { color: '#10b981' },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
          ],
          legend: {
            enabled: false,
            position: 'top' as const,
            alignment: 'center' as const,
            style: { fontSize: 12, fontWeight: 'normal', color: '#374151' },
          },
          tooltip: {
            enabled: true,
            shared: false,
            style: {
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: 12,
              color: '#374151',
              padding: 12,
            },
          },
          annotations: [],
          interactions: {
            hover: true,
            click: true,
            zoom: false,
            pan: false,
            brush: false,
            crossfilter: false,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: ['#10b981', '#ef4444', '#3b82f6'],
            gradients: [],
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: { small: 11, medium: 13, large: 16, xlarge: 20 },
              fontWeight: { light: 300, normal: 400, medium: 500, bold: 600 },
            },
            spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
            borderRadius: 8,
            shadows: {
              small: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            mode: 'light' as const,
          },
          animations: {
            duration: 600,
            easing: 'ease-out' as const,
            stagger: true,
            entrance: 'slide' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // Revenue Impact Trends
      revenueImpactData: {
        id: 'revenue-impact',
        title: 'Revenue Impact Trends',
        subtitle: 'Monthly revenue growth from pharmaceutical interventions',
        type: 'line' as const,
        data: [
          {
            month: 'Jan',
            revenue: 58200000,
            costs: 12400000,
            netImpact: 45800000,
          },
          {
            month: 'Feb',
            revenue: 61500000,
            costs: 13100000,
            netImpact: 48400000,
          },
          {
            month: 'Mar',
            revenue: 64800000,
            costs: 13800000,
            netImpact: 51000000,
          },
          {
            month: 'Apr',
            revenue: 68100000,
            costs: 14500000,
            netImpact: 53600000,
          },
          {
            month: 'May',
            revenue: 71400000,
            costs: 15200000,
            netImpact: 56200000,
          },
          {
            month: 'Jun',
            revenue: 74700000,
            costs: 15900000,
            netImpact: 58800000,
          },
        ],
        config: {
          title: {
            text: 'Revenue Impact Trends',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'month',
              type: 'category' as const,
              grid: true,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
            y: {
              label: 'amount',
              type: 'number' as const,
              grid: true,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
          },
          series: [
            {
              name: 'Revenue',
              type: 'line' as const,
              dataKey: 'revenue',
              style: { color: '#10b981', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 0,
                easing: 'ease-in-out' as const,
              },
            },
            {
              name: 'Costs',
              type: 'line' as const,
              dataKey: 'costs',
              style: { color: '#ef4444', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 100,
                easing: 'ease-in-out' as const,
              },
            },
            {
              name: 'Net Impact',
              type: 'line' as const,
              dataKey: 'netImpact',
              style: { color: '#3b82f6', strokeWidth: 4 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 200,
                easing: 'ease-in-out' as const,
              },
            },
          ],
          legend: {
            enabled: true,
            position: 'top' as const,
            alignment: 'center' as const,
            style: { fontSize: 12, fontWeight: 'normal', color: '#374151' },
          },
          tooltip: {
            enabled: true,
            shared: true,
            style: {
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: 12,
              color: '#374151',
              padding: 12,
            },
          },
          annotations: [],
          interactions: {
            hover: true,
            click: true,
            zoom: true,
            pan: true,
            brush: false,
            crossfilter: false,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: ['#10b981', '#ef4444', '#3b82f6'],
            gradients: [],
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: { small: 11, medium: 13, large: 16, xlarge: 20 },
              fontWeight: { light: 300, normal: 400, medium: 500, bold: 600 },
            },
            spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
            borderRadius: 8,
            shadows: {
              small: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            mode: 'light' as const,
          },
          animations: {
            duration: 300,
            easing: 'ease-in-out' as const,
            stagger: true,
            entrance: 'fade' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // Budget Planning Insights
      budgetPlanningData: {
        id: 'budget-planning',
        title: 'Budget Planning & Forecasting',
        subtitle: 'Projected costs and savings for next fiscal year',
        type: 'area' as const,
        data: [
          {
            quarter: 'Q1 2024',
            projected: 78500000,
            actual: 76200000,
            variance: -2300000,
          },
          {
            quarter: 'Q2 2024',
            projected: 82100000,
            actual: 79800000,
            variance: -2300000,
          },
          {
            quarter: 'Q3 2024',
            projected: 85700000,
            actual: 83400000,
            variance: -2300000,
          },
          {
            quarter: 'Q4 2024',
            projected: 89300000,
            actual: 87000000,
            variance: -2300000,
          },
          {
            quarter: 'Q1 2025',
            projected: 92900000,
            actual: null,
            variance: null,
          },
          {
            quarter: 'Q2 2025',
            projected: 96500000,
            actual: null,
            variance: null,
          },
        ],
        config: {
          title: {
            text: 'Budget Planning & Forecasting',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'quarter',
              type: 'category' as const,
              grid: true,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
            y: {
              label: 'amount',
              type: 'number' as const,
              grid: true,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
          },
          series: [
            {
              name: 'Projected',
              type: 'area' as const,
              dataKey: 'projected',
              style: { color: '#3b82f6', fillOpacity: 0.3, strokeWidth: 2 },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Actual',
              type: 'area' as const,
              dataKey: 'actual',
              style: { color: '#10b981', fillOpacity: 0.2, strokeWidth: 2 },
              animations: {
                enabled: true,
                duration: 600,
                delay: 200,
                easing: 'ease-out' as const,
              },
            },
          ],
          legend: {
            enabled: true,
            position: 'top' as const,
            alignment: 'center' as const,
            style: { fontSize: 12, fontWeight: 'normal', color: '#374151' },
          },
          tooltip: {
            enabled: true,
            shared: true,
            style: {
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: 12,
              color: '#374151',
              padding: 12,
            },
          },
          annotations: [],
          interactions: {
            hover: true,
            click: true,
            zoom: true,
            pan: true,
            brush: false,
            crossfilter: false,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: ['#3b82f6', '#10b981'],
            gradients: [],
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: { small: 11, medium: 13, large: 16, xlarge: 20 },
              fontWeight: { light: 300, normal: 400, medium: 500, bold: 600 },
            },
            spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
            borderRadius: 8,
            shadows: {
              small: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            mode: 'light' as const,
          },
          animations: {
            duration: 600,
            easing: 'ease-out' as const,
            stagger: true,
            entrance: 'fade' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // Cost Breakdown by Category
      costBreakdownData: {
        id: 'cost-breakdown',
        title: 'Cost Breakdown by Category',
        subtitle: 'Distribution of costs across intervention types',
        type: 'donut' as const,
        data: [
          { name: 'Medication Costs', value: 35.2, amount: 42240000 },
          { name: 'Staff & Training', value: 22.8, amount: 27360000 },
          { name: 'Technology & Systems', value: 18.5, amount: 22200000 },
          { name: 'Patient Education', value: 12.3, amount: 14760000 },
          { name: 'Quality Assurance', value: 7.8, amount: 9360000 },
          { name: 'Administrative', value: 3.4, amount: 4080000 },
        ],
        config: {
          title: {
            text: 'Cost Breakdown by Category',
            alignment: 'center' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'name',
              type: 'category' as const,
              grid: false,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
            y: {
              label: 'value',
              type: 'number' as const,
              grid: false,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 12,
                  fontWeight: 'normal',
                  color: '#6b7280',
                },
                gridStyle: {
                  strokeDasharray: '3 3',
                  opacity: 0.5,
                  color: '#e5e7eb',
                },
              },
            },
          },
          series: [
            {
              name: 'Cost Distribution',
              type: 'pie' as const,
              dataKey: 'value',
              style: { color: '#3b82f6' },
              animations: {
                enabled: true,
                duration: 800,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
          ],
          legend: {
            enabled: true,
            position: 'right' as const,
            alignment: 'center' as const,
            style: { fontSize: 12, fontWeight: 'normal', color: '#374151' },
          },
          tooltip: {
            enabled: true,
            shared: false,
            style: {
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: 12,
              color: '#374151',
              padding: 12,
            },
          },
          annotations: [],
          interactions: {
            hover: true,
            click: true,
            zoom: false,
            pan: false,
            brush: false,
            crossfilter: false,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#06b6d4',
            ],
            gradients: [],
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: { small: 11, medium: 13, large: 16, xlarge: 20 },
              fontWeight: { light: 300, normal: 400, medium: 500, bold: 600 },
            },
            spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
            borderRadius: 8,
            shadows: {
              small: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            mode: 'light' as const,
          },
          animations: {
            duration: 800,
            easing: 'ease-out' as const,
            stagger: true,
            entrance: 'scale' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // ROI Analysis by Intervention
      roiAnalysisData: [
        {
          intervention: 'Medication Therapy Management',
          investment: 15200000,
          savings: 52800000,
          roi: 247.4,
          paybackMonths: 4.2,
        },
        {
          intervention: 'Clinical Decision Support',
          investment: 8900000,
          savings: 28400000,
          roi: 219.1,
          paybackMonths: 3.8,
        },
        {
          intervention: 'Patient Education Programs',
          investment: 6700000,
          savings: 19200000,
          roi: 186.6,
          paybackMonths: 4.9,
        },
        {
          intervention: 'Adherence Monitoring',
          investment: 4500000,
          savings: 16800000,
          roi: 273.3,
          paybackMonths: 3.2,
        },
        {
          intervention: 'Drug Utilization Review',
          investment: 3200000,
          savings: 12100000,
          roi: 278.1,
          paybackMonths: 3.1,
        },
      ], },
    []
  );
  // Simulate data loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [filters]);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  if (error) {
    return (
      <Alert severity="error" className="">
        <div  gutterBottom>
          Error Loading Cost-Effectiveness Data
        </div>
        <div >{error}</div>
      </Alert>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div
          
          component="h1"
          gutterBottom
          className=""
        >
          <AttachMoney className="" />
          Cost-Effectiveness Analysis
        </div>
        <div  color="text.secondary">
          Comprehensive financial analysis of pharmaceutical interventions, ROI
          tracking, and budget planning insights.
        </div>
      </div>
      {/* KPI Cards */}
      <div container spacing={3} className="">
        {mockData.kpiData.map((kpi, index) => (
          <div item xs={12} sm={6} md={3} key={index}>
            <ChartComponent
              data={{}
                id: `kpi-${index}`,
                title: '',
                type: 'kpi-card',
                data: [kpi],
                config: {} as any,
              height={180}
              loading={loading}
            />
          </div>
        ))}
      </div>
      {/* Tabs for different views */}
      <Card className="">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          
          scrollButtons="auto"
          className=""
        >
          <Tab icon={<Savings />} label="Cost Savings" iconPosition="start" />
          <Tab
            icon={<TrendingUp />}
            label="Revenue Impact"
            iconPosition="start"
          />
          <Tab
            icon={<AccountBalance />}
            label="Budget Planning"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="Cost Breakdown"
            iconPosition="start"
          />
          <Tab icon={<Analytics />} label="ROI Analysis" iconPosition="start" />
        </Tabs>
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.costSavingsData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Cost Savings Summary
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <Savings className="" />
                        <div >
                          {formatNaira(45200000)}
                        </div>
                        <div >Total Savings</div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <TrendingUp className="" />
                        <div >23.8%</div>
                        <div >YoY Growth</div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <Assessment className="" />
                        <div >340%</div>
                        <div >ROI</div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <Timeline className="" />
                        <div >3.2 months</div>
                        <div >Avg Payback</div>
                      </div>
                    </div>
                  </div>
                  <Alert severity="success" className="">
                    <div >
                      Pharmaceutical interventions have generated significant
                      cost savings, with medication optimization and reduced
                      hospitalizations being the primary drivers of financial
                      impact.
                    </div>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.revenueImpactData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Revenue Impact Analysis
                  </div>
                  <div
                    className=""
                  >
                    <Chip
                      label="Revenue Growth: 28.4%"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Cost Control: Effective"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Net Impact: Positive"
                      color="info"
                      size="small"
                    />
                    <Chip
                      label="Trend: Accelerating"
                      color="warning"
                      size="small"
                    />
                  </div>
                  <div  color="text.secondary">
                    Revenue impact shows consistent growth with effective cost
                    management. The net positive impact demonstrates the
                    financial viability of pharmaceutical intervention programs,
                    with strong momentum expected to continue.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.budgetPlanningData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Budget Planning Insights
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} md={6}>
                      <div  gutterBottom>
                        Forecast Accuracy
                      </div>
                      <div className="">
                        <div
                          className=""
                        >
                          <div >Q1 2024</div>
                          <div  fontWeight="bold">
                            97.1%
                          </div>
                        </div>
                        <Progress
                          
                          className="" />
                      </div>
                      <div className="">
                        <div
                          className=""
                        >
                          <div >Q2 2024</div>
                          <div  fontWeight="bold">
                            97.2%
                          </div>
                        </div>
                        <Progress
                          
                          className="" />
                      </div>
                    </div>
                    <div item xs={12} md={6}>
                      <div  gutterBottom>
                        Budget Variance Analysis
                      </div>
                      <div
                        
                        color="text.secondary"
                        gutterBottom
                      >
                        Average variance: {formatNaira(-2300000)} (2.9% under
                        budget)
                      </div>
                      <div
                        
                        color="text.secondary"
                        gutterBottom
                      >
                        Projected 2025 budget: {formatNaira(378800000)}
                      </div>
                      <div  color="text.secondary">
                        Expected ROI: 365% (25% increase from 2024)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <div container spacing={3}>
            <div item xs={12} md={8}>
              <ChartComponent
                data={mockData.costBreakdownData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12} md={4}>
              <Card className="">
                <CardContent>
                  <div  gutterBottom>
                    Cost Category Details
                  </div>
                  {mockData.costBreakdownData.data.map((item, index) => (
                    <div
                      key={index}
                      className=""
                    >
                      <div
                        className=""
                      >
                        <div  fontWeight="medium">
                          {item.name}
                        </div>
                        <Chip
                          label={`${item.value}%`}
                          color={
                            item.value > 30
                              ? 'error'
                              : item.value > 20
                              ? 'warning'
                              : 'success'}
                          }
                          size="small"
                        />
                      </div>
                      <div  color="text.secondary">
                        {formatNaira(item.amount)} • {item.value}% of total
                        budget
                      </div>
                    </div>
                  ))}
                  <Alert severity="info" size="small" className="">
                    <div >
                      Medication costs represent the largest expense category,
                      but generate the highest ROI through improved patient
                      outcomes.
                    </div>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <div container spacing={3}>
            <div item xs={12}>
              <TableContainer >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Intervention Type</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Investment</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Savings Generated</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>ROI</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Payback Period</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Performance</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockData.roiAnalysisData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell component="th" scope="row">
                          <div className="">
                            <AttachMoney
                              className=""
                            />
                            {row.intervention}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          {formatNaira(row.investment)}
                        </TableCell>
                        <TableCell align="right">
                          <div
                            
                            color="success.main"
                            fontWeight="bold"
                          >
                            {formatNaira(row.savings)}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${row.roi}%`}
                            color={
                              row.roi > 250
                                ? 'success'
                                : row.roi > 200
                                ? 'warning'
                                : 'error'}
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {row.paybackMonths} months
                        </TableCell>
                        <TableCell align="center">
                          <div
                            className=""
                          >
                            <Progress
                              
                              className="" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    ROI Analysis Summary
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div >240.9%</div>
                        <div >Average ROI</div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div >3.8 months</div>
                        <div >Avg Payback</div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div >
                          {formatNaira(38500000)}
                        </div>
                        <div >
                          Total Investment
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div >
                          {formatNaira(129300000)}
                        </div>
                        <div >Total Returns</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
      </Card>
    </div>
  );
};
export default CostEffectivenessReport;
