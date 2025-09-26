import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Progress } from '@/components/ui/progress';

import { Alert } from '@/components/ui/alert';

interface BulkOperationStatus {
  id: string;
  type:
    | 'role_assignment'
    | 'role_revocation'
    | 'permission_update'
    | 'user_update';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  startTime: string;
  endTime?: string;
  errors: Array<{
    userId: string;
    userName?: string;
    error: string;
  }>;
  warnings: Array<{
    userId: string;
    userName?: string;
    message: string;
  }>;
  metadata?: {
    roleNames?: string[];
    permissions?: string[];
    userCount?: number;
  };
}
interface BulkOperationProgressProps {
  open: boolean;
  onClose: () => void;
  operationId?: string;
  initialData?: Partial<BulkOperationStatus>;
}
const BulkOperationProgress: React.FC<BulkOperationProgressProps> = ({ 
  open,
  onClose,
  operationId,
  initialData
}) => {
  const { subscribe } = useWebSocket();
  const [operation, setOperation] = useState<BulkOperationStatus | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  // Initialize operation data
  useEffect(() => {
    if (initialData && open) {
      setOperation({  })
        id: operationId || `op-${Date.now()}`,
        type: 'role_assignment',
        status: 'pending',
        progress: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
        },
        startTime: new Date().toISOString(),
        errors: [],
        warnings: [],
        ...initialData}
    }
  }, [initialData, operationId, open]);
  // Subscribe to bulk operation updates
  useEffect(() => {
    if (!operationId) return;
    const unsubscribe = subscribe('bulk_operation', (message) => {
      const update = message.data;
      if (update.operationId === operationId) {
        setOperation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: update.status || prev.status,
            progress: {
              ...prev.progress,
              ...update.progress,
            },
            errors: update.errors || prev.errors,
            warnings: update.warnings || prev.warnings,
            endTime: update.endTime || prev.endTime,
          };
        });
      }
    });
    return unsubscribe;
  }, [operationId, subscribe]);
  const getOperationTypeLabel = (type: BulkOperationStatus['type']) => {
    switch (type) {
      case 'role_assignment':
        return 'Role Assignment';
      case 'role_revocation':
        return 'Role Revocation';
      case 'permission_update':
        return 'Permission Update';
      case 'user_update':
        return 'User Update';
      default:
        return 'Bulk Operation';
    }
  };
  const getOperationIcon = (type: BulkOperationStatus['type']) => {
    switch (type) {
      case 'role_assignment':
      case 'role_revocation':
        return <GroupIcon />;
      case 'permission_update':
        return <SecurityIcon />;
      case 'user_update':
        return <GroupIcon />;
      default:
        return <InfoIcon />;
    }
  };
  const getStatusColor = (status: BulkOperationStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };
  const calculateProgress = () => {
    if (!operation || operation.progress.total === 0) return 0;
    return (operation.progress.processed / operation.progress.total) * 100;
  };
  const getElapsedTime = () => {
    if (!operation) return '';
    const start = new Date(operation.startTime);
    const end = operation.endTime ? new Date(operation.endTime) : new Date();
    const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor(
      (elapsed % 3600) / 60
    )}m`;
  };
  const isOperationComplete = () => {
    return (
      operation?.status === 'completed' ||
      operation?.status === 'failed' ||
      operation?.status === 'cancelled'
    );
  };
  if (!operation) {
    return null;
  }
  return (
    <Dialog
      open={open}
      onClose={isOperationComplete() ? onClose : undefined}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={!isOperationComplete()}
    >
      <DialogTitle>
        <div className="">
          {getOperationIcon(operation.type)}
          <div className="">
            <div >
              {getOperationTypeLabel(operation.type)}
            </div>
            <div
              className=""
            >
              <Chip
                label={operation.status.replace('_', ' ')}
                color={getStatusColor(operation.status)}
                size="small"
                
              />
              <div  color="textSecondary">
                {getElapsedTime()}
              </div>
            </div>
          </div>
        </div>
      </DialogTitle>
      <DialogContent>
        <div className="">
          {/* Progress Bar */}
          <div className="">
            <div
              className=""
            >
              <div >
                Progress: {operation.progress.processed} /{' '}
                {operation.progress.total}
              </div>
              <div >
                {Math.round(calculateProgress())}%
              </div>
            </div>
            <Progress
              
              color={getStatusColor(operation.status)}
              className=""
            />
          </div>
          {/* Statistics */}
          <div className="">
            <Chip
              icon={<CheckCircleIcon />}
              label={`${operation.progress.successful} Successful`}
              color="success"
              
            />
            {operation.progress.failed > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${operation.progress.failed} Failed`}
                color="error"
                
              />
            )}
            {operation.warnings.length > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${operation.warnings.length} Warnings`}
                color="warning"
                
              />
            )}
          </div>
          {/* Operation Details */}
          {operation.metadata && (
            <div className="">
              <div  gutterBottom>
                Operation Details
              </div>
              {operation.metadata.roleNames && (
                <div className="">
                  <div  color="textSecondary">
                    Roles:
                  </div>
                  <div
                    className=""
                  >
                    {operation.metadata.roleNames.map((roleName) => (
                      <Chip
                        key={roleName}
                        label={roleName}
                        size="small"
                        
                      />
                    ))}
                  </div>
                </div>
              )}
              {operation.metadata.permissions && (
                <div className="">
                  <div  color="textSecondary">
                    Permissions:
                  </div>
                  <div
                    className=""
                  >
                    {operation.metadata.permissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission}
                        size="small"
                        
                      />
                    ))}
                  </div>
                </div>
              )}
              {operation.metadata.userCount && (
                <div  color="textSecondary">
                  Affected Users: {operation.metadata.userCount}
                </div>
              )}
            </div>
          )}
          {/* Errors Section */}
          {operation.errors.length > 0 && (
            <div className="">
              <div
                className=""
                onClick={() => setShowErrors(!showErrors)}
              >
                <IconButton size="small">
                  {showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <div  color="error">
                  Errors ({operation.errors.length})
                </div>
              </div>
              <Collapse in={showErrors}>
                <Alert severity="error" className="">
                  <List dense>
                    {operation.errors.map((error, index) => (
                      <div key={index} disablePadding>
                        <div>
                          <ErrorIcon color="error" fontSize="small" />
                        </div>
                        <div
                          primary={error.userName || error.userId}
                          secondary={error.error}
                        />
                      </div>
                    ))}
                  </List>
                </Alert>
              </Collapse>
            </div>
          )}
          {/* Warnings Section */}
          {operation.warnings.length > 0 && (
            <div className="">
              <div
                className=""
                onClick={() => setShowWarnings(!showWarnings)}
              >
                <IconButton size="small">
                  {showWarnings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <div  color="warning.main">
                  Warnings ({operation.warnings.length})
                </div>
              </div>
              <Collapse in={showWarnings}>
                <Alert severity="warning" className="">
                  <List dense>
                    {operation.warnings.map((warning, index) => (
                      <div key={index} disablePadding>
                        <div>
                          <WarningIcon color="warning" fontSize="small" />
                        </div>
                        <div
                          primary={warning.userName || warning.userId}
                          secondary={warning.message}
                        />
                      </div>
                    ))}
                  </List>
                </Alert>
              </Collapse>
            </div>
          )}
          {/* Completion Message */}
          {isOperationComplete() && (
            <Alert
              severity={
                operation.status === 'completed'
                  ? 'success'
                  : operation.status === 'failed'
                  ? 'error'
                  : 'warning'}
              }
            >
              {operation.status === 'completed' && (
                <>
                  Operation completed successfully!{' '}
                  {operation.progress.successful} out of{' '}
                  {operation.progress.total} items processed.
                  {operation.progress.failed > 0 &&
                    ` ${operation.progress.failed} items failed.`}
                </>
              )}
              {operation.status === 'failed' && (
                <>
                  Operation failed. {operation.progress.successful} out of{' '}
                  {operation.progress.total} items were processed successfully.
                </>
              )}
              {operation.status === 'cancelled' && (
                <>
                  Operation was cancelled. {operation.progress.successful} out
                  of {operation.progress.total} items were processed.
                </>
              )}
            </Alert>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        {!isOperationComplete() && (
          <Button
            
            color="error"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={onClose}
          variant={isOperationComplete() ? 'contained' : 'outlined'}
          disabled={!isOperationComplete()}
        >
          {isOperationComplete() ? 'Close' : 'Running...'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default BulkOperationProgress;
