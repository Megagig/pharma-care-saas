import { useEffect, useCallback, useRef, useState } from 'react';
import { socketService, ConnectionStatus, SocketEventHandlers } from '../services/socketService';
import { useCommunicationStore } from '../stores/communicationStore';
import { authService } from '../services/authService';

export interface UseSocketOptions {
    autoConnect?: boolean;
    onConnectionChange?: (status: ConnectionStatus) => void;
    onError?: (error: string) => void;
}

export interface UseSocketReturn {
    connectionStatus: ConnectionStatus;
    isConnected: boolean;
    isAuthenticated: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendMessage: (messageData: any) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    markMessageAsRead: (messageId: string) => void;
    forceReconnect: () => void;
}

/**
 * Custom hook for Socket.IO integration with Zustand store
 * Handles real-time communication events and state synchronization
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
    const { autoConnect = true, onConnectionChange, onError } = options;

    // Store references
    const {
        handleSocketMessage,
        handleSocketConversationUpdate,
        handleSocketUserTyping,
        handleSocketUserStoppedTyping,
        addNotification,
        updateMessage,
    } = useCommunicationStore();

    // Auth state management using cookie-based authentication
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Connection status state
    const connectionStatusRef = useRef<ConnectionStatus>('disconnected');
    const isConnectedRef = useRef(false);

    /**
     * Check authentication status
     */
    const checkAuth = useCallback(async () => {
        try {
            const response = await authService.getCurrentUser();
            const authenticated = response.success && !!response.user;
            setIsAuthenticated(authenticated);
            return authenticated;
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
            return false;
        } finally {
            setAuthChecked(true);
        }
    }, []);

    /**
     * Set up socket event handlers
     */
    const setupSocketHandlers = useCallback(() => {
        const handlers: SocketEventHandlers = {
            onMessageReceived: (message) => {
                handleSocketMessage(message);
            },

            onMessageUpdated: (message) => {
                updateMessage(message._id, message);
            },

            onUserTyping: (conversationId, userId) => {
                handleSocketUserTyping(conversationId, userId);
            },

            onUserStoppedTyping: (conversationId, userId) => {
                handleSocketUserStoppedTyping(conversationId, userId);
            },

            onNotificationReceived: (notification) => {
                addNotification(notification);
            },

            onConversationUpdated: (conversation) => {
                handleSocketConversationUpdate(conversation);
            },

            onParticipantJoined: (conversationId, userId) => {
                // Handle participant joined event
                console.log(`User ${userId} joined conversation ${conversationId}`);
            },

            onParticipantLeft: (conversationId, userId) => {
                // Handle participant left event
                console.log(`User ${userId} left conversation ${conversationId}`);
            },

            onConnectionStatusChange: (status) => {
                connectionStatusRef.current = status;
                isConnectedRef.current = status === 'connected';
                onConnectionChange?.(status);
            },

            onError: (error) => {
                console.error('Socket error:', error);
                onError?.(error);
            },
        };

        socketService.setEventHandlers(handlers);
    }, [
        handleSocketMessage,
        handleSocketConversationUpdate,
        handleSocketUserTyping,
        handleSocketUserStoppedTyping,
        addNotification,
        updateMessage,
        onConnectionChange,
        onError,
    ]);

    /**
     * Connect to socket server
     */
    const connect = useCallback(async () => {
        const authenticated = await checkAuth();
        if (!authenticated) {
            throw new Error('Authentication required for socket connection');
        }

        try {
            await socketService.connect();
        } catch (error) {
            console.error('Failed to connect to socket server:', error);
            throw error;
        }
    }, [checkAuth]);

    /**
     * Disconnect from socket server
     */
    const disconnect = useCallback(() => {
        socketService.disconnect();
    }, []);

    /**
     * Join a conversation room
     */
    const joinConversation = useCallback((conversationId: string) => {
        socketService.joinConversation(conversationId);
    }, []);

    /**
     * Leave a conversation room
     */
    const leaveConversation = useCallback((conversationId: string) => {
        socketService.leaveConversation(conversationId);
    }, []);

    /**
     * Send a message through socket
     */
    const sendMessage = useCallback((messageData: unknown) => {
        socketService.sendMessage(messageData);
    }, []);

    /**
     * Start typing indicator
     */
    const startTyping = useCallback((conversationId: string) => {
        socketService.startTyping(conversationId);
    }, []);

    /**
     * Stop typing indicator
     */
    const stopTyping = useCallback((conversationId: string) => {
        socketService.stopTyping(conversationId);
    }, []);

    /**
     * Mark message as read
     */
    const markMessageAsRead = useCallback((messageId: string) => {
        socketService.markMessageAsRead(messageId);
    }, []);

    /**
     * Force reconnection
     */
    const forceReconnect = useCallback(() => {
        socketService.forceReconnect();
    }, []);

    /**
     * Initialize authentication check
     */
    useEffect(() => {
        checkAuth();

        // Set up periodic auth check (every 5 minutes)
        const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);

        return () => clearInterval(authCheckInterval);
    }, [checkAuth]);

    /**
     * Initialize socket connection and handlers
     */
    useEffect(() => {
        setupSocketHandlers();

        // Auto-connect if enabled and authenticated
        if (autoConnect && isAuthenticated && authChecked) {
            connect().catch((error) => {
                console.error('Auto-connect failed:', error);
            });
        }

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [setupSocketHandlers, autoConnect, isAuthenticated, authChecked, connect, disconnect]);

    /**
     * Disconnect when user logs out
     */
    useEffect(() => {
        if (authChecked && !isAuthenticated) {
            disconnect();
        }
    }, [isAuthenticated, authChecked, disconnect]);

    /**
     * Handle authentication changes
     */
    useEffect(() => {
        if (isAuthenticated && socketService.isConnected()) {
            // Refresh authentication on the socket service
            socketService.refreshAuthentication().catch((error) => {
                console.error('Failed to refresh socket authentication:', error);
            });
        }
    }, [isAuthenticated]);

    return {
        connectionStatus: connectionStatusRef.current,
        isConnected: isConnectedRef.current,
        isAuthenticated,
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markMessageAsRead,
        forceReconnect,
    };
};

