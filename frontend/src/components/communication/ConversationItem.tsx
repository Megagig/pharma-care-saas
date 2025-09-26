import { Badge, Tooltip, Avatar } from '@/components/ui/button';

interface ConversationItemProps {
  conversation: Conversation;
  selected?: boolean;
  onClick?: () => void;
  onAction?: (action: string, conversationId: string) => void;
  compact?: boolean;
}
const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation,
  selected = false,
  onClick,
  onAction,
  compact = false
}) => {
  const { messages } = useCommunicationStore();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  // Get conversation messages to calculate unread count
  const conversationMessages = messages[conversation._id] || [];
  const unreadCount = conversationMessages.filter(
    (msg) => msg.status !== 'read'
  ).length;
  // Get conversation type icon
  const getTypeIcon = () => {
    switch (conversation.type) {
      case 'group':
        return <Group fontSize="small" />;
      case 'patient_query':
        return <QuestionAnswer fontSize="small" />;
      default:
        return <Person fontSize="small" />;
    }
  };
  // Get conversation status color
  const getStatusColor = () => {
    switch (conversation.status) {
      case 'resolved':
        return 'success.main';
      case 'archived':
        return 'text.disabled';
      default:
        return 'text.primary';
    }
  };
  // Get priority color
  const getPriorityColor = () => {
    switch (conversation.priority) {
      case 'urgent':
        return 'error.main';
      case 'high':
        return 'warning.main';
      case 'low':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };
  // Format last message time
  const formatLastMessageTime = () => {
    try {
      return formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true}
    } catch {
      return 'Unknown';
    }
  };
  // Get conversation title
  const getConversationTitle = () => {
    if (conversation.title) {
      return conversation.title;
    }
    // Generate title based on type and participants
    switch (conversation.type) {
      case 'patient_query':
        return 'Patient Query';
      case 'group':
        return `Group Chat (${conversation.participants.length})`;
      default:
        return 'Direct Message';
    }
  };
  // Get conversation subtitle
  const getConversationSubtitle = () => {
    const participantRoles = conversation.participants
      .map((p) => p.role)
      .filter((role, index, arr) => arr.indexOf(role) === index);
    return participantRoles.join(', ');
  };
  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setMenuAnchor(null);
    onAction?.(action, conversation._id);
  };
  // Handle menu click
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };
  // Get available actions based on conversation status
  const getAvailableActions = () => {
    const actions = [];
    if (conversation.status === 'active') {
      actions.push(
        {
          key: 'archive',
          label: 'Archive',
          icon: <Archive fontSize="small" />,
        },
        {
          key: 'resolve',
          label: 'Mark as Resolved',
          icon: <CheckCircle fontSize="small" />,
        }
      );
    }
    if (conversation.status === 'archived') {
      actions.push({ 
        key: 'unarchive',
        label: 'Unarchive',
        icon: <Unarchive fontSize="small" />}
      });
    }
    actions.push({ 
      key: 'delete',
      label: 'Delete',
      icon: <Delete fontSize="small" />,
      danger: true}
    });
    return actions;
  };
  const availableActions = getAvailableActions();
  return (
    <>
      <Button
        
        onClick={onClick}
        className="">
        <div
          className=""
        >
          {/* Avatar/Icon */}
          <div className="">
            {conversation.type === 'group' ? (
              <AvatarGroup
                max={2}
                className="">
                {conversation.participants
                  .slice(0, 2)
                  .map((participant, index) => (
                    <Avatar
                      key={participant.userId}
                      className=""
                    >
                      {participant.role.charAt(0).toUpperCase()}
                    </Avatar>
                  ))}
              </AvatarGroup>
            ) : (
              <Avatar className="">
                {getTypeIcon()}
              </Avatar>
            )}
            {/* Priority indicator */}
            {conversation.priority === 'urgent' && (
              <PriorityHigh
                className=""
              />
            )}
          </div>
          {/* Content */}
          <div className="">
            {/* Title and Status */}
            <div
              className=""
            >
              <div
                variant={compact ? 'body2' : 'subtitle2'}
                noWrap
                className=""
              >
                {getConversationTitle()}
              </div>
              {/* Status indicators */}
              {conversation.status === 'resolved' && (
                <CheckCircle className="" />
              )}
              {conversation.status === 'archived' && (
                <Archive className="" />
              )}
            </div>
            {/* Subtitle and metadata */}
            {!compact && (
              <div
                className=""
              >
                <div
                  
                  color="text.secondary"
                  noWrap
                  className=""
                >
                  {getConversationSubtitle()}
                </div>
                {conversation.priority !== 'normal' && (
                  <Chip
                    label={conversation.priority}
                    size="small"
                    className=""
                  />
                )}
              </div>
            )}
            {/* Tags */}
            {!compact && conversation.tags && conversation.tags.length > 0 && (
              <div
                className=""
              >
                {conversation.tags.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    
                    className=""
                  />
                ))}
                {conversation.tags.length > 2 && (
                  <div  color="text.secondary">
                    +{conversation.tags.length - 2} more
                  </div>
                )}
              </div>
            )}
            {/* Last message time */}
            <div className="">
              <Schedule className="" />
              <div  color="text.secondary">
                {formatLastMessageTime()}
              </div>
            </div>
          </div>
          {/* Right side indicators */}
          <div className="">
            {/* Unread count */}
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="primary"
                max={99}
                className="" />
            )}
            {/* Menu button */}
            <Tooltip title="More options">
              <IconButton
                size="small"
                onClick={handleMenuClick}
                className=""
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </ListItemButton>
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        {availableActions.map((action) => (
          <MenuItem
            key={action.key}
            onClick={() => handleMenuAction(action.key)}
            className=""
          >
            <div className="">
              {action.icon}
              {action.label}
            </div>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
export default ConversationItem;
