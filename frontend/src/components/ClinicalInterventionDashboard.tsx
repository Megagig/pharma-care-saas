import { Button, Label, Card, CardContent, Select, Tooltip, Spinner, Alert, Separator } from '@/components/ui/button';
type DateRange = 'week' | 'month' | 'quarter' | 'year';

interface ClinicalInterventionDashboardProps {
  workplaceId?: string;
}
const ClinicalInterventionDashboard: React.FC = () => {
  const theme = useTheme();
  const { isMobile, getColumns } = useResponsive();
  // State for filters and date range
  const [dateRange, setDateRange] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');
  // Use custom hook for dashboard data management
  const {
    dashboardMetrics,
    loading,
    error,
    refreshing,
    refresh,
    isAuthenticated,
  } = useClinicalInterventionDashboard(dateRange);
  // Mobile-specific state
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({ 
    kpis: true,
    charts: false,
    recent: false}
  });
  const [showFilters, setShowFilters] = useState(false);
  // Mobile helper functions
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ 
      ...prev,
      [section]: !prev[section]}
    }));
  };
  const getResponsiveColumns = () => {
    return getColumns(1, 2, 3, 3, 4);
  };
  // KPI Card Component
  const KPICard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <Card
      className=""
    >
      <CardContent className="">
        <div
          className=""
        >
          <div
            className=""
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: isMobile ? 20 : 24 }, }}
          </div>
          <div
            variant={isMobile ? 'subtitle2' : 'h6'}
            component="div"
            className=""
          >
            {title}
          </div>
        </div>
        <div
          variant={isMobile ? 'h5' : 'h3'}
          component="div"
          className=""
        >
          {value}
        </div>
        {subtitle && (
          <div
            variant={isMobile ? 'caption' : 'body2'}
            color="text.secondary"
            className=""
          >
            {subtitle}
          </div>
        )}
        {trend && (
          <div
            className=""
          >
            <TrendingUpIcon
              className=""
            />
            <div
              
              className=""
            >
              {Math.abs(trend.value)}% vs last period
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  // Show loading spinner while loading
  if (loading && !dashboardMetrics) {
    return (
      <div
        className=""
      >
        <Spinner />
      </div>
    );
  }
  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Alert
        severity="warning"
        className=""
        action={
          <Button
            color="inherit"
            size="small"}
            onClick={() => (window.location.href = '/login')}
          >
            Login
          </Button>
        }
      >
        Please log in to access clinical interventions data.
      </Alert>
    );
  }
  if (error) {
    const isAuthError =
      error.includes('Invalid token') ||
      error.includes('Unauthorized') ||
      error.includes('401');
    return (
      <Alert
        severity={isAuthError ? 'warning' : 'error'}
        className=""
        action={
          isAuthError ? (
            <Button
              color="inherit"
              size="small"}
              onClick={() => (window.location.href = '/login')}
            >
              Login
            </Button>
          ) : (
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          )
        }
      >
        {isAuthError
          ? 'Please log in to access clinical interventions data.'
          : `Error loading dashboard: ${error}`}
      </Alert>
    );
  }
  if (!dashboardMetrics) {
    return (
      <Alert severity="info" className="">
        No dashboard data available
      </Alert>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <div
        className=""
      >
        <div
          variant={isMobile ? 'h5' : 'h4'}
          component="h1"
          className=""
        >
          <DashboardIcon className="" />
          {isMobile ? 'Interventions' : 'Clinical Interventions Dashboard'}
        </div>
        {isMobile ? (
          <div>
            <Button
              fullWidth
              
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              className=""
            >
              Filters & Actions
            </Button>
            <Collapse in={showFilters}>
              <div className="">
                <div size="small" fullWidth>
                  <Label>Time Period</Label>
                  <Select
                    value={dateRange}
                    label="Time Period"
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                  >
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="quarter">Last Quarter</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                  </Select>
                </div>
                <div className="">
                  <Button
                    
                    startIcon={<RefreshIcon />}
                    onClick={refresh}
                    disabled={refreshing}
                    size="small"
                    className=""
                  >
                    Refresh
                  </Button>
                  <Button
                    
                    startIcon={<GetAppIcon />}
                    
                    size="small"
                    className=""
                  >
                    Export
                  </Button>
                </div>
              </div>
            </Collapse>
          </div>
        ) : (
          <div className="">
            <div size="small" className="">
              <Label>Time Period</Label>
              <Select
                value={dateRange}
                label="Time Period"
                onChange={(e) => setDateRange(e.target.value as DateRange)}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </div>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={refresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              
              startIcon={<GetAppIcon />}
              >
              Export
            </Button>
          </div>
        )}
      </div>
      {/* KPI Cards */}
      {isMobile ? (
        <div className="">
          <div
            className=""
            onClick={() => toggleSection('kpis')}
          >
            <div
              
              className=""
            >
              <AssessmentIcon color="primary" />
              Key Metrics
            </div>
            {expandedSections.kpis ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          <Collapse in={expandedSections.kpis}>
            <div
              className=""
            >
              <KPICard
                title="Total"
                value={dashboardMetrics.totalInterventions}
                subtitle="All interventions"
                icon={<AssessmentIcon />}
                color={theme.palette.primary.main}
              />
              <KPICard
                title="Active"
                value={dashboardMetrics.activeInterventions}
                subtitle="In progress"
                icon={<ScheduleIcon />}
                color={theme.palette.info.main}
              />
              <KPICard
                title="Success Rate"
                value={`${Math.round(dashboardMetrics.successRate || 0)}%`}
                subtitle="Completed successfully"
                icon={<CheckCircleIcon />}
                color={theme.palette.success.main}
              />
              <KPICard
                title="Avg Time"
                value={`${Math.round(
                  dashboardMetrics.averageResolutionTime || 0}
                )}d`}
                subtitle="Resolution time"
                icon={<TrendingUpIcon />}
                color={theme.palette.warning.main}
              />
              <KPICard
                title="Savings"
                value={`${(
                  (dashboardMetrics.totalCostSavings || 0) / 1000}
                ).toFixed(0)}K`}
                subtitle="Cost savings"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
              />
              <KPICard
                title="Overdue"
                value={dashboardMetrics.overdueInterventions}
                subtitle="Need attention"
                icon={<WarningIcon />}
                color={theme.palette.error.main}
              />
            </div>
          </Collapse>
        </div>
      ) : (
        <div
          className="">
          <KPICard
            title="Total Interventions"
            value={dashboardMetrics.totalInterventions}
            subtitle="All time interventions"
            icon={<AssessmentIcon />}
            color={theme.palette.primary.main}
          />
          <KPICard
            title="Active Interventions"
            value={dashboardMetrics.activeInterventions}
            subtitle="Currently in progress"
            icon={<ScheduleIcon />}
            color={theme.palette.info.main}
          />
          <KPICard
            title="Success Rate"
            value={`${Math.round(dashboardMetrics.successRate || 0)}%`}
            subtitle="Completed successfully"
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
          />
          <KPICard
            title="Avg Resolution Time"
            value={`${Math.round(
              dashboardMetrics.averageResolutionTime || 0}
            )} days`}
            subtitle="Time to completion"
            icon={<TrendingUpIcon />}
            color={theme.palette.warning.main}
          />
          <KPICard
            title="Cost Savings"
            value={`₦${(
              dashboardMetrics.totalCostSavings || 0}
            ).toLocaleString()}`}
            subtitle="Estimated savings"
            icon={<TrendingUpIcon />}
            color={theme.palette.success.main}
          />
          <KPICard
            title="Overdue Items"
            value={dashboardMetrics.overdueInterventions}
            subtitle="Require attention"
            icon={<WarningIcon />}
            color={theme.palette.error.main}
          />
        </div>
      )}
      {/* Charts Section */}
      {isMobile ? (
        <div className="">
          <div
            className=""
            onClick={() => toggleSection('charts')}
          >
            <div
              
              className=""
            >
              <TrendingUpIcon color="primary" />
              Charts & Analytics
            </div>
            {expandedSections.charts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          <Collapse in={expandedSections.charts}>
            <div className="">
              {/* Mobile Monthly Trends Chart */}
              <Card>
                <CardContent className="">
                  <div
                    
                    gutterBottom
                    className=""
                  >
                    <TrendingUpIcon />
                    Volume Trends
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dashboardMetrics.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis  />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        name="Total"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* Mobile Priority Distribution */}
              <Card>
                <CardContent className="">
                  <div
                    
                    gutterBottom
                    className=""
                  >
                    <AssessmentIcon />
                    Priority Distribution
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboardMetrics.priorityDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(dashboardMetrics.priorityDistribution || []).map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </Collapse>
        </div>
      ) : (
        <div
          className="">
          {/* Monthly Trends Chart */}
          <Card>
            <CardContent>
              <div
                
                gutterBottom
                className=""
              >
                <TrendingUpIcon />
                Intervention Volume Trends
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardMetrics.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    name="Total Interventions"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Priority Distribution Pie Chart */}
          <Card>
            <CardContent>
              <div
                
                gutterBottom
                className=""
              >
                <AssessmentIcon />
                Priority Distribution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardMetrics.priorityDistribution}
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
                    {(dashboardMetrics.priorityDistribution || []).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      )
                    )}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Category Distribution and Success Rate - Desktop Only */}
      {!isMobile && (
        <div
          className="">
          {/* Category Distribution Bar Chart */}
          <Card>
            <CardContent>
              <div
                
                gutterBottom
                className=""
              >
                <AssessmentIcon />
                Category Breakdown
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardMetrics.categoryDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Success Rate by Category */}
          <Card>
            <CardContent>
              <div
                
                gutterBottom
                className=""
              >
                <CheckCircleIcon />
                Success Rate by Category
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardMetrics.categoryDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                  />
                  <Bar
                    dataKey="successRate"
                    fill={theme.palette.success.main}
                    name="Success Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Recent Interventions List */}
      {isMobile ? (
        <div className="">
          <div
            className=""
            onClick={() => toggleSection('recent')}
          >
            <div
              
              className=""
            >
              <ScheduleIcon color="primary" />
              Recent Interventions
            </div>
            {expandedSections.recent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          <Collapse in={expandedSections.recent}>
            <div className="">
              {(dashboardMetrics.recentInterventions || [])
                .slice(0, 5)
                .map((intervention) => (
                  <Card key={intervention._id} className="">
                    <div className="">
                      <div
                        className=""
                      >
                        <div  fontWeight="medium">
                          {intervention.interventionNumber}
                        </div>
                        <IconButton
                          size="small"
                          >
                          <VisibilityIcon className="" />
                        </IconButton>
                      </div>
                      <div
                        className=""
                      >
                        <Chip
                          label={intervention.category.replace('_', ' ')}
                          size="small"
                          
                          className=""
                        />
                        <Chip
                          label={intervention.priority}
                          size="small"
                          color={
                            intervention.priority === 'critical'
                              ? 'error'
                              : intervention.priority === 'high'
                              ? 'warning'
                              : intervention.priority === 'medium'
                              ? 'info'
                              : 'default'}
                          }
                          className=""
                        />
                        <Chip
                          label={intervention.status}
                          size="small"
                          color={
                            intervention.status === 'completed'
                              ? 'success'
                              : intervention.status === 'in_progress'
                              ? 'info'
                              : 'default'}
                          }
                          className=""
                        />
                      </div>
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        Patient: {intervention.patientName}
                      </div>
                      <div  color="text.secondary">
                        {formatDistanceToNow(
                          new Date(intervention.identifiedDate),
                          { addSuffix: true }
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              <Button
                
                size="small"
                fullWidth
                
                className=""
              >
                View All Interventions
              </Button>
            </div>
          </Collapse>
        </div>
      ) : (
        <Card>
          <CardContent>
            <div
              className=""
            >
              <div
                
                className=""
              >
                <ScheduleIcon />
                Recent Interventions
              </div>
              <Button
                
                size="small"
                >
                View All
              </Button>
            </div>
            <List>
              {(dashboardMetrics.recentInterventions || [])
                .slice(0, 10)
                .map((intervention, index) => (
                  <React.Fragment key={intervention._id}>
                    <div>
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div  component="span">}
                              {intervention.interventionNumber}
                            </div>
                            <Chip
                              label={intervention.category.replace('_', ' ')}
                              size="small"
                              
                            />
                            <Chip
                              label={intervention.priority}
                              size="small"
                              color={
                                intervention.priority === 'critical'
                                  ? 'error'
                                  : intervention.priority === 'high'
                                  ? 'warning'
                                  : intervention.priority === 'medium'
                                  ? 'info'
                                  : 'default'}
                              }
                            />
                            <Chip
                              label={intervention.status}
                              size="small"
                              color={
                                intervention.status === 'completed'
                                  ? 'success'
                                  : intervention.status === 'in_progress'
                                  ? 'info'
                                  : 'default'}
                              }
                            />
                          </div>
                        }
                        secondary={
                          <div>
                            <div  color="text.secondary">}
                              Patient: {intervention.patientName}
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              {formatDistanceToNow(
                                new Date(intervention.identifiedDate),
                                { addSuffix: true }
                              )}
                              {intervention.assignedTo &&
                                ` • Assigned to: ${intervention.assignedTo}`}
                            </div>
                          </div>
                        }
                      />
                      <divSecondaryAction>
                        <Tooltip title="View Details">
                          <IconButton
                            edge="end"
                            >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </div>
                    {index <
                      (dashboardMetrics.recentInterventions || []).length -
                        1 && <Separator />}
                  </React.Fragment>
                ))}
              {(dashboardMetrics.recentInterventions || []).length === 0 && (
                <div className="">
                  <InfoIcon
                    className=""
                  />
                  <div  color="text.secondary">
                    No recent interventions found
                  </div>
                </div>
              )}
            </List>
          </CardContent>
        </Card>
      )}
      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add intervention"
          className=""
          >
          <AddIcon />
        </Fab>
      )}
    </div>
  );
};
export default ClinicalInterventionDashboard;
