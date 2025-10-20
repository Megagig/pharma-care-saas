import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  status: string;
  priority: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
  viewCount: number;
}

interface Video {
  _id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  category: string;
  difficulty: string;
  status: string;
  viewCount: number;
}

interface Article {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  viewCount: number;
  helpfulVotes: number;
}

interface HelpSettings {
  whatsappNumber: string;
  supportEmail: string;
  supportPhone?: string;
  features: {
    enableLiveChat: boolean;
    enableWhatsappSupport: boolean;
    enableVideoTutorials: boolean;
    enableFeedbackSystem: boolean;
    enablePDFGeneration: boolean;
  };
  customization: {
    welcomeMessage: string;
    footerText: string;
  };
}

const HelpManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [helpSettings, setHelpSettings] = useState<HelpSettings | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [showFAQDialog, setShowFAQDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: '',
    tags: '',
    priority: 'medium',
    status: 'published'
  });
  
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: '',
    difficulty: 'beginner',
    tags: '',
    status: 'published'
  });
  
  // Notification
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const categories = [
    'getting-started',
    'patient-management',
    'inventory-stock',
    'billing-payments',
    'medication-management',
    'mtr',
    'clinical-interventions',
    'diagnostic-cases',
    'communication-hub',
    'drug-information',
    'clinical-decision',
    'dashboards-reports',
    'user-management',
    'security-privacy',
    'api-integrations',
    'account-settings'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [helpContent, settings] = await Promise.all([
        apiClient.get('/admin/saas/support/help/content'),
        apiClient.get('/admin/saas/support/help/settings')
      ]);
      
      setFaqs(helpContent.data.data.faqs);
      setVideos(helpContent.data.data.videos);
      setArticles(helpContent.data.data.articles);
      setHelpSettings(settings.data.data);
    } catch (error) {
      showNotification('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleCreateFAQ = async () => {
    try {
      const faqData = {
        ...faqForm,
        tags: faqForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      if (editingItem) {
        await apiClient.put(`/admin/saas/support/help/faqs/${editingItem._id}`, faqData);
        showNotification('FAQ updated successfully', 'success');
      } else {
        await apiClient.post('/admin/saas/support/help/faqs', faqData);
        showNotification('FAQ created successfully', 'success');
      }
      
      setShowFAQDialog(false);
      setEditingItem(null);
      setFaqForm({
        question: '',
        answer: '',
        category: '',
        tags: '',
        priority: 'medium',
        status: 'published'
      });
      fetchData();
    } catch (error) {
      showNotification('Failed to save FAQ', 'error');
    }
  };

  const handleCreateVideo = async () => {
    try {
      const videoData = {
        ...videoForm,
        tags: videoForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      if (editingItem) {
        await apiClient.put(`/admin/saas/support/help/videos/${editingItem._id}`, videoData);
        showNotification('Video updated successfully', 'success');
      } else {
        await apiClient.post('/admin/saas/support/help/videos', videoData);
        showNotification('Video created successfully', 'success');
      }
      
      setShowVideoDialog(false);
      setEditingItem(null);
      setVideoForm({
        title: '',
        description: '',
        youtubeUrl: '',
        category: '',
        difficulty: 'beginner',
        tags: '',
        status: 'published'
      });
      fetchData();
    } catch (error) {
      showNotification('Failed to save video', 'error');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await apiClient.delete(`/admin/saas/support/help/faqs/${id}`);
        showNotification('FAQ deleted successfully', 'success');
        fetchData();
      } catch (error) {
        showNotification('Failed to delete FAQ', 'error');
      }
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await apiClient.delete(`/admin/saas/support/help/videos/${id}`);
        showNotification('Video deleted successfully', 'success');
        fetchData();
      } catch (error) {
        showNotification('Failed to delete video', 'error');
      }
    }
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingItem(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: '', // You might want to fetch tags from the FAQ
      priority: faq.priority,
      status: faq.status
    });
    setShowFAQDialog(true);
  };

  const handleEditVideo = (video: Video) => {
    setEditingItem(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      youtubeUrl: video.youtubeUrl,
      category: video.category,
      difficulty: video.difficulty,
      tags: '', // You might want to fetch tags from the video
      status: video.status
    });
    setShowVideoDialog(true);
  };

  const handleUpdateSettings = async () => {
    try {
      await apiClient.put('/admin/saas/support/help/settings', helpSettings);
      showNotification('Settings updated successfully', 'success');
      setShowSettingsDialog(false);
    } catch (error) {
      showNotification('Failed to update settings', 'error');
    }
  };

  const renderFAQsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Manage FAQs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowFAQDialog(true)}
        >
          Add FAQ
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Views</TableCell>
              <TableCell>Helpful Votes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow key={faq._id}>
                <TableCell>{faq.question}</TableCell>
                <TableCell>
                  <Chip label={faq.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={faq.status} 
                    color={faq.status === 'published' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={faq.priority}
                    color={faq.priority === 'high' ? 'error' : faq.priority === 'medium' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{faq.viewCount}</TableCell>
                <TableCell>{faq.helpfulVotes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditFAQ(faq)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteFAQ(faq._id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderVideosTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Manage Videos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowVideoDialog(true)}
        >
          Add Video
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Views</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video._id}>
                <TableCell>{video.title}</TableCell>
                <TableCell>
                  <Chip label={video.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={video.difficulty}
                    color={video.difficulty === 'beginner' ? 'success' : video.difficulty === 'intermediate' ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={video.status} 
                    color={video.status === 'published' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{video.viewCount}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditVideo(video)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteVideo(video._id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSettingsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Help System Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettingsDialog(true)}
        >
          Edit Settings
        </Button>
      </Box>
      
      {helpSettings && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Contact Information</Typography>
                <Typography><strong>WhatsApp:</strong> {helpSettings.whatsappNumber}</Typography>
                <Typography><strong>Email:</strong> {helpSettings.supportEmail}</Typography>
                <Typography><strong>Phone:</strong> {helpSettings.supportPhone || 'Not set'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Features</Typography>
                <FormControlLabel
                  control={<Switch checked={helpSettings.features.enableLiveChat} disabled />}
                  label="Live Chat"
                />
                <FormControlLabel
                  control={<Switch checked={helpSettings.features.enableWhatsappSupport} disabled />}
                  label="WhatsApp Support"
                />
                <FormControlLabel
                  control={<Switch checked={helpSettings.features.enableVideoTutorials} disabled />}
                  label="Video Tutorials"
                />
                <FormControlLabel
                  control={<Switch checked={helpSettings.features.enableFeedbackSystem} disabled />}
                  label="Feedback System"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customization</Typography>
                <Typography><strong>Welcome Message:</strong> {helpSettings.customization.welcomeMessage}</Typography>
                <Typography><strong>Footer Text:</strong> {helpSettings.customization.footerText}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Help System Management
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="FAQs" />
          <Tab label="Videos" />
          <Tab label="Articles" />
          <Tab label="Settings" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderFAQsTab()}
      {activeTab === 1 && renderVideosTab()}
      {activeTab === 2 && <Typography>Articles management coming soon...</Typography>}
      {activeTab === 3 && renderSettingsTab()}
      {activeTab === 4 && <Typography>Analytics coming soon...</Typography>}

      {/* FAQ Dialog */}
      <Dialog open={showFAQDialog} onClose={() => setShowFAQDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Answer"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={faqForm.priority}
                  onChange={(e) => setFaqForm({ ...faqForm, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={faqForm.tags}
                onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFAQDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFAQ} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onClose={() => setShowVideoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Video' : 'Add New Video'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="YouTube URL"
                value={videoForm.youtubeUrl}
                onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={videoForm.difficulty}
                  onChange={(e) => setVideoForm({ ...videoForm, difficulty: e.target.value })}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={videoForm.tags}
                onChange={(e) => setVideoForm({ ...videoForm, tags: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVideoDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateVideo} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Help System Settings</DialogTitle>
        <DialogContent>
          {helpSettings && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  value={helpSettings.whatsappNumber}
                  onChange={(e) => setHelpSettings({
                    ...helpSettings,
                    whatsappNumber: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Support Email"
                  value={helpSettings.supportEmail}
                  onChange={(e) => setHelpSettings({
                    ...helpSettings,
                    supportEmail: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Welcome Message"
                  value={helpSettings.customization.welcomeMessage}
                  onChange={(e) => setHelpSettings({
                    ...helpSettings,
                    customization: {
                      ...helpSettings.customization,
                      welcomeMessage: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Footer Text"
                  value={helpSettings.customization.footerText}
                  onChange={(e) => setHelpSettings({
                    ...helpSettings,
                    customization: {
                      ...helpSettings.customization,
                      footerText: e.target.value
                    }
                  })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateSettings} variant="contained">
            Update Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HelpManagement;