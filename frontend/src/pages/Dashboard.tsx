import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Button,
  Paper,
  LinearProgress,
  Container,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MoreHoriz as MoreHorizIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useDashboardData } from '../stores/hooks';
import { useUIStore } from '../stores';

const Dashboard = () => {
  // Use Zustand stores for real data
  const dashboardData = useDashboardData();
  const notifications = useUIStore((state) => state.notifications);

  // Commented out automatic data sync to prevent 401 errors and infinite loops
  // useEffect(() => {
  //   syncAllData();
  // }, [syncAllData]);

  // TODO: Add manual refresh functionality or fetch data when needed

  // Dynamic stats based on real data from Zustand stores - memoized to prevent re-renders
  const stats = useMemo(
    () => [
      {
        title: 'Total Patients',
        value: dashboardData.totalPatients.toString(),
        change: '+12%', // You can calculate this based on historical data
        changeType: 'increase',
        icon: PeopleIcon,
        color: 'primary',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        progress: Math.min((dashboardData.totalPatients / 200) * 100, 100), // Assuming 200 is max
      },
      {
        title: 'Clinical Notes',
        value: dashboardData.totalNotes.toString(),
        change: '+18%',
        changeType: 'increase',
        icon: DescriptionIcon,
        color: 'success',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        progress: Math.min((dashboardData.totalNotes / 1000) * 100, 100), // Assuming 1000 is max
      },
      {
        title: 'Active Medications',
        value: dashboardData.activeMedications.toString(),
        change: '+7%',
        changeType: 'increase',
        icon: MedicationIcon,
        color: 'secondary',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        progress: Math.min((dashboardData.activeMedications / 1500) * 100, 100), // Assuming 1500 is max
      },
      {
        title: 'Adherence Rate',
        value: '84.2%', // This could be calculated from medication data
        change: '+2.1%',
        changeType: 'increase',
        icon: TrendingUpIcon,
        color: 'warning',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        progress: 84,
      },
    ],
    [dashboardData]
  );

  // Use real recent patients data from Zustand store - memoized to prevent re-renders
  const recentPatients = useMemo(() => {
    // Safety check for undefined patients
    if (
      !dashboardData.recentPatients ||
      dashboardData.recentPatients.length === 0
    ) {
      return [];
    }

    return dashboardData.recentPatients
      .map((patient) => {
        // Safety checks for patient properties
        if (!patient) return null;

        return {
          name: `${patient.firstName || 'Unknown'} ${
            patient.lastName || 'Patient'
          }`,
          age: patient.dateOfBirth
            ? new Date().getFullYear() -
              new Date(patient.dateOfBirth).getFullYear()
            : 'N/A',
          condition: patient.medicalHistory || 'General Care',
          lastVisit: patient.updatedAt
            ? new Date(patient.updatedAt).toLocaleDateString()
            : 'N/A',
          avatar:
            (patient.firstName && patient.firstName.charAt(0).toUpperCase()) ||
            'P',
          status: 'active',
        };
      })
      .filter(
        (patient): patient is NonNullable<typeof patient> => patient !== null
      ); // Type-safe filter
  }, [dashboardData.recentPatients]);

  // Convert notifications from Zustand store to alerts format - memoized to prevent re-renders
  const alerts = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return [];
    }

    return notifications
      .slice(0, 3)
      .map((notification) => {
        if (!notification) return null;

        return {
          type: notification.type || 'info',
          title: notification.title || 'Notification',
          message: notification.message || '',
          time: notification.timestamp
            ? new Date(notification.timestamp).toLocaleString()
            : 'N/A',
        };
      })
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null); // Type-safe filter
  }, [notifications]);

  // Example follow-ups - in a real app, this could come from appointments/medication reminders
  const followUps = [
    {
      patientName: 'Sarah Johnson',
      appointmentType: 'Blood Pressure Check',
      scheduledDate: 'Tomorrow, 10:00 AM',
      priority: 'high',
      avatar: 'S',
    },
    {
      patientName: 'Michael Chen',
      appointmentType: 'Diabetes Follow-up',
      scheduledDate: 'Dec 28, 2:30 PM',
      priority: 'medium',
      avatar: 'M',
    },
    {
      patientName: 'Emma Wilson',
      appointmentType: 'Asthma Review',
      scheduledDate: 'Dec 30, 11:15 AM',
      priority: 'low',
      avatar: 'E',
    },
    {
      patientName: 'Robert Kim',
      appointmentType: 'Medication Adjustment',
      scheduledDate: 'Jan 2, 9:00 AM',
      priority: 'medium',
      avatar: 'R',
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
        }}
      >
        {/* Modern Centered Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: '400px',
              height: '400px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                background: 'linear-gradient(45deg, #fff 30%, #e2e8f0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome back, Dr. Smith! 👋
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.95,
                mb: 3,
                fontWeight: 400,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              Here's your practice overview for today
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems="center"
              justifyContent="center"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarIcon sx={{ fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Quick Add Patient
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Centered Stats Grid */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              mb: 4,
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Practice Statistics
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 4,
              justifyContent: 'center',
            }}
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Box key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      background: stat.gradient,
                      color: 'white',
                      borderRadius: 4,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: '120px',
                        height: '120px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                      },
                    }}
                  >
                    <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                          }}
                        >
                          <IconComponent sx={{ fontSize: 32 }} />
                        </Box>
                        <Chip
                          label={stat.change}
                          size="medium"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.25)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h2"
                        component="h3"
                        sx={{
                          fontWeight: 900,
                          mb: 2,
                          fontSize: '3rem',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          opacity: 0.95,
                          mb: 3,
                          fontWeight: 500,
                        }}
                      >
                        {stat.title}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'rgba(255,255,255,0.9)',
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          display: 'block',
                          opacity: 0.8,
                          fontWeight: 500,
                        }}
                      >
                        {stat.progress}% of target
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Centered Content Sections */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 4,
            mb: 6,
          }}
        >
          {/* Enhanced Recent Patients */}
          <Box>
            <Card
              sx={{
                height: 'fit-content',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background:
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PeopleIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                      Recent Patients
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={3}>
                  {recentPatients.map((patient, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: 'rgba(248,250,252,0.8)',
                        borderRadius: 3,
                        border: '1px solid rgba(226,232,240,0.5)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          transform: 'translateX(8px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 56,
                            height: 56,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                          }}
                        >
                          {patient.avatar}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {patient.name}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Age {patient.age} • {patient.condition}
                          </Typography>
                          <Chip
                            label={`Last visit: ${patient.lastVisit}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <IconButton
                          sx={{
                            bgcolor: 'rgba(0,0,0,0.05)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
                          }}
                        >
                          <MoreHorizIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    View All Patients
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Enhanced Alerts */}
          <Box>
            <Card
              sx={{
                height: 'fit-content',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background:
                          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <NotificationsIcon
                        sx={{ color: 'white', fontSize: 24 }}
                      />
                    </Box>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                      Alerts
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={3}>
                  {alerts.map((alert, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: 'rgba(248,250,252,0.8)',
                        borderRadius: 3,
                        border: '1px solid rgba(226,232,240,0.5)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          transform: 'scale(1.02)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: `${getAlertColor(alert.type)}.main`,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {alert.type === 'warning' && (
                            <WarningIcon fontSize="small" />
                          )}
                          {alert.type === 'info' && (
                            <ScheduleIcon fontSize="small" />
                          )}
                          {alert.type === 'success' && (
                            <TrendingUpIcon fontSize="small" />
                          )}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {alert.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {alert.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            {alert.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    View All Alerts
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Today's Schedule - Third Card */}
          <Box>
            <Card
              sx={{
                height: 'fit-content',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background:
                          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                      Today's Schedule
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'rgba(248,250,252,0.8)',
                      borderRadius: 3,
                      border: '1px solid rgba(226,232,240,0.5)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        9:00 AM - 9:30 AM
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Sarah Johnson
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Blood Pressure Check
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'rgba(248,250,252,0.8)',
                      borderRadius: 3,
                      border: '1px solid rgba(226,232,240,0.5)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'warning.main',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        11:00 AM - 11:45 AM
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Michael Chen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Diabetes Consultation
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'rgba(248,250,252,0.8)',
                      borderRadius: 3,
                      border: '1px solid rgba(226,232,240,0.5)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        transform: 'scale(1.02)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'info.main',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        2:30 PM - 3:00 PM
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Emma Wilson
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Asthma Follow-up
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'rgba(248,250,252,0.8)',
                      borderRadius: 3,
                      border: '2px dashed rgba(226,232,240,0.8)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      4:00 PM - 5:00 PM
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Available Slot
                    </Typography>
                  </Paper>
                </Stack>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CalendarIcon />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    View Full Schedule
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Follow-up Schedule Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              mb: 4,
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Follow-up Schedule
          </Typography>
          <Card
            sx={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      background:
                        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EventIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {followUps.map((followUp, index) => (
                  <Box key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: 'rgba(248,250,252,0.8)',
                        borderRadius: 3,
                        border: '1px solid rgba(226,232,240,0.5)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        height: '100%',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor:
                              followUp.priority === 'high'
                                ? 'error.main'
                                : followUp.priority === 'medium'
                                ? 'warning.main'
                                : 'success.main',
                            width: 56,
                            height: 56,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          {followUp.avatar}
                        </Avatar>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {followUp.patientName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {followUp.appointmentType}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <AccessTimeIcon
                            sx={{ fontSize: 18, color: 'text.secondary' }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                          >
                            {followUp.scheduledDate}
                          </Typography>
                        </Box>

                        <Chip
                          label={`${followUp.priority.toUpperCase()} PRIORITY`}
                          size="small"
                          sx={{
                            bgcolor:
                              followUp.priority === 'high'
                                ? 'error.main'
                                : followUp.priority === 'medium'
                                ? 'warning.main'
                                : 'success.main',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CalendarIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    mr: 2,
                  }}
                >
                  View Full Calendar
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    background:
                      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(168, 237, 234, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Schedule Appointment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Centered Quick Actions */}
        <Card
          sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TimelineIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{ fontWeight: 700 }}
                >
                  Quick Actions
                </Typography>
              </Box>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400 }}
              >
                Streamline your workflow with these common tasks
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 4,
                justifyContent: 'center',
              }}
            >
              <Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  sx={{
                    py: 4,
                    borderRadius: 4,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Add Patient
                </Button>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<DescriptionIcon />}
                  sx={{
                    py: 4,
                    borderRadius: 4,
                    background:
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 25px rgba(240, 147, 251, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 15px 35px rgba(240, 147, 251, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Clinical Note
                </Button>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MedicationIcon />}
                  sx={{
                    py: 4,
                    borderRadius: 4,
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 15px 35px rgba(79, 172, 254, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Add Medication
                </Button>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<TimelineIcon />}
                  sx={{
                    py: 4,
                    borderRadius: 4,
                    background:
                      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 25px rgba(250, 112, 154, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 15px 35px rgba(250, 112, 154, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  View Reports
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
