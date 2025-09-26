import { Button, Label, Card, CardContent, Select, Spinner, Alert, Avatar, Separator } from '@/components/ui/button';
format,
  parseISO,
  isToday,
  isYesterday,
  differenceInMinutes,

interface AuditEvent {
  _id: string;
  action: string;
  timestamp: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  targetId: string;
  targetType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  details: {
    conversationId?: string;
    messageId?: string;
    patientId?: string;
    fileName?: string;
    metadata?: Record<string, any>;
  };
  duration?: number;
  ipAddress: string;
}
interface AuditTrailVisualizationProps {
  conversationId: string;
  height?: string;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}
const AuditTrailVisualization: React.FC<AuditTrailVisualizationProps> = ({ 
  conversationId,
  height = '600px',
  showFilters = true,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds })
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ 
    action: '',
    riskLevel: '',
    userId: '',
    success: ''}
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  // Fetch audit trail
  const fetchAuditTrail = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      const response = await fetch(
        `/api/communication/audit/conversation/${conversationId}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch audit trail');
      }
      const data = await response.json();
      setEvents(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch audit trail'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAuditTrail();
  }, [conversationId, filters]);
  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchAuditTrail, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, conversationId, filters]);
  // Get icon for action type
  const getActionIcon = (action: string, riskLevel: string) => {
    const iconProps = {
      fontSize: 'small' as const,
      color: getRiskColor(riskLevel),
    };
    switch (action) {
      case 'message_sent':
        return <MessageIcon {...iconProps} />;
      case 'message_read':
        return <VisibilityIcon {...iconProps} />;
      case 'message_edited':
        return <EditIcon {...iconProps} />;
      case 'message_deleted':
        return <DeleteIcon {...iconProps} />;
      case 'conversation_created':
      case 'conversation_updated':
        return <GroupIcon {...iconProps} />;
      case 'participant_added':
      case 'participant_removed':
        return <PersonIcon {...iconProps} />;
      case 'file_uploaded':
      case 'file_downloaded':
        return <AttachFileIcon {...iconProps} />;
      default:
        return <SecurityIcon {...iconProps} />;
    }
  };
  // Get risk level color
  const getRiskColor = (
    riskLevel: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (riskLevel) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };
  // Format action name
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
  };
  // Get time difference for timeline spacing
  const getTimeDifference = (current: string, previous?: string) => {
    if (!previous) return 0;
    return differenceInMinutes(parseISO(current), parseISO(previous));
  };
  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };
  // Group events by time periods
  const groupEventsByPeriod = (events: AuditEvent[]) => {
    const groups: { [key: string]: AuditEvent[] } = {};
    events.forEach((event) => {
      const date = parseISO(event.timestamp);
      let key: string;
      if (isToday(date)) {
        key = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
      } else {
        key = format(date, 'MMMM dd, yyyy');
      }
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });
    return groups;
  };
  const eventGroups = groupEventsByPeriod(events);
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div
          className=""
        >
          <div
            
            className=""
          >
            <TimelineIcon />
            Audit Trail Visualization
            <Chip
              size="small"
              label={`Conversation: ${conversationId.slice(-8)}`}
            />
          </div>
          <div className="">
            {showFilters && (
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                variant={showFiltersPanel ? 'contained' : 'outlined'}
                size="small"
              >
                Filters
              </Button>
            )}
            <Button
              onClick={fetchAuditTrail}
              disabled={loading}
              size="small"
              
            >
              Refresh
            </Button>
          </div>
        </div>
        {/* Filters Panel */}
        <Collapse in={showFiltersPanel}>
          <Card  className="">
            <CardContent>
              <div container spacing={2}>
                <div item xs={12} sm={6} md={3}>
                  <div fullWidth size="small">
                    <Label>Action</Label>
                    <Select
                      value={filters.action}
                      onChange={(e) =>
                        setFilters((prev) => ({ 
                          ...prev}
                          action: e.target.value,}
                        }))
                      }
                      label="Action"
                    >
                      <MenuItem value="">All Actions</MenuItem>
                      <MenuItem value="message_sent">Message Sent</MenuItem>
                      <MenuItem value="message_read">Message Read</MenuItem>
                      <MenuItem value="message_edited">Message Edited</MenuItem>
                      <MenuItem value="participant_added">
                        Participant Added
                      </MenuItem>
                      <MenuItem value="file_uploaded">File Uploaded</MenuItem>
                    </Select>
                  </div>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <div fullWidth size="small">
                    <Label>Risk Level</Label>
                    <Select
                      value={filters.riskLevel}
                      onChange={(e) =>
                        setFilters((prev) => ({ 
                          ...prev}
                          riskLevel: e.target.value,}
                        }))
                      }
                      label="Risk Level"
                    >
                      <MenuItem value="">All Levels</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </div>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <div fullWidth size="small">
                    <Label>Status</Label>
                    <Select
                      value={filters.success}
                      onChange={(e) =>
                        setFilters((prev) => ({ 
                          ...prev}
                          success: e.target.value,}
                        }))
                      }
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Success</MenuItem>
                      <MenuItem value="false">Failed</MenuItem>
                    </Select>
                  </div>
                </div>
                <div item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    
                    onClick={() =>
                      setFilters({ 
                        action: '',
                        riskLevel: '',
                        userId: ''}
                        success: '',}
                      })
                    }
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Collapse>
      </div>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Loading State */}
      {loading && (
        <div className="">
          <Spinner />
        </div>
      )}
      {/* Timeline Content */}
      {!loading && (
        <div className="">
          {Object.keys(eventGroups).length === 0 ? (
            <div className="">
              <div color="text.secondary">
                No audit events found for this conversation
              </div>
            </div>
          ) : (
            Object.entries(eventGroups).map(([period, periodEvents]) => (
              <div key={period} className="">
                <div  className="">
                  {period}
                </div>
                <Timeline>
                  {periodEvents.map((event, index) => {
                    const isExpanded = expandedEvents.has(event._id);
                    const timeDiff = getTimeDifference(
                      event.timestamp,
                      index > 0 ? periodEvents[index - 1].timestamp : undefined
                    );
                    return (
                      <TimelineItem key={event._id}>
                        <TimelineOppositeContent
                          className=""
                        >
                          <div  color="text.secondary">
                            {format(parseISO(event.timestamp), 'HH:mm:ss')}
                          </div>
                          {event.duration && (
                            <div
                              
                              color="text.secondary"
                            >
                              {event.duration}ms
                            </div>
                          )}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={getRiskColor(event.riskLevel)}>
                            {getActionIcon(event.action, event.riskLevel)}
                          </TimelineDot>
                          {index < periodEvents.length - 1 && (
                            <TimelineConnector />
                          )}
                        </TimelineSeparator>
                        <TimelineContent className="">
                          <Card
                            
                            className="" onClick={() => toggleEventExpansion(event._id)}
                          >
                            <CardContent className="">
                              <div
                                className=""
                              >
                                <div>
                                  <div
                                    
                                    fontWeight="medium"
                                  >
                                    {formatAction(event.action)}
                                  </div>
                                  <div
                                    className=""
                                  >
                                    <Avatar
                                      className=""
                                    >
                                      {event.userId.firstName[0]}
                                      {event.userId.lastName[0]}
                                    </Avatar>
                                    <div >
                                      {event.userId.firstName}{' '}
                                      {event.userId.lastName}
                                    </div>
                                    <Chip
                                      size="small"
                                      label={event.userId.role}
                                      
                                    />
                                  </div>
                                </div>
                                <div
                                  className=""
                                >
                                  <Chip
                                    size="small"
                                    label={event.success ? 'Success' : 'Failed'}
                                    color={event.success ? 'success' : 'error'}
                                    
                                  />
                                  <IconButton size="small">
                                    {isExpanded ? (
                                      <ExpandLessIcon />
                                    ) : (
                                      <ExpandMoreIcon />
                                    )}
                                  </IconButton>
                                </div>
                              </div>
                              <Collapse in={isExpanded}>
                                <Separator className="" />
                                <div container spacing={2}>
                                  <div item xs={12} sm={6}>
                                    <div
                                      
                                      color="text.secondary"
                                    >
                                      Target Details
                                    </div>
                                    <div >
                                      Type: {event.targetType}
                                    </div>
                                    <div
                                      
                                      className=""
                                    >
                                      ID: {event.targetId}
                                    </div>
                                    {event.details.messageId && (
                                      <div >
                                        Message:{' '}
                                        {event.details.messageId.slice(-8)}
                                      </div>
                                    )}
                                    {event.details.fileName && (
                                      <div >
                                        File: {event.details.fileName}
                                      </div>
                                    )}
                                  </div>
                                  <div item xs={12} sm={6}>
                                    <div
                                      
                                      color="text.secondary"
                                    >
                                      Security Info
                                    </div>
                                    <div >
                                      Risk Level: {event.riskLevel}
                                    </div>
                                    <div >
                                      IP: {event.ipAddress}
                                    </div>
                                    <div >
                                      Timestamp:{' '}
                                      {formatTimestamp(event.timestamp)}
                                    </div>
                                  </div>
                                  {event.details.metadata && (
                                    <div item xs={12}>
                                      <div
                                        
                                        color="text.secondary"
                                      >
                                        Additional Details
                                      </div>
                                      <div
                                        
                                        className=""
                                      >
                                        <pre
                                          >
                                          {JSON.stringify(
                                            event.details.metadata,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Collapse>
                            </CardContent>
                          </Card>
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default AuditTrailVisualization;
