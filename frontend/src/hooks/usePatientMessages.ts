import { useState, useEffect, useCallback, useRef } from 'react';
import { usePatientAuth } from './usePatientAuth';

// Types for messaging
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface Conversation {
  id: string;
  pharmacistId: string;
  pharmacistName: string;
  pharmacistAvatar?: string;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

// Hook return type
interface UsePatientMessagesReturn {
  conversations: Conversation[] | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (conversationId: string, content: string, attachments?: File[]) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  refreshConversations: () => Promise<void>;
  isConnected: boolean;
  typingUsers: string[];
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

// API Response types
interface ConversationsResponse {
  success: boolean;
  data?: {
    conversations: Conversation[];
    messages: Message[];
  };
  message?: string;
  error?: {
    message: string;
  };
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    message: Message;
  };
  message?: string;
  error?: {
    message: string;
  };
}

// WebSocket message types
interface WebSocketMessage {
  type: 'message' | 'typing_start' | 'typing_stop' | 'user_online' | 'user_offline' | 'message_read';
  data: any;
}

// Patient Messages API Service
class PatientMessagesService {
  private static baseUrl = '/api/patient-portal/messages';

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('patient_auth_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async getConversations(patientId: string): Promise<ConversationsResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockConversations: Conversation[] = [
      {
        id: 'conv_1',
        pharmacistId: 'pharm_1',
        pharmacistName: 'Dr. Sarah Johnson',
        pharmacistAvatar: null,
        lastMessage: {
          content: 'How are you feeling today? I wanted to check in on your medication routine.',
          timestamp: '2024-03-22T10:00:00.000Z',
          senderId: 'pharm_1',
          isRead: false
        },
        unreadCount: 2,
        status: 'active',
        createdAt: '2024-03-20T09:00:00.000Z'
      },
      {
        id: 'conv_2',
        pharmacistId: 'pharm_2',
        pharmacistName: 'Dr. Michael Brown',
        pharmacistAvatar: null,
        lastMessage: {
          content: 'Your lab results look good. Keep up the great work with your medication adherence!',
          timestamp: '2024-03-21T15:30:00.000Z',
          senderId: 'pharm_2',
          isRead: true
        },
        unreadCount: 0,
        status: 'active',
        createdAt: '2024-03-19T14:00:00.000Z'
      },
      {
        id: 'conv_3',
        pharmacistId: 'pharm_3',
        pharmacistName: 'Dr. Emily Davis',
        pharmacistAvatar: null,
        lastMessage: {
          content: 'Thank you for the update. I\'ll review your vitals and get back to you.',
          timestamp: '2024-03-20T11:45:00.000Z',
          senderId: 'pharm_3',
          isRead: true
        },
        unreadCount: 0,
        status: 'active',
        createdAt: '2024-03-18T16:00:00.000Z'
      }
    ];

    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'pharm_1',
        senderName: 'Dr. Sarah Johnson',
        content: 'Hello! How are you feeling today? I wanted to check in on your medication routine.',
        timestamp: '2024-03-22T10:00:00.000Z',
        isRead: false,
        attachments: []
      },
      {
        id: 'msg_2',
        conversationId: 'conv_1',
        senderId: patientId,
        senderName: 'John Doe',
        content: 'Hi Dr. Johnson! I am feeling much better, thank you for asking. I\'ve been taking my medications as prescribed.',
        timestamp: '2024-03-22T10:05:00.000Z',
        isRead: true,
        attachments: []
      },
      {
        id: 'msg_3',
        conversationId: 'conv_1',
        senderId: 'pharm_1',
        senderName: 'Dr. Sarah Johnson',
        content: 'That\'s wonderful to hear! I have your latest lab results here. Everything looks great.',
        timestamp: '2024-03-22T10:10:00.000Z',
        isRead: false,
        attachments: [
          {
            id: 'att_1',
            filename: 'lab-results-march-2024.pdf',
            url: '/files/lab-results-march-2024.pdf',
            type: 'application/pdf',
            size: 1024000
          }
        ]
      },
      {
        id: 'msg_4',
        conversationId: 'conv_2',
        senderId: 'pharm_2',
        senderName: 'Dr. Michael Brown',
        content: 'Your lab results look good. Keep up the great work with your medication adherence!',
        timestamp: '2024-03-21T15:30:00.000Z',
        isRead: true,
        attachments: []
      },
      {
        id: 'msg_5',
        conversationId: 'conv_2',
        senderId: patientId,
        senderName: 'John Doe',
        content: 'Thank you Dr. Brown! I really appreciate your guidance.',
        timestamp: '2024-03-21T15:35:00.000Z',
        isRead: true,
        attachments: []
      },
      {
        id: 'msg_6',
        conversationId: 'conv_3',
        senderId: patientId,
        senderName: 'John Doe',
        content: 'Hi Dr. Davis, I wanted to update you on my blood pressure readings from this week.',
        timestamp: '2024-03-20T11:30:00.000Z',
        isRead: true,
        attachments: [
          {
            id: 'att_2',
            filename: 'bp-readings-week12.jpg',
            url: '/files/bp-readings-week12.jpg',
            type: 'image/jpeg',
            size: 512000
          }
        ]
      },
      {
        id: 'msg_7',
        conversationId: 'conv_3',
        senderId: 'pharm_3',
        senderName: 'Dr. Emily Davis',
        content: 'Thank you for the update. I\'ll review your vitals and get back to you.',
        timestamp: '2024-03-20T11:45:00.000Z',
        isRead: true,
        attachments: []
      }
    ];

    return {
      success: true,
      data: {
        conversations: mockConversations,
        messages: mockMessages
      },
      message: 'Conversations retrieved successfully'
    };
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    attachments?: File[]
  ): Promise<SendMessageResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate file upload if attachments exist
    const uploadedAttachments = attachments?.map((file, index) => ({
      id: `att_${Date.now()}_${index}`,
      filename: file.name,
      url: `/files/${file.name}`,
      type: file.type,
      size: file.size
    })) || [];

    const mockMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: 'patient_123', // This would come from auth context
      senderName: 'John Doe',
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachments: uploadedAttachments
    };

    return {
      success: true,
      data: { message: mockMessage },
      message: 'Message sent successfully'
    };
  }

  static async markAsRead(conversationId: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// WebSocket Manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];

  constructor(private patientId: string, private token: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would be wss://your-domain/ws
        // For now, we'll simulate the connection
        this.simulateConnection();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private simulateConnection() {
    // Simulate WebSocket connection
    setTimeout(() => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      // Simulate receiving messages periodically
      this.simulateIncomingMessages();
    }, 1000);
  }

  private simulateIncomingMessages() {
    // Simulate periodic typing indicators and messages
    setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance every interval
        const message: WebSocketMessage = {
          type: 'typing_start',
          data: {
            userId: 'pharm_1',
            conversationId: 'conv_1'
          }
        };
        this.handleMessage(message);

        // Stop typing after 3 seconds
        setTimeout(() => {
          const stopMessage: WebSocketMessage = {
            type: 'typing_stop',
            data: {
              userId: 'pharm_1',
              conversationId: 'conv_1'
            }
          };
          this.handleMessage(stopMessage);
        }, 3000);
      }
    }, 5000);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // In real implementation, send ping to server
      // this.send({ type: 'ping' });
    }, 30000);
  }

  private handleMessage(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  onMessage(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
  }

  send(message: any) {
    // In real implementation, send through WebSocket
    // this.ws?.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    // In real implementation: return this.ws?.readyState === WebSocket.OPEN;
    return true; // Simulate always connected for now
  }
}

