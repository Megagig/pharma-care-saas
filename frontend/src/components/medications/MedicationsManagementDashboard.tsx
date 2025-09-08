import {
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { People as PeopleIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import MedicationChart from './MedicationChart';

interface DashboardStats {
  activeMedications: number;
  averageAdherence: number;
  interactionAlerts: number;
}

interface RecentPatient {
  id: string;
  name: string;
  medicationCount: number;
  lastUpdate: string;
}

interface AdherenceTrend {
  name: string;
  adherence: number;
}

const MedicationsManagementDashboard = () => {
  // Fetch dashboard statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['medicationDashboardStats'],
    queryFn: async () => {
      const response = await axios.get<{
        success: boolean;
        data: DashboardStats;
      }>('/api/medication-management/dashboard/stats');
      return response.data.data;
    },
  });

  // Fetch recent patients with medications
  const {
    data: patientsData,
    isLoading: patientsLoading,
    error: patientsError,
  } = useQuery({
    queryKey: ['recentPatientsWithMedications'],
    queryFn: async () => {
      const response = await axios.get<{
        success: boolean;
        data: RecentPatient[];
      }>('/api/medication-management/dashboard/recent-patients');
      return response.data.data;
    },
  });

  // Fetch adherence trends data for chart
  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['medicationAdherenceTrends'],
    queryFn: async () => {
      const response = await axios.get<{
        success: boolean;
        data: AdherenceTrend[];
      }>('/api/medication-management/dashboard/adherence-trends');
      return response.data.data;
    },
  });

  return (
    <Box>
      {/* Show error alert if any API call fails */}
      {(statsError || patientsError || trendsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          There was an error loading the dashboard data. Please try refreshing
          the page.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Medications
              </Typography>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <>
                  <Typography variant="h3">
                    {statsData?.activeMedications || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Across all patients
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Adherence
              </Typography>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <>
                  <Typography variant="h3">
                    {statsData?.averageAdherence || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on refill patterns
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interaction Alerts
              </Typography>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <>
                  <Typography variant="h3">
                    {statsData?.interactionAlerts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requiring attention
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Medication Adherence Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              {trendsLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : trendsError ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="error">
                    Failed to load chart data
                  </Typography>
                </Box>
              ) : (
                <MedicationChart data={trendsData || []} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Patients */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Recent Patients</Typography>
              <Button component={Link} to="/patients" size="small">
                View All
              </Button>
            </Box>

            {patientsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : patientsError ? (
              <Alert severity="error">Failed to load recent patients</Alert>
            ) : patientsData && patientsData.length > 0 ? (
              patientsData.map((patient) => (
                <Card key={patient.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          <PeopleIcon sx={{ color: 'primary.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {patient.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patient.medicationCount} medications •{' '}
                            {patient.lastUpdate}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        component={Link}
                        to={`/patients/${patient.id}/medications`}
                        size="small"
                        variant="outlined"
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert severity="info">No recent patients with medications</Alert>
            )}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/patients?for=medications"
              >
                Select Patient
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicationsManagementDashboard;
