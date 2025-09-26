
import { Button, Input, Label, Select, Spinner, Alert, Switch } from '@/components/ui/button';
import {
  usePatientMedicationSettings,
  useUpdatePatientMedicationSettings,
  useTestNotification,
} from '@/hooks/useMedications';

interface MedicationSettingsPanelProps {
  patientId: string;
}

const MedicationSettingsPanel: React.FC<MedicationSettingsPanelProps> = ({ 
  patientId
}) => {
  const [testContactInfo, setTestContactInfo] = React.useState('');
  const [testNotificationType, setTestNotificationType] = React.useState<
    'email' | 'sms'
  >('email');

  // Fetch patient medication settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
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
    defaultNotificationLeadTime: 15,
    customMessage: 'Time to take your medication!',
    repeatReminders: false,
    repeatInterval: 30,
    smartReminders: false,
    allowSnooze: true,
    snoozeOptions: [5, 10, 15, 30],
    notifyCaregiver: false,
    caregiverContact: ''}
  });

  // State for monitoring settings form
  const [monitoringSettings, setMonitoringSettings] = React.useState({ 
    adherenceMonitoring: false,
    refillReminders: false,
    interactionChecking: true,
    refillThreshold: 20,
    missedDoseThreshold: 2,
    adherenceReporting: false,
    reportFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    alertOnLowAdherence: false,
    lowAdherenceThreshold: 70,
    stockoutPrediction: false}
  });

  // Initialize form with data when it loads
    if (settings) {
      setReminderSettings((prev) => ({ 
        ...prev,
        enabled: settings.reminderSettings.enabled,
        defaultReminderTimes: settings.reminderSettings.defaultReminderTimes,
        reminderMethod: settings.reminderSettings.reminderMethod,
        defaultNotificationLeadTime:
          settings.reminderSettings.defaultNotificationLeadTime}
      }));

      setMonitoringSettings((prev) => ({ 
        ...prev,
        adherenceMonitoring: settings.monitoringSettings.adherenceMonitoring,
        refillReminders: settings.monitoringSettings.refillReminders,
        interactionChecking: settings.monitoringSettings.interactionChecking}
      }));
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

  // State for test message
  const [testMessage, setTestMessage] = React.useState(
    reminderSettings.customMessage || 'Time to take your medication!'
  );

  // Handle notification test
  const handleTestNotification = async () => {
    if (!testContactInfo) {
      alert('Please enter a valid email or phone number.');
      return;
    }

    try {
      const result = await testNotificationMutation.mutateAsync({ 
        patientId,
        type: testNotificationType,
        contact: testContactInfo}
      });

      // Show success or error message
      if (result.success) {
        alert(`${result.message}\n\n${result.details || ''}`);
      } else {
        alert(`Failed to send test notification: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Failed to send test notification. Please try again.');
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
        Error loading medication settings:{' '}
        {(settingsError as Error).message || 'Unknown error'}
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
          <div className="" component="div">
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

          <div
            className="" component="div"
          >
            <div fullWidth>
              <Label id="reminder-method-label">
                Reminder Method
              </Label>
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

          <div
            className="" component="div"
          >
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

          <div className="" component="div">
            <Input
              fullWidth
              label="Custom Reminder Message"
              value={reminderSettings.customMessage}
              onChange={(e) =>
                setReminderSettings({ 
                  ...reminderSettings}
                  customMessage: e.target.value,}
                })
              }
              disabled={!reminderSettings.enabled}
              helperText="Custom message to include in medication reminders"
            />
          </div>

          <div
            className="" component="div"
          >
            <FormControlLabel
              control={
                <Switch}
                  checked={reminderSettings.repeatReminders}
                  onChange={(e) =>
                    setReminderSettings({ 
                      ...reminderSettings}
                      repeatReminders: e.target.checked,}
                    })
                  }
                  disabled={!reminderSettings.enabled}
                />
              }
              label="Repeat Reminders"
            />
            {reminderSettings.repeatReminders && (
              <Input
                type="number"
                label="Repeat Interval (minutes)"
                value={reminderSettings.repeatInterval}
                onChange={(e) =>
                  setReminderSettings({ 
                    ...reminderSettings}
                    repeatInterval: parseInt(e.target.value) || 0,}
                  })
                }
                disabled={!reminderSettings.enabled}
                InputProps={{ inputProps: { min: 5, max: 120 }
                size="small"
                className=""
              />
            )}
          </div>

          <div
            className="" component="div"
          >
            <FormControlLabel
              control={
                <Switch}
                  checked={reminderSettings.smartReminders}
                  onChange={(e) =>
                    setReminderSettings({ 
                      ...reminderSettings}
                      smartReminders: e.target.checked,}
                    })
                  }
                  disabled={!reminderSettings.enabled}
                />
              }
              label="Smart Reminders"
            />
            <p>
              Adaptive reminders based on patient behavior patterns
            </p>
          </div>

          <div
            className="" component="div"
          >
            <FormControlLabel
              control={
                <Switch}
                  checked={reminderSettings.allowSnooze}
                  onChange={(e) =>
                    setReminderSettings({ 
                      ...reminderSettings}
                      allowSnooze: e.target.checked,}
                    })
                  }
                  disabled={!reminderSettings.enabled}
                />
              }
              label="Allow Snooze"
            />
            <p>
              Enable snooze functionality for medication reminders
            </p>
          </div>

          <div
            className="" component="div"
          >
            <FormControlLabel
              control={
                <Switch}
                  checked={reminderSettings.notifyCaregiver}
                  onChange={(e) =>
                    setReminderSettings({ 
                      ...reminderSettings}
                      notifyCaregiver: e.target.checked,}
                    })
                  }
                  disabled={!reminderSettings.enabled}
                />
              }
              label="Notify Caregiver"
            />
            {reminderSettings.notifyCaregiver && (
              <Input
                fullWidth
                label="Caregiver Contact"
                value={reminderSettings.caregiverContact}
                onChange={(e) =>
                  setReminderSettings({ 
                    ...reminderSettings}
                    caregiverContact: e.target.value,}
                  })
                }
                placeholder="Email or phone number"
                disabled={!reminderSettings.enabled}
                size="small"
                className=""
              />
            )}
          </div>

          <div className="" component="div">
            <div  gutterBottom>
              Default Reminder Times
            </div>
            <div className="">
              <div  color="text.secondary">
                These times will be used as defaults when setting up medication
                schedules
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
                  onChange={(e) =>
                    handleReminderTimeChange(index, e.target.value)}
                  }
                  disabled={!reminderSettings.enabled}
                  className=""
                />
                <Button
                  
                  color="error"
                  size="small"
                  onClick={() => handleRemoveReminderTime(index)}
                  disabled={
                    !reminderSettings.enabled ||
                    reminderSettings.defaultReminderTimes.length <= 1}
                  }
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
          <div
            className="" component="div"
          >
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

            {monitoringSettings.adherenceMonitoring && (
              <div className="">
                <FormControlLabel
                  control={
                    <Switch}
                      checked={monitoringSettings.adherenceReporting}
                      onChange={(e) =>
                        setMonitoringSettings({ 
                          ...monitoringSettings}
                          adherenceReporting: e.target.checked,}
                        })
                      }
                      size="small"
                    />
                  }
                  label="Generate Adherence Reports"
                />

                {monitoringSettings.adherenceReporting && (
                  <div
                    fullWidth
                    size="small"
                    className=""
                  >
                    <Label id="report-frequency-label">
                      Report Frequency
                    </Label>
                    <Select
                      labelId="report-frequency-label"
                      value={monitoringSettings.reportFrequency}
                      label="Report Frequency"
                      onChange={(e) =>
                        setMonitoringSettings({ 
                          ...monitoringSettings,
                          reportFrequency: e.target.value as
                            | 'daily'
                            | 'weekly' })
                            | 'monthly',}
                        })
                      }
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </div>
                )}

                <FormControlLabel
                  control={
                    <Switch}
                      checked={monitoringSettings.alertOnLowAdherence}
                      onChange={(e) =>
                        setMonitoringSettings({ 
                          ...monitoringSettings}
                          alertOnLowAdherence: e.target.checked,}
                        })
                      }
                      size="small"
                    />
                  }
                  label="Alert on Low Adherence"
                  className=""
                />

                {monitoringSettings.alertOnLowAdherence && (
                  <Input
                    type="number"
                    label="Low Adherence Threshold %"
                    value={monitoringSettings.lowAdherenceThreshold}
                    onChange={(e) =>
                      setMonitoringSettings({ 
                        ...monitoringSettings}
                        lowAdherenceThreshold: parseInt(e.target.value) || 0,}
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 }
                    size="small"
                    className=""
                  />
                )}
              </div>
            )}
          </div>

          <div
            className="" component="div"
          >
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

            {monitoringSettings.refillReminders && (
              <div className="">
                <Input
                  type="number"
                  label="Refill Threshold %"
                  value={monitoringSettings.refillThreshold}
                  onChange={(e) =>
                    setMonitoringSettings({ 
                      ...monitoringSettings}
                      refillThreshold: parseInt(e.target.value) || 0,}
                    })
                  }
                  helperText="Percentage remaining to trigger refill reminder"
                  InputProps={{ inputProps: { min: 0, max: 50 }
                  size="small"
                  className=""
                />

                <FormControlLabel
                  control={
                    <Switch}
                      checked={monitoringSettings.stockoutPrediction}
                      onChange={(e) =>
                        setMonitoringSettings({ 
                          ...monitoringSettings}
                          stockoutPrediction: e.target.checked,}
                        })
                      }
                      size="small"
                    />
                  }
                  label="Predict Medication Stockouts"
                  className=""
                />
              </div>
            )}
          </div>

          <div className="" component="div">
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

            {monitoringSettings.interactionChecking && (
              <div className="">
                <Input
                  type="number"
                  label="Missed Dose Threshold"
                  value={monitoringSettings.missedDoseThreshold}
                  onChange={(e) =>
                    setMonitoringSettings({ 
                      ...monitoringSettings}
                      missedDoseThreshold: parseInt(e.target.value) || 0,}
                    })
                  }
                  helperText="Consecutive missed doses to trigger an alert"
                  InputProps={{ inputProps: { min: 1, max: 10 }
                  size="small"
                  className=""
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div  component="h2" gutterBottom>
        Test Notifications
      </div>

      <div className="">
        <div container spacing={3}>
          <div
            className="" component="div"
          >
            <div fullWidth>
              <Label id="test-notification-type-label">
                Notification Type
              </Label>
              <Select
                labelId="test-notification-type-label"
                id="test-notification-type"
                value={testNotificationType}
                label="Notification Type"
                onChange={(e) =>
                  setTestNotificationType(e.target.value as 'email' | 'sms')}
                }
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </Select>
            </div>
          </div>

          <div
            className="" component="div"
          >
            <Input
              fullWidth
              label={
                testNotificationType === 'email'
                  ? 'Email Address'
                  : 'Phone Number'}
              }
              value={testContactInfo}
              placeholder={
                testNotificationType === 'email'
                  ? 'example@email.com'
                  : '+1 (555) 123-4567'}
              }
              onChange={(e) => setTestContactInfo(e.target.value)}
            />
          </div>

          <div className="" component="div">
            <Input
              fullWidth
              multiline
              rows={2}
              label="Test Message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              helperText="Message to include in the test notification"
              placeholder={
                testNotificationType === 'email'
                  ? 'patient@example.com'
                  : '+1234567890'}
              }
            />
          </div>

          <div className="" component="div">
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
                Failed to send test notification:{' '}
                {(testNotificationMutation.error as Error)?.message ||
                  'Unknown error'}
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
          Failed to save settings:{' '}
          {(updateSettingsMutation.error as Error)?.message || 'Unknown error'}
        </Alert>
      )}
    </div>
  );
};

export default MedicationSettingsPanel;
