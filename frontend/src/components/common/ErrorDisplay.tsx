
import { Button, Card, CardContent, Spinner, Alert, AlertTitle, Skeleton } from '@/components/ui/button';
export interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  type?:
    | 'error'
    | 'warning'
    | 'info'
    | 'network'
    | 'permission'
    | 'notFound'
    | 'server';
  retry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  onClose?: () => void;
}
/**
 * Enhanced error display component with different error types and retry functionality
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error,
  title,
  message,
  type = 'error',
  retry,
  retryLabel = 'Try Again',
  showDetails = false,
  onClose
}) => {
  const [showDetailedError, setShowDetailedError] = React.useState(false);
  if (!error && !message) return null;
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <OfflineIcon />;
      case 'server':
        return <ServerErrorIcon />;
      case 'permission':
        return <PermissionIcon />;
      case 'notFound':
        return <NotFoundIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
  };
  const getErrorSeverity = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'error';
    }
  };
  const getDefaultTitle = () => {
    switch (type) {
      case 'network':
        return 'Network Error';
      case 'server':
        return 'Server Error';
      case 'permission':
        return 'Access Denied';
      case 'notFound':
        return 'Not Found';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };
  const getDefaultMessage = () => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    if (message) return message;
    if (errorMessage) return errorMessage;
    switch (type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'server':
        return 'The server is currently unavailable. Please try again later.';
      case 'permission':
        return 'You do not have permission to access this resource.';
      case 'notFound':
        return 'The requested resource could not be found.';
      default:
        return 'An unexpected error occurred.';
    }
  };
  const errorDetails =
    typeof error === 'object' && error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : null;
  return (
    <Alert
      severity={getErrorSeverity()}
      icon={getErrorIcon()}
      onClose={onClose}
      className=""
    >
      <AlertTitle>{title || getDefaultTitle()}</AlertTitle>
      <div  className="">
        {getDefaultMessage()}
      </div>
      <div direction="row" spacing={2} alignItems="center">
        {retry && (
          <Button
            size="small"
            
            startIcon={<RefreshIcon />}
            onClick={retry}
          >
            {retryLabel}
          </Button>
        )}
        {showDetails && errorDetails && (
          <Button
            size="small"
            
            endIcon={
              <ExpandMoreIcon
                className=""
              />}
            }
            onClick={() => setShowDetailedError(!showDetailedError)}
          >
            Details
          </Button>
        )}
      </div>
      {showDetails && errorDetails && (
        <Collapse in={showDetailedError}>
          <div
            className=""
          >
            <div
              
              component="pre"
              className=""
            >
              {errorDetails.name}: {errorDetails.message}
              {errorDetails.stack && `\n\n${errorDetails.stack}`}
            </div>
          </div>
        </Collapse>
      )}
    </Alert>
  );
};
/**
 * Network error component for offline/connection issues
 */
export const NetworkErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'type'>> = (
  props
) => <ErrorDisplay {...props} type="network" />;
/**
 * Permission error component for access denied scenarios
 */
export const PermissionErrorDisplay: React.FC = (props) => <ErrorDisplay {...props} type="permission" />;
/**
 * Not found error component for missing resources
 */
export const NotFoundErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'type'>> = (
  props
) => <ErrorDisplay {...props} type="notFound" />;
/**
 * Server error component for backend issues
 */
export const ServerErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'type'>> = (
  props
) => <ErrorDisplay {...props} type="server" />;
export interface LoadingSkeletonProps {
  variant?: 'list' | 'card' | 'table' | 'form' | 'detail';
  count?: number;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}
/**
 * Versatile loading skeleton component for different UI patterns
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'card',
  count = 1,
  height = 100,
  animation = 'wave'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return (
          <div spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className=""
              >
                <Skeleton
                  
                  width={40}
                  height={40}
                  animation={animation}
                />
                <div className="">
                  <Skeleton
                    
                    className=""
                    animation={animation}
                  />
                  <Skeleton
                    
                    className=""
                    width="60%"
                    animation={animation}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div spacing={1}>
            <Skeleton  height={56} animation={animation} />
            {Array.from({ length: count }).map((_, index) => (
              <Skeleton
                key={index}
                
                height={52}
                animation={animation}
              />
            ))}
          </div>
        );
      case 'form':
        return (
          <div spacing={3}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index}>
                <Skeleton
                  
                  className=""
                  width="20%"
                  animation={animation}
                />
                <Skeleton
                  
                  height={56}
                  animation={animation}
                />
              </div>
            ))}
          </div>
        );
      case 'detail':
        return (
          <div spacing={3}>
            <Skeleton
              
              height={200}
              animation={animation}
            />
            <div className="">
              <Skeleton
                
                width={64}
                height={64}
                animation={animation}
              />
              <div flex={1} spacing={1}>
                <Skeleton
                  
                  className=""
                  width="40%"
                  animation={animation}
                />
                <Skeleton
                  
                  className=""
                  width="60%"
                  animation={animation}
                />
                <Skeleton
                  
                  className=""
                  width="80%"
                  animation={animation}
                />
              </div>
            </div>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index}>
                <Skeleton
                  
                  className=""
                  width="30%"
                  animation={animation}
                />
                <Skeleton
                  
                  height={80}
                  animation={animation}
                />
              </div>
            ))}
          </div>
        );
      default: // 'card'
        return (
          <div spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
              <Card key={index}>
                <CardContent>
                  <Skeleton
                    
                    className=""
                    animation={animation}
                  />
                  <Skeleton
                    
                    className=""
                    animation={animation}
                  />
                  <Skeleton
                    
                    height={typeof height === 'number' ? height : 100}
                    animation={animation}
                    className=""
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        );
    }
  };
  return <div>{renderSkeleton()}</div>;
};
export interface LoadingStateProps {
  loading?: boolean;
  error?: Error | string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  isEmpty?: boolean;
  retry?: () => void;
  errorProps?: Omit<ErrorDisplayProps, 'error'>;
  skeletonProps?: LoadingSkeletonProps;
}
/**
 * Comprehensive loading state wrapper component
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  loading = false,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  retry,
  errorProps,
  skeletonProps
}) => {
  if (loading) {
    return <>{loadingComponent || <LoadingSkeleton {...skeletonProps} />}</>;
  }
  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorDisplay
            error={error}
            retry={retry}
            showDetails={process.env.NODE_ENV === 'development'}
            {...errorProps}
          />
        )}
      </>
    );
  }
  if (isEmpty && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  return <>{children}</>;
};
/**
 * Simple loading spinner component
 */
export const LoadingSpinner: React.FC<{
  size?: number;
  message?: string;
  fullPage?: boolean;
}> = ({ size = 40, message = 'Loading...', fullPage = false }) => {
  const content = (
    <div spacing={2} alignItems="center" justifyContent="center">
      <Spinner size={size} />
      <div  color="text.secondary">
        {message}
      </div>
    </div>
  );
  if (fullPage) {
    return (
      <div
        className=""
      >
        {content}
      </div>
    );
  }
  return (
    <div className="">
      {content}
    </div>
  );
};
export default ErrorDisplay;
