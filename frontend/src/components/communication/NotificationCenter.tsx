import NotificationItem from './NotificationItem';

import { Button, Input, Badge, Tooltip, Alert, Skeleton, Switch, Separator } from '@/components/ui/button';

interface NotificationCenterProps {
  maxHeight?: string;
  showHeader?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onNotificationClick?: (notification: CommunicationNotification) => void;
}
interface NotificationFilters {
  type?: string;
  priority?: string;
  status?: string;
  search?: string;
}
interface NotificationPreferences {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  groupSimilar: boolean;
}
const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  maxHeight = '600px',
  showHeader = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onNotificationClick
}) => {
  // Store state
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    loading,
    errors,
  } = useCommunicationStore();
  // Local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreferences>({ 
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
    groupSimilar: true
  });
  const [lastPlayedSound, setLastPlayedSound] = useState<number>(0);
  // Notification sound
  const playNotificationSound = useCallback(() => {
    if (!preferences.soundEnabled) return;
    const now = Date.now();
    // Throttle sound to prevent spam
    if (now - lastPlayedSound < 1000) return;
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(console.warn);
      setLastPlayedSound(now);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [preferences.soundEnabled, lastPlayedSound]);
  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);
  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  // Play sound for new notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(
      (n) => n.status === 'unread'
    );
    if (unreadNotifications.length > 0) {
      playNotificationSound();
    }
  }, [notifications, playNotificationSound]);
  // Desktop notifications
  useEffect(() => {
    if (!preferences.desktopNotifications) return;
    const requestPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };
    requestPermission();
  }, [preferences.desktopNotifications]);
  // Show desktop notification for new urgent notifications
  useEffect(() => {
    if (
      !preferences.desktopNotifications ||
      Notification.permission !== 'granted'
    )
      return;
    const urgentNotifications = notifications.filter(
      (n) => n.status === 'unread' && ['urgent', 'high'].includes(n.priority)
    );
    urgentNotifications.forEach((notification) => {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/icons/notification-icon.png',
        tag: notification._id,
        requireInteraction: notification.priority === 'urgent',
      };
    });
  }, [notifications, preferences.desktopNotifications]);
  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    // Apply filters
    if (filters.type) {
      filtered = filtered.filter((n) => n.type === filters.type);
    }
    if (filters.priority) {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }
    if (filters.status) {
      filtered = filtered.filter((n) => n.status === filters.status);
    }
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }
    // Group similar notifications if enabled
    if (preferences.groupSimilar) {
      const grouped = new Map<string, CommunicationNotification[]>();
      filtered.forEach((notification) => {
        const key = `${notification.type}_${
          notification.data.conversationId || 'general'
        }`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(notification);
      });
      // Return the most recent notification from each group
      filtered = Array.from(grouped.values()).map(
        (group) =>
          group.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
      );
    }
    // Sort by priority and date
    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority =
        priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority =
        priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, filters, searchQuery, preferences.groupSimilar]);
  // Event handlers
  const handleNotificationClick = useCallback(
    (notification: CommunicationNotification) => {
      if (notification.status === 'unread') {
        markNotificationAsRead(notification._id);
      }
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
    },
    [markNotificationAsRead, onNotificationClick]
  );
  const handleMarkAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
    setAnchorEl(null);
  }, [markAllNotificationsAsRead]);
  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  const handleFilterChange = useCallback(
    (key: keyof NotificationFilters, value: string) => {
      setFilters((prev) => ({ 
        ...prev,
        [key]: value === 'all' ? undefined : value}
      }));
      setFilterAnchorEl(null);
    },
    []
  );
  const handlePreferenceChange = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      setPreferences((prev) => ({ 
        ...prev,
        [key]: value}
      }));
    },
    []
  );
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);
  // Render loading state
  if (loading.fetchNotifications) {
    return (
      <div className="">
        {showHeader && (
          <div className="">
            <NotificationsIcon className="" />
            <div >Notifications</div>
          </div>
        )}
        <List>
          {[...Array(5)].map((_, index) => (
            <div key={index}>
              <Skeleton  width="100%" height={60} />
            </div>
          ))}
        </List>
      </div>
    );
  }
  return (
    <div
      className=""
    >
      {showHeader && (
        <div className="">
          <div
            className=""
          >
            <div className="">
              <Badge badgeContent={unreadCount} color="error" className="">
                <NotificationsIcon />
              </Badge>
              <div >Notifications</div>
            </div>
            <div className="">
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter">
                <IconButton
                  size="small"
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  color={
                    Object.keys(filters).length > 0 ? 'primary' : 'default'}
                  }
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton
                  size="small"
                  onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <MarkAllReadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </div>
          {/* Search */}
          <Input
            fullWidth
            size="small"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">}
                  <IconButton size="small" onClick={() =>setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
          />
          {/* Active filters */}
          {(Object.keys(filters).length > 0 || searchQuery) && (
            <div
              className=""
            >
              {Object.entries(filters).map(
                ([key, value]) =>
                  value && (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      onDelete={() =>
                        handleFilterChange(
                          key as keyof NotificationFilters,
                          'all'
                        )}
                      }
                    />
                  )
              )}
              {searchQuery && (
                <Chip
                  label={`Search: ${searchQuery}`}
                  size="small"
                  onDelete={() => setSearchQuery('')}
                />
              )}
              <Button size="small" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Error state */}
      {errors.fetchNotifications && (
        <Alert severity="error" className="">
          {errors.fetchNotifications}
        </Alert>
      )}
      {/* Notifications list */}
      <div className="">
        {filteredNotifications.length === 0 ? (
          <div className="">
            <NotificationsIcon
              className=""
            />
            <div  color="text.secondary">
              {notifications.length === 0
                ? 'No notifications yet'
                : 'No notifications match your filters'}
            </div>
          </div>
        ) : (
          <List className="">
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <NotificationItem
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDismiss={() => removeNotification(notification._id)}
                />
                {index < filteredNotifications.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </List>
        )}
      </div>
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => handleFilterChange('status', 'unread')}>
          Unread only
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'read')}>
          Read only
        </MenuItem>
        <Separator />
        <MenuItem onClick={() => handleFilterChange('priority', 'urgent')}>
          Urgent priority
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('priority', 'high')}>
          High priority
        </MenuItem>
        <Separator />
        <MenuItem onClick={() => handleFilterChange('type', 'new_message')}>
          Messages only
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('type', 'clinical_alert')}>
          Clinical alerts
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('type', 'mention')}>
          Mentions only
        </MenuItem>
      </Menu>
      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 250 }>
        <div className="">
          <div  gutterBottom>
            Notification Preferences
          </div>
          <FormControlLabel
            control={
              <Switch}
                checked={preferences.soundEnabled}
                onChange={(e) =>
                  handlePreferenceChange('soundEnabled', e.target.checked)}
                }
              />
            }
            label={
              <div className="">
                {preferences.soundEnabled ? (
                  <SoundOnIcon className="" />
                ) : (
                  <SoundOffIcon className="" />}
                )}
                Sound notifications
              </div>
            }
          />
          <FormControlLabel
            control={
              <Switch}
                checked={preferences.desktopNotifications}
                onChange={(e) =>
                  handlePreferenceChange(
                    'desktopNotifications',
                    e.target.checked
                  )}
                }
              />
            }
            label="Desktop notifications"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  handlePreferenceChange('emailNotifications', e.target.checked)}
                }
              />
            }
            label="Email notifications"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={preferences.groupSimilar}
                onChange={(e) =>
                  handlePreferenceChange('groupSimilar', e.target.checked)}
                }
              />
            }
            label="Group similar notifications"
          />
        </div>
      </Menu>
    </div>
  );
};
export default NotificationCenter;
