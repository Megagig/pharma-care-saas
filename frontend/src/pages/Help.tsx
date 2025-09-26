import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle as QuestionAnswerIcon,
  Book as BookIcon,
  Video as VideoIcon,
  Headphones as SupportIcon,
  HelpCircle as HelpIcon,
  GraduationCap as SchoolIcon,
  Users as GroupIcon,
  BarChart3 as AssessmentIcon,
  CreditCard as PaymentIcon,
  Shield as SecurityIcon,
  Settings as SettingsIcon,
  Code as ApiIcon,
  ChevronDown as ExpandMoreIcon,
  ThumbsUp as ThumbUpIcon,
  ThumbsDown as ThumbDownIcon,
  Search as SearchIcon,
  FileText as ArticleIcon,
  Play as PlayIcon,
  MessageSquare as ChatIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  Bug as BugReportIcon,
  Lightbulb as LightbulbIcon,
  Download as GetAppIcon,
  MessageSquare as FeedbackIcon,
} from 'lucide-react';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockInput = ({ ...props }: any) => (
  <input {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`} />
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardHeader = ({ children, ...props }: any) => (
  <div {...props} className={`border-b px-6 py-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-lg font-semibold ${props.className || ''}`}>
    {children}
  </h3>
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.className || ''}`}>
    {children}
  </span>
);

const MockDialog = ({ children, open, ...props }: any) => (
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {children}
      </div>
    </div>
  ) : null
);

const MockDialogContent = ({ children, ...props }: any) => (
  <div {...props} className="p-6">
    {children}
  </div>
);

const MockDialogTitle = ({ children, ...props }: any) => (
  <h3 {...props} className="text-lg font-semibold border-b pb-4">
    {children}
  </h3>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 rounded-md ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordion = ({ children, ...props }: any) => (
  <div {...props} className="border rounded-md">
    {children}
  </div>
);

const MockAccordionSummary = ({ children, expandIcon, ...props }: any) => (
  <div {...props} className="flex justify-between items-center p-4 cursor-pointer">
    {children}
    {expandIcon}
  </div>
);

const MockAccordionDetails = ({ children, ...props }: any) => (
  <div {...props} className="p-4 border-t">
    {children}
  </div>
);

const MockTabs = ({ children, value, onChange, ...props }: any) => (
  <div {...props}>
    {children}
  </div>
);

const MockTab = ({ children, ...props }: any) => (
  <button {...props} className="px-4 py-2">
    {children}
  </button>
);

const MockSeparator = ({ ...props }: any) => (
  <hr {...props} className="border-gray-200 dark:border-gray-700" />
);

const MockFab = ({ children, ...props }: any) => (
  <button {...props} className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg ${props.className || ''}`}>
    {children}
  </button>
);

const MockRating = ({ value, onChange, ...props }: any) => (
  <div {...props}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange && onChange(null, star)}
        className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const MockList = ({ children, ...props }: any) => (
  <div {...props} className="divide-y divide-gray-200 dark:divide-gray-700">
    {children}
  </div>
);

const MockListItem = ({ children, ...props }: any) => (
  <div {...props} className="p-4">
    {children}
  </div>
);

const MockListItemText = ({ primary, secondary, ...props }: any) => (
  <div {...props}>
    <div className="font-medium">{primary}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{secondary}</div>
  </div>
);

const MockListItemIcon = ({ children, ...props }: any) => (
  <div {...props} className="mr-4">
    {children}
  </div>
);

const MockListItemSecondaryAction = ({ children, ...props }: any) => (
  <div {...props} className="ml-auto">
    {children}
  </div>
);

const MockBreadcrumbs = ({ children, ...props }: any) => (
  <div {...props} className="flex items-center space-x-2 text-sm">
    {children}
  </div>
);

const MockChip = ({ label, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${props.className || ''}`}>
    {label}
  </span>
);

const MockDialogActions = ({ children, ...props }: any) => (
  <div {...props} className="flex justify-end space-x-2 mt-4">
    {children}
  </div>
);

const MockTypography = ({ children, ...props }: any) => {
  const variant = props.variant || 'body1';
  const component = props.component || 'p';

  const getClasses = () => {
    switch (variant) {
      case 'h1': return 'text-2xl font-bold';
      case 'h2': return 'text-xl font-bold';
      case 'h3': return 'text-lg font-bold';
      case 'h4': return 'text-md font-bold';
      case 'h5': return 'text-sm font-bold';
      case 'h6': return 'text-xs font-bold';
      case 'subtitle1': return 'text-lg';
      case 'subtitle2': return 'text-md';
      case 'body1': return 'text-base';
      case 'body2': return 'text-sm';
      case 'caption': return 'text-xs';
      default: return 'text-base';
    }
  };

  const Component = component;
  return (
    <Component {...props} className={`${getClasses()} ${props.color === 'textSecondary' ? 'text-gray-500 dark:text-gray-400' : ''} ${props.className || ''}`}>
      {children}
    </Component>
  );
};

