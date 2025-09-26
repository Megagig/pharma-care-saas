  mtrNotificationService,

import MTRNotificationPreferences from './MTRNotificationPreferences';

import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Tooltip, Progress, Alert, Separator } from '@/components/ui/button';
const MTRNotificationDashboard: React.FC = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const queryClient = useQueryClient();
  // Fetch notification statistics
  const {
    data: statistics,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({ 
    queryKey: ['notificationStatistics'],
    queryFn: mtrNotificationService.getNotificationStatistics,
    refetchInterval: 30000, // Refresh every 30 seconds })
  });
  // Check overdue follow-ups mutation
  const checkOverdueMutation = useMutation({ 
    mutationFn: mtrNotificationService.checkOverdueFollowUps,
    onSuccess: () => { })
      queryClient.invalidateQueries({ queryKey: ['notificationStatistics'] });
    }
  // Process pending reminders mutation
  const processPendingMutation = useMutation({ 
    mutationFn: mtrNotificationService.processPendingReminders,
    onSuccess: () => { })
      queryClient.invalidateQueries({ queryKey: ['notificationStatistics'] });
    }
  const handleRefreshStats = () => {
    queryClient.invalidateQueries({ queryKey: ['notificationStatistics'] });
  };
  const getSuccessRate = (stats: NotificationStatistics) => {
    if (stats.totalScheduled === 0) return 0;
    return Math.round((stats.sent / stats.totalScheduled) * 100);
  };
  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };
  return (
    <div>
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div display="flex" alignItems="center">
          <NotificationsIcon className="" />
          <div  component="h1">
            MTR Notification Dashboard
          </div>
        </div>
        <div display="flex" gap={1}>
          <Tooltip title="Refresh Statistics">
            <IconButton onClick={handleRefreshStats} disabled={statsLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            
            startIcon={<SettingsIcon />}
            onClick={() => setShowPreferences(true)}
          >
            Preferences
          </Button>
        </div>
      </div>
      {/* Error Alert */}
      {statsError && (
        <Alert severity="error" className="">
          Failed to load notification statistics. Please try refreshing the
          page.
        </Alert>
      )}
      {/* Success Alerts */}
      {checkOverdueMutation.isSuccess && (
        <Alert severity="success" className="">
          Overdue follow-ups checked successfully!
        </Alert>
      )}
      {processPendingMutation.isSuccess && (
        <Alert severity="success" className="">
          Pending reminders processed successfully!
        </Alert>
      )}
      <div container spacing={3}>
        {/* Overview Cards */}
        <div item xs={12} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" mb={2}>
                <CheckCircleIcon className="" />
                <div >Sent</div>
              </div>
              <div  color="success.main">
                {statistics?.sent || 0}
              </div>
              <div  color="text.secondary">
                Successfully delivered
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" mb={2}>
                <PendingIcon className="" />
                <div >Pending</div>
              </div>
              <div  color="warning.main">
                {statistics?.pending || 0}
              </div>
              <div  color="text.secondary">
                Awaiting delivery
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" mb={2}>
                <ErrorIcon className="" />
                <div >Failed</div>
              </div>
              <div  color="error.main">
                {statistics?.failed || 0}
              </div>
              <div  color="text.secondary">
                Delivery failed
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon className="" />
                <div >Success Rate</div>
              </div>
              <div
                
                color={`${getStatusColor(
                  statistics ? getSuccessRate(statistics) : 0}
                )}.main`}
              >
                {statistics ? getSuccessRate(statistics) : 0}%
              </div>
              <div  color="text.secondary">
                Delivery success rate
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Notification Types Breakdown */}
        <div item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Notifications by Type
              </div>
              {statistics?.byType &&
              Object.keys(statistics.byType).length > 0 ? (
                <List dense>
                  {Object.entries(statistics.byType).map(([type, count]) => (
                    <div key={type}>
                      <div>
                        {type.includes('critical') ? (
                          <WarningIcon color="error" />
                        ) : type.includes('reminder') ? (
                          <ScheduleIcon color="primary" />
                        ) : (
                          <NotificationsIcon color="action" />
                        )}
                      </div>
                      <div
                        primary={type.replace('_', ' ').toUpperCase()}
                        secondary={`${count} notifications`}
                      />
                      <Chip
                        label={count}
                        size="small"
                        color="primary"
                        
                      />
                    </div>
                  ))}
                </List>
              ) : (
                <div
                  
                  color="text.secondary"
                  textAlign="center"
                  py={3}
                >
                  No notifications sent yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Notification Channels Breakdown */}
        <div item xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Notifications by Channel
              </div>
              {statistics?.byChannel &&
              Object.keys(statistics.byChannel).length > 0 ? (
                <List dense>
                  {Object.entries(statistics.byChannel).map(
                    ([channel, count]) => (
                      <div key={channel}>
                        <div>
                          {channel === 'email' ? (
                            <EmailIcon color="primary" />
                          ) : channel === 'sms' ? (
                            <SmsIcon color="secondary" />
                          ) : (
                            <NotificationsIcon color="action" />
                          )}
                        </div>
                        <div
                          primary={channel.toUpperCase()}
                          secondary={`${count} notifications`}
                        />
                        <Chip
                          label={count}
                          size="small"
                          color={channel === 'email' ? 'primary' : 'secondary'}
                          
                        />
                      </div>
                    )
                  )}
                </List>
              ) : (
                <div
                  
                  color="text.secondary"
                  textAlign="center"
                  py={3}
                >
                  No notifications sent yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* System Actions */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                System Actions
              </div>
              <div  color="text.secondary" mb={3}>
                Manually trigger notification system tasks
              </div>
              <div display="flex" gap={2} flexWrap="wrap">
                <Button
                  
                  startIcon={<WarningIcon />}
                  onClick={() => checkOverdueMutation.mutate()}
                  disabled={checkOverdueMutation.isPending}
                >
                  {checkOverdueMutation.isPending
                    ? 'Checking...'
                    : 'Check Overdue Follow-ups'}
                </Button>
                <Button
                  
                  startIcon={<ScheduleIcon />}
                  onClick={() => processPendingMutation.mutate()}
                  disabled={processPendingMutation.isPending}
                >
                  {processPendingMutation.isPending
                    ? 'Processing...'
                    : 'Process Pending Reminders'}
                </Button>
                <Button
                  
                  startIcon={<TrendingUpIcon />}
                  onClick={() => setShowStatistics(true)}
                >
                  View Detailed Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Notification Preferences Dialog */}
      <Dialog
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <MTRNotificationPreferences />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreferences(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Detailed Statistics Dialog */}
      <Dialog
        open={showStatistics}
        onClose={() => setShowStatistics(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detailed Statistics</DialogTitle>
        <DialogContent>
          {statistics && (
            <div>
              <div  gutterBottom>
                Overall Performance
              </div>
              <div mb={3}>
                <div  gutterBottom>
                  Success Rate: {getSuccessRate(statistics)}%
                </div>
                <Progress
                  
                  color={getStatusColor(getSuccessRate(statistics))}
                  className=""
                />
              </div>
              <Separator className="" />
              <div  gutterBottom>
                Summary
              </div>
              <List dense>
                <div>
                  <div
                    primary="Total Scheduled"
                    secondary={statistics.totalScheduled}
                  />
                </div>
                <div>
                  <div
                    primary="Successfully Sent"
                    secondary={statistics.sent}
                  />
                </div>
                <div>
                  <div
                    primary="Pending Delivery"
                    secondary={statistics.pending}
                  />
                </div>
                <div>
                  <div
                    primary="Failed Delivery"
                    secondary={statistics.failed}
                  />
                </div>
              </List>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatistics(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default MTRNotificationDashboard;
