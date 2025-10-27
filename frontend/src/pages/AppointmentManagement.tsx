import React from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme } from '@mui/material';
import ResponsiveAppointmentCalendar from '../components/appointments/ResponsiveAppointmentCalendar';
import AppointmentAnalyticsDashboard from '../components/appointments/AppointmentAnalyticsDashboard';
import PharmacistScheduleView from '../components/appointments/PharmacistScheduleView';
import CapacityUtilizationChart from '../components/appointments/CapacityUtilizationChart';
import ReminderEffectivenessChart from '../components/appointments/ReminderEffectivenessChart';

/**
 * Dedicated Appointment Management Page
 * Focused on appointment scheduling, calendar management, and related analytics
 */
const AppointmentManagement: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Appointment Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule, manage, and analyze patient appointments
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Appointment Calendar - Full Width */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Appointment Calendar
              </Typography>
              <ResponsiveAppointmentCalendar />
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Dashboard */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Appointment Analytics
              </Typography>
              <AppointmentAnalyticsDashboard />
            </CardContent>
          </Card>
        </Grid>

        {/* Pharmacist Schedule */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              height: '500px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Schedule Management
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <PharmacistScheduleView />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacity Utilization */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              height: '400px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Capacity Utilization
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <CapacityUtilizationChart />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reminder Effectiveness */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              height: '400px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Reminder Effectiveness
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <ReminderEffectivenessChart />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentManagement;