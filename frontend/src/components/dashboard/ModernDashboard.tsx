import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  Science as ScienceIcon,
  Refresh as RefreshIcon,
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
import { useClinicalInterventionDashboard } from '../../hooks/useClinicalInterventionDashboard';
import DashboardChart from './DashboardChart';
import QuickActionCard from './QuickActionCard';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';

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
  const theme = useTheme();

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
                {value}
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
  const theme = useTheme();
  const [healthStatus, setHealthStatus] = useState({
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
  const { isMobile, isTablet } = useResponsive();

  // Dashboard data hooks
  const {
    stats,
    patientsByMonth,
    medicationsByStatus,
    clinicalNotesByType,
    mtrsByStatus,
    patientAgeDistribution,
    monthlyActivity,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  const {
    dashboardMetrics: clinicalMetrics,
    loading: clinicalLoading,
    error: clinicalError,
    refresh: refreshClinical,
  } = useClinicalInterventionDashboard('month');

  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinical();
      // Add a small delay for better UX
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      setRefreshing(false);
    }
  };

  // Loading state
  if (dashboardLoading && !stats.totalPatients) {
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
              Pharmacare Dashboard
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
              value={stats.totalPatients}
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
              value={stats.totalClinicalNotes}
              subtitle="Total notes recorded"
              icon={<DescriptionIcon />}
              color={theme.palette.success.main}
              trend={{ value: 8, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/clinical-notes')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Medications"
              value={stats.totalMedications}
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
              value={stats.totalMTRs}
              subtitle="Medication therapy reviews"
              icon={<AssessmentIcon />}
              color={theme.palette.secondary.main}
              trend={{ value: 15, isPositive: true, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/mtr')}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <KPICard
              title="Diagnostics"
              value={stats.totalDiagnostics}
              subtitle="Diagnostic tests"
              icon={<ScienceIcon />}
              color={theme.palette.error.main}
              trend={{ value: -3, isPositive: false, period: 'last month' }}
              loading={dashboardLoading}
              onClick={() => navigate('/diagnostics')}
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
            <DashboardChart
              title="Patients by Month"
              data={patientsByMonth}
              type="line"
              height={450}
              colors={[theme.palette.primary.main]}
              subtitle="Monthly patient registration trends"
              showLegend={false}
              interactive={true}
            />
          </Box>

          {/* Medications by Status - Pie Chart */}
          <Box sx={{ width: '100%' }}>
            <DashboardChart
              title="Medications by Status"
              data={medicationsByStatus}
              type="pie"
              height={450}
              colors={[
                theme.palette.success.main,
                theme.palette.info.main,
                theme.palette.warning.main,
                theme.palette.grey[400],
              ]}
              subtitle="Current medication status distribution"
              showLegend={true}
              interactive={true}
            />
          </Box>

          {/* Clinical Notes by Type - Bar Chart */}
          <Box sx={{ width: '100%' }}>
            <DashboardChart
              title="Clinical Notes by Type"
              data={clinicalNotesByType}
              type="bar"
              height={450}
              colors={[theme.palette.secondary.main]}
              subtitle="Distribution of clinical note types"
              showLegend={false}
              interactive={true}
            />
          </Box>

          {/* MTR Sessions by Status - Pie Chart */}
          <Box sx={{ width: '100%' }}>
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
              subtitle="Medication therapy review status"
              showLegend={true}
              interactive={true}
            />
          </Box>

          {/* Patient Age Distribution - Bar Chart */}
          <Box sx={{ width: '100%' }}>
            <DashboardChart
              title="Patient Age Distribution"
              data={patientAgeDistribution}
              type="bar"
              height={450}
              colors={[theme.palette.info.main]}
              subtitle="Age demographics of patients"
              showLegend={false}
              interactive={true}
            />
          </Box>

          {/* Monthly Activity Trend - Line Chart */}
          <Box sx={{ width: '100%' }}>
            <DashboardChart
              title="Monthly Activity Trend"
              data={monthlyActivity}
              type="line"
              height={450}
              colors={[theme.palette.success.main]}
              subtitle="Overall system activity trends"
              showLegend={false}
              interactive={true}
            />
          </Box>
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
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'success.main', width: 32, height: 32 }}
                      >
                        <PersonAddIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="New Patient Registration"
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            John Doe registered by Dr. Smith
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            2 minutes ago
                          </Typography>
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
                        <NoteAddIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Clinical Note Added"
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            MTR session completed for Patient #1234
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            15 minutes ago
                          </Typography>
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
                        <MedicationIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Medication Update"
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Dosage adjusted for Patient Jane Smith
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            1 hour ago
                          </Typography>
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
                        <EventIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="MTR Session Completed"
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Dr. Johnson completed MTR for 3 patients
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            2 hours ago
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ bgcolor: 'error.main', width: 32, height: 32 }}
                      >
                        <WarningIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="System Alert"
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            High medication interaction detected
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            3 hours ago
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Dr. Sarah Wilson logged in
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            5 minutes ago
                          </Typography>
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Monthly performance report by Admin
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            30 minutes ago
                          </Typography>
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Notification preferences changed
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            1 hour ago
                          </Typography>
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Password changed for user account
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            4 hours ago
                          </Typography>
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
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Data backup completed successfully
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            6 hours ago
                          </Typography>
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Total Interventions"
                value={clinicalMetrics.totalInterventions || 0}
                subtitle="All interventions"
                icon={<AssessmentIcon />}
                color={theme.palette.primary.main}
                loading={clinicalLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Active"
                value={clinicalMetrics.activeInterventions || 0}
                subtitle="In progress"
                icon={<ScheduleIcon />}
                color={theme.palette.info.main}
                loading={clinicalLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Success Rate"
                value={`${Math.round(clinicalMetrics.successRate || 0)}%`}
                subtitle="Completed successfully"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
                loading={clinicalLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            </Grid>
          </Grid>
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
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Add New Patient"
              description="Register a new patient in the system"
              icon="👤"
              color={theme.palette.primary.main}
              navigateTo="/patients/new"
              buttonText="Add Patient"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Create Clinical Note"
              description="Document a new clinical observation"
              icon="📝"
              color={theme.palette.success.main}
              navigateTo="/clinical-notes/new"
              buttonText="Create Note"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Schedule MTR"
              description="Schedule a medication therapy review"
              icon="📅"
              color={theme.palette.secondary.main}
              navigateTo="/mtr/new"
              buttonText="Schedule"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="View Reports"
              description="Access detailed analytics and reports"
              icon="📊"
              color={theme.palette.warning.main}
              navigateTo="/reports"
              buttonText="View Reports"
            />
          </Grid>
        </Grid>
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
