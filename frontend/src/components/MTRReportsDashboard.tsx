import { Button, Label, Card, CardContent, Select, Tooltip, Spinner, Alert, Tabs } from '@/components/ui/button';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
}
const MTRReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<ReportFilters>({ 
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')}
  });
  const [showFilters, setShowFilters] = useState(false);
  // Query hooks
  const summaryQuery = useMTRSummaryReport(filters);
  const interventionQuery = useInterventionEffectivenessReport(filters);
  const pharmacistQuery = usePharmacistPerformanceReport(filters);
  const qualityQuery = useQualityAssuranceReport(filters);
  const outcomeQuery = useOutcomeMetricsReport(filters);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const handleFilterChange = (field: keyof ReportFilters, value: unknown) => {
    setFilters((prev) => ({ 
      ...prev,
      [field]: value}
    }));
  };
  const handleDateRangePreset = (
    preset: 'week' | 'month' | 'quarter' | 'year'
  ) => {
    const endDate = new Date();
    let startDate: Date;
    switch (preset) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 3);
    }
    setFilters((prev) => ({ 
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')}
    }));
  };
  const refreshAllReports = () => {
    summaryQuery.refetch();
    interventionQuery.refetch();
    pharmacistQuery.refetch();
    qualityQuery.refetch();
    outcomeQuery.refetch();
  };
  const exportReport = (reportType: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting ${reportType} report`);
  };
  const renderFilters = () => (
    <Card className="">
      <CardContent>
        <div className="">
          <FilterIcon className="" />
          <div >Report Filters</div>
          <div className="">
            <Button
              
              size="small"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
        {showFilters && (
          <>
            <FixedGrid container spacing={2} className="">
              <FixedGrid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={
                      filters.startDate ? new Date(filters.startDate) : null}
                    }
                    onChange={(date) =>
                      handleFilterChange(
                        'startDate',
                        date ? format(date, 'yyyy-MM-dd') : ''
                      )}
                    }
                    slotProps={{}
                      textField: { size: 'small', fullWidth: true },
                  />
                </LocalizationProvider>
              </FixedGrid>
              <FixedGrid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate ? new Date(filters.endDate) : null}
                    onChange={(date) =>
                      handleFilterChange(
                        'endDate',
                        date ? format(date, 'yyyy-MM-dd') : ''
                      )}
                    }
                    slotProps={{}
                      textField: { size: 'small', fullWidth: true },
                  />
                </LocalizationProvider>
              </FixedGrid>
              <FixedGrid item xs={12} sm={6} md={3}>
                <div fullWidth size="small">
                  <Label>Review Type</Label>
                  <Select
                    value={filters.reviewType || ''}
                    label="Review Type"
                    onChange={(e) =>
                      handleFilterChange('reviewType', e.target.value)}
                    }
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="initial">Initial</MenuItem>
                    <MenuItem value="follow_up">Follow-up</MenuItem>
                    <MenuItem value="annual">Annual</MenuItem>
                    <MenuItem value="targeted">Targeted</MenuItem>
                  </Select>
                </div>
              </FixedGrid>
              <FixedGrid item xs={12} sm={6} md={3}>
                <div fullWidth size="small">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority || ''}
                    label="Priority"
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)}
                    }
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high_risk">High Risk</MenuItem>
                  </Select>
                </div>
              </FixedGrid>
            </FixedGrid>
            <div className="">
              <Button
                size="small"
                
                onClick={() => handleDateRangePreset('week')}
              >
                Last Week
              </Button>
              <Button
                size="small"
                
                onClick={() => handleDateRangePreset('month')}
              >
                Last Month
              </Button>
              <Button
                size="small"
                
                onClick={() => handleDateRangePreset('quarter')}
              >
                Last Quarter
              </Button>
              <Button
                size="small"
                
                onClick={() => handleDateRangePreset('year')}
              >
                Last Year
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
  const renderSummaryReport = () => {
    if (summaryQuery.isLoading) {
      return (
        <div className="">
          <Spinner />
        </div>
      );
    }
    if (summaryQuery.error) {
      return (
        <Alert severity="error" className="">
          Failed to load summary report: {summaryQuery.error.message}
        </Alert>
      );
    }
    const data = summaryQuery.data?.data as MTRSummaryReport;
    if (!data) return null;
    const statusData = [
      {
        name: 'Completed',
        value: data.summary.completedReviews,
        color: '#4CAF50',
      },
      {
        name: 'In Progress',
        value: data.summary.inProgressReviews,
        color: '#2196F3',
      },
      { name: 'On Hold', value: data.summary.onHoldReviews, color: '#FF9800' },
      {
        name: 'Cancelled',
        value: data.summary.cancelledReviews,
        color: '#F44336',
      },
    ];
    return (
      <FixedGrid container spacing={3}>
        {/* Key Metrics */}
        <FixedGrid item xs={12}>
          <FixedGrid container spacing={2}>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Total Reviews
                  </div>
                  <div >
                    {data.summary.totalReviews}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Completion Rate
                  </div>
                  <div  color="primary">
                    {data.summary.completionRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Avg Completion Time
                  </div>
                  <div >
                    {data.summary.avgCompletionTime.toFixed(1)} days
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Problems Resolved
                  </div>
                  <div  color="success.main">
                    {data.summary.totalProblemsResolved}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
          </FixedGrid>
        </FixedGrid>
        {/* Status Distribution */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Review Status Distribution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Monthly Trends */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Monthly Review Trends
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={(value) => `${value.month}/${value.year}`}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalReviews"
                    stroke="#8884d8"
                    name="Total Reviews"
                  />
                  <Line
                    type="monotone"
                    dataKey="completedReviews"
                    stroke="#82ca9d"
                    name="Completed Reviews"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Review Type Distribution */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Review Type Distribution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.distributions.reviewType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Priority Distribution */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Priority Distribution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.distributions.priority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
      </FixedGrid>
    );
  };
  const renderInterventionReport = () => {
    if (interventionQuery.isLoading) {
      return (
        <div className="">
          <Spinner />
        </div>
      );
    }
    if (interventionQuery.error) {
      return (
        <Alert severity="error" className="">
          Failed to load intervention report: {interventionQuery.error.message}
        </Alert>
      );
    }
    const data = interventionQuery.data
      ?.data as InterventionEffectivenessReport;
    if (!data) return null;
    return (
      <FixedGrid container spacing={3}>
        {/* Key Metrics */}
        <FixedGrid item xs={12}>
          <FixedGrid container spacing={2}>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Total Interventions
                  </div>
                  <div >
                    {data.summary.totalInterventions}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Acceptance Rate
                  </div>
                  <div  color="primary">
                    {data.summary.overallAcceptanceRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Accepted
                  </div>
                  <div  color="success.main">
                    {data.summary.acceptedInterventions}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Pending
                  </div>
                  <div  color="warning.main">
                    {data.summary.pendingInterventions}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
          </FixedGrid>
        </FixedGrid>
        {/* Effectiveness by Type */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Effectiveness by Intervention Type
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.effectiveness.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="acceptanceRate"
                    fill="#8884d8"
                    name="Acceptance Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Effectiveness by Category */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Effectiveness by Category
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.effectiveness.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="acceptanceRate"
                    fill="#82ca9d"
                    name="Acceptance Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Pharmacist Performance */}
        <FixedGrid item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Pharmacist Intervention Performance
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.pharmacistPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pharmacistName" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="totalInterventions"
                    fill="#8884d8"
                    name="Total Interventions"
                  />
                  <Bar
                    dataKey="acceptanceRate"
                    fill="#82ca9d"
                    name="Acceptance Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
      </FixedGrid>
    );
  };
  const renderPharmacistReport = () => {
    if (pharmacistQuery.isLoading) {
      return (
        <div className="">
          <Spinner />
        </div>
      );
    }
    if (pharmacistQuery.error) {
      return (
        <Alert severity="error" className="">
          Failed to load pharmacist report: {pharmacistQuery.error.message}
        </Alert>
      );
    }
    const data = pharmacistQuery.data?.data as PharmacistPerformanceReport;
    if (!data) return null;
    return (
      <FixedGrid container spacing={3}>
        {/* Summary */}
        <FixedGrid item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Performance Summary
              </div>
              <FixedGrid container spacing={2}>
                <FixedGrid item xs={12} sm={4}>
                  <div color="textSecondary">
                    Total Pharmacists: {data.summary.totalPharmacists}
                  </div>
                </FixedGrid>
                <FixedGrid item xs={12} sm={4}>
                  <div color="textSecondary">
                    Average Quality Score:{' '}
                    {data.summary.avgQualityScore.toFixed(1)}
                  </div>
                </FixedGrid>
                <FixedGrid item xs={12} sm={4}>
                  <div color="textSecondary">
                    Top Performer:{' '}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.summary as Record<string, any>)?.topPerformer
                      ?.pharmacistName || 'N/A'}
                  </div>
                </FixedGrid>
              </FixedGrid>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Quality Scores */}
        <FixedGrid item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Pharmacist Quality Scores
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.pharmacistPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pharmacistName" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="qualityScore"
                    fill="#8884d8"
                    name="Quality Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Performance Metrics */}
        <FixedGrid item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Detailed Performance Metrics
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.pharmacistPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pharmacistName" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="completionRate"
                    fill="#8884d8"
                    name="Completion Rate %"
                  />
                  <Bar
                    dataKey="problemResolutionRate"
                    fill="#82ca9d"
                    name="Problem Resolution Rate %"
                  />
                  <Bar
                    dataKey="interventionAcceptanceRate"
                    fill="#ffc658"
                    name="Intervention Acceptance Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
      </FixedGrid>
    );
  };
  const renderQualityReport = () => {
    if (qualityQuery.isLoading) {
      return (
        <div className="">
          <Spinner />
        </div>
      );
    }
    if (qualityQuery.error) {
      return (
        <Alert severity="error" className="">
          Failed to load quality report: {qualityQuery.error.message}
        </Alert>
      );
    }
    const data = qualityQuery.data?.data as QualityAssuranceReport;
    if (!data) return null;
    return (
      <FixedGrid container spacing={3}>
        {/* Quality Metrics */}
        <FixedGrid item xs={12}>
          <FixedGrid container spacing={2}>
            <FixedGrid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Plan Completion Rate
                  </div>
                  <div  color="primary">
                    {data.qualityMetrics.avgPlanCompletionRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Follow-up Compliance
                  </div>
                  <div  color="success.main">
                    {data.qualityMetrics.avgFollowUpCompliance.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Problem Resolution Rate
                  </div>
                  <div  color="warning.main">
                    {data.qualityMetrics.avgProblemResolutionRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
          </FixedGrid>
        </FixedGrid>
        {/* Completion Time Analysis */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Completion Time by Priority
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.completionTimeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="avgCompletionTime"
                    fill="#8884d8"
                    name="Avg Days"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Problem Patterns */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Problem Resolution Patterns
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.problemPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={(value) =>}
                      `${value.category}-${value.severity}`
                    }
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="resolutionRate"
                    fill="#82ca9d"
                    name="Resolution Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Documentation Quality */}
        <FixedGrid item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Documentation Quality Metrics
              </div>
              <FixedGrid container spacing={2}>
                <FixedGrid item xs={12} sm={3}>
                  <div color="textSecondary">
                    Total Reviews: {data.documentationQuality.totalReviews}
                  </div>
                </FixedGrid>
                <FixedGrid item xs={12} sm={3}>
                  <div color="textSecondary">
                    Complete Plans:{' '}
                    {data.documentationQuality.planCompletionRate.toFixed(1)}%
                  </div>
                </FixedGrid>
                <FixedGrid item xs={12} sm={3}>
                  <div color="textSecondary">
                    Medication Documentation:{' '}
                    {data.documentationQuality.medicationDocumentationRate.toFixed(
                      1
                    )}
                    %
                  </div>
                </FixedGrid>
                <FixedGrid item xs={12} sm={3}>
                  <div color="textSecondary">
                    Problem Identification:{' '}
                    {data.documentationQuality.problemIdentificationRate.toFixed(
                      1
                    )}
                    %
                  </div>
                </FixedGrid>
              </FixedGrid>
            </CardContent>
          </Card>
        </FixedGrid>
      </FixedGrid>
    );
  };
  const renderOutcomeReport = () => {
    if (outcomeQuery.isLoading) {
      return (
        <div className="">
          <Spinner />
        </div>
      );
    }
    if (outcomeQuery.error) {
      return (
        <Alert severity="error" className="">
          Failed to load outcome report: {outcomeQuery.error.message}
        </Alert>
      );
    }
    const data = outcomeQuery.data?.data as OutcomeMetricsReport;
    if (!data) return null;
    return (
      <FixedGrid container spacing={3}>
        {/* Key Outcomes */}
        <FixedGrid item xs={12}>
          <FixedGrid container spacing={2}>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Problems Resolved
                  </div>
                  <div  color="success.main">
                    {data.summary.totalProblemsResolved}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Medications Optimized
                  </div>
                  <div  color="primary">
                    {data.summary.totalMedicationsOptimized}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Adherence Improved
                  </div>
                  <div  color="info.main">
                    {data.summary.adherenceImprovementRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
            <FixedGrid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <div color="textSecondary" gutterBottom>
                    Cost Savings
                  </div>
                  <div  color="warning.main">
                    ${data.summary.totalCostSavings?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
            </FixedGrid>
          </FixedGrid>
        </FixedGrid>
        {/* Outcomes by Review Type */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Outcomes by Review Type
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.outcomesByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="avgProblemsResolved"
                    fill="#8884d8"
                    name="Avg Problems Resolved"
                  />
                  <Bar
                    dataKey="avgMedicationsOptimized"
                    fill="#82ca9d"
                    name="Avg Medications Optimized"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
        {/* Monthly Outcome Trends */}
        <FixedGrid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Monthly Outcome Trends
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={(value) => `${value.month}/${value.year}`}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalProblemsResolved"
                    stroke="#8884d8"
                    name="Problems Resolved"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMedicationsOptimized"
                    stroke="#82ca9d"
                    name="Medications Optimized"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FixedGrid>
      </FixedGrid>
    );
  };
  return (
    <div className="">
      {/* Header */}
      <div
        className=""
      >
        <div  component="h1">
          MTR Reports & Analytics
        </div>
        <div className="">
          <Tooltip title="Refresh All Reports">
            <IconButton onClick={refreshAllReports}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            
            startIcon={<DownloadIcon />}
            onClick={() => exportReport('all')}
          >
            Export
          </Button>
        </div>
      </div>
      {/* Filters */}
      {renderFilters()}
      {/* Tabs */}
      <div className="">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="MTR reports tabs"
          
          scrollButtons="auto"
        >
          <Tab label="Summary" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab
            label="Interventions"
            icon={<TrendingUpIcon />}
            iconPosition="start"
          />
          <Tab label="Pharmacists" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Quality" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Outcomes" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          {renderSummaryReport()}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {renderInterventionReport()}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {renderPharmacistReport()}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {renderQualityReport()}
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          {renderOutcomeReport()}
        </TabPanel>
      </div>
    </div>
  );
};
export default MTRReportsDashboard;
