import { Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
          <h1 className="text-3xl font-semibold mb-2">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and track key performance metrics
          </p>
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
          <h2 className="text-2xl font-semibold mb-4">
            Advanced Reporting Coming Soon
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're working on comprehensive reporting features including patient
            outcomes tracking, medication adherence analytics, clinical
            documentation summaries, and practice performance metrics.
          </p>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="default" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Request Features</Link>
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
