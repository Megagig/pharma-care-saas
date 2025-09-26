import DashboardChart from './DashboardChart';

import { Card, CardContent, Alert, Skeleton, Avatar } from '@/components/ui/button';

interface AdminDashboardData {
  summary: {
    workspaces: {
      total: number;
      active: number;
      trial: number;
      expired: number;
      growth: number;
    };
    subscriptions: {
      total: number;
      active: number;
      byTier: Array<{ _id: string; count: number; revenue: number }>;
    };
    users: {
      total: number;
      active: number;
      growth: number;
    };
    patients: {
      total: number;
    };
    invitations: {
      total: number;
      pending: number;
      stats: Array<{ _id: string; count: number }>;
    };
    emails: {
      stats: Array<{ _id: string; count: number }>;
    };
  };
  recentActivity: {
    newWorkspaces: number;
    newUsers: number;
  };
  alerts: {
    trialExpiring: Array<{
      _id: string;
      name: string;
      trialEndDate: string;
      ownerId: { firstName: string; lastName: string; email: string };
    }>;
    failedPayments: Array<{
      _id: string;
      workspaceId: { name: string };
      status: string;
      updatedAt: string;
    }>;
  };
  timestamp: string;
}
interface SystemHealthData {
  timestamp: string;
  database: {
    connected: boolean;
    stats: any;
  };
  application: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      used: number;
    };
    nodeVersion: string;
    environment: string;
  };
  services: {
    emailDelivery: Array<{ _id: string; count: number }>;
    invitations: Array<{ _id: string; count: number }>;
    subscriptions: Array<{ _id: string; count: number }>;
  };
  recentErrors: unknown[];
}
const AdminDashboardIntegration: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchAdminData();
    }
  }, [user]);
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, healthResponse] = await Promise.all([
        adminService.getDashboardOverview(),
        adminService.getSystemHealth(),
      ]);
      setDashboardData(dashboardResponse.data);
      setSystemHealth(healthResponse.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load admin data'
      );
    } finally {
      setLoading(false);
    }
  };
  // Don't render for non-admin users
  if (user?.role !== 'super_admin') {
    return null;
  }
  if (loading) {
    return (
      <div className="">
        <div  className="">
          Admin Overview
        </div>
        <div container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <div item xs={12} sm={6} md={3} key={index}>
              <Skeleton
                
                height={120}
                className=""
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error" className="">
        Error loading admin data: {error}
      </Alert>
    );
  }
  if (!dashboardData || !systemHealth) {
    return null;
  }
  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };
  // Format memory usage
  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };
  // Prepare chart data
  const subscriptionTierData = dashboardData.summary.subscriptions.byTier.map(
    (tier) => ({ 
      name: tier._id || 'Unknown',
      value: tier.count,
      revenue: tier.revenue}
    })
  );
  const invitationStatusData = dashboardData.summary.invitations.stats.map(
    (stat) => ({ 
      name: stat._id,
      value: stat.count}
    })
  );
  const emailDeliveryData = systemHealth.services.emailDelivery.map((stat) => ({ 
    name: stat._id,
    value: stat.count}
  }));
  return (
    <motion.div
      
      >
      <div className="">
        <div  className="">
          Admin Overview
        </div>
        {/* Admin KPIs */}
        <div
          className="">
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar className="">
                    <BusinessIcon />
                  </Avatar>
                  <div >Workspaces</div>
                </div>
                <div  className="">
                  {dashboardData.summary.workspaces.total}
                </div>
                <div display="flex" gap={1} mb={1}>
                  <Chip
                    label={`${dashboardData.summary.workspaces.active} Active`}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label={`${dashboardData.summary.workspaces.trial} Trial`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`${dashboardData.summary.workspaces.expired} Expired`}
                    color="error"
                    size="small"
                  />
                </div>
                {dashboardData.summary.workspaces.growth !== 0 && (
                  <div display="flex" alignItems="center">
                    <TrendingUpIcon
                      className=""
                    />
                    <div  color="text.secondary">
                      {dashboardData.summary.workspaces.growth > 0 ? '+' : ''}
                      {dashboardData.summary.workspaces.growth.toFixed(1)}%
                      growth
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar className="">
                    <PeopleIcon />
                  </Avatar>
                  <div >Users</div>
                </div>
                <div  className="">
                  {dashboardData.summary.users.total}
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {dashboardData.summary.users.active} active users
                </div>
                {dashboardData.summary.users.growth !== 0 && (
                  <div display="flex" alignItems="center">
                    <TrendingUpIcon
                      className=""
                    />
                    <div  color="text.secondary">
                      {dashboardData.summary.users.growth > 0 ? '+' : ''}
                      {dashboardData.summary.users.growth.toFixed(1)}% growth
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar className="">
                    <CreditCardIcon />
                  </Avatar>
                  <div >Subscriptions</div>
                </div>
                <div  className="">
                  {dashboardData.summary.subscriptions.total}
                </div>
                <div  color="text.secondary">
                  {dashboardData.summary.subscriptions.active} active
                  subscriptions
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card className="">
              <CardContent>
                <div display="flex" alignItems="center" mb={2}>
                  <Avatar
                    className=""
                  >
                    <SecurityIcon />
                  </Avatar>
                  <div >System Health</div>
                </div>
                <div display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon className="" />
                  <div >Database Connected</div>
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Uptime: {formatUptime(systemHealth.application.uptime)}
                </div>
                <div  color="text.secondary">
                  Memory: {formatMemory(systemHealth.application.memory.used)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Charts */}
        <div container spacing={3} className="">
          <div item xs={12} md={4}>
            <DashboardChart
              title="Subscriptions by Tier"
              data={subscriptionTierData}
              type="pie"
              height={300}
              colors={[
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.warning.main,}
              ]}
            />
          </div>
          <div item xs={12} md={4}>
            <DashboardChart
              title="Invitation Status"
              data={invitationStatusData}
              type="pie"
              height={300}
              colors={[
                theme.palette.success.main,
                theme.palette.info.main,
                theme.palette.error.main,}
              ]}
            />
          </div>
          <div item xs={12} md={4}>
            <DashboardChart
              title="Email Delivery (7 days)"
              data={emailDeliveryData}
              type="bar"
              height={300}
              colors={[theme.palette.info.main]}
            />
          </div>
        </div>
        {/* Alerts */}
        {(dashboardData.alerts.trialExpiring.length > 0 ||
          dashboardData.alerts.failedPayments.length > 0) && (
          <div
            className="">
            {dashboardData.alerts.trialExpiring.length > 0 && (
              <div className="">
                <Card>
                  <CardContent>
                    <div display="flex" alignItems="center" mb={2}>
                      <WarningIcon className="" />
                      <div >Trials Expiring Soon</div>
                    </div>
                    <List dense>
                      {dashboardData.alerts.trialExpiring
                        .slice(0, 5)
                        .map((workspace) => (
                          <div key={workspace._id}>
                            <divAvatar>
                              <Avatar className="">
                                <ScheduleIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <div
                              primary={workspace.name}
                              secondary={`Expires: ${new Date(
                                workspace.trialEndDate}
                              ).toLocaleDateString()}`}
                            />
                          </div>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </div>
            )}
            {dashboardData.alerts.failedPayments.length > 0 && (
              <div className="">
                <Card>
                  <CardContent>
                    <div display="flex" alignItems="center" mb={2}>
                      <WarningIcon className="" />
                      <div >Failed Payments</div>
                    </div>
                    <List dense>
                      {dashboardData.alerts.failedPayments
                        .slice(0, 5)
                        .map((payment) => (
                          <div key={payment._id}>
                            <divAvatar>
                              <Avatar className="">
                                <CreditCardIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <div
                              primary={payment.workspaceId.name}
                              secondary={`Status: ${
                                payment.status}
                              } - ${new Date(
                                payment.updatedAt
                              ).toLocaleDateString()}`}
                            />
                          </div>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default AdminDashboardIntegration;
