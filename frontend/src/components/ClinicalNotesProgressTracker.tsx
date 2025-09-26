import { Button, Card, CardContent, Tooltip, Spinner, Progress, Alert } from '@/components/ui/button';
// Progress tracking types
export type OperationType =
  | 'upload'
  | 'save'
  | 'delete'
  | 'sync'
  | 'search'
  | 'validation'
  | 'export'
  | 'import';
export type OperationStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';
export interface ProgressOperation {
  id: string;
  type: OperationType;
  title: string;
  description?: string;
  progress: number;
  status: OperationStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
  canCancel?: boolean;
  canPause?: boolean;
  canRetry?: boolean;
  metadata?: Record<string, any>;
}
interface ClinicalNotesProgressTrackerProps {
  operations: ProgressOperation[];
  onCancel?: (operationId: string) => void;
  onPause?: (operationId: string) => void;
  onResume?: (operationId: string) => void;
  onRetry?: (operationId: string) => void;
  onClear?: (operationId: string) => void;
  maxVisible?: number;
  showCompleted?: boolean;
  compact?: boolean;
}
interface ProgressItemProps {
  operation: ProgressOperation;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  onClear?: () => void;
  compact?: boolean;
}
interface ProgressSummaryProps {
  operations: ProgressOperation[];
  onClearAll?: () => void;
  onPauseAll?: () => void;
  onResumeAll?: () => void;
}
// Individual progress item component
const ProgressItem: React.FC<ProgressItemProps> = ({ 
  operation,
  onCancel,
  onPause,
  onResume,
  onRetry,
  onClear,
  compact = false
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const getStatusColor = () => {
    switch (operation.status) {
      case 'completed':
        return theme.palette.success.main;
      case 'failed':
        return theme.palette.error.main;
      case 'cancelled':
        return theme.palette.warning.main;
      case 'paused':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <WarningIcon color="warning" />;
      case 'paused':
        return <PauseIcon color="info" />;
      case 'running':
        return <Spinner size={20} />;
      default:
        return <Spinner size={20} />;
    }
  };
  const getTypeIcon = () => {
    switch (operation.type) {
      case 'upload':
        return <UploadIcon />;
      case 'save':
        return <SaveIcon />;
      case 'sync':
        return <SyncIcon />;
      case 'delete':
        return <DeleteIcon />;
      default:
        return <SaveIcon />;
    }
  };
  const getDuration = () => {
    const start = operation.startTime;
    const end = operation.endTime || new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.round(duration / 3600)}h ${Math.round(
        (duration % 3600) / 60
      )}m`;
    }
  };
  const getEstimatedTimeRemaining = () => {
    if (operation.status !== 'running' || operation.progress === 0) {
      return null;
    }
    const elapsed = new Date().getTime() - operation.startTime.getTime();
    const rate = operation.progress / elapsed;
    const remaining = (100 - operation.progress) / rate;
    const seconds = Math.round(remaining / 1000);
    if (seconds < 60) {
      return `${seconds}s remaining`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m remaining`;
    } else {
      return `${Math.round(seconds / 3600)}h remaining`;
    }
  };
  if (compact) {
    return (
      <div className="">
        {getStatusIcon()}
        <div className="">
          <div  noWrap>
            {operation.title}
          </div>
          {operation.status === 'running' && (
            <Progress
              
              className=""
            />
          )}
        </div>
        <div  color="text.secondary">
          {operation.status === 'running'
            ? `${Math.round(operation.progress)}%`
            : operation.status}
        </div>
        {(operation.canCancel || operation.canPause || operation.canRetry) && (
          <IconButton size="small" onClick={onCancel}>
            <CancelIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    );
  }
  return (
    <Card className="">
      <CardContent className="">
        <div className="">
          {getTypeIcon()}
          <div className="">
            <div className="">
              <div  noWrap>
                {operation.title}
              </div>
              <Chip
                label={operation.status}
                size="small"
                className=""
              />
            </div>
            {operation.description && (
              <div  color="text.secondary" className="">
                {operation.description}
              </div>
            )}
            {/* Progress Bar */}
            {operation.status === 'running' && (
              <div className="">
                <div
                  className=""
                >
                  <div >
                    {Math.round(operation.progress)}%
                  </div>
                  <div  color="text.secondary">
                    {getEstimatedTimeRemaining()}
                  </div>
                </div>
                <Progress
                  
                  className=""
                />
              </div>
            )}
            {/* Status Information */}
            <div className="">
              {getStatusIcon()}
              <div  color="text.secondary">
                Duration: {getDuration()}
              </div>
              {operation.metadata?.fileSize && (
                <div  color="text.secondary">
                  Size: {formatFileSize(operation.metadata.fileSize)}
                </div>
              )}
            </div>
            {/* Error Message */}
            {operation.error && (
              <Alert severity="error" size="small" className="">
                {operation.error}
              </Alert>
            )}
            {/* Details Toggle */}
            {operation.metadata &&
              Object.keys(operation.metadata).length > 0 && (
                <Button
                  size="small"
                  startIcon={
                    showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  }
                  onClick={() => setShowDetails(!showDetails)}
                  className=""
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              )}
            {/* Detailed Information */}
            <Collapse in={showDetails}>
              <div className="">
                <div
                  
                  component="pre"
                  className=""
                >
                  {JSON.stringify(operation.metadata, null, 2)}
                </div>
              </div>
            </Collapse>
          </div>
          {/* Action Buttons */}
          <div direction="row" spacing={0.5}>
            {operation.status === 'running' && operation.canPause && (
              <Tooltip title="Pause">
                <IconButton size="small" onClick={onPause}>
                  <PauseIcon />
                </IconButton>
              </Tooltip>
            )}
            {operation.status === 'paused' && (
              <Tooltip title="Resume">
                <IconButton size="small" onClick={onResume}>
                  <PlayIcon />
                </IconButton>
              </Tooltip>
            )}
            {operation.status === 'failed' && operation.canRetry && (
              <Tooltip title="Retry">
                <IconButton size="small" onClick={onRetry}>
                  <RetryIcon />
                </IconButton>
              </Tooltip>
            )}
            {(operation.status === 'running' ||
              operation.status === 'paused') &&
              operation.canCancel && (
                <Tooltip title="Cancel">
                  <IconButton size="small" onClick={onCancel}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              )}
            {(operation.status === 'completed' ||
              operation.status === 'failed' ||
              operation.status === 'cancelled') && (
              <Tooltip title="Clear">
                <IconButton size="small" onClick={onClear}>
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// Progress summary component
const ProgressSummary: React.FC<ProgressSummaryProps> = ({ 
  operations,
  onClearAll,
  onPauseAll,
  onResumeAll
}) => {
  const runningOps = operations.filter((op) => op.status === 'running');
  const completedOps = operations.filter((op) => op.status === 'completed');
  const failedOps = operations.filter((op) => op.status === 'failed');
  const pausedOps = operations.filter((op) => op.status === 'paused');
  const totalProgress =
    operations.length > 0
      ? operations.reduce((sum, op) => sum + op.progress, 0) / operations.length
      : 0;
  return (
    <Card className="">
      <CardContent>
        <div
          className=""
        >
          <div >Operations Summary</div>
          <div direction="row" spacing={1}>
            {runningOps.length > 0 && onPauseAll && (
              <Button
                size="small"
                startIcon={<PauseIcon />}
                onClick={onPauseAll}
              >
                Pause All
              </Button>
            )}
            {pausedOps.length > 0 && onResumeAll && (
              <Button
                size="small"
                startIcon={<PlayIcon />}
                onClick={onResumeAll}
              >
                Resume All
              </Button>
            )}
            {onClearAll && (
              <Button
                size="small"
                startIcon={<CancelIcon />}
                onClick={onClearAll}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        <div className="">
          <Chip
            label={`${runningOps.length} Running`}
            color="primary"
            size="small"
          />
          <Chip
            label={`${completedOps.length} Completed`}
            color="success"
            size="small"
          />
          <Chip
            label={`${failedOps.length} Failed`}
            color="error"
            size="small"
          />
          <Chip
            label={`${pausedOps.length} Paused`}
            color="info"
            size="small"
          />
        </div>
        {runningOps.length > 0 && (
          <div>
            <div  color="text.secondary" className="">
              Overall Progress: {Math.round(totalProgress)}%
            </div>
            <Progress
              
              className=""
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
// Main progress tracker component
const ClinicalNotesProgressTracker: React.FC = ({ 
  operations,
  onCancel,
  onPause,
  onResume,
  onRetry,
  onClear,
  maxVisible = 5,
  showCompleted = true,
  compact = false
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  // Filter operations
  const filteredOperations = showCompleted
    ? operations
    : operations.filter((op) => op.status !== 'completed');
  const visibleOperations = showAll
    ? filteredOperations
    : filteredOperations.slice(0, maxVisible);
  const hasMoreOperations = filteredOperations.length > maxVisible;
  // Handle bulk actions
  const handleClearAll = useCallback(() => {
    operations.forEach((op) => {
      if (
        op.status === 'completed' ||
        op.status === 'failed' ||
        op.status === 'cancelled'
      ) {
        onClear?.(op.id);
      }
    });
  }, [operations, onClear]);
  const handlePauseAll = useCallback(() => {
    operations.forEach((op) => {
      if (op.status === 'running' && op.canPause) {
        onPause?.(op.id);
      }
    });
  }, [operations, onPause]);
  const handleResumeAll = useCallback(() => {
    operations.forEach((op) => {
      if (op.status === 'paused') {
        onResume?.(op.id);
      }
    });
  }, [operations, onResume]);
  if (operations.length === 0) {
    return null;
  }
  return (
    <div>
      {/* Summary */}
      {showSummary && !compact && (
        <ProgressSummary
          operations={operations}
          onClearAll={handleClearAll}
          onPauseAll={handlePauseAll}
          onResumeAll={handleResumeAll}
        />
      )}
      {/* Operations List */}
      <div>
        {visibleOperations.map((operation) => (
          <ProgressItem
            key={operation.id}
            operation={operation}
            onCancel={() => onCancel?.(operation.id)}
            onPause={() => onPause?.(operation.id)}
            onResume={() => onResume?.(operation.id)}
            onRetry={() => onRetry?.(operation.id)}
            onClear={() => onClear?.(operation.id)}
            compact={compact}
          />
        ))}
        {/* Show More/Less Button */}
        {hasMoreOperations && (
          <Button
            fullWidth
            
            onClick={() => setShowAll(!showAll)}
            className=""
          >
            {showAll
              ? 'Show Less'
              : `Show ${
                  filteredOperations.length - maxVisible
                } More Operations`}
          </Button>
        )}
      </div>
    </div>
  );
};
// Utility function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export default ClinicalNotesProgressTracker;
export { ProgressItem, ProgressSummary };
