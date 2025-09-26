import { Button, Input, Dialog, DialogContent, DialogTitle, Spinner, Alert, AlertTitle } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  showDetails: boolean;
  showReportDialog: boolean;
  reportDescription: string;
  isReporting: boolean;
}
class ClinicalNotesErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  public state: State = {
    hasError: false,
    errorId: '',
    showDetails: false,
    showReportDialog: false,
    reportDescription: '',
    isReporting: false,
  };
  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `CN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'ClinicalNotesErrorBoundary caught an error:',
      error,
      errorInfo
    );
    this.setState({ 
      error,
      errorInfo}
    });
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }
  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'clinical-notes',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount,
    };
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.logError(errorData);
    }
    console.error('Clinical Notes Error:', errorData);
  };
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        showDetails: false}
      });
    } else {
      // Max retries reached, suggest page reload
      this.handleReload();
    }
  };
  private handleReload = () => {
    window.location.reload();
  };
  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };
  private handleGoBack = () => {
    window.history.back();
  };
  private handleReportError = async () => {
    this.setState({ isReporting: true });
    try {
      const reportData = {
        errorId: this.state.errorId,
        description: this.state.reportDescription,
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        context: this.props.context || 'clinical-notes',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      // In production, send to support system
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to support API
        // await supportService.submitErrorReport(reportData);
      }
      console.log('Error report submitted:', reportData);
      this.setState({ 
        showReportDialog: false,
        reportDescription: '',
        isReporting: false}
      });
      // Show success message
      alert(
        'Error report submitted successfully. Thank you for helping us improve!'
      );
    } catch (reportError) {
      console.error('Failed to submit error report:', reportError);
      this.setState({ isReporting: false });
      alert('Failed to submit error report. Please try again later.');
    }
  };
  private getRecoveryInstructions = (): string[] => {
    const error = this.state.error;
    if (!error) {
      return ['Try refreshing the page'];
    }
    // Classify error and provide specific instructions
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk')
    ) {
      return [
        'This appears to be a loading issue',
        'Clear your browser cache and cookies',
        'Refresh the page',
        'If the problem persists, try using an incognito/private window',
      ];
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        "If you're on a corporate network, contact your IT department",
        'Try again in a few minutes',
      ];
    }
    if (
      error.message.includes('Permission') ||
      error.message.includes('Unauthorized')
    ) {
      return [
        'You may not have permission to access this feature',
        'Try logging out and logging back in',
        'Contact your administrator if the problem persists',
      ];
    }
    // Default recovery instructions
    return [
      'Try the action again',
      'Refresh the page if the problem persists',
      'Clear your browser cache if needed',
      'Contact support if the issue continues',
    ];
  };
  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const recoveryInstructions = this.getRecoveryInstructions();
      const canRetry = this.retryCount < this.maxRetries;
      return (
        <div
          className=""
        >
          <div
            className=""
          >
            <Alert severity="error" className="">
              <AlertTitle>
                <div className="">
                  Clinical Notes Error
                  <Chip
                    label={`ID: ${this.state.errorId}`}
                    size="small"
                    
                  />
                </div>
              </AlertTitle>
              <div  className="">
                An error occurred while loading the clinical notes module.
                {canRetry ? ' You can try again or ' : ' Please '}
                follow the recovery steps below.
              </div>
            </Alert>
            {/* Recovery Instructions */}
            <div className="">
              <div  gutterBottom>
                Recovery Steps:
              </div>
              <List dense>
                {recoveryInstructions.map((instruction, index) => (
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
            {/* Action Buttons */}
            <div direction="row" spacing={2} className="">
              {canRetry && (
                <Button
                  
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              )}
              <Button
                
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                
                startIcon={<ArrowBackIcon />}
                onClick={this.handleGoBack}
              >
                Go Back
              </Button>
              <Button
                
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Dashboard
              </Button>
            </div>
            {/* Error Details Toggle */}
            <div className="">
              <Button
                size="small"
                startIcon={
                  this.state.showDetails ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                }
                onClick={() =>}
                  this.setState({ showDetails: !this.state.showDetails })
                }
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              <Button
                size="small"
                startIcon={<BugReportIcon />}
                onClick={() => this.setState({ showReportDialog: true })}
                className=""
              >
                Report Issue
              </Button>
            </div>
            {/* Technical Details */}
            <Collapse in={this.state.showDetails}>
              <div
                className=""
              >
                <div
                  
                  component="pre"
                  className=""
                >
                  <strong>Error ID:</strong> {this.state.errorId}
                  {'\n'}
                  <strong>Message:</strong> {this.state.error?.message}
                  {'\n'}
                  <strong>Context:</strong>{' '}
                  {this.props.context || 'clinical-notes'}
                  {'\n'}
                  <strong>Retry Count:</strong> {this.retryCount}
                  {'\n'}
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                  {this.state.error?.stack && (
                    <>
                      {'\n\n'}
                      <strong>Stack Trace:</strong>
                      {'\n'}
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {'\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </div>
            </Collapse>
            {/* Error Report Dialog */}
            <Dialog
              open={this.state.showReportDialog}
              onClose={() => this.setState({ showReportDialog: false })}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Report Error</DialogTitle>
              <DialogContent>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Help us improve by describing what you were doing when this
                  error occurred. This information will be sent to our
                  development team.
                </div>
                <Input
                  fullWidth
                  multiline
                  rows={4}
                  label="Describe what happened"
                  value={this.state.reportDescription}
                  onChange={(e) =>}
                    this.setState({ reportDescription: e.target.value })
                  }
                  placeholder="I was trying to create a new clinical note when..."
                  className=""
                />
                <Alert severity="info" className="">
                  <div >
                    <strong>Error ID:</strong> {this.state.errorId}
                    <br />
                    This ID will be included in your report for tracking
                    purposes.
                  </div>
                </Alert>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => this.setState({ showReportDialog: false })}
                  disabled={this.state.isReporting}
                >
                  Cancel
                </Button>
                <Button
                  
                  startIcon={
                    this.state.isReporting ? (}
                      <Spinner size={16} />
                    ) : (
                      <SendIcon />
                    )
                  }
                  onClick={this.handleReportError}
                  disabled={
                    !this.state.reportDescription.trim() ||
                    this.state.isReporting}
                  }
                >
                  {this.state.isReporting ? 'Sending...' : 'Send Report'}
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ClinicalNotesErrorBoundary;
