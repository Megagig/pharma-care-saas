import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader, AlertCircle, RefreshCw } from 'lucide-react';

// Mock data and hooks
const useSocketConnection = () => ({
  connectionStatus: 'connected',
  isConnected: true,
  connectionInfo: { socketId: '123', reconnectAttempts: 0, joinedConversations: [] },
});
const socketService = { forceReconnect: () => {} };

type ConnectionStatusType = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  showDetails?: boolean;
  size?: 'small' | 'medium';
  variant?: 'chip' | 'icon' | 'full';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false,
  size = 'small',
  variant = 'chip'
}) => {
  const { connectionStatus, isConnected, connectionInfo } = useSocketConnection();

  const getStatusConfig = (status: ConnectionStatusType) => {
    const iconSize = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';
    switch (status) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <Wifi className={iconSize} />,
          label: 'Connected',
          tooltip: 'Real-time messaging is active',
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          icon: <Loader className={`${iconSize} animate-spin`} />,
          label: 'Connecting',
          tooltip: 'Establishing connection...',
        };
      case 'reconnecting':
        return {
          variant: 'secondary' as const,
          icon: <Loader className={`${iconSize} animate-spin`} />,
          label: 'Reconnecting',
          tooltip: 'Attempting to reconnect...',
        };
      case 'disconnected':
        return {
          variant: 'outline' as const,
          icon: <WifiOff className={iconSize} />,
          label: 'Disconnected',
          tooltip: 'Real-time messaging is offline',
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className={iconSize} />,
          label: 'Error',
          tooltip: 'Connection error occurred',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <WifiOff className={iconSize} />,
          label: 'Unknown',
          tooltip: 'Connection status unknown',
        };
    }
  };

  const statusConfig = getStatusConfig(connectionStatus);
  const handleReconnect = () => {
    socketService.forceReconnect();
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2">{statusConfig.icon}</div>
          </TooltipTrigger>
          <TooltipContent><p>{statusConfig.tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'chip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={statusConfig.variant} className="flex items-center gap-2">
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>{statusConfig.tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground">
      <div>{statusConfig.icon}</div>
      <div className="flex-grow">
        <p className="font-semibold">{statusConfig.label}</p>
        {showDetails && (
          <div className="text-xs text-muted-foreground space-y-1 mt-1">
            {connectionInfo.socketId && <p>ID: {connectionInfo.socketId.slice(0, 8)}...</p>}
            {connectionInfo.reconnectAttempts > 0 && <p>Retries: {connectionInfo.reconnectAttempts}</p>}
            {connectionInfo.joinedConversations.length > 0 && <p>Rooms: {connectionInfo.joinedConversations.length}</p>}
          </div>
        )}
      </div>
      {!isConnected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={handleReconnect}><RefreshCw className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent><p>Retry connection</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default ConnectionStatus;