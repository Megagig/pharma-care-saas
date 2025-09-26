import { Card, CardContent, Tooltip, Progress, Avatar } from '@/components/ui/button';

interface PharmacistPerformanceTableProps {
  data: PharmacistPerformanceReport;
  loading?: boolean;
}

type SortField =
  | 'qualityScore'
  | 'completionRate'
  | 'totalReviews'
  | 'interventionAcceptanceRate';
type SortDirection = 'asc' | 'desc';

const PharmacistPerformanceTable: React.FC<PharmacistPerformanceTableProps> = ({ 
  data,
  loading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('qualityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div  gutterBottom>
            Pharmacist Performance
          </div>
          <Progress />
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data.pharmacistPerformance].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    if (score >= 60) return 'info';
    return 'error';
  };

  const getPerformanceIcon = (score: number, avgScore: number) => {
    if (score > avgScore) {
      return <TrendingUpIcon color="success" fontSize="small" />;
    } else if (score < avgScore) {
      return <TrendingDownIcon color="error" fontSize="small" />;
    }
    return null;
  };

  const renderQualityScoreBar = (score: number) => (
    <div className="">
      <div className="">
        <Progress
          
          color={getPerformanceColor(score)}
          className=""
        />
      </div>
      <div  color="textSecondary">
        {score.toFixed(0)}
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent>
        <div
          className=""
        >
          <div >Pharmacist Performance Rankings</div>
          <div className="">
            <div  color="textSecondary">
              Total Pharmacists: {data.summary.totalPharmacists}
            </div>
            <div  color="textSecondary">
              Avg Quality Score: {data.summary.avgQualityScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Top Performer Highlight */}
        {data.summary.topPerformer && (
          <div
            className=""
          >
            <StarIcon color="warning" />
            <div  color="success.contrastText">
              Top Performer: {data.summary.topPerformer.pharmacistName}
            </div>
            <Chip
              label={`Quality Score: ${
                data.summary.topPerformer.qualityScore?.toFixed(1) || 'N/A'}
              }`}
              color="warning"
              size="small"
            />
          </div>
        )}

        <TableContainer  >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Pharmacist</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'qualityScore'}
                    direction={
                      sortField === 'qualityScore' ? sortDirection : 'desc'}
                    }
                    onClick={() => handleSort('qualityScore')}
                  >
                    Quality Score
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'totalReviews'}
                    direction={
                      sortField === 'totalReviews' ? sortDirection : 'desc'}
                    }
                    onClick={() => handleSort('totalReviews')}
                  >
                    Reviews
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'completionRate'}
                    direction={
                      sortField === 'completionRate' ? sortDirection : 'desc'}
                    }
                    onClick={() => handleSort('completionRate')}
                  >
                    Completion Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'interventionAcceptanceRate'}
                    direction={
                      sortField === 'interventionAcceptanceRate'
                        ? sortDirection
                        : 'desc'}
                    }
                    onClick={() => handleSort('interventionAcceptanceRate')}
                  >
                    Intervention Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell>Efficiency</TableCell>
                <TableCell>Problems Resolved</TableCell>
                <TableCell>Cost Savings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((pharmacist, index) => (
                <TableRow
                  key={pharmacist._id}
                  className="">
                  <TableCell>
                    <div className="">
                      {index + 1}
                      {index === 0 && (
                        <StarIcon color="warning" className="" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="">
                      <Avatar
                        className=""
                      >
                        {pharmacist.pharmacistName.charAt(0)}
                      </Avatar>
                      <div >
                        {pharmacist.pharmacistName}
                      </div>
                      {getPerformanceIcon(
                        pharmacist.qualityScore,
                        data.summary.avgQualityScore
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {renderQualityScoreBar(pharmacist.qualityScore)}
                  </TableCell>

                  <TableCell>
                    <div>
                      <div >
                        {pharmacist.totalReviews}
                      </div>
                      <div  color="textSecondary">
                        ({pharmacist.completedReviews} completed)
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={`${pharmacist.completionRate.toFixed(1)}%`}
                      color={getPerformanceColor(pharmacist.completionRate)}
                      size="small"
                      
                    />
                  </TableCell>

                  <TableCell>
                    <div>
                      <div >
                        {pharmacist.interventionAcceptanceRate.toFixed(1)}%
                      </div>
                      <div  color="textSecondary">
                        ({pharmacist.acceptedInterventions}/
                        {pharmacist.totalInterventions})
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Tooltip
                      title={`Avg completion time: ${
                        pharmacist.avgCompletionTime?.toFixed(1) || 0}
                      } days`}
                    >
                      <Chip
                        label={`${pharmacist.efficiencyScore?.toFixed(0) || 0}`}
                        color={getPerformanceColor(
                          pharmacist.efficiencyScore || 0}
                        )}
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div  color="success.main">
                        {pharmacist.totalProblemsResolved}
                      </div>
                      <div  color="textSecondary">
                        Rate: {pharmacist.problemResolutionRate.toFixed(1)}%
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div  color="primary.main">
                      ${pharmacist.totalCostSavings?.toLocaleString() || 0}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Performance Legend */}
        <div className="">
          <div  color="textSecondary">
            Quality Score Legend:
          </div>
          <Chip label="Excellent (90+)" color="success" size="small" />
          <Chip label="Good (75-89)" color="warning" size="small" />
          <Chip label="Fair (60-74)" color="info" size="small" />
          <Chip label="Needs Improvement (<60)" color="error" size="small" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacistPerformanceTable;
