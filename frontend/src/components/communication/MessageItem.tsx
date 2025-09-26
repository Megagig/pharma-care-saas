import MentionDisplay from './MentionDisplay';

import ThreadIndicator from './ThreadIndicator';

import ThreadView from './ThreadView';

import { Button, Input, Dialog, DialogContent, DialogTitle, Tooltip, Avatar } from '@/components/ui/button';

interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isOwn?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onCreateThread?: (messageId: string) => void;
  onViewThread?: (threadId: string) => void;
  compact?: boolean;
  showThreading?: boolean;
  conversationId?: string;
  mobile?: boolean;
  touchOptimized?: boolean;
}
const MessageItem: React.FC<MessageItemProps> = ({ 
  message,
  showAvatar = true,
  showTimestamp = true,
  isOwn = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onCreateThread,
  onViewThread,
  compact = false,
  showThreading = true,
  conversationId,
  mobile = false,
  touchOptimized = false
}) => {
  const theme = useTheme();
  const { isMobile, isSmallMobile } = useResponsive();
  const isTouchDevice = useIsTouchDevice();
  // Use mobile mode if explicitly set or detected
  const isMobileMode = mobile || isMobile;
  const isCompactMode = compact || isSmallMobile;
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content.text || '');
  const [showReactions, setShowReactions] = useState(false);
  const [threadSummary, setThreadSummary] = useState<{
    replyCount: number;
    participants: string[];
    lastReplyAt?: string;
    unreadCount: number;
  } | null>(null);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const menuOpen = Boolean(menuAnchor);
  const messageRef = React.useRef<HTMLDivElement>(null);
  // Touch gestures for mobile interactions
  const { attachGestures } = useTouchGestures({ 
    onSwipeRight: () => {
      if (isMobileMode && !isOwn) {
        handleReply(); })
      }
    },
    onSwipeLeft: () => {
      if (isMobileMode && isOwn) {
        handleEdit();
      }
    },
    onLongPress: () => {
      if (isMobileMode) {
        handleMenuClick({ currentTarget: messageRef.current } as unknown);
      }
    },
    onDoubleTap: () => {
      if (isMobileMode) {
        handleReactionClick('👍');
      }
    }
  // Attach gestures to message element
    if (touchOptimized && messageRef.current) {
      attachGestures(messageRef.current);
    }
  }, [touchOptimized]);
  // Fetch thread summary if this message has a thread
  useEffect(() => {
    const fetchThreadSummary = async () => {
      if (!message.threadId || !showThreading) return;
      try {
        setLoadingThread(true);
        const response = await fetch(
          `/api/communication/threads/${message.threadId}/summary`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (response.ok) {
          const result = await response.json();
          setThreadSummary({ 
            replyCount: result.data.replyCount,
            participants: result.data.participants,
            lastReplyAt: result.data.lastReplyAt,
            unreadCount: result.data.unreadCount}
          });
        }
      } catch (error) {
        console.error('Failed to fetch thread summary:', error);
      } finally {
        setLoadingThread(false);
      }
    };
    fetchThreadSummary();
  }, [message.threadId, showThreading]);
  // Check if this message is the root of a thread
  const isThreadRoot = message.threadId === message._id;
  const hasThread = threadSummary && threadSummary.replyCount > 0;
  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  const handleReply = () => {
    onReply?.(message);
    handleMenuClose();
  };
  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };
  const handleDelete = () => {
    onDelete?.(message._id);
    handleMenuClose();
  };
  const handleCreateThread = () => {
    onCreateThread?.(message._id);
    handleMenuClose();
  };
  const handleViewThread = () => {
    if (message.threadId) {
      onViewThread?.(message.threadId);
    }
  };
  const handleEditSave = () => {
    if (editContent.trim() !== message.content.text) {
      onEdit?.(message._id, editContent.trim());
    }
    setEditDialogOpen(false);
  };
  const handleEditCancel = () => {
    setEditContent(message.content.text || '');
    setEditDialogOpen(false);
  };
  // Handle reactions
  const handleReactionClick = (emoji: string) => {
    onReaction?.(message._id, emoji);
    setShowReactions(false);
  };
  // Get message status icon
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <CheckIcon fontSize="small" color="disabled" />;
      case 'delivered':
        return <CheckCircleIcon fontSize="small" color="disabled" />;
      case 'read':
        return <CheckCircleIcon fontSize="small" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <ScheduleIcon fontSize="small" color="disabled" />;
    }
  };
  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon />;
    }
    return <DescriptionIcon />;
  };
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };
  // Check if user has reacted with emoji
  const hasUserReacted = (emoji: string) => {
    // TODO: Get current user ID and check reactions
    return false;
  };
  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);
  if (message.isDeleted) {
    return (
      <div
        className=""
      >
        {showAvatar && (
          <Avatar className="">
            <DeleteIcon fontSize="small" />
          </Avatar>
        )}
        <div  color="text.secondary" fontStyle="italic">
          This message was deleted
        </div>
        {showTimestamp && (
          <div  color="text.secondary">
            {formatTimestamp(message.deletedAt || message.createdAt)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      ref={messageRef}
      className="">
      {/* Avatar */}
      {showAvatar ? (
        <Avatar
          className=""
        >
          {/* TODO: Get user initials or avatar */}U
        </Avatar>
      ) : (
        <div className="" /> // Spacer for alignment
      )}
      {/* Message Content */}
      <div className="">
        {/* Header */}
        {showAvatar && (
          <div
            className=""
          >
            <div
              variant={isMobileMode ? 'body2' : 'subtitle2'}
              fontWeight="bold"
              className=""
            >
              {/* TODO: Get user name */}
              User Name
            </div>
            {message.priority === 'urgent' && (
              <Chip
                label="Urgent"
                size="small"
                color="error"
                
                className=""
              />
            )}
            {showTimestamp && (
              <div
                
                color="text.secondary"
                className=""
              >
                {formatTimestamp(message.createdAt)}
              </div>
            )}
            {message.editHistory.length > 0 && (
              <div  color="text.secondary">
                (edited)
              </div>
            )}
          </div>
        )}
        {/* Message Content */}
        <div>
          {/* Text Content with Mentions */}
          {message.content.text && (
            <MentionDisplay
              text={message.content.text}
              mentions={message.mentions}
              
              
              className=""
            />
          )}
          {/* Attachments */}
          {message.content.attachments &&
            message.content.attachments.length > 0 && (
              <div className="">
                {message.content.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    
                    className="">
                    {getFileIcon(attachment.mimeType)}
                    <div className="">
                      <div  noWrap>
                        {attachment.fileName}
                      </div>
                      <div  color="text.secondary">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(attachment.secureUrl, '_blank')}
                        }
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <Chip
                  key={emoji}
                  label={`${emoji} ${reactions.length}`}
                  size="small"
                  variant={hasUserReacted(emoji) ? 'filled' : 'outlined'}
                  onClick={() => handleReactionClick(emoji)}
                  className=""
                      : {},
                    '&:active': isMobileMode
                      ? {
                          bgcolor: 'action.selected',
                        }
                      : {},
                />
              ))}
            </div>
          )}
          {/* Thread Indicator */}
          {showThreading && hasThread && isThreadRoot && (
            <ThreadIndicator
              threadId={message.threadId!}
              replyCount={threadSummary.replyCount}
              participants={threadSummary.participants}
              lastReplyAt={threadSummary.lastReplyAt}
              unreadCount={threadSummary.unreadCount}
              expanded={threadExpanded}
              onToggle={() => setThreadExpanded(!threadExpanded)}
              onViewThread={handleViewThread}
              
            />
          )}
        </div>
        {/* Thread View */}
        {showThreading &&
          hasThread &&
          isThreadRoot &&
          threadExpanded &&
          conversationId && (
            <div className="">
              <ThreadView
                threadId={message.threadId!}
                conversationId={conversationId}
                compact={true}
                showReplyInput={true}
                maxHeight="400px"
              />
            </div>
          )}
      </div>
      {/* Actions */}
      <div className="">
        {/* Status Icon */}
        {isOwn && (
          <Tooltip title={`Message ${message.status}`}>
            <div className="">
              {getStatusIcon()}
            </div>
          </Tooltip>
        )}
        {/* Quick Actions */}
        <div
          className="">
          {!isMobileMode && (
            <>
              <Tooltip title="Reply">
                <IconButton size="small" onClick={handleReply}>
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add reaction">
                <IconButton
                  size="small"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <EmojiEmotionsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <IconButton
            size={isMobileMode ? 'medium' : 'small'}
            onClick={handleMenuClick}
            className="">
            <MoreVertIcon fontSize={isMobileMode ? 'medium' : 'small'} />
          </IconButton>
        </div>
      </div>
      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        >
        <MenuItem onClick={handleReply}>
          <ReplyIcon fontSize="small" className="" />
          Reply
        </MenuItem>
        {showThreading && !message.threadId && onCreateThread && (
          <MenuItem onClick={handleCreateThread}>
            <ForumIcon fontSize="small" className="" />
            Start Thread
          </MenuItem>
        )}
        {isOwn && (
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" className="" />
            Edit
          </MenuItem>
        )}
        {isOwn && (
          <MenuItem onClick={handleDelete} className="">
            <DeleteIcon fontSize="small" className="" />
            Delete
          </MenuItem>
        )}
      </Menu>
      {/* Reaction Picker */}
      {showReactions && (
        <div
          className=""
        >
          <div
            
            color="text.secondary"
            className=""
          >
            Healthcare Reactions
          </div>
          <div container spacing={0.5} className="">
            {[
              { emoji: '👍', label: 'Approve' },
              { emoji: '👎', label: 'Disapprove' },
              { emoji: '❤️', label: 'Care' },
              { emoji: '😊', label: 'Happy' },
              { emoji: '😢', label: 'Concern' },
              { emoji: '😮', label: 'Surprised' },
              { emoji: '🤔', label: 'Thinking' },
              { emoji: '✅', label: 'Confirmed' },
              { emoji: '❌', label: 'Declined' },
              { emoji: '⚠️', label: 'Warning' },
              { emoji: '🚨', label: 'Urgent' },
              { emoji: '📋', label: 'Note' },
              { emoji: '💊', label: 'Medication' },
              { emoji: '🩺', label: 'Medical' },
              { emoji: '📊', label: 'Data' },
            ].map(({ emoji, label }) => (
              <div item key={emoji}>
                <Tooltip title={label}>
                  <Button
                    size="small"
                    onClick={() => handleReactionClick(emoji)}
                    className="">
                    {emoji}
                  </Button>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <Input
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your message..."
            
            className=""
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            
            disabled={!editContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default MessageItem;
