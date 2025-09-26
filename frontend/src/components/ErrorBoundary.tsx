import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Optionally reload the page
    window.location.reload();
  };

  private handleReset = () => {
    // Just reset the error boundary without reloading
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-3 bg-background">
          <Card className="p-8 max-w-2xl w-full text-center">
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-destructive mb-4">
                <AlertTriangle className="h-8 w-8" />
                <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
              </div>

              <p className="text-muted-foreground">
                An unexpected error occurred. This might be due to a temporary issue.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="text-left space-y-2">
                  <h2 className="text-lg font-semibold">Error Details:</h2>
                  <Card className="p-4 bg-muted overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </Card>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
