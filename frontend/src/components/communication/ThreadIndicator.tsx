
import { Badge, Tooltip } from '@/components/ui/button';

interface ThreadIndicatorProps {
  threadId: string;
  replyCount: number;
  participants: string[];
  lastReplyAt?: string;
  unreadCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onViewThread?: () => void;
  variant?: 'compact' | 'detailed';
}
const ThreadIndicator: React.FC<ThreadIndicatorProps> = ({ 
  threadId,
  replyCount,
  participants,
  lastReplyAt,
  unreadCount = 0,
  expanded = false,
  onToggle,
  onViewThread,
  variant = 'compact'
}) => {
  if (replyCount === 0) {
    return null;
  }
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onViewThread) {
      onViewThread();
    }
  };
  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };
  if (variant === 'compact') {
    return (
      <div
        className="" onClick={handleClick}
      >
        <Forum color="primary" fontSize="small" />
        <div className="">
          <div className="">
            <div  color="primary" fontWeight="bold">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </div>
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="error"
                className="" />
            )}
          </div>
          {lastReplyAt && (
            <div  color="text.secondary">
              Last reply{' '}
              {formatDistanceToNow(new Date(lastReplyAt), { addSuffix: true })}
            </div>
          )}
        </div>
        {onToggle && (
          <Tooltip title={expanded ? 'Collapse thread' : 'Expand thread'}>
            <IconButton size="small" onClick={handleToggleClick}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  }
  // Detailed variant
  return (
    <div
      className=""
          : {},
      onClick={onViewThread ? handleClick : undefined}
    >
      <Forum color="primary" />
      <div className="">
        <div className="">
          <div  color="primary" fontWeight="bold">
            Thread Discussion
          </div>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              color="error"
              
              className=""
            />
          )}
        </div>
        <div className="">
          <div className="">
            <Reply fontSize="small" color="action" />
            <div  color="text.secondary">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </div>
          </div>
          <div className="">
            <Person fontSize="small" color="action" />
            <div  color="text.secondary">
              {participants.length} participant
              {participants.length !== 1 ? 's' : ''}
            </div>
          </div>
          {lastReplyAt && (
            <div  color="text.secondary">
              Last reply{' '}
              {formatDistanceToNow(new Date(lastReplyAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
      {onToggle && (
        <Tooltip title={expanded ? 'Collapse thread' : 'Expand thread'}>
          <IconButton onClick={handleToggleClick}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
export default ThreadIndicator;
