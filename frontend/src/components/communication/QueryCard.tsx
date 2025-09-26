import { Button, Card, CardContent, Tooltip, Progress, Avatar, Separator } from '@/components/ui/button';

interface QueryCardProps {
  query: Conversation;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onAction?: (action: string, queryId: string) => void;
  compact?: boolean;
  showPatientInfo?: boolean;
}
const QueryCard: React.FC<QueryCardProps> = ({ 
  query,
  selected = false,
  onSelect,
  onClick,
  onAction,
  compact = false,
  showPatientInfo = true
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  // Get priority color and icon
  const getPriorityConfig = () => {
    switch (query.priority) {
      case 'urgent':
        return {
          color: 'error.main',
          bgcolor: 'error.light',
          icon: <PriorityHigh />,
          label: 'Urgent',
        };
      case 'high':
        return {
          color: 'warning.main',
          bgcolor: 'warning.light',
          icon: <Warning />,
          label: 'High',
        };
      case 'low':
        return {
          color: 'info.main',
          bgcolor: 'info.light',
          icon: <Info />,
          label: 'Low',
        };
      default:
        return {
          color: 'text.secondary',
          bgcolor: 'grey.100',
          icon: <Flag />,
          label: 'Normal',
        };
    }
  };
  // Get status color and icon
  const getStatusConfig = () => {
    switch (query.status) {
      case 'resolved':
        return {
          color: 'success.main',
          bgcolor: 'success.light',
          icon: <CheckCircle />,
          label: 'Resolved',
        };
      case 'archived':
        return {
          color: 'text.disabled',
          bgcolor: 'grey.200',
          icon: <Archive />,
          label: 'Archived',
        };
      default:
        return {
          color: 'primary.main',
          bgcolor: 'primary.light',
          icon: <Schedule />,
          label: 'Active',
        };
    }
  };
  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };
  // Get query title
  const getQueryTitle = () => {
    if (query.title) {
      return query.title;
    }
    // Generate title based on clinical context or participants
    if (query.metadata?.clinicalContext?.diagnosis) {
      return `Query about ${query.metadata.clinicalContext.diagnosis}`;
    }
    return 'Patient Query';
  };
  // Get query description
  const getQueryDescription = () => {
    const participants = query.participants
      .filter((p) => p.role !== 'patient')
      .map((p) => p.role)
      .join(', ');
    return `Involving: ${participants}`;
  };
  // Get assigned healthcare providers
  const getAssignedProviders = () => {
    return query.participants.filter((p) => p.role !== 'patient');
  };
  // Calculate query progress (mock calculation based on status and time)
  const getQueryProgress = () => {
    if (query.status === 'resolved') return 100;
    if (query.status === 'archived') return 0;
    // Mock progress based on time elapsed
    const createdAt = new Date(query.createdAt);
    const now = new Date();
    const hoursElapsed =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    // Assume 24 hours is 100% for active queries
    return Math.min(Math.round((hoursElapsed / 24) * 100), 90);
  };
  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setMenuAnchor(null);
    onAction?.(action, query._id);
  };
  // Handle menu click
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };
  // Handle card click
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };
  // Handle checkbox change
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onSelect?.(event.target.checked);
  };
  // Get available actions
  const getAvailableActions = () => {
    const actions = [
      { key: 'view', label: 'View Details', icon: <Visibility /> },
      { key: 'reply', label: 'Reply', icon: <Reply /> },
      { key: 'edit', label: 'Edit Query', icon: <Edit /> },
    ];
    if (query.status === 'active') {
      actions.push(
        { key: 'assign', label: 'Assign', icon: <Assignment /> },
        { key: 'escalate', label: 'Escalate', icon: <PriorityHigh /> },
        { key: 'resolve', label: 'Mark as Resolved', icon: <CheckCircle /> },
        { key: 'archive', label: 'Archive', icon: <Archive /> }
      );
    }
    if (query.status === 'archived') {
      actions.push({ key: 'unarchive', label: 'Unarchive', icon: <Archive /> });
    }
    actions.push(
      { key: 'forward', label: 'Forward', icon: <Forward /> },
      { key: 'delete', label: 'Delete', icon: <Delete />, danger: true }
    );
    return actions;
  };
  const priorityConfig = getPriorityConfig();
  const statusConfig = getStatusConfig();
  const assignedProviders = getAssignedProviders();
  const queryProgress = getQueryProgress();
  const availableActions = getAvailableActions();
  return (
    <>
      <Card
        
        className=""
          border: selected ? 2 : 1,
          borderColor: selected ? 'primary.main' : 'divider',
          position: 'relative',
          textAlign: 'left',
          width: '100%',
          ...(onClick && {
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            }, },
        onClick={handleCardClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? getQueryTitle() : undefined}
      >
        {/* Priority indicator */}
        <div
          className=""
        />
        <CardContent className="">
          {/* Header */}
          <div
            className=""
          >
            {/* Selection checkbox */}
            {onSelect && (
              <Checkbox
                checked={selected}
                onChange={handleCheckboxChange}
                size="small"
                className=""
              />
            )}
            {/* Content */}
            <div className="">
              {/* Title and status */}
              <div
                className=""
              >
                <div
                  variant={compact ? 'body1' : 'h6'}
                  component="h3"
                  noWrap
                  className=""
                >
                  {getQueryTitle()}
                </div>
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  size="small"
                  className="" />
                <Chip
                  icon={priorityConfig.icon}
                  label={priorityConfig.label}
                  size="small"
                  className="" />
              </div>
              {/* Description */}
              {!compact && (
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {getQueryDescription()}
                </div>
              )}
              {/* Metadata */}
              <div
                className=""
              >
                {/* Patient info */}
                {showPatientInfo && query.patientId && (
                  <div className="">
                    <Person className="" />
                    <div  color="text.secondary">
                      Patient ID: {query.patientId.slice(-6)}
                    </div>
                  </div>
                )}
                {/* Case ID */}
                {query.caseId && (
                  <div className="">
                    <Assignment
                      className=""
                    />
                    <div  color="text.secondary">
                      Case: {query.caseId}
                    </div>
                  </div>
                )}
                {/* Created time */}
                <div className="">
                  <AccessTime className="" />
                  <div  color="text.secondary">
                    {formatTime(query.createdAt)}
                  </div>
                </div>
                {/* Last message time */}
                <div className="">
                  <Message className="" />
                  <div  color="text.secondary">
                    Last: {formatTime(query.lastMessageAt)}
                  </div>
                </div>
              </div>
              {/* Tags */}
              {query.tags && query.tags.length > 0 && (
                <div
                  className=""
                >
                  {query.tags.slice(0, compact ? 2 : 4).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      
                      className=""
                    />
                  ))}
                  {query.tags.length > (compact ? 2 : 4) && (
                    <div  color="text.secondary">
                      +{query.tags.length - (compact ? 2 : 4)} more
                    </div>
                  )}
                </div>
              )}
              {/* Clinical context */}
              {query.metadata?.clinicalContext && !compact && (
                <div className="">
                  {query.metadata.clinicalContext.diagnosis && (
                    <div
                      
                      color="text.secondary"
                      display="block"
                    >
                      Diagnosis: {query.metadata.clinicalContext.diagnosis}
                    </div>
                  )}
                  {query.metadata.clinicalContext.medications &&
                    query.metadata.clinicalContext.medications.length > 0 && (
                      <div
                        
                        color="text.secondary"
                        display="block"
                      >
                        Medications:{' '}
                        {query.metadata.clinicalContext.medications.length}{' '}
                        items
                      </div>
                    )}
                </div>
              )}
              {/* Progress bar for active queries */}
              {query.status === 'active' && !compact && (
                <div className="">
                  <div
                    className=""
                  >
                    <div  color="text.secondary">
                      Query Progress
                    </div>
                    <div  color="text.secondary">
                      {queryProgress}%
                    </div>
                  </div>
                  <Progress
                    
                    className=""
                  />
                </div>
              )}
              {/* Assigned providers */}
              <div
                className=""
              >
                <div className="">
                  <div  color="text.secondary">
                    Assigned to:
                  </div>
                  <AvatarGroup
                    max={3}
                    className="">
                    {assignedProviders.map((provider, index) => (
                      <Tooltip key={provider.userId} title={provider.role}>
                        <Avatar className="">
                          {provider.role.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </div>
                {/* Menu button */}
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  className=""
                  aria-label="More options"
                >
                  <MoreVert />
                </IconButton>
              </div>
            </div>
          </div>
        </CardContent>
        {/* Quick actions */}
        {!compact && (
          <>
            <Separator />
            <CardActions className="">
              <Button
                size="small"
                startIcon={<Reply />}
                >
                Reply
              </Button>
              {query.status === 'active' && (
                <>
                  <Button
                    size="small"
                    startIcon={<Assignment />}
                    >
                    Assign
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CheckCircle />}
                    >
                    Resolve
                  </Button>
                </>
              )}
              <div className="" />
              <div  color="text.secondary">
                ID: {query._id.slice(-6)}
              </div>
            </CardActions>
          </>
        )}
      </Card>
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
export default QueryCard;
