import React, { useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  LocalPharmacy as LocalPharmacyIcon,
} from '@mui/icons-material';

// Import store and types
import { useMTRStore } from '../stores/mtrStore';
// import type { MedicationTherapyReview } from '../types/mtr';

const MTRSummary: React.FC = () => {
  const navigate = useNavigate();
  const { reviewId } = useParams<{ reviewId: string }>();

  // Store
  const {
    currentReview,
    selectedPatient,
    identifiedProblems,
    therapyPlan,
    interventions,
    followUps,
    loading,
    errors,
    loadReview,
  } = useMTRStore();

  // Load review data
  useEffect(() => {
    if (reviewId && reviewId !== currentReview?._id) {
      loadReview(reviewId);
    }
  }, [reviewId, currentReview?._id, loadReview]);

  // Handle navigation
  const handleBackToOverview = () => {
    navigate('/pharmacy/medication-therapy');
  };

  const handleNewMTR = () => {
    navigate('/pharmacy/medication-therapy/new');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log('Download MTR report');
  };

  if (loading.loadReview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading MTR summary...</Typography>
      </Container>
    );
  }

  if (errors.general || !currentReview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {errors.general || 'MTR session not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOverview}
          sx={{ mt: 2 }}
        >
          Back to Overview
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          to="/pharmacy/medication-therapy"
          color="inherit"
        >
          Medication Therapy Review
        </Link>
        <Typography color="textPrimary">
          Summary - Review #{currentReview.reviewNumber}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            MTR Summary
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {selectedPatient &&
              `${selectedPatient.firstName} ${selectedPatient.lastName}`}{' '}
            • Review #{currentReview.reviewNumber} • Completed on{' '}
            {new Date(currentReview.completedAt || '').toLocaleDateString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            variant="outlined"
          >
            Print
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="outlined"
          >
            Download
          </Button>
        </Box>
      </Box>

      {/* Status Chip */}
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<CheckCircleIcon />}
          label={`Status: ${currentReview.status
            .replace('_', ' ')
            .toUpperCase()}`}
          color="success"
          variant="outlined"
          size="large"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Review Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Overview
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Review Type"
                    secondary={
                      currentReview.reviewType
                        ?.replace('_', ' ')
                        .toUpperCase() || 'Standard'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Duration"
                    secondary={
                      currentReview.startedAt && currentReview.completedAt
                        ? `${Math.round(
                            (new Date(currentReview.completedAt).getTime() -
                              new Date(currentReview.startedAt).getTime()) /
                              (1000 * 60)
                          )} minutes`
                        : 'N/A'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalPharmacyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Medications Reviewed"
                    secondary={`${
                      currentReview.medications?.length || 0
                    } medications`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Clinical Outcomes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinical Outcomes
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Problems Identified"
                    secondary={`${
                      identifiedProblems?.length || 0
                    } drug therapy problems`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Interventions Made"
                    secondary={`${
                      interventions?.length || 0
                    } pharmacist interventions`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Follow-ups Scheduled"
                    secondary={`${followUps?.length || 0} follow-up activities`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Next Review Date"
                    secondary={
                      currentReview.nextReviewDate
                        ? new Date(
                            currentReview.nextReviewDate
                          ).toLocaleDateString()
                        : 'Not scheduled'
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Identified Problems */}
        {identifiedProblems && identifiedProblems.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Identified Drug Therapy Problems
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {identifiedProblems.map((problem, index) => (
                  <Paper key={problem._id || index} sx={{ p: 2, mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {problem.category?.replace('_', ' ').toUpperCase()} -{' '}
                        {problem.subcategory}
                      </Typography>
                      <Chip
                        label={problem.severity}
                        color={
                          problem.severity === 'critical'
                            ? 'error'
                            : problem.severity === 'major'
                            ? 'warning'
                            : problem.severity === 'moderate'
                            ? 'info'
                            : 'default'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {problem.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Clinical Significance:</strong>{' '}
                      {problem.clinicalSignificance}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      {problem.status?.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Therapy Plan */}
        {therapyPlan && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Therapy Plan & Recommendations
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {therapyPlan.recommendations &&
                  therapyPlan.recommendations.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Recommendations
                      </Typography>
                      {therapyPlan.recommendations.map((rec, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body1" fontWeight="medium">
                              {rec.type?.replace('_', ' ').toUpperCase()}
                            </Typography>
                            <Chip
                              label={rec.priority}
                              color={
                                rec.priority === 'high'
                                  ? 'error'
                                  : rec.priority === 'medium'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {rec.rationale}
                          </Typography>
                          {rec.expectedOutcome && (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mt: 1 }}
                            >
                              <strong>Expected Outcome:</strong>{' '}
                              {rec.expectedOutcome}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  )}

                {therapyPlan.counselingPoints &&
                  therapyPlan.counselingPoints.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Patient Counseling Points
                      </Typography>
                      <List dense>
                        {therapyPlan.counselingPoints.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                {therapyPlan.pharmacistNotes && (
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Pharmacist Notes
                    </Typography>
                    <Typography variant="body2">
                      {therapyPlan.pharmacistNotes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOverview}
          variant="outlined"
          size="large"
        >
          Back to Overview
        </Button>
        <Button onClick={handleNewMTR} variant="contained" size="large">
          Start New MTR
        </Button>
      </Box>
    </Container>
  );
};

export default MTRSummary;
