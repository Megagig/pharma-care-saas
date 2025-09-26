import { Button, Input, Label, Dialog, DialogContent, DialogTitle, Select, Tooltip, Alert, Avatar, Switch, Tabs, Separator } from '@/components/ui/button';

interface ConversationSettingsProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
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
      id={`conversation-settings-tabpanel-${index}`}
      aria-labelledby={`conversation-settings-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};
const ConversationSettings: React.FC<ConversationSettingsProps> = ({ 
  open,
  onClose,
  conversation
}) => {
  const {
    updateConversation,
    addParticipant,
    removeParticipant,
    archiveConversation,
    deleteConversation,
    loading,
    errors,
  } = useCommunicationStore();
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(conversation.title || '');
  const [priority, setPriority] = useState(conversation.priority);
  const [tags, setTags] = useState(conversation.tags || []);
  const [caseId, setCaseId] = useState(conversation.caseId || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Mock notification settings (in real app, this would come from user preferences)
  const [notificationSettings, setNotificationSettings] = useState({ 
    inApp: true,
    email: false,
    sms: false,
    mentions: true,
    allMessages: false}
  });
  // Mock available users for adding participants
  const mockUsers = [
    {
      userId: 'pharmacist-3',
      firstName: 'Dr. Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@pharmacy.com',
      role: 'pharmacist' as const,
    },
    {
      userId: 'doctor-3',
      firstName: 'Dr. Robert',
      lastName: 'Taylor',
      email: 'robert.taylor@hospital.com',
      role: 'doctor' as const,
    },
  ];
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  // Handle title edit
  const handleTitleEdit = () => {
    setEditingTitle(true);
  };
  const handleTitleSave = async () => {
    try {
      await updateConversation(conversation._id, { title });
      setEditingTitle(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };
  const handleTitleCancel = () => {
    setTitle(conversation.title || '');
    setEditingTitle(false);
  };
  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      await updateConversation(conversation._id, {
        priority,
        tags,
        caseId: caseId || undefined}
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };
  // Handle participant actions
  const handleAddParticipant = async (userId: string, role: string) => {
    try {
      await addParticipant(conversation._id, userId, role);
    } catch (error) {
      console.error('Failed to add participant:', error);
    }
  };
  const handleRemoveParticipant = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this participant?')) {
      try {
        await removeParticipant(conversation._id, userId);
      } catch (error) {
        console.error('Failed to remove participant:', error);
      }
    }
  };
  // Handle conversation actions
  const handleArchiveConversation = async () => {
    if (window.confirm('Are you sure you want to archive this conversation?')) {
      try {
        await archiveConversation(conversation._id);
        onClose();
      } catch (error) {
        console.error('Failed to archive conversation:', error);
      }
    }
  };
  const handleDeleteConversation = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this conversation? This action cannot be undone.'
      )
    ) {
      try {
        await deleteConversation(conversation._id);
        onClose();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };
  // Get participant role icon
  const getParticipantIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <LocalHospital />;
      case 'pharmacist':
        return <Medication />;
      case 'patient':
        return <Person />;
      default:
        return <Person />;
    }
  };
  // Get participant permissions display
  const getPermissionsDisplay = (permissions: string[]) => {
    const permissionLabels: Record<string, string> = {
      read: 'Read',
      write: 'Write',
      manage_medications: 'Manage Medications',
      manage_diagnosis: 'Manage Diagnosis',
      admin: 'Admin',
    };
    return permissions.map((perm) => permissionLabels[perm] || perm).join(', ');
  };
  // Track changes
    const hasChanges =
      priority !== conversation.priority ||
      JSON.stringify(tags) !== JSON.stringify(conversation.tags || []) ||
      caseId !== (conversation.caseId || '');
    setHasUnsavedChanges(hasChanges);
  }, [priority, tags, caseId, conversation]);
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
          <Settings />
          Conversation Settings
        </div>
      </DialogTitle>
      <DialogContent>
        {/* Error Display */}
        {(errors.updateConversation ||
          errors.addParticipant ||
          errors.removeParticipant) && (
          <Alert severity="error" className="">
            {errors.updateConversation ||
              errors.addParticipant ||
              errors.removeParticipant}
          </Alert>
        )}
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className=""
        >
          <Tab label="General" icon={<Settings />} />
          <Tab label="Participants" icon={<Group />} />
          <Tab label="Notifications" icon={<Notifications />} />
          <Tab label="Security" icon={<Security />} />
        </Tabs>
        {/* General Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <div className="">
            {/* Conversation Title */}
            <div>
              <div  gutterBottom>
                Conversation Title
              </div>
              {editingTitle ? (
                <div className="">
                  <Input
                    fullWidth
                    size="small"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter conversation title..."
                  />
                  <IconButton
                    size="small"
                    onClick={handleTitleSave}
                    color="primary"
                  >
                    <Save />
                  </IconButton>
                  <IconButton size="small" onClick={handleTitleCancel}>
                    <Cancel />
                  </IconButton>
                </div>
              ) : (
                <div className="">
                  <div  className="">
                    {conversation.title || 'No title set'}
                  </div>
                  <IconButton size="small" onClick={handleTitleEdit}>
                    <Edit />
                  </IconButton>
                </div>
              )}
            </div>
            {/* Conversation Type */}
            <div>
              <div  gutterBottom>
                Type
              </div>
              <Chip
                label={conversation.type.replace('_', ' ')}
                icon={
                  conversation.type === 'group' ? (
                    <Group />
                  ) : conversation.type === 'patient_query' ? (
                    <Person />
                  ) : (
                    <Person />
                  )}
                }
              />
            </div>
            {/* Priority */}
            <div fullWidth>
              <Label>Priority</Label>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as any)}
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
              renderInput={(params) => (}
                <Input {...params} label="Tags" placeholder="Add tags..." />
              )}
            />
            {/* Case ID */}
            <Input
              fullWidth
              label="Case ID"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Link to clinical case..."
            />
            {/* Status */}
            <div>
              <div  gutterBottom>
                Status
              </div>
              <Chip
                label={conversation.status}
                color={conversation.status === 'active' ? 'success' : 'default'}
              />
            </div>
            {/* Save Button */}
            {hasUnsavedChanges && (
              <Button
                
                onClick={handleSaveSettings}
                disabled={loading.updateConversation}
                startIcon={<Save />}
              >
                {loading.updateConversation ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </TabPanel>
        {/* Participants Tab */}
        <TabPanel value={activeTab} index={1}>
          <div className="">
            {/* Current Participants */}
            <div>
              <div  gutterBottom>
                Current Participants ({conversation.participants.length})
              </div>
              <div >
                <List>
                  {conversation.participants.map((participant, index) => (
                    <React.Fragment key={participant.userId}>
                      <div>
                        <divAvatar>
                          <Avatar className="">
                            {getParticipantIcon(participant.role)}
                          </Avatar>
                        </ListItemAvatar>
                        <div
                          primary={`User ${participant.userId}`} // In real app, fetch user name
                          secondary={
                            <div>
                              <div  display="block">}
                                Role: {participant.role}
                              </div>
                              <div  display="block">
                                Joined:{' '}
                                {new Date(
                                  participant.joinedAt
                                ).toLocaleDateString()}
                              </div>
                              <div  display="block">
                                Permissions:{' '}
                                {getPermissionsDisplay(participant.permissions)}
                              </div>
                            </div>
                          }
                        />
                        <divSecondaryAction>
                          <Tooltip title="Remove participant">
                            <IconButton
                              edge="end"
                              onClick={() =>
                                handleRemoveParticipant(participant.userId)}
                              }
                              color="error"
                              size="small"
                            >
                              <Remove />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </div>
                      {index < conversation.participants.length - 1 && (
                        <Separator />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </div>
            </div>
            {/* Add Participants */}
            <div>
              <div  gutterBottom>
                Add Participants
              </div>
              <div >
                <List>
                  {mockUsers.map((user) => (
                    <div key={user.userId}>
                      <divAvatar>
                        <Avatar className="">
                          {getParticipantIcon(user.role)}
                        </Avatar>
                      </ListItemAvatar>
                      <div
                        primary={`${user.firstName} ${user.lastName}`}
                        secondary={
                          <div>
                            <div  display="block">}
                              {user.email}
                            </div>
                            <Chip
                              label={user.role}
                              size="small"
                              className=""
                            />
                          </div>
                        }
                      />
                      <divSecondaryAction>
                        <Tooltip title="Add participant">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleAddParticipant(user.userId, user.role)}
                            }
                            color="primary"
                            size="small"
                          >
                            <Add />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </div>
                  ))}
                </List>
              </div>
            </div>
          </div>
        </TabPanel>
        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={2}>
          <div className="">
            <div  gutterBottom>
              Notification Preferences
            </div>
            <div  className="">
              <div className="">
                <FormControlLabel
                  control={
                    <Switch}
                      checked={notificationSettings.inApp}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({ 
                          ...prev}
                          inApp: e.target.checked,}
                        }))
                      }
                    />
                  }
                  label="In-app notifications"
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={notificationSettings.email}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({ 
                          ...prev}
                          email: e.target.checked,}
                        }))
                      }
                    />
                  }
                  label="Email notifications"
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={notificationSettings.sms}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({ 
                          ...prev}
                          sms: e.target.checked,}
                        }))
                      }
                    />
                  }
                  label="SMS notifications"
                />
                <Separator />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={notificationSettings.mentions}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({ 
                          ...prev}
                          mentions: e.target.checked,}
                        }))
                      }
                    />
                  }
                  label="Notify when mentioned"
                />
                <FormControlLabel
                  control={
                    <Switch}
                      checked={notificationSettings.allMessages}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({ 
                          ...prev}
                          allMessages: e.target.checked,}
                        }))
                      }
                    />
                  }
                  label="Notify for all messages"
                />
              </div>
            </div>
          </div>
        </TabPanel>
        {/* Security Tab */}
        <TabPanel value={activeTab} index={3}>
          <div className="">
            {/* Encryption Status */}
            <div>
              <div  gutterBottom>
                Encryption Status
              </div>
              <div  className="">
                <div className="">
                  <Security
                    color={
                      conversation.metadata.isEncrypted ? 'success' : 'error'}
                    }
                  />
                  <div>
                    {conversation.metadata.isEncrypted
                      ? 'Encrypted'
                      : 'Not Encrypted'}
                  </div>
                </div>
                {conversation.metadata.encryptionKeyId && (
                  <div
                    
                    color="text.secondary"
                    className=""
                  >
                    Key ID: {conversation.metadata.encryptionKeyId}
                  </div>
                )}
              </div>
            </div>
            {/* Dangerous Actions */}
            <div>
              <div  gutterBottom color="error">
                Dangerous Actions
              </div>
              <div  className="">
                <div className="">
                  <Button
                    
                    color="warning"
                    startIcon={<Archive />}
                    onClick={handleArchiveConversation}
                    disabled={conversation.status === 'archived'}
                  >
                    Archive Conversation
                  </Button>
                  <Button
                    
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteConversation}
                  >
                    Delete Conversation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
export default ConversationSettings;
