import { Button, Label, Card, CardContent, Select, Spinner, Alert, Separator } from '@/components/ui/button';

interface UnifiedPatientTimelineProps {
  patientId: string;
  maxItems?: number;
  showFilters?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
}
interface TimelineEvent {
  type: 'diagnostic' | 'clinical_note' | 'mtr';
  id: string;
  date: string;
  title: string;
  summary: string;
  priority?: string;
  status?: string;
  data: any;
}
interface TimelineFilters {
  eventType: 'all' | 'diagnostic' | 'clinical_note' | 'mtr';
  startDate: Date | null;
  endDate: Date | null;
  priority: 'all' | 'low' | 'medium' | 'high';
}
const getEventIcon = (type: string) => {
  switch (type) {
    case 'diagnostic':
      return <Science />;
    case 'clinical_note':
      return <NoteAdd />;
    case 'mtr':
      return <Assignment />;
    default:
      return <Science />;
  }
};
const getEventColor = (type: string, priority?: string, status?: string) => {
  if (priority === 'high' || status === 'critical') return 'error';
  if (priority === 'medium' || status === 'urgent') return 'warning';
  switch (type) {
    case 'diagnostic':
      return 'primary';
    case 'clinical_note':
      return 'secondary';
    case 'mtr':
      return 'info';
    default:
      return 'default';
  }
};
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
    case 'processing':
      return 'info';
    case 'failed':
    case 'cancelled':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};
