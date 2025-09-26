import DashboardChart from './DashboardChart';

import QuickActionCard from './QuickActionCard';
// Communication Hub Components
import CommunicationWidget from '../communication/CommunicationWidget';

import CommunicationMetrics from '../communication/CommunicationMetrics';
// All components enabled
import AdminDashboardIntegration from './AdminDashboardIntegration';

import UsageDashboard from './UsageDashboard';

import PharmacistPerformanceTable from './PharmacistPerformanceTable';

import { Button, Card, CardContent, Tooltip, Progress, Alert, Skeleton, Avatar, Separator } from '@/components/ui/button';
// Enhanced KPI Card Component
interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  loading?: boolean;
  onClick?: () => void;
}
const KPICard: React.FC<KPICardProps> = ({ 
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  loading = false,
  onClick
}) => {
  const theme = useTheme();
  return (
    <motion.div
      
      >
      <Card
        className="" 0%, ${alpha(
            color,
            0.05
          )} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          position: 'relative',
          overflow: 'visible',
          '&:hover': onClick
            ? {
                boxShadow: `0 8px 32px ${alpha(color, 0.3)}`,
                transform: 'translateY(-2px)',
              }
            : {},
        onClick={onClick}
      >
        <CardContent className="">
          {/* Background Pattern */}
          <div
            className="" ${alpha(color, 0.05)})`,
              zIndex: 0,
          />
          <div className="">
            <div
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Avatar
                className=""
              >
                {icon}
              </Avatar>
              {trend && (
                <Chip
                  icon={
                    trend.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  }
                  label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                  size="small"
                  color={trend.isPositive ? 'success' : 'error'}
                  
                />
              )}
            </div>
            <div  color="text.secondary" gutterBottom>
              {title}
            </div>
            {loading ? (
              <Skeleton  width="60%" height={48} />
            ) : (
              <div
                
                component="div"
                className=""
              >
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : value || '0'}
              </div>
            )}
            {subtitle && (
              <div  color="text.secondary">
                {subtitle}
              </div>
            )}
            {trend && (
              <div
                
                color="text.secondary"
                className=""
              >
                vs {trend.period}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
// System Health Component
const SystemHealthCard: React.FC = () => {
  const theme = useTheme();
  const [healthStatus, setHealthStatus] = useState({ 
    database: 'healthy',
    api: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms'}
  });
  return (
    <Card className="">
      <CardContent>
        <div display="flex" alignItems="center" mb={2}>
          <Avatar className="">
            <SettingsIcon />
          </Avatar>
          <div >System Health</div>
        </div>
        <div mb={2}>
          <div
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <div >Database</div>
            <Chip label="Healthy" color="success" size="small" />
          </div>
          <Progress  color="success" />
        </div>
        <div mb={2}>
          <div
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <div >API Response</div>
            <div >
              {healthStatus.responseTime}
            </div>
          </div>
          <Progress  color="info" />
        </div>
        <div display="flex" justifyContent="space-between" alignItems="center">
          <div >Uptime</div>
          <div  color="success.main">
            {healthStatus.uptime}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export const ModernDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  // Debug API endpoints and dashboard service
  useEffect(() => {
    console.log('🔍 Running API debug test...');
    testApiEndpoints();
    console.log('🔍 Running Dashboard Service test...');
    testDashboardService().catch(console.error);
  }, []);
  // Dashboard data hooks
  const {
    stats,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();
  // Chart data hooks - separate for better performance and real data
  const {
    clinicalNotesByType,
    mtrsByStatus,
    patientsByMonth,
    medicationsByStatus,
    patientAgeDistribution,
    monthlyActivity,
    loading: chartsLoading,
    error: chartsError,
    refresh: refreshCharts,
  } = useDashboardCharts();
  const {
    dashboardMetrics: clinicalMetrics,
    loading: clinicalLoading,
    error: clinicalError,
    refresh: refreshClinical,
  } = useClinicalInterventionDashboard('month');
  const {
    systemActivities,
    userActivities,
    loading: activitiesLoading,
    error: activitiesError,
    refresh: refreshActivities,
  } = useRecentActivities(10);
  const [refreshing, setRefreshing] = useState(false);
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinical();
      refreshCharts(); // Refresh chart data as well
      refreshActivities(); // Refresh activities
      // Add a small delay for better UX
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      setRefreshing(false);
    }
  };
  // Loading state - only show loading if we're actually loading and have no data at all
  if (
    dashboardLoading &&
    stats.totalPatients === 0 &&
    stats.totalClinicalNotes === 0
  ) {
    return (
      <div className="">
        <Skeleton  width="40%" height={60} className="" />
        <Skeleton  width="60%" height={30} className="" />
        <div
          className="">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="">
              <Skeleton
                
                height={160}
                className=""
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Error state
  if (dashboardError) {
    return (
      <div className="">
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          Error loading dashboard: {dashboardError}
        </Alert>
      </div>
    );
  }
  return (
    <div
      className="">
      {/* Header */}
      <motion.div
        
        >
        <div
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <div>
            <div
              variant={isMobile ? 'h4' : 'h3'}
              component="h1"
              className="">
              Pharmacare Dashboard
            </div>
            <div  color="text.secondary">
              Welcome back! Here's your healthcare system overview.
            </div>
          </div>
          <div display="flex" gap={1}>
            <Tooltip title="Refresh Dashboard">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                className="">
                <RefreshIcon
                  className=""
                      '100%': { transform: 'rotate(360deg)' },
                    },
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton
                className="">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </motion.div>
      {/* KPI Cards */}
      <motion.div
        
        >
        <div
          className="">
          <div className="">
            <KPICard
              title="Total Patients"
              value={stats.totalPatients || 0}
              subtitle="Active patients in system"
              icon={<PeopleIcon />}
              color={theme.palette.primary.main}
              
              loading={dashboardLoading}
              onClick={() => navigate('/patients')}
            />
          </div>
          <div className="">
            <KPICard
              title="Clinical Notes"
              value={stats.totalClinicalNotes || 0}
              subtitle="Total notes recorded"
              icon={<DescriptionIcon />}
              color={theme.palette.success.main}
              
              loading={dashboardLoading}
              onClick={() => navigate('/notes')}
            />
          </div>
          <div className="">
            <KPICard
              title="Medications"
              value={stats.totalMedications || 0}
              subtitle="Medication records"
              icon={<MedicationIcon />}
              color={theme.palette.warning.main}
              
              loading={dashboardLoading}
              onClick={() => navigate('/medications')}
            />
          </div>
          <div className="">
            <KPICard
              title="MTR Sessions"
              value={stats.totalMTRs || 0}
              subtitle="Medication therapy reviews"
              icon={<AssessmentIcon />}
              color={theme.palette.secondary.main}
              
              loading={dashboardLoading}
              onClick={() => navigate('/pharmacy/medication-therapy')}
            />
          </div>
          <div className="">
            <KPICard
              title="Diagnostics"
              value={stats.totalDiagnostics || 0}
              subtitle="Diagnostic tests"
              icon={<ScienceIcon />}
              color={theme.palette.error.main}
              
              loading={dashboardLoading}
              onClick={() => navigate('/pharmacy/diagnostics')}
            />
          </div>
          <div className="">
            <SystemHealthCard />
          </div>
        </div>
      </motion.div>
      {/* Charts Section */}
      <motion.div
        
        >
        {/* Charts Grid - Full Width Layout */}
        <div
          className="">
          {/* Patients by Month - Line Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width="100%" height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Patients by Month"
                data={
                  patientsByMonth.length > 0
                    ? patientsByMonth}
                    : [{ name: 'No Data', value: 0 }]
                }
                type="line"
                height={450}
                colors={[theme.palette.primary.main]}
                subtitle={`Monthly patient registration trends (${patientsByMonth.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </div>
          {/* Medications by Status - Pie Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width={300} height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Medications by Status"
                data={
                  medicationsByStatus.length > 0
                    ? medicationsByStatus
                    : [
                        {
                          name: 'No Data',
                          value: 1,
                          color: theme.palette.grey[400],}
                        },
                      ]
                }
                type="pie"
                height={450}
                colors={[
                  theme.palette.success.main,
                  theme.palette.info.main,
                  theme.palette.warning.main,
                  theme.palette.grey[400],}
                ]}
                subtitle={`Current medication status distribution (${medicationsByStatus.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total)`}
                showLegend={true}
                interactive={true}
              />
            )}
          </div>
          {/* Clinical Notes by Type - Bar Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width="100%" height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Clinical Notes by Type"
                data={clinicalNotesByType}
                type="bar"
                height={450}
                colors={[theme.palette.secondary.main]}
                subtitle={`Distribution of clinical note types (${clinicalNotesByType.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </div>
          {/* MTR Sessions by Status - Pie Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width={300} height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="MTR Sessions by Status"
                data={mtrsByStatus}
                type="pie"
                height={450}
                colors={[
                  theme.palette.warning.main,
                  theme.palette.success.main,
                  theme.palette.grey[400],
                  theme.palette.info.main,}
                ]}
                subtitle={`Medication therapy review status (${mtrsByStatus.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total)`}
                showLegend={true}
                interactive={true}
              />
            )}
          </div>
          {/* Patient Age Distribution - Bar Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width="100%" height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Patient Age Distribution"
                data={
                  patientAgeDistribution.length > 0
                    ? patientAgeDistribution}
                    : [{ name: 'No Data', value: 0 }]
                }
                type="bar"
                height={450}
                colors={[theme.palette.info.main]}
                subtitle={`Age demographics of patients (${patientAgeDistribution.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </div>
          {/* Monthly Activity Trend - Line Chart */}
          <div className="">
            {chartsLoading ? (
              <Card
                className=""
              >
                <div className="">
                  <Skeleton
                    
                    width="60%"
                    height={40}
                    className=""
                  />
                  <Skeleton  width="100%" height={300} />
                </div>
              </Card>
            ) : chartsError ? (
              <Card
                className=""
              >
                <Alert severity="error">
                  Error loading chart: {chartsError}
                </Alert>
              </Card>
            ) : (
              <DashboardChart
                title="Monthly Activity Trend"
                data={monthlyActivity}
                type="line"
                height={450}
                colors={[theme.palette.success.main]}
                subtitle={`Overall system activity trends (${monthlyActivity.reduce(
                  (sum, item) => sum + item.value,
                  0}
                )} total activities)`}
                showLegend={false}
                interactive={true}
              />
            )}
          </div>
        </div>
      </motion.div>
      {/* Communication Hub Section */}
      <motion.div
        
        >
        <div  className="">
          Communication Hub
        </div>
        <div
          className="">
          <div className="">
            <CommunicationWidget  height={320} />
          </div>
          <div className="">
            <CommunicationWidget  height={320} />
          </div>
          <div className="">
            <CommunicationWidget  height={320} />
          </div>
        </div>
      </motion.div>
      {/* Communication Metrics */}
      <motion.div
        
        >
        <div className="">
          <CommunicationMetrics timeRange="week" showTrends={true} />
        </div>
      </motion.div>
      {/* Recent Activities Section */}
      <motion.div
        
        >
        <div  className="">
          Recent Activities
        </div>
        <div
          className="">
          {/* Recent System Activities */}
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar className="">
                    <NotificationsIcon />
                  </Avatar>
                  <div >System Activities</div>
                </div>
                <List dense className="">
                  {activitiesLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, index) => (
                      <div key={index}>
                        <div>
                          <divAvatar>
                            <Avatar
                              className=""
                            >
                              <div
                                className=""
                              />
                            </Avatar>
                          </ListItemAvatar>
                          <div
                            primary={
                              <div
                                className=""
                              />}
                            }
                            secondary={
                              <div>
                                <div
                                  className=""
                                />
                                <div
                                  className=""
                                />
                              </div>}
                            }
                          />
                        </div>
                        {index < 4 && (
                          <Separator  component="li" />
                        )}
                      </div>
                    ))
                  ) : activitiesError ? (
                    <div>
                      <div
                        primary={
                          <div color="error" >}
                            Error loading activities: {activitiesError}
                          </div>
                        }
                      />
                    </div>
                  ) : systemActivities.length === 0 ? (
                    <div>
                      <div
                        primary={
                          <div color="text.secondary" >
                            No recent system activities
                          </div>}
                        }
                      />
                    </div>
                  ) : (
                    systemActivities.map((activity, index) => {
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'patient_registration':
                            return 'success.main';
                          case 'clinical_note':
                            return 'info.main';
                          case 'medication_update':
                            return 'warning.main';
                          case 'mtr_session':
                            return 'secondary.main';
                          case 'system_alert':
                            return 'error.main';
                          default:
                            return 'primary.main';
                        }
                      };
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'patient_registration':
                            return <PersonAddIcon className="" />;
                          case 'clinical_note':
                            return <NoteAddIcon className="" />;
                          case 'medication_update':
                            return <MedicationIcon className="" />;
                          case 'mtr_session':
                            return <EventIcon className="" />;
                          case 'system_alert':
                            return <WarningIcon className="" />;
                          default:
                            return <NotificationsIcon className="" />;
                        }
                      };
                      return (
                        <div key={activity.id}>
                          <div>
                            <divAvatar>
                              <Avatar
                                className=""
                              >
                                {getActivityIcon(activity.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <div
                              primary={activity.title}
                              secondary={
                                <div component="div">
                                  <div
                                    component="div"
                                    className=""
                                  >}
                                    {activity.description}
                                  </div>
                                  <div
                                    component="div"
                                    className=""
                                  >
                                    {activityService.formatRelativeTime(
                                      activity.createdAt
                                    )}
                                  </div>
                                </div>
                              }
                            />
                          </div>
                          {index < systemActivities.length - 1 && (
                            <Separator  component="li" />
                          )}
                        </div>
                      );
                    })
                  )}
                </List>
              </CardContent>
            </Card>
          </div>
          {/* Recent User Activities */}
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar className="">
                    <PeopleIcon />
                  </Avatar>
                  <div >User Activities</div>
                </div>
                <List dense className="">
                  <div>
                    <divAvatar>
                      <Avatar
                        className=""
                      >
                        <LoginIcon className="" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary="User Login"
                      secondary={
                        <div component="div">
                          <div
                            component="div"
                            className=""
                          >
                            Dr. Sarah Wilson logged in
                          </div>
                          <div
                            component="div"
                            className=""
                          >
                            5 minutes ago
                          </div>
                        </div>}
                      }
                    />
                  </div>
                  <Separator  component="li" />
                  <div>
                    <divAvatar>
                      <Avatar
                        className=""
                      >
                        <AssignmentIcon className="" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary="Report Generated"
                      secondary={
                        <div component="div">
                          <div
                            component="div"
                            className=""
                          >
                            Monthly performance report by Admin
                          </div>
                          <div
                            component="div"
                            className=""
                          >
                            30 minutes ago
                          </div>
                        </div>}
                      }
                    />
                  </div>
                  <Separator  component="li" />
                  <div>
                    <divAvatar>
                      <Avatar
                        className=""
                      >
                        <SettingsIcon className="" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary="Settings Updated"
                      secondary={
                        <div component="div">
                          <div
                            component="div"
                            className=""
                          >
                            Notification preferences changed
                          </div>
                          <div
                            component="div"
                            className=""
                          >
                            1 hour ago
                          </div>
                        </div>}
                      }
                    />
                  </div>
                  <Separator  component="li" />
                  <div>
                    <divAvatar>
                      <Avatar
                        className=""
                      >
                        <SecurityIcon className="" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary="Security Update"
                      secondary={
                        <div component="div">
                          <div
                            component="div"
                            className=""
                          >
                            Password changed for user account
                          </div>
                          <div
                            component="div"
                            className=""
                          >
                            4 hours ago
                          </div>
                        </div>}
                      }
                    />
                  </div>
                  <Separator  component="li" />
                  <div>
                    <divAvatar>
                      <Avatar
                        className=""
                      >
                        <CheckCircleIcon className="" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary="Task Completed"
                      secondary={
                        <div component="div">
                          <div
                            component="div"
                            className=""
                          >
                            Data backup completed successfully
                          </div>
                          <div
                            component="div"
                            className=""
                          >
                            6 hours ago
                          </div>
                        </div>}
                      }
                    />
                  </div>
                </List>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
      {/* Admin Dashboard Integration */}
      <AdminDashboardIntegration />
      {/* Usage Dashboard */}
      <UsageDashboard />
      {/* Pharmacist Performance */}
      <PharmacistPerformanceTable />
      {/* Clinical Interventions Dashboard */}
      {clinicalMetrics && (
        <motion.div
          
          >
          <div  className="">
            Clinical Interventions Overview
          </div>
          <div
            className="">
            <div className="">
              <KPICard
                title="Total Interventions"
                value={clinicalMetrics.totalInterventions || 0}
                subtitle="All interventions"
                icon={<AssessmentIcon />}
                color={theme.palette.primary.main}
                loading={clinicalLoading}
              />
            </div>
            <div className="">
              <KPICard
                title="Active"
                value={clinicalMetrics.activeInterventions || 0}
                subtitle="In progress"
                icon={<ScheduleIcon />}
                color={theme.palette.info.main}
                loading={clinicalLoading}
              />
            </div>
            <div className="">
              <KPICard
                title="Success Rate"
                value={`${Math.round(clinicalMetrics.successRate || 0)}%`}
                subtitle="Completed successfully"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
                loading={clinicalLoading}
              />
            </div>
            <div className="">
              <KPICard
                title="Cost Savings"
                value={`₦${(
                  (clinicalMetrics.totalCostSavings || 0) / 1000}
                ).toFixed(0)}K`}
                subtitle="Estimated savings"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
                loading={clinicalLoading}
              />
            </div>
          </div>
        </motion.div>
      )}
      {/* Quick Actions */}
      <motion.div
        
        >
        <div  className="">
          Quick Actions
        </div>
        <div
          className="">
          <div className="">
            <QuickActionCard
              title="Add New Patient"
              description="Register a new patient in the system"
              icon="👤"
              color={theme.palette.primary.main}
              navigateTo="/patients/new"
              buttonText="Add Patient"
            />
          </div>
          <div className="">
            <QuickActionCard
              title="Create Clinical Note"
              description="Document a new clinical observation"
              icon="📝"
              color={theme.palette.success.main}
              navigateTo="/notes/new"
              buttonText="Create Note"
            />
          </div>
          <div className="">
            <QuickActionCard
              title="Schedule MTR"
              description="Schedule a medication therapy review"
              icon="📅"
              color={theme.palette.secondary.main}
              navigateTo="/pharmacy/medication-therapy/new"
              buttonText="Schedule"
            />
          </div>
          <div className="">
            <QuickActionCard
              title="View Reports"
              description="Access detailed analytics and reports"
              icon="📊"
              color={theme.palette.warning.main}
              navigateTo="/pharmacy/reports"
              buttonText="View Reports"
            />
          </div>
        </div>
      </motion.div>
      {/* Floating Action Button */}
      <AnimatePresence>
        <Zoom in={!isMobile}>
          <Fab
            color="primary"
            className=""
            onClick={() => navigate('/patients/new')}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      </AnimatePresence>
    </div>
  );
};
export default ModernDashboard;
