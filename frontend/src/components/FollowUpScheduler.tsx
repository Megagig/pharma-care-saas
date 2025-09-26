import { Button, Input, Label, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Select, Tooltip, Progress, Alert, Accordion, Tabs } from '@/components/ui/button';

interface FollowUpSchedulerProps {
  reviewId: string;
  interventions: MTRIntervention[];
  onFollowUpScheduled?: (followUp: MTRFollowUp) => void;
  onFollowUpUpdated?: (
    followUpId: string,
    updates: Partial<MTRFollowUp>
  ) => void;
  onFollowUpCompleted?: (
    followUpId: string,
    outcome: Record<string, unknown>
  ) => void;
}
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ 
  children,
  value,
  index,
  ...other })
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`followup-tabpanel-${index}`}
      aria-labelledby={`followup-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};
const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({ 
  reviewId,
  interventions,
  onFollowUpScheduled,
  onFollowUpUpdated,
  onFollowUpCompleted
}) => {
  const {
    followUps,
    scheduleFollowUp,
    updateFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    loading,
    errors,
  } = useMTRStore();
  // Available interventions for linking to follow-ups (for future use)
  const availableInterventions = interventions || [];
  console.log('Available interventions:', availableInterventions.length);
  const { addNotification } = useUIStore();
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<MTRFollowUp | null>(
    null
  );
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<MTRFollowUp | null>(
    null
  );
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  // Form state for new/edit follow-up
  const [formData, setFormData] = useState<Partial<MTRFollowUp>>({ 
    type: 'phone_call',
    priority: 'medium',
    description: '',
    objectives: [],
    scheduledDate: new Date().toISOString(),
    estimatedDuration: 30,
    assignedTo: '',
    status: 'scheduled',
    relatedInterventions: []}
  });
  // Outcome form state
  const [outcomeData, setOutcomeData] = useState({ 
    status: 'successful' as
      | 'successful'
      | 'partially_successful'
      | 'unsuccessful',
    notes: '',
    nextActions: [] as string[],
    nextFollowUpDate: undefined as string | undefined,
    adherenceImproved: false,
    problemsResolved: [] as string[],
    newProblemsIdentified: [] as string[]}
  });
  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({ 
    newDate: new Date().toISOString(),
    reason: ''}
  });
  // Filter follow-ups by status
  const scheduledFollowUps = followUps.filter((f) => f.status === 'scheduled');
  const completedFollowUps = followUps.filter((f) => f.status === 'completed');
  const overdueFollowUps = followUps.filter(
    (f) =>
      f.status === 'scheduled' &&
      f.scheduledDate &&
      isBefore(new Date(f.scheduledDate), new Date())
  );
  const upcomingFollowUps = followUps.filter(
    (f) =>
      f.status === 'scheduled' &&
      f.scheduledDate &&
      isAfter(new Date(f.scheduledDate), new Date())
  );
  // Handle form changes
  const handleFormChange = (field: keyof MTRFollowUp, value: unknown) => {
    if (field === 'scheduledDate' && value instanceof Date) {
      setFormData((prev) => ({ ...prev, [field]: value.toISOString() }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };
  // Handle objectives array changes
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...(formData.objectives || [])];
    newObjectives[index] = value;
    setFormData((prev) => ({ ...prev, objectives: newObjectives }));
  };
  const addObjective = () => {
    setFormData((prev) => ({ 
      ...prev,
      objectives: [...(prev.objectives || []), '']}
    }));
  };
  const removeObjective = (index: number) => {
    const newObjectives = [...(formData.objectives || [])];
    newObjectives.splice(index, 1);
    setFormData((prev) => ({ ...prev, objectives: newObjectives }));
  };
  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!formData.description?.trim()) {
        addNotification({ 
          title: 'Validation Error',
          message: 'Description is required',
          type: 'error'}
        });
        return;
      }
      if (!formData.scheduledDate) {
        addNotification({ 
          title: 'Validation Error',
          message: 'Scheduled date is required',
          type: 'error'}
        });
        return;
      }
      if (!formData.assignedTo?.trim()) {
        addNotification({ 
          title: 'Validation Error',
          message: 'Assigned pharmacist is required',
          type: 'error'}
        });
        return;
      }
      const followUpData: MTRFollowUp = {
        ...formData,
        reviewId,
        patientId: '', // This would come from the current review
        objectives: formData.objectives?.filter((obj) => obj.trim()) || [],
        reminders: [],
      } as MTRFollowUp;
      if (editingFollowUp) {
        await updateFollowUp(editingFollowUp._id!, followUpData);
        onFollowUpUpdated?.(editingFollowUp._id!, followUpData);
        addNotification({ 
          title: 'Success',
          message: 'Follow-up updated successfully',
          type: 'success'}
        });
      } else {
        await scheduleFollowUp(followUpData);
        onFollowUpScheduled?.(followUpData);
        addNotification({ 
          title: 'Success',
          message: 'Follow-up scheduled successfully',
          type: 'success'}
        });
      }
      handleCloseDialog();
    } catch (error) {
      addNotification({ 
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to save follow-up',
        type: 'error'}
      });
    }
  };
  // Handle outcome submission
  const handleOutcomeSubmit = async () => {
    if (!selectedFollowUp) return;
    try {
      if (!outcomeData.notes.trim()) {
        addNotification({ 
          title: 'Validation Error',
          message: 'Outcome notes are required',
          type: 'error'}
        });
        return;
      }
      await completeFollowUp(selectedFollowUp._id!, outcomeData);
      onFollowUpCompleted?.(selectedFollowUp._id!, outcomeData);
      addNotification({ 
        title: 'Success',
        message: 'Follow-up completed successfully',
        type: 'success'}
      });
      setOutcomeDialogOpen(false);
      setSelectedFollowUp(null);
    } catch (error) {
      addNotification({ 
        title: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to complete follow-up',
        type: 'error'}
      });
    }
  };
  // Handle reschedule submission
  const handleRescheduleSubmit = async () => {
    if (!selectedFollowUp) return;
    try {
      if (!rescheduleData.reason.trim()) {
        addNotification({ 
          title: 'Validation Error',
          message: 'Reschedule reason is required',
          type: 'error'}
        });
        return;
      }
      await rescheduleFollowUp(
        selectedFollowUp._id!,
        rescheduleData.newDate,
        rescheduleData.reason
      );
      addNotification({ 
        title: 'Success',
        message: 'Follow-up rescheduled successfully',
        type: 'success'}
      });
      setRescheduleDialogOpen(false);
      setSelectedFollowUp(null);
    } catch (error) {
      addNotification({ 
        title: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to reschedule follow-up',
        type: 'error'}
      });
    }
  };
  // Dialog handlers
  const handleOpenDialog = (followUp?: MTRFollowUp) => {
    if (followUp) {
      setEditingFollowUp(followUp);
      setFormData(followUp);
    } else {
      setEditingFollowUp(null);
      setFormData({ 
        type: 'phone_call',
        priority: 'medium',
        description: '',
        objectives: [],
        scheduledDate: new Date().toISOString(),
        estimatedDuration: 30,
        assignedTo: '',
        status: 'scheduled',
        relatedInterventions: []}
      });
    }
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFollowUp(null);
    setFormData({});
  };
  const handleOpenOutcomeDialog = (followUp: MTRFollowUp) => {
    setSelectedFollowUp(followUp);
    setOutcomeData({ 
      status: 'successful',
      notes: '',
      nextActions: [],
      nextFollowUpDate: undefined,
      adherenceImproved: false,
      problemsResolved: [],
      newProblemsIdentified: []}
    });
    setOutcomeDialogOpen(true);
  };
  const handleOpenRescheduleDialog = (followUp: MTRFollowUp) => {
    setSelectedFollowUp(followUp);
    setRescheduleData({ 
      newDate: addDays(new Date(followUp.scheduledDate), 1).toISOString(),
      reason: ''}
    });
    setRescheduleDialogOpen(true);
  };
  // Get follow-up type icon
  const getFollowUpTypeIcon = (type: string) => {
    switch (type) {
      case 'phone_call':
        return <PhoneIcon />;
      case 'appointment':
        return <CalendarIcon />;
      case 'lab_review':
        return <ScienceIcon />;
      case 'adherence_check':
        return <AssignmentIcon />;
      case 'outcome_assessment':
        return <AssessmentIcon />;
      default:
        return <ScheduleIcon />;
    }
  };
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'missed':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'rescheduled':
        return 'warning';
      default:
        return 'primary';
    }
  };
  // Render follow-up card
  const renderFollowUpCard = (followUp: MTRFollowUp) => {
    const isOverdue =
      followUp.status === 'scheduled' &&
      followUp.scheduledDate &&
      isBefore(new Date(followUp.scheduledDate), new Date());
    const daysUntil = followUp.scheduledDate
      ? differenceInDays(new Date(followUp.scheduledDate), new Date())
      : 0;
    return (
      <Card
        key={followUp._id}
        className=""
      >
        <CardContent>
          <div
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <div display="flex" alignItems="center" gap={1}>
              {getFollowUpTypeIcon(followUp.type)}
              <div  component="div">
                {followUp.description}
              </div>
              <Chip
                label={followUp.priority}
                color={
                  getPriorityColor(followUp.priority) as
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
              <Chip
                label={followUp.status}
                color={
                  getStatusColor(followUp.status) as
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
            <div>
              {followUp.status === 'scheduled' && (
                <>
                  <Tooltip title="Complete Follow-up">
                    <IconButton
                      onClick={() => handleOpenOutcomeDialog(followUp)}
                      color="success"
                      size="small"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reschedule">
                    <IconButton
                      onClick={() => handleOpenRescheduleDialog(followUp)}
                      color="warning"
                      size="small"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Tooltip title="Edit Follow-up">
                <IconButton
                  onClick={() => handleOpenDialog(followUp)}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div
            className="">
            <div className="">
              <div display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarIcon fontSize="small" />
                <div >
                  {followUp.scheduledDate
                    ? format(new Date(followUp.scheduledDate), 'PPP p')
                    : 'No date set'}
                </div>
                {isOverdue && (
                  <Chip label="OVERDUE" color="error" size="small" />
                )}
                {daysUntil > 0 && daysUntil <= 7 && (
                  <Chip
                    label={`${daysUntil} days`}
                    color="warning"
                    size="small"
                  />
                )}
              </div>
              <div display="flex" alignItems="center" gap={1} mb={1}>
                <AccessTimeIcon fontSize="small" />
                <div >
                  {followUp.estimatedDuration} minutes
                </div>
              </div>
              <div display="flex" alignItems="center" gap={1}>
                <PersonIcon fontSize="small" />
                <div >
                  Assigned to: {followUp.assignedTo}
                </div>
              </div>
            </div>
            <div className="">
              {followUp.objectives && followUp.objectives.length > 0 && (
                <div>
                  <div  gutterBottom>
                    Objectives:
                  </div>
                  <List dense>
                    {followUp.objectives.map((objective, index) => (
                      <div key={index} className="">
                        <div
                          primary={objective}
                          
                        />
                      </div>
                    ))}
                  </List>
                </div>
              )}
            </div>
          </div>
          {followUp.outcome && (
            <Accordion className="">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div >
                  Outcome ({followUp.outcome.status})
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div  paragraph>
                  {followUp.outcome.notes}
                </div>
                {followUp.outcome.nextActions &&
                  followUp.outcome.nextActions.length > 0 && (
                    <div>
                      <div  gutterBottom>
                        Next Actions:
                      </div>
                      <List dense>
                        {followUp.outcome.nextActions.map((action, index) => (
                          <div key={index} className="">
                            <div
                              primary={action}
                              
                            />
                          </div>
                        ))}
                      </List>
                    </div>
                  )}
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  };
  return (
      <div>
        {/* Header */}
        <div
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <div  component="h2">
            Follow-Up Scheduler
          </div>
          <Button
            
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading.scheduleFollowUp}
          >
            Schedule Follow-Up
          </Button>
        </div>
        {/* Error Alert */}
        {errors.scheduleFollowUp && (
          <Alert severity="error" className="">
            {errors.scheduleFollowUp}
          </Alert>
        )}
        {/* Loading */}
        {loading.scheduleFollowUp && <Progress className="" />}
        {/* Summary Cards */}
        <div className="">
          <div className="">
            <div className="">
              <div  color="primary">
                {scheduledFollowUps.length}
              </div>
              <div  color="text.secondary">
                Scheduled
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="error">
                {overdueFollowUps.length}
              </div>
              <div  color="text.secondary">
                Overdue
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="success">
                {completedFollowUps.length}
              </div>
              <div  color="text.secondary">
                Completed
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="warning">
                {upcomingFollowUps.length}
              </div>
              <div  color="text.secondary">
                Upcoming
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab
              label={}
                <Badge badgeContent={overdueFollowUps.length} color="error">
                  Overdue
                </Badge>
              }
            />
            <Tab
              label={}
                <Badge badgeContent={upcomingFollowUps.length} color="primary">
                  Upcoming
                </Badge>
              }
            />
            <Tab label="All Scheduled" />
            <Tab label="Completed" />
          </Tabs>
        </div>
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {overdueFollowUps.length === 0 ? (
            <Alert severity="success">No overdue follow-ups</Alert>
          ) : (
            overdueFollowUps.map(renderFollowUpCard)
          )}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {upcomingFollowUps.length === 0 ? (
            <Alert severity="info">No upcoming follow-ups scheduled</Alert>
          ) : (
            upcomingFollowUps.map(renderFollowUpCard)
          )}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {scheduledFollowUps.length === 0 ? (
            <Alert severity="info">No scheduled follow-ups</Alert>
          ) : (
            scheduledFollowUps.map(renderFollowUpCard)
          )}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {completedFollowUps.length === 0 ? (
            <Alert severity="info">No completed follow-ups</Alert>
          ) : (
            completedFollowUps.map(renderFollowUpCard)
          )}
        </TabPanel>
        {/* Schedule/Edit Follow-Up Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingFollowUp ? 'Edit Follow-Up' : 'Schedule New Follow-Up'}
          </DialogTitle>
          <DialogContent>
            <div className="">
              <div className="">
                <div fullWidth>
                  <Label>Type</Label>
                  <Select
                    value={formData.type || 'phone_call'}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="phone_call">Phone Call</MenuItem>
                    <MenuItem value="appointment">Appointment</MenuItem>
                    <MenuItem value="lab_review">Lab Review</MenuItem>
                    <MenuItem value="adherence_check">Adherence Check</MenuItem>
                    <MenuItem value="outcome_assessment">
                      Outcome Assessment
                    </MenuItem>
                  </Select>
                </div>
              </div>
              <div className="">
                <div fullWidth>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority || 'medium'}
                    onChange={(e) =>
                      handleFormChange('priority', e.target.value)}
                    }
                    label="Priority"
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </div>
              </div>
              <div className="">
                <Input
                  fullWidth
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    handleFormChange('description', e.target.value)}
                  }
                  multiline
                  rows={2}
                  required
                />
              </div>
              <div className="">
                <DateTimePicker
                  label="Scheduled Date & Time"
                  value={
                    formData.scheduledDate
                      ? new Date(formData.scheduledDate)
                      : new Date()}
                  }
                  onChange={(date) => handleFormChange('scheduledDate', date)}
                  required
                />
              </div>
              <div className="">
                <Input
                  fullWidth
                  label="Estimated Duration (minutes)"
                  type="number"
                  value={formData.estimatedDuration || 30}
                  onChange={(e) =>
                    handleFormChange(
                      'estimatedDuration',
                      parseInt(e.target.value)
                    )}
                  }
                  
                />
              </div>
              <div className="">
                <Input
                  fullWidth
                  label="Assigned To"
                  value={formData.assignedTo || ''}
                  onChange={(e) =>
                    handleFormChange('assignedTo', e.target.value)}
                  }
                  placeholder="Pharmacist name or ID"
                  required
                />
              </div>
              <div className="">
                <div  gutterBottom>
                  Objectives
                </div>
                {(formData.objectives || []).map((objective, index) => (
                  <div key={index} display="flex" gap={1} mb={1}>
                    <Input
                      fullWidth
                      size="small"
                      value={objective}
                      onChange={(e) =>
                        handleObjectiveChange(index, e.target.value)}
                      }
                      placeholder={`Objective ${index + 1}`}
                    />
                    <IconButton
                      onClick={() => removeObjective(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addObjective}
                  size="small"
                >
                  Add Objective
                </Button>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              
              disabled={loading.scheduleFollowUp}
            >
              {editingFollowUp ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Complete Follow-Up Dialog */}
        <Dialog
          open={outcomeDialogOpen}
          onClose={() => setOutcomeDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Complete Follow-Up</DialogTitle>
          <DialogContent>
            <div className="">
              <div className="">
                <div fullWidth>
                  <Label>Outcome Status</Label>
                  <Select
                    value={outcomeData.status}
                    onChange={(e) =>
                      setOutcomeData((prev) => ({ 
                        ...prev,
                        status: e.target.value as
                          | 'successful'
                          | 'partially_successful' })
                          | 'unsuccessful',}
                      }))
                    }
                    label="Outcome Status"
                  >
                    <MenuItem value="successful">Successful</MenuItem>
                    <MenuItem value="partially_successful">
                      Partially Successful
                    </MenuItem>
                    <MenuItem value="unsuccessful">Unsuccessful</MenuItem>
                  </Select>
                </div>
              </div>
              <div className="">
                <Input
                  fullWidth
                  label="Outcome Notes"
                  value={outcomeData.notes}
                  onChange={(e) =>
                    setOutcomeData((prev) => ({ 
                      ...prev}
                      notes: e.target.value,}
                    }))
                  }
                  multiline
                  rows={4}
                  required
                />
              </div>
              <div className="">
                <DateTimePicker
                  label="Next Follow-Up Date (Optional)"
                  value={
                    outcomeData.nextFollowUpDate
                      ? new Date(outcomeData.nextFollowUpDate)
                      : undefined}
                  }
                  onChange={(date) =>
                    setOutcomeData((prev) => ({ 
                      ...prev}
                      nextFollowUpDate: date ? date.toISOString() : undefined,}
                    }))
                  }
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOutcomeDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleOutcomeSubmit}
              
              disabled={loading.completeFollowUp}
            >
              Complete Follow-Up
            </Button>
          </DialogActions>
        </Dialog>
        {/* Reschedule Dialog */}
        <Dialog
          open={rescheduleDialogOpen}
          onClose={() => setRescheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reschedule Follow-Up</DialogTitle>
          <DialogContent>
            <div className="">
              <div className="">
                <DateTimePicker
                  label="New Date & Time"
                  value={new Date(rescheduleData.newDate)}
                  onChange={(date) =>
                    setRescheduleData((prev) => ({ 
                      ...prev}
                      newDate: (date || new Date()).toISOString(),}
                    }))
                  }
                  required
                />
              </div>
              <div className="">
                <Input
                  fullWidth
                  label="Reason for Rescheduling"
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData((prev) => ({ 
                      ...prev}
                      reason: e.target.value,}
                    }))
                  }
                  multiline
                  rows={2}
                  required
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              
              disabled={loading.rescheduleFollowUp}
            >
              Reschedule
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
};
export default FollowUpScheduler;
