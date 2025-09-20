import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import {
    Conversation,
    Message,
    CommunicationNotification,
    ConversationFilters,
    MessageFilters,
    SendMessageData,
    CreateConversationData,
    LoadingState,
    ErrorState,
} from './types';

interface CommunicationState {
    // Conversations
    conversations: Conversation[];
    activeConversation: Conversation | null;
    conversationLoading: boolean;

    // Messages
    messages: Record<string, Message[]>; // conversationId -> messages
    messageLoading: boolean;
    typingUsers: Record<string, string[]>; // conversationId -> userIds

    // Notifications
    notifications: CommunicationNotification[];
    unreadCount: number;

    // UI State
    sidebarOpen: boolean;
    selectedThread: string | null;
    searchQuery: string;

    // Filters and Pagination
    conversationFilters: ConversationFilters;
    messageFilters: Record<string, MessageFilters>; // conversationId -> filters
    conversationPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    messagePagination: Record<string, {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasMore: boolean;
    }>; // conversationId -> pagination

    // Loading and Error States
    loading: LoadingState;
    errors: ErrorState;

    // Actions - Conversation Management
    setActiveConversation: (conversation: Conversation | null) => void;
    createConversation: (data: CreateConversationData) => Promise<Conversation | null>;
    fetchConversations: (filters?: ConversationFilters) => Promise<void>;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;
    deleteConversation: (id: string) => Promise<boolean>;
    addParticipant: (conversationId: string, userId: string, role: string) => Promise<boolean>;
    removeParticipant: (conversationId: string, userId: string) => Promise<boolean>;
    archiveConversation: (conversationId: string) => Promise<boolean>;
    resolveConversation: (conversationId: string) => Promise<boolean>;

