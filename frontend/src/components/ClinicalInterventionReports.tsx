import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  Treemap,
  Funnel,
  FunnelChart,
} from 'recharts';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useClinicalInterventionStore } from '../stores/clinicalInterventionStore';

interface OutcomeReport {
  summary: {
    totalInterventions: number;
    completedInterventions: number;
    successfulInterventions: number;
    successRate: number;
    totalCostSavings: number;
    averageResolutionTime: number;
    patientSatisfactionScore: number;
  };
  categoryAnalysis: Array<{
    category: string;
    total: number;
    successful: number;
    successRate: number;
    avgCostSavings: number;
    avgResolutionTime: number;
  }>;
  trendAnalysis: Array<{
    period: string;
    interventions: number;
    successRate: number;
    costSavings: number;
    resolutionTime: number;
  }>;
  comparativeAnalysis: {
    currentPeriod: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
    previousPeriod: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
    percentageChange: {
      interventions: number;
      successRate: number;
      costSavings: number;
    };
  };
  detailedOutcomes: Array<{
    interventionId: string;
    interventionNumber: string;
    patientName: string;
    category: string;
    priority: string;
    outcome: string;
    costSavings: number;
    resolutionTime: number;
    patientResponse: string;
    completedDate: string;
  }>;
}

interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  category: string;
  priority: string;
  outcome: string;
  pharmacist: string;
  costSavingsMin: number | null;
  costSavingsMax: number | null;
}

