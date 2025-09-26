import React, { Component, ReactNode } from 'react';
import { Button, Alert, AlertDescription, AlertTitle, Accordion, AccordionContent, AccordionItem, AccordionTrigger, Separator, Badge } from '@/components/ui';
import { AlertTriangle, Info, RefreshCw, Home, Bug, Lightbulb, ChevronDown } from 'lucide-react';

/**
 * MTR Error Boundary Component
 * Provides graceful error recovery for MTR module
 * Requirements: 2.4, 4.4, 7.1, 8.4
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

interface MTRErrorDetails {
  field?: string;
  message: string;
  value?: unknown;
  location?: string;
}

interface MTRError {
  type: string;
  message: string;
  details?: MTRErrorDetails[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recovery?: string[];
  timestamp?: string;
}

class MTRErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `mtr-error-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MTR ErrorBoundary caught an error:', error, errorInfo);
    // Log error for audit trail (Requirement 7.1)
    this.logMTRError(error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logMTRError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorLog = {
      errorId: this.state.errorId,
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(), // Get from auth context if available
    };

    // Send to logging service only (no local storage for security)
    try {
      // Note: localStorage removed for security - errors are only logged to console in development
      console.error('MTR Error Log:', errorLog);
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // errorTrackingService.logError(errorLog);
      }
    } catch (logError) {
      console.error('Failed to log MTR error:', logError);
    }
  };

  private getUserId = (): string | null => {
    // Note: Authentication moved to httpOnly cookies for security
    // User ID is not accessible from client-side storage
    try {
      // In production, this would be retrieved from the auth context/hook
      // For error logging, user ID can be omitted or retrieved from server
      return null; // User ID not available from local storage anymore
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  private parseMTRError = (error: Error): MTRError | null => {
    try {
      // Try to parse MTR-specific error format
      if (error.message.includes('MTR')) {
        // This would be enhanced to parse actual MTR error responses
        return {
          type: 'MTRError',
          message: error.message,
          severity: 'medium',
          recovery: [
            'Check your input data',
            'Verify required fields are completed',
            'Try refreshing the page',
          ],
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  private getErrorSeverity = (
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' => {
    const mtrError = this.parseMTRError(error);
    if (mtrError?.severity) {
      return mtrError.severity;
    }
    // Determine severity based on error type
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk')
    ) {
      return 'low';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    return 'medium';
  };

  private getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  private getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low':
        return <Info className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  private getRecoveryActions = (error: Error): string[] => {
    const mtrError = this.parseMTRError(error);
    if (mtrError?.recovery) {
      return mtrError.recovery;
    }
    // Default recovery actions based on error type
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk')
    ) {
      return [
        'Refresh the page to reload the application',
        'Clear your browser cache',
        'Check your internet connection',
      ];
    }
    if (error.message.includes('Network')) {
      return [
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the issue persists',
      ];
    }
    return [
      'Try refreshing the page',
      'Go back to the previous step',
      'Contact support if the problem continues',
    ];
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportError = () => {
    const errorData = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Create mailto link for error reporting
    const subject = encodeURIComponent(
      `MTR Error Report - ${this.state.errorId}`
    );
    const body = encodeURIComponent(`
Error ID: ${errorData.errorId}
Message: ${errorData.message}
Timestamp: ${errorData.timestamp}
URL: ${errorData.url}
Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(
      `mailto:support@pharmacare.com?subject=${subject}&body=${body}`
    );
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error!;
      const severity = this.getErrorSeverity(error);
      const recoveryActions = this.getRecoveryActions(error);
      const mtrError = this.parseMTRError(error);

      return (
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <Alert className={`mb-6 ${this.getSeverityColor(severity)}`}>
              <div className="flex items-start">
                {this.getSeverityIcon(severity)}
                <div className="ml-2">
                  <AlertTitle className="flex items-center justify-between">
                    <span>MTR Module Error</span>
                    <Badge className={this.getSeverityColor(severity)}>
                      {severity.toUpperCase()}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    An error occurred in the Medication Therapy Review module.
                    {severity === 'low' && ' This is likely a temporary issue.'}
                    {severity === 'medium' && ' Please try the suggested recovery actions.'}
                    {severity === 'high' && ' This requires immediate attention.'}
                    {severity === 'critical' && ' This is a critical error that needs urgent resolution.'}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Error Message */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Error Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-red-600 font-medium">{error.message}</p>
                <p className="text-sm text-gray-500 mt-1">Error ID: {this.state.errorId}</p>
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Suggested Actions
              </h3>
              <div className="bg-gray-50 rounded-md p-2">
                {recoveryActions.map((action, index) => (
                  <div key={index} className="py-2 flex">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MTR Error Details */}
            {mtrError?.details && (
              <Accordion type="single" collapsible className="mb-6">
                <AccordionItem value="mtr-details">
                  <AccordionTrigger className="py-3">
                    MTR Validation Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div>
                      {mtrError.details?.map((detail, index) => (
                        <div key={index} className="py-2">
                          <p className="font-medium">{detail.message}</p>
                          {detail.field && (
                            <p className="text-sm text-gray-500">Field: {detail.field}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Technical Details (Development only) */}
            {(import.meta.env.DEV || this.props.showDetails) &&
              this.state.error && (
                <Accordion type="single" collapsible className="mb-6">
                  <AccordionItem value="technical-details">
                    <AccordionTrigger className="py-3">
                      Technical Details
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <pre className="text-sm">
                          {this.state.error.stack}
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={this.handleReset} variant="outline" className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button onClick={this.handleReportError} variant="outline" className="flex items-center">
                <Bug className="h-4 w-4 mr-2" />
                Report Error
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MTRErrorBoundary;

// Higher-order component for wrapping MTR components
export const withMTRErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WrappedComponent = (props: P) => (
    <MTRErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </MTRErrorBoundary>
  );

  WrappedComponent.displayName = `withMTRErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
