import { Button, Badge, Tooltip, Avatar, Separator } from '@/components/ui/button';

interface CommunicationNotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showPreview?: boolean;
  maxPreviewItems?: number;
}
const CommunicationNotificationBadge: React.FC = ({ size = 'medium', showPreview = true, maxPreviewItems = 5 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    getRecentMessages,
    markNotificationAsRead,
  } = useCommunicationStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  useEffect(() => {
    // Combine recent messages and notifications for preview
    const recentMessages = getRecentMessages(3);
    const recentNotifications = notifications
      .filter((n) => n.status === 'unread')
      .slice(0, 2)
      .map((n) => ({ ...n, type: 'notification' }));
    const combined = [
      ...recentMessages.map((m) => ({ ...m, type: 'message' })),
      ...recentNotifications,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, maxPreviewItems);
    setRecentActivity(combined);
  }, [notifications, getRecentMessages, maxPreviewItems]);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showPreview && (unreadCount > 0 || recentActivity.length > 0)) {
      setAnchorEl(event.currentTarget);
    } else {
      navigate('/pharmacy/communication');
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleViewAll = () => {
    handleClose();
    navigate('/pharmacy/communication');
  };
  const handleItemClick = (item: any) => {
    if (item.type === 'notification') {
      markNotificationAsRead(item._id);
      if (item.data?.conversationId) {
        navigate(
          `/pharmacy/communication?conversation=${item.data.conversationId}`
        );
      } else {
        navigate('/pharmacy/communication');
      }
    } else if (item.type === 'message') {
      navigate(`/pharmacy/communication?conversation=${item.conversationId}`);
    }
    handleClose();
  };
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  };
  const getBadgeColor = () => {
    if (unreadCount === 0) return 'default';
    if (unreadCount > 10) return 'error';
    if (unreadCount > 5) return 'warning';
    return 'primary';
  };
  const renderPreviewItem = (item: any, index: number) => {
    const isNotification = item.type === 'notification';
    const isMessage = item.type === 'message';
    return (
      <div
        key={`${item.type}-${item._id}-${index}`}
        button
        onClick={() => handleItemClick(item)}
        className="">
        <divAvatar>
          <Avatar
            className=""
          >
            {isNotification ? (
              <NotificationsIcon fontSize="small" />
            ) : (
              <MessageIcon fontSize="small" />
            )}
          </Avatar>
        </ListItemAvatar>
        <div
          primary={
            <div  noWrap>
              {isNotification
                ? item.title}
                : item.content?.text || 'File attachment'}
            </div>
          }
          secondary={}
            <div display="flex" alignItems="center" gap={1}>
              <ScheduleIcon fontSize="inherit" />
              <div >
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true, }}
              </div>
              {isNotification && item.priority === 'urgent' && (
                <div
                  
                  className=""
                >
                  URGENT
                </div>
              )}
            </div>
          }
        />
      </div>
    );
  };
  return (
    <>
      <Tooltip title="Communication Hub">
        <IconButton
          size={getIconSize() as any}
          color="inherit"
          onClick={handleClick}
          className="">
          <Badge
            badgeContent={unreadCount}
            color={getBadgeColor() as any}
            max={99}
            className="">
            <ForumIcon fontSize={getIconSize() as any} />
          </Badge>
        </IconButton>
      </Tooltip>
      {showPreview && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          
          
          PaperProps={{
            sx: {
              width: 350,
              maxHeight: 400,
              mt: 1,
              boxShadow: theme.shadows[8],}
            },
          >
          <div
            className="">
            <div  fontWeight="bold">
              Communication Hub
            </div>
            <div  color="text.secondary">
              {unreadCount > 0
                ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </div>
          </div>
          {recentActivity.length > 0 ? (
            <>
              <List dense className="">
                {recentActivity.map((item, index) =>
                  renderPreviewItem(item, index)
                )}
              </List>
              <Separator />
              <div className="">
                <Button
                  fullWidth
                  
                  onClick={handleViewAll}
                  className=""
                >
                  View All in Communication Hub
                </Button>
              </div>
            </>
          ) : (
            <div
              className=""
            >
              <ForumIcon className="" />
              <div  color="text.secondary">
                No recent activity
              </div>
              <Button
                
                size="small"
                onClick={handleViewAll}
                className=""
              >
                Open Communication Hub
              </Button>
            </div>
          )}
        </Menu>
      )}
    </>
  );
};
export default CommunicationNotificationBadge;