// Replace imports with mock components
const Button = MockButton;
const Input = MockInput;
const Card = MockCard;
const CardContent = MockCardContent;
const CardHeader = MockCardHeader;
const CardTitle = MockCardTitle;
const Badge = MockBadge;
const Dialog = MockDialog;
const DialogContent = MockDialogContent;
const DialogTitle = MockDialogTitle;
const Alert = MockAlert;
const Accordion = MockAccordion;
const AccordionSummary = MockAccordionSummary;
const AccordionDetails = MockAccordionDetails;
const Tabs = MockTabs;
const Tab = MockTab;
const Separator = MockSeparator;
const Fab = MockFab;
const Rating = MockRating;
const List = MockList;
const ListItem = MockListItem;
const ListItemText = MockListItemText;
const ListItemIcon = MockListItemIcon;
const ListItemSecondaryAction = MockListItemSecondaryAction;
const Breadcrumbs = MockBreadcrumbs;
const Chip = MockChip;
const DialogActions = MockDialogActions;
const Typography = MockTypography;

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
      answer:
        'To add a new patient, navigate to the Patients section from the sidebar, click the "Add Patient" button, and fill out the required information including name, contact details, and medical information.',
      category: 'patients',
      helpful: 45,
      notHelpful: 2,
      tags: ['patients', 'add', 'register'],
    },
    {
      id: '2',
      question: 'How can I manage my subscription plan?',
      answer:
        'You can manage your subscription by going to the Subscriptions page from the sidebar. There you can view your current plan, upgrade or downgrade, and update payment methods.',
      category: 'billing',
      helpful: 38,
      notHelpful: 1,
      tags: ['subscription', 'billing', 'payment'],
    },
    {
      id: '3',
      question: 'What should I do if I forgot my password?',
      answer:
        'Click the "Forgot Password" link on the login page. Enter your email address and check your inbox for a password reset link. Follow the instructions in the email to create a new password.',
      category: 'account',
      helpful: 52,
      notHelpful: 0,
      tags: ['password', 'login', 'security'],
    },
    {
      id: '4',
      question: 'How do I generate reports for my pharmacy?',
      answer:
        'Go to the Reports section and select the type of report you want to generate (sales, inventory, patients, etc.). Choose your date range and filters, then click "Generate Report".',
      category: 'reports',
      helpful: 29,
      notHelpful: 3,
      tags: ['reports', 'analytics', 'data'],
    },
    {
      id: '5',
      question: 'Can I import my existing patient data?',
      answer:
        'Yes, you can import patient data using CSV files. Go to Patients > Import Data, download our CSV template, fill it with your data, and upload it back to the system.',
      category: 'patients',
      helpful: 31,
      notHelpful: 5,
      tags: ['import', 'data', 'csv'],
    },
  ]);

  const [helpArticles] = useState<HelpArticle[]>([
    {
      id: '1',
      title: 'Getting Started with PharmaCare',
      description:
        'A comprehensive guide to setting up your pharmacy management system',
      category: 'getting-started',
      readTime: 10,
      difficulty: 'beginner',
      lastUpdated: '2024-01-15',
    },
    {
      id: '2',
      title: 'Advanced Patient Management Features',
      description:
        'Learn about advanced features for managing patient records and history',
      category: 'patients',
      readTime: 15,
      difficulty: 'intermediate',
      lastUpdated: '2024-01-20',
    },
    {
      id: '3',
      title: 'Setting Up Two-Factor Authentication',
      description: 'Secure your account with two-factor authentication',
      category: 'security',
      readTime: 5,
      difficulty: 'beginner',
      lastUpdated: '2024-01-18',
    },
  ]);

  const [videoTutorials] = useState<VideoTutorial[]>([
    {
      id: '1',
      title: 'PharmaCare Dashboard Overview',
      description: 'Get familiar with your dashboard and key features',
      thumbnail: '/thumbnails/dashboard-overview.jpg',
      duration: '3:45',
      category: 'getting-started',
      views: 1247,
    },
    {
      id: '2',
      title: 'Managing Inventory and Stock',
      description: 'Learn how to track and manage your medication inventory',
      thumbnail: '/thumbnails/inventory-management.jpg',
      duration: '7:22',
      category: 'inventory',
      views: 892,
    },
  ]);

  const helpTabs = [
    { id: 'faq', label: 'FAQs', icon: <QuestionAnswerIcon /> },
    { id: 'guides', label: 'Guides', icon: <BookIcon /> },
    { id: 'videos', label: 'Video Tutorials', icon: <VideoIcon /> },
    { id: 'contact', label: 'Contact Support', icon: <SupportIcon /> },
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: <HelpIcon />, count: 0 },
    {
      id: 'getting-started',
      label: 'Getting Started',
      icon: <SchoolIcon />,
      count: 8,
    },
    {
      id: 'patients',
      label: 'Patient Management',
      icon: <GroupIcon />,
      count: 12,
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: <AssessmentIcon />,
      count: 7,
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: <PaymentIcon />,
      count: 6,
    },
    {
      id: 'security',
      label: 'Security & Privacy',
      icon: <SecurityIcon />,
      count: 5,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <AssessmentIcon />,
      count: 9,
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: <SettingsIcon />,
      count: 4,
    },
    { id: 'api', label: 'API & Integrations', icon: <ApiIcon />, count: 3 },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFeedbackSubmit = () => {
    // Handle feedback submission
    setShowFeedbackDialog(false);
    setFeedbackRating(0);
    setFeedbackComment('');
  };

  const renderFAQTab = () => (
    <div>
      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}{' '}
                    {category.count > 0 && `(${category.count})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular FAQs */}
      <Typography variant="h6" className="mb-4">
        Popular Questions
      </Typography>

      {filteredFAQs.map((faq) => (
        <Accordion key={faq.id} className="mb-2">
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`faq-${faq.id}-content`}
            id={`faq-${faq.id}-header`}
          >
            <div className="w-full">
              <Typography variant="subtitle1" className="font-medium">
                {faq.question}
              </Typography>
              <div className="flex flex-wrap gap-1 mt-1">
                {faq.tags.slice(0, 2).map((tag) => (
                  <Chip key={tag} label={tag} size="sm" />
                ))}
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              {faq.answer}
            </Typography>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <Typography variant="body2" color="textSecondary">
                Was this helpful?
              </Typography>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  startIcon={<ThumbUpIcon />}
                  className="flex items-center gap-1"
                >
                  {faq.helpful}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  startIcon={<ThumbDownIcon />}
                  className="flex items-center gap-1"
                >
                  {faq.notHelpful}
                </Button>
              </div>
            </div>
          </AccordionDetails>
        </Accordion>
      ))}

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No FAQs found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your search terms or category filter
            </Typography>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderGuidesTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {helpArticles.map((article) => (
        <Card key={article.id} className="h-full">
          <CardHeader
            title={
              <Typography variant="h6" component="div" noWrap>
                {article.title}
              </Typography>
            }
            subheader={
              <div className="flex items-center gap-2">
                <Chip
                  label={article.difficulty}
                  size="sm"
                  className={
                    article.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800'
                      : article.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }
                />
                <Typography variant="body2" color="textSecondary">
                  {article.readTime} min read
                </Typography>
              </div>
            }
            avatar={<ArticleIcon />}
          />
          <CardContent>
            <Typography variant="body2" color="textSecondary" paragraph>
              {article.description}
            </Typography>
          </CardContent>
          <div className="p-4 pt-0">
            <Button fullWidth startIcon={<PlayIcon />}>
              Read Guide
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderVideosTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {videoTutorials.map((video) => (
        <Card key={video.id} className="h-full">
          <div className="relative h-40 bg-gray-200 rounded-t-lg">
            <Button
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center"
            >
              <PlayIcon className="h-6 w-6 text-blue-600" />
            </Button>
            <Chip
              label={video.duration}
              size="sm"
              className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white"
            />
          </div>
          <CardContent>
            <Typography variant="h6" gutterBottom noWrap>
              {video.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {video.description}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {video.views.toLocaleString()} views
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContactTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader title="Contact Options" avatar={<SupportIcon />} />
          <Separator />
          <CardContent>
            <List>
              <ListItem
                button
                onClick={() => setShowContactDialog(true)}
                className="cursor-pointer"
              >
                <ListItemIcon>
                  <ChatIcon className="text-blue-600" />
                </ListItemIcon>
                <ListItemText
                  primary="Live Chat"
                  secondary="Chat with our support team (Mon-Fri, 9AM-6PM WAT)"
                />
                <ListItemSecondaryAction>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <EmailIcon className="text-blue-600" />
                </ListItemIcon>
                <ListItemText
                  primary="Email Support"
                  secondary="support@pharmacare.ng - We typically respond within 24 hours"
                />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <PhoneIcon className="text-blue-600" />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Support"
                  secondary="+234 1 234 5678 (Business hours only)"
                />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <BugReportIcon className="text-red-600" />
                </ListItemIcon>
                <ListItemText
                  primary="Report a Bug"
                  secondary="Help us improve by reporting issues you encounter"
                />
              </ListItem>
              <ListItem
                button
                onClick={() => setShowFeedbackDialog(true)}
                className="cursor-pointer"
              >
                <ListItemIcon>
                  <LightbulbIcon className="text-yellow-600" />
                </ListItemIcon>
                <ListItemText
                  primary="Feature Request"
                  secondary="Suggest new features or improvements"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader title="Quick Resources" avatar={<GetAppIcon />} />
          <Separator />
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
                <ListItemSecondaryAction>
                  <Button size="sm">Download</Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ApiIcon />
                </ListItemIcon>
                <ListItemText
                  primary="API Documentation"
                  secondary="Developer resources for integrations"
                />
                <ListItemSecondaryAction>
                  <Button size="sm">View</Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Training Materials"
                  secondary="Training guides and best practices"
                />
                <ListItemSecondaryAction>
                  <Button size="sm">Access</Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="System Status"
            avatar={
              <Badge className="bg-green-100 text-green-800 mr-2">
                All Systems Operational
              </Badge>
            }
          />
          <Separator />
          <CardContent>
            <Typography variant="body2" color="textSecondary" paragraph>
              All PharmaCare services are running normally. Check our status
              page for real-time updates.
            </Typography>
            <Button fullWidth>View Status Page</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs aria-label="breadcrumb" className="mb-4">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Dashboard
          </Link>
          <span className="text-gray-500">Help & Support</span>
        </Breadcrumbs>
        <div className="flex items-center gap-3">
          <HelpIcon className="h-8 w-8 text-blue-600" />
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              Help & Support
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Find answers, learn about features, and get the support you need
            </Typography>
          </div>
        </div>
      </div>

      {/* Quick Help Search */}
      <Card className="mb-8">
        <CardContent>
          <div className="mb-4">
            <Typography variant="h6" gutterBottom>
              How can we help you today?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Search our knowledge base or browse categories below
            </Typography>
          </div>
          <Input
            placeholder="Search for help articles, FAQs, or tutorials..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="mb-6"
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categories.slice(1, 5).map((category) => (
              <Button
                key={category.id}
                variant="outlined"
                fullWidth
                startIcon={category.icon}
                className="flex-col items-start p-4 h-auto"
              >
                <div className="text-left">
                  <Typography variant="subtitle1">{category.label}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {category.count} articles
                  </Typography>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <Tabs value={activeTab} onChange={handleTabChange}>
          {helpTabs.map((tab) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 0 && renderFAQTab()}
        {activeTab === 1 && renderGuidesTab()}
        {activeTab === 2 && renderVideosTab()}
        {activeTab === 3 && renderContactTab()}
      </div>

      {/* Floating Feedback Button */}
      <Fab
        color="primary"
        className="fixed bottom-6 right-6"
        onClick={() => setShowFeedbackDialog(true)}
      >
        <FeedbackIcon />
      </Fab>

      {/* Contact Dialog */}
      <Dialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
      >
        <DialogTitle>
          <div className="flex items-center gap-2">
            <ChatIcon />
            Start Live Chat
          </div>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" className="mb-4">
            Our support team is currently online and ready to help!
          </Alert>
          <Typography variant="body1" paragraph>
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
          <Button>Start Chat</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
      >
        <DialogTitle>
          <div className="flex items-center gap-2">
            <FeedbackIcon />
            Send Feedback
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="mb-4">
            <Typography variant="h6" gutterBottom>
              How would you rate your experience?
            </Typography>
            <Rating
              value={feedbackRating}
              onChange={(_: any, newValue: number | null) => setFeedbackRating(newValue || 0)}
              size="large"
            />
          </div>
          <Input
            multiline
            rows={4}
            placeholder="Tell us what you think or suggest improvements..."
            value={feedbackComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeedbackComment(e.target.value)}
            className="w-full"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
          <Button
            onClick={handleFeedbackSubmit}
            disabled={!feedbackRating || !feedbackComment.trim()}
          >
            Send Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Help;
