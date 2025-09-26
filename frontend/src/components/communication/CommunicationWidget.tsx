import { Card, CardContent, Badge, Tooltip, Skeleton, Avatar } from '@/components/ui/button';

interface CommunicationWidgetProps {
  variant?: 'overview' | 'recent-messages' | 'notifications';
  height?: number;
  showHeader?: boolean;
}
const CommunicationWidget: React.FC<CommunicationWidgetProps> = ({ 
  variant = 'overview',
  height = 300,
  showHeader = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    conversations,
    notifications,
    unreadCount,
    getRecentMessages,
    loading,
  } = useCommunicationStore();
  const [metrics, setMetrics] = useState({ 
    totalConversations: 0,
    unreadMessages: 0,
    activeChats: 0,
    pendingQueries: 0}
  });
  useEffect(() => {
    // Calculate metrics from store data
    const activeConversations = conversations.filter(
      (conv) => conv.status === 'active'
    );
    const pendingQueries = conversations.filter(
      (conv) => conv.type === 'patient_query' && conv.status === 'active'
    );
    setMetrics({ 
      totalConversations: conversations.length,
      unreadMessages: unreadCount,
      activeChats: activeConversations.length,
      pendingQueries: pendingQueries.length}
    });
  }, [conversations, unreadCount]);
  const handleNavigateToHub = () => {
    navigate('/pharmacy/communication');
  };
  const handleNavigateToConversation = (conversationId: string) => {
    navigate(`/pharmacy/communication?conversation=${conversationId}`);
  };
  const renderOverviewWidget = () => (
    <Card
      className="">
      <CardContent
        className=""
      >
        {showHeader && (
          <div
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <div display="flex" alignItems="center" gap={1}>
              <Avatar
                className=""
              >
                <ForumIcon fontSize="small" />
              </Avatar>
              <div  fontWeight="bold">
                Communication Hub
              </div>
            </div>
            <Tooltip title="Open Communication Hub">
              <IconButton
                onClick={handleNavigateToHub}
                className="">
                <ArrowForwardIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
        <div className="">
          {/* Metrics Grid */}
          <div
            className=""
          >
            <motion.div >
              <div
                className="">
                <div  color="success.main" fontWeight="bold">
                  {loading ? (
                    <Skeleton width={40} />
                  ) : (
                    metrics.totalConversations
                  )}
                </div>
                <div  color="text.secondary">
                  Total Conversations
                </div>
              </div>
            </motion.div>
            <motion.div >
              <div
                className="">
                <div  color="warning.main" fontWeight="bold">
                  {loading ? <Skeleton width={40} /> : metrics.unreadMessages}
                </div>
                <div  color="text.secondary">
                  Unread Messages
                </div>
              </div>
            </motion.div>
            <motion.div >
              <div
                className="">
                <div  color="info.main" fontWeight="bold">
                  {loading ? <Skeleton width={40} /> : metrics.activeChats}
                </div>
                <div  color="text.secondary">
                  Active Chats
                </div>
              </div>
            </motion.div>
            <motion.div >
              <div
                className="">
                <div  color="error.main" fontWeight="bold">
                  {loading ? <Skeleton width={40} /> : metrics.pendingQueries}
                </div>
                <div  color="text.secondary">
                  Pending Queries
                </div>
              </div>
            </motion.div>
          </div>
          {/* Quick Actions */}
          <div display="flex" gap={1} justifyContent="center">
            <Chip
              icon={<MessageIcon />}
              label="New Message"
              onClick={handleNavigateToHub}
              className="" />
            <Chip
              icon={<NotificationsIcon />}
              label={`${notifications.length} Notifications`}
              onClick={handleNavigateToHub}
              
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  const renderRecentMessagesWidget = () => {
    const recentMessages = getRecentMessages(5);
    return (
      <Card className="">
        <CardContent
          className=""
        >
          {showHeader && (
            <div
              className="">
              <div
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <div  fontWeight="bold">
                  Recent Messages
                </div>
                <IconButton onClick={handleNavigateToHub} size="small">
                  <ArrowForwardIcon />
                </IconButton>
              </div>
            </div>
          )}
          <div className="">
            {loading ? (
              <List>
                {[...Array(3)].map((_, index) => (
                  <div key={index}>
                    <divAvatar>
                      <Skeleton  width={40} height={40} />
                    </ListItemAvatar>
                    <div
                      primary={<Skeleton width="60%" />}
                      secondary={<Skeleton width="80%" />}
                    />
                  </div>
                ))}
              </List>
            ) : recentMessages.length > 0 ? (
              <List dense>
                {recentMessages.map((message) => (
                  <div
                    key={message._id}
                    button
                    onClick={() =>
                      handleNavigateToConversation(message.conversationId)}
                    }
                    className="">
                    <divAvatar>
                      <Avatar className="">
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <div
                      primary={
                        <div  noWrap>}
                          {message.content.text || 'File attachment'}
                        </div>
                      }
                      secondary={}
                        <div display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon fontSize="inherit" />
                          <div >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true, }}
                          </div>
                        </div>
                      }
                    />
                    {message.status === 'sent' && (
                      <Badge color="primary"  />
                    )}
                  </div>
                ))}
              </List>
            ) : (
              <div
                className=""
              >
                <ForumIcon className="" />
                <div  color="text.secondary">
                  No recent messages
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderNotificationsWidget = () => (
    <Card className="">
      <CardContent
        className=""
      >
        {showHeader && (
          <div
            className="">
            <div
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <div  fontWeight="bold">
                Notifications
              </div>
              <Badge
                badgeContent={
                  notifications.filter((n) => n.status === 'unread').length}
                }
                color="error"
              >
                <IconButton onClick={handleNavigateToHub} size="small">
                  <NotificationsIcon />
                </IconButton>
              </Badge>
            </div>
          </div>
        )}
        <div className="">
          {loading ? (
            <List>
              {[...Array(3)].map((_, index) => (
                <div key={index}>
                  <div
                    primary={<Skeleton width="70%" />}
                    secondary={<Skeleton width="50%" />}
                  />
                </div>
              ))}
            </List>
          ) : notifications.length > 0 ? (
            <List dense>
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className=""
                >
                  <div
                    primary={
                      <div
                        
                        fontWeight={
                          notification.status === 'unread' ? 600 : 400}
                        }
                      >
                        {notification.title}
                      </div>
                    }
                    secondary={}
                      <div display="flex" alignItems="center" gap={1}>
                        <div >
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </div>
                        <Chip
                          size="small"
                          label={notification.priority}
                          color={
                            notification.priority === 'urgent'
                              ? 'error'
                              : 'default'}
                          }
                          className=""
                        />
                      </div>
                    }
                  />
                </div>
              ))}
            </List>
          ) : (
            <div
              className=""
            >
              <NotificationsIcon
                className=""
              />
              <div  color="text.secondary">
                No notifications
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  switch (variant) {
    case 'recent-messages':
      return renderRecentMessagesWidget();
    case 'notifications':
      return renderNotificationsWidget();
    case 'overview':
    default:
      return renderOverviewWidget();
  }
};
export default CommunicationWidget;
