import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Alert,
  useTheme,
  alpha,
  Fab,
  Zoom,
  Chip,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  Assessment as AssessmentIcon,
  Biotech as ScienceIcon,
  Sync as RefreshIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  NoteAdd as NoteAddIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Login as LoginIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardCharts } from '../../hooks/useDashboardCharts';
import { useClinicalInterventionDashboard } from '../../hooks/useClinicalInterventionDashboard';
import { useRecentActivities } from '../../hooks/useRecentActivities';
import { activityService } from '../../services/activityService';
import { testApiEndpoints } from '../../debug/testApiData';
import { testDashboardService } from '../../debug/testDashboardService';
import DashboardChart from './DashboardChart';
import QuickActionCard from './QuickActionCard';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';

// Communication Hub Components
import CommunicationWidget from '../communication/CommunicationWidget';
import CommunicationMetrics from '../communication/CommunicationMetrics';

// All components enabled
import AdminDashboardIntegration from './AdminDashboardIntegration';
import UsageDashboard from './UsageDashboard';
import PharmacistPerformanceTable from './PharmacistPerformanceTable';

// Enhanced KPI Card Component
interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  loading = false,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(
            color,
            0.05
          )} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          position: 'relative',
          overflow: 'visible',
          '&:hover': onClick
            ? {
              boxShadow: `0 8px 32px ${alpha(color, 0.3)}`,
              transform: 'translateY(-2px)',
            }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, position: 'relative' }}>
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(
                color,
                0.1
              )}, ${alpha(color, 0.05)})`,
              zIndex: 0,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(color, 0.15),
                  color: color,
                  width: 56,
                  height: 56,
                }}
              >
                {icon}
              </Avatar>
              {trend && (
                <Chip
                  icon={
                    trend.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />
                  }
                  label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                  size="small"
                  color={trend.isPositive ? 'success' : 'error'}
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>

            {loading ? (
              <Skeleton variant="text" width="60%" height={48} />
            ) : (
              <Typography
                variant="h3"
                component="div"
                sx={{
                  color: color,
                  fontWeight: 'bold',
                  mb: 1,
                }}
              >
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : value || '0'}
              </Typography>
            )}

            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}

            {trend && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                vs {trend.period}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// System Health Component
const SystemHealthCard: React.FC = () => {
  const [healthStatus] = useState({
    database: 'healthy',
    api: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms',
  });

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
            <SettingsIcon />
          </Avatar>
          <Typography variant="h6">System Health</Typography>
        </Box>

        <Box mb={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2">Database</Typography>
            <Chip label="Healthy" color="success" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={100} color="success" />
        </Box>

        <Box mb={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2">API Response</Typography>
            <Typography variant="caption">
              {healthStatus.responseTime}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={85} color="info" />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">Uptime</Typography>
          <Typography variant="h6" color="success.main">
            {healthStatus.uptime}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ModernDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  // Debug API endpoints and dashboard service (disabled to prevent re-render issues)
  useEffect(() => {
    // console.log('🔍 Running API debug test...');
    // testApiEndpoints();

    // console.log('🔍 Running Dashboard Service test...');
    // testDashboardService().catch(console.error);
  }, []);

  // Dashboard data hooks
  const {
    stats,
    workspaceInfo,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useDashboardData();

  // Chart data hooks - separate for better performance and real data
  const {
    clinicalNotesByType,
    mtrsByStatus,
    patientsByMonth,
    medicationsByStatus,
    patientAgeDistribution,
    monthlyActivity,
    loading: chartsLoading,
    error: chartsError,
    refresh: refreshCharts,
  } = useDashboardCharts();

  const {
    dashboardMetrics: clinicalMetrics,
    loading: clinicalLoading,
  } = useClinicalInterventionDashboard('month');

  const {
    systemActivities,
    loading: activitiesLoading,
    error: activitiesError,
    refresh: refreshActivities,
  } = useRecentActivities(10);

  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
      refreshCharts(); // Refresh chart data as well
      refreshActivities(); // Refresh activities
      // Add a small delay for better UX
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      setRefreshing(false);
    }
  };

  // Loading state - only show loading if we're actually loading and have no data at all
  if (
    dashboardLoading &&
    stats.totalPatients === 0 &&
    stats.totalClinicalNotes === 0
  ) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={30} sx={{ mb: 4 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: 3,
            width: '100%',
          }}
        >
          {[...Array(6)].map((_, index) => (
            <Box key={index} sx={{ width: '100%' }}>
              <Skeleton
                variant="rectangular"
                height={160}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          Error loading dashboard: {dashboardError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: '100%',
        mx: 0,
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              PharmacyCopilot Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's your healthcare system overview.
            </Typography>
          </Box>

          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Dashboard">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.2),
                  },
                }}
              >
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Workspace Information Banner */}
      {workspaceInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <DashboardIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {workspaceInfo.workplace?.name || 'Your Workplace'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {workspaceInfo.workplace?.type || 'Healthcare Facility'} •
                      {workspaceInfo.memberCount || 0} team members
                    </Typography>
                  </Box>
                </Box>

                {workspaceInfo.workplace?.ownerId && (
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {workspaceInfo.workplace.ownerId.firstName} {workspaceInfo.workplace.ownerId.lastName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box
          className="main-kpis-grid"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: 3,
            mb: 4,
            width: '100%',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Total Patients"
              value={stats.totalPatients || 0}
              subtitle="Active patients in system"
              icon={<PeopleIcon />}
              color={theme.palette.primary.main}
              trend={{ value: 12, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/patients')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Clinical Notes"
              value={stats.totalClinicalNotes || 0}
              subtitle="Total notes recorded"
              icon={<DescriptionIcon />}
              color={theme.palette.success.main}
              trend={{ value: 8, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/notes')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Medications"
              value={stats.totalMedications || 0}
              subtitle="Medication records"
              icon={<MedicationIcon />}
              color={theme.palette.warning.main}
              trend={{ value: 5, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/medications')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="MTR Sessions"
              value={stats.totalMTRs || 0}
              subtitle="Medication therapy reviews"
              icon={<AssessmentIcon />}
              color={theme.palette.secondary.main}
              trend={{ value: 15, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/pharmacy/medication-therapy')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Diagnostics"
              value={stats.totalDiagnostics || 0}
              subtitle="Diagnostic tests"
              icon={<ScienceIcon />}
              color={theme.palette.error.main}
              trend={{ value: -3, isPositive: false, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/pharmacy/diagnostics')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <SystemHealthCard />
          </Box>
        </Box>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Charts Grid - Full Width Layout */}
        <Box
          className="dashboard-charts-grid"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 4,
            width: '100%',
          }}
        >
          {/* Patients by Month - Line Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="rectangular" width="100%" height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Patients by Month"
                data={
                  patientsByMonth.length > 0
                    ? patientsByMonth
                    : [{ name: 'No Data', value: 0 }]
                }
                type="line"
                height={450}
                colors={[theme.palette.primary.main]}
                subtitle={`Monthly patient registration trends (${patientsByMonth.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </Box>

          {/* Medications by Status - Pie Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="circular" width={300} height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Medications by Status"
                data={
                  medicationsByStatus.length > 0
                    ? medicationsByStatus
                    : [
                      {
                        name: 'No Data',
                        value: 1,
                        color: theme.palette.grey[400],
                      },
                    ]
                }
                type="pie"
                height={450}
                colors={[
                  theme.palette.success.main,
                  theme.palette.info.main,
                  theme.palette.warning.main,
                  theme.palette.grey[400],
                ]}
                subtitle={`Current medication status distribution (${medicationsByStatus.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total)`}
                showLegend={true}
                interactive={true}
              />
            )}
          </Box>

          {/* Clinical Notes by Type - Bar Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="rectangular" width="100%" height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Clinical Notes by Type"
                data={clinicalNotesByType}
                type="bar"
                height={450}
                colors={[theme.palette.secondary.main]}
                subtitle={`Distribution of clinical note types (${clinicalNotesByType.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </Box>

          {/* MTR Sessions by Status - Pie Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="circular" width={300} height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="MTR Sessions by Status"
                data={mtrsByStatus}
                type="pie"
                height={450}
                colors={[
                  theme.palette.warning.main,
                  theme.palette.success.main,
                  theme.palette.grey[400],
                  theme.palette.info.main,
                ]}
                subtitle={`Medication therapy review status (${mtrsByStatus.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total)`}
                showLegend={true}
                interactive={true}
              />
            )}
          </Box>

          {/* Patient Age Distribution - Bar Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="rectangular" width="100%" height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Patient Age Distribution"
                data={
                  patientAgeDistribution.length > 0
                    ? patientAgeDistribution
                    : [{ name: 'No Data', value: 0 }]
                }
                type="bar"
                height={450}
                colors={[theme.palette.info.main]}
                subtitle={`Age demographics of patients (${patientAgeDistribution.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </Box>

          {/* Monthly Activity Trend - Line Chart */}
          <Box sx={{ width: '100%' }}>
            {chartsLoading ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="rectangular" width="100%" height={300} />
                </Box>
              </Card>
            ) : chartsError ? (
              <Card
                sx={{
                  height: 450,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Monthly Activity Trend"
                data={monthlyActivity}
                type="line"
                height={450}
                colors={[theme.palette.success.main]}
                subtitle={`Overall system activity trends (${monthlyActivity.reduce(
                  (sum, item) => sum + item.value,
                  0
                )} total activities)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Communication Hub Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Communication Hub
        </Typography>
        <Box
          className="communication-widgets-grid"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
              lg: '2fr 1fr 1fr',
            },
            gap: 3,
            mb: 4,
            width: '100%',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <CommunicationWidget variant="overview" height={320} />
          </Box>
          <Box sx={{ width: '100%' }}>
            <CommunicationWidget variant="recent-messages" height={320} />
          </Box>
          <Box sx={{ width: '100%' }}>
            <CommunicationWidget variant="notifications" height={320} />
          </Box>
        </Box>
      </motion.div>

      {/* Communication Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
      >
        <Box sx={{ mb: 4 }}>
          <CommunicationMetrics timeRange="week" showTrends={true} />
        </Box>
      </motion.div>

      {/* Recent Activities Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Recent Activities
        </Typography>
        <Box
          className="recent-activities-grid"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 4,
            width: '100%',
          }}
        >
          {/* Recent System Activities */}
          <Box sx={{ width: '100%' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <NotificationsIcon />
                  </Avatar>
                  <Typography variant="h6">System Activities</Typography>
                </Box>
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {activitiesLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: 'grey.200',
                                width: 32,
                                height: 32,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  bgcolor: 'grey.300',
                                  borderRadius: '50%',
                                }}
                              />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  bgcolor: 'grey.200',
                                  height: 16,
                                  width: '60%',
                                  borderRadius: 1,
                                }}
                              />
                            }
                            secondary={
                              <Box>
                                <Box
                                  sx={{
                                    bgcolor: 'grey.200',
                                    height: 12,
                                    width: '80%',
                                    borderRadius: 1,
                                    mb: 0.5,
                                  }}
                                />
                                <Box
                                  sx={{
                                    bgcolor: 'grey.200',
                                    height: 10,
                                    width: '40%',
                                    borderRadius: 1,
                                  }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 4 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </Box>
                    ))
                  ) : activitiesError ? (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography color="error" variant="body2">
                            Error loading activities: {activitiesError}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : systemActivities.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography color="text.secondary" variant="body2">
                            No recent system activities
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : (
                    systemActivities.map((activity, index) => {
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'patient_registration':
                            return 'success.main';
                          case 'clinical_note':
                            return 'info.main';
                          case 'medication_update':
                            return 'warning.main';
                          case 'mtr_session':
                            return 'secondary.main';
                          case 'system_alert':
                            return 'error.main';
                          default:
                            return 'primary.main';
                        }
                      };

                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'patient_registration':
                            return <PersonAddIcon sx={{ fontSize: 16 }} />;
                          case 'clinical_note':
                            return <NoteAddIcon sx={{ fontSize: 16 }} />;
                          case 'medication_update':
                            return <MedicationIcon sx={{ fontSize: 16 }} />;
                          case 'mtr_session':
                            return <EventIcon sx={{ fontSize: 16 }} />;
                          case 'system_alert':
                            return <WarningIcon sx={{ fontSize: 16 }} />;
                          default:
                            return <NotificationsIcon sx={{ fontSize: 16 }} />;
                        }
                      };

                      return (
                        <Box key={activity.id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: getActivityColor(activity.type),
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                {getActivityIcon(activity.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={activity.title}
                              secondary={
                                <Box component="div">
                                  <Box
                                    component="div"
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {activity.description}
                                  </Box>
                                  <Box
                                    component="div"
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {activityService.formatRelativeTime(
                                      activity.createdAt
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < systemActivities.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </Box>
                      );
                    })
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Recent User Activities */}
          <Box sx={{ width: '100%' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Typography variant="h6">User Activities</Typography>
                </Box>
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                      >
                        <LoginIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="User Login"
                      secondary={
                        <Box component="div">
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            Dr. Sarah Wilson logged in
                          </Box>
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            5 minutes ago
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'info.main', width: 32, height: 32 }}
                      >
                        <AssignmentIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Report Generated"
                      secondary={
                        <Box component="div">
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            Monthly performance report by Admin
                          </Box>
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            30 minutes ago
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}
                      >
                        <SettingsIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Settings Updated"
                      secondary={
                        <Box component="div">
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            Notification preferences changed
                          </Box>
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            1 hour ago
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <SecurityIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Security Update"
                      secondary={
                        <Box component="div">
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            Password changed for user account
                          </Box>
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            4 hours ago
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'success.main', width: 32, height: 32 }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Task Completed"
                      secondary={
                        <Box component="div">
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            Data backup completed successfully
                          </Box>
                          <Box
                            component="div"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            6 hours ago
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </motion.div>

      {/* Admin Dashboard Integration */}
      <AdminDashboardIntegration />

      {/* Usage Dashboard */}
      <UsageDashboard />

      {/* Pharmacist Performance */}
      <PharmacistPerformanceTable />

      {/* Clinical Interventions Dashboard */}
      {clinicalMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Clinical Interventions Overview
          </Typography>
          <Box
            className="clinical-interventions-grid"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
              mb: 4,
              width: '100%',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <KPICard
                title="Total Interventions"
                value={clinicalMetrics.totalInterventions || 0}
                subtitle="All interventions"
                icon={<AssessmentIcon />}
                color={theme.palette.primary.main}
                loading={clinicalLoading}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <KPICard
                title="Active"
                value={clinicalMetrics.activeInterventions || 0}
                subtitle="In progress"
                icon={<ScheduleIcon />}
                color={theme.palette.info.main}
                loading={clinicalLoading}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <KPICard
                title="Success Rate"
                value={`${Math.round(clinicalMetrics.successRate || 0)}%`}
                subtitle="Completed successfully"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
                loading={clinicalLoading}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <KPICard
                title="Cost Savings"
                value={`₦${(
                  (clinicalMetrics.totalCostSavings || 0) / 1000
                ).toFixed(0)}K`}
                subtitle="Estimated savings"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
                loading={clinicalLoading}
              />
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Box
          className="quick-actions-grid"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            width: '100%',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <QuickActionCard
              title="Add New Patient"
              description="Register a new patient in the system"
              icon="👤"
              color={theme.palette.primary.main}
              navigateTo="/patients/new"
              buttonText="Add Patient"
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <QuickActionCard
              title="Create Clinical Note"
              description="Document a new clinical observation"
              icon="📝"
              color={theme.palette.success.main}
              navigateTo="/notes/new"
              buttonText="Create Note"
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <QuickActionCard
              title="Schedule MTR"
              description="Schedule a medication therapy review"
              icon="📅"
              color={theme.palette.secondary.main}
              navigateTo="/pharmacy/medication-therapy/new"
              buttonText="Schedule"
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <QuickActionCard
              title="View Reports"
              description="Access detailed analytics and reports"
              icon="📊"
              color={theme.palette.warning.main}
              navigateTo="/pharmacy/reports"
              buttonText="View Reports"
            />
          </Box>
        </Box>
      </motion.div>

      {/* Floating Action Button */}
      <AnimatePresence>
        <Zoom in={!isMobile}>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={() => navigate('/patients/new')}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      </AnimatePresence>
    </Box>
  );
};

export default ModernDashboard;
