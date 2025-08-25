import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Badge,
} from '@mui/material';
import {
  Help as HelpIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  BugReport as BugReportIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  Support as SupportIcon,
  QuestionAnswer as QuestionAnswerIcon,
  GetApp as GetAppIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  tags: string[];
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: string;
  views: number;
}

const Help: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Mock data
  const [faqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'How do I add a new patient to the system?',
      answer: 'To add a new patient, navigate to the Patients section from the sidebar, click the "Add Patient" button, and fill out the required information including name, contact details, and medical information.',
      category: 'patients',
      helpful: 45,
      notHelpful: 2,
      tags: ['patients', 'add', 'register']
    },
    {
      id: '2',
      question: 'How can I manage my subscription plan?',
      answer: 'You can manage your subscription by going to the Subscriptions page from the sidebar. There you can view your current plan, upgrade or downgrade, and update payment methods.',
      category: 'billing',
      helpful: 38,
      notHelpful: 1,
      tags: ['subscription', 'billing', 'payment']
    },
    {
      id: '3',
      question: 'What should I do if I forgot my password?',
      answer: 'Click the "Forgot Password" link on the login page. Enter your email address and check your inbox for a password reset link. Follow the instructions in the email to create a new password.',
      category: 'account',
      helpful: 52,
      notHelpful: 0,
      tags: ['password', 'login', 'security']
    },
    {
      id: '4',
      question: 'How do I generate reports for my pharmacy?',
      answer: 'Go to the Reports section and select the type of report you want to generate (sales, inventory, patients, etc.). Choose your date range and filters, then click "Generate Report".',
      category: 'reports',
      helpful: 29,
      notHelpful: 3,
      tags: ['reports', 'analytics', 'data']
    },
    {
      id: '5',
      question: 'Can I import my existing patient data?',
      answer: 'Yes, you can import patient data using CSV files. Go to Patients > Import Data, download our CSV template, fill it with your data, and upload it back to the system.',
      category: 'patients',
      helpful: 31,
      notHelpful: 5,
      tags: ['import', 'data', 'csv']
    },
  ]);

  const [helpArticles] = useState<HelpArticle[]>([
    {
      id: '1',
      title: 'Getting Started with PharmaCare',
      description: 'A comprehensive guide to setting up your pharmacy management system',
      category: 'getting-started',
      readTime: 10,
      difficulty: 'beginner',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      title: 'Advanced Patient Management Features',
      description: 'Learn about advanced features for managing patient records and history',
      category: 'patients',
      readTime: 15,
      difficulty: 'intermediate',
      lastUpdated: '2024-01-20'
    },
    {
      id: '3',
      title: 'Setting Up Two-Factor Authentication',
      description: 'Secure your account with two-factor authentication',
      category: 'security',
      readTime: 5,
      difficulty: 'beginner',
      lastUpdated: '2024-01-18'
    }
  ]);

  const [videoTutorials] = useState<VideoTutorial[]>([
    {
      id: '1',
      title: 'PharmaCare Dashboard Overview',
      description: 'Get familiar with your dashboard and key features',
      thumbnail: '/thumbnails/dashboard-overview.jpg',
      duration: '3:45',
      category: 'getting-started',
      views: 1247
    },
    {
      id: '2',
      title: 'Managing Inventory and Stock',
      description: 'Learn how to track and manage your medication inventory',
      thumbnail: '/thumbnails/inventory-management.jpg',
      duration: '7:22',
      category: 'inventory',
      views: 892
    }
  ]);

  const helpTabs = [
    { id: 'faq', label: 'FAQs', icon: <QuestionAnswerIcon /> },
    { id: 'guides', label: 'Guides', icon: <BookIcon /> },
    { id: 'videos', label: 'Video Tutorials', icon: <VideoIcon /> },
    { id: 'contact', label: 'Contact Support', icon: <SupportIcon /> },
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: <HelpIcon />, count: 0 },
    { id: 'getting-started', label: 'Getting Started', icon: <SchoolIcon />, count: 8 },
    { id: 'patients', label: 'Patient Management', icon: <GroupIcon />, count: 12 },
    { id: 'inventory', label: 'Inventory & Stock', icon: <AssessmentIcon />, count: 7 },
    { id: 'billing', label: 'Billing & Payments', icon: <PaymentIcon />, count: 6 },
    { id: 'security', label: 'Security & Privacy', icon: <SecurityIcon />, count: 5 },
    { id: 'reports', label: 'Reports & Analytics', icon: <AssessmentIcon />, count: 9 },
    { id: 'account', label: 'Account Settings', icon: <SettingsIcon />, count: 4 },
    { id: 'api', label: 'API & Integrations', icon: <ApiIcon />, count: 3 },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFeedbackSubmit = () => {
    // Handle feedback submission
    setShowFeedbackDialog(false);
    setFeedbackRating(0);
    setFeedbackComment('');
  };

  const renderFAQTab = () => (
    <Box>
      {/* Search and Filter */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label} {category.count > 0 && `(${category.count})`}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Popular FAQs */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Popular Questions
      </Typography>

      {filteredFAQs.map((faq) => (
        <Accordion key={faq.id} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`faq-${faq.id}-content`}
            id={`faq-${faq.id}-header`}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                {faq.question}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                {faq.tags.slice(0, 2).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              {faq.answer}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Was this helpful?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<ThumbUpIcon />}
                  variant="outlined"
                  sx={{ minWidth: 'auto' }}
                >
                  {faq.helpful}
                </Button>
                <Button
                  size="small"
                  startIcon={<ThumbDownIcon />}
                  variant="outlined"
                  sx={{ minWidth: 'auto' }}
                >
                  {faq.notHelpful}
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No FAQs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or category filter
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderGuidesTab = () => (
    <Grid container spacing={3}>
      {helpArticles.map((article) => (
        <Grid item xs={12} md={6} lg={4} key={article.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Typography variant="h6" component="div" noWrap>
                  {article.title}
                </Typography>
              }
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Chip
                    label={article.difficulty}
                    size="small"
                    color={
                      article.difficulty === 'beginner' ? 'success' :
                      article.difficulty === 'intermediate' ? 'warning' : 'error'
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {article.readTime} min read
                  </Typography>
                </Box>
              }
              avatar={<ArticleIcon />}
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                {article.description}
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PlayIcon />}
              >
                Read Guide
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderVideosTab = () => (
    <Grid container spacing={3}>
      {videoTutorials.map((video) => (
        <Grid item xs={12} md={6} lg={4} key={video.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                height: 200,
                bgcolor: 'grey.200',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 64,
                  height: 64,
                }}
              >
                <PlayIcon sx={{ fontSize: 32 }} />
              </IconButton>
              <Chip
                label={video.duration}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                }}
              />
            </Box>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom noWrap>
                {video.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {video.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {video.views.toLocaleString()} views
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderContactTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Contact Options"
            avatar={<SupportIcon />}
          />
          <Divider />
          <CardContent>
            <List>
              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setShowContactDialog(true)}
              >
                <ListItemIcon>
                  <ChatIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Live Chat"
                  secondary="Chat with our support team (Mon-Fri, 9AM-6PM WAT)"
                />
                <Badge badgeContent="Online" color="success" />
              </ListItem>

              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Email Support"
                  secondary="support@pharmacare.ng - We typically respond within 24 hours"
                />
              </ListItem>

              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  <PhoneIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Support"
                  secondary="+234 1 234 5678 (Business hours only)"
                />
              </ListItem>

              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  <BugReportIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Report a Bug"
                  secondary="Help us improve by reporting issues you encounter"
                />
              </ListItem>

              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setShowFeedbackDialog(true)}
              >
                <ListItemIcon>
                  <LightbulbIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Feature Request"
                  secondary="Suggest new features or improvements"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Quick Resources"
            avatar={<GetAppIcon />}
          />
          <Divider />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <BookIcon />
                </ListItemIcon>
                <ListItemText
                  primary="User Manual"
                  secondary="Complete documentation for all features"
                />
                <Button variant="outlined" size="small">Download</Button>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <ApiIcon />
                </ListItemIcon>
                <ListItemText
                  primary="API Documentation"
                  secondary="Developer resources for integrations"
                />
                <Button variant="outlined" size="small">View</Button>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Training Materials"
                  secondary="Training guides and best practices"
                />
                <Button variant="outlined" size="small">Access</Button>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="System Status"
            avatar={
              <Badge badgeContent="All Systems Operational" color="success">
                <SettingsIcon />
              </Badge>
            }
          />
          <Divider />
          <CardContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              All PharmaCare services are running normally. 
              Check our status page for real-time updates.
            </Typography>
            <Button variant="outlined" fullWidth>
              View Status Page
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Typography color="textPrimary">Help & Support</Typography>
        </Breadcrumbs>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              <HelpIcon sx={{ mr: 1, fontSize: 'inherit' }} />
              Help & Support
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Find answers, learn about features, and get the support you need
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Help Search */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              How can we help you today?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search our knowledge base or browse categories below
            </Typography>
          </Box>
          <TextField
            fullWidth
            placeholder="Search for help articles, FAQs, or tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Grid container spacing={2}>
            {categories.slice(1, 5).map((category) => (
              <Grid item xs={6} md={3} key={category.id}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={category.icon}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setActiveTab(0);
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  <Box sx={{ textAlign: 'left', ml: 1 }}>
                    <Typography variant="body2">{category.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.count} articles
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
        >
          {helpTabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && renderFAQTab()}
        {activeTab === 1 && renderGuidesTab()}
        {activeTab === 2 && renderVideosTab()}
        {activeTab === 3 && renderContactTab()}
      </Box>

      {/* Floating Feedback Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => setShowFeedbackDialog(true)}
      >
        <FeedbackIcon />
      </Fab>

      {/* Contact Dialog */}
      <Dialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            Start Live Chat
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Our support team is currently online and ready to help!
          </Alert>
          <Typography variant="body2" paragraph>
            Before starting the chat, please have the following information ready:
          </Typography>
          <List dense>
            <ListItem>• Your account email address</ListItem>
            <ListItem>• Description of the issue</ListItem>
            <ListItem>• Screenshots (if applicable)</ListItem>
            <ListItem>• Steps to reproduce the problem</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContactDialog(false)}>Cancel</Button>
          <Button variant="contained">Start Chat</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon />
            Send Feedback
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              How would you rate your experience?
            </Typography>
            <Rating
              value={feedbackRating}
              onChange={(_, newValue) => setFeedbackRating(newValue || 0)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your feedback"
            placeholder="Tell us what you think or suggest improvements..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFeedbackSubmit}
            disabled={!feedbackRating || !feedbackComment.trim()}
          >
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Help;
