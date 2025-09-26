import { Button, Progress, Alert } from '@/components/ui/button';

interface OfflineModeHandlerProps {
  children: React.ReactNode;
  enableOfflineMode?: boolean;
  showOfflineIndicator?: boolean;
  autoSync?: boolean;
}
interface OfflineQueueItem {
  id: string;
  type: 'message' | 'conversation' | 'file';
  data: any;
  timestamp: number;
  retryCount: number;
}
/**
 * Handles offline mode functionality for Communication Hub
 * Provides graceful degradation, offline storage, and sync when connection is restored
 */
const OfflineModeHandler: React.FC<OfflineModeHandlerProps> = ({ 
  children,
  enableOfflineMode = true,
  showOfflineIndicator = true,
  autoSync = true
}) => {
  const { isConnected, connectionStatus } = useSocketConnection();
  const { errors } = useCommunicationStore();
  // Offline state management
  const [isOffline, setIsOffline] = useState(!navigator.onLine || !isConnected);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [offlineStartTime, setOfflineStartTime] = useState<number | null>(null);
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (offlineStartTime) {
        const offlineDuration = Date.now() - offlineStartTime;
        console.log(`Back online after ${Math.round(offlineDuration / 1000)}s`);
        setOfflineStartTime(null);
      }
      if (autoSync && offlineQueue.length > 0) {
        handleSync();
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      setOfflineStartTime(Date.now());
      setShowOfflineAlert(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, offlineQueue.length, offlineStartTime]);
  // Monitor socket connection status
  useEffect(() => {
    const wasOffline = isOffline;
    const nowOffline = !navigator.onLine || !isConnected;
    if (wasOffline !== nowOffline) {
      setIsOffline(nowOffline);
      if (nowOffline && !offlineStartTime) {
        setOfflineStartTime(Date.now());
        setShowOfflineAlert(true);
      } else if (!nowOffline && offlineStartTime) {
        setOfflineStartTime(null);
        if (autoSync && offlineQueue.length > 0) {
          handleSync();
        }
      }
    }
  }, [
    isConnected,
    connectionStatus,
    isOffline,
    offlineStartTime,
    autoSync,
    offlineQueue.length,
  ]);
  // Load offline queue on mount
  useEffect(() => {
    loadOfflineQueue();
  }, []);
  /**
   * Load offline queue from storage
   */
  const loadOfflineQueue = useCallback(async () => {
    try {
      const queueItems = await offlineStorage.getSyncQueue();
      setOfflineQueue(
        queueItems.map((item) => ({ 
          id: item.id,
          type: item.type || 'message',
          data: item.data,
          timestamp: item.timestamp,
          retryCount: 0}
        }))
      );
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }, []);
  /**
   * Add item to offline queue
   */
  const addToOfflineQueue = useCallback(
    async (type: 'message' | 'conversation' | 'file', data: any) => {
      const queueItem: OfflineQueueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };
      try {
        // Store in IndexedDB
        await offlineStorage.storeOfflineIntervention(data, '', 'create');
        // Update local queue
        setOfflineQueue((prev) => [...prev, queueItem]);
        console.log(`Added ${type} to offline queue:`, queueItem.id);
      } catch (error) {
        console.error('Failed to add item to offline queue:', error);
      }
    },
    []
  );
  /**
   * Sync offline queue when connection is restored
   */
  const handleSync = useCallback(async () => {
    if (syncInProgress || offlineQueue.length === 0) {
      return;
    }
    setSyncInProgress(true);
    let successCount = 0;
    let failureCount = 0;
    try {
      for (const item of offlineQueue) {
        try {
          await syncQueueItem(item);
          // Remove from storage
          await offlineStorage.removeSyncQueueItem(item.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          failureCount++;
          // Increment retry count
          item.retryCount++;
          // Remove items that have failed too many times
          if (item.retryCount >= 3) {
            await offlineStorage.removeSyncQueueItem(item.id);
            console.log(`Removed item ${item.id} after 3 failed attempts`);
          }
        }
      }
      // Update queue to remove synced items
      setOfflineQueue((prev) => prev.filter((item) => item.retryCount < 3));
      if (successCount > 0) {
        setShowSyncSuccess(true);
        console.log(`Synced ${successCount} items successfully`);
      }
      if (failureCount > 0) {
        console.warn(`Failed to sync ${failureCount} items`);
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, offlineQueue]);
  /**
   * Sync individual queue item
   */
  const syncQueueItem = async (item: OfflineQueueItem): Promise<void> => {
    switch (item.type) {
      case 'message':
        // Sync message
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(item.data)}
        if (!response.ok) {
          throw new Error(`Failed to sync message: ${response.statusText}`);
        }
        break;
      case 'conversation':
        // Sync conversation
        const convResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(item.data)}
        if (!convResponse.ok) {
          throw new Error(
            `Failed to sync conversation: ${convResponse.statusText}`
          );
        }
        break;
      case 'file':
        // Sync file upload
        const formData = new FormData();
        Object.entries(item.data).forEach(([key, value]) => {
          formData.append(key, value as string | Blob);
        });
        const fileResponse = await fetch('/api/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData}
        if (!fileResponse.ok) {
          throw new Error(`Failed to sync file: ${fileResponse.statusText}`);
        }
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  };
  /**
   * Manual sync trigger
   */
  const handleManualSync = useCallback(() => {
    if (!isOffline && offlineQueue.length > 0) {
      handleSync();
    }
  }, [isOffline, offlineQueue.length, handleSync]);
  /**
   * Clear offline queue
   */
  const clearOfflineQueue = useCallback(async () => {
    try {
      await offlineStorage.clearAllData();
      setOfflineQueue([]);
      console.log('Offline queue cleared');
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }, []);
  /**
   * Get offline duration
   */
  const getOfflineDuration = useCallback((): string => {
    if (!offlineStartTime) return '';
    const duration = Date.now() - offlineStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [offlineStartTime]);
  // Don't render offline features if disabled
  if (!enableOfflineMode) {
    return <>{children}</>;
  }
  return (
    <div>
      {/* Offline Indicator */}
      {showOfflineIndicator && isOffline && (
        <div
          className=""
        >
          <div spacing={2}>
            <div className="">
              <WifiOff />
              <div  fontWeight="bold">
                Offline Mode
              </div>
              {offlineStartTime && (
                <Chip
                  label={getOfflineDuration()}
                  size="small"
                  className=""
                />
              )}
            </div>
            <div >
              You're currently offline. Messages will be saved and sent when
              connection is restored.
            </div>
            {offlineQueue.length > 0 && (
              <div>
                <div  display="block">
                  {offlineQueue.length} item(s) queued for sync
                </div>
                {syncInProgress && (
                  <div className="">
                    <Progress size="small" />
                    <div  color="text.secondary">
                      Syncing...
                    </div>
                  </div>
                )}
              </div>
            )}
            <div direction="row" spacing={1}>
              {!isOffline && offlineQueue.length > 0 && (
                <Button
                  size="small"
                  
                  startIcon={<Sync />}
                  onClick={handleManualSync}
                  disabled={syncInProgress}
                >
                  Sync Now
                </Button>
              )}
              <Button size="small"  onClick={clearOfflineQueue}>
                Clear Queue
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Offline Alert Snackbar */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        >
        <Alert
          severity="warning"
          action={
            <IconButton
              size="small"
              color="inherit"}
              onClick={() => setShowOfflineAlert(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <div className="">
            <CloudOff fontSize="small" />
            <div >
              Connection lost. Working in offline mode.
            </div>
          </div>
        </Alert>
      </Snackbar>
      {/* Sync Success Snackbar */}
      <Snackbar
        open={showSyncSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSyncSuccess(false)}
        >
        <Alert
          severity="success"
          action={
            <IconButton
              size="small"
              color="inherit"}
              onClick={() => setShowSyncSuccess(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <div className="">
            <CloudQueue fontSize="small" />
            <div >
              Offline data synced successfully!
            </div>
          </div>
        </Alert>
      </Snackbar>
      {/* Connection Status in Children Context */}
      <div
        className="">
        {children}
      </div>
    </div>
  );
};
export default OfflineModeHandler;
// Hook for using offline functionality in components
export const useOfflineMode = () => {
  const { isConnected } = useSocketConnection();
  const [isOffline, setIsOffline] = useState(!navigator.onLine || !isConnected);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  useEffect(() => {
    setIsOffline(!navigator.onLine || !isConnected);
  }, [isConnected]);
  const addToQueue = useCallback(
    async (type: 'message' | 'conversation' | 'file', data: any) => {
      const queueItem: OfflineQueueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };
      try {
        await offlineStorage.storeOfflineIntervention(data, '', 'create');
        setOfflineQueue((prev) => [...prev, queueItem]);
        return queueItem.id;
      } catch (error) {
        console.error('Failed to add to offline queue:', error);
        throw error;
      }
    },
    []
  );
  const removeFromQueue = useCallback(async (id: string) => {
    try {
      await offlineStorage.removeSyncQueueItem(id);
      setOfflineQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
    }
  }, []);
  return {
    isOffline,
    offlineQueue,
    addToQueue,
    removeFromQueue,
    queueLength: offlineQueue.length,
  };
};