    // Actions - Message Management
    sendMessage: (data: SendMessageData) => Promise<Message | null>;
    fetchMessages: (conversationId: string, filters?: MessageFilters) => Promise<void>;
    loadMoreMessages: (conversationId: string) => Promise<void>;
    addMessage: (conversationId: string, message: Message) => void;
    updateMessage: (messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (messageId: string) => Promise<boolean>;
    markMessageAsRead: (messageId: string) => Promise<void>;
    markConversationAsRead: (conversationId: string) => Promise<void>;
    editMessage: (messageId: string, newContent: string) => Promise<boolean>;
    addReaction: (messageId: string, emoji: string) => Promise<boolean>;
    removeReaction: (messageId: string, emoji: string) => Promise<boolean>;

    // Actions - File Management
    uploadFiles: (conversationId: string, files: File[]) => Promise<any[]>;
    downloadFile: (fileId: string) => Promise<void>;
    deleteFile: (fileId: string) => Promise<boolean>;
    getFileMetadata: (fileId: string) => Promise<any>;
    listConversationFiles: (conversationId: string, filters?: any) => Promise<any[]>;

    // Actions - Real-time Updates
    setTypingUsers: (conversationId: string, userIds: string[]) => void;
    addTypingUser: (conversationId: string, userId: string) => void;
    removeTypingUser: (conversationId: string, userId: string) => void;
    handleSocketMessage: (message: Message) => void;
    handleSocketConversationUpdate: (conversation: Conversation) => void;
    handleSocketUserTyping: (conversationId: string, userId: string) => void;
    handleSocketUserStoppedTyping: (conversationId: string, userId: string) => void;

    // Actions - Notification Management
    addNotification: (notification: CommunicationNotification) => void;
    markNotificationAsRead: (notificationId: string) => void;
    markAllNotificationsAsRead: () => void;
    removeNotification: (notificationId: string) => void;
    fetchNotifications: () => Promise<void>;

    // Actions - Search and Filters
    setConversationFilters: (filters: Partial<ConversationFilters>) => void;
    setMessageFilters: (conversationId: string, filters: Partial<MessageFilters>) => void;
    clearConversationFilters: () => void;
    clearMessageFilters: (conversationId: string) => void;
    searchConversations: (searchTerm: string) => void;
    searchMessages: (conversationId: string, searchTerm: string) => void;

    // Actions - UI State
    setSidebarOpen: (open: boolean) => void;
    setSelectedThread: (threadId: string | null) => void;
    setSearchQuery: (query: string) => void;

    // Actions - Utility
    clearErrors: () => void;
    setLoading: (key: string, loading: boolean) => void;
    setError: (key: string, error: string | null) => void;
    resetStore: () => void;

    // Actions - Optimistic Updates
    optimisticSendMessage: (conversationId: string, tempMessage: Partial<Message>) => string;
    confirmOptimisticMessage: (tempId: string, confirmedMessage: Message) => void;
    rejectOptimisticMessage: (tempId: string, error: string) => void;
}

export const useCommunicationStore = create<CommunicationState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                // Initial state
                conversations: [],
                activeConversation: null,
                conversationLoading: false,
                messages: {},
                messageLoading: false,
                typingUsers: {},
                notifications: [],
                unreadCount: 0,
                sidebarOpen: true,
                selectedThread: null,
                searchQuery: '',
                conversationFilters: {
                    search: '',
                    sortBy: 'lastMessageAt',
                    sortOrder: 'desc',
                    page: 1,
                    limit: 20,
                },
                messageFilters: {},
                conversationPagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    pages: 0,
                },
                messagePagination: {},
                loading: {},
                errors: {},

                // Conversation Management Actions
                setActiveConversation: (conversation) => {
                    set({ activeConversation: conversation });
                },

                createConversation: async (data) => {
                    const { setLoading, setError } = get();
                    setLoading('createConversation', true);
                    setError('createConversation', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch('/api/conversations', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: JSON.stringify(data),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to create conversation');
                        }

                        const result = await response.json();
                        const newConversation = result.data;

                        // Add to conversations list
                        set((state) => ({
                            conversations: [newConversation, ...state.conversations],
                            conversationPagination: {
                                ...state.conversationPagination,
                                total: state.conversationPagination.total + 1,
                            },
                        }));

                        return newConversation;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('createConversation', errorMessage);
                        return null;
                    } finally {
                        setLoading('createConversation', false);
                    }
                },

                fetchConversations: async (filters) => {
                    const { setLoading, setError } = get();
                    setLoading('fetchConversations', true);
                    setError('fetchConversations', null);

                    try {
                        const currentFilters = filters || get().conversationFilters;
                        const queryParams = new URLSearchParams();

                        Object.entries(currentFilters).forEach(([key, value]) => {
                            if (value !== undefined && value !== null && value !== '') {
                                queryParams.append(key, value.toString());
                            }
                        });

                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations?${queryParams}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch conversations');
                        }

                        const result = await response.json();

                        set({
                            conversations: result.data || [],
                            conversationPagination: {
                                page: result.pagination?.page || currentFilters.page || 1,
                                limit: result.pagination?.limit || currentFilters.limit || 20,
                                total: result.pagination?.total || 0,
                                pages: result.pagination?.pages || 0,
                            },
                        });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('fetchConversations', errorMessage);
                    } finally {
                        setLoading('fetchConversations', false);
                    }
                },

                updateConversation: (id, updates) => {
                    set((state) => ({
                        conversations: state.conversations.map((conv) =>
                            conv._id === id ? { ...conv, ...updates } : conv
                        ),
                        activeConversation:
                            state.activeConversation && state.activeConversation._id === id
                                ? { ...state.activeConversation, ...updates }
                                : state.activeConversation,
                    }));
                },

                deleteConversation: async (id) => {
                    const { setLoading, setError } = get();
                    setLoading('deleteConversation', true);
                    setError('deleteConversation', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to delete conversation');
                        }

                        // Remove from state
                        set((state) => ({
                            conversations: state.conversations.filter((conv) => conv._id !== id),
                            activeConversation:
                                state.activeConversation && state.activeConversation._id === id
                                    ? null
                                    : state.activeConversation,
                            messages: {
                                ...state.messages,
                                [id]: undefined,
                            },
                            messagePagination: {
                                ...state.messagePagination,
                                [id]: undefined,
                            },
                        }));

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('deleteConversation', errorMessage);
                        return false;
                    } finally {
                        setLoading('deleteConversation', false);
                    }
                },

                addParticipant: async (conversationId, userId, role) => {
                    const { setLoading, setError } = get();
                    setLoading('addParticipant', true);
                    setError('addParticipant', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${conversationId}/participants`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: JSON.stringify({ userId, role }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to add participant');
                        }

                        const result = await response.json();
                        get().updateConversation(conversationId, result.data);

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('addParticipant', errorMessage);
                        return false;
                    } finally {
                        setLoading('addParticipant', false);
                    }
                },

                removeParticipant: async (conversationId, userId) => {
                    const { setLoading, setError } = get();
                    setLoading('removeParticipant', true);
                    setError('removeParticipant', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${conversationId}/participants/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to remove participant');
                        }

                        const result = await response.json();
                        get().updateConversation(conversationId, result.data);

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('removeParticipant', errorMessage);
                        return false;
                    } finally {
                        setLoading('removeParticipant', false);
                    }
                },

                archiveConversation: async (conversationId) => {
                    const { setLoading, setError } = get();
                    setLoading('archiveConversation', true);
                    setError('archiveConversation', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${conversationId}/archive`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to archive conversation');
                        }

                        get().updateConversation(conversationId, { status: 'archived' });
                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('archiveConversation', errorMessage);
                        return false;
                    } finally {
                        setLoading('archiveConversation', false);
                    }
                },

                resolveConversation: async (conversationId) => {
                    const { setLoading, setError } = get();
                    setLoading('resolveConversation', true);
                    setError('resolveConversation', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${conversationId}/resolve`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to resolve conversation');
                        }

                        get().updateConversation(conversationId, { status: 'resolved' });
                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('resolveConversation', errorMessage);
                        return false;
                    } finally {
                        setLoading('resolveConversation', false);
                    }
                },

                // Message Management Actions
                sendMessage: async (data) => {
                    const { setLoading, setError } = get();
                    setLoading('sendMessage', true);
                    setError('sendMessage', null);

                    try {
                        const formData = new FormData();
                        formData.append('conversationId', data.conversationId);
                        formData.append('content', JSON.stringify({
                            text: data.content.text,
                            type: data.content.type,
                        }));

                        if (data.threadId) formData.append('threadId', data.threadId);
                        if (data.parentMessageId) formData.append('parentMessageId', data.parentMessageId);
                        if (data.mentions) formData.append('mentions', JSON.stringify(data.mentions));
                        if (data.priority) formData.append('priority', data.priority);

                        // Add file attachments
                        if (data.content.attachments) {
                            data.content.attachments.forEach((file, index) => {
                                formData.append(`attachments`, file);
                            });
                        }

                        // TODO: Replace with actual API call
                        const response = await fetch('/api/messages', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: formData,
                        });

                        if (!response.ok) {
                            throw new Error('Failed to send message');
                        }

                        const result = await response.json();
                        const newMessage = result.data;

                        // Add message to conversation
                        get().addMessage(data.conversationId, newMessage);

                        // Update conversation's lastMessageAt
                        get().updateConversation(data.conversationId, {
                            lastMessageAt: newMessage.createdAt,
                        });

                        return newMessage;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('sendMessage', errorMessage);
                        return null;
                    } finally {
                        setLoading('sendMessage', false);
                    }
                },

                fetchMessages: async (conversationId, filters) => {
                    const { setLoading, setError } = get();
                    setLoading('fetchMessages', true);
                    setError('fetchMessages', null);

                    try {
                        const currentFilters = filters || get().messageFilters[conversationId] || {
                            sortBy: 'createdAt',
                            sortOrder: 'desc',
                            page: 1,
                            limit: 50,
                        };

                        const queryParams = new URLSearchParams();
                        Object.entries(currentFilters).forEach(([key, value]) => {
                            if (value !== undefined && value !== null && value !== '') {
                                queryParams.append(key, value.toString());
                            }
                        });

                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/conversations/${conversationId}/messages?${queryParams}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch messages');
                        }

                        const result = await response.json();

                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [conversationId]: result.data || [],
                            },
                            messagePagination: {
                                ...state.messagePagination,
                                [conversationId]: {
                                    page: result.pagination?.page || currentFilters.page || 1,
                                    limit: result.pagination?.limit || currentFilters.limit || 50,
                                    total: result.pagination?.total || 0,
                                    pages: result.pagination?.pages || 0,
                                    hasMore: result.pagination?.hasMore || false,
                                },
                            },
                        }));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('fetchMessages', errorMessage);
                    } finally {
                        setLoading('fetchMessages', false);
                    }
                },

                loadMoreMessages: async (conversationId) => {
                    const { messagePagination, messageFilters } = get();
                    const currentPagination = messagePagination[conversationId];

                    if (!currentPagination || !currentPagination.hasMore) {
                        return;
                    }

                    const nextPage = currentPagination.page + 1;
                    const filters = {
                        ...messageFilters[conversationId],
                        page: nextPage,
                    };

                    await get().fetchMessages(conversationId, filters);
                },

                addMessage: (conversationId, message) => {
                    set((state) => {
                        const existingMessages = state.messages[conversationId] || [];
                        const messageExists = existingMessages.some(m => m._id === message._id);

                        if (messageExists) {
                            return state; // Don't add duplicate messages
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [conversationId]: [...existingMessages, message],
                            },
                        };
                    });
                },

                updateMessage: (messageId, updates) => {
                    set((state) => {
                        const newMessages = { ...state.messages };

                        Object.keys(newMessages).forEach((conversationId) => {
                            newMessages[conversationId] = newMessages[conversationId].map((message) =>
                                message._id === messageId ? { ...message, ...updates } : message
                            );
                        });

                        return { messages: newMessages };
                    });
                },

                deleteMessage: async (messageId) => {
                    const { setLoading, setError } = get();
                    setLoading('deleteMessage', true);
                    setError('deleteMessage', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/messages/${messageId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to delete message');
                        }

                        // Mark message as deleted in state
                        get().updateMessage(messageId, {
                            isDeleted: true,
                            deletedAt: new Date().toISOString()
                        });

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('deleteMessage', errorMessage);
                        return false;
                    } finally {
                        setLoading('deleteMessage', false);
                    }
                },

                markMessageAsRead: async (messageId) => {
                    try {
                        // TODO: Replace with actual API call
                        await fetch(`/api/messages/${messageId}/read`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        get().updateMessage(messageId, { status: 'read' });
                    } catch (error) {
                        console.error('Failed to mark message as read:', error);
                    }
                },

                markConversationAsRead: async (conversationId) => {
                    try {
                        // TODO: Replace with actual API call
                        await fetch(`/api/conversations/${conversationId}/read`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        // Mark all messages in conversation as read
                        const messages = get().messages[conversationId] || [];
                        messages.forEach((message) => {
                            if (message.status !== 'read') {
                                get().updateMessage(message._id, { status: 'read' });
                            }
                        });
                    } catch (error) {
                        console.error('Failed to mark conversation as read:', error);
                    }
                },

                editMessage: async (messageId, newContent) => {
                    const { setLoading, setError } = get();
                    setLoading('editMessage', true);
                    setError('editMessage', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/messages/${messageId}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: JSON.stringify({ content: { text: newContent } }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to edit message');
                        }

                        const result = await response.json();
                        get().updateMessage(messageId, result.data);

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('editMessage', errorMessage);
                        return false;
                    } finally {
                        setLoading('editMessage', false);
                    }
                },

                addReaction: async (messageId, emoji) => {
                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/messages/${messageId}/reactions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: JSON.stringify({ emoji }),
                        });

                        if (!response.ok) {
                            throw new Error('Failed to add reaction');
                        }

                        const result = await response.json();
                        get().updateMessage(messageId, { reactions: result.data.reactions });

                        return true;
                    } catch (error) {
                        console.error('Failed to add reaction:', error);
                        return false;
                    }
                },

                removeReaction: async (messageId, emoji) => {
                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch(`/api/messages/${messageId}/reactions/${emoji}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to remove reaction');
                        }

                        const result = await response.json();
                        get().updateMessage(messageId, { reactions: result.data.reactions });

                        return true;
                    } catch (error) {
                        console.error('Failed to remove reaction:', error);
                        return false;
                    }
                },

                // Real-time Update Actions
                setTypingUsers: (conversationId, userIds) => {
                    set((state) => ({
                        typingUsers: {
                            ...state.typingUsers,
                            [conversationId]: userIds,
                        },
                    }));
                },

                addTypingUser: (conversationId, userId) => {
                    set((state) => {
                        const currentTyping = state.typingUsers[conversationId] || [];
                        if (currentTyping.includes(userId)) {
                            return state;
                        }

                        return {
                            typingUsers: {
                                ...state.typingUsers,
                                [conversationId]: [...currentTyping, userId],
                            },
                        };
                    });
                },

                removeTypingUser: (conversationId, userId) => {
                    set((state) => {
                        const currentTyping = state.typingUsers[conversationId] || [];

                        return {
                            typingUsers: {
                                ...state.typingUsers,
                                [conversationId]: currentTyping.filter(id => id !== userId),
                            },
                        };
                    });
                },

                handleSocketMessage: (message) => {
                    get().addMessage(message.conversationId, message);

                    // Update conversation's lastMessageAt
                    get().updateConversation(message.conversationId, {
                        lastMessageAt: message.createdAt,
                    });
                },

                handleSocketConversationUpdate: (conversation) => {
                    get().updateConversation(conversation._id, conversation);
                },

                handleSocketUserTyping: (conversationId, userId) => {
                    get().addTypingUser(conversationId, userId);
                },

                handleSocketUserStoppedTyping: (conversationId, userId) => {
                    get().removeTypingUser(conversationId, userId);
                },

                // Notification Management Actions
                addNotification: (notification) => {
                    set((state) => ({
                        notifications: [notification, ...state.notifications],
                        unreadCount: notification.status === 'unread'
                            ? state.unreadCount + 1
                            : state.unreadCount,
                    }));
                },

                markNotificationAsRead: (notificationId) => {
                    set((state) => {
                        const notification = state.notifications.find(n => n._id === notificationId);
                        const wasUnread = notification && notification.status === 'unread';

                        return {
                            notifications: state.notifications.map((n) =>
                                n._id === notificationId ? { ...n, status: 'read' as const } : n
                            ),
                            unreadCount: wasUnread
                                ? Math.max(0, state.unreadCount - 1)
                                : state.unreadCount,
                        };
                    });
                },

                markAllNotificationsAsRead: () => {
                    set((state) => ({
                        notifications: state.notifications.map((n) => ({ ...n, status: 'read' as const })),
                        unreadCount: 0,
                    }));
                },

                removeNotification: (notificationId) => {
                    set((state) => {
                        const notification = state.notifications.find(n => n._id === notificationId);
                        const wasUnread = notification && notification.status === 'unread';

                        return {
                            notifications: state.notifications.filter((n) => n._id !== notificationId),
                            unreadCount: wasUnread
                                ? Math.max(0, state.unreadCount - 1)
                                : state.unreadCount,
                        };
                    });
                },

                fetchNotifications: async () => {
                    const { setLoading, setError } = get();
                    setLoading('fetchNotifications', true);
                    setError('fetchNotifications', null);

                    try {
                        // TODO: Replace with actual API call
                        const response = await fetch('/api/notifications', {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch notifications');
                        }

                        const result = await response.json();
                        const notifications = result.data || [];
                        const unreadCount = notifications.filter((n: CommunicationNotification) => n.status === 'unread').length;

                        set({
                            notifications,
                            unreadCount,
                        });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                        setError('fetchNotifications', errorMessage);
                    } finally {
                        setLoading('fetchNotifications', false);
                    }
                },

                // Search and Filter Actions
                setConversationFilters: (filters) => {
                    set((state) => ({
                        conversationFilters: { ...state.conversationFilters, ...filters },
                    }));
                },

                setMessageFilters: (conversationId, filters) => {
                    set((state) => ({
                        messageFilters: {
                            ...state.messageFilters,
                            [conversationId]: {
                                ...state.messageFilters[conversationId],
                                ...filters,
                            },
                        },
                    }));
                },

                clearConversationFilters: () => {
                    set({
                        conversationFilters: {
                            search: '',
                            sortBy: 'lastMessageAt',
                            sortOrder: 'desc',
                            page: 1,
                            limit: 20,
                        },
                    });
                },

                clearMessageFilters: (conversationId) => {
                    set((state) => ({
                        messageFilters: {
                            ...state.messageFilters,
                            [conversationId]: {
                                sortBy: 'createdAt',
                                sortOrder: 'desc',
                                page: 1,
                                limit: 50,
                            },
                        },
                    }));
                },

                searchConversations: (searchTerm) => {
                    get().setConversationFilters({ search: searchTerm, page: 1 });
                    get().fetchConversations();
                },

                searchMessages: (conversationId, searchTerm) => {
                    get().setMessageFilters(conversationId, { search: searchTerm, page: 1 });
                    get().fetchMessages(conversationId);
                },

                // UI State Actions
                setSidebarOpen: (open) => set({ sidebarOpen: open }),
                setSelectedThread: (threadId) => set({ selectedThread: threadId }),
                setSearchQuery: (query) => set({ searchQuery: query }),

                // Utility Actions
                clearErrors: () => set({ errors: {} }),

                setLoading: (key, loading) =>
                    set((state) => ({
                        loading: { ...state.loading, [key]: loading },
                    })),

                setError: (key, error) =>
                    set((state) => ({
                        errors: { ...state.errors, [key]: error },
                    })),

                resetStore: () => {
                    set({
                        conversations: [],
                        activeConversation: null,
                        conversationLoading: false,
                        messages: {},
                        messageLoading: false,
                        typingUsers: {},
                        notifications: [],
                        unreadCount: 0,
                        sidebarOpen: true,
                        selectedThread: null,
                        searchQuery: '',
                        conversationFilters: {
                            search: '',
                            sortBy: 'lastMessageAt',
                            sortOrder: 'desc',
                            page: 1,
                            limit: 20,
                        },
                        messageFilters: {},
                        conversationPagination: {
                            page: 1,
                            limit: 20,
                            total: 0,
                            pages: 0,
                        },
                        messagePagination: {},
                        loading: {},
                        errors: {},
                    });
                },

                // Optimistic Update Actions
                optimisticSendMessage: (conversationId, tempMessage) => {
                    const tempId = `temp_${Date.now()}_${Math.random()}`;
                    const optimisticMessage: Message = {
                        _id: tempId,
                        conversationId,
                        senderId: tempMessage.senderId || '',
                        content: tempMessage.content || { type: 'text', text: '' },
                        mentions: tempMessage.mentions || [],
                        reactions: [],
                        status: 'sent',
                        priority: tempMessage.priority || 'normal',
                        readBy: [],
                        editHistory: [],
                        isDeleted: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        threadId: tempMessage.threadId,
                        parentMessageId: tempMessage.parentMessageId,
                    };

                    get().addMessage(conversationId, optimisticMessage);
                    return tempId;
                },

                confirmOptimisticMessage: (tempId, confirmedMessage) => {
                    set((state) => {
                        const newMessages = { ...state.messages };

                        Object.keys(newMessages).forEach((conversationId) => {
                            newMessages[conversationId] = newMessages[conversationId].map((message) =>
                                message._id === tempId ? confirmedMessage : message
                            );
                        });

                        return { messages: newMessages };
                    });
                },

                rejectOptimisticMessage: (tempId, error) => {
                    // Mark the optimistic message as failed
                    get().updateMessage(tempId, { status: 'failed' });
                    get().setError('sendMessage', error);
                },

                // File Management Actions
                uploadFiles: async (conversationId, files) => {
                    const { setLoading, setError } = get();
                    setLoading('uploadFiles', true);
                    setError('uploadFiles', null);

                    try {
                        const formData = new FormData();
                        formData.append('conversationId', conversationId);

                        files.forEach((file) => {
                            formData.append('files', file);
                        });

                        const response = await fetch('/api/communication/upload', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: formData,
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Upload failed');
                        }

                        const result = await response.json();
                        return result.data.uploadedFiles || [];
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'File upload failed';
                        setError('uploadFiles', errorMessage);
                        throw error;
                    } finally {
                        setLoading('uploadFiles', false);
                    }
                },

                downloadFile: async (fileId) => {
                    const { setLoading, setError } = get();
                    setLoading('downloadFile', true);
                    setError('downloadFile', null);

                    try {
                        const response = await fetch(`/api/communication/files/${fileId}/download`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Download failed');
                        }

                        const result = await response.json();

                        // Create download link
                        const link = document.createElement('a');
                        link.href = result.downloadUrl;
                        link.download = result.fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'File download failed';
                        setError('downloadFile', errorMessage);
                        throw error;
                    } finally {
                        setLoading('downloadFile', false);
                    }
                },

                deleteFile: async (fileId) => {
                    const { setLoading, setError } = get();
                    setLoading('deleteFile', true);
                    setError('deleteFile', null);

                    try {
                        const response = await fetch(`/api/communication/files/${fileId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Delete failed');
                        }

                        return true;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'File deletion failed';
                        setError('deleteFile', errorMessage);
                        return false;
                    } finally {
                        setLoading('deleteFile', false);
                    }
                },

                getFileMetadata: async (fileId) => {
                    const { setLoading, setError } = get();
                    setLoading('getFileMetadata', true);
                    setError('getFileMetadata', null);

                    try {
                        const response = await fetch(`/api/communication/files/${fileId}/metadata`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to get file metadata');
                        }

                        const result = await response.json();
                        return result.file;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Failed to get file metadata';
                        setError('getFileMetadata', errorMessage);
                        throw error;
                    } finally {
                        setLoading('getFileMetadata', false);
                    }
                },

                listConversationFiles: async (conversationId, filters = {}) => {
                    const { setLoading, setError } = get();
                    setLoading('listConversationFiles', true);
                    setError('listConversationFiles', null);

                    try {
                        const queryParams = new URLSearchParams();
                        Object.entries(filters).forEach(([key, value]) => {
                            if (value !== undefined && value !== null && value !== '') {
                                queryParams.append(key, value.toString());
                            }
                        });

                        const response = await fetch(`/api/communication/conversations/${conversationId}/files?${queryParams}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to list files');
                        }

                        const result = await response.json();
                        return result.files || [];
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Failed to list conversation files';
                        setError('listConversationFiles', errorMessage);
                        return [];
                    } finally {
                        setLoading('listConversationFiles', false);
                    }
                },
            }),
            {
                name: 'communication-store',
                partialize: (state) => ({
                    // Only persist UI state and filters, not data
                    sidebarOpen: state.sidebarOpen,
                    conversationFilters: state.conversationFilters,
                    searchQuery: state.searchQuery,
                }),
            }
        )
    )
);

