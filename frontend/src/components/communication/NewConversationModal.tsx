import { Button, Input, Label, Dialog, DialogContent, DialogTitle, Select, Alert, Avatar, Separator } from '@/components/ui/button';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  patientId?: string;
  onConversationCreated?: (conversation: Conversation) => void;
}
interface ParticipantOption {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'pharmacist' | 'doctor' | 'patient';
  avatar?: string;
}
interface SelectedParticipant {
  userId: string;
  role: 'pharmacist' | 'doctor' | 'patient';
  permissions?: string[];
}
const NewConversationModal: React.FC<NewConversationModalProps> = ({ 
  open,
  onClose,
  patientId,
  onConversationCreated
}) => {
  const { createConversation, loading, errors } = useCommunicationStore();
  const { data: patientsResponse } = usePatients() || { data: null };
  // Extract patients array from the response, handling different possible structures
  const patients = React.useMemo(() => {
    if (!patientsResponse) return [];
    // Handle different response structures
    if (Array.isArray(patientsResponse)) {
      return patientsResponse;
    }
    if (patientsResponse.data && Array.isArray(patientsResponse.data)) {
      return patientsResponse.data;
    }
    if (patientsResponse.results && Array.isArray(patientsResponse.results)) {
      return patientsResponse.results;
    }
    if (patientsResponse.patients && Array.isArray(patientsResponse.patients)) {
      return patientsResponse.patients;
    }
    return [];
  }, [patientsResponse]);
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [conversationType, setConversationType] = useState<
    'direct' | 'group' | 'patient_query'
  >('direct');
  const [conversationTitle, setConversationTitle] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>(
    patientId || ''
  );
  const [selectedParticipants, setSelectedParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [priority, setPriority] = useState<
    'low' | 'normal' | 'high' | 'urgent'
  >('normal');
  const [tags, setTags] = useState<string[]>([]);
  const [caseId, setCaseId] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  // Mock data for healthcare providers (in real app, this would come from API)
  const mockHealthcareProviders: ParticipantOption[] = [
    {
      userId: 'pharmacist-1',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@pharmacy.com',
      role: 'pharmacist',
    },
    {
      userId: 'pharmacist-2',
      firstName: 'Dr. Michael',
      lastName: 'Chen',
      email: 'michael.chen@pharmacy.com',
      role: 'pharmacist',
    },
    {
      userId: 'doctor-1',
      firstName: 'Dr. Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@hospital.com',
      role: 'doctor',
    },
    {
      userId: 'doctor-2',
      firstName: 'Dr. James',
      lastName: 'Wilson',
      email: 'james.wilson@clinic.com',
      role: 'doctor',
    },
  ];
  // Convert patients to participant options
  const patientOptions: ParticipantOption[] = patients.map((patient) => ({ 
    userId: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email || '',
    role: 'patient' as const}
  }));
  // All available participants
  const allParticipants = [...mockHealthcareProviders, ...patientOptions];
  // Steps for the wizard
  const steps = ['Type & Details', 'Participants', 'Settings'];
  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setConversationType(patientId ? 'patient_query' : 'direct');
      setConversationTitle('');
      setSelectedPatient(patientId || '');
      setSelectedParticipants([]);
      setPriority('normal');
      setTags([]);
      setCaseId('');
      setParticipantSearch('');
    }
  }, [open, patientId]);
  // Handle participant selection
  const handleAddParticipant = (participant: ParticipantOption) => {
    const isAlreadySelected = selectedParticipants.some(
      (p) => p.userId === participant.userId
    );
    if (!isAlreadySelected) {
      setSelectedParticipants((prev) => [
        ...prev,
        {
          userId: participant.userId,
          role: participant.role,
          permissions: getDefaultPermissions(participant.role),
        },
      ]);
    }
  };
  // Handle participant removal
  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.userId !== userId));
  };
  // Get default permissions for role
  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'pharmacist':
        return ['read', 'write', 'manage_medications'];
      case 'doctor':
        return ['read', 'write', 'manage_diagnosis'];
      case 'patient':
        return ['read', 'write'];
      default:
        return ['read'];
    }
  };
  // Get participant display name
  const getParticipantName = (userId: string): string => {
    const participant = allParticipants.find((p) => p.userId === userId);
    return participant
      ? `${participant.firstName} ${participant.lastName}`
      : 'Unknown';
  };
  // Get participant role
  const getParticipantRole = (userId: string): string => {
    const participant = allParticipants.find((p) => p.userId === userId);
    return participant?.role || 'unknown';
  };
  // Validate current step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return (
          conversationType !== undefined &&
          (conversationType !== 'patient_query' || selectedPatient !== '')
        );
      case 1:
        return selectedParticipants.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };
  // Handle next step
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };
  // Handle previous step
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const conversationData: CreateConversationData = {
        type: conversationType,
        title: conversationTitle || undefined,
        participants: selectedParticipants,
        patientId: selectedPatient || undefined,
        caseId: caseId || undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
      };
      const newConversation = await createConversation(conversationData);
      if (newConversation) {
        onConversationCreated?.(newConversation);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };
  // Filter participants based on search
  const filteredParticipants = allParticipants.filter((participant) => {
    const searchLower = participantSearch.toLowerCase();
    const fullName =
      `${participant.firstName} ${participant.lastName}`.toLowerCase();
    const email = participant.email.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      participant.role.includes(searchLower)
    );
  });
  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="">
            {/* Conversation Type */}
            <div fullWidth>
              <Label>Conversation Type</Label>
              <Select
                value={conversationType}
                label="Conversation Type"
                onChange={(e) => setConversationType(e.target.value as any)}
              >
                <MenuItem value="direct">
                  <div className="">
                    <Person />
                    <div>
                      <div>Direct Message</div>
                      <div  color="text.secondary">
                        One-on-one conversation
                      </div>
                    </div>
                  </div>
                </MenuItem>
                <MenuItem value="group">
                  <div className="">
                    <Group />
                    <div>
                      <div>Group Chat</div>
                      <div  color="text.secondary">
                        Multi-participant conversation
                      </div>
                    </div>
                  </div>
                </MenuItem>
                <MenuItem value="patient_query">
                  <div className="">
                    <QuestionAnswer />
                    <div>
                      <div>Patient Query</div>
                      <div  color="text.secondary">
                        Patient-initiated conversation
                      </div>
                    </div>
                  </div>
                </MenuItem>
              </Select>
            </div>
            {/* Conversation Title */}
            <Input
              fullWidth
              label="Conversation Title (Optional)"
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
            />
            {/* Patient Selection (for patient queries) */}
            {conversationType === 'patient_query' && (
              <Autocomplete
                options={patientOptions}
                getOptionLabel={(option) =>}
                  `${option.firstName} ${option.lastName}`
                }
                value={
                  patientOptions.find((p) => p.userId === selectedPatient) ||
                  null}
                }
                onChange={(_, newValue) =>
                  setSelectedPatient(newValue?.userId || '')}
                }
                renderInput={(params) => (}
                  <Input {...params} label="Select Patient" required />
                )}
                renderOption={(props, option) => (}
                  <div component="li" {...props}>
                    <Avatar className="">
                      <Person />
                    </Avatar>
                    <div>
                      <div>
                        {option.firstName} {option.lastName}
                      </div>
                      <div  color="text.secondary">
                        {option.email}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
            {/* Case ID */}
            <Input
              fullWidth
              label="Case ID (Optional)"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Link to clinical case..."
            />
          </div>
        );
      case 1:
        return (
          <div className="">
            {/* Participant Search */}
            <Input
              fullWidth
              label="Search participants"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
            />
            {/* Available Participants */}
            <div  className="">
              <List>
                {filteredParticipants.map((participant) => {
                  const isSelected = selectedParticipants.some(
                    (p) => p.userId === participant.userId
                  );
                  return (
                    <div key={participant.userId}>
                      <divAvatar>
                        <Avatar className="">
                          {participant.role === 'doctor' ? (
                            <LocalHospital />
                          ) : participant.role === 'pharmacist' ? (
                            <Medication />
                          ) : (
                            <Person />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <div
                        primary={`${participant.firstName} ${participant.lastName}`}
                        secondary={
                          <div>
                            <div  display="block">}
                              {participant.email}
                            </div>
                            <Chip
                              label={participant.role}
                              size="small"
                              className=""
                            />
                          </div>
                        }
                      />
                      <divSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() =>
                            isSelected
                              ? handleRemoveParticipant(participant.userId)
                              : handleAddParticipant(participant)}
                          }
                          color={isSelected ? 'error' : 'primary'}
                        >
                          {isSelected ? <Remove /> : <Add />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </div>
                  );
                })}
              </List>
            </div>
            {/* Selected Participants */}
            {selectedParticipants.length > 0 && (
              <>
                <Separator />
                <div >
                  Selected Participants ({selectedParticipants.length})
                </div>
                <div className="">
                  {selectedParticipants.map((participant) => (
                    <Chip
                      key={participant.userId}
                      label={`${getParticipantName(participant.userId)} (${
                        participant.role
                      })`}
                      onDelete={() =>
                        handleRemoveParticipant(participant.userId)}
                      }
                      avatar={
                        <Avatar className="">
                          {getParticipantRole(participant.userId) ===
                          'doctor' ? (
                            <LocalHospital />
                          ) : getParticipantRole(participant.userId) ===
                            'pharmacist' ? (
                            <Medication />
                          ) : (
                            <Person />}
                          )}
                        </Avatar>
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case 2:
        return (
          <div className="">
            {/* Priority */}
            <div fullWidth>
              <Label>Priority</Label>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as unknown)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </div>
            {/* Tags */}
            <Autocomplete
              multiple
              freeSolo
              options={[
                'medication-review',
                'therapy-consultation',
                'follow-up',
                'urgent-care',}
              ]}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    }
                    label={option}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <Input}
                  {...params}
                  label="Tags (Optional)"
                  placeholder="Add tags..."
                />
              )}
            />
            {/* Summary */}
            <div  className="">
              <div  gutterBottom>
                Conversation Summary
              </div>
              <div  color="text.secondary" gutterBottom>
                <strong>Type:</strong> {conversationType.replace('_', ' ')}
              </div>
              {conversationTitle && (
                <div  color="text.secondary" gutterBottom>
                  <strong>Title:</strong> {conversationTitle}
                </div>
              )}
              <div  color="text.secondary" gutterBottom>
                <strong>Participants:</strong> {selectedParticipants.length}
              </div>
              <div  color="text.secondary" gutterBottom>
                <strong>Priority:</strong> {priority}
              </div>
              {tags.length > 0 && (
                <div  color="text.secondary">
                  <strong>Tags:</strong> {tags.join(', ')}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{}
        sx: { minHeight: 600 },
      >
      <DialogTitle>
        <div className="">
          <Group />
          New Conversation
        </div>
      </DialogTitle>
      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} className="">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {/* Error Display */}
        {errors.createConversation && (
          <Alert severity="error" className="">
            {errors.createConversation}
          </Alert>
        )}
        {/* Step Content */}
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button
            
            onClick={handleNext}
            disabled={!isStepValid(activeStep)}
          >
            Next
          </Button>
        ) : (
          <Button
            
            onClick={handleSubmit}
            disabled={!isStepValid(activeStep) || loading.createConversation}
          >
            {loading.createConversation ? 'Creating...' : 'Create Conversation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
export default NewConversationModal;