/**
 * Hook for connection status monitoring
 */
export const useSocketConnection = () => {
    const connectionStatus = socketService.getConnectionStatus();
    const isConnected = socketService.isConnected();
    const connectionInfo = socketService.getConnectionInfo();

    return {
        connectionStatus,
        isConnected,
        connectionInfo,
    };
};

/**
 * Hook for typing indicators in a specific conversation
 */
export const useTypingIndicator = (conversationId: string) => {
    const { typingUsers } = useCommunicationStore();
    const { startTyping, stopTyping } = useSocket({ autoConnect: false });

    const typingUsersInConversation = typingUsers[conversationId] || [];

    const handleStartTyping = useCallback(() => {
        startTyping(conversationId);
    }, [conversationId, startTyping]);

    const handleStopTyping = useCallback(() => {
        stopTyping(conversationId);
    }, [conversationId, stopTyping]);

    return {
        typingUsers: typingUsersInConversation,
        startTyping: handleStartTyping,
        stopTyping: handleStopTyping,
    };
};

/**
 * Hook for managing conversation presence
 */
export const useConversationPresence = (conversationId?: string) => {
    const { joinConversation, leaveConversation, isConnected } = useSocket({ autoConnect: false });

    useEffect(() => {
        if (conversationId && isConnected) {
            joinConversation(conversationId);

            return () => {
                leaveConversation(conversationId);
            };
        }
    }, [conversationId, isConnected, joinConversation, leaveConversation]);

    return {
        isPresent: isConnected && !!conversationId,
    };
};