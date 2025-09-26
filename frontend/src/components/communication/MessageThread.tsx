import MessageItem from './MessageItem';

import MentionInput from './MentionInput';

import { Spinner, Alert, Separator } from '@/components/ui/button';

interface MessageThreadProps {
  conversationId: string;
  messages: Message[];
  onSendMessage: (
    content: string,
    attachments?: File[],
    threadId?: string,
    parentMessageId?: string,
    mentions?: string[]
  ) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  threadId?: string;
  parentMessage?: Message;
  maxHeight?: string | number;
}
const MessageThread: React.FC<MessageThreadProps> = ({ 
  conversationId,
  messages,
  onSendMessage,
  loading = false,
  error = null,
  threadId,
  parentMessage,
  maxHeight = '100%'
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { isConnected } = useSocketConnection();
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      socketService.startTyping(conversationId);
    }
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };
  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(conversationId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  // Handle message input changes
  const handleMessageChange = (value: string, newMentions: string[]) => {
    setMessageText(value);
    setMentions(newMentions);
    if (value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };
  // Handle sending message
  const handleSend = async () => {
    if ((!messageText.trim() && attachments.length === 0) || sending) {
      return;
    }
    setSending(true);
    handleTypingStop();
    try {
      await onSendMessage(
        messageText,
        attachments.length > 0 ? attachments : undefined,
        threadId,
        parentMessage?._id,
        mentions.length > 0 ? mentions : undefined
      );
      // Clear input after successful send
      setMessageText('');
      setAttachments([]);
      setMentions([]);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };
  // Handle key press in message input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  // Handle file attachment
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    // Focus input and add reply context
    messageInputRef.current?.focus();
    // TODO: Implement reply functionality with parent message reference
  };
  // Handle thread creation
  const handleCreateThread = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/communication/messages/${messageId}/thread`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to create thread');
      }
      const result = await response.json();
      console.log('Thread created:', result.data.threadId);
      // Refresh messages to show the new thread
      // This would typically be handled by the parent component
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };
  // Handle thread view
  const handleViewThread = (threadId: string) => {
    // This would typically open a thread view modal or navigate to thread
    console.log('View thread:', threadId);
  };
  // Filter messages for this thread
  const threadMessages = threadId
    ? messages.filter((msg) => msg.threadId === threadId)
    : messages.filter((msg) => !msg.threadId);
  return (
    <div
      className=""
    >
      {/* Thread Header (if this is a thread) */}
      {threadId && parentMessage && (
        <div className="">
          <div  color="primary" gutterBottom>
            Thread
          </div>
          <div className="">
            <div  color="text.secondary">
              Replying to: {parentMessage.content.text?.substring(0, 100)}
              {(parentMessage.content.text?.length || 0) > 100 ? '...' : ''}
            </div>
          </div>
        </div>
      )}
      {/* Error Display */}
      {error && (
        <Alert severity="error" className="">
          {error}
        </Alert>
      )}
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className=""
      >
        {loading && threadMessages.length === 0 ? (
          <div
            className=""
          >
            <Spinner />
          </div>
        ) : threadMessages.length === 0 ? (
          <div
            className=""
          >
            <div  color="text.secondary">
              {threadId
                ? 'No replies yet'
                : 'No messages yet. Start the conversation!'}
            </div>
          </div>
        ) : (
          threadMessages.map((message, index) => {
            const prevMessage = index > 0 ? threadMessages[index - 1] : null;
            const showDateDivider =
              prevMessage &&
              new Date(message.createdAt).toDateString() !==
                new Date(prevMessage.createdAt).toDateString();
            return (
              <React.Fragment key={message._id}>
                {showDateDivider && (
                  <div className="">
                    <Separator>
                      <div  color="text.secondary">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </Separator>
                  </div>
                )}
                <MessageItem
                  message={message}
                  showAvatar={
                    !prevMessage || prevMessage.senderId !== message.senderId}
                  }
                  showTimestamp={true}
                  onReply={() => handleReplyToMessage(message)}
                  
                  
                  
                  onCreateThread={handleCreateThread}
                  onViewThread={handleViewThread}
                  showThreading={!threadId} // Don't show threading inside a thread
                  conversationId={conversationId}
                />
              </React.Fragment>
            );
          })
        )}
      </div>
      {/* Message Input */}
      <div className="">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="">
            {attachments.map((file, index) => (
              <div
                key={index}
                
                className=""
              >
                <div  noWrap>
                  {file.name}
                </div>
                <IconButton
                  size="small"
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </IconButton>
              </div>
            ))}
          </div>
        )}
        {/* Input Row */}
        <div className="">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            
            onChange={handleFileSelect}
          />
          {/* Attach File Button */}
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <AttachFile />
          </IconButton>
          {/* Message Input with Mentions */}
          <MentionInput
            value={messageText}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={threadId ? 'Reply to thread...' : 'Type a message...'}
            disabled={sending || !isConnected}
            multiline
            maxRows={4}
            conversationId={conversationId}
            autoFocus={false}
          />
          {/* Emoji Button */}
          <IconButton size="small" disabled={sending}>
            <EmojiEmotions />
          </IconButton>
          {/* Send Button */}
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={
              (!messageText.trim() && attachments.length === 0) ||
              sending ||
              !isConnected}
            }
            className="">
            {sending ? (
              <Spinner size={20} color="inherit" />
            ) : (
              <Send />
            )}
          </IconButton>
        </div>
        {/* Connection Status */}
        {!isConnected && (
          <div
            
            color="warning.main"
            className=""
          >
            Offline - Messages will be sent when connection is restored
          </div>
        )}
      </div>
    </div>
  );
};
export default MessageThread;