const ClinicalInterventionReports: React.FC = () => {
  const theme = useTheme();
  const { loading, error } = useClinicalInterventionStore();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState<OutcomeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>(
    'pdf'
  );

  // Filter state
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: startOfMonth(subMonths(new Date(), 1)),
    dateTo: endOfMonth(new Date()),
    category: 'all',
    priority: 'all',
    outcome: 'all',
    pharmacist: 'all',
    costSavingsMin: null,
    costSavingsMax: null,
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load report data
  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    setReportError(null);

    try {
      // Import the service dynamically to avoid circular dependencies
      const { clinicalInterventionService } = await import(
        '../services/clinicalInterventionService'
      );

      // Convert filters to the format expected by the API
      const apiFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        outcome: filters.outcome !== 'all' ? filters.outcome : undefined,
        pharmacist:
          filters.pharmacist !== 'all' ? filters.pharmacist : undefined,
      };

      console.log('🔍 REPORTS: Calling generateOutcomeReport with filters:', apiFilters);
      const response = await clinicalInterventionService.generateOutcomeReport(
        apiFilters
      );
      console.log('🔍 REPORTS: Received response:', response);

      if (response.success && response.data) {
        console.log('🔍 REPORTS: Setting report data:', response.data);
        setReportData(response.data);
      } else {
        console.log('🔍 REPORTS: No data received, using mock data');
        // If no data is available, create a mock structure to show the UI
        const mockReportData: OutcomeReport = {
          summary: {
            totalInterventions: 0,
            completedInterventions: 0,
            successfulInterventions: 0,
            successRate: 0,
            totalCostSavings: 0,
            averageResolutionTime: 0,
            patientSatisfactionScore: 0,
          },
          categoryAnalysis: [],
          trendAnalysis: [],
          comparativeAnalysis: {
            currentPeriod: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
            previousPeriod: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
            percentageChange: {
              interventions: 0,
              successRate: 0,
              costSavings: 0,
            },
          },
          detailedOutcomes: [],
        };

        setReportData(mockReportData);
        setReportError(
          response.message ||
          'No report data available. Create some clinical interventions to see reports.'
        );
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportError(
        error instanceof Error ? error.message : 'Failed to load report data'
      );

      // Provide empty structure even on error so UI doesn't break
      const emptyReportData: OutcomeReport = {
        summary: {
          totalInterventions: 0,
          completedInterventions: 0,
          successfulInterventions: 0,
          successRate: 0,
          totalCostSavings: 0,
          averageResolutionTime: 0,
          patientSatisfactionScore: 0,
        },
        categoryAnalysis: [],
        trendAnalysis: [],
        comparativeAnalysis: {
          currentPeriod: { interventions: 0, successRate: 0, costSavings: 0 },
          previousPeriod: { interventions: 0, successRate: 0, costSavings: 0 },
          percentageChange: {
            interventions: 0,
            successRate: 0,
            costSavings: 0,
          },
        },
        detailedOutcomes: [],
      };
      setReportData(emptyReportData);
    } finally {
      setLoadingReport(false);
    }
  }, [filters]);

  // Load data on component mount and filter changes
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Handle filter changes
  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Mock export functionality - replace with actual API call
      console.log(`Exporting report as ${exportFormat}`);

      // Create mock file download
      const filename = `clinical-interventions-report-${format(
        new Date(),
        'yyyy-MM-dd'
      )}.${exportFormat}`;
      const content = JSON.stringify(reportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Modern chart colors with gradients
  const chartColors = [
    '#667eea', // Modern blue
    '#764ba2', // Modern purple
    '#f093fb', // Modern pink
    '#f5576c', // Modern red
    '#4facfe', // Modern light blue
    '#43e97b', // Modern green
    '#fa709a', // Modern coral
    '#fee140', // Modern yellow
  ];

  const gradientColors = [
    { start: '#667eea', end: '#764ba2' },
    { start: '#f093fb', end: '#f5576c' },
    { start: '#4facfe', end: '#00f2fe' },
    { start: '#43e97b', end: '#38f9d7' },
    { start: '#fa709a', end: '#fee140' },
    { start: '#a8edea', end: '#fed6e3' },
    { start: '#ffecd2', end: '#fcb69f' },
    { start: '#ff9a9e', end: '#fecfef' },
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                }}
              />
              {entry.name}: {entry.value}
              {entry.name.includes('Rate') && '%'}
              {entry.name.includes('Savings') && ' ₦'}
              {entry.name.includes('Time') && ' days'}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loadingReport && !reportData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (reportError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading report: {reportError}
      </Alert>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <AssessmentIcon />
          Outcome Reports & Analytics
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            No Report Data Available
          </Typography>
          <Typography variant="body2">
            No clinical interventions have been completed yet. Once clinical
            interventions are created and processed, comprehensive reports will
            be available including:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>Success rates by category</li>
            <li>Cost savings analysis</li>
            <li>Trend analysis over time</li>
            <li>Comparative performance metrics</li>
            <li>Detailed outcome tracking</li>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <AssessmentIcon />
            Outcome Reports & Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadReportData} disabled={loadingReport}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FilterIcon />
              Report Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) =>
                      handleFilterChange('category', e.target.value)
                    }
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="drug_therapy_problem">
                      Drug Therapy Problem
                    </MenuItem>
                    <MenuItem value="adverse_drug_reaction">
                      Adverse Drug Reaction
                    </MenuItem>
                    <MenuItem value="medication_nonadherence">
                      Medication Non-adherence
                    </MenuItem>
                    <MenuItem value="drug_interaction">
                      Drug Interaction
                    </MenuItem>
                    <MenuItem value="dosing_issue">Dosing Issue</MenuItem>
                    <MenuItem value="contraindication">
                      Contraindication
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)
                    }
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Summary Overview" />
            <Tab label="Category Analysis" />
            <Tab label="Trend Analysis" />
            <Tab label="Comparative Analysis" />
            <Tab label="Detailed Outcomes" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {/* Modern KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <AssessmentIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {reportData?.summary?.totalInterventions || 0}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Total Interventions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(67, 233, 123, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(67, 233, 123, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {(reportData?.summary?.successRate || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Success Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(250, 112, 154, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <MoneyIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      ₦{(reportData?.summary?.totalCostSavings || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Total Cost Savings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(79, 172, 254, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <TimelineIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {(reportData?.summary?.averageResolutionTime || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Avg Resolution Time (days)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(240, 147, 251, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <AssessmentIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {reportData?.summary?.completedInterventions || 0}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Completed Interventions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    color: '#333',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(168, 237, 234, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {(reportData?.summary?.patientSatisfactionScore || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      Patient Satisfaction (5.0)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Modern Summary Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <BarChartIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Success Rate by Category
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={reportData?.categoryAnalysis || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <defs>
                          <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#667eea" stopOpacity={1} />
                            <stop offset="100%" stopColor="#764ba2" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="successRate"
                          fill="url(#successGradient)"
                          radius={[4, 4, 0, 0]}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <PieChartIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Category Distribution
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <defs>
                          {gradientColors.map((gradient, index) => (
                            <linearGradient
                              key={index}
                              id={`pieGradient${index}`}
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={gradient.start} />
                              <stop offset="100%" stopColor={gradient.end} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={reportData?.categoryAnalysis || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="total"
                          animationDuration={1000}
                        >
                          {(reportData?.categoryAnalysis || []).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#pieGradient${index % gradientColors.length})`}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <MoneyIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Cost Savings by Category
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart
                        data={reportData?.categoryAnalysis || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <defs>
                          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fa709a" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#fee140" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="avgCostSavings"
                          stroke="#fa709a"
                          strokeWidth={3}
                          fill="url(#costGradient)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Category Analysis Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Performance Analysis
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Successful</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Avg Cost Savings</TableCell>
                        <TableCell align="right">Avg Resolution Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportData?.categoryAnalysis || []).map((category) => (
                        <TableRow key={category.category}>
                          <TableCell component="th" scope="row">
                            {category.category}
                          </TableCell>
                          <TableCell align="right">{category.total}</TableCell>
                          <TableCell align="right">
                            {category.successful}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${category.successRate.toFixed(1)}%`}
                              color={
                                category.successRate >= 90
                                  ? 'success'
                                  : category.successRate >= 80
                                    ? 'warning'
                                    : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            ₦{category.avgCostSavings}
                          </TableCell>
                          <TableCell align="right">
                            {category.avgResolutionTime.toFixed(1)} days
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Modern Trend Analysis Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <ShowChartIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Monthly Performance Trends
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={450}>
                      <ComposedChart
                        data={reportData?.trendAnalysis || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="interventionsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#667eea" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#764ba2" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="costSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fa709a" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#fee140" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="interventions"
                          fill="url(#interventionsGradient)"
                          stroke="#667eea"
                          strokeWidth={2}
                          name="Interventions"
                          animationDuration={1500}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="costSavings"
                          fill="url(#costSavingsGradient)"
                          stroke="#fa709a"
                          strokeWidth={2}
                          name="Cost Savings (₦)"
                          animationDuration={2000}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="successRate"
                          stroke="#43e97b"
                          strokeWidth={3}
                          dot={{ fill: '#43e97b', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#43e97b', strokeWidth: 2 }}
                          name="Success Rate (%)"
                          animationDuration={2500}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <TimelineIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Resolution Time Trend
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={reportData?.trendAnalysis || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="resolutionGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f093fb" />
                            <stop offset="100%" stopColor="#f5576c" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="resolutionTime"
                          stroke="url(#resolutionGradient)"
                          strokeWidth={4}
                          dot={{ fill: '#f093fb', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#f093fb', strokeWidth: 2 }}
                          animationDuration={2000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        <TrendingUpIcon sx={{ color: '#333', fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Success Rate Progress
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="20%"
                        outerRadius="90%"
                        data={[
                          {
                            name: 'Success Rate',
                            value: reportData?.summary?.successRate || 0,
                            fill: '#43e97b',
                          },
                        ]}
                      >
                        <RadialBar
                          minAngle={15}
                          label={{ position: 'insideStart', fill: '#fff' }}
                          background
                          clockWise
                          dataKey="value"
                          cornerRadius={10}
                          fill="#43e97b"
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <Typography
                      variant="h4"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        color: '#43e97b',
                        mt: -8,
                      }}
                    >
                      {(reportData?.summary?.successRate || 0).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            {/* Modern Comparative Analysis */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    }}
                  />
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <AssessmentIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Interventions
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}
                    >
                      {reportData?.comparativeAnalysis?.currentPeriod?.interventions || 0}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          (reportData?.comparativeAnalysis?.percentageChange?.interventions || 0) >= 0
                            ? 'rgba(67, 233, 123, 0.1)'
                            : 'rgba(245, 87, 108, 0.1)',
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      <TrendingUpIcon
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.interventions || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          mr: 0.5,
                          fontSize: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.interventions || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          fontWeight: 600,
                        }}
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange?.interventions || 0
                        ).toFixed(1)}% vs previous period
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    }}
                  />
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <TrendingUpIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Success Rate
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}
                    >
                      {(reportData?.comparativeAnalysis?.currentPeriod?.successRate || 0).toFixed(1)}%
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          (reportData?.comparativeAnalysis?.percentageChange?.successRate || 0) >= 0
                            ? 'rgba(67, 233, 123, 0.1)'
                            : 'rgba(245, 87, 108, 0.1)',
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      <TrendingUpIcon
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.successRate || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          mr: 0.5,
                          fontSize: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.successRate || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          fontWeight: 600,
                        }}
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange?.successRate || 0
                        ).toFixed(1)}% vs previous period
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
                    }}
                  />
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        borderRadius: '50%',
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <MoneyIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Cost Savings
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}
                    >
                      ₦{(reportData?.comparativeAnalysis?.currentPeriod?.costSavings || 0).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          (reportData?.comparativeAnalysis?.percentageChange?.costSavings || 0) >= 0
                            ? 'rgba(67, 233, 123, 0.1)'
                            : 'rgba(245, 87, 108, 0.1)',
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      <TrendingUpIcon
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.costSavings || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          mr: 0.5,
                          fontSize: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            (reportData?.comparativeAnalysis?.percentageChange?.costSavings || 0) >= 0
                              ? '#43e97b'
                              : '#f5576c',
                          fontWeight: 600,
                        }}
                      >
                        {Math.abs(
                          reportData?.comparativeAnalysis?.percentageChange?.costSavings || 0
                        ).toFixed(1)}% vs previous period
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            {/* Detailed Outcomes Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Intervention Outcomes
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Intervention #</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Outcome</TableCell>
                        <TableCell align="right">Cost Savings</TableCell>
                        <TableCell align="right">Resolution Time</TableCell>
                        <TableCell>Completed Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportData?.detailedOutcomes || [])
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((outcome) => (
                          <TableRow key={outcome.interventionId}>
                            <TableCell>{outcome.interventionNumber}</TableCell>
                            <TableCell>{outcome.patientName}</TableCell>
                            <TableCell>{outcome.category}</TableCell>
                            <TableCell>
                              <Chip
                                label={outcome.priority}
                                color={
                                  outcome.priority === 'high'
                                    ? 'error'
                                    : outcome.priority === 'medium'
                                      ? 'warning'
                                      : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={outcome.patientResponse}
                                color={
                                  outcome.patientResponse === 'improved'
                                    ? 'success'
                                    : outcome.patientResponse === 'no_change'
                                      ? 'warning'
                                      : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              ₦{outcome.costSavings}
                            </TableCell>
                            <TableCell align="right">
                              {outcome.resolutionTime} days
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(outcome.completedDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={reportData?.detailedOutcomes?.length || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Export Dialog */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        >
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Choose the format for exporting the report:
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                label="Export Format"
                onChange={(e) => setExportFormat(e.target.value as unknown)}
              >
                <MenuItem value="pdf">PDF Report</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                <MenuItem value="csv">CSV Data</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} variant="contained">
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ClinicalInterventionReports;
