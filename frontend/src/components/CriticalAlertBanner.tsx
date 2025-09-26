import { Button, Dialog, DialogContent, DialogTitle, Alert, AlertTitle, Switch } from '@/components/ui/button';
// Types for critical alerts
interface CriticalAlert {
  id: string;
  type:
    | 'critical_result'
    | 'red_flag_detected'
    | 'urgent_referral_needed'
    | 'drug_interaction';
  severity: 'critical' | 'major' | 'moderate';
  orderId: string;
  patientId: string;
  patientName: string;
  patientMRN?: string;
  message: string;
  details: any;
  requiresImmediate: boolean;
  timestamp: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  aiInterpretation?: any;
}
interface NotificationPreferences {
  criticalAlerts: boolean;
  resultNotifications: boolean;
  orderReminders: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}
interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  onAlertAcknowledge: (alertId: string) => void;
  onAlertDismiss: (alertId: string) => void;
  onViewOrder: (orderId: string) => void;
  onScheduleReferral?: (alert: CriticalAlert) => void;
  onCreateCarePlan?: (alert: CriticalAlert) => void;
  onUpdatePreferences?: (preferences: Partial<NotificationPreferences>) => void;
  currentPreferences?: NotificationPreferences;
  className?: string;
}
const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({ 
  alerts,
  onAlertAcknowledge,
  onAlertDismiss,
  onViewOrder,
  onScheduleReferral,
  onCreateCarePlan,
  onUpdatePreferences,
  currentPreferences,
  className
}) => {
  // State management
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [preferencesDialog, setPreferencesDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  // Filter out dismissed alerts and sort by severity and timestamp
  const visibleAlerts = alerts
    .filter((alert) => !dismissedAlerts.has(alert.id) && !alert.acknowledged)
    .sort((a, b) => {
      // Sort by severity first (critical > major > moderate)
      const severityOrder = { critical: 3, major: 2, moderate: 1 };
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      // Then by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  // Auto-expand critical alerts
  useEffect(() => {
    const criticalAlerts = visibleAlerts
      .filter((alert) => alert.severity === 'critical')
      .map((alert) => alert.id);
    if (criticalAlerts.length > 0) {
      setExpandedAlerts((prev) => new Set([...prev, ...criticalAlerts]));
    }
  }, [visibleAlerts]);
  // Helper functions
  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'major':
        return 'error';
      case 'moderate':
        return 'warning';
      default:
        return 'info';
    }
  };
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon />;
      case 'major':
        return <WarningIcon />;
      case 'moderate':
        return <WarningIcon />;
      default:
        return <WarningIcon />;
    }
  };
  const getAlertTypeLabel = (type: string): string => {
    switch (type) {
      case 'critical_result':
        return 'Critical Result';
      case 'red_flag_detected':
        return 'Red Flag Detected';
      case 'urgent_referral_needed':
        return 'Urgent Referral';
      case 'drug_interaction':
        return 'Drug Interaction';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };
  const handleToggleExpand = (alertId: string) => {
    setExpandedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };
  const handleAcknowledge = useCallback(
    (alert: CriticalAlert) => {
      onAlertAcknowledge(alert.id);
      setSnackbar({ 
        open: true}
        message: `Alert acknowledged for ${alert.patientName}`,
        severity: 'success'}
    },
    [onAlertAcknowledge]
  );
  const handleDismiss = useCallback(
    (alert: CriticalAlert) => {
      setDismissedAlerts((prev) => new Set([...prev, alert.id]));
      onAlertDismiss(alert.id);
      setSnackbar({ 
        open: true}
        message: `Alert dismissed for ${alert.patientName}`,
        severity: 'info'}
    },
    [onAlertDismiss]
  );
  const handleViewOrder = useCallback(
    (orderId: string) => {
      onViewOrder(orderId);
    },
    [onViewOrder]
  );
  const handleScheduleReferral = useCallback(
    (alert: CriticalAlert) => {
      onScheduleReferral?.(alert);
      setSnackbar({ 
        open: true,
        message: 'Referral scheduling initiated',
        severity: 'info'}
      });
    },
    [onScheduleReferral]
  );
  const handleCreateCarePlan = useCallback(
    (alert: CriticalAlert) => {
      onCreateCarePlan?.(alert);
      setSnackbar({ 
        open: true,
        message: 'Care plan creation initiated',
        severity: 'info'}
      });
    },
    [onCreateCarePlan]
  );
  // Don't render if no visible alerts
  if (visibleAlerts.length === 0) {
    return null;
  }
  return (
    <div className={className} className="">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          
          className=""
        >
          <Alert
            severity={getSeverityColor(alert.severity)}
            icon={getSeverityIcon(alert.severity)}
            action={}
              <div display="flex" alignItems="center" gap={1}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(alert.id)}
                  color="inherit"
                >
                  {expandedAlerts.has(alert.id) ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDismiss(alert)}
                  color="inherit"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            }
            className="">
            <AlertTitle>
              <div display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <div  component="span">
                  {alert.severity === 'critical' ? '🚨' : '⚠️'}{' '}
                  {getAlertTypeLabel(alert.type)}
                </div>
                <Chip
                  label={alert.severity.toUpperCase()}
                  color={getSeverityColor(alert.severity)}
                  size="small"
                />
                {alert.requiresImmediate && (
                  <Chip
                    label="IMMEDIATE ACTION REQUIRED"
                    color="error"
                    size="small"
                    
                  />
                )}
              </div>
            </AlertTitle>
            <div>
              <div  gutterBottom>
                <strong>Patient:</strong> {alert.patientName}
                {alert.patientMRN && ` (MRN: ${alert.patientMRN})`}
              </div>
              <div  gutterBottom>
                <strong>Order:</strong> {alert.orderId}
              </div>
              <div  color="text.secondary" gutterBottom>
                {alert.message}
              </div>
              <div  color="text.secondary">
                {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
            <Collapse in={expandedAlerts.has(alert.id)}>
              <div
                className=""
              >
                {/* Alert Details */}
                {alert.details && (
                  <div className="">
                    <div  gutterBottom>
                      Details:
                    </div>
                    <div  color="text.secondary">
                      {typeof alert.details === 'string'
                        ? alert.details
                        : JSON.stringify(alert.details, null, 2)}
                    </div>
                  </div>
                )}
                {/* AI Interpretation Summary */}
                {alert.aiInterpretation && (
                  <div className="">
                    <div  gutterBottom>
                      AI Interpretation Summary:
                    </div>
                    <List dense>
                      {alert.aiInterpretation.aiAnalysis?.confidenceScore && (
                        <div>
                          <div
                            primary={`Confidence Score: ${alert.aiInterpretation.aiAnalysis.confidenceScore}%`}
                          />
                        </div>
                      )}
                      {alert.aiInterpretation.aiAnalysis?.redFlags?.length >
                        0 && (
                        <div>
                          <div>
                            <WarningIcon color="error" />
                          </div>
                          <div
                            primary={`${alert.aiInterpretation.aiAnalysis.redFlags.length} Red Flags Detected`}
                            secondary={alert.aiInterpretation.aiAnalysis.redFlags
                              .slice(0, 2)
                              .map((flag: any) => flag.flag)}
                              .join(', ')}
                          />
                        </div>
                      )}
                      {alert.aiInterpretation.aiAnalysis?.referralRecommendation
                        ?.recommended && (
                        <div>
                          <div>
                            <HospitalIcon color="info" />
                          </div>
                          <div
                            primary={`Referral to ${alert.aiInterpretation.aiAnalysis.referralRecommendation.specialty}`}
                            secondary={`Urgency: ${alert.aiInterpretation.aiAnalysis.referralRecommendation.urgency}`}
                          />
                        </div>
                      )}
                    </List>
                  </div>
                )}
                {/* Action Buttons */}
                <div display="flex" gap={1} flexWrap="wrap" className="">
                  <Button
                    
                    size="small"
                    onClick={() => handleViewOrder(alert.orderId)}
                    startIcon={<AssignmentIcon />}
                  >
                    View Order
                  </Button>
                  <Button
                    
                    size="small"
                    onClick={() => handleAcknowledge(alert)}
                    color="success"
                  >
                    Acknowledge
                  </Button>
                  {alert.type === 'urgent_referral_needed' &&
                    onScheduleReferral && (
                      <Button
                        
                        size="small"
                        onClick={() => handleScheduleReferral(alert)}
                        startIcon={<ScheduleIcon />}
                        color="warning"
                      >
                        Schedule Referral
                      </Button>
                    )}
                  {onCreateCarePlan && (
                    <Button
                      
                      size="small"
                      onClick={() => handleCreateCarePlan(alert)}
                      startIcon={<AssignmentIcon />}
                    >
                      Create Care Plan
                    </Button>
                  )}
                </div>
              </div>
            </Collapse>
          </Alert>
        </div>
      ))}
      {/* Notification Preferences Button */}
      {onUpdatePreferences && (
        <div display="flex" justifyContent="flex-end" className="">
          <Button
            size="small"
            startIcon={<NotificationsIcon />}
            onClick={() => setPreferencesDialog(true)}
            
          >
            Notification Settings
          </Button>
        </div>
      )}
      {/* Notification Preferences Dialog */}
      <NotificationPreferencesDialog
        open={preferencesDialog}
        onClose={() => setPreferencesDialog(false)}
        preferences={currentPreferences}
        onSave={(preferences) => {
          onUpdatePreferences?.(preferences);
          setPreferencesDialog(false);
          setSnackbar({ 
            open: true,
            message: 'Notification preferences updated'}
            severity: 'success',}
          });
      />
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};
// Notification Preferences Dialog Component
interface NotificationPreferencesDialogProps {
  open: boolean;
  onClose: () => void;
  preferences?: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => void;
}
const NotificationPreferencesDialog: React.FC = ({ open, onClose, preferences, onSave }) => {
  const [localPreferences, setLocalPreferences] =
    useState<NotificationPreferences>({ 
      criticalAlerts: true,
      resultNotifications: true,
      orderReminders: true,
      email: true,
      sms: false,
      push: false,
      ...preferences}
    });
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({ ...localPreferences, ...preferences });
    }
  }, [preferences]);
  const handleSave = () => {
    onSave(localPreferences);
  };
  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPreferences((prev) => ({ 
      ...prev,
      [key]: !prev[key]}
    }));
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div display="flex" alignItems="center" gap={1}>
          <NotificationsIcon />
          Notification Preferences
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
                checked={localPreferences.criticalAlerts}
                onChange={() => handleToggle('criticalAlerts')}
              />
            }
            label="Critical Alerts"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={localPreferences.resultNotifications}
                onChange={() => handleToggle('resultNotifications')}
              />
            }
            label="Result Notifications"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={localPreferences.orderReminders}
                onChange={() => handleToggle('orderReminders')}
              />
            }
            label="Order Reminders"
          />
          <div  gutterBottom className="">
            Delivery Channels
          </div>
          <FormControlLabel
            control={
              <Switch}
                checked={localPreferences.email}
                onChange={() => handleToggle('email')}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={localPreferences.sms}
                onChange={() => handleToggle('sms')}
              />
            }
            label="SMS Notifications"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={localPreferences.push}
                onChange={() => handleToggle('push')}
                disabled
              />
            }
            label="Push Notifications (Coming Soon)"
          />
          <div  color="text.secondary" className="">
            Note: Critical alerts will always be delivered via email regardless
            of preferences. SMS notifications require a valid phone number in
            your profile.
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} >
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default CriticalAlertBanner;
