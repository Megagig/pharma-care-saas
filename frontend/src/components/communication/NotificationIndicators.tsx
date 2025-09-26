import { Badge, Tooltip, Avatar } from '@/components/ui/button';

interface NotificationIndicatorsProps {
  showBadge?: boolean;
  showToast?: boolean;
  showPulse?: boolean;
  maxToastNotifications?: number;
  toastDuration?: number;
  onNotificationClick?: (notification: CommunicationNotification) => void;
}
interface ToastNotification extends CommunicationNotification {
  toastId: string;
  showToast: boolean;
}
const NotificationIndicators: React.FC<NotificationIndicatorsProps> = ({ 
  showBadge = true,
  showToast = true,
  showPulse = true,
  maxToastNotifications = 3,
  toastDuration = 5000,
  onNotificationClick
}) => {
  const { notifications, unreadCount } = useCommunicationStore();
  const [toastNotifications, setToastNotifications] = useState<
    ToastNotification[]
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);
  // Handle new notifications for toast display
  useEffect(() => {
    const newUnreadNotifications = notifications.filter(
      (n) => n.status === 'unread'
    );
    // Find truly new notifications (not already in toast queue)
    const existingToastIds = toastNotifications.map((t) => t._id);
    const newNotifications = newUnreadNotifications.filter(
      (n) =>
        !existingToastIds.includes(n._id) &&
        ['urgent', 'high'].includes(n.priority) // Only show toast for high priority
    );
    if (newNotifications.length > 0 && showToast) {
      const newToasts: ToastNotification[] = newNotifications
        .slice(0, maxToastNotifications)
        .map((notification) => ({ 
          ...notification}
          toastId: `toast-${notification._id}-${Date.now()}`,
          showToast: true}
      setToastNotifications((prev) => [...prev, ...newToasts]);
      // Auto-remove toasts after duration
      newToasts.forEach((toast) => {
        setTimeout(() => {
          setToastNotifications((prev) =>
            prev.map((t) =>
              t.toastId === toast.toastId ? { ...t, showToast: false } : t
            )
          );
          // Remove from array after fade out
          setTimeout(() => {
            setToastNotifications((prev) =>
              prev.filter((t) => t.toastId !== toast.toastId)
            );
          }, 300);
        }, toastDuration);
      });
    }
  }, [
    notifications,
    showToast,
    maxToastNotifications,
    toastDuration,
    toastNotifications,
  ]);
  // Animate badge when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);
  // Handle toast notification click
  const handleToastClick = useCallback(
    (notification: ToastNotification) => {
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
      // Remove the toast
      setToastNotifications((prev) =>
        prev.filter((t) => t.toastId !== notification.toastId)
      );
    },
    [onNotificationClick]
  );
  // Handle toast dismiss
  const handleToastDismiss = useCallback((toastId: string) => {
    setToastNotifications((prev) =>
      prev.map((t) => (t.toastId === toastId ? { ...t, showToast: false } : t))
    );
    setTimeout(() => {
      setToastNotifications((prev) =>
        prev.filter((t) => t.toastId !== toastId)
      );
    }, 300);
  }, []);
  // Get notification icon based on state
  const getNotificationIcon = () => {
    if (unreadCount === 0) {
      return <NotificationsIcon />;
    }
    const hasUrgent = notifications.some(
      (n) =>
        n.status === 'unread' && ['urgent', 'critical'].includes(n.priority)
    );
    return hasUrgent ? <NotificationsActiveIcon /> : <NotificationsIcon />;
  };
  // Get priority color for toast
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'info';
    }
  };
  // Get notification type icon
  const getTypeIcon = (type: string) => {
    return <DotIcon className="" />;
  };
  return (
    <div className="">
      {/* Main notification badge */}
      {showBadge && (
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          className="">
          <Tooltip title={`${unreadCount} unread notifications`}>
            <IconButton
              color={unreadCount > 0 ? 'primary' : 'default'}
              className="">
              {getNotificationIcon()}
            </IconButton>
          </Tooltip>
        </Badge>
      )}
      {/* Urgent notification pulse indicator */}
      {showPulse &&
        notifications.some(
          (n) =>
            n.status === 'unread' && ['urgent', 'critical'].includes(n.priority)
        ) && (
          <div
            className=""
                '50%': {
                  opacity: 0.5,
                  transform: 'scale(1.5)',
                },
              },
          />
        )}
      {/* Toast notifications */}
      {showToast && (
        <div
          className=""
        >
          {toastNotifications.map((notification, index) => (
            <Slide
              key={notification.toastId}
              direction="left"
              in={notification.showToast}
              timeout={300}
              style={{}
                transitionDelay: `${index * 100}ms`,
              >
              <div
                className="".main`,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                onClick={() => handleToastClick(notification)}
              >
                <div className="">
                  <Avatar
                    className="">
                    {getTypeIcon(notification.type)}
                  </Avatar>
                  <div className="">
                    <div
                      className=""
                    >
                      <div
                        
                        className=""
                      >
                        {notification.title}
                      </div>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getPriorityColor(notification.priority) as any}
                        className=""
                      />
                    </div>
                    <div
                      
                      color="text.secondary"
                      className=""
                    >
                      {notification.content}
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    
                    className=""
                  >
                    <CloseIcon className="" />
                  </IconButton>
                </div>
              </div>
            </Slide>
          ))}
        </div>
      )}
      {/* Connection status indicator */}
      <div
        className=""
      />
    </div>
  );
};
export default NotificationIndicators;
