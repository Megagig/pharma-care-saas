// Therapy Effectiveness Metrics Report Component
import ChartComponent from '../shared/ChartComponent';

import { Card, CardContent, Progress, Alert, Tabs } from '@/components/ui/button';

interface TherapyEffectivenessReportProps {
  filters: TherapyEffectivenessFilters;
  onFilterChange?: (filters: TherapyEffectivenessFilters) => void;
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
const TherapyEffectivenessReport: React.FC<TherapyEffectivenessReportProps> = ({ 
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
          title: 'Medication Adherence',
          value: 84.7,
          unit: '%',
          trend: {
            direction: 'up' as const,
            value: 7.3,
            period: 'vs last quarter'}
          },
          status: 'success' as const,
          target: { value: 80, label: 'Target' },
          sparkline: [
            { name: 'Q1', value: 78.2 },
            { name: 'Q2', value: 81.5 },
            { name: 'Q3', value: 83.1 },
            { name: 'Q4', value: 84.7 },
          ],
        },
        {
          title: 'Therapy Completion Rate',
          value: 91.2,
          unit: '%',
          trend: {
            direction: 'up' as const,
            value: 5.8,
            period: 'vs last quarter',
          },
          status: 'success' as const,
        },
        {
          title: 'Average Therapy Duration',
          value: 127,
          unit: 'days',
          trend: {
            direction: 'down' as const,
            value: 8.2,
            period: 'optimization',
          },
          status: 'info' as const,
        },
        {
          title: 'Clinical Effectiveness',
          value: 88.9,
          unit: '%',
          trend: {
            direction: 'up' as const,
            value: 12.1,
            period: 'vs baseline',
          },
          status: 'success' as const,
        },
      ],
      // Medication Adherence Over Time
      adherenceData: {
        id: 'adherence-trends',
        title: 'Medication Adherence Trends',
        subtitle: 'Adherence rates by therapy type over time',
        type: 'line' as const,
        data: [
          {
            month: 'Jan',
            Cardiovascular: 82.1,
            Diabetes: 79.5,
            Respiratory: 85.2,
            'Mental Health': 76.8,
          },
          {
            month: 'Feb',
            Cardiovascular: 83.4,
            Diabetes: 81.2,
            Respiratory: 86.1,
            'Mental Health': 78.3,
          },
          {
            month: 'Mar',
            Cardiovascular: 84.7,
            Diabetes: 82.8,
            Respiratory: 87.3,
            'Mental Health': 79.9,
          },
          {
            month: 'Apr',
            Cardiovascular: 85.9,
            Diabetes: 84.1,
            Respiratory: 88.2,
            'Mental Health': 81.2,
          },
          {
            month: 'May',
            Cardiovascular: 87.2,
            Diabetes: 85.6,
            Respiratory: 89.1,
            'Mental Health': 82.7,
          },
          {
            month: 'Jun',
            Cardiovascular: 88.5,
            Diabetes: 87.2,
            Respiratory: 90.3,
            'Mental Health': 84.1,
          },
        ],
        config: {
          title: {
            text: 'Medication Adherence Trends',
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
              label: 'adherence',
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
              name: 'Cardiovascular',
              type: 'line' as const,
              dataKey: 'Cardiovascular',
              style: { color: '#ef4444', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 0,
                easing: 'ease-in-out' as const,
              },
            },
            {
              name: 'Diabetes',
              type: 'line' as const,
              dataKey: 'Diabetes',
              style: { color: '#3b82f6', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 100,
                easing: 'ease-in-out' as const,
              },
            },
            {
              name: 'Respiratory',
              type: 'line' as const,
              dataKey: 'Respiratory',
              style: { color: '#10b981', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 200,
                easing: 'ease-in-out' as const,
              },
            },
            {
              name: 'Mental Health',
              type: 'line' as const,
              dataKey: 'Mental Health',
              style: { color: '#8b5cf6', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 300,
                delay: 300,
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
            colorPalette: ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'],
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
      // Therapy Completion Rates
      completionRatesData: {
        title: 'Therapy Completion Progress',
        value: 91,
        max: 100,
        unit: '%',
        segments: [
          { value: 45, color: '#10b981', label: 'Completed Successfully' },
          { value: 28, color: '#3b82f6', label: 'In Progress' },
          { value: 18, color: '#f59e0b', label: 'Extended Duration' },
          { value: 9, color: '#ef4444', label: 'Discontinued' },
        ],
        centerText: {
          primary: '91%',
          secondary: 'Completion Rate',
        },
      },
      // Effectiveness by Category
      categoryEffectivenessData: {
        id: 'category-effectiveness',
        title: 'Effectiveness Analysis by Medication Category',
        subtitle:
          'Clinical outcomes and patient satisfaction by therapeutic area',
        type: 'treemap' as const,
        data: [
          {
            name: 'Cardiovascular',
            value: 245,
            effectiveness: 88.5,
            patients: 1250,
          },
          { name: 'Diabetes', value: 198, effectiveness: 85.2, patients: 980 },
          {
            name: 'Respiratory',
            value: 167,
            effectiveness: 91.3,
            patients: 750,
          },
          {
            name: 'Mental Health',
            value: 134,
            effectiveness: 82.7,
            patients: 620,
          },
          {
            name: 'Pain Management',
            value: 112,
            effectiveness: 87.9,
            patients: 540,
          },
          { name: 'Oncology', value: 89, effectiveness: 94.1, patients: 320 },
          { name: 'Immunology', value: 76, effectiveness: 89.6, patients: 280 },
          { name: 'Neurology', value: 65, effectiveness: 86.3, patients: 240 },
        ],
        config: {
          title: {
            text: 'Effectiveness Analysis by Medication Category',
            alignment: 'left' as const,
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
              name: 'Effectiveness',
              type: 'treemap' as const,
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
            enabled: false,
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
              '#f97316',
              '#84cc16',
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
      // Predictive Insights
      predictiveInsightsData: {
        id: 'predictive-insights',
        title: 'Predictive Therapy Outcomes',
        subtitle: 'Forecasted success rates and risk factors',
        type: 'area' as const,
        data: [
          { month: 'Jul', predicted: 89.2, confidence: 92.5, actual: null },
          { month: 'Aug', predicted: 90.1, confidence: 91.8, actual: null },
          { month: 'Sep', predicted: 90.8, confidence: 90.2, actual: null },
          { month: 'Oct', predicted: 91.5, confidence: 89.7, actual: null },
          { month: 'Nov', predicted: 92.1, confidence: 88.9, actual: null },
          { month: 'Dec', predicted: 92.7, confidence: 88.1, actual: null },
        ],
        config: {
          title: {
            text: 'Predictive Therapy Outcomes',
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
              label: 'percentage',
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
              name: 'Predicted Success Rate',
              type: 'area' as const,
              dataKey: 'predicted',
              style: { color: '#3b82f6', fillOpacity: 0.3, strokeWidth: 2 },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Confidence Level',
              type: 'area' as const,
              dataKey: 'confidence',
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
      // Benchmark Comparison
      benchmarkData: {
        id: 'benchmark-comparison',
        title: 'Industry Benchmark Comparison',
        subtitle: 'Performance vs industry standards',
        type: 'bar' as const,
        data: [
          {
            metric: 'Adherence Rate',
            ourPerformance: 84.7,
            industryAverage: 78.2,
            bestPractice: 92.1,
          },
          {
            metric: 'Completion Rate',
            ourPerformance: 91.2,
            industryAverage: 85.6,
            bestPractice: 95.8,
          },
          {
            metric: 'Time to Effect',
            ourPerformance: 87.3,
            industryAverage: 82.1,
            bestPractice: 91.5,
          },
          {
            metric: 'Patient Satisfaction',
            ourPerformance: 89.1,
            industryAverage: 84.7,
            bestPractice: 93.2,
          },
          {
            metric: 'Safety Profile',
            ourPerformance: 94.5,
            industryAverage: 89.3,
            bestPractice: 97.1,
          },
        ],
        config: {
          title: {
            text: 'Industry Benchmark Comparison',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'metric',
              type: 'category' as const,
              grid: false,
              style: {
                lineColor: '#e5e7eb',
                tickColor: '#6b7280',
                labelStyle: {
                  fontSize: 11,
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
              label: 'percentage',
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
              name: 'Our Performance',
              type: 'bar' as const,
              dataKey: 'ourPerformance',
              style: { color: '#3b82f6' },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Industry Average',
              type: 'bar' as const,
              dataKey: 'industryAverage',
              style: { color: '#6b7280' },
              animations: {
                enabled: true,
                duration: 600,
                delay: 100,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Best Practice',
              type: 'bar' as const,
              dataKey: 'bestPractice',
              style: { color: '#10b981' },
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
            crossfilter: true,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: ['#3b82f6', '#6b7280', '#10b981'],
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
      // Detailed Therapy Data
      therapyDetails: [
        {
          category: 'Cardiovascular',
          totalPatients: 1250,
          adherenceRate: 88.5,
          completionRate: 92.3,
          avgDuration: 145,
          effectiveness: 89.2,
        },
        {
          category: 'Diabetes',
          totalPatients: 980,
          adherenceRate: 87.2,
          completionRate: 89.7,
          avgDuration: 180,
          effectiveness: 85.8,
        },
        {
          category: 'Respiratory',
          totalPatients: 750,
          adherenceRate: 90.3,
          completionRate: 94.1,
          avgDuration: 98,
          effectiveness: 91.5,
        },
        {
          category: 'Mental Health',
          totalPatients: 620,
          adherenceRate: 84.1,
          completionRate: 87.2,
          avgDuration: 210,
          effectiveness: 82.7,
        },
        {
          category: 'Pain Management',
          totalPatients: 540,
          adherenceRate: 86.8,
          completionRate: 90.5,
          avgDuration: 165,
          effectiveness: 87.9,
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
          Error Loading Therapy Effectiveness Data
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
          <Medication className="" />
          Therapy Effectiveness Metrics
        </div>
        <div  color="text.secondary">
          Comprehensive analysis of medication adherence, therapy completion
          rates, and clinical effectiveness.
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
          <Tab
            icon={<TrendingUp />}
            label="Adherence Trends"
            iconPosition="start"
          />
          <Tab
            icon={<CheckCircle />}
            label="Completion Rates"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="Category Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<Analytics />}
            label="Predictive Insights"
            iconPosition="start"
          />
          <Tab
            icon={<CompareArrows />}
            label="Benchmarks"
            iconPosition="start"
          />
        </Tabs>
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.adherenceData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Adherence Insights
                  </div>
                  <div
                    className=""
                  >
                    <Chip
                      label="Respiratory: Best Performance"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Cardiovascular: Above Target"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Mental Health: Needs Attention"
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label="Overall Trend: Improving"
                      color="info"
                      size="small"
                    />
                  </div>
                  <div  color="text.secondary">
                    Medication adherence shows consistent improvement across all
                    therapeutic areas. Respiratory therapies demonstrate the
                    highest adherence rates, while mental health treatments
                    require additional support strategies to improve patient
                    compliance.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <div container spacing={3}>
            <div item xs={12} md={6}>
              <ChartComponent
                data={{
                  id: 'completion-rates',
                  title: '',
                  type: 'progress-ring',
                  data: [mockData.completionRatesData],}
                  config: {} as any,
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12} md={6}>
              <Card className="">
                <CardContent
                  className=""
                >
                  <div  gutterBottom>
                    Completion Rate Analysis
                  </div>
                  {mockData.completionRatesData.segments?.map(
                    (segment, index) => (
                      <div key={index} className="">
                        <div
                          className=""
                        >
                          <div >
                            {segment.label}
                          </div>
                          <div  fontWeight="bold">
                            {segment.value}%
                          </div>
                        </div>
                        <Progress
                          
                          className=""20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: segment.color,
                              borderRadius: 4,
                            },
                        />
                      </div>
                    )
                  )}
                  <div
                    className=""
                  >
                    <div  gutterBottom>
                      <strong>Key Factors for Success:</strong>
                    </div>
                    <div
                      
                      color="text.secondary"
                      display="block"
                    >
                      • Regular monitoring and follow-up appointments
                    </div>
                    <div
                      
                      color="text.secondary"
                      display="block"
                    >
                      • Patient education and engagement programs
                    </div>
                    <div
                      
                      color="text.secondary"
                      display="block"
                    >
                      • Personalized therapy adjustments
                    </div>
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
                data={mockData.categoryEffectivenessData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <TableContainer >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Therapy Category</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Total Patients</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Adherence Rate</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Completion Rate</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Avg Duration (days)</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Effectiveness</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockData.therapyDetails.map((row) => (
                      <TableRow key={row.category} hover>
                        <TableCell component="th" scope="row">
                          <div className="">
                            <Medication
                              className=""
                            />
                            {row.category}
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          {row.totalPatients.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${row.adherenceRate}%`}
                            color={
                              row.adherenceRate > 88
                                ? 'success'
                                : row.adherenceRate > 85
                                ? 'warning'
                                : 'error'}
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${row.completionRate}%`}
                            color={
                              row.completionRate > 90
                                ? 'success'
                                : row.completionRate > 87
                                ? 'warning'
                                : 'error'}
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{row.avgDuration}</TableCell>
                        <TableCell align="right">
                          <div
                            className=""
                          >
                            <Progress
                              
                              className="" />
                            <div >
                              {row.effectiveness}%
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.predictiveInsightsData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Predictive Analytics Insights
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <TrendingUp className="" />
                        <div >92.7%</div>
                        <div >
                          Predicted Success Rate
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <CheckCircle className="" />
                        <div >88.1%</div>
                        <div >
                          Confidence Level
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <Schedule className="" />
                        <div >6 months</div>
                        <div >
                          Forecast Period
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <Analytics className="" />
                        <div >15</div>
                        <div >Risk Factors</div>
                      </div>
                    </div>
                  </div>
                  <Alert severity="info" className="">
                    <div >
                      Predictive models indicate continued improvement in
                      therapy outcomes. Key factors include enhanced patient
                      engagement, optimized dosing protocols, and improved
                      monitoring systems.
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
              <ChartComponent
                data={mockData.benchmarkData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Benchmark Analysis Summary
                  </div>
                  <div container spacing={2}>
                    {mockData.benchmarkData.data.map((item, index) => {
                      const performanceVsIndustry =
                        item.ourPerformance - item.industryAverage;
                      const performanceVsBest =
                        item.ourPerformance - item.bestPractice;
                      return (
                        <div item xs={12} sm={6} md={4} key={index}>
                          <Card >
                            <CardContent className="">
                              <div  gutterBottom>
                                {item.metric}
                              </div>
                              <div
                                
                                color="primary.main"
                                gutterBottom
                              >
                                {item.ourPerformance}%
                              </div>
                              <div
                                className=""
                              >
                                <Chip
                                  label={`${
                                    performanceVsIndustry > 0 ? '+' : ''}
                                  }${performanceVsIndustry.toFixed(
                                    1
                                  )}% vs Industry`}
                                  color={
                                    performanceVsIndustry > 0
                                      ? 'success'
                                      : 'error'}
                                  }
                                  size="small"
                                />
                              </div>
                              <div className="">
                                <Chip
                                  label={`${
                                    performanceVsBest > 0 ? '+' : ''}
                                  }${performanceVsBest.toFixed(1)}% vs Best`}
                                  color={
                                    performanceVsBest > -2
                                      ? 'success'
                                      : performanceVsBest > -5
                                      ? 'warning'
                                      : 'error'}
                                  }
                                  size="small"
                                  
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
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
export default TherapyEffectivenessReport;
