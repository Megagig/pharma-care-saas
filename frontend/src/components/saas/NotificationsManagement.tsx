import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PhoneAndroidIcon,
  WhatsApp as WhatsAppIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Rule as RuleIcon,
  Template as TemplateIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSaasSettings } from '../../queries/useSaasSettings';
import { format } from 'date-fns';

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
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  enabled: boolean;
  config: {
    provider?: string;
    apiKey?: string;
    fromAddress?: string;
    fromNumber?: string;
    webhookUrl?: string;
  };
  dailyLimit: number;
  monthlyLimit: number;
  usage: {
    daily: number;
    monthly: number;
  };
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: RuleCondition[];
  actions: NotificationAction[];
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // minutes
  maxExecutions: number;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface NotificationAction {
  type: 'send_notification';
  channel: string;
  template: string;
  recipients: string[];
  delay?: number; // minutes
}

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
}

interface NotificationHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: string;
  template: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata: Record<string, any>;
}

const NotificationsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [testNotificationDialogOpen, setTestNotificationDialogOpen] = useState(false);

  // Form states
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  const {
    getNotificationChannels,
    updateNotificationChannel,
    getNotificationRules,
    createNotificationRule,
    updateNotificationRule,
    deleteNotificationRule,
    getNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    getNotificationHistory,
    sendTestNotification,
    toggleNotificationRule,
  } = useSaasSettings();

  useEffect(() => {
    loadNotificationData();
  }, [activeTab]);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 0: // Channels
          const channelsResponse = await getNotificationChannels();
          if (channelsResponse.success) {
            setChannels(channelsResponse.data.channels);
          }
          break;
        case 1: // Rules
          const rulesResponse = await getNotificationRules();
          if (rulesResponse.success) {
            setRules(rulesResponse.data.rules);
          }
          break;
        case 2: // Templates
          const templatesResponse = await getNotificationTemplates();
          if (templatesResponse.success) {
            setTemplates(templatesResponse.data.templates);
          }
          break;
        case 3: // History
          const historyResponse = await getNotificationHistory();
          if (historyResponse.success) {
            setHistory(historyResponse.data.history);
          }
          break;
      }
    } catch (err) {
      setError('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      const response = await updateNotificationChannel(channelId, { enabled });
      if (response.success) {
        setChannels(prev => prev.map(channel => 
          channel.id === channelId ? { ...channel, enabled } : channel
        ));
        setSuccess('Channel updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update channel');
    }
  };

  const handleRuleToggle = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await toggleNotificationRule(ruleId, { isActive });
      if (response.success) {
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, isActive } : rule
        ));
        setSuccess('Rule updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await deleteNotificationRule(ruleId);
      if (response.success) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
        setSuccess('Rule deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await deleteNotificationTemplate(templateId);
      if (response.success) {
        setTemplates(prev => prev.filter(template => template.id !== templateId));
        setSuccess('Template deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const handleSendTestNotification = async (data: any) => {
    try {
      const response = await sendTestNotification(data);
      if (response.success) {
        setSuccess('Test notification sent successfully');
        setTestNotificationDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to send test notification');
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <EmailIcon />;
      case 'sms': return <SmsIcon />;
      case 'push': return <PhoneAndroidIcon />;
      case 'whatsapp': return <WhatsAppIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircleIcon color="success" />;
      case 'failed':
      case 'bounced':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              Notifications Management
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => setTestNotificationDialogOpen(true)}
              >
                Test Notification
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (activeTab === 1) setRuleDialogOpen(true);
                  else if (activeTab === 2) setTemplateDialogOpen(true);
                }}
                disabled={activeTab === 0 || activeTab === 3}
              >
                {activeTab === 1 ? 'Add Rule' : activeTab === 2 ? 'Add Template' : 'Add'}
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab 
                icon={<SettingsIcon />} 
                label="Channels" 
                id="notifications-tab-0"
                aria-controls="notifications-tabpanel-0"
              />
              <Tab 
                icon={<RuleIcon />} 
                label="Rules" 
                id="notifications-tab-1"
                aria-controls="notifications-tabpanel-1"
              />
              <Tab 
                icon={<TemplateIcon />} 
                label="Templates" 
                id="notifications-tab-2"
                aria-controls="notifications-tabpanel-2"
              />
              <Tab 
                icon={<HistoryIcon />} 
                label="History" 
                id="notifications-tab-3"
                aria-controls="notifications-tabpanel-3"
              />
            </Tabs>
          </Box>

          {/* Channels Tab */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Notification Channels Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {loading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : channels.length === 0 ? (
                <Grid item xs={12}>
                  <Typography>No notification channels configured</Typography>
                </Grid>
              ) : (
                channels.map((channel) => (
                  <Grid item xs={12} md={6} key={channel.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getChannelIcon(channel.type)}
                            <Typography variant="h6">{channel.name}</Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={channel.enabled}
                                onChange={(e) => handleChannelToggle(channel.id, e.target.checked)}
                              />
                            }
                            label="Enabled"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Type: {channel.type.toUpperCase()}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Daily Usage
                            </Typography>
                            <Typography variant="body2">
                              {channel.usage.daily} / {channel.dailyLimit}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Monthly Usage
                            </Typography>
                            <Typography variant="body2">
                              {channel.usage.monthly} / {channel.monthlyLimit}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedChannel(channel);
                              setChannelDialogOpen(true);
                            }}
                          >
                            Configure
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>

          {/* Rules Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Notification Rules Engine
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rule Name</TableCell>
                    <TableCell>Trigger</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Executions</TableCell>
                    <TableCell>Last Executed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No notification rules configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {rule.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rule.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={rule.trigger} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rule.priority.toUpperCase()}
                            color={getPriorityColor(rule.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={rule.isActive}
                                onChange={(e) => handleRuleToggle(rule.id, e.target.checked)}
                                size="small"
                              />
                            }
                            label={rule.isActive ? 'Active' : 'Inactive'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {rule.executionCount} / {rule.maxExecutions}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {rule.lastExecuted ? format(new Date(rule.lastExecuted), 'MMM dd, HH:mm') : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Rule">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setRuleDialogOpen(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Rule">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRule(rule.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Templates Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Notification Templates
            </Typography>
            
            <Grid container spacing={3}>
              {loading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : templates.length === 0 ? (
                <Grid item xs={12}>
                  <Typography>No notification templates configured</Typography>
                </Grid>
              ) : (
                templates.map((template) => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getChannelIcon(template.channel)}
                            <Typography variant="h6">{template.name}</Typography>
                          </Box>
                          <Chip
                            label={template.isActive ? 'Active' : 'Inactive'}
                            color={template.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {template.description}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          Channel: {template.channel.toUpperCase()} | Category: {template.category}
                        </Typography>
                        
                        {template.subject && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Subject:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {template.subject}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTemplateDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTemplate(template.id)}
                            color="error"
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Notification History
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell>Channel</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No notification history available
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2">{item.ruleName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getChannelIcon(item.channel)}
                            <Typography variant="body2">{item.channel}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.template}</Typography>
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={item.recipients.length} color="primary">
                            <Typography variant="body2">Recipients</Typography>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(item.status)}
                            <Typography variant="body2">{item.status}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(item.sentAt), 'MMM dd, HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Test Notification Dialog */}
      <Dialog open={testNotificationDialogOpen} onClose={() => setTestNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Test Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Channel</InputLabel>
                <Select label="Channel" defaultValue="">
                  {channels.filter(c => c.enabled).map(channel => (
                    <MenuItem key={channel.id} value={channel.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getChannelIcon(channel.type)}
                        {channel.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select label="Template" defaultValue="">
                  {templates.filter(t => t.isActive).map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Recipients"
                placeholder="Enter email addresses or phone numbers, separated by commas"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestNotificationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleSendTestNotification({})}
            variant="contained"
            startIcon={<SendIcon />}
          >
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsManagement;