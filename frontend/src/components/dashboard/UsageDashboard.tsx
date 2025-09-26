import DashboardChart from './DashboardChart';

import { Card, CardContent, Tooltip, Progress, Alert, Avatar } from '@/components/ui/button';

interface UsageData {
  patients: {
    current: number;
    limit: number;
    percentage: number;
  };
  users: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    current: number; // in MB
    limit: number; // in MB
    percentage: number;
  };
  apiCalls: {
    current: number;
    limit: number;
    percentage: number;
    dailyUsage: Array<{ date: string; calls: number }>;
  };
  locations: {
    current: number;
    limit: number;
    percentage: number;
  };
}
interface UsageCardProps {
  title: string;
  current: number;
  limit: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  unit?: string;
  formatValue?: (value: number) => string;
}
const UsageCard: React.FC<UsageCardProps> = ({ 
  title,
  current,
  limit,
  percentage,
  icon,
  color,
  unit = '',
  formatValue
}) => {
  const theme = useTheme();
  const getStatusColor = () => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };
  const getStatusIcon = () => {
    if (percentage >= 90) return <WarningIcon />;
    if (percentage >= 75) return <InfoIcon />;
    return <CheckCircleIcon />;
  };
  const formatDisplayValue = (value: number) => {
    if (formatValue) return formatValue(value);
    return `${value}${unit}`;
  };
  return (
    <motion.div
      >
      <Card
        className="">
        <CardContent className="">
          <div
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Avatar className="">
              {icon}
            </Avatar>
            <Chip
              icon={getStatusIcon()}
              label={`${percentage.toFixed(1)}%`}
              color={
                percentage >= 90
                  ? 'error'
                  : percentage >= 75
                  ? 'warning'
                  : 'success'}
              }
              size="small"
            />
          </div>
          <div  className="">
            {title}
          </div>
          <div display="flex" alignItems="baseline" mb={2}>
            <div
              
              className=""
            >
              {formatDisplayValue(current)}
            </div>
            <div  color="text.secondary">
              / {formatDisplayValue(limit)}
            </div>
          </div>
          <Progress
            
            className="" />
          {percentage >= 90 && (
            <Alert severity="error" className="">
              <div >
                Usage limit almost reached!
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
const UsageDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchUsageData();
  }, []);
  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await usageMonitoringService.getUsageStats();
      setUsageData(response.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load usage data'
      );
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsageData();
    } finally {
      setRefreshing(false);
    }
  };
  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };
  const formatApiCalls = (calls: number) => {
    if (calls >= 1000000) {
      return `${(calls / 1000000).toFixed(1)}M`;
    }
    if (calls >= 1000) {
      return `${(calls / 1000).toFixed(1)}K`;
    }
    return calls.toString();
  };
  if (loading && !usageData) {
    return (
      <div className="">
        <div  className="">
          Usage & Limits
        </div>
        <div
          className="">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="">
              <Card className="">
                <CardContent>
                  <div className="">
                    <div
                      className=""
                    />
                    <div
                      className=""
                    />
                    <div
                      className=""
                    />
                    <div
                      className=""
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <Alert
        severity="error"
        className=""
        action={}
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
      >
        Error loading usage data: {error}
      </Alert>
    );
  }
  if (!usageData) {
    return null;
  }
  // Prepare API usage chart data
  const apiUsageChartData = usageData.apiCalls.dailyUsage.map((day) => ({ 
    name: new Date(day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'}
    }),
    value: day.calls}
  return (
    <motion.div
      
      >
      <div className="">
        <div
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <div  className="">
            Usage & Limits
          </div>
          <Tooltip title="Refresh Usage Data">
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
        </div>
        {/* Usage Cards */}
        <div
          className="">
          <div className="">
            <UsageCard
              title="Patients"
              current={usageData.patients.current}
              limit={usageData.patients.limit}
              percentage={usageData.patients.percentage}
              icon={<PeopleIcon />}
              color={theme.palette.primary.main}
            />
          </div>
          <div className="">
            <UsageCard
              title="Team Members"
              current={usageData.users.current}
              limit={usageData.users.limit}
              percentage={usageData.users.percentage}
              icon={<PeopleIcon />}
              color={theme.palette.success.main}
            />
          </div>
          <div className="">
            <UsageCard
              title="Storage"
              current={usageData.storage.current}
              limit={usageData.storage.limit}
              percentage={usageData.storage.percentage}
              icon={<StorageIcon />}
              color={theme.palette.info.main}
              formatValue={formatStorage}
            />
          </div>
          <div className="">
            <UsageCard
              title="API Calls"
              current={usageData.apiCalls.current}
              limit={usageData.apiCalls.limit}
              percentage={usageData.apiCalls.percentage}
              icon={<ApiIcon />}
              color={theme.palette.warning.main}
              formatValue={formatApiCalls}
            />
          </div>
          <div className="">
            <UsageCard
              title="Locations"
              current={usageData.locations.current}
              limit={usageData.locations.limit}
              percentage={usageData.locations.percentage}
              icon={<LocationIcon />}
              color={theme.palette.secondary.main}
            />
          </div>
        </div>
        {/* API Usage Chart */}
        {apiUsageChartData.length > 0 && (
          <div
            className="">
            <div className="">
              <DashboardChart
                title="API Usage (Last 7 Days)"
                data={apiUsageChartData}
                type="area"
                height={350}
                colors={[theme.palette.warning.main]}
                subtitle="Daily API call usage trend"
                showLegend={false}
                interactive={true}
              />
            </div>
            <div className="">
              <Card className="">
                <CardContent>
                  <div  className="">
                    Usage Summary
                  </div>
                  <div mb={3}>
                    <div
                      
                      color="text.secondary"
                      gutterBottom
                    >
                      Most Used Resource
                    </div>
                    <div  className="">
                      {Math.max(
                        usageData.patients.percentage,
                        usageData.users.percentage,
                        usageData.storage.percentage,
                        usageData.apiCalls.percentage,
                        usageData.locations.percentage
                      ) === usageData.patients.percentage
                        ? 'Patients'
                        : Math.max(
                            usageData.users.percentage,
                            usageData.storage.percentage,
                            usageData.apiCalls.percentage,
                            usageData.locations.percentage
                          ) === usageData.users.percentage
                        ? 'Team Members'
                        : Math.max(
                            usageData.storage.percentage,
                            usageData.apiCalls.percentage,
                            usageData.locations.percentage
                          ) === usageData.storage.percentage
                        ? 'Storage'
                        : Math.max(
                            usageData.apiCalls.percentage,
                            usageData.locations.percentage
                          ) === usageData.apiCalls.percentage
                        ? 'API Calls'
                        : 'Locations'}
                    </div>
                  </div>
                  <div mb={3}>
                    <div
                      
                      color="text.secondary"
                      gutterBottom
                    >
                      Resources at Risk
                    </div>
                    <div display="flex" flexDirection="column" gap={1}>
                      {[
                        {
                          name: 'Patients',
                          percentage: usageData.patients.percentage,
                        },
                        {
                          name: 'Users',
                          percentage: usageData.users.percentage,
                        },
                        {
                          name: 'Storage',
                          percentage: usageData.storage.percentage,
                        },
                        {
                          name: 'API Calls',
                          percentage: usageData.apiCalls.percentage,
                        },
                        {
                          name: 'Locations',
                          percentage: usageData.locations.percentage,
                        },
                      ]
                        .filter((item) => item.percentage >= 75)
                        .map((item) => (
                          <Chip
                            key={item.name}
                            label={`${item.name} (${item.percentage.toFixed(
                              1
                            )}%)`}
                            color={item.percentage >= 90 ? 'error' : 'warning'}
                            size="small"
                          />
                        ))}
                      {[
                        usageData.patients.percentage,
                        usageData.users.percentage,
                        usageData.storage.percentage,
                        usageData.apiCalls.percentage,
                        usageData.locations.percentage,
                      ].every((p) => p < 75) && (
                        <div  color="success.main">
                          All resources within safe limits
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      
                      color="text.secondary"
                      gutterBottom
                    >
                      Recommendation
                    </div>
                    <div >
                      {Math.max(
                        usageData.patients.percentage,
                        usageData.users.percentage,
                        usageData.storage.percentage,
                        usageData.apiCalls.percentage,
                        usageData.locations.percentage
                      ) >= 90
                        ? 'Consider upgrading your plan to avoid service interruption.'
                        : Math.max(
                            usageData.patients.percentage,
                            usageData.users.percentage,
                            usageData.storage.percentage,
                            usageData.apiCalls.percentage,
                            usageData.locations.percentage
                          ) >= 75
                        ? 'Monitor usage closely and plan for potential upgrade.'
                        : 'Usage is within normal limits.'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default UsageDashboard;
