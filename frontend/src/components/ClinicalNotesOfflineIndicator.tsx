import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Tooltip, Progress, Alert, AlertTitle } from '@/components/ui/button';

interface ClinicalNotesOfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}
interface OfflineData {
  pendingNotes: number;
  draftNotes: number;
  queuedUploads: number;
  lastSyncTime: Date | null;
  totalOfflineSize: number;
}
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  syncError: string | null;
  offlineData: OfflineData;
}
const ClinicalNotesOfflineIndicator: React.FC = ({ position = 'top', showDetails = true, onSyncComplete, onSyncError }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ 
    isOnline: navigator.onLine,
    isSyncing: false,
    syncProgress: 0,
    syncError: null,
    offlineData: {
      pendingNotes: 0,
      draftNotes: 0,
      queuedUploads: 0,
      lastSyncTime: null,
      totalOfflineSize: 0}
    }
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ 
        ...prev,
        isOnline: true,
        syncError: null}
      }));
      setShowOfflineAlert(false);
      // Auto-sync when coming back online if there's pending data
      if (
        syncStatus.offlineData.pendingNotes > 0 ||
        syncStatus.offlineData.queuedUploads > 0
      ) {
        handleAutoSync();
      }
    };
    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
      setShowOfflineAlert(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus.offlineData]);
  // Load offline data statistics
  useEffect(() => {
    const loadOfflineStats = async () => {
      try {
        // In a real implementation, this would query IndexedDB or localStorage
        const offlineData: OfflineData = {
          pendingNotes: parseInt(
            localStorage.getItem('clinical-notes-pending') || '0'
          ),
          draftNotes: parseInt(
            localStorage.getItem('clinical-notes-drafts') || '0'
          ),
          queuedUploads: parseInt(
            localStorage.getItem('clinical-notes-uploads') || '0'
          ),
          lastSyncTime: localStorage.getItem('clinical-notes-last-sync')
            ? new Date(localStorage.getItem('clinical-notes-last-sync')!)
            : null,
          totalOfflineSize: parseInt(
            localStorage.getItem('clinical-notes-size') || '0'
          ),
        };
        setSyncStatus((prev) => ({ ...prev, offlineData }));
      } catch (error) {
        console.error('Failed to load offline stats:', error);
      }
    };
    loadOfflineStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadOfflineStats, 30000);
    return () => clearInterval(interval);
  }, []);
  // Auto-sync when coming back online
  const handleAutoSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;
    try {
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: true,
        syncProgress: 0,
        syncError: null}
      }));
      // Simulate sync progress
      const totalItems =
        syncStatus.offlineData.pendingNotes +
        syncStatus.offlineData.queuedUploads;
      let completed = 0;
      // Sync pending notes
      for (let i = 0; i < syncStatus.offlineData.pendingNotes; i++) {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        completed++;
        setSyncStatus((prev) => ({ 
          ...prev,
          syncProgress: Math.round((completed / totalItems) * 100)}
        }));
      }
      // Sync queued uploads
      for (let i = 0; i < syncStatus.offlineData.queuedUploads; i++) {
        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        completed++;
        setSyncStatus((prev) => ({ 
          ...prev,
          syncProgress: Math.round((completed / totalItems) * 100)}
        }));
      }
      // Update offline data after successful sync
      const updatedOfflineData: OfflineData = {
        ...syncStatus.offlineData,
        pendingNotes: 0,
        queuedUploads: 0,
        lastSyncTime: new Date(),
      };
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: false,
        syncProgress: 100,
        offlineData: updatedOfflineData}
      }));
      // Update localStorage
      localStorage.setItem('clinical-notes-pending', '0');
      localStorage.setItem('clinical-notes-uploads', '0');
      localStorage.setItem(
        'clinical-notes-last-sync',
        new Date().toISOString()
      );
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sync failed';
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: false,
        syncError: errorMessage}
      }));
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      }
    }
  }, [
    syncStatus.isOnline,
    syncStatus.isSyncing,
    syncStatus.offlineData,
    onSyncComplete,
    onSyncError,
  ]);
  // Manual sync
  const handleManualSync = useCallback(async () => {
    setShowSyncDialog(true);
    await handleAutoSync();
    setTimeout(() => setShowSyncDialog(false), 1000);
  }, [handleAutoSync]);
  // Get status configuration
  const getStatusConfig = () => {
    if (!syncStatus.isOnline) {
      return {
        color: 'error' as const,
        icon: <CloudOffIcon />,
        message: 'Offline',
        description: 'Working offline - changes will sync when connected',
      };
    }
    if (syncStatus.isSyncing) {
      return {
        color: 'info' as const,
        icon: <SyncIcon className="" />,
        message: 'Syncing...',
        description: `Syncing clinical notes (${syncStatus.syncProgress}%)`,
      };
    }
    if (syncStatus.syncError) {
      return {
        color: 'error' as const,
        icon: <ErrorIcon />,
        message: 'Sync Error',
        description: syncStatus.syncError,
      };
    }
    const hasPendingData =
      syncStatus.offlineData.pendingNotes > 0 ||
      syncStatus.offlineData.queuedUploads > 0;
    if (hasPendingData) {
      return {
        color: 'warning' as const,
        icon: <WarningIcon />,
        message: 'Pending Sync',
        description: `${
          syncStatus.offlineData.pendingNotes +
          syncStatus.offlineData.queuedUploads
        } items pending`,
      };
    }
    return {
      color: 'success' as const,
      icon: <CheckCircleIcon />,
      message: 'Synced',
      description: 'All clinical notes are up to date',
    };
  };
  const statusConfig = getStatusConfig();
  const hasPendingData =
    syncStatus.offlineData.pendingNotes > 0 ||
    syncStatus.offlineData.queuedUploads > 0 ||
    syncStatus.offlineData.draftNotes > 0;
  return (
    <>
      {/* Offline Alert Snackbar */}
      <Snackbar
        open={showOfflineAlert}
        
        autoHideDuration={null}
      >
        <Alert
          severity="warning"
          icon={<CloudOffIcon />}
          action={
            showDetails && (
              <IconButton
                size="small"}
                onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                className=""
              >
                {showDetailsPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )
          }
        >
          <AlertTitle>Working Offline</AlertTitle>
          <div >
            Clinical notes will be saved locally and synced when connection is
            restored
          </div>
          {hasPendingData && (
            <div  display="block" className="">
              {syncStatus.offlineData.pendingNotes +
                syncStatus.offlineData.queuedUploads}{' '}
              items pending sync
            </div>
          )}
        </Alert>
      </Snackbar>
      {/* Status Indicator */}
      <div
        className=""
      >
        <Tooltip title={statusConfig.description}>
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.message}
            color={statusConfig.color}
            size="small"
            onClick={
              showDetails
                ? () => setShowDetailsPanel(!showDetailsPanel)
                : undefined}
            }
            className=""
                  '100%': { transform: 'rotate(360deg)' },
                },
              },
          />
        </Tooltip>
        {hasPendingData && (
          <Chip
            label={
              syncStatus.offlineData.pendingNotes +
              syncStatus.offlineData.queuedUploads}
            }
            size="small"
            color="warning"
            
          />
        )}
      </div>
      {/* Details Panel */}
      {showDetails && (
        <Collapse in={showDetailsPanel}>
          <Card
            className=""
          >
            <CardContent>
              <div  gutterBottom>
                Clinical Notes Sync Status
              </div>
              {/* Connection Status */}
              <div
                className=""
              >
                {statusConfig.icon}
                <div  fontWeight="medium">
                  {statusConfig.message}
                </div>
              </div>
              {/* Sync Progress */}
              {syncStatus.isSyncing && (
                <div className="">
                  <div
                    
                    color="text.secondary"
                    gutterBottom
                  >
                    Syncing clinical notes...
                  </div>
                  <Progress
                    
                    className=""
                  />
                  <div  color="text.secondary">
                    {syncStatus.syncProgress}% complete
                  </div>
                </div>
              )}
              {/* Offline Data Summary */}
              <div className="">
                <div  gutterBottom>
                  Offline Data:
                </div>
                <List dense>
                  <div className="">
                    <div className="">
                      <ScheduleIcon fontSize="small" color="warning" />
                    </div>
                    <div
                      primary={`${syncStatus.offlineData.pendingNotes} pending notes`}
                      
                    />
                  </div>
                  <div className="">
                    <div className="">
                      <StorageIcon fontSize="small" color="info" />
                    </div>
                    <div
                      primary={`${syncStatus.offlineData.draftNotes} draft notes`}
                      
                    />
                  </div>
                  <div className="">
                    <div className="">
                      <CloudIcon fontSize="small" color="primary" />
                    </div>
                    <div
                      primary={`${syncStatus.offlineData.queuedUploads} queued uploads`}
                      
                    />
                  </div>
                </List>
              </div>
              {/* Last Sync Time */}
              {syncStatus.offlineData.lastSyncTime && (
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Last sync:{' '}
                  {syncStatus.offlineData.lastSyncTime.toLocaleString()}
                </div>
              )}
              {/* Error Message */}
              {syncStatus.syncError && (
                <Alert severity="error" size="small" className="">
                  {syncStatus.syncError}
                </Alert>
              )}
              {/* Actions */}
              <div direction="row" spacing={1}>
                <Button
                  size="small"
                  
                  startIcon={<SyncIcon />}
                  onClick={handleManualSync}
                  disabled={!syncStatus.isOnline || syncStatus.isSyncing}
                >
                  Sync Now
                </Button>
                <Button
                  size="small"
                  
                  startIcon={<InfoIcon />}
                  >
                  Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </Collapse>
      )}
      {/* Sync Progress Dialog */}
      <Dialog
        open={showSyncDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Syncing Clinical Notes</DialogTitle>
        <DialogContent>
          <div className="">
            <div  color="text.secondary" gutterBottom>
              Syncing your offline clinical notes and uploads...
            </div>
            <Progress
              
              className=""
            />
            <div  color="text.secondary">
              {syncStatus.syncProgress}% complete
            </div>
            {syncStatus.syncProgress === 100 && (
              <Alert severity="success" className="">
                <CheckCircleIcon className="" />
                Sync completed successfully!
              </Alert>
            )}
          </div>
        </DialogContent>
        {syncStatus.syncProgress === 100 && (
          <DialogActions>
            <Button onClick={() => setShowSyncDialog(false)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};
export default ClinicalNotesOfflineIndicator;
