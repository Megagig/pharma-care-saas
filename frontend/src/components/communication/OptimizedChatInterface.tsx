  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,

import VirtualizedMessageList from './VirtualizedMessageList';

import MessageInput from './MessageInput';

import ConversationHeader from './ConversationHeader';

import { Spinner, Alert, Separator } from '@/components/ui/button';

interface OptimizedChatInterfaceProps {
  conversationId: string;
  height?: string | number;
  showHeader?: boolean;
  onClose?: () => void;
}
const OptimizedChatInterface: React.FC<OptimizedChatInterfaceProps> = ({ 
  conversationId,
  height = '100%',
  showHeader = true,
  onClose
}) => {
  const { isMobile } = useResponsive();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderMeasurement = useRef(
    communicationPerformance.measureMessageRender(conversationId)
  );
  // Store selectors with memoization
  const {
    activeConversation,
    messages,
    messageLoading,
    errors,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    createThread,
    markConversationAsRead,
    messagePagination,
  } = useCommunicationStore();
  // Memoized conversation messages
  const conversationMessages = useMemo(() => {
    return messages[conversationId] || [];
  }, [messages, conversationId]);
  // Memoized pagination info
  const pagination = useMemo(() => {
    return messagePagination[conversationId];
  }, [messagePagination, conversationId]);
  // Current user ID
  const currentUserId = localStorage.getItem('userId') || '';
  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!conversationId || isInitialized) return;
      renderMeasurement.current.onRenderStart();
      try {
        await performanceMonitor.measureFunction(
          'chat_interface_init',
          async () => {
            await fetchMessages(conversationId);
            setIsInitialized(true);
          },
          { conversationId }
        );
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      } finally {
        renderMeasurement.current.onRenderEnd();
      }
    };
    initializeConversation();
  }, [conversationId, fetchMessages, isInitialized]);
  // Mark conversation as read when messages change
  useEffect(() => {
    if (conversationMessages.length > 0 && isInitialized) {
      const timer = setTimeout(() => {
        markConversationAsRead(conversationId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    conversationMessages.length,
    conversationId,
    markConversationAsRead,
    isInitialized,
  ]);
  // Handle loading more messages
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !pagination?.hasMore) return;
    setLoadingMore(true);
    try {
      await performanceMonitor.measureFunction(
        'load_more_messages',
        async () => {
          await loadMoreMessages(conversationId);
        },
        { conversationId }
      );
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, loadMoreMessages, loadingMore, pagination?.hasMore]);
  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string, attachments?: File[], mentions?: string[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;
      try {
        await performanceMonitor.measureFunction(
          'send_message',
          async () => {
            await sendMessage({ 
              conversationId,
              content: {
                text: content,
                type: 'text',
                attachments: attachments || []}
              },
              mentions,
              priority: 'normal'}
          },
          { conversationId, hasAttachments: (attachments?.length || 0) > 0 }
        );
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [conversationId, sendMessage]
  );
  // Handle message reply
  const handleReply = useCallback((message: Message) => {
    // Focus message input and set reply context
    // This would be implemented based on your MessageInput component
    console.log('Reply to message:', message._id);
  }, []);
  // Handle message edit
  const handleEdit = useCallback(
    async (messageId: string, newContent: string) => {
      try {
        await performanceMonitor.measureFunction(
          'edit_message',
          async () => {
            await editMessage(messageId, newContent);
          },
          { messageId }
        );
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    },
    [editMessage]
  );
  // Handle message delete
  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        await performanceMonitor.measureFunction(
          'delete_message',
          async () => {
            await deleteMessage(messageId);
          },
          { messageId }
        );
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    },
    [deleteMessage]
  );
  // Handle reaction
  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        // Check if user already reacted with this emoji
        const message = conversationMessages.find((m) => m._id === messageId);
        const userReaction = message?.reactions.find(
          (r) => r.userId === currentUserId && r.emoji === emoji
        );
        if (userReaction) {
          await removeReaction(messageId, emoji);
        } else {
          await addReaction(messageId, emoji);
        }
      } catch (error) {
        console.error('Failed to handle reaction:', error);
      }
    },
    [conversationMessages, currentUserId, addReaction, removeReaction]
  );
  // Handle thread creation
  const handleCreateThread = useCallback(
    async (messageId: string) => {
      try {
        await performanceMonitor.measureFunction(
          'create_thread',
          async () => {
            await createThread(messageId);
          },
          { messageId }
        );
      } catch (error) {
        console.error('Failed to create thread:', error);
      }
    },
    [createThread]
  );
  // Handle thread view
  const handleViewThread = useCallback((threadId: string) => {
    // Navigate to thread view
    console.log('View thread:', threadId);
  }, []);
  // Calculate container height
  const containerHeight = useMemo(() => {
    if (typeof height === 'number') return height;
    if (height.includes('px')) return parseInt(height);
    if (height.includes('%')) return '100%';
    return 600; // Default height
  }, [height]);
  // Calculate message list height
  const messageListHeight = useMemo(() => {
    let calculatedHeight =
      typeof containerHeight === 'number' ? containerHeight : 600;
    if (showHeader) calculatedHeight -= 64; // Header height
    calculatedHeight -= 80; // Message input height
    return Math.max(calculatedHeight, 200);
  }, [containerHeight, showHeader]);
  if (!isInitialized && messageLoading) {
    return (
      <div
        className=""
      >
        <Spinner />
        <div  className="">
          Loading conversation...
        </div>
      </div>
    );
  }
  if (errors.fetchMessages) {
    return (
      <div className="">
        <Alert severity="error">
          Failed to load conversation: {errors.fetchMessages}
        </Alert>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className=""
      elevation={isMobile ? 0 : 1}
    >
      {/* Conversation Header */}
      {showHeader && activeConversation && (
        <>
          <ConversationHeader
            conversation={activeConversation}
            onClose={onClose}
            compact={isMobile}
          />
          <Separator />
        </>
      )}
      {/* Message List */}
      <div className="">
        <VirtualizedMessageList
          messages={conversationMessages}
          height={messageListHeight}
          onLoadMore={handleLoadMore}
          hasMore={pagination?.hasMore}
          loading={loadingMore}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReaction={handleReaction}
          onCreateThread={handleCreateThread}
          onViewThread={handleViewThread}
          conversationId={conversationId}
          currentUserId={currentUserId}
          itemSize={isMobile ? 100 : 80}
          overscan={isMobile ? 3 : 5}
        />
      </div>
      {/* Message Input */}
      <div className="">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder="Type a message..."
          disabled={messageLoading}
          conversationId={conversationId}
          compact={isMobile}
        />
      </div>
      {/* Loading overlay for sending messages */}
      {messageLoading && (
        <div
          className=""
        >
          <Spinner size={24} />
          <div  className="">
            Sending...
          </div>
        </div>
      )}
    </div>
  );
};
export default OptimizedChatInterface;