// Utility hooks for easier access to specific communication states

// Conversation hooks
export const useConversations = () =>
    useCommunicationStore((state) => ({
        conversations: state.conversations,
        loading: state.loading.fetchConversations || false,
        error: state.errors.fetchConversations || null,
        pagination: state.conversationPagination,
        filters: state.conversationFilters,
        fetchConversations: state.fetchConversations,
        setFilters: state.setConversationFilters,
        clearFilters: state.clearConversationFilters,
        searchConversations: state.searchConversations,
    }));

export const useActiveConversation = () =>
    useCommunicationStore((state) => ({
        activeConversation: state.activeConversation,
        setActiveConversation: state.setActiveConversation,
        loading: state.conversationLoading,
        updateConversation: state.updateConversation,
        archiveConversation: state.archiveConversation,
        resolveConversation: state.resolveConversation,
    }));

export const useConversationActions = () =>
    useCommunicationStore((state) => ({
        createConversation: state.createConversation,
        deleteConversation: state.deleteConversation,
        addParticipant: state.addParticipant,
        removeParticipant: state.removeParticipant,
        loading: {
            create: state.loading.createConversation || false,
            delete: state.loading.deleteConversation || false,
            addParticipant: state.loading.addParticipant || false,
            removeParticipant: state.loading.removeParticipant || false,
        },
        errors: {
            create: state.errors.createConversation || null,
            delete: state.errors.deleteConversation || null,
            addParticipant: state.errors.addParticipant || null,
            removeParticipant: state.errors.removeParticipant || null,
        },
    }));

