import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  useTheme,
  Stack,
  Divider,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';
import { useReportsStore } from '../stores/reportsStore';
import { ReportType } from '../types/reports';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
}));

const ReportHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ChartCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

interface ReportDisplayProps {
  reportType: ReportType;
  onBack: () => void;
}

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b', '#5d4037', '#455a64'];

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportType, onBack }) => {
  const theme = useTheme();
  const reportData = useReportsStore((state) => state.reportData[reportType]);
  const loading = useReportsStore((state) => state.loading[reportType] || false);
  const error = useReportsStore((state) => state.errors[reportType]);
  const generateReport = useReportsStore((state) => state.generateReport);

  // Debug logging
  console.log('🔍 ReportDisplay - reportType:', reportType);
  console.log('🔍 ReportDisplay - reportData:', reportData);
  console.log('🔍 ReportDisplay - loading:', loading);
  console.log('🔍 ReportDisplay - error:', error);

  const reportConfig = useMemo(() => {
    const configs = {
      [ReportType.PATIENT_OUTCOMES]: {
        title: 'Patient Outcomes Report',
        description: 'Comprehensive analysis of patient therapy outcomes and clinical improvements',
        icon: <TrendingUpIcon />,
        color: theme.palette.success.main,
      },
      [ReportType.PHARMACIST_INTERVENTIONS]: {
        title: 'Pharmacist Interventions Report',
        description: 'Track pharmacist interventions, acceptance rates, and clinical impact',
        icon: <AssessmentIcon />,
        color: theme.palette.primary.main,
      },
      [ReportType.THERAPY_EFFECTIVENESS]: {
        title: 'Therapy Effectiveness Report',
        description: 'Evaluate medication adherence, therapy completion rates, and effectiveness',
        icon: <TrendingUpIcon />,
        color: theme.palette.info.main,
      },
      [ReportType.QUALITY_IMPROVEMENT]: {
        title: 'Quality Improvement Report',
        description: 'Monitor quality metrics, completion times, and process improvements',
        icon: <AssessmentIcon />,
        color: theme.palette.warning.main,
      },
      [ReportType.REGULATORY_COMPLIANCE]: {
        title: 'Regulatory Compliance Report',
        description: 'Ensure regulatory compliance with audit trails and documentation',
        icon: <AssessmentIcon />,
        color: theme.palette.error.main,
      },
      [ReportType.COST_EFFECTIVENESS]: {
        title: 'Cost Effectiveness Report',
        description: 'Analyze cost savings, ROI, and financial impact of interventions',
        icon: <TrendingUpIcon />,
        color: theme.palette.success.dark,
      },
      [ReportType.TREND_FORECASTING]: {
        title: 'Trend Forecasting Report',
        description: 'Identify trends and generate forecasts for strategic planning',
        icon: <TrendingUpIcon />,
        color: theme.palette.secondary.main,
      },
      [ReportType.OPERATIONAL_EFFICIENCY]: {
        title: 'Operational Efficiency Report',
        description: 'Optimize workflows, resource utilization, and operational performance',
        icon: <AssessmentIcon />,
        color: theme.palette.info.dark,
      },
      [ReportType.MEDICATION_INVENTORY]: {
        title: 'Medication Inventory Report',
        description: 'Manage inventory, track usage patterns, and forecast demand',
        icon: <AssessmentIcon />,
        color: theme.palette.primary.dark,
      },
      [ReportType.PATIENT_DEMOGRAPHICS]: {
        title: 'Patient Demographics Report',
        description: 'Understand patient populations and service utilization patterns',
        icon: <AssessmentIcon />,
        color: theme.palette.secondary.dark,
      },
      [ReportType.ADVERSE_EVENTS]: {
        title: 'Adverse Events Report',
        description: 'Monitor adverse events, safety patterns, and risk assessment',
        icon: <AssessmentIcon />,
        color: theme.palette.error.dark,
      },
      [ReportType.CUSTOM_TEMPLATES]: {
        title: 'Custom Templates Report',
        description: 'Create and manage custom report templates for specific needs',
        icon: <AssessmentIcon />,
        color: theme.palette.grey[600],
      },
    };
    return configs[reportType] || configs[ReportType.PATIENT_OUTCOMES];
  }, [reportType, theme]);

  const handleRefresh = async () => {
    const filters = {
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        preset: '30d' as const,
      },
    };
    await generateReport(reportType, filters);
  };

  const renderChart = (chart: any) => {
    const chartProps = {
      width: '100%',
      height: 300,
      data: chart.data,
    };

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.3)} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Chart type "{chart.type}" not supported
            </Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <StyledContainer maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: 'auto' }} />
          <Typography variant="h6" color="text.secondary">
            Generating {reportConfig.title}...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we process your request
          </Typography>
        </Box>
      </StyledContainer>
    );
  }

  if (error) {
    return (
      <StyledContainer maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 2 }}
          >
            Back to Reports
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Failed to generate {reportConfig.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          {error.includes('Network error') && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please ensure the backend server is running and accessible.
            </Typography>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Try Again'}
          </Button>
        </Alert>
      </StyledContainer>
    );
  }

  if (!reportData) {
    return (
      <StyledContainer maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 2 }}
          >
            Back to Reports
          </Button>
        </Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No report data available
          </Typography>
          <Typography variant="body2">
            Click "Generate Report" to create this report.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AssessmentIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Generate Report
          </Button>
        </Alert>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth="xl">
      {/* Header */}
      <ReportHeader elevation={0}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              sx={{ 
                color: 'inherit', 
                mb: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              Back to Reports
            </Button>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                  width: 48,
                  height: 48,
                }}
              >
                {reportConfig.icon}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {reportConfig.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {reportConfig.description}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={reportData.metadata.category}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                }}
              />
              <Chip
                label={`${reportData.metadata.dataPoints} data points`}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                }}
              />
              <Chip
                label={`Generated ${format(new Date(reportData.metadata.generatedAt), 'MMM dd, yyyy HH:mm')}`}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                }}
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={handleRefresh}
              sx={{ 
                color: 'inherit',
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              sx={{ 
                color: 'inherit',
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              sx={{ 
                color: 'inherit',
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }
              }}
            >
              <ShareIcon />
            </IconButton>
            <IconButton
              sx={{ 
                color: 'inherit',
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }
              }}
            >
              <PrintIcon />
            </IconButton>
          </Stack>
        </Stack>
      </ReportHeader>

      {/* Summary Metrics */}
      <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
        <MetricCard sx={{ flex: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha(reportConfig.color, 0.1),
                color: reportConfig.color,
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2,
              }}
            >
              <AssessmentIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" color={reportConfig.color} fontWeight="bold">
              {reportData.summary.primaryMetric.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {reportData.summary.primaryMetric.label}
            </Typography>
          </CardContent>
        </MetricCard>

        {reportData.summary.secondaryMetrics.map((metric, index) => (
          <MetricCard key={index} sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                {metric.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metric.label}
              </Typography>
            </CardContent>
          </MetricCard>
        ))}
      </Stack>

      {/* Charts */}
      {reportData.charts.map((chart) => (
        <ChartCard key={chart.id}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              {chart.title}
            </Typography>
            {renderChart(chart)}
          </CardContent>
        </ChartCard>
      ))}

      {/* Tables */}
      {reportData.tables.map((table) => (
        <ChartCard key={table.id}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              {table.title}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {table.headers.map((header, index) => (
                      <TableCell key={index} sx={{ fontWeight: 600 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {table.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </ChartCard>
      ))}
    </StyledContainer>
  );
};

export default ReportDisplay;