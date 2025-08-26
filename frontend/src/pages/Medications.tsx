import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { Medication as MedicationIcon } from '@mui/icons-material';

const Medications = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Medications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage patient medications, interactions, and adherence tracking
          </Typography>
        </Box>
      </Box>

      <Card sx={{ textAlign: 'center', py: 8 }}>
        <CardContent>
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'secondary.light',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <MedicationIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Medication Management System Coming Soon
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Advanced medication tracking, drug interaction checking, adherence
            monitoring, and prescription management features are in development.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="contained" component={Link} to="/dashboard">
              Back to Dashboard
            </Button>
            <Button variant="outlined" component={Link} to="/patients">
              View Patients
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Medications;
