import { Button, Label, Card, CardContent, Select, Spinner, Alert, Tabs } from '@/components/ui/button';
useClinicalIntervention,
  useUpdateIntervention,

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <div className="">{children}</div>}
  </div>
);

const ClinicalInterventionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState(0);

  // API queries
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useClinicalIntervention(id || '');
  const updateMutation = useUpdateIntervention();

  const intervention = response?.data;

  const handleStatusChange = async (
    newStatus:
      | 'identified'
      | 'planning'
      | 'in_progress'
      | 'implemented'
      | 'completed'
      | 'cancelled'
  ) => {
    if (id) {
      await updateMutation.mutateAsync({ 
        interventionId: id}
        updates: { status: newStatus }
      refetch();
    }
  };

  const getPriorityColor = (
    priority: string
  ): 'error' | 'warning' | 'info' | 'default' => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'info' | 'primary' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'implemented':
        return 'primary';
      case 'planning':
        return 'warning';
      case 'identified':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div display="flex" justifyContent="center" p={4}>
        <Spinner />
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <Alert severity="error" className="">
        {error?.message || 'Failed to load intervention details'}
      </Alert>
    );
  }

  return (
    <div p={3}>
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div>
          <div  component="h1" gutterBottom>
            Clinical Intervention Details
          </div>
          <div display="flex" gap={1}>
            <Chip
              label={intervention.priority.toUpperCase()}
              color={getPriorityColor(intervention.priority)}
            />
            <Chip
              label={intervention.status
                .replace(/_/g, ' ')}
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              color={getStatusColor(intervention.status)}
            />
          </div>
        </div>
        <div display="flex" gap={2}>
          <Button
            
            startIcon={<EditIcon />}
            onClick={() => navigate(`/interventions/${id}/edit`)}
          >
            Edit
          </Button>
          <div size="small" className="">
            <Label>Status</Label>
            <Select
              value={intervention.status}
              label="Status"
              onChange={(e) =>
                handleStatusChange(
                  e.target.value as
                    | 'identified'
                    | 'planning'
                    | 'in_progress'
                    | 'implemented'
                    | 'completed'
                    | 'cancelled'
                )}
              }
            >
              <MenuItem value="identified">Identified</MenuItem>
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="implemented">Implemented</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <Card className="">
        <CardContent>
          <div  gutterBottom>
            Patient Information
          </div>
          <div display="flex" flexWrap="wrap" gap={2}>
            <div className="">
              <div display="flex" alignItems="center" gap={2}>
                <PersonIcon color="action" />
                <div>
                  <div  fontWeight="medium">
                    {intervention.patient
                      ? `${intervention.patient.firstName} ${intervention.patient.lastName}`
                      : 'Unknown Patient'}
                  </div>
                  {intervention.patient?.dateOfBirth && (
                    <div  color="text.secondary">
                      DOB:{' '}
                      {format(
                        parseISO(intervention.patient.dateOfBirth),
                        'MMM dd, yyyy'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="">
              <div display="flex" gap={2}>
                {intervention.patient?.phoneNumber && (
                  <div display="flex" alignItems="center" gap={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <div >
                      {intervention.patient.phoneNumber}
                    </div>
                  </div>
                )}
                {intervention.patient?.email && (
                  <div display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <div >
                      {intervention.patient.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div display="flex" flexWrap="wrap" gap={2}>
        <div className="">
          <div className="">
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              className=""
            >
              <Tab label="Overview" />
              <Tab label="Strategies" />
              <Tab label="Outcomes" />
              <Tab label="Timeline" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Issue Description
                  </div>
                  <div  paragraph>
                    {intervention.issueDescription}
                  </div>

                  <div  gutterBottom>
                    Intervention Details
                  </div>
                  <div  color="text.secondary">
                    Category:{' '}
                    {intervention.category
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                  <div  color="text.secondary">
                    Priority: {intervention.priority.toUpperCase()}
                  </div>
                  <div  color="text.secondary">
                    Status:{' '}
                    {intervention.status
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Card>
                <CardContent>
                  <div
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <div >Strategies</div>
                    <Button
                      
                      startIcon={<AddIcon />}
                      onClick={() => console.log('Add Strategy')}
                    >
                      Add Strategy
                    </Button>
                  </div>
                  <div  color="text.secondary">
                    No strategies have been added yet.
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Card>
                <CardContent>
                  <div
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <div >Outcomes</div>
                    <Button
                      
                      startIcon={<TrendingUpIcon />}
                      onClick={() => console.log('Record Outcome')}
                    >
                      Record Outcome
                    </Button>
                  </div>
                  <div  color="text.secondary">
                    No outcomes have been recorded yet.
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Card>
                <CardContent>
                  <div  gutterBottom>
                    Intervention Timeline
                  </div>
                  <Timeline>
                    <TimelineItem>
                      <TimelineOppositeContent color="text.secondary">
                        {format(
                          parseISO(intervention.createdAt),
                          'MMM dd, yyyy HH:mm'
                        )}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary">
                          <InfoIcon />
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <div  component="span">
                          Intervention Created
                        </div>
                        <div>Issue identified and recorded</div>
                      </TimelineContent>
                    </TimelineItem>

                    {intervention.updatedAt &&
                      intervention.updatedAt !== intervention.createdAt && (
                        <TimelineItem>
                          <TimelineOppositeContent color="text.secondary">
                            {format(
                              parseISO(intervention.updatedAt),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="info">
                              <EditIcon />
                            </TimelineDot>
                          </TimelineSeparator>
                          <TimelineContent>
                            <div  component="span">
                              Intervention Updated
                            </div>
                            <div>Last modification made</div>
                          </TimelineContent>
                        </TimelineItem>
                      )}
                  </Timeline>
                </CardContent>
              </Card>
            </TabPanel>
          </div>
        </div>

        <div className="">
          <Card>
            <CardContent>
              <div  gutterBottom>
                Quick Actions
              </div>
              <div display="flex" flexDirection="column" gap={1}>
                <Button
                  
                  startIcon={<AssignmentIcon />}
                  onClick={() => console.log('Assign Team Member')}
                  fullWidth
                >
                  Assign Team Member
                </Button>
                <Button
                  
                  startIcon={<TrendingUpIcon />}
                  onClick={() => console.log('Record Outcome')}
                  fullWidth
                >
                  Record Outcome
                </Button>
                <Button
                  
                  startIcon={<ScheduleIcon />}
                  onClick={() => console.log('Schedule Follow-up')}
                  fullWidth
                >
                  Schedule Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClinicalInterventionDetails;
