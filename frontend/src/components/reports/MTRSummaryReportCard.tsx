
import { Card, CardContent, Progress } from '@/components/ui/button';

interface MTRSummaryReportCardProps {
  data: MTRSummaryReport;
  loading?: boolean;
}

const MTRSummaryReportCard: React.FC<MTRSummaryReportCardProps> = ({ 
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div  gutterBottom>
            MTR Summary
          </div>
          <Progress />
        </CardContent>
      </Card>
    );
  }

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  const getCompletionTimeColor = (days: number) => {
    if (days <= 3) return 'success';
    if (days <= 7) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <div className="">
          <AssessmentIcon className="" />
          <div >MTR Summary Report</div>
        </div>

        <div container spacing={2}>
          {/* Total Reviews */}
          <div item xs={12} sm={6} md={3}>
            <div
              className=""
            >
              <div  color="primary.main">
                {data.summary.totalReviews}
              </div>
              <div  color="textSecondary">
                Total Reviews
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div item xs={12} sm={6} md={3}>
            <div
              className=""
            >
              <div
                className=""
              >
                <div
                  
                  color={`${getCompletionRateColor(
                    data.summary.completionRate}
                  )}.main`}
                >
                  {data.summary.completionRate.toFixed(1)}%
                </div>
                {data.summary.completionRate >= 80 ? (
                  <TrendingUpIcon color="success" className="" />
                ) : (
                  <TrendingDownIcon color="error" className="" />
                )}
              </div>
              <div  color="textSecondary">
                Completion Rate
              </div>
            </div>
          </div>

          {/* Average Completion Time */}
          <div item xs={12} sm={6} md={3}>
            <div
              className=""
            >
              <div
                
                color={`${getCompletionTimeColor(
                  data.summary.avgCompletionTime}
                )}.main`}
              >
                {data.summary.avgCompletionTime.toFixed(1)}
              </div>
              <div  color="textSecondary">
                Avg Days to Complete
              </div>
            </div>
          </div>

          {/* Problems Resolved */}
          <div item xs={12} sm={6} md={3}>
            <div
              className=""
            >
              <div  color="success.main">
                {data.summary.totalProblemsResolved}
              </div>
              <div  color="textSecondary">
                Problems Resolved
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div item xs={12}>
            <div  gutterBottom className="">
              Review Status Breakdown
            </div>
            <div className="">
              <Chip
                label={`Completed: ${data.summary.completedReviews}`}
                color="success"
                
                size="small"
              />
              <Chip
                label={`In Progress: ${data.summary.inProgressReviews}`}
                color="primary"
                
                size="small"
              />
              <Chip
                label={`On Hold: ${data.summary.onHoldReviews}`}
                color="warning"
                
                size="small"
              />
              <Chip
                label={`Cancelled: ${data.summary.cancelledReviews}`}
                color="error"
                
                size="small"
              />
            </div>
          </div>

          {/* Clinical Outcomes */}
          <div item xs={12}>
            <div  gutterBottom className="">
              Clinical Impact
            </div>
            <div container spacing={2}>
              <div item xs={12} sm={6} md={3}>
                <div  color="textSecondary">
                  Medications Optimized
                </div>
                <div  color="primary.main">
                  {data.summary.totalMedicationsOptimized}
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div  color="textSecondary">
                  Adherence Improved
                </div>
                <div  color="info.main">
                  {data.summary.adherenceImprovedCount}
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div  color="textSecondary">
                  Adverse Events Reduced
                </div>
                <div  color="warning.main">
                  {data.summary.adverseEventsReducedCount}
                </div>
              </div>
              <div item xs={12} sm={6} md={3}>
                <div  color="textSecondary">
                  Cost Savings
                </div>
                <div  color="success.main">
                  ${data.summary.totalCostSavings?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MTRSummaryReportCard;
