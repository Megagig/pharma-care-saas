import { Button, Input, Label, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Select, Tooltip, Progress, Alert, Switch, Accordion, Tabs } from '@/components/ui/button';
// Grid component removed - using Box with flexbox instead


// Grid component removed - using Box with flexbox instead
// Communication templates for common interventions
const COMMUNICATION_TEMPLATES = {
  medication_change: {
    patient:
      'Based on our medication review, I recommend adjusting your [medication] dosage to improve effectiveness and reduce side effects.',
    prescriber:
      'Following MTR assessment, I recommend [specific change] for [patient name] to optimize therapy outcomes.',
    caregiver:
      'Please note the following medication changes for [patient name] and monitor for [specific effects].',
  },
  adherence_support: {
    patient:
      "Let's discuss strategies to help you take your medications as prescribed. Consider using [specific tools/methods].",
    prescriber:
      'Patient would benefit from adherence support interventions including [specific recommendations].',
    caregiver:
      'Please assist [patient name] with medication adherence using these strategies: [specific methods].',
  },
  monitoring_plan: {
    patient:
      'We need to monitor [specific parameters] to ensure your medications are working safely and effectively.',
    prescriber:
      'Recommend monitoring [parameters] at [frequency] to assess therapy response and safety.',
    caregiver:
      'Please ensure [patient name] follows up for [monitoring requirements] as scheduled.',
  },
  patient_education: {
    patient:
      "Here's important information about your medications: [key points]. Please contact us if you have questions.",
    prescriber:
      'Patient has been educated on [topics]. Additional reinforcement may be beneficial.',
    caregiver:
      'Key medication education points for [patient name]: [educational content].',
  },
};
interface InterventionsDashboardProps {
  reviewId: string;
  onInterventionRecorded?: (intervention: MTRIntervention) => void;
}
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`interventions-tabpanel-${index}`}
      aria-labelledby={`interventions-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
}
const InterventionsDashboard: React.FC<InterventionsDashboardProps> = ({ 
  reviewId,
  onInterventionRecorded
}) => {
  const {
    interventions,
    currentReview,
    recordIntervention,
    updateIntervention,
    markInterventionComplete,
    loading,
    errors,
  } = useMTRStore();
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] =
    useState<MTRIntervention | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  // Form state for new/edit intervention
  const [formData, setFormData] = useState<Partial<CreateInterventionData>>({ 
    reviewId,
    patientId: currentReview?.patientId || '',
    type: 'recommendation',
    category: 'medication_change',
    description: '',
    rationale: '',
    targetAudience: 'patient',
    communicationMethod: 'verbal',
    documentation: '',
    priority: 'medium',
    urgency: 'routine',
    followUpRequired: false,
    followUpDate: ''}
  });
  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingIntervention(null);
      setFormData({ 
        reviewId,
        patientId: currentReview?.patientId || '',
        type: 'recommendation',
        category: 'medication_change',
        description: '',
        rationale: '',
        targetAudience: 'patient',
        communicationMethod: 'verbal',
        documentation: '',
        priority: 'medium',
        urgency: 'routine',
        followUpRequired: false,
        followUpDate: ''}
      });
    }
  }, [isDialogOpen, reviewId, currentReview?.patientId]);
  // Load editing intervention data
  useEffect(() => {
    if (editingIntervention) {
      setFormData({ 
        reviewId: editingIntervention._id || reviewId,
        patientId: currentReview?.patientId || '',
        type: editingIntervention.type,
        category: editingIntervention.category,
        description: editingIntervention.description,
        rationale: editingIntervention.rationale,
        targetAudience: editingIntervention.targetAudience,
        communicationMethod: editingIntervention.communicationMethod,
        documentation: editingIntervention.documentation,
        priority: editingIntervention.priority,
        urgency: editingIntervention.urgency,
        followUpRequired: editingIntervention.followUpRequired,
        followUpDate: editingIntervention.followUpDate
          ? format(new Date(editingIntervention.followUpDate), 'yyyy-MM-dd')
          : ''}
      });
    }
  }, [editingIntervention, reviewId, currentReview?.patientId]);
  // Filter interventions based on current filters
  const filteredInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      // Show completed filter
      if (!showCompleted && intervention.outcome !== 'pending') {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && intervention.type !== filterType) {
        return false;
      }
      // Outcome filter
      if (filterOutcome !== 'all' && intervention.outcome !== filterOutcome) {
        return false;
      }
      return true;
    });
  }, [interventions, showCompleted, filterType, filterOutcome]);
  // Group interventions by status for progress visualization
  const interventionStats = useMemo(() => {
    const stats = {
      total: interventions.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      modified: 0,
      followUpRequired: 0,
      overdue: 0,
    };
    interventions.forEach((intervention) => {
      stats[intervention.outcome as keyof typeof stats]++;
      if (intervention.followUpRequired && !intervention.followUpCompleted) {
        stats.followUpRequired++;
      }
      if (
        intervention.followUpDate &&
        isAfter(new Date(), new Date(intervention.followUpDate))
      ) {
        stats.overdue++;
      }
    });
    return stats;
  }, [interventions]);
  // Handle form input changes
  const handleInputChange = (
    field: keyof CreateInterventionData,
    value: unknown
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Auto-populate template when type/category/audience changes
    if (
      field === 'type' ||
      field === 'category' ||
      field === 'targetAudience'
    ) {
      const updatedData = { ...formData, [field]: value };
      const template =
        COMMUNICATION_TEMPLATES[
          updatedData.category as keyof typeof COMMUNICATION_TEMPLATES
        ]?.[
          updatedData.targetAudience as keyof typeof COMMUNICATION_TEMPLATES.medication_change
        ];
      if (template && !formData.description) {
        setFormData((prev) => ({ 
          ...prev,
          [field]: value,
          description: template}
        }));
      }
    }
  };
  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingIntervention) {
        // Update existing intervention
        await updateIntervention(
          editingIntervention._id!,
          formData as UpdateInterventionData
        );
      } else {
        // Create new intervention
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await recordIntervention(formData as any);
        // Create a mock MTRIntervention for the callback
        const mockIntervention = {
          ...formData,
          _id: 'temp-id',
          workplaceId: 'temp-workplace',
          outcome: 'pending' as const,
          outcomeDetails: '',
          followUpDate: formData.followUpDate || new Date().toISOString(),
          followUpRequired: formData.followUpRequired || false,
          followUpCompleted: false,
          attachments: [],
          pharmacistId: 'current-pharmacist',
          performedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user',
          isDeleted: false,
        } as unknown as MTRIntervention;
        onInterventionRecorded?.(mockIntervention);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save intervention:', error);
    }
  };
  // Handle intervention completion
  const handleCompleteIntervention = async (
    interventionId: string,
    outcome: string,
    details?: string
  ) => {
    try {
      await markInterventionComplete(interventionId, outcome, details);
    } catch (error) {
      console.error('Failed to complete intervention:', error);
    }
  };
  // Get icon for intervention type
  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <LocalHospitalIcon />;
      case 'counseling':
        return <PersonIcon />;
      case 'monitoring':
        return <AssessmentIcon />;
      case 'communication':
        return <PhoneIcon />;
      case 'education':
        return <DescriptionIcon />;
      default:
        return <InfoIcon />;
    }
  };
  // Get color for intervention outcome
  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'modified':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };
  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'error';
      case 'within_24h':
        return 'warning';
      case 'within_week':
        return 'info';
      case 'routine':
        return 'default';
      default:
        return 'default';
    }
  };
  return (
    <div className="">
      {/* Header with stats and actions */}
      <div className="">
        <div
          className=""
        >
          <div
            
            component="h2"
            className=""
          >
            <TimelineIcon />
            Interventions Dashboard
          </div>
          <Button
            
            startIcon={<AddIcon />}
            onClick={() => setIsDialogOpen(true)}
            disabled={loading.recordIntervention}
          >
            Record Intervention
          </Button>
        </div>
        {/* Statistics Cards */}
        <div className="">
          <div className="">
            <div className="">
              <div  color="primary">
                {interventionStats.total}
              </div>
              <div >Total</div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="info.main">
                {interventionStats.pending}
              </div>
              <div >Pending</div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="success.main">
                {interventionStats.accepted}
              </div>
              <div >Accepted</div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="warning.main">
                {interventionStats.followUpRequired}
              </div>
              <div >Follow-up</div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="error.main">
                {interventionStats.overdue}
              </div>
              <div >Overdue</div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="text.secondary">
                {interventionStats.total > 0
                  ? Math.round(
                      (interventionStats.accepted / interventionStats.total) *
                        100
                    )
                  : 0}
                %
              </div>
              <div >Success Rate</div>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        {interventionStats.total > 0 && (
          <div className="">
            <div  className="">
              Intervention Progress (
              {interventionStats.accepted + interventionStats.modified} of{' '}
              {interventionStats.total} completed)
            </div>
            <Progress
              
              className=""
            />
          </div>
        )}
      </div>
      {/* Tabs for different views */}
      <div className="">
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={}
              <Badge badgeContent={interventionStats.pending} color="primary">
                Timeline View
              </Badge>
            }
          />
          <Tab
            label={
              <Badge}
                badgeContent={interventionStats.followUpRequired}
                color="warning"
              >
                Progress Tracking
              </Badge>
            }
          />
          <Tab label="Analytics" />
        </Tabs>
      </div>
      {/* Filters */}
      <div className="">
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div className="">
              <FilterListIcon />
              Filters & Options
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div
              className=""
            >
              <div className="">
                <div fullWidth size="small">
                  <Label>Type</Label>
                  <Select
                    value={filterType}
                    label="Type"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="recommendation">Recommendation</MenuItem>
                    <MenuItem value="counseling">Counseling</MenuItem>
                    <MenuItem value="monitoring">Monitoring</MenuItem>
                    <MenuItem value="communication">Communication</MenuItem>
                    <MenuItem value="education">Education</MenuItem>
                  </Select>
                </div>
              </div>
              <div className="">
                <div fullWidth size="small">
                  <Label>Outcome</Label>
                  <Select
                    value={filterOutcome}
                    label="Outcome"
                    onChange={(e) => setFilterOutcome(e.target.value)}
                  >
                    <MenuItem value="all">All Outcomes</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="modified">Modified</MenuItem>
                  </Select>
                </div>
              </div>
              <div className="">
                <FormControlLabel
                  control={
                    <Switch}
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                    />
                  }
                  label="Show Completed"
                />
              </div>
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
      {/* Error Display */}
      {errors.recordIntervention && (
        <Alert severity="error" className="">
          {errors.recordIntervention}
        </Alert>
      )}
      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Timeline View */}
        {filteredInterventions.length === 0 ? (
          <div className="">
            <TimelineIcon
              className=""
            />
            <div  color="text.secondary">
              No interventions recorded yet
            </div>
            <div  color="text.secondary" className="">
              Start by recording your first intervention for this MTR session
            </div>
            <Button
              
              startIcon={<AddIcon />}
              onClick={() => setIsDialogOpen(true)}
            >
              Record First Intervention
            </Button>
          </div>
        ) : (
          <Timeline>
            {filteredInterventions.map((intervention, index) => (
              <TimelineItem key={intervention._id}>
                <TimelineOppositeContent
                  className=""
                  
                  color="text.secondary"
                >
                  {format(
                    new Date(intervention.performedAt),
                    'MMM dd, yyyy HH:mm'
                  )}
                  <br />
                  <Chip
                    size="small"
                    label={intervention.urgency}
                    color={
                      getUrgencyColor(intervention.urgency) as
                        | 'default'
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'}
                    }
                    className=""
                  />
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    color={
                      getOutcomeColor(intervention.outcome) as
                        | 'inherit'
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'}
                    }
                  >
                    {getInterventionIcon(intervention.type)}
                  </TimelineDot>
                  {index < filteredInterventions.length - 1 && (
                    <TimelineConnector />
                  )}
                </TimelineSeparator>
                <TimelineContent className="">
                  <Card>
                    <CardContent>
                      <div
                        className=""
                      >
                        <div>
                          <div  component="div">
                            {intervention.type.charAt(0).toUpperCase() +
                              intervention.type.slice(1)}
                          </div>
                          <div  color="text.secondary">
                            {intervention.category
                              .replace('_', ' ')
                              .toUpperCase()}
                          </div>
                        </div>
                        <div className="">
                          <Tooltip title="Edit Intervention">
                            <IconButton
                              size="small"
                              >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Chip
                            label={intervention.outcome}
                            color={
                              getOutcomeColor(intervention.outcome) as
                                | 'default'
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'}
                            }
                            size="small"
                          />
                        </div>
                      </div>
                      <div  className="">
                        {intervention.description}
                      </div>
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        <strong>Rationale:</strong> {intervention.rationale}
                      </div>
                      <div
                        className=""
                      >
                        <Chip
                          size="small"
                          icon={<PersonIcon />}
                          label={intervention.targetAudience}
                          
                        />
                        <Chip
                          size="small"
                          icon={
                            intervention.communicationMethod === 'phone' ? (
                              <PhoneIcon />
                            ) : (
                              <EmailIcon />
                            )}
                          }
                          label={intervention.communicationMethod}
                          
                        />
                        <Chip
                          size="small"
                          label={`Priority: ${intervention.priority}`}
                          color={
                            intervention.priority === 'high'
                              ? 'error'
                              : intervention.priority === 'medium'
                              ? 'warning'
                              : 'default'}
                          }
                          
                        />
                      </div>
                      {intervention.followUpRequired && (
                        <Alert
                          severity={
                            intervention.followUpCompleted
                              ? 'success'
                              : 'warning'}
                          }
                          className=""
                        >
                          <div >
                            Follow-up{' '}
                            {intervention.followUpCompleted
                              ? 'completed'
                              : 'required'}
                            {intervention.followUpDate &&
                              ` by ${format(
                                new Date(intervention.followUpDate),
                                'MMM dd, yyyy'
                              )}`}
                          </div>
                        </Alert>
                      )}
                      {intervention.outcome === 'pending' && (
                        <div className="">
                          <Button
                            size="small"
                            
                            color="success"
                            onClick={() =>
                              handleCompleteIntervention(
                                intervention._id!,
                                'accepted'
                              )}
                            }
                          >
                            Mark Accepted
                          </Button>
                          <Button
                            size="small"
                            
                            color="warning"
                            onClick={() =>
                              handleCompleteIntervention(
                                intervention._id!,
                                'modified'
                              )}
                            }
                          >
                            Mark Modified
                          </Button>
                          <Button
                            size="small"
                            
                            color="error"
                            onClick={() =>
                              handleCompleteIntervention(
                                intervention._id!,
                                'rejected'
                              )}
                            }
                          >
                            Mark Rejected
                          </Button>
                        </div>
                      )}
                      {intervention.outcomeDetails && (
                        <div
                          
                          className=""
                        >
                          <strong>Outcome Details:</strong>{' '}
                          {intervention.outcomeDetails}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {/* Progress Tracking View */}
        <div className="">
          {/* Follow-up Required */}
          <div className="">
            <Card>
              <CardContent>
                <div
                  
                  className=""
                >
                  <ScheduleIcon />
                  Follow-up Required
                </div>
                {interventions
                  .filter((i) => i.followUpRequired && !i.followUpCompleted)
                  .map((intervention) => (
                    <div
                      key={intervention._id}
                      className=""
                    >
                      <div >
                        {intervention.description}
                      </div>
                      <div  color="text.secondary">
                        Due:{' '}
                        {intervention.followUpDate
                          ? format(
                              new Date(intervention.followUpDate),
                              'MMM dd, yyyy'
                            )
                          : 'Not specified'}
                      </div>
                      <div  color="text.secondary">
                        {intervention.followUpDate &&
                          formatDistanceToNow(
                            new Date(intervention.followUpDate),
                            { addSuffix: true }
                          )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
          {/* Recent Activity */}
          <div className="">
            <Card>
              <CardContent>
                <div
                  
                  className=""
                >
                  <TrendingUpIcon />
                  Recent Activity
                </div>
                {interventions
                  .sort(
                    (a, b) =>
                      new Date(b.performedAt).getTime() -
                      new Date(a.performedAt).getTime()
                  )
                  .slice(0, 5)
                  .map((intervention) => (
                    <div
                      key={intervention._id}
                      className=""
                    >
                      <div >
                        {intervention.type}
                      </div>
                      <div  color="text.secondary">
                        {formatDistanceToNow(
                          new Date(intervention.performedAt),
                          { addSuffix: true }
                        )}
                      </div>
                      <Chip
                        size="small"
                        label={intervention.outcome}
                        color={
                          getOutcomeColor(intervention.outcome) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'}
                        }
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {/* Analytics View */}
        <div className="">
          <div className="">
            <Card>
              <CardContent>
                <div  className="">
                  Intervention Types
                </div>
                {Object.entries(
                  interventions.reduce((acc, intervention) => {
                    acc[intervention.type] = (acc[intervention.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="">
                    <div className="">
                      <div >{type}</div>
                      <div >{count}</div>
                    </div>
                    <Progress
                      
                      className=""
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card>
              <CardContent>
                <div  className="">
                  Outcome Distribution
                </div>
                {Object.entries(
                  interventions.reduce((acc, intervention) => {
                    acc[intervention.outcome] =
                      (acc[intervention.outcome] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([outcome, count]) => (
                  <div key={outcome} className="">
                    <div className="">
                      <div >{outcome}</div>
                      <div >{count}</div>
                    </div>
                    <Progress
                      
                      color={
                        getOutcomeColor(outcome) as
                          | 'inherit'
                          | 'primary'
                          | 'secondary'
                          | 'error'
                          | 'info'
                          | 'success'
                          | 'warning'}
                      }
                      className=""
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabPanel>
      {/* Intervention Recording Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingIntervention
            ? 'Edit Intervention'
            : 'Record New Intervention'}
        </DialogTitle>
        <DialogContent>
          <div className="">
            <div className="">
              <div fullWidth>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <MenuItem value="recommendation">Recommendation</MenuItem>
                  <MenuItem value="counseling">Counseling</MenuItem>
                  <MenuItem value="monitoring">Monitoring</MenuItem>
                  <MenuItem value="communication">Communication</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <div fullWidth>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) =>
                    handleInputChange('category', e.target.value)}
                  }
                >
                  <MenuItem value="medication_change">
                    Medication Change
                  </MenuItem>
                  <MenuItem value="adherence_support">
                    Adherence Support
                  </MenuItem>
                  <MenuItem value="monitoring_plan">Monitoring Plan</MenuItem>
                  <MenuItem value="patient_education">
                    Patient Education
                  </MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <div fullWidth>
                <Label>Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  label="Target Audience"
                  onChange={(e) =>
                    handleInputChange('targetAudience', e.target.value)}
                  }
                >
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="prescriber">Prescriber</MenuItem>
                  <MenuItem value="caregiver">Caregiver</MenuItem>
                  <MenuItem value="healthcare_team">Healthcare Team</MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <div fullWidth>
                <Label>Communication Method</Label>
                <Select
                  value={formData.communicationMethod}
                  label="Communication Method"
                  onChange={(e) =>
                    handleInputChange('communicationMethod', e.target.value)}
                  }
                >
                  <MenuItem value="verbal">Verbal</MenuItem>
                  <MenuItem value="written">Written</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="fax">Fax</MenuItem>
                  <MenuItem value="in_person">In Person</MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <Input
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)}
                }
                placeholder="Describe the intervention..."
              />
            </div>
            <div className="">
              <Input
                fullWidth
                label="Rationale"
                multiline
                rows={2}
                value={formData.rationale}
                onChange={(e) => handleInputChange('rationale', e.target.value)}
                placeholder="Explain the clinical rationale..."
              />
            </div>
            <div className="">
              <div fullWidth>
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) =>
                    handleInputChange('priority', e.target.value)}
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <div fullWidth>
                <Label>Urgency</Label>
                <Select
                  value={formData.urgency}
                  label="Urgency"
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="within_week">Within Week</MenuItem>
                  <MenuItem value="within_24h">Within 24h</MenuItem>
                  <MenuItem value="immediate">Immediate</MenuItem>
                </Select>
              </div>
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch}
                    checked={formData.followUpRequired}
                    onChange={(e) =>
                      handleInputChange('followUpRequired', e.target.checked)}
                    }
                  />
                }
                label="Follow-up Required"
              />
            </div>
            {formData.followUpRequired && (
              <div className="">
                <Input
                  fullWidth
                  label="Follow-up Date"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) =>
                    handleInputChange('followUpDate', e.target.value)}
                  }
                  
                />
              </div>
            )}
            <div className="">
              <Input
                fullWidth
                label="Documentation"
                multiline
                rows={3}
                value={formData.documentation}
                onChange={(e) =>
                  handleInputChange('documentation', e.target.value)}
                }
                placeholder="Additional documentation and notes..."
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            
            disabled={
              !formData.description ||
              !formData.rationale ||
              loading.recordIntervention}
            }
          >
            {editingIntervention ? 'Update' : 'Record'} Intervention
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default InterventionsDashboard;
