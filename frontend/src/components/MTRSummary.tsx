import { Button, Card, CardContent, Alert, Separator } from '@/components/ui/button';
import { List, CheckCircleIcon, DownloadIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMTRStore } from '@/stores';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// Import store and types
// import type { MedicationTherapyReview 
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
      <div maxWidth="lg" className="">
        <div>Loading MTR summary...</div>
      </div>
    );
  }
  if (errors.general || !currentReview) {
    return (
      <div maxWidth="lg" className="">
        <Alert severity="error">
          {errors.general || 'MTR session not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOverview}
          className=""
        >
          Back to Overview
        </Button>
      </div>
    );
  }
  return (
    <div maxWidth="lg" className="">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={<NavigateNextIcon fontSize="small" />}
        className=""
      >
        <Link to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link

          to="/pharmacy/medication-therapy"
          color="inherit"
        >
          Medication Therapy Review
        </Link>
        <div color="textPrimary">
          Summary - Review #{currentReview.reviewNumber}
        </div>
      </Breadcrumbs>
      {/* Header */}
      <div
        className=""
      >
        <div>
          <div gutterBottom>
            MTR Summary
          </div>
          <div color="textSecondary">
            {selectedPatient &&
              `${selectedPatient.firstName} ${selectedPatient.lastName}`}{' '}
            • Review #{currentReview.reviewNumber} • Completed on{' '}
            {new Date(currentReview.completedAt || '').toLocaleDateString()}
          </div>
        </div>
        <div className="">
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}

          >
            Print
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}

          >
            Download
          </Button>
        </div>
      </div>
      {/* Status Chip */}
      {currentReview && currentReview.status && (
        <div className="">
          <Chip
            icon={<CheckCircleIcon />}
            label={`Status: ${currentReview.status
              .replace('_', ' ')}
              .toUpperCase()}`}
            color="success"

            size="large"
          />
        </div>
      )}
      <div container spacing={3}>
        {/* Review Overview */}
        <div item xs={12} md={6}>
          <Card>
            <CardContent>
              <div gutterBottom>
                Review Overview
              </div>
              <List dense>
                <div>
                  <div>
                    <AssignmentIcon />
                  </div>
                  <div
                    primary="Review Type"
                    secondary={
                      currentReview.reviewType
                        ?.replace('_', ' ')
                        .toUpperCase() || 'Standard'
                    }
                  />
                </div>
                <div>
                  <div>
                    <ScheduleIcon />
                  </div>
                  <div
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
                </div>
                <div>
                  <div>
                    <LocalPharmacyIcon />
                  </div>
                  <div
                    primary="Medications Reviewed"
                    secondary={`${currentReview.medications?.length || 0}
                    } medications`}
                  />
                </div>
              </List>
            </CardContent>
          </Card>
        </div>
        {/* Clinical Outcomes */}
        <div item xs={12} md={6}>
          <Card>
            <CardContent>
              <div gutterBottom>
                Clinical Outcomes
              </div>
              <List dense>
                <div>
                  <div
                    primary="Problems Identified"
                    secondary={`${identifiedProblems?.length || 0}
                    } drug therapy problems`}
                  />
                </div>
                <div>
                  <div
                    primary="Interventions Made"
                    secondary={`${interventions?.length || 0}
                    } pharmacist interventions`}
                  />
                </div>
                <div>
                  <div
                    primary="Follow-ups Scheduled"
                    secondary={`${followUps?.length || 0} follow-up activities`}
                  />
                </div>
                <div>
                  <div
                    primary="Next Review Date"
                    secondary={
                      currentReview.nextReviewDate
                        ? new Date(
                          currentReview.nextReviewDate
                        ).toLocaleDateString()
                        : 'Not scheduled'}
                    }
                  />
                </div>
              </List>
            </CardContent>
          </Card>
        </div>
        {/* Identified Problems */}
        {identifiedProblems && identifiedProblems.length > 0 && (
          <div item xs={12}>
            <Card>
              <CardContent>
                <div gutterBottom>
                  Identified Drug Therapy Problems
                </div>
                <Separator className="" />
                {identifiedProblems.map((problem, index) => (
                  <div key={problem._id || index} className="">
                    <div
                      className=""
                    >
                      <div fontWeight="bold">
                        {problem.category?.replace('_', ' ').toUpperCase()} -{' '}
                        {problem.subcategory}
                      </div>
                      <Chip
                        label={problem.severity}
                        color={
                          problem.severity === 'critical'
                            ? 'error'
                            : problem.severity === 'major'
                              ? 'warning'
                              : problem.severity === 'moderate'
                                ? 'info'
                                : 'default'}
                        }
                      size="small"
                      />
                    </div>
                    <div color="textSecondary" paragraph>
                      {problem.description}
                    </div>
                    <div >
                      <strong>Clinical Significance:</strong>{' '}
                      {problem.clinicalSignificance}
                    </div>
                    <div >
                      <strong>Status:</strong>{' '}
                      {problem.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Therapy Plan */}
        {therapyPlan && (
          <div item xs={12}>
            <Card>
              <CardContent>
                <div gutterBottom>
                  Therapy Plan & Recommendations
                </div>
                <Separator className="" />
                {therapyPlan.recommendations &&
                  therapyPlan.recommendations.length > 0 && (
                    <div className="">
                      <div

                        fontWeight="bold"
                        gutterBottom
                      >
                        Recommendations
                      </div>
                      {therapyPlan.recommendations.map((rec, index) => (
                        <div key={index} className="">
                          <div
                            className=""
                          >
                            <div fontWeight="medium">
                              {rec.type?.replace('_', ' ').toUpperCase()}
                            </div>
                            <Chip
                              label={rec.priority}
                              color={
                                rec.priority === 'high'
                                  ? 'error'
                                  : rec.priority === 'medium'
                                    ? 'warning'
                                    : 'default'}
                              }
                            size="small"
                            />
                          </div>
                          <div className="">
                            {rec.rationale}
                          </div>
                          {rec.expectedOutcome && (
                            <div

                              color="textSecondary"
                              className=""
                            >
                              <strong>Expected Outcome:</strong>{' '}
                              {rec.expectedOutcome}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                {therapyPlan.counselingPoints &&
                  therapyPlan.counselingPoints.length > 0 && (
                    <div className="">
                      <div

                        fontWeight="bold"
                        gutterBottom
                      >
                        Patient Counseling Points
                      </div>
                      <List dense>
                        {therapyPlan.counselingPoints.map((point, index) => (
                          <div key={index}>
                            <div primary={point} />
                          </div>
                        ))}
                      </List>
                    </div>
                  )}
                {therapyPlan.pharmacistNotes && (
                  <div>
                    <div

                      fontWeight="bold"
                      gutterBottom
                    >
                      Pharmacist Notes
                    </div>
                    <div >
                      {therapyPlan.pharmacistNotes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOverview}

          size="large"
        >
          Back to Overview
        </Button>
        <Button onClick={handleNewMTR} size="large">
          Start New MTR
        </Button>
      </div>
    </div>
  );
};
export default MTRSummary;
