// Patient Demographics & Segmentation Report Component
import ChartComponent from '../shared/ChartComponent';

import { Button, Label, Card, CardContent, Select, Alert, Switch, Tabs } from '@/components/ui/button';

interface PatientDemographicsReportProps {
  filters: PatientDemographicsFilters;
  onFilterChange?: (filters: PatientDemographicsFilters) => void;
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
const PatientDemographicsReport: React.FC<PatientDemographicsReportProps> = ({ 
  filters,
  onFilterChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState('age');
  const [showGeographicHeatmap, setShowGeographicHeatmap] = useState(true);
  // Mock data - in real implementation, this would come from API
  const mockData = useMemo(
    () => ({ 
      // KPI Cards Data
      kpiData: [
        {
          title: 'Total Patients',
          value: 12847,
          unit: 'patients',
          trend: {
            direction: 'up' as const,
            value: 8.3,
            period: 'vs last quarter'}
          },
          status: 'info' as const,
          sparkline: [
            { name: 'Q1', value: 11200 },
            { name: 'Q2', value: 11800 },
            { name: 'Q3', value: 12300 },
            { name: 'Q4', value: 12847 },
          ],
        },
        {
          title: 'Active Segments',
          value: 8,
          unit: 'segments',
          trend: {
            direction: 'stable' as const,
            value: 0,
            period: 'no change',
          },
          status: 'success' as const,
        },
        {
          title: 'Geographic Coverage',
          value: 15,
          unit: 'regions',
          trend: {
            direction: 'up' as const,
            value: 2,
            period: 'new regions',
          },
          status: 'info' as const,
        },
        {
          title: 'Service Utilization',
          value: 78.5,
          unit: '%',
          trend: {
            direction: 'up' as const,
            value: 5.2,
            period: 'vs last month',
          },
          status: 'success' as const,
        },
      ],
      // Age Distribution
      ageDistributionData: {
        id: 'age-distribution',
        title: 'Patient Age Distribution',
        subtitle: 'Population analysis by age groups',
        type: 'bar' as const,
        data: [
          { ageGroup: '18-25', count: 1847, percentage: 14.4, utilization: 65 },
          { ageGroup: '26-35', count: 2156, percentage: 16.8, utilization: 72 },
          { ageGroup: '36-45', count: 2834, percentage: 22.1, utilization: 78 },
          { ageGroup: '46-55', count: 2945, percentage: 22.9, utilization: 82 },
          { ageGroup: '56-65', count: 2187, percentage: 17.0, utilization: 85 },
          { ageGroup: '66+', count: 878, percentage: 6.8, utilization: 88 },
        ],
        config: {
          title: {
            text: 'Patient Age Distribution',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'ageGroup',
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
              label: 'count',
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
              name: 'Patient Count',
              type: 'bar' as const,
              dataKey: 'count',
              style: { color: '#3b82f6' },
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
            colorPalette: ['#3b82f6'],
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
      // Geographic Patterns
      geographicPatternsData: {
        id: 'geographic-patterns',
        title: 'Geographic Distribution & Service Utilization',
        subtitle: 'Patient distribution and service usage by location',
        type: 'heatmap' as const,
        data: [
          {
            location: 'Downtown',
            patientCount: 2847,
            serviceUtilization: 85,
            density: 'high',
          },
          {
            location: 'Suburbs North',
            patientCount: 1956,
            serviceUtilization: 72,
            density: 'medium',
          },
          {
            location: 'Suburbs South',
            patientCount: 2134,
            serviceUtilization: 78,
            density: 'medium',
          },
          {
            location: 'East District',
            patientCount: 1678,
            serviceUtilization: 68,
            density: 'medium',
          },
          {
            location: 'West District',
            patientCount: 1834,
            serviceUtilization: 74,
            density: 'medium',
          },
          {
            location: 'Industrial Area',
            patientCount: 892,
            serviceUtilization: 62,
            density: 'low',
          },
          {
            location: 'University Area',
            patientCount: 1506,
            serviceUtilization: 88,
            density: 'high',
          },
        ],
        config: {
          title: {
            text: 'Geographic Distribution & Service Utilization',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'location',
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
              label: 'serviceUtilization',
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
              name: 'Patient Count',
              type: 'bar' as const,
              dataKey: 'patientCount',
              style: { color: '#3b82f6' },
              animations: {
                enabled: true,
                duration: 600,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Service Utilization',
              type: 'line' as const,
              dataKey: 'serviceUtilization',
              style: { color: '#10b981', strokeWidth: 3 },
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
            entrance: 'slide' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // Patient Journey Analytics
      patientJourneyData: {
        id: 'patient-journey',
        title: 'Patient Journey Analytics',
        subtitle: 'Funnel analysis of patient progression through care stages',
        type: 'funnel' as const,
        data: [
          {
            stage: 'Initial Contact',
            patients: 15847,
            conversionRate: 100,
            averageDuration: 0,
          },
          {
            stage: 'Assessment',
            patients: 14256,
            conversionRate: 89.9,
            averageDuration: 2.3,
          },
          {
            stage: 'Treatment Plan',
            patients: 13124,
            conversionRate: 92.1,
            averageDuration: 5.7,
          },
          {
            stage: 'Active Treatment',
            patients: 12847,
            conversionRate: 97.9,
            averageDuration: 45.2,
          },
          {
            stage: 'Follow-up',
            patients: 11934,
            conversionRate: 92.9,
            averageDuration: 12.8,
          },
          {
            stage: 'Completion',
            patients: 10567,
            conversionRate: 88.5,
            averageDuration: 8.4,
          },
        ],
        config: {
          title: {
            text: 'Patient Journey Analytics',
            alignment: 'left' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'stage',
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
              label: 'patients',
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
              name: 'Patient Count',
              type: 'bar' as const,
              dataKey: 'patients',
              style: { color: '#3b82f6' },
              animations: {
                enabled: true,
                duration: 700,
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
            colorPalette: ['#3b82f6'],
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
            entrance: 'slide' as const,
          },
          responsive: {
            breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1920 },
            rules: [],
          },
        },
      },
      // Service Utilization Analysis
      serviceUtilizationData: {
        id: 'service-utilization',
        title: 'Service Utilization Analysis',
        subtitle: 'Usage patterns and satisfaction by service type',
        type: 'radar' as const,
        data: [
          {
            service: 'Medication Therapy Management',
            utilization: 85,
            satisfaction: 4.2,
            frequency: 78,
          },
          {
            service: 'Clinical Consultations',
            utilization: 72,
            satisfaction: 4.5,
            frequency: 65,
          },
          {
            service: 'Health Screenings',
            utilization: 68,
            satisfaction: 4.1,
            frequency: 45,
          },
          {
            service: 'Immunizations',
            utilization: 92,
            satisfaction: 4.7,
            frequency: 35,
          },
          {
            service: 'Chronic Care Management',
            utilization: 78,
            satisfaction: 4.3,
            frequency: 88,
          },
          {
            service: 'Patient Education',
            utilization: 65,
            satisfaction: 4.0,
            frequency: 52,
          },
        ],
        config: {
          title: {
            text: 'Service Utilization Analysis',
            alignment: 'center' as const,
            style: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
          },
          axes: {
            x: {
              label: 'service',
              type: 'category' as const,
              grid: true,
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
              name: 'Utilization Rate',
              type: 'radar' as const,
              dataKey: 'utilization',
              style: { color: '#3b82f6', fillOpacity: 0.3 },
              animations: {
                enabled: true,
                duration: 800,
                delay: 0,
                easing: 'ease-out' as const,
              },
            },
            {
              name: 'Satisfaction Score',
              type: 'radar' as const,
              dataKey: 'satisfaction',
              style: { color: '#10b981', fillOpacity: 0.3 },
              animations: {
                enabled: true,
                duration: 800,
                delay: 100,
                easing: 'ease-out' as const,
              },
            },
          ],
          legend: {
            enabled: true,
            position: 'bottom' as const,
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
      }, },
    [selectedSegment]
  );
  // Simulate data loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [filters, selectedSegment]);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  if (error) {
    return (
      <Alert severity="error" className="">
        <div  gutterBottom>
          Error Loading Patient Demographics Data
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
          <People className="" />
          Patient Demographics & Segmentation
        </div>
        <div  color="text.secondary">
          Comprehensive analysis of patient population, geographic patterns,
          journey analytics, and service utilization with targeted
          recommendations.
        </div>
      </div>
      {/* Controls */}
      <Card className="">
        <CardContent>
          <div container spacing={3} alignItems="center">
            <div item xs={12} sm={6} md={3}>
              <div fullWidth size="small">
                <Label>Segmentation</Label>
                <Select
                  value={selectedSegment}
                  label="Segmentation"
                  onChange={(e) => setSelectedSegment(e.target.value)}
                >
                  <MenuItem value="age">Age Groups</MenuItem>
                  <MenuItem value="gender">Gender</MenuItem>
                  <MenuItem value="condition">Medical Conditions</MenuItem>
                  <MenuItem value="geography">Geographic</MenuItem>
                </Select>
              </div>
            </div>
            <div item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch}
                    checked={showGeographicHeatmap}
                    onChange={(e) => setShowGeographicHeatmap(e.target.checked)}
                  />
                }
                label="Geographic Heatmap"
              />
            </div>
            <div item xs={12} sm={6} md={3}>
              <Button
                
                startIcon={<Assessment />}
                fullWidth
                >
                Analyze Segments
              </Button>
            </div>
            <div item xs={12} sm={6} md={3}>
              <Button
                
                startIcon={<Map />}
                fullWidth
                >
                Export Map Data
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
            icon={<BarChart />}
            label="Population Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<LocationOn />}
            label="Geographic Patterns"
            iconPosition="start"
          />
          <Tab
            icon={<Timeline />}
            label="Patient Journey"
            iconPosition="start"
          />
          <Tab
            icon={<PieChart />}
            label="Service Utilization"
            iconPosition="start"
          />
        </Tabs>
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <div container spacing={3}>
            <div item xs={12}>
              <ChartComponent
                data={mockData.ageDistributionData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Population Insights
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="primary.contrastText">
                          46-55 Years
                        </div>
                        <div
                          
                          color="primary.contrastText"
                        >
                          Largest Segment (22.9%)
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="success.contrastText">
                          66+ Years
                        </div>
                        <div
                          
                          color="success.contrastText"
                        >
                          Highest Utilization (88%)
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="warning.contrastText">
                          18-25 Years
                        </div>
                        <div
                          
                          color="warning.contrastText"
                        >
                          Growth Opportunity (65%)
                        </div>
                      </div>
                    </div>
                    <div item xs={12} sm={6} md={3}>
                      <div
                        className=""
                      >
                        <div  color="info.contrastText">
                          36-55 Years
                        </div>
                        <div  color="info.contrastText">
                          Core Demographics (45%)
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
            <div item xs={12}>
              <ChartComponent
                data={mockData.geographicPatternsData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Geographic Analysis
                  </div>
                  <div
                    className=""
                  >
                    <Chip
                      label="Downtown: High Density"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="University Area: High Utilization"
                      color="info"
                      size="small"
                    />
                    <Chip
                      label="Industrial Area: Underserved"
                      color="warning"
                      size="small"
                    />
                  </div>
                  <div  color="text.secondary">
                    Geographic analysis reveals concentration in urban areas
                    with opportunities for expansion in underserved regions.
                    University area shows highest service utilization rates
                    despite moderate patient density.
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
                data={mockData.patientJourneyData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Journey Analytics Summary
                  </div>
                  <div container spacing={2}>
                    <div item xs={12} md={4}>
                      <div
                        className=""
                      >
                        <div
                          
                          color="success.main"
                          gutterBottom
                        >
                          Overall Completion Rate
                        </div>
                        <div  color="success.main">
                          66.7%
                        </div>
                        <div  color="text.secondary">
                          From initial contact to completion
                        </div>
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
                          Highest Drop-off
                        </div>
                        <div  color="warning.main">
                          Assessment
                        </div>
                        <div  color="text.secondary">
                          10.1% drop-off rate
                        </div>
                      </div>
                    </div>
                    <div item xs={12} md={4}>
                      <div
                        className=""
                      >
                        <div
                          
                          color="info.main"
                          gutterBottom
                        >
                          Average Duration
                        </div>
                        <div  color="info.main">
                          74.4 days
                        </div>
                        <div  color="text.secondary">
                          Complete patient journey
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
                data={mockData.serviceUtilizationData}
                height={400}
                loading={loading}
              />
            </div>
            <div item xs={12}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Service Utilization Insights
                  </div>
                  <div container spacing={2}>
                    {[
                      {
                        service: 'Immunizations',
                        utilization: 92,
                        satisfaction: 4.7,
                        status: 'success',
                      },
                      {
                        service: 'MTM',
                        utilization: 85,
                        satisfaction: 4.2,
                        status: 'success',
                      },
                      {
                        service: 'Patient Education',
                        utilization: 65,
                        satisfaction: 4.0,
                        status: 'warning',
                      },
                    ].map((item, index) => (
                      <div item xs={12} md={4} key={index}>
                        <div
                          className="">
                          <div  gutterBottom>
                            {item.service}
                          </div>
                          <div  color="text.secondary">
                            Utilization: {item.utilization}%
                          </div>
                          <div  color="text.secondary">
                            Satisfaction: {item.satisfaction}/5.0
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>
      </Card>
      {/* Targeted Recommendations */}
      <Card>
        <CardContent>
          <div  gutterBottom>
            Targeted Recommendations
          </div>
          <div container spacing={2}>
            <div item xs={12} md={6}>
              <div className="">
                <div
                  
                  color="info.contrastText"
                  gutterBottom
                >
                  Young Adult Engagement
                </div>
                <div  color="info.contrastText">
                  Implement digital health initiatives and flexible scheduling
                  to improve engagement in the 18-25 age group (currently 65%
                  utilization).
                </div>
              </div>
            </div>
            <div item xs={12} md={6}>
              <div className="">
                <div
                  
                  color="warning.contrastText"
                  gutterBottom
                >
                  Geographic Expansion
                </div>
                <div  color="warning.contrastText">
                  Consider satellite services in Industrial Area to address the
                  62% utilization rate and improve accessibility.
                </div>
              </div>
            </div>
            <div item xs={12} md={6}>
              <div className="">
                <div
                  
                  color="success.contrastText"
                  gutterBottom
                >
                  Patient Education Enhancement
                </div>
                <div  color="success.contrastText">
                  Boost patient education services through interactive programs
                  to increase the current 65% utilization rate.
                </div>
              </div>
            </div>
            <div item xs={12} md={6}>
              <div className="">
                <div
                  
                  color="primary.contrastText"
                  gutterBottom
                >
                  Journey Optimization
                </div>
                <div  color="primary.contrastText">
                  Streamline the assessment process to reduce the 10.1% drop-off
                  rate and improve overall completion rates.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default PatientDemographicsReport;
