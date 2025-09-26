import MessageItem from './MessageItem';

// import MessageThread from './MessageThread';

import { Badge, Tooltip, Spinner, Alert, Separator } from '@/components/ui/button';

interface ThreadViewProps {
  threadId: string;
  conversationId: string;
  onClose?: () => void;
  compact?: boolean;
  showReplyInput?: boolean;
  maxHeight?: string | number;
}
interface ThreadSummary {
  threadId: string;
  rootMessage: Message;
  replyCount: number;
  participants: string[];
  lastReplyAt?: string;
  unreadCount: number;
}
const ThreadView: React.FC<ThreadViewProps> = ({ 
  threadId,
  conversationId,
  onClose,
  compact = false,
  showReplyInput = true,
  maxHeight = '600px'
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [threadSummary, setThreadSummary] = useState<ThreadSummary | null>(
    null
  );
  const [threadMessages, setThreadMessages] = useState<{
    rootMessage: Message;
    replies: Message[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage } = useCommunicationStore();
  // Fetch thread summary
  const fetchThreadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/communication/threads/${threadId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch thread summary');
      }
      const result = await response.json();
      setThreadSummary(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };
  // Fetch thread messages
  const fetchThreadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/communication/threads/${threadId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch thread messages');
      }
      const result = await response.json();
      setThreadMessages(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load thread messages'
      );
    } finally {
      setLoading(false);
    }
  };
  // Load thread data
  useEffect(() => {
    fetchThreadSummary();
    if (expanded) {
      fetchThreadMessages();
    }
  }, [threadId, expanded]);
  // Handle expand/collapse
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && !threadMessages) {
      fetchThreadMessages();
    }
  };
  // Handle reply to thread
  const handleReplyToThread = async (
    content: string,
    attachments?: File[],
    mentions?: string[]
  ) => {
    try {
      const response = await fetch(
        `/api/communication/threads/${threadId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ 
            content: {
              text: content,
              type: 'text'}
            },
            mentions, },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      // Refresh thread messages
      await fetchThreadMessages();
      await fetchThreadSummary();
    } catch (err) {
      console.error('Failed to reply to thread:', err);
      throw err;
    }
  };
  if (loading && !threadSummary) {
    return (
      <div
        className=""
      >
        <Spinner size={24} />
      </div>
    );
  }
  if (error && !threadSummary) {
    return (
      <Alert severity="error" className="">
        {error}
      </Alert>
    );
  }
  if (!threadSummary) {
    return null;
  }
  return (
    <div
      
      className=""
    >
      {/* Thread Header */}
      <div
        className=""
        onClick={compact ? handleToggleExpanded : undefined}
      >
        <div className="">
          {/* Thread Icon */}
          <Forum color="primary" fontSize="small" />
          {/* Thread Info */}
          <div className="">
            <div
              className=""
            >
              <div  fontWeight="bold" noWrap>
                Thread
              </div>
              {threadSummary.unreadCount > 0 && (
                <Badge
                  badgeContent={threadSummary.unreadCount}
                  color="error"
                  className="" />
              )}
              {threadSummary.lastReplyAt && (
                <div  color="text.secondary">
                  Last reply{' '}
                  {formatDistanceToNow(new Date(threadSummary.lastReplyAt), {
                    addSuffix: true, }}
                </div>
              )}
            </div>
            <div
              
              color="text.secondary"
              noWrap
              className=""
            >
              {threadSummary.rootMessage.content.text?.substring(0, 100)}
              {(threadSummary.rootMessage.content.text?.length || 0) > 100
                ? '...'
                : ''}
            </div>
            <div
              className=""
            >
              <div className="">
                <Reply fontSize="small" color="action" />
                <div  color="text.secondary">
                  {threadSummary.replyCount}{' '}
                  {threadSummary.replyCount === 1 ? 'reply' : 'replies'}
                </div>
              </div>
              <div className="">
                <Person fontSize="small" color="action" />
                <div  color="text.secondary">
                  {threadSummary.participants.length} participant
                  {threadSummary.participants.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="">
            {compact && (
              <Tooltip title={expanded ? 'Collapse thread' : 'Expand thread'}>
                <IconButton size="small" onClick={handleToggleExpanded}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            )}
            {onClose && (
              <Tooltip title="Close thread">
                <IconButton size="small" onClick={onClose}>
                  <Close />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      {/* Thread Content */}
      <Collapse in={expanded}>
        <div
          className=""
        >
          {/* Root Message */}
          <div className="">
            <div
              
              color="primary"
              className=""
            >
              Thread starter
            </div>
            <MessageItem
              message={threadSummary.rootMessage}
              showAvatar={true}
              showTimestamp={true}
              compact={false}
               // Disable reply on root message in thread view
            />
          </div>
          {/* Thread Messages */}
          {threadMessages && (
            <div className="">
              {threadMessages.replies.length > 0 ? (
                <div className="">
                  <div
                    
                    color="text.secondary"
                    className=""
                  >
                    Replies ({threadMessages.replies.length})
                  </div>
                  <div
                    className=""
                  >
                    {threadMessages.replies.map((reply, index) => {
                      const prevReply =
                        index > 0 ? threadMessages.replies[index - 1] : null;
                      const showDateDivider =
                        prevReply &&
                        new Date(reply.createdAt).toDateString() !==
                          new Date(prevReply.createdAt).toDateString();
                      return (
                        <React.Fragment key={reply._id}>
                          {showDateDivider && (
                            <div className="">
                              <Separator>
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </Separator>
                            </div>
                          )}
                          <MessageItem
                            message={reply}
                            showAvatar={
                              !prevReply ||
                              prevReply.senderId !== reply.senderId}
                            }
                            showTimestamp={true}
                            compact={true}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className=""
                >
                  <div  color="text.secondary">
                    No replies yet. Be the first to reply!
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Reply Input */}
          {showReplyInput && expanded && (
            <div className="">
              <MessageThread
                conversationId={conversationId}
                messages={[]}
                onSendMessage={handleReplyToThread}
                threadId={threadId}
                parentMessage={threadSummary.rootMessage}
                maxHeight="200px"
              />
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
};
export default ThreadView;
