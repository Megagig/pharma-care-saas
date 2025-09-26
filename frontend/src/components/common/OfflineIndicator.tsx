import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  CloudOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cloud,
  Loader,
} from 'lucide-react';

// Mock data and hooks
const useResponsive = () => ({ isMobile: false });
const syncService = {
  onSync: (callback: (result: any) => void) => () => {},
  getSyncStatus: () => Promise.resolve({ isOnline: true, syncInProgress: false, queueLength: 0 }),
  forceSync: () => Promise.resolve(),
};

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  position = 'top',
  showDetails = false
}) => {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    queueLength: 0,
  });
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = syncService.onSync((result) => {
      setLastSyncResult(result);
      toast({
        title: result.success ? 'Sync completed' : 'Sync failed',
        description: result.success
          ? `${result.synced || 0} items synced`
          : `${result.failed || 0} errors`,
        variant: result.success ? 'default' : 'destructive',
      });
      updateSyncStatus();
    });

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [toast]);

  const updateSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      await syncService.forceSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  if (isOnline && syncStatus.queueLength === 0 && !showDetails) {
    return null;
  }

  const getStatusVariant = (): 'default' | 'destructive' | 'warning' => {
    if (!isOnline) return 'destructive';
    if (syncStatus.syncInProgress) return 'default';
    if (syncStatus.queueLength > 0) return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline - Changes will sync when connected';
    if (syncStatus.syncInProgress) return 'Syncing changes...';
    if (syncStatus.queueLength > 0)
      return `${syncStatus.queueLength} changes pending sync`;
    return 'All changes synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4" />;
    if (syncStatus.syncInProgress) return <Loader className="h-4 w-4 animate-spin" />;
    if (syncStatus.queueLength > 0) return <RefreshCw className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  return (
    <div className={`fixed ${position}-0 left-0 right-0 z-50 p-2`}>
      <Alert variant={getStatusVariant()}>
        {getStatusIcon()}
        <AlertTitle>{getStatusText()}</AlertTitle>
        <AlertDescription>
          {showSyncDetails && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {syncStatus.queueLength > 0 && (
                  <Badge variant="warning">{`${syncStatus.queueLength} pending`}</Badge>
                )}
                {syncStatus.syncInProgress && (
                  <Badge variant="default">Syncing</Badge>
                )}
              </div>
              {lastSyncResult && (
                <div>
                  <p className="font-semibold">Last Sync Result</p>
                  <p>{`${lastSyncResult.synced || 0} synced, ${lastSyncResult.failed || 0} failed`}</p>
                  {lastSyncResult.errors && lastSyncResult.errors.length > 0 && (
                    <div className="text-xs text-destructive">
                      <p>Errors:</p>
                      <ul className="list-disc list-inside">
                        {lastSyncResult.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                      {lastSyncResult.errors.length > 3 && (
                        <p>... and {lastSyncResult.errors.length - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isOnline && (
                <Button size="sm" variant="outline" onClick={handleManualSync} disabled={syncStatus.syncInProgress}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
        <div className="absolute top-2 right-2 flex gap-2">
          {isOnline && syncStatus.queueLength > 0 && (
            <Button size="icon" variant="ghost" onClick={handleManualSync} disabled={syncStatus.syncInProgress}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {showDetails && (
            <Button size="icon" variant="ghost" onClick={() => setShowSyncDetails(!showSyncDetails)}>
              {showSyncDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {syncStatus.syncInProgress && <Progress value={undefined} className="absolute bottom-0 left-0 right-0 h-1" />}
      </Alert>
    </div>
  );
};

export default OfflineIndicator;