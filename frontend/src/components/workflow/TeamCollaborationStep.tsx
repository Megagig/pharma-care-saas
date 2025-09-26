import { Button, Input, Label, Card, CardContent, Badge, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Avatar } from '@/components/ui/button';
// ===============================
// TYPES AND INTERFACES
// ===============================
interface TeamCollaborationData {
  assignments: Omit<TeamAssignment, '_id' | 'assignedAt'>[];
}
interface TeamCollaborationStepProps {
  onNext: (data: TeamCollaborationData) => void;
  onBack?: () => void;
  onCancel?: () => void;
  initialData?: {
    assignments?: Omit<TeamAssignment, '_id' | 'assignedAt'>[];
  };
  isLoading?: boolean;
}
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  avatar?: string;
}
interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  role: string;
}
// ===============================
// CONSTANTS
// ===============================
const TEAM_ROLES = {
  pharmacist: {
    label: 'Pharmacist',
    description: 'Clinical pharmacist or pharmacy staff',
    icon: '💊',
    color: '#2196f3',
    defaultTasks: [
      'Review medication regimen',
      'Provide patient counseling',
      'Monitor for drug interactions',
      'Assess medication adherence',
    ],
  },
  physician: {
    label: 'Physician',
    description: 'Prescribing physician or medical doctor',
    icon: '🩺',
    color: '#4caf50',
    defaultTasks: [
      'Review clinical recommendations',
      'Approve medication changes',
      'Assess patient condition',
      'Provide medical oversight',
    ],
  },
  nurse: {
    label: 'Nurse',
    description: 'Registered nurse or nursing staff',
    icon: '👩‍⚕️',
    color: '#ff9800',
    defaultTasks: [
      'Monitor patient response',
      'Administer medications',
      'Provide patient education',
      'Report adverse effects',
    ],
  },
  patient: {
    label: 'Patient',
    description: 'The patient receiving care',
    icon: '🧑‍🦱',
    color: '#9c27b0',
    defaultTasks: [
      'Follow medication regimen',
      'Report symptoms or concerns',
      'Attend follow-up appointments',
      'Maintain medication diary',
    ],
  },
  caregiver: {
    label: 'Caregiver',
    description: 'Family member or caregiver',
    icon: '👥',
    color: '#795548',
    defaultTasks: [
      'Assist with medication administration',
      'Monitor patient condition',
      'Provide support and encouragement',
      'Communicate with healthcare team',
    ],
  },
} as const;
const ASSIGNMENT_STATUS = {
  pending: {
    label: 'Pending',
    description: 'Assignment created but not yet started',
    icon: <PendingIcon />,
    color: '#ff9800',
  },
  in_progress: {
    label: 'In Progress',
    description: 'Assignment is currently being worked on',
    icon: <PlayArrowIcon />,
    color: '#2196f3',
  },
  completed: {
    label: 'Completed',
    description: 'Assignment has been completed',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Assignment has been cancelled',
    icon: <CancelIcon />,
    color: '#f44336',
  },
} as const;
const COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'physician_consultation',
    name: 'Physician Consultation Request',
    role: 'physician',
    subject: 'Clinical Intervention Consultation Required',
    content: `Dear Dr. [Name],
I am writing to request your consultation regarding a clinical intervention for [Patient Name].
Clinical Issue: [Issue Description]
Recommended Strategy: [Strategy Details]
Clinical Rationale: [Rationale]
Your input would be valuable in optimizing this patient's care. Please let me know your thoughts or if you would like to discuss this case further.
Best regards,
[Your Name]
Clinical Pharmacist`,
  },
  {
    id: 'patient_counseling',
    name: 'Patient Counseling Session',
    role: 'patient',
    subject: 'Important Information About Your Medications',
    content: `Dear [Patient Name],
We have identified an opportunity to optimize your medication therapy to improve your health outcomes.
What we found: [Issue Description]
What we recommend: [Strategy Details]
Why this helps: [Expected Outcome]
Please schedule an appointment with us to discuss these recommendations in detail. We want to ensure you understand and are comfortable with any changes to your medications.
If you have any questions or concerns, please don't hesitate to contact us.
Best regards,
[Your Name]
Clinical Pharmacist`,
  },
  {
    id: 'nurse_monitoring',
    name: 'Nursing Monitoring Request',
    role: 'nurse',
    subject: 'Enhanced Patient Monitoring Required',
    content: `Dear [Nurse Name],
We have initiated a clinical intervention for [Patient Name] that requires enhanced monitoring.
Intervention Details: [Strategy Details]
Monitoring Parameters: [Specific Parameters]
Frequency: [Monitoring Schedule]
Alert Criteria: [When to Contact Pharmacist/Physician]
Please document all observations and contact me immediately if you notice any concerning changes.
Thank you for your collaboration in ensuring optimal patient care.
Best regards,
[Your Name]
Clinical Pharmacist`,
  },
];
// ===============================
// MAIN COMPONENT
// ===============================
const TeamCollaborationStep: React.FC<TeamCollaborationStepProps> = ({ 
  onNext,
  onBack,
  onCancel,
  initialData,
  isLoading = false
}) => {
  // State
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CommunicationTemplate | null>(null);
  const [showAssignmentHistory, setShowAssignmentHistory] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  // Queries
  const { data: workplaceUsersData, isLoading: loadingUsers } =
    useWorkplaceUsers();
  // Available users for assignment
  const availableUsers = useMemo(() => {
    return workplaceUsersData?.data?.users || [];
  }, [workplaceUsersData]);
  // Form setup
  const defaultValues: TeamCollaborationData = useMemo(
    () => ({ 
      assignments: initialData?.assignments || []}
    }),
    [initialData?.assignments]
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<TeamCollaborationData>({ 
    defaultValues,
    mode: 'onChange'}
  });
  const { fields, append, remove } = useFieldArray({ 
    control,
    name: 'assignments'}
  });
  const watchedAssignments = watch('assignments');
  // ===============================
  // HANDLERS
  // ===============================
  const handleAddAssignment = () => {
    append({ 
      userId: '',
      role: 'pharmacist',
      task: '',
      status: 'pending',
      notes: ''}
    });
  };
  const handleRemoveAssignment = (index: number) => {
    remove(index);
  };
  const handleRoleChange = (index: number, role: string) => {
    setValue(`assignments.${index}.role`, role as TeamAssignment['role']);
    // Set default task based on role
    const roleConfig = TEAM_ROLES[role as keyof typeof TEAM_ROLES];
    if (roleConfig && roleConfig.defaultTasks.length > 0) {
      setValue(`assignments.${index}.task`, roleConfig.defaultTasks[0]);
    }
  };
  const handleGenerateTemplate = (
    assignment: TeamAssignment,
    templateId: string
  ) => {
    const template = COMMUNICATION_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowTemplateDialog(true);
    }
  };
  const onSubmit = (data: TeamCollaborationData) => {
    onNext(data);
  };
  // ===============================
  // RENDER HELPERS
  // ===============================
  const renderTeamOverview = () => {
    const roleCount = watchedAssignments.reduce((acc, assignment) => {
      acc[assignment.role] = (acc[assignment.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return (
      <Card className="">
        <CardContent>
          <div
            
            gutterBottom
            className=""
          >
            <GroupIcon color="primary" />
            Team Overview
          </div>
          <div container spacing={2}>
            {Object.entries(TEAM_ROLES).map(([roleKey, roleConfig]) => (
              <div item xs={6} sm={4} md={2} key={roleKey}>
                <div
                  className="">
                  <div  component="div">
                    {roleConfig.icon}
                  </div>
                  <div  fontWeight="medium">
                    {roleConfig.label}
                  </div>
                  <Badge
                    badgeContent={roleCount[roleKey] || 0}
                    color="primary"
                    className=""
                  >
                    <AssignmentIcon color="action" />
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div
            className=""
          >
            <div  color="text.secondary">
              Total assignments: {watchedAssignments.length}
            </div>
            <div>
              <Button
                size="small"
                startIcon={<HistoryIcon />}
                onClick={() => setShowAssignmentHistory(true)}
                className=""
              >
                View History
              </Button>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddAssignment}
                
              >
                Add Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderAssignmentForm = (index: number) => {
    const assignment = watchedAssignments[index];
    if (!assignment) return null;
    const roleConfig = TEAM_ROLES[assignment.role];
    const statusConfig = ASSIGNMENT_STATUS[assignment.status];
    return (
      <Card
        key={index}
        className=""
      >
        <CardContent>
          <div
            className=""
          >
            <div className="">
              <div  component="span">
                {roleConfig.icon}
              </div>
              <div  fontWeight="medium">
                Assignment {index + 1}
              </div>
              <Chip
                size="small"
                label={statusConfig.label}
                color={statusConfig.color as any}
                icon={statusConfig.icon}
              />
            </div>
            <IconButton
              size="small"
              onClick={() => handleRemoveAssignment(index)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </div>
          <div container spacing={2}>
            <div item xs={12} md={6}>
              <Controller
                name={`assignments.${index}.role`}
                control={control}
                
                render={({  field  }) => (
                  <div
                    fullWidth
                    error={!!errors.assignments?.[index]?.role}
                  >
                    <Label>Team Role</Label>
                    <Select
                      {...field}
                      label="Team Role"
                      >
                      {Object.entries(TEAM_ROLES).map(([value, config]) => (
                        <MenuItem key={value} value={value}>
                          <div
                            className=""
                          >
                            <div >
                              {config.icon}
                            </div>
                            <div>
                              <div >
                                {config.label}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.assignments?.[index]?.role && (
                      <p>
                        {errors.assignments[index]?.role?.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <div item xs={12} md={6}>
              <Controller
                name={`assignments.${index}.userId`}
                control={control}
                
                render={({  field  }) => (
                  <Autocomplete
                    {...field}
                    options={availableUsers}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option}
                        : `${option.firstName} ${option.lastName} (${option.role})`
                    }
                    loading={loadingUsers}
                    onChange={(_, value) => field.onChange(value?._id || '')}
                    value={
                      availableUsers.find((user) => user._id === field.value) ||
                      null}
                    }
                    renderInput={(params) => (
                      <Input}
                        {...params}
                        label="Select Team Member"
                        placeholder="Search by name or role..."
                        error={!!errors.assignments?.[index]?.userId}
                        helperText={
                          errors.assignments?.[index]?.userId?.message}
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>{loadingUsers && (}
                                <Spinner color="inherit" size={20} />
                              )}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                      />
                    )}
                    renderOption={(props, option) => (}
                      <div component="li" {...props}>
                        <divAvatar>
                          <Avatar src={option.avatar}>
                            {option.firstName[0]}
                            {option.lastName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <div>
                          <div >
                            {option.firstName} {option.lastName}
                          </div>
                          <div  color="text.secondary">
                            {option.role} • {option.email}
                          </div>
                        </div>
                      </div>
                    )}
                    noOptionsText="No team members found"
                  />
                )}
              />
            </div>
            <div item xs={12}>
              <Controller
                name={`assignments.${index}.task`}
                control={control}
                rules={{
                  required: 'Task description is required',
                  minLength: {
                    value: 10,
                    message: 'Task must be at least 10 characters',}
                  },
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Task Description"
                    placeholder="Describe the specific task or responsibility..."
                    error={!!errors.assignments?.[index]?.task}
                    helperText={errors.assignments?.[index]?.task?.message}
                  />
                )}
              />
              {roleConfig.defaultTasks.length > 0 && (
                <div className="">
                  <div
                    
                    color="text.secondary"
                    className=""
                  >
                    Suggested tasks for {roleConfig.label}:
                  </div>
                  <div className="">
                    {roleConfig.defaultTasks.map((task, taskIndex) => (
                      <Chip
                        key={taskIndex}
                        label={task}
                        size="small"
                        
                        onClick={() =>}
                          setValue(`assignments.${index}.task`, task)
                        }
                        className=""
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div item xs={12} md={6}>
              <Controller
                name={`assignments.${index}.status`}
                control={control}
                render={({  field  }) => (
                  <div fullWidth>
                    <Label>Status</Label>
                    <Select {...field} label="Status">
                      {Object.entries(ASSIGNMENT_STATUS).map(
                        ([value, config]) => (
                          <MenuItem key={value} value={value}>
                            <div
                              className=""
                            >
                              {config.icon}
                              <div>
                                <div >
                                  {config.label}
                                </div>
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </div>
                )}
              />
            </div>
            <div item xs={12} md={6}>
              <div
                className=""
              >
                <Button
                  
                  size="small"
                  startIcon={<TemplateIcon />}
                  onClick={() => {
                    const template = COMMUNICATION_TEMPLATES.find(
                      (t) => t.role === assignment.role
                    );
                    if (template) {
                      handleGenerateTemplate(assignment, template.id);}
                    }
                  disabled={!assignment.role}
                >
                  Generate Template
                </Button>
                <Button
                  
                  size="small"
                  startIcon={<EmailIcon />}
                  disabled={!assignment.userId}
                >
                  Send Email
                </Button>
              </div>
            </div>
            <div item xs={12}>
              <Controller
                name={`assignments.${index}.notes`}
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Additional Notes (Optional)"
                    placeholder="Any additional instructions or context..."
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderAssignmentsList = () => (
    <Card className="">
      <CardContent>
        <div  gutterBottom>
          Team Assignments
        </div>
        <div  color="text.secondary" className="">
          Assign specific tasks to team members for collaborative intervention
          implementation
        </div>
        {fields.length === 0 ? (
          <div className="">
            <GroupIcon color="disabled" className="" />
            <div  color="text.secondary">
              No team assignments yet
            </div>
            <div  color="text.secondary" className="">
              Add team members to collaborate on this intervention
            </div>
            <Button
              
              startIcon={<AddIcon />}
              onClick={handleAddAssignment}
            >
              Add First Assignment
            </Button>
          </div>
        ) : (
          <div>{fields.map((field, index) => renderAssignmentForm(index))}</div>
        )}
      </CardContent>
    </Card>
  );
  const renderTemplateDialog = () => (
    <Dialog
      open={showTemplateDialog}
      onClose={() => setShowTemplateDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Communication Template</DialogTitle>
      <DialogContent>
        {selectedTemplate && (
          <div>
            <div  gutterBottom>
              {selectedTemplate.name}
            </div>
            <Input
              fullWidth
              label="Subject"
              value={selectedTemplate.subject}
              margin="normal"
              
            />
            <Input
              fullWidth
              multiline
              rows={10}
              label="Message Content"
              value={selectedTemplate.content}
              margin="normal"
              
            />
            <Alert severity="info" className="">
              This template can be customized with specific patient and
              intervention details. Placeholders like [Patient Name] and [Issue
              Description] should be replaced with actual values.
            </Alert>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowTemplateDialog(false)}>Close</Button>
        <Button >Copy Template</Button>
      </DialogActions>
    </Dialog>
  );
  const renderAssignmentHistory = () => (
    <Dialog
      open={showAssignmentHistory}
      onClose={() => setShowAssignmentHistory(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Assignment History</DialogTitle>
      <DialogContent>
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <AssignmentIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div  component="span">
                Assignment Created
              </div>
              <div>Initial team assignments configured</div>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="secondary">
                <EmailIcon />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <div  component="span">
                Notifications Sent
              </div>
              <div>
                Team members notified of their assignments
              </div>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAssignmentHistory(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
  return (
    <div>
      <div  gutterBottom>
        Step 3: Team Collaboration
      </div>
      <div  color="text.secondary" className="">
        Assign tasks to healthcare team members for collaborative intervention
        implementation
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderTeamOverview()}
        {renderAssignmentsList()}
        {renderTemplateDialog()}
        {renderAssignmentHistory()}
        <div className="">
          <div>
            <Button
              
              onClick={onCancel}
              disabled={isLoading}
              className=""
            >
              Cancel
            </Button>
            <Button  onClick={onBack} disabled={isLoading}>
              Back
            </Button>
          </div>
          <Button
            type="submit"
            
            disabled={!isValid || isLoading}
            startIcon={isLoading ? <Spinner size={20} /> : null}
          >
            {isLoading ? 'Processing...' : 'Next: Outcome Tracking'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default TeamCollaborationStep;
