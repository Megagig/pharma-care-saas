import { Button, Input, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Progress, Alert, AlertTitle } from '@/components/ui/button';
// Props interfaces
interface ErrorRecoverySystemProps {
  errors: AppError[];
  onRetry?: (errorId: string) => Promise<void>;
  onDismiss?: (errorId: string) => void;
  onClearAll?: () => void;
  showNetworkStatus?: boolean;
  showRetryProgress?: boolean;
  maxVisibleErrors?: number;
}
interface ErrorRecoveryCardProps {
  error: AppError;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}
interface NetworkStatusProps {
  showDetails?: boolean;
}
interface RetryProgressProps {
  activeRetries: string[];
  onCancel?: (operationId: string) => void;
}
// Network status component
const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = true
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Get connection type if available
    const nav = navigator as any;
    if (nav.connection) {
      setConnectionType(nav.connection.effectiveType || 'unknown');
      nav.connection.addEventListener('change', () => {
        setConnectionType(nav.connection.effectiveType || 'unknown');
      });
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOffIcon color="error" />;
    if (connectionType === 'slow-2g' || connectionType === '2g')
      return <CloudOffIcon color="warning" />;
    return <WifiIcon color="success" />;
  };
  const getConnectionText = () => {
    if (!isOnline) return 'Offline';
    if (connectionType === 'slow-2g') return 'Very Slow Connection';
    if (connectionType === '2g') return 'Slow Connection';
    if (connectionType === '3g') return 'Moderate Connection';
    if (connectionType === '4g') return 'Fast Connection';
    return 'Online';
  };
  return (
    <div className="">
      {getConnectionIcon()}
      <div  color={isOnline ? 'text.primary' : 'error'}>
        {getConnectionText()}
      </div>
      {showDetails && !isOnline && lastOnlineTime && (
        <div  color="text.secondary">
          Last online: {lastOnlineTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
// Retry progress component
const RetryProgress: React.FC<RetryProgressProps> = ({ 
  activeRetries,
  onCancel
}) => {
  if (activeRetries.length === 0) return null;
  return (
    <Card className="">
      <CardContent className="">
        <div className="">
          <ReplayIcon color="info" />
          <div >
            Retrying Operations ({activeRetries.length})
          </div>
        </div>
        <div spacing={1}>
          {activeRetries.map((operationId) => (
            <div
              key={operationId}
              className=""
            >
              <Progress className="" />
              <div  className="">
                {operationId}
              </div>
              {onCancel && (
                <IconButton size="small" onClick={() => onCancel(operationId)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
// Individual error recovery card
const ErrorRecoveryCard: React.FC<ErrorRecoveryCardProps> = ({ 
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const { submitErrorReport } = useErrorReporting();
  const getSeverityColor = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };
  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };
  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };
  const handleReportError = async () => {
    try {
      await submitErrorReport(
        error,
        {
          component: 'ErrorRecoveryCard',
          action: 'manual_report',
        },
        reportDescription
      );
      setShowReportDialog(false);
      setReportDescription('');
    } catch (reportError) {
      console.error('Failed to submit error report:', reportError);
    }
  };
  const getRecoveryInstructions = (): string[] => {
    switch (error.recoveryAction) {
      case 'retry':
        return [
          'Wait a moment and try again',
          'Check your internet connection',
          'If the problem persists, contact support',
        ];
      case 'refresh':
        return [
          'Refresh the page and try again',
          'Clear your browser cache',
          'Make sure you have the latest version',
        ];
      case 'validate_input':
        return [
          'Check your input for errors',
          'Make sure all required fields are filled',
          'Verify the data format is correct',
        ];
      case 'check_permissions':
        return [
          'Contact your administrator for access',
          'Make sure you have the required permissions',
          'Try logging out and back in',
        ];
      case 'check_network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact IT support if issues persist',
        ];
      default:
        return [
          'Try the action again',
          'Contact support if the problem persists',
        ];
    }
  };
  if (compact) {
    return (
      <Alert
        severity={getSeverityColor() as any}
        className=""
        action={}
          <div direction="row" spacing={1}>
            {onRetry && (
              <Button
                size="small"
                onClick={handleRetry}
                disabled={isRetrying}
                startIcon={
                  isRetrying ? (
                    <Progress className="" />
                  ) : (
                    <RefreshIcon />
                  )}
                }
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <IconButton size="small" onClick={onDismiss}>
                <CancelIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        }
      >
        <AlertTitle>{error.type.replace(/_/g, ' ')}</AlertTitle>
        {error.message}
      </Alert>
    );
  }
  return (
    <>
      <Card className="">
        <CardContent>
          <div
            className=""
          >
            {getSeverityIcon()}
            <div className="">
              <div
                
                className=""
              >
                {error.type.replace(/_/g, ' ')}
                <Chip
                  label={error.severity.toUpperCase()}
                  size="small"
                  color={getSeverityColor() as any}
                />
              </div>
              <div  color="text.secondary" className="">
                {new Date(error.timestamp).toLocaleString()}
              </div>
              <div  className="">
                {error.message}
              </div>
              {/* Recovery Instructions */}
              <div className="">
                <div  gutterBottom>
                  Recovery Steps:
                </div>
                <List dense>
                  {getRecoveryInstructions().map((instruction, index) => (
                    <div key={index} className="">
                      <div className="">
                        <CheckCircleIcon fontSize="small" color="primary" />
                      </div>
                      <div
                        primary={instruction}
                        
                      />
                    </div>
                  ))}
                </List>
              </div>
              {/* Error Details */}
              <div>
                <Button
                  size="small"
                  startIcon={
                    showErrorDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  }
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                >
                  {showErrorDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
                <Collapse in={showErrorDetails}>
                  <div
                    className=""
                  >
                    <div
                      
                      component="pre"
                      className=""
                    >
                      <strong>Error Type:</strong> {error.type}
                      {'\n'}
                      <strong>Severity:</strong> {error.severity}
                      {'\n'}
                      <strong>Recovery Action:</strong> {error.recoveryAction}
                      {'\n'}
                      <strong>Timestamp:</strong> {error.timestamp}
                      {error.details &&
                        Object.keys(error.details).length > 0 && (
                          <>
                            {'\n\n'}
                            <strong>Details:</strong>
                            {'\n'}
                            {JSON.stringify(error.details, null, 2)}
                          </>
                        )}
                      {error.technicalMessage && (
                        <>
                          {'\n\n'}
                          <strong>Technical Message:</strong>
                          {'\n'}
                          {error.technicalMessage}
                        </>
                      )}
                    </div>
                  </div>
                </Collapse>
              </div>
            </div>
          </div>
        </CardContent>
        <CardActions className="">
          <div direction="row" spacing={1}>
            {onRetry && (
              <Button
                
                startIcon={
                  isRetrying ? (
                    <Progress className="" />
                  ) : (
                    <RefreshIcon />
                  )}
                }
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
            <Button  onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
          <div direction="row" spacing={1}>
            <Button
              startIcon={<BugReportIcon />}
              onClick={() => setShowReportDialog(true)}
              size="small"
            >
              Report
            </Button>
            {onDismiss && (
              <Button onClick={onDismiss} size="small">
                Dismiss
              </Button>
            )}
          </div>
        </CardActions>
      </Card>
      {/* Error Report Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Error</DialogTitle>
        <DialogContent>
          <div  color="text.secondary" className="">
            Help us improve by describing what you were doing when this error
            occurred.
          </div>
          <Input
            fullWidth
            multiline
            rows={4}
            label="Describe what happened"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="I was trying to..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button
            
            startIcon={<SendIcon />}
            onClick={handleReportError}
            disabled={!reportDescription.trim()}
          >
            Send Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
// Main error recovery system component
const ErrorRecoverySystem: React.FC<ErrorRecoverySystemProps> = ({ 
  errors,
  onRetry,
  onDismiss,
  onClearAll,
  showNetworkStatus = true,
  showRetryProgress = true,
  maxVisibleErrors = 5
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeRetries, cancelRetry } = useRetry();
  const { hasPendingReports, pendingReportsCount } = useErrorReporting();
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showSystemPanel, setShowSystemPanel] = useState(false);
  const visibleErrors = showAllErrors
    ? errors
    : errors.slice(0, maxVisibleErrors);
  const hasMoreErrors = errors.length > maxVisibleErrors;
  if (errors.length === 0 && activeRetries.length === 0 && !hasPendingReports) {
    return null;
  }
  return (
    <div className="">
      {/* Network Status */}
      {showNetworkStatus && (
        <div
          className=""
        >
          <NetworkStatus showDetails={!isMobile} />
        </div>
      )}
      {/* Retry Progress */}
      {showRetryProgress && (
        <RetryProgress activeRetries={activeRetries} onCancel={cancelRetry} />
      )}
      {/* Error List */}
      {errors.length > 0 && (
        <div className="">
          <div
            className=""
          >
            <div >
              Active Errors ({errors.length})
            </div>
            {onClearAll && (
              <Button size="small" onClick={onClearAll}>
                Clear All
              </Button>
            )}
          </div>
          {visibleErrors.map((error, index) => (
            <ErrorRecoveryCard
              key={`${error.type}-${error.timestamp}-${index}`}
              error={error}
              onRetry={onRetry ? () => onRetry(error.type) : undefined}
              onDismiss={onDismiss ? () => onDismiss(error.type) : undefined}
              compact={isMobile}
            />
          ))}
          {hasMoreErrors && (
            <Button
              fullWidth
              
              onClick={() => setShowAllErrors(!showAllErrors)}
              className=""
            >
              {showAllErrors
                ? 'Show Less'
                : `Show ${errors.length - maxVisibleErrors} More Errors`}
            </Button>
          )}
        </div>
      )}
      {/* Floating Action Button for System Panel */}
      {(hasPendingReports || activeRetries.length > 0) && (
        <Fab
          color="primary"
          size="small"
          className=""
          onClick={() => setShowSystemPanel(true)}
        >
          <Badge
            badgeContent={pendingReportsCount + activeRetries.length}
            color="error"
          >
            <NetworkCheckIcon />
          </Badge>
        </Fab>
      )}
      {/* System Panel Dialog */}
      <Dialog
        open={showSystemPanel}
        onClose={() => setShowSystemPanel(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>System Status</DialogTitle>
        <DialogContent>
          <div spacing={2}>
            <NetworkStatus showDetails={true} />
            {activeRetries.length > 0 && (
              <RetryProgress
                activeRetries={activeRetries}
                onCancel={cancelRetry}
              />
            )}
            {hasPendingReports && (
              <Alert severity="info">
                <AlertTitle>Pending Error Reports</AlertTitle>
                {pendingReportsCount} error report
                {pendingReportsCount !== 1 ? 's' : ''} waiting to be sent. They
                will be automatically sent when connection is restored.
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSystemPanel(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default ErrorRecoverySystem;
export { NetworkStatus, RetryProgress, ErrorRecoveryCard };
