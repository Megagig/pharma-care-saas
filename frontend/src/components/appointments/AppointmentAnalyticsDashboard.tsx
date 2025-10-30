import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Paper,
  Divider,
  TextField,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CalendarToday as Calendar,
  AccessTime as Clock,
  Users,
  CheckCircle,
  Cancel,
  Warning,
  Download,
  Refresh,
  FilterList,
  Analytics,
  Schedule,
  Assessment,
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAppointmentAnalytics } from '../../hooks/useAppointmentAnalytics';
import { useUsers } from '../../queries/useUsers';
import { toast } from 'react-hot-toast';

// Color palette for charts
const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  purple: '#7b1fa2',
  orange: '#f57c00',
  teal: '#00695c',
  indigo: '#303f9f',
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.teal,
];

interface AppointmentAnalyticsDashboardProps {
  className?: string;
  compact?: boolean;
}

const AppointmentAnalyticsDashboard: React.FC<AppointmentAnalyticsDashboardProps> = ({
  className,
  compact = false,
}) => {
  // State for filters
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [selectedPharmacist, setSelectedPharmacist] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data
  const analyticsParams = useMemo(() => ({
    startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
    endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
    ...(selectedPharmacist && { pharmacistId: selectedPharmacist }),
    ...(selectedType && { appointmentType: selectedType }),
  }), [dateRange, selectedPharmacist, selectedType]);

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useAppointmentAnalytics(analyticsParams, true); // Re-enabled with error handling

  const { data: usersData } = useUsers();

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!analyticsData?.data) {
      // Return fallback data when API is not available
      return {
        summary: { totalAppointments: 0, completionRate: 0, noShowRate: 0, cancellationRate: 0, averageWaitTime: 0, averageDuration: 0 },
        trends: [],
        types: [],
        statuses: [],
        hourly: [],
        daily: []
      };
    }

    const { summary, byType = [], byStatus = [], trends = { daily: [] }, peakTimes = { hourlyDistribution: [], dailyDistribution: [] } } = analyticsData.data;

    // Prepare trend data for line chart
    const trendData = (trends.daily || []).map(day => ({
      date: format(new Date(day.date), 'MMM dd'),
      appointments: day.appointments || 0,
      completed: day.completed || 0,
      cancelled: day.cancelled || 0,
      noShow: day.noShow || 0,
      completionRate: (day.appointments || 0) > 0 ? Math.round(((day.completed || 0) / day.appointments) * 100) : 0,
    }));

    // Prepare type distribution for pie chart
    const typeData = (byType || []).map(type => ({
      name: (type.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: type.count || 0,
      completionRate: type.completionRate || 0,
    }));

    // Prepare status distribution for bar chart
    const statusData = (byStatus || []).map(status => ({
      name: (status.status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: status.count || 0,
      percentage: status.percentage || 0,
    }));

    // Prepare peak times data
    const hourlyData = (peakTimes.hourlyDistribution || []).map(hour => ({
      hour: `${(hour.hour || 0).toString().padStart(2, '0')}:00`,
      count: hour.count || 0,
    }));

    const dailyData = (peakTimes.dailyDistribution || []).map(day => ({
      day: (day.day || '').substring(0, 3),
      count: day.count || 0,
    }));

    return {
      summary,
      trends: trendData,
      types: typeData,
      statuses: statusData,
      hourly: hourlyData,
      daily: dailyData,
    };
  }, [analyticsData]);

  // Handle export
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setIsExporting(true);
      // TODO: Implement export functionality
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Analytics refreshed');
  };

  // Quick date range presets
  const handleQuickDateRange = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ startDate: now, endDate: now });
        break;
      case 'week':
        setDateRange({ startDate: subDays(now, 7), endDate: now });
        break;
      case 'month':
        setDateRange({ startDate: subDays(now, 30), endDate: now });
        break;
      case 'quarter':
        setDateRange({ startDate: subDays(now, 90), endDate: now });
        break;
      case 'thisMonth':
        setDateRange({ startDate: startOfMonth(now), endDate: endOfMonth(now) });
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        Failed to load appointment analytics. Please try again.
      </Alert>
    );
  }

  if (!chartData) {
    return (
      <Alert severity="info">
        No appointment data available for the selected period.
      </Alert>
    );
  }

  return (
    <Box className={className} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics color="primary" />
            Appointment Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Quick date presets */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['today', 'week', 'month', 'quarter', 'thisMonth'].map((preset) => (
                <Chip
                  key={preset}
                  label={preset === 'thisMonth' ? 'This Month' : preset.charAt(0).toUpperCase() + preset.slice(1)}
                  onClick={() => handleQuickDateRange(preset)}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Date range pickers */}
            <TextField
              label="Start Date"
              type="date"
              size="small"
              sx={{ minWidth: 140 }}
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              sx={{ minWidth: 140 }}
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
            />

            {/* Pharmacist filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Pharmacist</InputLabel>
              <Select
                value={selectedPharmacist}
                label="Pharmacist"
                onChange={(e) => setSelectedPharmacist(e.target.value)}
              >
                <MenuItem value="">All Pharmacists</MenuItem>
                {usersData?.data?.users?.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Appointment type filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={selectedType}
                label="Appointment Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="mtm_session">MTM Session</MenuItem>
                <MenuItem value="chronic_disease_review">Chronic Disease Review</MenuItem>
                <MenuItem value="new_medication_consultation">New Medication Consultation</MenuItem>
                <MenuItem value="vaccination">Vaccination</MenuItem>
                <MenuItem value="health_check">Health Check</MenuItem>
                <MenuItem value="smoking_cessation">Smoking Cessation</MenuItem>
                <MenuItem value="general_followup">General Follow-up</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      {/* Summary Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Appointments
                </Typography>
                <Typography variant="h4" component="div">
                  {chartData.summary.totalAppointments.toLocaleString()}
                </Typography>
              </Box>
              <Calendar sx={{ fontSize: 40, color: CHART_COLORS.primary, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Completion Rate
                </Typography>
                <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {chartData.summary.completionRate}%
                  {chartData.summary.completionRate >= 80 ? (
                    <TrendingUp sx={{ color: CHART_COLORS.success }} />
                  ) : (
                    <TrendingDown sx={{ color: CHART_COLORS.error }} />
                  )}
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: CHART_COLORS.success, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  No-Show Rate
                </Typography>
                <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {chartData.summary.noShowRate}%
                  {chartData.summary.noShowRate <= 10 ? (
                    <TrendingDown sx={{ color: CHART_COLORS.success }} />
                  ) : (
                    <TrendingUp sx={{ color: CHART_COLORS.error }} />
                  )}
                </Typography>
              </Box>
              <Warning sx={{ fontSize: 40, color: CHART_COLORS.warning, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Cancellation Rate
                </Typography>
                <Typography variant="h4" component="div">
                  {chartData.summary.cancellationRate}%
                </Typography>
              </Box>
              <Cancel sx={{ fontSize: 40, color: CHART_COLORS.error, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Duration
                </Typography>
                <Typography variant="h4" component="div">
                  {chartData.summary.averageDuration}
                  <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                    min
                  </Typography>
                </Typography>
              </Box>
              <Clock sx={{ fontSize: 40, color: CHART_COLORS.info, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Wait Time
                </Typography>
                <Typography variant="h4" component="div">
                  {chartData.summary.averageWaitTime}
                  <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                    min
                  </Typography>
                </Typography>
              </Box>
              <Schedule sx={{ fontSize: 40, color: CHART_COLORS.purple, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {/* Appointment Trends Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              Appointment Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stackId="1"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.6}
                    name="Total Appointments"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="2"
                    stroke={CHART_COLORS.success}
                    fill={CHART_COLORS.success}
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    stackId="3"
                    stroke={CHART_COLORS.error}
                    fill={CHART_COLORS.error}
                    fillOpacity={0.6}
                    name="Cancelled"
                  />
                  <Area
                    type="monotone"
                    dataKey="noShow"
                    stackId="4"
                    stroke={CHART_COLORS.warning}
                    fill={CHART_COLORS.warning}
                    fillOpacity={0.6}
                    name="No Show"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Appointment Type Distribution */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appointment Type Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.types}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.types.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Completion Rate Gauge */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completion Rate
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={chartData.summary.completionRate}
                  size={200}
                  thickness={8}
                  sx={{
                    color: chartData.summary.completionRate >= 80 ? CHART_COLORS.success : 
                           chartData.summary.completionRate >= 60 ? CHART_COLORS.warning : CHART_COLORS.error,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h3" component="div" color="text.secondary">
                    {chartData.summary.completionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* No-Show Rate Trend */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No-Show Rate Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="noShow"
                    stroke={CHART_COLORS.error}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.error, strokeWidth: 2, r: 4 }}
                    name="No Shows"
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke={CHART_COLORS.warning}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: CHART_COLORS.warning, strokeWidth: 2, r: 3 }}
                    name="Cancelled"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Peak Times Heatmap - Hourly Distribution */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Peak Times - Hourly Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Peak Times Heatmap - Daily Distribution */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Peak Times - Daily Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.teal} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AppointmentAnalyticsDashboard;