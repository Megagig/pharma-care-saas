import React from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme } from '@mui/material';
import ResponsiveAppointmentCalendar from '../components/appointments/ResponsiveAppointmentCalendar';
import ResponsiveFollowUpTaskList from '../components/followups/ResponsiveFollowUpTaskList';
import AppointmentAnalyticsDashboard from '../components/appointments/AppointmentAnalyticsDashboard';
import { useAuth } from '../hooks/useAuth';

/**
 * Main Patient Engagement Dashboard
 * Combines appointment management and follow-up tasks in a unified interface
 */
const PatientEngagement: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

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
          Patient Engagement & Follow-up
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage appointments, follow-up tasks, and patient engagement activities
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

        {/* Follow-up Tasks */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              height: '600px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Follow-up Tasks
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <ResponsiveFollowUpTaskList />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Summary */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              height: '600px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Analytics
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <AppointmentAnalyticsDashboard compact />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientEngagement;