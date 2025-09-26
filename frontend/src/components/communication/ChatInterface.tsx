// import MessageThread from './MessageThread';

import ParticipantList from './ParticipantList';

import ConnectionStatus from './ConnectionStatus';

import TypingIndicator from './TypingIndicator';

import { Tooltip, Alert, Separator } from '@/components/ui/button';

interface ChatInterfaceProps {
  conversationId: string;
  patientId?: string;
  height?: string | number;
  showParticipants?: boolean;
  showHeader?: boolean;
  onConversationAction?: (action: string, conversationId: string) => void;
}
const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversationId,
  patientId,
  height = '600px',
  showParticipants = true,
  showHeader = true,
  onConversationAction
}) => {
  const {
    activeConversation,
    messages,
    messageLoading,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    loading,
    errors,
  } = useCommunicationStore();
  const { isConnected } = useSocketConnection();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Get conversation messages
  const conversationMessages = messages[conversationId] || [];
  // Get current conversation
  const conversation =
    activeConversation?._id === conversationId ? activeConversation : null;
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);
  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      markConversationAsRead(conversationId);
    }
  }, [conversationId, fetchMessages, markConversationAsRead]);
  // Handle sending messages
  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    threadId?: string,
    parentMessageId?: string,
    mentions?: string[]
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }
    const messageData = {
      conversationId,
      content: {
        text: content.trim(),
        type: 'text' as const,
        attachments,
      },
      threadId,
      parentMessageId,
      mentions,
    };
    await sendMessage(messageData);
  };
  // Handle conversation actions
  const handleConversationAction = (action: string) => {
    onConversationAction?.(action, conversationId);
  };
  // Get conversation status info
  const getStatusInfo = () => {
    if (!conversation) return null;
    switch (conversation.status) {
      case 'resolved':
        return {
          icon: <CheckCircle color="success" />,
          text: 'Resolved',
          color: 'success.main',
        };
      case 'archived':
        return {
          icon: <Archive color="disabled" />,
          text: 'Archived',
          color: 'text.disabled',
        };
      default:
        return null;
    }
  };
  const statusInfo = getStatusInfo();
  // Show error if conversation not found
  if (!conversation && !messageLoading) {
    return (
      <div
        className=""
      >
        <div textAlign="center">
          <ErrorIcon color="error" className="" />
          <div  color="error" gutterBottom>
            Conversation not found
          </div>
          <div  color="text.secondary">
            The conversation you're looking for doesn't exist or you don't have
            access to it.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className=""
    >
      {/* Header */}
      {showHeader && conversation && (
        <div
          className=""
        >
          <div className="">
            <div className="">
              <div  noWrap>
                {conversation.title || 'Conversation'}
              </div>
              {statusInfo && (
                <div
                  className=""
                >
                  {statusInfo.icon}
                  <div >{statusInfo.text}</div>
                </div>
              )}
            </div>
            <div
              className=""
            >
              <div  color="text.secondary">
                {conversation.participants.length} participant
                {conversation.participants.length !== 1 ? 's' : ''}
              </div>
              {conversation.priority !== 'normal' && (
                <div
                  
                  className=""
                >
                  {conversation.priority}
                </div>
              )}
              <ConnectionStatus  size="small" />
            </div>
          </div>
          <div className="">
            {showParticipants && (
              <Tooltip title="Show participants">
                <IconButton
                  size="small"
                  onClick={() => setParticipantsOpen(!participantsOpen)}
                  color={participantsOpen ? 'primary' : 'default'}
                >
                  <Info />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="More options">
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      )}
      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" className="">
          You're currently offline. Messages will be sent when connection is
          restored.
        </Alert>
      )}
      {/* Main Content */}
      <div className="">
        {/* Messages Area */}
        <div className="">
          {/* Message Thread */}
          <div className="">
            <MessageThread
              conversationId={conversationId}
              messages={conversationMessages}
              onSendMessage={handleSendMessage}
              loading={messageLoading || loading.fetchMessages}
              error={errors.fetchMessages}
            />
          </div>
          {/* Typing Indicator */}
          <TypingIndicator
            conversationId={conversationId}
            participants={conversation?.participants.map((p) => ({ 
              userId: p.userId,
              firstName: 'User', // TODO: Get actual user names
              lastName: '',
            }))}
            
          />
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
        {/* Participants Sidebar */}
        {showParticipants && participantsOpen && conversation && (
          <>
            <Separator orientation="vertical" />
            <div className="">
              <ParticipantList
                conversation={conversation}
                
                
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default ChatInterface;
