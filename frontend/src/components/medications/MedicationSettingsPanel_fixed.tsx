
import { Button, Input, Label, Select, Spinner, Alert, Switch } from '@/components/ui/button';
usePatientMedicationSettings, 
  useUpdatePatientMedicationSettings,
  useTestNotification

interface MedicationSettingsPanelProps {
  patientId: string;
}

const MedicationSettingsPanel: React.FC<MedicationSettingsPanelProps> = ({ patientId }) => {
  const [testContactInfo, setTestContactInfo] = React.useState('');
  const [testNotificationType, setTestNotificationType] = React.useState<'email' | 'sms'>('email');

  // Fetch patient medication settings
  const { 
    data: settings, 
    isLoading: isLoadingSettings, 
    error: settingsError 
  } = usePatientMedicationSettings(patientId);

  // Update patient medication settings mutation
  const updateSettingsMutation = useUpdatePatientMedicationSettings();
  
  // Test notification mutation
  const testNotificationMutation = useTestNotification();

  // State for settings form
  const [reminderSettings, setReminderSettings] = React.useState({ 
    enabled: false,
    defaultReminderTimes: ['09:00', '13:00', '19:00'],
    reminderMethod: 'email' as 'email' | 'sms' | 'both',
    defaultNotificationLeadTime: 15}
  });

  // State for monitoring settings form
  const [monitoringSettings, setMonitoringSettings] = React.useState({ 
    adherenceMonitoring: false,
    refillReminders: false,
    interactionChecking: true}
  });

  // Initialize form with data when it loads
    if (settings) {
      setReminderSettings({ 
        enabled: settings.reminderSettings.enabled,
        defaultReminderTimes: settings.reminderSettings.defaultReminderTimes,
        reminderMethod: settings.reminderSettings.reminderMethod,
        defaultNotificationLeadTime: settings.reminderSettings.defaultNotificationLeadTime}
      });

      setMonitoringSettings({ 
        adherenceMonitoring: settings.monitoringSettings.adherenceMonitoring,
        refillReminders: settings.monitoringSettings.refillReminders,
        interactionChecking: settings.monitoringSettings.interactionChecking}
      });
    }
  }, [settings]);

  // Handle form submission
  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({ 
        patientId,
        settings: {
          reminderSettings,
          monitoringSettings}
        }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Handle reminder time change
  const handleReminderTimeChange = (index: number, value: string) => {
    const newTimes = [...reminderSettings.defaultReminderTimes];
    newTimes[index] = value;
    setReminderSettings({ 
      ...reminderSettings,
      defaultReminderTimes: newTimes}
    });
  };

  // Add a reminder time
  const handleAddReminderTime = () => {
    setReminderSettings({ 
      ...reminderSettings,
      defaultReminderTimes: [...reminderSettings.defaultReminderTimes, '12:00']}
    });
  };

  // Remove a reminder time
  const handleRemoveReminderTime = (index: number) => {
    const newTimes = [...reminderSettings.defaultReminderTimes];
    newTimes.splice(index, 1);
    setReminderSettings({ 
      ...reminderSettings,
      defaultReminderTimes: newTimes}
    });
  };

  // Handle notification test
  const handleTestNotification = async () => {
    try {
      await testNotificationMutation.mutateAsync({ 
        patientId,
        type: testNotificationType,
        contact: testContactInfo}
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="">
        <Spinner />
      </div>
    );
  }

  if (settingsError) {
    return (
      <Alert severity="error" className="">
        Error loading medication settings: {(settingsError as Error).message || 'Unknown error'}
      </Alert>
    );
  }

  return (
    <div className="">
      <div  component="h2" gutterBottom>
        Medication Reminder Settings
      </div>
      
      <div className="">
        <div container spacing={3}>
          <div item xs={12} component="div">
            <FormControlLabel
              control={
                <Switch}
                  checked={reminderSettings.enabled}
                  onChange={(e) =>
                    setReminderSettings({ 
                      ...reminderSettings}
                      enabled: e.target.checked,}
                    })
                  }
                  name="enabled"
                />
              }
              label="Enable Medication Reminders"
            />
            <p>
              When enabled, reminders will be sent based on the schedule below
            </p>
          </div>

          <div item xs={12} sm={6} component="div">
            <div fullWidth>
              <Label id="reminder-method-label">Reminder Method</Label>
              <Select
                labelId="reminder-method-label"
                id="reminder-method"
                value={reminderSettings.reminderMethod}
                label="Reminder Method"
                onChange={(e) =>
                  setReminderSettings({ 
                    ...reminderSettings}
                    reminderMethod: e.target.value as 'email' | 'sms' | 'both',}
                  })
                }
                disabled={!reminderSettings.enabled}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Both Email and SMS</MenuItem>
              </Select>
              <p>
                Choose how you want to receive medication reminders
              </p>
            </div>
          </div>

          <div item xs={12} sm={6} component="div">
            <Input
              fullWidth
              type="number"
              label="Default Notification Lead Time (minutes)"
              value={reminderSettings.defaultNotificationLeadTime}
              onChange={(e) =>
                setReminderSettings({ 
                  ...reminderSettings}
                  defaultNotificationLeadTime: parseInt(e.target.value) || 0,}
                })
              }
              disabled={!reminderSettings.enabled}
              InputProps={{ inputProps: { min: 0, max: 120 }
              helperText="How many minutes before the scheduled time to send reminders"
            />
          </div>

          <div item xs={12} component="div">
            <div  gutterBottom>
              Default Reminder Times
            </div>
            <div className="">
              <div  color="text.secondary">
                These times will be used as defaults when setting up medication schedules
              </div>
            </div>

            {reminderSettings.defaultReminderTimes.map((time, index) => (
              <div
                key={index}
                className=""
              >
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                  disabled={!reminderSettings.enabled}
                  className=""
                />
                <Button
                  
                  color="error"
                  size="small"
                  onClick={() => handleRemoveReminderTime(index)}
                  disabled={!reminderSettings.enabled || reminderSettings.defaultReminderTimes.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              
              onClick={handleAddReminderTime}
              disabled={!reminderSettings.enabled}
              className=""
            >
              Add Reminder Time
            </Button>
          </div>
        </div>
      </div>

      <div  component="h2" gutterBottom>
        Monitoring Settings
      </div>

      <div className="">
        <div container spacing={3}>
          <div item xs={12} component="div">
            <FormControlLabel
              control={
                <Switch}
                  checked={monitoringSettings.adherenceMonitoring}
                  onChange={(e) =>
                    setMonitoringSettings({ 
                      ...monitoringSettings}
                      adherenceMonitoring: e.target.checked,}
                    })
                  }
                />
              }
              label="Enable Adherence Monitoring"
            />
            <p>
              Track and analyze medication adherence patterns
            </p>
          </div>

          <div item xs={12} component="div">
            <FormControlLabel
              control={
                <Switch}
                  checked={monitoringSettings.refillReminders}
                  onChange={(e) =>
                    setMonitoringSettings({ 
                      ...monitoringSettings}
                      refillReminders: e.target.checked,}
                    })
                  }
                />
              }
              label="Enable Refill Reminders"
            />
            <p>
              Send reminders when medications need to be refilled
            </p>
          </div>

          <div item xs={12} component="div">
            <FormControlLabel
              control={
                <Switch}
                  checked={monitoringSettings.interactionChecking}
                  onChange={(e) =>
                    setMonitoringSettings({ 
                      ...monitoringSettings}
                      interactionChecking: e.target.checked,}
                    })
                  }
                />
              }
              label="Enable Medication Interaction Checking"
            />
            <p>
              Check for potential interactions between medications
            </p>
          </div>
        </div>
      </div>

      <div  component="h2" gutterBottom>
        Test Notifications
      </div>

      <div className="">
        <div container spacing={3}>
          <div item xs={12} sm={4} component="div">
            <div fullWidth>
              <Label id="test-notification-type-label">Notification Type</Label>
              <Select
                labelId="test-notification-type-label"
                id="test-notification-type"
                value={testNotificationType}
                label="Notification Type"
                onChange={(e) => setTestNotificationType(e.target.value as 'email' | 'sms')}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </Select>
            </div>
          </div>

          <div item xs={12} sm={8} component="div">
            <Input
              fullWidth
              label={testNotificationType === 'email' ? 'Email Address' : 'Phone Number'}
              value={testContactInfo}
              onChange={(e) => setTestContactInfo(e.target.value)}
              placeholder={
                testNotificationType === 'email'
                  ? 'patient@example.com'
                  : '+1234567890'}
              }
            />
          </div>

          <div item xs={12} component="div">
            <Button
              
              onClick={handleTestNotification}
              disabled={!testContactInfo || testNotificationMutation.isPending}
            >
              Send Test Notification
              {testNotificationMutation.isPending && (
                <Spinner size={20} className="" />
              )}
            </Button>
            {testNotificationMutation.isSuccess && (
              <Alert severity="success" className="">
                Test notification sent successfully!
              </Alert>
            )}
            {testNotificationMutation.isError && (
              <Alert severity="error" className="">
                Failed to send test notification: {(testNotificationMutation.error as Error)?.message || 'Unknown error'}
              </Alert>
            )}
          </div>
        </div>
      </div>

      <div className="">
        <Button
          
          color="primary"
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
        >
          Save Settings
          {updateSettingsMutation.isPending && (
            <Spinner size={20} className="" />
          )}
        </Button>
      </div>
      
      {updateSettingsMutation.isSuccess && (
        <Alert severity="success" className="">
          Settings saved successfully!
        </Alert>
      )}
      
      {updateSettingsMutation.isError && (
        <Alert severity="error" className="">
          Failed to save settings: {(updateSettingsMutation.error as Error)?.message || 'Unknown error'}
        </Alert>
      )}
    </div>
  );
};

export default MedicationSettingsPanel;
