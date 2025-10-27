import React from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme } from '@mui/material';
import ResponsiveFollowUpTaskList from '../components/followups/ResponsiveFollowUpTaskList';
import FollowUpAnalyticsDashboard from '../components/follow-ups/FollowUpAnalyticsDashboard';

/**
 * Dedicated Follow-up Management Page
 * Focused on follow-up task management and analytics
 */
const FollowUpManagement: React.FC = () => {
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
          Follow-up Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage patient follow-up tasks and track completion metrics
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Follow-up Task List */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              minHeight: '700px',
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

        {/* Follow-up Analytics */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              background: theme.palette.background.paper,
              minHeight: '700px',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Follow-up Analytics
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <FollowUpAnalyticsDashboard />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FollowUpManagement;