import { Button, Progress, Alert } from '@/components/ui/button';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingInterventions: number;
  lastSyncTime: Date | null;
  syncError: string | null;
}
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  position = 'top',
  showDetails = true
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ 
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingInterventions: 0,
    lastSyncTime: null,
    syncError: null}
  });
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [storageStats, setStorageStats] = useState({ 
    offlineInterventions: 0,
    formDrafts: 0,
    cacheEntries: 0}
  });
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true, syncError: null }));
      setShowOfflineAlert(false);
      // Trigger background sync when coming back online
      if (syncStatus.pendingInterventions > 0) {
        handleBackgroundSync();
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
  }, [syncStatus.pendingInterventions]);
  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      switch (type) {
        case 'INTERVENTION_SYNCED':
          setSyncStatus((prev) => ({ 
            ...prev,
            pendingInterventions: Math.max(0, prev.pendingInterventions - 1),
            lastSyncTime: new Date(),
            syncError: data.success ? null : 'Sync failed'}
          }));
          break;
        case 'SYNC_STARTED':
          setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
          break;
        case 'SYNC_COMPLETED':
          setSyncStatus((prev) => ({ 
            ...prev,
            isSyncing: false,
            lastSyncTime: new Date(),
            syncError: data.error || null}
          }));
          break;
        default:
          break;
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage
      );
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      }
    };
  }, []);
  // Load storage statistics
  useEffect(() => {
    const loadStorageStats = async () => {
      try {
        const stats = await offlineStorage.getStorageStats();
        setStorageStats(stats);
        setSyncStatus((prev) => ({ 
          ...prev,
          pendingInterventions: stats.offlineInterventions}
        }));
      } catch (error) {
        console.error('Failed to load storage stats:', error);
      }
    };
    loadStorageStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStorageStats, 30000);
    return () => clearInterval(interval);
  }, []);
  const handleBackgroundSync = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
      await offlineUtils.requestBackgroundSync('intervention-sync');
    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: false,
        syncError: 'Failed to start sync'}
      }));
    }
  };
  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      return;
    }
    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
      // Get offline interventions and attempt to sync them
      const offlineInterventions =
        await offlineStorage.getOfflineInterventions();
      for (const intervention of offlineInterventions) {
        try {
          const response = await fetch('/api/clinical-interventions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: intervention.authToken,
            },
            body: JSON.stringify(intervention.data)}
          if (response.ok) {
            await offlineStorage.removeOfflineIntervention(intervention.id);
            setSyncStatus((prev) => ({ 
              ...prev,
              pendingInterventions: Math.max(0, prev.pendingInterventions - 1)}
            }));
          }
        } catch (error) {
          console.error('Failed to sync intervention:', error);
        }
      }
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        syncError: null}
      }));
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus((prev) => ({ 
        ...prev,
        isSyncing: false,
        syncError: 'Manual sync failed'}
      }));
    }
  };
  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'error';
    if (syncStatus.isSyncing) return 'info';
    if (syncStatus.pendingInterventions > 0) return 'warning';
    return 'success';
  };
  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.pendingInterventions > 0)
      return `${syncStatus.pendingInterventions} pending`;
    return 'Online';
  };
  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <CloudOffIcon />;
    if (syncStatus.isSyncing) return <SyncIcon className="animate-spin" />;
    return <CloudIcon />;
  };
  return (
    <>
      {/* Offline Alert */}
      {showOfflineAlert && (
        <div
          className=""
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
            <div  fontWeight="medium">
              You're offline
            </div>
            <div >
              Changes will sync when connection is restored
            </div>
          </Alert>
        </div>
      )}
      {/* Status Indicator */}
      <div
        className=""
      >
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          onClick={
            showDetails
              ? () => setShowDetailsPanel(!showDetailsPanel)
              : undefined}
          }
          className=""
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
        />
      </div>
      {/* Details Panel */}
      {showDetails && (
        <Collapse in={showDetailsPanel}>
          <div
            className=""
          >
            <div  gutterBottom>
              Sync Status
            </div>
            {/* Connection Status */}
            <div className="">
              {syncStatus.isOnline ? (
                <CloudIcon color="success" />
              ) : (
                <CloudOffIcon color="error" />
              )}
              <div >
                {syncStatus.isOnline ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            {/* Sync Progress */}
            {syncStatus.isSyncing && (
              <div className="">
                <div  color="text.secondary">
                  Syncing interventions...
                </div>
                <Progress size="small" className="" />
              </div>
            )}
            {/* Pending Items */}
            {syncStatus.pendingInterventions > 0 && (
              <div className="">
                <div  color="warning.main">
                  {syncStatus.pendingInterventions} intervention(s) pending sync
                </div>
              </div>
            )}
            {/* Storage Stats */}
            <div className="">
              <div  color="text.secondary" gutterBottom>
                Offline Storage:
              </div>
              <div className="">
                <div >
                  • {storageStats.offlineInterventions} interventions queued
                </div>
                <div >
                  • {storageStats.formDrafts} form drafts saved
                </div>
                <div >
                  • {storageStats.cacheEntries} cached items
                </div>
              </div>
            </div>
            {/* Last Sync Time */}
            {syncStatus.lastSyncTime && (
              <div
                
                color="text.secondary"
                className=""
              >
                Last sync: {syncStatus.lastSyncTime.toLocaleTimeString()}
              </div>
            )}
            {/* Error Message */}
            {syncStatus.syncError && (
              <Alert severity="error" size="small" className="">
                {syncStatus.syncError}
              </Alert>
            )}
            {/* Actions */}
            <div className="">
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
          </div>
        </Collapse>
      )}
    </>
  );
};
export default OfflineIndicator;
