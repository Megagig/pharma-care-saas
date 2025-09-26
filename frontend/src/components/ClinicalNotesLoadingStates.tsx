
import { Button, Card, CardContent, Spinner, Progress, Alert, Skeleton } from '@/components/ui/button';
// Loading state types
export type LoadingStateType =
  | 'initial'
  | 'loading'
  | 'refreshing'
  | 'saving'
  | 'deleting'
  | 'uploading'
  | 'syncing'
  | 'searching'
  | 'filtering';
export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'circular' | 'linear' | 'skeleton' | 'overlay';
interface BaseLoadingProps {
  message?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
  fullScreen?: boolean;
  overlay?: boolean;
}
interface LoadingStateProps extends BaseLoadingProps {
  type: LoadingStateType;
  progress?: number;
  details?: string;
  onCancel?: () => void;
  showProgress?: boolean;
}
interface SkeletonLoadingProps {
  variant: 'table' | 'card' | 'form' | 'list' | 'dashboard';
  count?: number;
  animation?: 'pulse' | 'wave' | false;
}
interface ProgressIndicatorProps {
  value: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: LoadingSize;
  showPercentage?: boolean;
}
interface SyncStatusProps {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  lastSyncTime?: Date;
  pendingCount?: number;
  onRetry?: () => void;
}
// Main loading state component
export const ClinicalNotesLoadingState: React.FC<LoadingStateProps> = ({ 
  type,
  message,
  size = 'medium',
  variant = 'circular',
  progress,
  details,
  onCancel,
  showProgress = false,
  fullScreen = false,
  overlay = false
}) => {
  const theme = useTheme();
  const getLoadingMessage = () => {
    if (message) return message;
    switch (type) {
      case 'initial':
        return 'Loading clinical notes...';
      case 'loading':
        return 'Loading...';
      case 'refreshing':
        return 'Refreshing data...';
      case 'saving':
        return 'Saving note...';
      case 'deleting':
        return 'Deleting note...';
      case 'uploading':
        return 'Uploading files...';
      case 'syncing':
        return 'Syncing data...';
      case 'searching':
        return 'Searching notes...';
      case 'filtering':
        return 'Applying filters...';
      default:
        return 'Processing...';
    }
  };
  const getLoadingIcon = () => {
    const iconSize = size === 'small' ? 20 : size === 'medium' ? 32 : 48;
    switch (type) {
      case 'syncing':
        return (
          <SyncIcon
            className=""
          />
        );
      default:
        return <Spinner size={iconSize} />;
    }
  };
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    p: size === 'small' ? 2 : size === 'medium' ? 3 : 4,
    ...(fullScreen && {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: alpha(theme.palette.background.default, 0.9),
      zIndex: 9999, },
    ...(overlay && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      zIndex: 1000, },
  };
  if (variant === 'linear') {
    return (
      <div className="">
        <div  color="text.secondary" className="">
          {getLoadingMessage()}
        </div>
        <Progress
          className=""
          variant={
            showProgress && progress !== undefined
              ? 'determinate'
              : 'indeterminate'}
          }
          value={progress}
        />
        {showProgress && progress !== undefined && (
          <div  color="text.secondary">
            {Math.round(progress)}%
          </div>
        )}
        {details && (
          <div  color="text.secondary">
            {details}
          </div>
        )}
        {onCancel && (
          <Button size="small" onClick={onCancel} className="">
            Cancel
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="">
      {getLoadingIcon()}
      <div
        variant={size === 'small' ? 'body2' : 'body1'}
        color="text.secondary"
        textAlign="center"
      >
        {getLoadingMessage()}
      </div>
      {details && (
        <div  color="text.secondary" textAlign="center">
          {details}
        </div>
      )}
      {showProgress && progress !== undefined && (
        <div  color="text.secondary">
          {Math.round(progress)}% complete
        </div>
      )}
      {onCancel && (
        <Button size="small" onClick={onCancel} className="">
          Cancel
        </Button>
      )}
    </div>
  );
};
// Skeleton loading component
export const ClinicalNotesSkeletonLoader: React.FC<SkeletonLoadingProps> = ({ 
  variant,
  count = 3,
  animation = 'wave'
}) => {
  const renderTableSkeleton = () => (
    <div>
      {/* Header */}
      <div className="">
        <Skeleton
          
          width={200}
          height={40}
          animation={animation}
        />
        <Skeleton
          
          width={120}
          height={40}
          animation={animation}
        />
        <Skeleton
          
          width={100}
          height={40}
          animation={animation}
        />
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="">
          <Skeleton
            
            width="30%"
            height={48}
            animation={animation}
          />
          <Skeleton
            
            width="25%"
            height={48}
            animation={animation}
          />
          <Skeleton
            
            width="20%"
            height={48}
            animation={animation}
          />
          <Skeleton
            
            width="15%"
            height={48}
            animation={animation}
          />
          <Skeleton
            
            width="10%"
            height={48}
            animation={animation}
          />
        </div>
      ))}
    </div>
  );
  const renderCardSkeleton = () => (
    <div container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <div item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton
                
                width="60%"
                height={24}
                animation={animation}
              />
              <Skeleton
                
                width="40%"
                height={20}
                animation={animation}
              />
              <Skeleton
                
                width="100%"
                height={60}
                animation={animation}
                className=""
              />
              <div className="">
                <Skeleton
                  
                  width={60}
                  height={24}
                  animation={animation}
                />
                <Skeleton
                  
                  width={80}
                  height={24}
                  animation={animation}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
  const renderFormSkeleton = () => (
    <div className="">
      <Skeleton
        
        width="40%"
        height={32}
        animation={animation}
        className=""
      />
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="">
          <Skeleton
            
            width="30%"
            height={20}
            animation={animation}
            className=""
          />
          <Skeleton
            
            width="100%"
            height={56}
            animation={animation}
          />
        </div>
      ))}
      <div className="">
        <Skeleton
          
          width={100}
          height={36}
          animation={animation}
        />
        <Skeleton
          
          width={80}
          height={36}
          animation={animation}
        />
      </div>
    </div>
  );
  const renderListSkeleton = () => (
    <div>
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
              
              width="70%"
              height={20}
              animation={animation}
            />
            <Skeleton
              
              width="50%"
              height={16}
              animation={animation}
            />
          </div>
          <Skeleton
            
            width={60}
            height={24}
            animation={animation}
          />
        </div>
      ))}
    </div>
  );
  const renderDashboardSkeleton = () => (
    <div>
      {/* Header */}
      <div
        className=""
      >
        <Skeleton
          
          width={200}
          height={32}
          animation={animation}
        />
        <Skeleton
          
          width={120}
          height={36}
          animation={animation}
        />
      </div>
      {/* Stats Cards */}
      <div container spacing={2} className="">
        {Array.from({ length: 4 }).map((_, index) => (
          <div item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Skeleton
                  
                  width="60%"
                  height={20}
                  animation={animation}
                />
                <Skeleton
                  
                  width="40%"
                  height={32}
                  animation={animation}
                />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {/* Main Content */}
      {renderTableSkeleton()}
    </div>
  );
  switch (variant) {
    case 'table':
      return renderTableSkeleton();
    case 'card':
      return renderCardSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'dashboard':
      return renderDashboardSkeleton();
    default:
      return renderTableSkeleton();
  }
};
// Progress indicator component
export const ClinicalNotesProgressIndicator: React.FC = ({ 
  value,
  label,
  color = 'primary',
  size = 'medium',
  showPercentage = true
}) => {
  const circularSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
  return (
    <div
      className=""
    >
      <div className="">
        <Spinner
          
          size={circularSize}
          color={color}
          thickness={4}
        />
        {showPercentage && (
          <div
            className=""
          >
            <div
              variant={size === 'small' ? 'caption' : 'body2'}
              component="div"
              color="text.secondary"
              fontWeight="medium"
            >
              {Math.round(value)}%
            </div>
          </div>
        )}
      </div>
      {label && (
        <div
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
          textAlign="center"
        >
          {label}
        </div>
      )}
    </div>
  );
};
// Sync status component
export const ClinicalNotesSyncStatus: React.FC<SyncStatusProps> = ({ 
  status,
  lastSyncTime,
  pendingCount = 0,
  onRetry
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          color: 'info' as const,
          icon: <SyncIcon className="" />,
          message: 'Syncing...',
          severity: 'info' as const,
        };
      case 'success':
        return {
          color: 'success' as const,
          icon: <CheckCircleIcon />,
          message: 'Synced',
          severity: 'success' as const,
        };
      case 'error':
        return {
          color: 'error' as const,
          icon: <ErrorIcon />,
          message: 'Sync failed',
          severity: 'error' as const,
        };
      case 'offline':
        return {
          color: 'warning' as const,
          icon: <WarningIcon />,
          message: 'Offline',
          severity: 'warning' as const,
        };
      default:
        return {
          color: 'default' as const,
          icon: <CheckCircleIcon />,
          message: 'Ready',
          severity: 'info' as const,
        };
    }
  };
  const config = getStatusConfig();
  return (
    <Alert
      severity={config.severity}
      icon={config.icon}
      className=""
      action={
        status === 'error' && onRetry ? (}
          <Button size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <div>
        <div  fontWeight="medium">
          {config.message}
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pending`}
              size="small"
              color={config.color}
              className=""
            />
          )}
        </div>
        {lastSyncTime && status !== 'syncing' && (
          <div  color="text.secondary">
            Last sync: {lastSyncTime.toLocaleString()}
          </div>
        )}
        {status === 'offline' && (
          <div  display="block" className="">
            Changes will sync when connection is restored
          </div>
        )}
      </div>
    </Alert>
  );
};
// Utility component for wrapping content with loading overlay
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  type?: LoadingStateType;
}> = ({ loading, children, message, type = 'loading' }) => {
  return (
    <div className="">
      {children}
      {loading && (
        <ClinicalNotesLoadingState
          type={type}
          message={message}
          overlay
          size="medium"
        />
      )}
    </div>
  );
};
// CSS for animations
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}
export default {
};
