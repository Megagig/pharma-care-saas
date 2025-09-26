import { Button, Card, CardContent, Tooltip, Spinner, Alert, Switch, Separator } from '@/components/ui/button';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  followUpReminders: boolean;
  criticalAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}
const MTRNotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({ 
    email: true,
    sms: false,
    push: true,
    followUpReminders: true,
    criticalAlerts: true,
    dailyDigest: false,
    weeklyReport: false}
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();
  // Fetch current preferences
  const { data: currentPreferences, isLoading } = useQuery({ 
    queryKey: ['notificationPreferences'],
    queryFn: mtrNotificationService.getNotificationPreferences}
  });
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({ 
    mutationFn: mtrNotificationService.updateNotificationPreferences,
    onSuccess: () => { })
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setHasChanges(false);
    }
  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({ 
    mutationFn: (type: 'email' | 'sms') =>
      mtrNotificationService.sendTestNotification(type),
    onSuccess: (_, type) => {
      setTestNotificationSent(type);
      setTimeout(() => setTestNotificationSent(null), 5000); })
    }
  // Update local state when data is fetched
  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);
  const handlePreferenceChange =
    (key: keyof NotificationPreferences) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPreferences = {
        ...preferences,
        [key]: event.target.checked,
      };
      setPreferences(newPreferences);
      setHasChanges(true);
    };
  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };
  const handleReset = () => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
      setHasChanges(false);
    }
  };
  const handleTestNotification = (type: 'email' | 'sms') => {
    sendTestNotificationMutation.mutate(type);
  };
  if (isLoading) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Spinner />
      </div>
    );
  }
  return (
    <Card>
      <CardContent>
        <div display="flex" alignItems="center" mb={3}>
          <NotificationsIcon className="" />
          <div  component="h2">
            MTR Notification Preferences
          </div>
        </div>
        <div  color="text.secondary" mb={3}>
          Configure how you want to receive notifications for Medication Therapy
          Review activities.
        </div>
        {updatePreferencesMutation.isError && (
          <Alert severity="error" className="">
            Failed to update notification preferences. Please try again.
          </Alert>
        )}
        {updatePreferencesMutation.isSuccess && (
          <Alert severity="success" className="">
            Notification preferences updated successfully!
          </Alert>
        )}
        {testNotificationSent && (
          <Alert severity="info" className="">
            Test {testNotificationSent} notification sent! Check your{' '}
            {testNotificationSent === 'email' ? 'inbox' : 'phone'}.
          </Alert>
        )}
        <div container spacing={3}>
          {/* Communication Channels */}
          <div item xs={12} md={6}>
            <div mb={3}>
              <div  gutterBottom>
                Communication Channels
              </div>
              <div  color="text.secondary" mb={2}>
                Choose how you want to receive notifications
              </div>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.email}
                      onChange={handlePreferenceChange('email')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <EmailIcon className="" />
                      Email Notifications
                      <Tooltip title="Test email notification">
                        <IconButton
                          size="small"}
                          onClick={() => handleTestNotification('email')}
                          disabled={
                            !preferences.email ||
                            sendTestNotificationMutation.isPending}
                          }
                          className=""
                        >
                          <TestIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.sms}
                      onChange={handlePreferenceChange('sms')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <SmsIcon className="" />
                      SMS Notifications
                      <Tooltip title="Test SMS notification">
                        <IconButton
                          size="small"}
                          onClick={() => handleTestNotification('sms')}
                          disabled={
                            !preferences.sms ||
                            sendTestNotificationMutation.isPending}
                          }
                          className=""
                        >
                          <TestIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.push}
                      onChange={handlePreferenceChange('push')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <PushIcon className="" />
                      Push Notifications
                      <Chip
                        label="Coming Soon"
                        size="small"
                        color="secondary"
                        className=""
                      />
                    </div>}
                  }
                />
              </FormGroup>
            </div>
          </div>
          {/* Notification Types */}
          <div item xs={12} md={6}>
            <div mb={3}>
              <div  gutterBottom>
                Notification Types
              </div>
              <div  color="text.secondary" mb={2}>
                Select which types of notifications you want to receive
              </div>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.followUpReminders}
                      onChange={handlePreferenceChange('followUpReminders')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <ScheduleIcon className="" />
                      Follow-up Reminders
                      <Tooltip title="Reminders for scheduled MTR follow-ups">
                        <InfoIcon
                          className=""
                        />
                      </Tooltip>
                    </div>}
                  }
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.criticalAlerts}
                      onChange={handlePreferenceChange('criticalAlerts')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <WarningIcon
                        className=""
                      />
                      Critical Alerts
                      <Tooltip title="Immediate alerts for critical drug interactions and high-severity problems">
                        <InfoIcon
                          className=""
                        />
                      </Tooltip>
                    </div>}
                  }
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.dailyDigest}
                      onChange={handlePreferenceChange('dailyDigest')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <ReportIcon className="" />
                      Daily Digest
                      <Tooltip title="Daily summary of MTR activities and pending tasks">
                        <InfoIcon
                          className=""
                        />
                      </Tooltip>
                    </div>}
                  }
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={preferences.weeklyReport}
                      onChange={handlePreferenceChange('weeklyReport')}
                      color="primary"
                    />
                  }
                  label={
                    <div display="flex" alignItems="center">
                      <ReportIcon className="" />
                      Weekly Report
                      <Tooltip title="Weekly performance and statistics report">
                        <InfoIcon
                          className=""
                        />
                      </Tooltip>
                    </div>}
                  }
                />
              </FormGroup>
            </div>
          </div>
        </div>
        <Separator className="" />
        {/* Important Notes */}
        <Alert severity="info" className="">
          <div >
            <strong>Important:</strong>
            <ul >
              <li>
                Critical alerts will always be sent via email regardless of your
                preferences for urgent safety issues.
              </li>
              <li>
                SMS notifications require a valid phone number in your profile.
              </li>
              <li>
                You can test your notification settings using the test buttons
                above.
              </li>
            </ul>
          </div>
        </Alert>
        {/* Action Buttons */}
        <div display="flex" gap={2} justifyContent="flex-end">
          <Button
            
            onClick={handleReset}
            disabled={!hasChanges || updatePreferencesMutation.isPending}
          >
            Reset
          </Button>
          <Button
            
            onClick={handleSave}
            disabled={!hasChanges || updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <Spinner size={20} className="" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default MTRNotificationPreferences;
