import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default useSocket;