export const usePatientMessages = (patientId?: string): UsePatientMessagesReturn => {
  const { user, isAuthenticated } = usePatientAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const wsManager = useRef<WebSocketManager | null>(null);
  const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user || !patientId) {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('patient_auth_token');
    if (!token) return;

    wsManager.current = new WebSocketManager(patientId, token);

    wsManager.current.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        setError('Failed to connect to messaging service');
        setIsConnected(false);
      });

    // Set up message handlers
    wsManager.current.onMessage((message: WebSocketMessage) => {
      switch (message.type) {
        case 'message':
          setMessages(prev => [...prev, message.data]);
          // Update conversation last message
          setConversations(prev => prev?.map(conv => 
            conv.id === message.data.conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    content: message.data.content,
                    timestamp: message.data.timestamp,
                    senderId: message.data.senderId,
                    isRead: false
                  },
                  unreadCount: message.data.senderId !== patientId ? conv.unreadCount + 1 : conv.unreadCount
                }
              : conv
          ) || null);
          break;

        case 'typing_start':
          setTypingUsers(prev => {
            if (!prev.includes(message.data.userId)) {
              return [...prev, message.data.userId];
            }
            return prev;
          });
          break;

        case 'typing_stop':
          setTypingUsers(prev => prev.filter(userId => userId !== message.data.userId));
          break;

        case 'message_read':
          setMessages(prev => prev.map(msg => 
            msg.conversationId === message.data.conversationId && msg.senderId === patientId
              ? { ...msg, isRead: true }
              : msg
          ));
          break;

        default:
          break;
      }
    });

    return () => {
      wsManager.current?.disconnect();
      wsManager.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user, patientId]);

  // Load conversations and messages
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user || !patientId) {
      setConversations(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PatientMessagesService.getConversations(patientId);
      if (response.success && response.data) {
        setConversations(response.data.conversations);
        setMessages(response.data.messages);
      } else {
        throw new Error(response.message || 'Failed to load conversations');
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, patientId]);

  // Load conversations on mount and when dependencies change
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Send message function
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments?: File[]
  ) => {
    if (!isAuthenticated || !user || !patientId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await PatientMessagesService.sendMessage(conversationId, content, attachments);
      if (response.success && response.data) {
        const newMessage = response.data.message;
        
        // Add message to local state
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation last message
        setConversations(prev => prev?.map(conv => 
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: newMessage.content,
                  timestamp: newMessage.timestamp,
                  senderId: newMessage.senderId,
                  isRead: false
                }
              }
            : conv
        ) || null);

        // Send through WebSocket for real-time updates
        wsManager.current?.send({
          type: 'message',
          data: newMessage
        });
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }, [isAuthenticated, user, patientId]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string) => {
    if (!isAuthenticated || !user) return;

    // Update local state immediately
    setMessages(prev => prev.map(msg => 
      msg.conversationId === conversationId && msg.senderId !== patientId
        ? { ...msg, isRead: true }
        : msg
    ));

    setConversations(prev => prev?.map(conv => 
      conv.id === conversationId
        ? { ...conv, unreadCount: 0 }
        : conv
    ) || null);

    // Send to server
    PatientMessagesService.markAsRead(conversationId).catch(error => {
      console.error('Failed to mark messages as read:', error);
    });

    // Send through WebSocket
    wsManager.current?.send({
      type: 'mark_read',
      data: { conversationId, userId: patientId }
    });
  }, [isAuthenticated, user, patientId]);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Typing indicators
  const startTyping = useCallback((conversationId: string) => {
    if (!wsManager.current || !patientId) return;

    wsManager.current.send({
      type: 'typing_start',
      data: { conversationId, userId: patientId }
    });

    // Clear existing timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId]);
    }

    // Auto-stop typing after 3 seconds
    typingTimeouts.current[conversationId] = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [patientId]);

  const stopTyping = useCallback((conversationId: string) => {
    if (!wsManager.current || !patientId) return;

    wsManager.current.send({
      type: 'typing_stop',
      data: { conversationId, userId: patientId }
    });

    // Clear timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId]);
      delete typingTimeouts.current[conversationId];
    }
  }, [patientId]);

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refreshConversations,
    isConnected,
    typingUsers,
    startTyping,
    stopTyping
  };
};

export default usePatientMessages;