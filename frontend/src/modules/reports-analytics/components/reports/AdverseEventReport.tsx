// Adverse Event & Incident Reporting Component
import ChartComponent from '../shared/ChartComponent';

import { Button, Label, Card, CardContent, Select, Progress, Alert, Switch, Tabs } from '@/components/ui/button';

interface AdverseEventReportProps {
  filters: AdverseEventFilters;
  onFilterChange?: (filters: AdverseEventFilters) => void;
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
const AdverseEventReport: React.FC<AdverseEventReportProps> = ({ 
  filters,
  onFilterChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showTrendMonitoring, setShowTrendMonitoring] = useState(true);
  const [includePreventable, setIncludePreventable] = useState(true);
  // Mock data - in real implementation, this would come from API
  const mockData = useMemo(
    () => ({ 
      // KPI Cards Data
      kpiData: [
        {
          title: 'Total Incidents',
          value: 247,
          unit: 'events',
          trend: {
            direction: 'down' as const,
            value: 12.3,
            period: 'vs last quarter'}
          },
          status: 'success' as const,
          sparkline: [
            { name: 'Q1', value: 285 },
            { name: 'Q2', value: 268 },
            { name: 'Q3', value: 259 },
            { name: 'Q4', value: 247 },
          ],
        },
        {
          title: 'Severe Events',
          value: 18,
          unit: 'events',
          trend: {
            direction: 'down' as const,
            value: 25.0,
            period: 'vs last quarter',
          },
          status: 'warning' as const,
        },
        {
          title: 'Preventable Events',
          value: 156,
          unit: 'events',
          trend: {
            direction: 'down' as const,
            value: 8.7,
            period: 'reduction',
          },
          status: 'info' as const,
        },
        {
          title: 'Safety Score',
          value: 87.3,
          unit: '/100',
          trend: {
            direction: 'up' as const,
            value: 5.2,
            period: 'improvement',
          },
          status: 'success' as const,
        },
      ],
      // Incident Frequency Analysis
      incidentFrequencyData: {
        id: 'incident-frequency',
        title: 'Incident Frequency Analysis',
        subtitle: 'Event types by frequency and severity distribution',
        type: 'bar' as const,
        data: [
          {
            eventType: 'Medication Error',
            frequency: 89,
            severity: 'moderate',
            trend: 'decreasing',
          },
          {
            eventType: 'Allergic Reaction',
            frequency: 45,
            severity: 'severe',
            trend: 'stable',
          },
          {
            eventType: 'Drug Interaction',
            frequency: 38,
            severity: 'mild',
            trend: 'decreasing',
          },
          {
            eventType: 'Dosage Error',
            frequency: 32,
            severity: 'moderate',
            trend: 'decreasing',
          },
          {
            eventType: 'Administration Error',
            frequency: 28,
            severity: 'mild',
            trend: 'stable',
          },
          {
            eventType: 'Contraindication',
            frequency: 15,
            severity: 'severe',
            trend: 'increasing',
          },
        ],
        config: {
          title: {
            text: 'Incident Frequency Analysis',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'eventType',
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
              label: 'frequency',
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
              name: 'Incident Frequency',
              type: 'bar' as const,
              dataKey: 'frequency',
              style: { color: '#ef4444' },
              animations: {
                enabled: true,
                duration: 500,
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
            crossfilter: true,
          },
          theme: {
            name: 'corporate-light',
            colorPalette: ['#ef4444'],
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
            duration: 500,
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
      // Severity Distribution
      severityDistributionData: {
        id: 'severity-distribution',
        title: 'Severity Distribution & Risk Assessment',
        subtitle: 'Event severity levels with risk assessment metrics',
        type: 'donut' as const,
        data: [
          { name: 'Mild', value: 142, percentage: 57.5, riskLevel: 'low' },
          {
            name: 'Moderate',
            value: 87,
            percentage: 35.2,
            riskLevel: 'medium',
          },
          { name: 'Severe', value: 15, percentage: 6.1, riskLevel: 'high' },
          {
            name: 'Life-threatening',
            value: 3,
            percentage: 1.2,
            riskLevel: 'critical',
          },
        ],
        config: {
          title: {
            text: 'Severity Distribution & Risk Assessment',
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
              name: 'Events',
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
            colorPalette: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
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
      // Root Cause Analysis
      rootCauseAnalysisData: {
        id: 'root-cause-analysis',
        title: 'Root Cause Analysis',
        subtitle:
          'Fishbone analysis of incident causes and prevention opportunities',
        type: 'bar' as const,
        data: [
          {
            cause: 'Communication Failure',
            frequency: 78,
            impact: 85,
            preventable: true,
          },
          {
            cause: 'System Error',
            frequency: 45,
            impact: 92,
            preventable: true,
          },
          {
            cause: 'Human Error',
            frequency: 67,
            impact: 75,
            preventable: true,
          },
          {
            cause: 'Process Deviation',
            frequency: 34,
            impact: 68,
            preventable: true,
          },
          {
            cause: 'Equipment Malfunction',
            frequency: 23,
            impact: 88,
            preventable: false,
          },
          {
            cause: 'External Factors',
            frequency: 18,
            impact: 45,
            preventable: false,
          },
        ],
        config: {
          title: {
            text: 'Root Cause Analysis',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'cause',
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
              label: 'frequency',
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
              name: 'Frequency',
              type: 'bar' as const,
              dataKey: 'frequency',
              style: { color: '#3b82f6' },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Impact Score',
              type: 'line' as const,
              dataKey: 'impact',
              style: { color: '#ef4444', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 600,
                delay: 100,
                easing: 'ease-out' as const,
              },
              yAxisId: 'right' as const,
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
            colorPalette: ['#3b82f6', '#ef4444'],
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
      // Safety Pattern Identification
      safetyPatternsData: {
        id: 'safety-patterns',
        title: 'Safety Pattern Identification & Trend Monitoring',
        subtitle: 'Temporal patterns and safety trends with monitoring alerts',
        type: 'line' as const,
        data: [
          {
            month: 'Jan',
            incidents: 28,
            severity: 2.3,
            preventable: 18,
            alerts: 2,
          },
          {
            month: 'Feb',
            incidents: 32,
            severity: 2.1,
            preventable: 22,
            alerts: 1,
          },
          {
            month: 'Mar',
            incidents: 25,
            severity: 2.5,
            preventable: 16,
            alerts: 3,
          },
          {
            month: 'Apr',
            incidents: 29,
            severity: 2.2,
            preventable: 19,
            alerts: 1,
          },
          {
            month: 'May',
            incidents: 22,
            severity: 2.0,
            preventable: 14,
            alerts: 0,
          },
          {
            month: 'Jun',
            incidents: 26,
            severity: 2.4,
            preventable: 17,
            alerts: 2,
          },
          {
            month: 'Jul',
            incidents: 24,
            severity: 1.9,
            preventable: 15,
            alerts: 1,
          },
          {
            month: 'Aug',
            incidents: 21,
            severity: 2.1,
            preventable: 13,
            alerts: 0,
          },
          {
            month: 'Sep',
            incidents: 23,
            severity: 2.3,
            preventable: 15,
            alerts: 1,
          },
          {
            month: 'Oct',
            incidents: 19,
            severity: 1.8,
            preventable: 12,
            alerts: 0,
          },
          {
            month: 'Nov',
            incidents: 20,
            severity: 2.0,
            preventable: 13,
            alerts: 1,
          },
          {
            month: 'Dec',
            incidents: 18,
            severity: 1.7,
            preventable: 11,
            alerts: 0,
          },
        ],
        config: {
          title: {
            text: 'Safety Pattern Identification & Trend Monitoring',
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
              label: 'incidents',
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
              name: 'Total Incidents',
              type: 'line' as const,
              dataKey: 'incidents',
              style: { color: '#ef4444', strokeWidth: 3 },
              animations: {
                enabled: true,
                duration: 700,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Preventable Events',
              type: 'line' as const,
              dataKey: 'preventable',
              style: { color: '#f59e0b', strokeWidth: 2 },
              animations: {
                enabled: true,
                duration: 700,
                delay: 100,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Safety Alerts',
              type: 'line' as const,
              dataKey: 'alerts',
              style: {
                color: '#8b5cf6',
                strokeWidth: 2,
                strokeDasharray: '5 5',
              },
              animations: {
                enabled: true,
                duration: 700,
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
          annotations: [
            {
              type: 'line' as const,
              value: 25,
              axis: 'y' as const,
              label: 'Safety Threshold',
              style: {
                stroke: '#10b981',
                strokeWidth: 2,
                strokeDasharray: '3 3',
                fill: '#10b981',
                fillOpacity: 0.1,
                fontSize: 12,
                fontColor: '#10b981',
              },
            },
          ],
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
            colorPalette: ['#ef4444', '#f59e0b', '#8b5cf6'],
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
            duration: 700,
            easing: 'ease-out' as const,
            stagger: true,
            entrance: 'fade' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      }, },
    [selectedSeverity, includePreventable]
  );
  // Simulate data loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [filters, selectedSeverity]);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  if (error) {
    return (
      <Alert severity="error" className="">
        <div  gutterBottom>
          Error Loading Adverse Event Data
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
          <Warning className="" />
          Adverse Event & Incident Reporting
        </div>
        <div  color="text.secondary">
          Comprehensive analysis of adverse events, incident frequency, root
          cause analysis, and safety pattern identification with regulatory
          reporting capabilities.
        </div>
      </div>
      {/* Controls */}
      <Card className="">
        <CardContent>
          <div container spacing={3} alignItems="center">
            <div item xs={12} sm={6} md={3}>
              <div fullWidth size="small">
                <Label>Severity Filter</Label>
                <Select
                  value={selectedSeverity}
                  label="Severity Filter"
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="mild">Mild</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="severe">Severe</MenuItem>
                  <MenuItem value="life-threatening">Life-threatening</MenuItem>
                </Select>
              </div>
            </div>
            <div item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch}
                    checked={showTrendMonitoring}
                    onChange={(e) => setShowTrendMonitoring(e.target.checked)}
                  />
                }
                label="Trend Monitoring"
              />
            </div>
            <div item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch}
                    checked={includePreventable}
                    onChange={(e) => setIncludePreventable(e.target.checked)}
                  />
                }
                label="Include Preventable"
              />
            </div>
            <div item xs={12} sm={6} md={3}>
              <Button
                
                startIcon={<ReportProblem />}
                fullWidth
                >
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
            icon={<BugReport />}
            label="Incident Frequency"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="Severity Distribution"
            iconPosition="start"
          />
          <Tab
            icon={<Analytics />}
            label="Root Cause Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<Security />}
            label="Safety Patterns"
            iconPosition="start"
          />
        </Tabs>
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.incidentFrequencyData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Incident Analysis Summary
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="error.contrastText">
                          Medication Error
                        </div>
                        <div  color="error.contrastText">
                          Most Frequent (89 events)
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="warning.contrastText">
                          Contraindication
                        </div>
                        <div
                          
                          color="warning.contrastText"
                        >
                          Increasing Trend
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="success.contrastText">
                          Drug Interaction
                        </div>
                        <div
                          
                          color="success.contrastText"
                        >
                          Decreasing Trend
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="info.contrastText">
                          Total Events
                        </div>
                        <div  color="info.contrastText">
                          247 This Quarter
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <div container spacing={3}>
            <div item xs={12} md={8}>
              <ChartComponent
                data={mockData.severityDistributionData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12} md={4}>
              <Card className="">
                <CardContent>
                  <div  gutterBottom>
                    Risk Assessment
                  </div>
                  {[
                    {
                      level: 'Mild',
                      count: 142,
                      risk: 'Low',
                      color: 'success',
                    },
                    {
                      level: 'Moderate',
                      count: 87,
                      risk: 'Medium',
                      color: 'warning',
                    },
                    {
                      level: 'Severe',
                      count: 15,
                      risk: 'High',
                      color: 'error',
                    },
                    {
                      level: 'Life-threatening',
                      count: 3,
                      risk: 'Critical',
                      color: 'error',
                    },
                  ].map((item, index) => (
                    <div key={index} className="">
                      <div
                        className=""
                      >
                        <div >{item.level}</div>
                        <div  fontWeight="bold">
                          {item.count} events
                        </div>
                      </div>
                      <Progress
                        
                        color={item.color as any}
                        className=""
                      />
                      <div  color="text.secondary">
                        Risk Level: {item.risk}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.rootCauseAnalysisData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Root Cause Insights & Prevention Opportunities
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} md={6}>
                      <div
                        className=""
                      >
                        <div
                          
                          color="error.contrastText"
                          gutterBottom
                        >
                          High Impact Causes
                        </div>
                        <div  color="error.contrastText">
                          • System Error (92% impact score)
                          <br />
                          • Equipment Malfunction (88% impact score)
                          <br />• Communication Failure (85% impact score)
                        </div>
                      </div>
                    </div>
                    <div item xs={12} md={6}>
                      <div
                        className=""
                      >
                        <div
                          
                          color="success.contrastText"
                          gutterBottom
                        >
                          Prevention Opportunities
                        </div>
                        <div
                          
                          color="success.contrastText"
                        >
                          • 78% of incidents from preventable causes
                          <br />
                          • Focus on communication protocols
                          <br />• Implement system redundancies
                        </div>
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
            <div item xs={12}>
              <ChartComponent
                data={mockData.safetyPatternsData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Safety Pattern Analysis
                  </div>
                  <div
                    className=""
                  >
                    <Chip
                      label="Downward Trend: -35.7%"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Below Safety Threshold"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Preventable Events Reduced"
                      color="info"
                      size="small"
                    />
                    <Chip
                      label="Minimal Safety Alerts"
                      color="success"
                      size="small"
                    />
                  </div>
                  <div  color="text.secondary">
                    Safety patterns show consistent improvement with incident
                    rates declining from 28 to 18 events per month. Preventable
                    events have decreased by 38.9%, and safety alerts are at
                    minimal levels, indicating effective safety measures.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
      </Card>
      {/* Regulatory Reporting Section */}
      <Card>
        <CardContent>
          <div  gutterBottom>
            Regulatory Reporting & Automated Submissions
          </div>
          <div container spacing={2}>
            <div item xs={12} md={4}>
              <div
                className=""
              >
                <div
                  
                  color="primary.main"
                  gutterBottom
                >
                  FDA MedWatch Reports
                </div>
                <div  color="primary.main">
                  18
                </div>
                <div  color="text.secondary">
                  Submitted this quarter
                </div>
                <Button size="small" className="">
                  View Reports
                </Button>
              </div>
            </div>
            <div item xs={12} md={4}>
              <div
                className=""
              >
                <div
                  
                  color="warning.main"
                  gutterBottom
                >
                  Pending Submissions
                </div>
                <div  color="warning.main">
                  3
                </div>
                <div  color="text.secondary">
                  Awaiting review
                </div>
                <Button size="small" className="">
                  Review Queue
                </Button>
              </div>
            </div>
            <div item xs={12} md={4}>
              <div
                className=""
              >
                <div
                  
                  color="success.main"
                  gutterBottom
                >
                  Compliance Rate
                </div>
                <div  color="success.main">
                  98.7%
                </div>
                <div  color="text.secondary">
                  Regulatory compliance
                </div>
                <Button size="small" className="">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default AdverseEventReport;
