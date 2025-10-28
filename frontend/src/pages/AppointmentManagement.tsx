import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  LinearProgress,
  Avatar,
  Badge,
  Fade,
  Button,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { motion } from 'framer-motion';
import ResponsiveAppointmentCalendar from '../components/appointments/ResponsiveAppointmentCalendar';
import AppointmentAnalyticsDashboard from '../components/appointments/AppointmentAnalyticsDashboard';
import PharmacistScheduleView from '../components/appointments/PharmacistScheduleView';
import CapacityUtilizationChart from '../components/appointments/CapacityUtilizationChart';
import ReminderEffectivenessChart from '../components/appointments/ReminderEffectivenessChart';
import CreateAppointmentDialog from '../components/appointments/CreateAppointmentDialog';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { format, endOfWeek } from 'date-fns';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

/**
 * Modern Appointment Management Page
 * Professional appointment scheduling with comprehensive analytics
 */
const AppointmentManagement: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);

  // Fetch appointments data
  const { data: appointmentsData, refetch } = useAppointments({ limit: 100 });

  // Calculate stats - data.results is the appointments array
  const appointments = appointmentsData?.data?.results || [];
  
  const todayAppointments = appointments.filter(
    (apt: any) => format(new Date(apt.scheduledDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length || 0;

  const completedToday = appointments.filter(
    (apt: any) => 
      format(new Date(apt.scheduledDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
      apt.status === 'completed'
  ).length || 0;

  const upcomingThisWeek = appointments.filter(
    (apt: any) => {
      const aptDate = new Date(apt.scheduledDate);
      const today = new Date();
      const weekEnd = endOfWeek(today);
      return aptDate > today && aptDate <= weekEnd && apt.status === 'scheduled';
    }
  ).length || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: '100%',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
      }}
    >
      {/* Modern Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ mb: 4 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              }}
            >
              Appointment Management
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Schedule, manage, and analyze patient appointments with ease
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setCreateAppointmentOpen(true)}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[4],
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              New Appointment
            </Button>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
                }}
              >
                <Badge badgeContent={todayAppointments} color="primary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {refreshing && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}
      </MotionBox>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            whileHover={{ scale: 1.05, boxShadow: theme.shadows[8] }}
            sx={{
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha('#fff', 0.1),
              }}
            />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <EventIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Chip label="Today" size="small" sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }} />
                </Stack>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {todayAppointments}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Appointments Today
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            whileHover={{ scale: 1.05, boxShadow: theme.shadows[8] }}
            sx={{
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.9)} 0%, ${alpha(theme.palette.success.dark, 0.9)} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha('#fff', 0.1),
              }}
            />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Chip label="Completed" size="small" sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }} />
                </Stack>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {completedToday}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Completed Today
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            whileHover={{ scale: 1.05, boxShadow: theme.shadows[8] }}
            sx={{
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.9)} 0%, ${alpha(theme.palette.info.dark, 0.9)} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha('#fff', 0.1),
              }}
            />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <CalendarMonthIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Chip label="This Week" size="small" sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }} />
                </Stack>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {upcomingThisWeek}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Upcoming This Week
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Appointment Calendar - Full Width */}
        <Grid item xs={12}>
          <Fade in timeout={600}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ boxShadow: theme.shadows[12] }}
              sx={{
                borderRadius: 4,
                boxShadow: theme.shadows[8],
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                      <CalendarMonthIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Appointment Calendar
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        View and manage all patient appointments
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <ResponsiveAppointmentCalendar />
              </CardContent>
            </MotionCard>
          </Fade>
        </Grid>

        {/* Analytics Dashboard */}
        <Grid item xs={12} lg={8}>
          <Fade in timeout={800}>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ boxShadow: theme.shadows[12] }}
              sx={{
                borderRadius: 4,
                boxShadow: theme.shadows[8],
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                minHeight: '500px',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.success.main, width: 48, height: 48 }}>
                      <AnalyticsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Appointment Analytics
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Key performance metrics and insights
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <AppointmentAnalyticsDashboard />
              </CardContent>
            </MotionCard>
          </Fade>
        </Grid>

        {/* Pharmacist Schedule */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={1000}>
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ boxShadow: theme.shadows[12] }}
              sx={{
                borderRadius: 4,
                boxShadow: theme.shadows[8],
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.info.main, width: 48, height: 48 }}>
                      <ScheduleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Schedule Management
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pharmacist availability and schedules
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                <PharmacistScheduleView />
              </CardContent>
            </MotionCard>
          </Fade>
        </Grid>

        {/* Capacity Utilization Chart */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1200}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ boxShadow: theme.shadows[12] }}
              sx={{
                borderRadius: 4,
                boxShadow: theme.shadows[8],
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 44, height: 44 }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        Capacity Utilization
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Track appointment slot usage
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Box>
              <CardContent sx={{ p: 2.5, flex: 1, overflow: 'hidden' }}>
                <Box sx={{ height: '100%' }}>
                  <CapacityUtilizationChart />
                </Box>
              </CardContent>
            </MotionCard>
          </Fade>
        </Grid>

        {/* Reminder Effectiveness Chart */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1400}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ boxShadow: theme.shadows[12] }}
              sx={{
                borderRadius: 4,
                boxShadow: theme.shadows[8],
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 44, height: 44 }}>
                      <NotificationsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        Reminder Effectiveness
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Track reminder success rates
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Box>
              <CardContent sx={{ p: 2.5, flex: 1, overflow: 'hidden' }}>
                <Box sx={{ height: '100%' }}>
                  <ReminderEffectivenessChart />
                </Box>
              </CardContent>
            </MotionCard>
          </Fade>
        </Grid>
      </Grid>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={createAppointmentOpen}
        onClose={() => setCreateAppointmentOpen(false)}
      />
    </Box>
  );
};

export default AppointmentManagement;
