import {
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { People as PeopleIcon } from '@mui/icons-material';
import MedicationChart from './MedicationChart';

const MedicationsManagementDashboard = () => {
  const recentPatients = [
    {
      id: '1',
      name: 'John Smith',
      medicationCount: 5,
      lastUpdate: '2 days ago',
    },
    { id: '2', name: 'Jane Doe', medicationCount: 3, lastUpdate: '1 week ago' },
    {
      id: '3',
      name: 'Robert Johnson',
      medicationCount: 2,
      lastUpdate: 'Today',
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Medications
              </Typography>
              <Typography variant="h3">146</Typography>
              <Typography variant="body2" color="text.secondary">
                Across all patients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Adherence
              </Typography>
              <Typography variant="h3">84%</Typography>
              <Typography variant="body2" color="text.secondary">
                Based on refill patterns
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interaction Alerts
              </Typography>
              <Typography variant="h3">12</Typography>
              <Typography variant="body2" color="text.secondary">
                Requiring attention
              </Typography>
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
              <MedicationChart />
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
            {recentPatients.map((patient) => (
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
            ))}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button variant="contained" component={Link} to="/patients">
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
