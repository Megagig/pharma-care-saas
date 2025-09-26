import { Button, Alert } from '@/components/ui/button';
// Chart Error Boundary Component
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
class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to monitoring service
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default error UI
      return (
        <div
          className=""
        >
          <Alert
            severity="error"
            className="" icon={<BugIcon />}
          >
            <div  gutterBottom color="error.main">
              Chart Rendering Error
            </div>
            <div  color="text.secondary" className="">
              Something went wrong while rendering this chart. This is likely a
              temporary issue.
            </div>
            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                className=""
              >
                <div  color="error.main">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <div
                    
                    color="text.secondary"
                    component="pre"
                    className=""
                  >
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}
            <div className="">
              <Button
                
                size="sm"
                onClick={this.handleRetry}
                className="mt-2"
              >
                <RefreshIcon className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </Alert>
          {/* Accessibility message */}
          <div
            
            color="text.secondary"
            className=""
            role="status"
            aria-live="polite"
          >
            Chart could not be rendered due to an error. Please try again or
            contact support.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ChartErrorBoundary;
