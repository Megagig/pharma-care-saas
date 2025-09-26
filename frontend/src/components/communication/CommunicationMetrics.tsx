import { Card, CardContent, Progress, Skeleton } from '@/components/ui/button';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}
const MetricCard: React.FC<MetricCardProps> = ({ 
  title,
  value,
  subtitle,
  trend,
  color,
  icon,
  loading = false
}) => {
  const theme = useTheme();
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
            mb={1}
          >
            <div
              className=""
            >
              {icon}
            </div>
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
            <Skeleton  width="60%" height={32} />
          ) : (
            <div
              
              component="div"
              className=""
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
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
        </CardContent>
      </Card>
    </motion.div>
  );
};
interface CommunicationMetricsProps {
  timeRange?: 'day' | 'week' | 'month' | 'year';
  showTrends?: boolean;
}
const CommunicationMetrics: React.FC<CommunicationMetricsProps> = ({ 
  timeRange = 'week',
  showTrends = true
}) => {
  const theme = useTheme();
  const { conversations, messages, notifications, loading } =
    useCommunicationStore();
  const [metrics, setMetrics] = useState({ 
    totalMessages: 0,
    activeConversations: 0,
    responseTime: '2.5 min',
    resolutionRate: 85,
    patientQueries: 0,
    unreadNotifications: 0,
    trends: { })
      messages: { value: 12, isPositive: true },
      conversations: { value: 8, isPositive: true },
      responseTime: { value: -15, isPositive: true },
      resolutionRate: { value: 5, isPositive: true },
    }
  useEffect(() => {
    // Calculate metrics from store data
    const activeConvs = conversations.filter(
      (conv) => conv.status === 'active'
    );
    const patientQueries = conversations.filter(
      (conv) => conv.type === 'patient_query'
    );
    const unreadNotifs = notifications.filter(
      (notif) => notif.status === 'unread'
    );
    // Calculate total messages across all conversations
    const totalMessages = Object.values(messages).reduce(
      (total, convMessages) => total + convMessages.length,
      0
    );
    // Calculate average response time (mock calculation)
    const avgResponseTime = calculateAverageResponseTime();
    // Calculate resolution rate (mock calculation)
    const resolutionRate = calculateResolutionRate();
    setMetrics((prev) => ({ 
      ...prev,
      totalMessages,
      activeConversations: activeConvs.length,
      patientQueries: patientQueries.length,
      unreadNotifications: unreadNotifs.length,
      responseTime: avgResponseTime,
      resolutionRate}
    }));
  }, [conversations, messages, notifications]);
  const calculateAverageResponseTime = (): string => {
    // Mock calculation - in real implementation, this would analyze message timestamps
    const mockMinutes = Math.floor(Math.random() * 5) + 1;
    return `${mockMinutes}.${Math.floor(Math.random() * 9)} min`;
  };
  const calculateResolutionRate = (): number => {
    // Mock calculation - in real implementation, this would analyze resolved conversations
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  };
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'day':
        return 'last day';
      case 'week':
        return 'last week';
      case 'month':
        return 'last month';
      case 'year':
        return 'last year';
      default:
        return 'last week';
    }
  };
  return (
    <div>
      <div  gutterBottom className="">
        Communication Analytics
      </div>
      <div container spacing={3}>
        <div item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Messages"
            value={metrics.totalMessages}
            subtitle={`Sent in ${getTimeRangeLabel()}`}
            trend={
              showTrends
                ? {
                    ...metrics.trends.messages,
                    period: getTimeRangeLabel(),}
                  }
                : undefined
            }
            color={theme.palette.primary.main}
            icon={<MessageIcon />}
            loading={loading}
          />
        </div>
        <div item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Conversations"
            value={metrics.activeConversations}
            subtitle="Currently ongoing"
            trend={
              showTrends
                ? {
                    ...metrics.trends.conversations,
                    period: getTimeRangeLabel(),}
                  }
                : undefined
            }
            color={theme.palette.success.main}
            icon={<GroupIcon />}
            loading={loading}
          />
        </div>
        <div item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Response Time"
            value={metrics.responseTime}
            subtitle="Healthcare provider response"
            trend={
              showTrends
                ? {
                    ...metrics.trends.responseTime,
                    period: getTimeRangeLabel(),}
                  }
                : undefined
            }
            color={theme.palette.info.main}
            icon={<ScheduleIcon />}
            loading={loading}
          />
        </div>
        <div item xs={12} sm={6} md={3}>
          <MetricCard
            title="Resolution Rate"
            value={`${metrics.resolutionRate}%`}
            subtitle="Queries resolved successfully"
            trend={
              showTrends
                ? {
                    ...metrics.trends.resolutionRate,
                    period: getTimeRangeLabel(),}
                  }
                : undefined
            }
            color={theme.palette.warning.main}
            icon={<CheckCircleIcon />}
            loading={loading}
          />
        </div>
        {/* Additional metrics row */}
        <div item xs={12} sm={6}>
          <Card className="">
            <CardContent>
              <div  gutterBottom>
                Patient Queries
              </div>
              <div display="flex" alignItems="center" gap={2} mb={2}>
                <div  color="primary.main" fontWeight="bold">
                  {loading ? <Skeleton width={40} /> : metrics.patientQueries}
                </div>
                <Chip label="Active" color="primary" size="small" />
              </div>
              <Progress
                
                className=""
              />
              <div  color="text.secondary">
                {Math.round(
                  (metrics.patientQueries /
                    Math.max(metrics.activeConversations, 1)) *
                    100
                )}
                % of active conversations
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6}>
          <Card className="">
            <CardContent>
              <div  gutterBottom>
                Notification Status
              </div>
              <div display="flex" alignItems="center" gap={2} mb={2}>
                <div  color="error.main" fontWeight="bold">
                  {loading ? (
                    <Skeleton width={40} />
                  ) : (
                    metrics.unreadNotifications
                  )}
                </div>
                <Chip label="Unread" color="error" size="small" />
              </div>
              <Progress
                
                color="success"
                className=""
              />
              <div  color="text.secondary">
                {Math.round(
                  Math.max(
                    0,
                    100 -
                      (metrics.unreadNotifications /
                        Math.max(notifications.length, 1)) *
                        100
                  )
                )}
                % read rate
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default CommunicationMetrics;