// Message hooks
export const useMessages = (conversationId?: string) =>
    useCommunicationStore((state) => ({
        messages: conversationId ? state.messages[conversationId] || [] : [],
        loading: state.loading.fetchMessages || false,
        error: state.errors.fetchMessages || null,
        pagination: conversationId ? state.messagePagination[conversationId] : undefined,
        filters: conversationId ? state.messageFilters[conversationId] : undefined,
        fetchMessages: state.fetchMessages,
        loadMoreMessages: state.loadMoreMessages,
        setFilters: (filters: Partial<MessageFilters>) =>
            conversationId ? state.setMessageFilters(conversationId, filters) : undefined,
        clearFilters: () =>
            conversationId ? state.clearMessageFilters(conversationId) : undefined,
        searchMessages: (searchTerm: string) =>
            conversationId ? state.searchMessages(conversationId, searchTerm) : undefined,
    }));

export const useMessageActions = () =>
    useCommunicationStore((state) => ({
        sendMessage: state.sendMessage,
        deleteMessage: state.deleteMessage,
        editMessage: state.editMessage,
        markMessageAsRead: state.markMessageAsRead,
        markConversationAsRead: state.markConversationAsRead,
        addReaction: state.addReaction,
        removeReaction: state.removeReaction,
        optimisticSendMessage: state.optimisticSendMessage,
        confirmOptimisticMessage: state.confirmOptimisticMessage,
        rejectOptimisticMessage: state.rejectOptimisticMessage,
        loading: {
            send: state.loading.sendMessage || false,
            delete: state.loading.deleteMessage || false,
            edit: state.loading.editMessage || false,
        },
        errors: {
            send: state.errors.sendMessage || null,
            delete: state.errors.deleteMessage || null,
            edit: state.errors.editMessage || null,
        },
    }));

