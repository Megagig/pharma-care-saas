import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Alert,
  Button,
  Box,
  Typography,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

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
      errorInfo,
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
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <ErrorIcon color="error" sx={{ fontSize: 64 }} />

              <Typography variant="h5" color="error" gutterBottom>
                Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary">
                An unexpected error occurred while rendering this component.
                Please try refreshing the page or contact support if the problem
                persists.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <Divider sx={{ width: '100%' }} />
                  <Alert
                    severity="error"
                    sx={{ width: '100%', textAlign: 'left' }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Error Details (Development Mode):
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        overflow: 'auto',
                        maxHeight: 200,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </Typography>
                  </Alert>
                </>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<BugReportIcon />}
                  onClick={this.handleReportError}
                >
                  Report Issue
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
