import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const Reports = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate comprehensive reports and track key performance metrics
          </Typography>
        </Box>
      </Box>

      {/* Coming Soon Content */}
      <Card sx={{ textAlign: 'center', py: 8 }}>
        <CardContent>
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.light',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Advanced Reporting Coming Soon
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            We're working on comprehensive reporting features including patient
            outcomes tracking, medication adherence analytics, clinical
            documentation summaries, and practice performance metrics.
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
            <Button variant="outlined" component={Link} to="/contact">
              Request Features
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