// Real-time hooks
export const useRealTimeUpdates = () =>
    useCommunicationStore((state) => ({
        typingUsers: state.typingUsers,
        setTypingUsers: state.setTypingUsers,
        addTypingUser: state.addTypingUser,
        removeTypingUser: state.removeTypingUser,
        handleSocketMessage: state.handleSocketMessage,
        handleSocketConversationUpdate: state.handleSocketConversationUpdate,
        handleSocketUserTyping: state.handleSocketUserTyping,
        handleSocketUserStoppedTyping: state.handleSocketUserStoppedTyping,
    }));

// Notification hooks
export const useNotifications = () =>
    useCommunicationStore((state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        loading: state.loading.fetchNotifications || false,
        error: state.errors.fetchNotifications || null,
        fetchNotifications: state.fetchNotifications,
        addNotification: state.addNotification,
        markNotificationAsRead: state.markNotificationAsRead,
        markAllNotificationsAsRead: state.markAllNotificationsAsRead,
        removeNotification: state.removeNotification,
    }));

// UI state hooks
export const useCommunicationUI = () =>
    useCommunicationStore((state) => ({
        sidebarOpen: state.sidebarOpen,
        selectedThread: state.selectedThread,
        searchQuery: state.searchQuery,
        setSidebarOpen: state.setSidebarOpen,
        setSelectedThread: state.setSelectedThread,
        setSearchQuery: state.setSearchQuery,
    }));

