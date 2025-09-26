
import { Tooltip, Spinner, Alert } from '@/components/ui/button';
// ===============================
// MTR STATUS INDICATOR COMPONENT
// ===============================
interface MTRStatusIndicatorProps {
  patientId: string;
  variant?: 'chip' | 'detailed' | 'compact';
  showActions?: boolean;
  onStartMTR?: () => void;
  onViewMTR?: (mtrId: string) => void;
}
export const MTRStatusIndicator: React.FC<MTRStatusIndicatorProps> = ({ 
  patientId,
  variant = 'chip',
  showActions = false,
  onStartMTR,
  onViewMTR
}) => {
  const navigate = useNavigate();
  const {
    data: mtrSummary,
    isLoading,
    isError,
    error,
  } = usePatientMTRSummary(patientId, !!patientId && patientId.length === 24);
  const handleStartMTR = () => {
    if (onStartMTR) {
      onStartMTR();
    } else {
      navigate(`/mtr/new?patientId=${patientId}`);
    }
  };
  const handleViewMTR = (mtrId: string) => {
    if (onViewMTR) {
      onViewMTR(mtrId);
    } else {
      navigate(`/mtr/${mtrId}`);
    }
  };
  const getStatusConfig = (status: PatientMTRSummary['mtrStatus']) => {
    switch (status) {
      case 'active':
        return {
          color: 'primary' as const,
          icon: <ActiveIcon />,
          label: 'Active MTR',
          description: 'MTR session in progress',
        };
      case 'overdue':
        return {
          color: 'error' as const,
          icon: <OverdueIcon />,
          label: 'Overdue MTR',
          description: 'MTR session is overdue',
        };
      case 'scheduled':
        return {
          color: 'info' as const,
          icon: <ScheduledIcon />,
          label: 'Scheduled MTR',
          description: 'MTR session scheduled',
        };
      case 'none':
      default:
        return {
          color: 'default' as const,
          icon: <MTRIcon />,
          label: 'No Active MTR',
          description: 'No active MTR sessions',
        };
    }
  };
  if (isLoading) {
    return (
      <div className="">
        <Spinner size={16} />
        {variant !== 'compact' && (
          <div  color="text.secondary">
            Loading MTR status...
          </div>
        )}
      </div>
    );
  }
  if (isError) {
    return (
      <Tooltip
        title={`Failed to load MTR status: ${
          error?.message || 'Unknown error'}
        }`}
      >
        <Chip
          size="small"
          label="MTR Status Error"
          color="error"
          
        />
      </Tooltip>
    );
  }
  if (!mtrSummary) {
    return null;
  }
  const statusConfig = getStatusConfig(mtrSummary.mtrStatus);
  // Chip variant - simple status indicator
  if (variant === 'chip') {
    return (
      <Tooltip title={statusConfig.description}>
        <Chip
          size="small"
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          variant={mtrSummary.hasActiveMTR ? 'filled' : 'outlined'}
          onClick={
            mtrSummary.hasActiveMTR && mtrSummary.recentMTRs[0]
              ? () => handleViewMTR(mtrSummary.recentMTRs[0]._id)
              : undefined}
          }
          className=""
        />
      </Tooltip>
    );
  }
  // Compact variant - minimal display
  if (variant === 'compact') {
    return (
      <div className="">
        <Tooltip title={statusConfig.description}>
          <div
            className="">
            {React.cloneElement(statusConfig.icon, { fontSize: 'small' })}
          </div>
        </Tooltip>
        {showActions && (
          <Tooltip title={mtrSummary.hasActiveMTR ? 'View MTR' : 'Start MTR'}>
            <IconButton
              size="small"
              onClick={
                mtrSummary.hasActiveMTR && mtrSummary.recentMTRs[0]
                  ? () => handleViewMTR(mtrSummary.recentMTRs[0]._id)
                  : handleStartMTR}
              }
            >
              {mtrSummary.hasActiveMTR ? <MTRIcon /> : <AddIcon />}
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  }
  // Detailed variant - comprehensive display
  return (
    <div className="">
      <div spacing={2}>
        {/* Header */}
        <div
          className=""
        >
          <div className="">
            {statusConfig.icon}
            <div  className="">
              MTR Status
            </div>
          </div>
          <Chip
            size="small"
            label={statusConfig.label}
            color={statusConfig.color}
            variant={mtrSummary.hasActiveMTR ? 'filled' : 'outlined'}
          />
        </div>
        {/* Statistics */}
        <div
          className=""
        >
          <div>
            <div  color="text.secondary">
              Total Sessions
            </div>
            <div  className="">
              {mtrSummary.totalMTRSessions}
            </div>
          </div>
          <div>
            <div  color="text.secondary">
              Completed
            </div>
            <div  className="">
              {mtrSummary.completedMTRSessions}
            </div>
          </div>
          <div>
            <div  color="text.secondary">
              Active
            </div>
            <div  className="">
              {mtrSummary.activeMTRSessions}
            </div>
          </div>
          <div>
            <div  color="text.secondary">
              Last MTR
            </div>
            <div  className="">
              {mtrSummary.lastMTRDate
                ? new Date(mtrSummary.lastMTRDate).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>
        {/* Next scheduled MTR */}
        {mtrSummary.nextScheduledMTR && (
          <Alert severity="info" className="">
            <div >
              Next MTR scheduled for{' '}
              {new Date(mtrSummary.nextScheduledMTR).toLocaleDateString()}
            </div>
          </Alert>
        )}
        {/* Actions */}
        {showActions && (
          <div direction="row" spacing={1}>
            {mtrSummary.hasActiveMTR && mtrSummary.recentMTRs[0] ? (
              <Chip
                size="small"
                label="View Active MTR"
                color="primary"
                icon={<MTRIcon />}
                onClick={() => handleViewMTR(mtrSummary.recentMTRs[0]._id)}
                clickable
              />
            ) : (
              <Chip
                size="small"
                label="Start New MTR"
                color="primary"
                icon={<AddIcon />}
                onClick={handleStartMTR}
                clickable
              />
            )}
            {mtrSummary.totalMTRSessions > 0 && (
              <Chip
                size="small"
                label="View History"
                
                icon={<MTRIcon />}
                onClick={() => navigate(`/patients/${patientId}/mtr-history`)}
                clickable
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// ===============================
// MTR QUICK ACTIONS COMPONENT
// ===============================
interface MTRQuickActionsProps {
  patientId: string;
  mtrSummary?: PatientMTRSummary;
  onStartMTR?: () => void;
  onViewMTR?: (mtrId: string) => void;
  onSyncData?: () => void;
}
export const MTRQuickActions: React.FC<MTRQuickActionsProps> = ({ 
  patientId,
  mtrSummary,
  onStartMTR,
  onViewMTR,
  onSyncData
}) => {
  const navigate = useNavigate();
  const handleStartMTR = () => {
    if (onStartMTR) {
      onStartMTR();
    } else {
      navigate(`/mtr/new?patientId=${patientId}`);
    }
  };
  const handleViewMTR = (mtrId: string) => {
    if (onViewMTR) {
      onViewMTR(mtrId);
    } else {
      navigate(`/mtr/${mtrId}`);
    }
  };
  const handleSyncData = () => {
    if (onSyncData) {
      onSyncData();
    }
  };
  return (
    <div direction="row" spacing={1} flexWrap="wrap">
      {mtrSummary?.hasActiveMTR && mtrSummary.recentMTRs[0] ? (
        <>
          <Tooltip title="Continue active MTR session">
            <IconButton
              color="primary"
              onClick={() => handleViewMTR(mtrSummary.recentMTRs[0]._id)}
            >
              <ActiveIcon />
            </IconButton>
          </Tooltip>
          {onSyncData && (
            <Tooltip title="Sync patient data with MTR">
              <IconButton color="info" onClick={handleSyncData}>
                <SyncIcon />
              </IconButton>
            </Tooltip>
          )}
        </>
      ) : (
        <Tooltip title="Start new MTR session">
          <IconButton color="primary" onClick={handleStartMTR}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
      {mtrSummary && mtrSummary.totalMTRSessions > 0 && (
        <Tooltip title="View MTR history">
          <IconButton
            color="default"
            onClick={() => navigate(`/patients/${patientId}/mtr-history`)}
          >
            <MTRIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
export default MTRStatusIndicator;
