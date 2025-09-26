import CriticalAlertBanner from './CriticalAlertBanner';

import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Tooltip, Spinner, Alert, Switch, Separator } from '@/components/ui/button';

interface NotificationDashboardProps {
  onViewOrder?: (orderId: string) => void;
  onScheduleReferral?: (alert: any) => void;
  onCreateCarePlan?: (alert: any) => void;
}
const NotificationDashboard: React.FC<NotificationDashboardProps> = ({ 
  onViewOrder,
  onScheduleReferral,
  onCreateCarePlan
}) => {
  const {
    alerts,
    preferences,
    stats,
    alertsLoading,
    preferencesLoading,
    statsLoading,
    acknowledgeAlert,
    dismissAlert,
    updatePreferences,
    sendTestNotification,
    refreshAlerts,
    criticalAlertsCount,
    unacknowledgedAlertsCount,
    hasCriticalAlerts,
    notificationsEnabled,
    pollingEnabled,
    enablePolling,
    disablePolling,
  } = useManualLabNotifications();
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [testingNotification, setTestingNotification] = useState<
    'email' | 'sms' | null
  >(null);
  const handleTestNotification = async (type: 'email' | 'sms') => {
    setTestingNotification(type);
    try {
      await sendTestNotification(type);
    } finally {
      setTestingNotification(null);
    }
  };
  const handlePreferenceChange = async (key: string, value: boolean) => {
    await updatePreferences({ [key]: value });
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <ScheduleIcon color="info" />;
    }
  };
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <SmsIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  if (alertsLoading || preferencesLoading) {
    return (
      <div display="flex" justifyContent="center" alignItems="center" p={4}>
        <Spinner />
        <div  className="">
          Loading notifications...
        </div>
      </div>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div display="flex" alignItems="center" gap={2}>
          <Badge badgeContent={criticalAlertsCount} color="error">
            <NotificationsActiveIcon
              color={hasCriticalAlerts ? 'error' : 'primary'}
            />
          </Badge>
          <div  component="h1">
            Notification Center
          </div>
          {!notificationsEnabled && (
            <Chip
              icon={<NotificationsOffIcon />}
              label="Notifications Disabled"
              color="warning"
              
            />
          )}
        </div>
        <div display="flex" gap={1}>
          <Tooltip
            title={
              pollingEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            }
          >
            <IconButton
              onClick={pollingEnabled ? disablePolling : enablePolling}
              color={pollingEnabled ? 'primary' : 'default'}
            >
              <NotificationsActiveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh notifications">
            <IconButton onClick={refreshAlerts}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialog(true)}
          >
            Settings
          </Button>
        </div>
      </div>
      {/* Statistics Cards */}
      <div container spacing={3} className="">
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" gap={2}>
                <ErrorIcon color="error" />
                <div>
                  <div  color="error">
                    {criticalAlertsCount}
                  </div>
                  <div  color="text.secondary">
                    Critical Alerts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" gap={2}>
                <WarningIcon color="warning" />
                <div>
                  <div  color="warning.main">
                    {unacknowledgedAlertsCount}
                  </div>
                  <div  color="text.secondary">
                    Unacknowledged
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon color="success" />
                <div>
                  <div  color="success.main">
                    {stats?.sent || 0}
                  </div>
                  <div  color="text.secondary">
                    Delivered Today
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="info" />
                <div>
                  <div  color="info.main">
                    {stats?.pending || 0}
                  </div>
                  <div  color="text.secondary">
                    Pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Critical Alerts Banner */}
      {alerts.length > 0 && (
        <CriticalAlertBanner
          alerts={alerts}
          onAlertAcknowledge={acknowledgeAlert}
          onAlertDismiss={dismissAlert}
          onViewOrder={onViewOrder || (() => {})}
          onScheduleReferral={onScheduleReferral}
          onCreateCarePlan={onCreateCarePlan}
          onUpdatePreferences={updatePreferences}
          currentPreferences={preferences}
        />
      )}
      {/* Notification Statistics */}
      {stats && (
        <div container spacing={3} className="">
          <div item xs={12} md={6}>
            <Card>
              <CardContent>
                <div  gutterBottom>
                  Notifications by Type
                </div>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <TableRow key={type}>
                          <TableCell>
                            {type
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </TableCell>
                          <TableCell align="right">{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </div>
          <div item xs={12} md={6}>
            <Card>
              <CardContent>
                <div  gutterBottom>
                  Delivery Channels
                </div>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Channel</TableCell>
                        <TableCell align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(stats.byChannel).map(
                        ([channel, count]) => (
                          <TableRow key={channel}>
                            <TableCell>
                              <div display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                {channel.toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell align="right">{count}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Settings Dialog */}
      <Dialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            Notification Settings
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="">
            <div  gutterBottom>
              Alert Types
            </div>
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.criticalAlerts !== false}
                  onChange={(e) =>
                    handlePreferenceChange('criticalAlerts', e.target.checked)}
                  }
                />
              }
              label="Critical Alerts"
            />
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.resultNotifications !== false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'resultNotifications',
                      e.target.checked
                    )}
                  }
                />
              }
              label="Result Notifications"
            />
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.orderReminders !== false}
                  onChange={(e) =>
                    handlePreferenceChange('orderReminders', e.target.checked)}
                  }
                />
              }
              label="Order Reminders"
            />
            <Separator className="" />
            <div  gutterBottom>
              Delivery Channels
            </div>
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.email !== false}
                  onChange={(e) =>
                    handlePreferenceChange('email', e.target.checked)}
                  }
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.sms === true}
                  onChange={(e) =>
                    handlePreferenceChange('sms', e.target.checked)}
                  }
                />
              }
              label="SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch}
                  checked={preferences?.push === true}
                  onChange={(e) =>
                    handlePreferenceChange('push', e.target.checked)}
                  }
                  disabled
                />
              }
              label="Push Notifications (Coming Soon)"
            />
            <Separator className="" />
            <div  gutterBottom>
              Test Notifications
            </div>
            <div display="flex" gap={2}>
              <Button
                
                startIcon={
                  testingNotification === 'email' ? (}
                    <Spinner size={16} />
                  ) : (
                    <EmailIcon />
                  )
                }
                onClick={() => handleTestNotification('email')}
                disabled={testingNotification !== null}
              >
                Test Email
              </Button>
              <Button
                
                startIcon={
                  testingNotification === 'sms' ? (}
                    <Spinner size={16} />
                  ) : (
                    <SmsIcon />
                  )
                }
                onClick={() => handleTestNotification('sms')}
                disabled={testingNotification !== null}
              >
                Test SMS
              </Button>
            </div>
            <Alert severity="info" className="">
              Critical alerts will always be delivered via email regardless of
              preferences. SMS notifications require a valid phone number in
              your profile.
            </Alert>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default NotificationDashboard;
