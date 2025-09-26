import { Button, Alert, Separator } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}
/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI with options to retry or report the error
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ 
      error,
      errorInfo}
    });
    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };
  private handleReportError = () => {
    // In a real app, this would send the error to a logging service
    const errorReport = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    console.log('Error Report:', errorReport);
    // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
    alert(
      'Error report logged to console. In production, this would be sent to our error tracking service.'
    );
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default error UI
      return (
        <div className="">
          <div className="">
            <div spacing={3} alignItems="center" textAlign="center">
              <ErrorIcon color="error" className="" />
              <div  color="error" gutterBottom>
                Something went wrong
              </div>
              <div  color="text.secondary">
                An unexpected error occurred while rendering this component.
                Please try refreshing the page or contact support if the problem
                persists.
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <Separator className="" />
                  <Alert
                    severity="error"
                    className=""
                  >
                    <div  gutterBottom>
                      Error Details (Development Mode):
                    </div>
                    <div
                      
                      component="pre"
                      className=""
                    >
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </div>
                  </Alert>
                </>
              )}
              <div direction="row" spacing={2}>
                <Button
                  
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  
                  startIcon={<BugReportIcon />}
                  onClick={this.handleReportError}
                >
                  Report Issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export { ErrorBoundary };
