import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';

export interface SocketConnectionInfo {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectionInfo?: {
    connectedAt?: Date;
    reconnectAttempts?: number;
    latency?: number;
  };
}

export const useSocket = (): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    // Get auth token from localStorage or your auth context
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('No auth token found, socket connection not established');
      return;
    }

    // Create socket connection if it doesn't exist
    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    setSocketInstance(socket);

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // Only disconnect when user logs out or app closes
    };
  }, []);

  return socketInstance;
};

export const useSocketConnection = (): SocketConnectionInfo => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<SocketConnectionInfo['connectionInfo']>();

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    // Create socket connection if it doesn't exist
    if (!socket) {
      setConnectionStatus('connecting');
      socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
        setConnectionStatus('connected');
        setConnectionInfo({
          connectedAt: new Date(),
          reconnectAttempts: 0,
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionStatus('disconnected');
      });

      socket.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
        setConnectionInfo(prev => ({
          ...prev,
          reconnectAttempts: (prev?.reconnectAttempts || 0) + 1,
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('error');
      });
    } else {
      // Socket already exists, check its status
      setConnectionStatus(socket.connected ? 'connected' : 'disconnected');
      if (socket.connected) {
        setConnectionInfo({
          connectedAt: new Date(),
          reconnectAttempts: 0,
        });
      }
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    connectionInfo,
  };
};

export interface TypingUser {
  userId: string;
  userName?: string;
}

export const useTypingIndicator = (conversationId: string) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketInstance = useSocket();

  useEffect(() => {
    if (!socketInstance || !conversationId) return;

    const handleUserTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socketInstance.on('user:typing', handleUserTyping);
    socketInstance.on('user:stopped_typing', handleUserStoppedTyping);

    return () => {
      socketInstance.off('user:typing', handleUserTyping);
      socketInstance.off('user:stopped_typing', handleUserStoppedTyping);
    };
  }, [socketInstance, conversationId]);

  const startTyping = () => {
    if (socketInstance && conversationId) {
      socketInstance.emit('typing:start', { conversationId });
    }
  };

  const stopTyping = () => {
    if (socketInstance && conversationId) {
      socketInstance.emit('typing:stop', { conversationId });
    }
  };

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
};

export const useConversationPresence = (conversationId: string | null) => {
  const socketInstance = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socketInstance || !conversationId) return;

    // Join conversation room
    socketInstance.emit('conversation:join', { conversationId });

    const handlePresenceUpdate = (data: { conversationId: string; onlineUsers: string[] }) => {
      if (data.conversationId === conversationId) {
        setOnlineUsers(data.onlineUsers);
      }
    };

    socketInstance.on('conversation:presence', handlePresenceUpdate);

    return () => {
      // Leave conversation room
      socketInstance.emit('conversation:leave', { conversationId });
      socketInstance.off('conversation:presence', handlePresenceUpdate);
    };
  }, [socketInstance, conversationId]);

  return {
    onlineUsers,
    isUserOnline: (userId: string) => onlineUsers.includes(userId),
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default useSocket;