// Utility hooks
export const useCommunicationUtils = () =>
    useCommunicationStore((state) => ({
        clearErrors: state.clearErrors,
        resetStore: state.resetStore,
        setLoading: state.setLoading,
        setError: state.setError,
        loading: state.loading,
        errors: state.errors,
    }));

// Selector hooks for performance optimization
export const useConversationById = (conversationId: string) =>
    useCommunicationStore((state) =>
        state.conversations.find(conv => conv._id === conversationId)
    );

export const useMessageById = (messageId: string) =>
    useCommunicationStore((state) => {
        for (const messages of Object.values(state.messages)) {
            const message = messages.find(msg => msg._id === messageId);
            if (message) return message;
        }
        return undefined;
    });

export const useUnreadConversationsCount = () =>
    useCommunicationStore((state) => {
        // Calculate unread conversations based on messages
        let unreadCount = 0;
        state.conversations.forEach(conv => {
            const messages = state.messages[conv._id] || [];
            const hasUnreadMessages = messages.some(msg => msg.status !== 'read');
            if (hasUnreadMessages) unreadCount++;
        });
        return unreadCount;
    });

export const useTypingUsersForConversation = (conversationId: string) =>
    useCommunicationStore((state) => state.typingUsers[conversationId] || []);

// File management hooks
export const useFileUpload = () =>
    useCommunicationStore((state) => ({
        uploadFiles: state.uploadFiles,
        loading: state.loading.uploadFiles || false,
        error: state.errors.uploadFiles || null,
    }));

export const useFileActions = () =>
    useCommunicationStore((state) => ({
        downloadFile: state.downloadFile,
        deleteFile: state.deleteFile,
        getFileMetadata: state.getFileMetadata,
        listConversationFiles: state.listConversationFiles,
        loading: {
            download: state.loading.downloadFile || false,
            delete: state.loading.deleteFile || false,
            metadata: state.loading.getFileMetadata || false,
            list: state.loading.listConversationFiles || false,
        },
        errors: {
            download: state.errors.downloadFile || null,
            delete: state.errors.deleteFile || null,
            metadata: state.errors.getFileMetadata || null,
            list: state.errors.listConversationFiles || null,
        },
    }));