const TimelineEventItem: React.FC<{
  event: TimelineEvent;
  isLast: boolean;
  onEventClick?: (event: TimelineEvent) => void;
}> = ({ event, isLast, onEventClick }) => {
  const [expanded, setExpanded] = useState(false);
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };
  const handleEventClick = () => {
    onEventClick?.(event);
  };
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          color={getEventColor(event.type, event.priority, event.status)}
        >
          {getEventIcon(event.type)}
        </TimelineDot>
        {!isLast && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <Card  className="">
          <CardContent className="">
            <div
              display="flex"
              justifyContent="between"
              alignItems="flex-start"
              mb={1}
            >
              <div flex={1}>
                <div
                  
                  component="div"
                  className=""
                      : {},
                  onClick={handleEventClick}
                >
                  {event.title}
                </div>
                <div  color="textSecondary" gutterBottom>
                  {format(parseISO(event.date), 'PPp')}
                </div>
              </div>
              <div display="flex" alignItems="center" gap={1}>
                {event.priority && (
                  <Chip
                    label={event.priority}
                    size="small"
                    color={getPriorityColor(event.priority)}
                    
                  />
                )}
                {event.status && (
                  <Chip
                    label={event.status}
                    size="small"
                    color={getStatusColor(event.status)}
                    
                  />
                )}
                <IconButton
                  size="small"
                  onClick={handleToggleExpanded}
                  aria-label="expand"
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </div>
            </div>
            <div  color="textSecondary">
              {event.summary}
            </div>
            <Collapse in={expanded}>
              <div mt={2}>
                <Separator className="" />
                <div  gutterBottom>
                  Event Details
                </div>
                {/* Event-specific details */}
                {event.type === 'diagnostic' && (
                  <div>
                    <div  gutterBottom>
                      <strong>Type:</strong> Diagnostic Assessment
                    </div>
                    {event.data?.clinicalContext?.chiefComplaint && (
                      <div  gutterBottom>
                        <strong>Chief Complaint:</strong>{' '}
                        {event.data.clinicalContext.chiefComplaint}
                      </div>
                    )}
                    {event.data?.inputSnapshot?.symptoms?.subjective && (
                      <div  gutterBottom>
                        <strong>Symptoms:</strong>{' '}
                        {event.data.inputSnapshot.symptoms.subjective.join(
                          ', '
                        )}
                      </div>
                    )}
                  </div>
                )}
                {event.type === 'clinical_note' && (
                  <div>
                    <div  gutterBottom>
                      <strong>Type:</strong>{' '}
                      {event.data?.type || 'Clinical Note'}
                    </div>
                    {event.data?.content?.assessment && (
                      <div  gutterBottom>
                        <strong>Assessment:</strong>{' '}
                        {event.data.content.assessment.substring(0, 200)}
                        {event.data.content.assessment.length > 200 && '...'}
                      </div>
                    )}
                    {event.data?.followUpRequired && (
                      <div  gutterBottom>
                        <strong>Follow-up Required:</strong> Yes
                        {event.data.followUpDate &&
                          ` (${format(parseISO(event.data.followUpDate), 'PP')})`}
                      </div>
                    )}
                  </div>
                )}
                {event.type === 'mtr' && (
                  <div>
                    <div  gutterBottom>
                      <strong>Review Number:</strong> {event.data?.reviewNumber}
                    </div>
                    <div  gutterBottom>
                      <strong>Review Type:</strong> {event.data?.reviewType}
                    </div>
                    {event.data?.medications?.length > 0 && (
                      <div  gutterBottom>
                        <strong>Medications:</strong>{' '}
                        {event.data.medications.length} reviewed
                      </div>
                    )}
                    {event.data?.completionPercentage !== undefined && (
                      <div  gutterBottom>
                        <strong>Progress:</strong>{' '}
                        {event.data.completionPercentage}% complete
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Collapse>
          </CardContent>
        </Card>
      </TimelineContent>
    </TimelineItem>
  );
};
export const UnifiedPatientTimeline: React.FC<UnifiedPatientTimelineProps> = ({ 
  patientId,
  maxItems = 20,
  showFilters = true,
  onEventClick
}) => {
  const [filters, setFilters] = useState<TimelineFilters>({ 
    eventType: 'all',
    startDate: null,
    endDate: null,
    priority: 'all'}
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const {
    data: timelineData,
    isLoading,
    error,
    refetch,
  } = useUnifiedPatientTimeline(patientId, {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    limit: maxItems}
  const handleFilterChange = (field: keyof TimelineFilters, value: any) => {
    setFilters((prev) => ({ 
      ...prev,
      [field]: value}
    }));
  };
  const clearFilters = () => {
    setFilters({ 
      eventType: 'all',
      startDate: null,
      endDate: null,
      priority: 'all'}
    });
  };
  const applyFilters = () => {
    refetch();
    setShowFilterPanel(false);
  };
  // Filter events based on client-side filters
  const filteredEvents =
    timelineData?.data?.timeline?.filter((event: TimelineEvent) => {
      if (filters.eventType !== 'all' && event.type !== filters.eventType) {
        return false;
      }
      if (filters.priority !== 'all' && event.priority !== filters.priority) {
        return false;
      }
      return true;
    }) || [];
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div display="flex" alignItems="center" justifyContent="center" p={3}>
            <Spinner />
            <div  ml={2}>
              Loading patient timeline...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load patient timeline. Please try again.
          </Alert>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent>
        <div display="flex" justifyContent="between" alignItems="center" mb={2}>
          <div >Patient Timeline</div>
          {showFilters && (
            <Button
              startIcon={<FilterList />}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              
              size="small"
            >
              Filters
            </Button>
          )}
        </div>
        {/* Filter Panel */}
        <Collapse in={showFilterPanel}>
          <Card  className="">
            <CardContent>
              <div  gutterBottom>
                Filter Timeline Events
              </div>
              <div display="flex" flexWrap="wrap" gap={2} mb={2}>
                <div size="small" className="">
                  <Label>Event Type</Label>
                  <Select
                    value={filters.eventType}
                    onChange={(e) =>
                      handleFilterChange('eventType', e.target.value)}
                    }
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="diagnostic">Diagnostic</MenuItem>
                    <MenuItem value="clinical_note">Clinical Notes</MenuItem>
                    <MenuItem value="mtr">MTR</MenuItem>
                  </Select>
                </div>
                <div size="small" className="">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)}
                    }
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { size: 'small' }
                  />
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { size: 'small' }
                  />
                </LocalizationProvider>
              </div>
              <div display="flex" gap={1}>
                <Button onClick={applyFilters}  size="small">
                  Apply Filters
                </Button>
                <Button onClick={clearFilters}  size="small">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </Collapse>
        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <Alert severity="info">
            No timeline events found for this patient.
          </Alert>
        ) : (
          <Timeline>
            {filteredEvents.map((event: TimelineEvent, index: number) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isLast={index === filteredEvents.length - 1}
                onEventClick={onEventClick}
              />
            ))}
          </Timeline>
        )}
        {filteredEvents.length > 0 && (
          <div mt={2} textAlign="center">
            <div  color="textSecondary">
              Showing {filteredEvents.length} of{' '}
              {timelineData?.data?.count || 0} events
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
