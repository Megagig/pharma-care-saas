import { Button, Tooltip, Alert, Avatar } from '@/components/ui/button';

interface NotificationItemProps {
  notification: CommunicationNotification;
  onClick?: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
  compact?: boolean;
}
const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification,
  onClick,
  onDismiss,
  showActions = true,
  compact = false
}) => {
  const { markNotificationAsRead } = useCommunicationStore();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Get notification icon based on type
  const getNotificationIcon = useCallback(() => {
    const iconProps = {
      sx: {
        color:
          notification.status === 'unread' ? 'primary.main' : 'text.secondary',
        fontSize: compact ? 20 : 24,
      },
    };
    switch (notification.type) {
      case 'new_message':
        return <MessageIcon {...iconProps} />;
      case 'mention':
        return <MentionIcon {...iconProps} />;
      case 'therapy_update':
        return <ClinicalIcon {...iconProps} />;
      case 'clinical_alert':
        return <AlertIcon {...iconProps} />;
      case 'conversation_invite':
        return <InviteIcon {...iconProps} />;
      case 'file_shared':
        return <FileIcon {...iconProps} />;
      case 'intervention_assigned':
        return <InterventionIcon {...iconProps} />;
      case 'patient_query':
        return <QueryIcon {...iconProps} />;
      case 'urgent_message':
        return <UrgentIcon {...iconProps} />;
      case 'system_notification':
        return <SystemIcon {...iconProps} />;
      default:
        return <MessageIcon {...iconProps} />;
    }
  }, [notification.type, notification.status, compact]);
  // Get priority color
  const getPriorityColor = useCallback(() => {
    switch (notification.priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  }, [notification.priority]);
  // Get notification type label
  const getTypeLabel = useCallback(() => {
    switch (notification.type) {
      case 'new_message':
        return 'New Message';
      case 'mention':
        return 'Mention';
      case 'therapy_update':
        return 'Therapy Update';
      case 'clinical_alert':
        return 'Clinical Alert';
      case 'conversation_invite':
        return 'Conversation Invite';
      case 'file_shared':
        return 'File Shared';
      case 'intervention_assigned':
        return 'Intervention Assigned';
      case 'patient_query':
        return 'Patient Query';
      case 'urgent_message':
        return 'Urgent Message';
      case 'system_notification':
        return 'System Notification';
      default:
        return 'Notification';
    }
  }, [notification.type]);
  // Format timestamp
  const formatTimestamp = useCallback(() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true}
    } catch {
      return 'Unknown time';
    }
  }, [notification.createdAt]);
  // Handle notification click
  const handleClick = useCallback(() => {
    if (notification.status === 'unread') {
      markNotificationAsRead(notification._id);
    }
    if (onClick) {
      onClick();
    } else if (notification.data.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.data.actionUrl;
    }
  }, [notification, markNotificationAsRead, onClick]);
  // Handle mark as read/unread
  const handleToggleRead = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (notification.status === 'unread') {
        markNotificationAsRead(notification._id);
      }
      // Note: We don't have markAsUnread in the store, but could be added
    },
    [notification, markNotificationAsRead]
  );
  // Handle dismiss
  const handleDismiss = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onDismiss) {
        onDismiss();
      }
      setMenuAnchorEl(null);
    },
    [onDismiss]
  );
  // Handle menu actions
  const handleMenuClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  // Handle expand/collapse
  const handleToggleExpand = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setExpanded(!expanded);
    },
    [expanded]
  );
  // Check if notification is scheduled
  const isScheduled =
    notification.scheduledFor &&
    new Date(notification.scheduledFor) > new Date();
  return (
    <>
      <div
        button
        onClick={handleClick}
        className="">
        <divAvatar>
          <Avatar
            className=""
          >
            {getNotificationIcon()}
          </Avatar>
        </ListItemAvatar>
        <div
          primary={
            <div
              className=""
            >
              <div}
                variant={compact ? 'body2' : 'subtitle2'}
                className=""
                noWrap
              >
                {notification.title}
              </div>
              {notification.priority !== 'normal' && (
                <Chip
                  label={notification.priority}
                  size="small"
                  color={getPriorityColor() as any}
                  className=""
                />
              )}
              {isScheduled && (
                <Tooltip title="Scheduled notification">
                  <ScheduleIcon
                    className=""
                  />
                </Tooltip>
              )}
            </div>
          }
          secondary={
            <div>
              <div
                
                color="text.secondary"
                className=""
              >}
                {notification.content}
              </div>
              <div
                className=""
              >
                <div className="">
                  <Chip
                    label={getTypeLabel()}
                    size="small"
                    
                    className=""
                  />
                  <div  color="text.secondary">
                    {formatTimestamp()}
                  </div>
                </div>
                {notification.content.length > 100 && (
                  <Button
                    size="small"
                    onClick={handleToggleExpand}
                    startIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
                    className=""
                  >
                    {expanded ? 'Less' : 'More'}
                  </Button>
                )}
              </div>
            </div>
          }
        />
        {showActions && (
          <divSecondaryAction>
            <div className="">
              <Tooltip
                title={
                  notification.status === 'unread'
                    ? 'Mark as read'
                    : 'Mark as unread'}
                }
              >
                <IconButton size="small" onClick={handleToggleRead}>
                  {notification.status === 'unread' ? (
                    <UnreadIcon />
                  ) : (
                    <ReadIcon />
                  )}
                </IconButton>
              </Tooltip>
              {notification.data.actionUrl && (
                <Tooltip title="Open">
                  <IconButton size="small" onClick={handleClick}>
                    <OpenIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="More actions">
                <IconButton size="small" onClick={handleMenuClick}>
                  <MoreIcon />
                </IconButton>
              </Tooltip>
            </div>
          </ListItemSecondaryAction>
        )}
      </div>
      {/* Expanded content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div className="">
          {notification.data.conversationId && (
            <div  display="block" gutterBottom>
              Conversation ID: {notification.data.conversationId}
            </div>
          )}
          {notification.data.patientId && (
            <div  display="block" gutterBottom>
              Patient ID: {notification.data.patientId}
            </div>
          )}
          {notification.data.senderId && (
            <div  display="block" gutterBottom>
              From: {notification.data.senderId}
            </div>
          )}
          {notification.scheduledFor && (
            <div  display="block" gutterBottom>
              Scheduled for:{' '}
              {new Date(notification.scheduledFor).toLocaleString()}
            </div>
          )}
          {notification.readAt && (
            <div  display="block" gutterBottom>
              Read at: {new Date(notification.readAt).toLocaleString()}
            </div>
          )}
        </div>
      </Collapse>
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleRead}>
          {notification.status === 'unread' ? (
            <>
              <ReadIcon className="" />
              Mark as read
            </>
          ) : (
            <>
              <UnreadIcon className="" />
              Mark as unread
            </>
          )}
        </MenuItem>
        {notification.data.actionUrl && (
          <MenuItem onClick={handleClick}>
            <OpenIcon className="" />
            Open
          </MenuItem>
        )}
        <MenuItem onClick={handleDismiss}>
          <DismissIcon className="" />
          Dismiss
        </MenuItem>
      </Menu>
    </>
  );
};
export default NotificationItem;
