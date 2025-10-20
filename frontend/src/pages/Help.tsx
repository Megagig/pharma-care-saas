import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
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
  Grid,
  CircularProgress,
  Skeleton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  Avatar,
  CardMedia,
  CardActions,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayIcon from '@mui/icons-material/PlayArrow';
import ArticleIcon from '@mui/icons-material/Article';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import ChatIcon from '@mui/icons-material/Chat';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BugReportIcon from '@mui/icons-material/BugReport';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SchoolIcon from '@mui/icons-material/School';
import SupportIcon from '@mui/icons-material/Support';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import GetAppIcon from '@mui/icons-material/GetApp';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BookIcon from '@mui/icons-material/Book';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ApiIcon from '@mui/icons-material/Api';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MessageIcon from '@mui/icons-material/Message';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../services/apiClient';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
  tags: string[];
  viewCount: number;
  priority: string;
}

interface HelpArticle {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  viewCount: number;
  authorName: string;
  publishedAt: string;
}

interface VideoTutorial {
  _id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl?: string;
  duration?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  viewCount: number;
  authorName: string;
}

interface HelpSettings {
  whatsappNumber: string;
  supportEmail: string;
  supportPhone?: string;
  businessHours: any;
  systemStatus: {
    status: string;
    message?: string;
    lastUpdated: string;
  };
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

interface Category {
  name: string;
  count: number;
}

const Help: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  
  // Feedback form states
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // Data states
  const [helpContent, setHelpContent] = useState<{
    articles: HelpArticle[];
    faqs: FAQ[];
    videos: VideoTutorial[];
    total: number;
  }>({
    articles: [],
    faqs: [],
    videos: [],
    total: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [helpSettings, setHelpSettings] = useState<HelpSettings | null>(null);

  // API functions
  const fetchHelpContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (contentType !== 'all') params.append('contentType', contentType);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      
      console.log('Fetching help content with params:', params.toString());
      const response = await apiClient.get(`/admin/saas/support/help/content?${params}`);
      console.log('Help content response:', response.data);
      
      // Ensure we have the expected data structure
      const data = response.data?.data || {};
      setHelpContent({
        articles: data.articles || [],
        faqs: data.faqs || [],
        videos: data.videos || [],
        total: data.total || 0
      });
    } catch (error: any) {
      console.error('Error fetching help content:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || 'Failed to load help content');
      // Set empty data on error
      setHelpContent({
        articles: [],
        faqs: [],
        videos: [],
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/admin/saas/support/help/categories');
      setCategories(response.data?.data?.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchHelpSettings = async () => {
    try {
      const response = await apiClient.get('/admin/saas/support/help/settings');
      setHelpSettings(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching help settings:', error);
      setHelpSettings(null);
    }
  };

  const submitFeedback = async () => {
    try {
      await apiClient.post('/admin/saas/support/help/feedback', {
        type: feedbackType,
        rating: feedbackRating,
        title: feedbackTitle,
        message: feedbackComment,
        category: selectedCategory !== 'all' ? selectedCategory : 'general'
      });
      
      setShowFeedbackDialog(false);
      setFeedbackRating(0);
      setFeedbackTitle('');
      setFeedbackComment('');
      setFeedbackType('general');
      
      // Show success message
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const downloadPDFManual = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('categories', selectedCategory);
      }
      
      const response = await apiClient.get(`/admin/saas/support/help/manual/pdf?${params}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PharmacyCopilot-User-Manual.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Effects
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchHelpSettings(),
        fetchHelpContent()
      ]);
      setInitialLoading(false);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!initialLoading) {
        fetchHelpContent();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, contentType, selectedDifficulty]);

  const helpTabs = [
    { id: 'faq', label: 'FAQs', icon: <QuestionAnswerIcon /> },
    { id: 'guides', label: 'Guides', icon: <BookIcon /> },
    { id: 'videos', label: 'Video Tutorials', icon: <VideoIcon /> },
    { id: 'contact', label: 'Contact Support', icon: <SupportIcon /> },
  ];

  const moduleCategories = [
    { id: 'all', label: 'All Categories', icon: <HelpIcon /> },
    { id: 'getting-started', label: 'Getting Started', icon: <SchoolIcon /> },
    { id: 'patient-management', label: 'Patient Management', icon: <GroupIcon /> },
    { id: 'inventory-stock', label: 'Inventory & Stock', icon: <InventoryIcon /> },
    { id: 'billing-payments', label: 'Billing & Payments', icon: <PaymentIcon /> },
    { id: 'medication-management', label: 'Medication Management', icon: <LocalPharmacyIcon /> },
    { id: 'mtr', label: 'Medication Therapy Review', icon: <MedicalServicesIcon /> },
    { id: 'clinical-interventions', label: 'Clinical Interventions', icon: <MedicalServicesIcon /> },
    { id: 'diagnostic-cases', label: 'Diagnostic Cases', icon: <AssessmentIcon /> },
    { id: 'communication-hub', label: 'Communication Hub', icon: <MessageIcon /> },
    { id: 'drug-information', label: 'Drug Information Center', icon: <LocalPharmacyIcon /> },
    { id: 'clinical-decision', label: 'Clinical Decision Support', icon: <MedicalServicesIcon /> },
    { id: 'dashboards-reports', label: 'Dashboards & Reports', icon: <DashboardIcon /> },
    { id: 'user-management', label: 'User Management', icon: <GroupIcon /> },
    { id: 'security-privacy', label: 'Security & Privacy', icon: <SecurityIcon /> },
    { id: 'api-integrations', label: 'API & Integrations', icon: <ApiIcon /> },
    { id: 'account-settings', label: 'Account Settings', icon: <SettingsIcon /> },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleVideoPlay = (video: VideoTutorial) => {
    setSelectedVideo(video);
    setShowVideoDialog(true);
  };

  const getWhatsAppLink = () => {
    if (!helpSettings) return '#';
    const message = encodeURIComponent('Hello! I need help with PharmacyCopilot.');
    return `https://wa.me/${helpSettings.whatsappNumber.replace(/[^\d]/g, '')}?text=${message}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = moduleCategories.find(cat => cat.id === categoryName || cat.label.toLowerCase().includes(categoryName.toLowerCase()));
    return category?.icon || <HelpIcon />;
  };

  const renderFAQTab = () => (
    <Box>
      {/* Search and Filter */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Search Frequently Asked Questions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
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
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {moduleCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={() => setContentType('faqs')}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  height: '56px'
                }}
              >
                Filter Results
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Popular FAQs */}
      {!loading && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {searchQuery ? `Search Results (${helpContent.faqs?.length || 0})` : 'Popular Questions'}
            </Typography>
            <Chip 
              label={`${helpContent.faqs?.length || 0} FAQs`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>

          {helpContent.faqs && helpContent.faqs.map((faq) => (
            <Accordion 
              key={faq._id} 
              sx={{ 
                mb: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px !important',
                '&.Mui-expanded': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: '8px',
                  '&.Mui-expanded': {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {faq.question}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {faq.tags.slice(0, 3).map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      ))}
                      {faq.priority === 'high' && (
                        <Chip 
                          label="Popular" 
                          size="small" 
                          color="error"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                    <Tooltip title="Views">
                      <Chip 
                        label={faq.viewCount} 
                        size="small" 
                        icon={<SearchIcon />}
                        variant="outlined"
                      />
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Was this helpful?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ThumbUpIcon />}
                      variant="outlined"
                      color="success"
                    >
                      {faq.helpfulVotes}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ThumbDownIcon />}
                      variant="outlined"
                      color="error"
                    >
                      {faq.notHelpfulVotes}
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          {(!helpContent.faqs || helpContent.faqs.length === 0) && !loading && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No FAQs found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Try adjusting your search terms or category filter
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  const renderGuidesTab = () => (
    <Box>
      {/* Search and Filter */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Browse User Guides & Articles
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search guides and articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GetAppIcon />}
                onClick={downloadPDFManual}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  height: '56px'
                }}
              >
                Download PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Articles Grid */}
      {!loading && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {searchQuery ? `Search Results (${helpContent.articles?.length || 0})` : 'User Guides & Articles'}
            </Typography>
            <Chip 
              label={`${helpContent.articles?.length || 0} Articles`} 
              color="secondary" 
              variant="outlined" 
            />
          </Box>

          <Grid container spacing={3}>
            {helpContent.articles && helpContent.articles.map((article) => (
              <Grid item xs={12} sm={6} lg={4} key={article._id}>
                <Card
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ArticleIcon />
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {article.title}
                      </Typography>
                    }
                    subheader={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {article.difficulty && (
                            <Chip
                              label={article.difficulty}
                              size="small"
                              color={
                                article.difficulty === 'beginner'
                                  ? 'success'
                                  : article.difficulty === 'intermediate'
                                  ? 'warning'
                                  : 'error'
                              }
                            />
                          )}
                          <Chip
                            label={getCategoryIcon(article.category)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          By {article.authorName} • {article.viewCount} views
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent sx={{ flex: 1, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {article.excerpt}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                      {article.tags.slice(0, 3).map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<ArticleIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      }}
                    >
                      Read Guide
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {(!helpContent.articles || helpContent.articles.length === 0) && !loading && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No articles found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Try adjusting your search terms or filters
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  const renderVideosTab = () => (
    <Box>
      {/* Search and Filter */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Video Tutorials & Training
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search video tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {moduleCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Videos Grid */}
      {!loading && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {searchQuery ? `Search Results (${helpContent.videos?.length || 0})` : 'Video Tutorials'}
            </Typography>
            <Chip 
              label={`${helpContent.videos?.length || 0} Videos`} 
              color="info" 
              variant="outlined" 
            />
          </Box>

          <Grid container spacing={3}>
            {helpContent.videos && helpContent.videos.map((video) => (
              <Grid item xs={12} sm={6} lg={4} key={video._id}>
                <Card
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      position: 'relative',
                      backgroundImage: video.thumbnailUrl ? `url(${video.thumbnailUrl})` : 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleVideoPlay(video)}
                  >
                    <IconButton
                      sx={{
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        '&:hover': { 
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          transform: 'scale(1.1)',
                        },
                        width: 64,
                        height: 64,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <PlayIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                    {video.duration && (
                      <Chip
                        label={video.duration}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                        }}
                      />
                    )}
                    <Chip
                      label={video.difficulty}
                      size="small"
                      color={
                        video.difficulty === 'beginner'
                          ? 'success'
                          : video.difficulty === 'intermediate'
                          ? 'warning'
                          : 'error'
                      }
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                      }}
                    />
                  </CardMedia>
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {video.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        By {video.authorName}
                      </Typography>
                      <Chip 
                        label={`${video.viewCount} views`} 
                        size="small" 
                        variant="outlined"
                        icon={<VideoIcon />}
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<PlayIcon />}
                      onClick={() => handleVideoPlay(video)}
                      sx={{
                        background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                      }}
                    >
                      Watch Video
                    </Button>
                    <Tooltip title="Open in YouTube">
                      <IconButton 
                        onClick={() => window.open(video.youtubeUrl, '_blank')}
                        sx={{ ml: 1 }}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {(!helpContent.videos || helpContent.videos.length === 0) && !loading && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No videos found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Try adjusting your search terms or filters
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );

  const renderContactTab = () => (
    <Box>
      <Grid container spacing={3}>
        {/* Contact Options */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Contact Support" 
              avatar={<SupportIcon />}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '& .MuiCardHeader-avatar': { color: 'white' }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {/* WhatsApp Support */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '2px solid transparent',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
                        borderColor: '#25D366',
                      }
                    }}
                    onClick={() => window.open(getWhatsAppLink(), '_blank')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <WhatsAppIcon sx={{ fontSize: 48, color: '#25D366', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        WhatsApp Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Get instant help via WhatsApp
                      </Typography>
                      <Chip 
                        label="Available 24/7" 
                        color="success" 
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Live Chat */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                      }
                    }}
                    onClick={() => setShowContactDialog(true)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <ChatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Live Chat
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Chat with our support team
                      </Typography>
                      <Badge badgeContent="Online" color="success">
                        <Chip label="Mon-Fri, 9AM-6PM WAT" size="small" />
                      </Badge>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Email Support */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
                      }
                    }}
                    onClick={() => window.open(`mailto:${helpSettings?.supportEmail || 'support@pharmacycopilot.ng'}`, '_blank')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <EmailIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Email Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {helpSettings?.supportEmail || 'support@pharmacycopilot.ng'}
                      </Typography>
                      <Chip label="24 hour response" size="small" />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Phone Support */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(255, 152, 0, 0.3)',
                      }
                    }}
                    onClick={() => window.open(`tel:${helpSettings?.supportPhone || '+234-1-234-5678'}`, '_blank')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <PhoneIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Phone Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {helpSettings?.supportPhone || '+234-1-234-5678'}
                      </Typography>
                      <Chip label="Business hours only" size="small" />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Additional Support Options */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Other Ways to Get Help
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BugReportIcon />}
                      onClick={() => {
                        setFeedbackType('bug_report');
                        setShowFeedbackDialog(true);
                      }}
                      sx={{ py: 1.5 }}
                    >
                      Report a Bug
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<LightbulbIcon />}
                      onClick={() => {
                        setFeedbackType('feature_request');
                        setShowFeedbackDialog(true);
                      }}
                      sx={{ py: 1.5 }}
                    >
                      Feature Request
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Resources & System Status */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Quick Resources" avatar={<GetAppIcon />} />
            <CardContent>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="User Manual"
                    secondary="Complete documentation"
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={downloadPDFManual}
                  >
                    Download
                  </Button>
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <ApiIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Documentation"
                    secondary="Developer resources"
                  />
                  <Button variant="outlined" size="small">
                    View
                  </Button>
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <SchoolIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Training Materials"
                    secondary="Guides and best practices"
                  />
                  <Button variant="outlined" size="small">
                    Access
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader
              title="System Status"
              avatar={
                <Badge 
                  badgeContent={helpSettings?.systemStatus?.status === 'operational' ? '●' : '!'} 
                  color={helpSettings?.systemStatus?.status === 'operational' ? 'success' : 'error'}
                >
                  <SettingsIcon />
                </Badge>
              }
            />
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Chip
                  label={helpSettings?.systemStatus?.status === 'operational' ? 'All Systems Operational' : 'System Issues'}
                  color={helpSettings?.systemStatus?.status === 'operational' ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {helpSettings?.systemStatus?.message || 'All PharmacyCopilot services are running normally.'}
              </Typography>
              <Button variant="outlined" fullWidth>
                View Status Page
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (initialLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={400} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Show error state if help content failed to load
  if (!initialLoading && error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Unable to Load Help Content
          </Typography>
          <Typography variant="body2" paragraph>
            {error}
          </Typography>
          <Typography variant="body2">
            Please try refreshing the page or contact support if the problem persists.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
        </Alert>
      </Container>
    );
  }

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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              <HelpIcon sx={{ mr: 1, fontSize: 'inherit' }} />
              Help & Support
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Find answers, learn about features, and get the support you need
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={downloadPDFManual}
            >
              Download Manual
            </Button>
            <Button
              variant="contained"
              startIcon={<FeedbackIcon />}
              onClick={() => setShowFeedbackDialog(true)}
            >
              Send Feedback
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Hero Section */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ py: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {helpSettings?.customization?.welcomeMessage || 'How can we help you today?'}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
              Search our knowledge base or browse categories below
            </Typography>
            
            {/* Global Search */}
            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
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
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          </Box>

          {/* Quick Category Access */}
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            Popular Categories
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {(categories.length > 0 ? categories : moduleCategories).slice(0, 6).map((category) => (
              <Grid item xs={6} sm={4} md={2} key={category.name}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                  onClick={() => {
                    setSelectedCategory(category.name || category.id || category.label);
                    setActiveTab(0);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    {getCategoryIcon(category.name)}
                    <Typography variant="body2" sx={{ mt: 1, color: 'white', fontWeight: 600 }}>
                      {(category.name || category.label || category.id).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {category.count || 0} items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
              }
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            }
          }}
        >
          {helpTabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {tab.label}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {index === 0 && `${helpContent.faqs?.length || 0} items`}
                    {index === 1 && `${helpContent.articles?.length || 0} items`}
                    {index === 2 && `${helpContent.videos?.length || 0} items`}
                    {index === 3 && 'Get Help'}
                  </Typography>
                </Box>
              }
              iconPosition="start"
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

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* WhatsApp FAB */}
          <Tooltip title="WhatsApp Support" placement="left">
            <Fab
              sx={{
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#128C7E' },
                color: 'white',
              }}
              onClick={() => window.open(getWhatsAppLink(), '_blank')}
            >
              <WhatsAppIcon />
            </Fab>
          </Tooltip>
          
          {/* Feedback FAB */}
          <Tooltip title="Send Feedback" placement="left">
            <Fab
              color="primary"
              onClick={() => setShowFeedbackDialog(true)}
            >
              <FeedbackIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 8, py: 4, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          {helpSettings?.customization?.footerText || 'Need more help? Contact our support team.'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon />}
            onClick={() => window.open(getWhatsAppLink(), '_blank')}
          >
            WhatsApp
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EmailIcon />}
            onClick={() => window.open(`mailto:${helpSettings?.supportEmail}`, '_blank')}
          >
            Email
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GetAppIcon />}
            onClick={downloadPDFManual}
          >
            Download Manual
          </Button>
        </Box>
      </Box>

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
            Before starting the chat, please have the following information
            ready:
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

      {/* Enhanced Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon />
            Send Feedback
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Feedback Type</InputLabel>
                <Select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                >
                  <MenuItem value="general">General Feedback</MenuItem>
                  <MenuItem value="bug_report">Bug Report</MenuItem>
                  <MenuItem value="feature_request">Feature Request</MenuItem>
                  <MenuItem value="article">Article Feedback</MenuItem>
                  <MenuItem value="video">Video Feedback</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rate your experience
                </Typography>
                <Rating
                  value={feedbackRating}
                  onChange={(_, newValue) => setFeedbackRating(newValue || 0)}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                placeholder="Brief summary of your feedback"
                value={feedbackTitle}
                onChange={(e) => setFeedbackTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your feedback"
                placeholder="Tell us what you think or suggest improvements..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitFeedback}
            disabled={!feedbackRating || !feedbackTitle.trim() || !feedbackComment.trim()}
          >
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog
        open={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedVideo?.title}
            </Typography>
            <IconButton onClick={() => setShowVideoDialog(false)}>
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedVideo && (
            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeVideoId}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<OpenInNewIcon />}
            onClick={() => selectedVideo && window.open(selectedVideo.youtubeUrl, '_blank')}
          >
            Open in YouTube
          </Button>
          <Button onClick={() => setShowVideoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Help;
