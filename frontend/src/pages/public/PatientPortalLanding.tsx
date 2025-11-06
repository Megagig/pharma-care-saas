import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Paper,
  useTheme,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Grid,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  LocalPharmacy as LocalPharmacyIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Favorite as FavoriteIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import Footer from '../../components/Footer';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useHealthBlog } from '../../hooks/useHealthBlog';
import WorkspaceSearch from '../../components/patient-portal/WorkspaceSearch';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: number;
  viewCount: number;
  isFeatured: boolean;
}

interface MenuItem {
  label: string;
  path?: string;
  action?: () => void;
}

const PatientPortalLanding: React.FC = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const observerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch blog posts
  const {
    data: featuredPosts,
    isLoading: featuredLoading
  } = useHealthBlog.useFeaturedPosts(3);

  const {
    data: latestPosts,
    isLoading: latestLoading
  } = useHealthBlog.useLatestPosts({ limit: 9 });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToWorkspaceSearch = () => {
    const element = document.getElementById('workspace-search-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const menuItems: MenuItem[] = [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Find My Pharmacy', action: scrollToWorkspaceSearch },
    { label: 'Sign In', path: '/patient-portal/login' },
    { label: 'Get Started', path: '/register' },
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    Object.keys(observerRefs.current).forEach((key) => {
      const element = observerRefs.current[key];
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setIsVisible((prev) => ({ ...prev, [key]: true }));
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const features = [
    {
      icon: ScheduleIcon,
      title: 'Easy Appointment Booking',
      description: 'Book appointments with your pharmacist online 24/7. No more phone calls or waiting.',
    },
    {
      icon: LocalPharmacyIcon,
      title: 'Medication Management',
      description: 'View your prescriptions, request refills, and track your medication adherence.',
    },
    {
      icon: ChatIcon,
      title: 'Secure Messaging',
      description: 'Communicate directly with your pharmacist through our secure messaging system.',
    },
    {
      icon: AssessmentIcon,
      title: 'Health Records Access',
      description: 'Access your lab results, vitals, and complete medical history anytime.',
    },
    {
      icon: SecurityIcon,
      title: 'HIPAA Compliant',
      description: 'Your health information is protected with enterprise-grade security.',
    },
    {
      icon: FavoriteIcon,
      title: 'Personalized Care',
      description: 'Receive personalized health recommendations and medication reminders.',
    },
  ];

  const scrollToFeatures = () => {
    const element = document.getElementById('features-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' } = {
      nutrition: 'success',
      wellness: 'primary',
      medication: 'info',
      chronic_diseases: 'warning',
      preventive_care: 'secondary',
      mental_health: 'error',
    };
    return colors[category] || 'primary';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <LocalPharmacyIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              PharmaCare Patient Portal
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Button
              onClick={scrollToWorkspaceSearch}
              color="inherit"
              startIcon={<LocalPharmacyIcon />}
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                px: 2,
              }}
            >
              Find My Pharmacy
            </Button>
            <Button component={Link} to="/about" color="inherit">
              About
            </Button>
            <Button component={Link} to="/contact" color="inherit">
              Contact
            </Button>
            <Button component={Link} to="/pricing" color="inherit">
              Pricing
            </Button>
            <ThemeToggle size="sm" variant="button" />
            <Button component={Link} to="/patient-portal/login" color="inherit">
              Sign In
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              sx={{ borderRadius: 3 }}
            >
              Get Started
            </Button>
          </Box>

          {/* Mobile Navigation */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ThemeToggle size="sm" variant="button" />
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleMobileMenu}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Drawer Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                }}
              >
                <LocalPharmacyIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Patient Portal
              </Typography>
            </Box>
            <IconButton onClick={closeMobileMenu}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Menu Items */}
          <List>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  component={item.path ? Link : 'div'}
                  to={item.path}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    }
                    closeMobileMenu();
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Hero Section */}
      <Box
        sx={{
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: 6,
            }}
          >
            {/* Left Content */}
            <Box
              sx={{
                flex: 1,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              {/* Stats Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(6, 182, 212, 0.1)'
                      : 'rgba(6, 182, 212, 0.15)',
                  px: 3,
                  py: 1,
                  borderRadius: 10,
                  mb: 3,
                }}
              >
                <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.main', fontWeight: 600 }}
                >
                  Trusted by Thousands of Patients!
                </Typography>
              </Box>

              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: 'text.primary',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Your Health,{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Connected
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  maxWidth: '600px',
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                Access your pharmacy services online. Book appointments, manage prescriptions,
                communicate with your pharmacist, and take control of your health journey.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                <Button
                  onClick={scrollToWorkspaceSearch}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ py: 1.5, px: 4, borderRadius: 3 }}
                >
                  Find My Pharmacy
                </Button>
                <Button
                  component={Link}
                  to="/patient-portal/login"
                  variant="outlined"
                  size="large"
                  startIcon={<LocalPharmacyIcon />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={scrollToFeatures}
                  variant="text"
                  size="large"
                  sx={{ py: 1.5, px: 4, borderRadius: 3 }}
                >
                  Learn More
                </Button>
              </Box>
            </Box>

            {/* Right Image */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src="/images/patient-using-portal.jpg"
                alt="Patient using portal"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                }}
                onError={(e) => {
                  // Fallback to a placeholder if image doesn't exist
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwTDMwMCAxMDBIMjAwTDI1MCAxNTBaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yNTAgMTUwTDIwMCAyMDBIMzAwTDI1MCAxNTBaIiBmaWxsPSIjOUI5QkEzIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPlBhdGllbnQgUG9ydGFsPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Workspace Search Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }} id="workspace-search-section">
        <Box
          ref={(el) => (observerRefs.current['workspace-search-header'] = el as HTMLDivElement | null)}
          sx={{
            textAlign: 'center',
            mb: 6,
            opacity: isVisible['workspace-search-header'] ? 1 : 0,
            transform: isVisible['workspace-search-header']
              ? 'translateY(0)'
              : 'translateY(30px)',
            transition: 'all 0.6s ease-out',
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Find Your Pharmacy
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Search for pharmacies in your area and get started with your patient portal account
          </Typography>
        </Box>

        <Box
          ref={(el) => (observerRefs.current['workspace-search'] = el as HTMLDivElement | null)}
          sx={{
            opacity: isVisible['workspace-search'] ? 1 : 0,
            transform: isVisible['workspace-search']
              ? 'translateY(0)'
              : 'translateY(30px)',
            transition: 'all 0.6s ease-out 0.2s',
          }}
        >
          <WorkspaceSearch maxResults={6} />
        </Box>
      </Container>

      {/* Featured Blog Posts Section */}
      {!featuredLoading && featuredPosts?.data && featuredPosts.data.length > 0 && (
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box
            ref={(el) => (observerRefs.current['featured-blog-header'] = el as HTMLDivElement | null)}
            sx={{
              textAlign: 'center',
              mb: 6,
              opacity: isVisible['featured-blog-header'] ? 1 : 0,
              transform: isVisible['featured-blog-header']
                ? 'translateY(0)'
                : 'translateY(30px)',
              transition: 'all 0.6s ease-out',
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Featured Health Articles
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: '600px', mx: 'auto' }}
            >
              Stay informed with expert health advice and tips from our pharmacists
            </Typography>
          </Box>

          <Box
            ref={(el) => (observerRefs.current['featured-blog'] = el as HTMLDivElement | null)}
            sx={{
              opacity: isVisible['featured-blog'] ? 1 : 0,
              transform: isVisible['featured-blog']
                ? 'translateY(0)'
                : 'translateY(30px)',
              transition: 'all 0.6s ease-out 0.2s',
            }}
          >
            <Grid container spacing={4}>
              {featuredPosts.data.slice(0, 3).map((post: BlogPost, index: number) => (
                <Grid item xs={12} md={4} key={post._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(8, 145, 178, 0.15)',
                      },
                    }}
                  >
                    {post.featuredImage && (
                      <Box
                        component="img"
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={post.category.replace('_', ' ').toUpperCase()}
                          color={getCategoryColor(post.category)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ fontWeight: 600, mb: 2, lineHeight: 1.3 }}
                      >
                        {post.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, lineHeight: 1.5 }}
                      >
                        {post.excerpt}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 'auto',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                            src={post.author.avatar}
                          >
                            {post.author.name.charAt(0)}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {post.author.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {post.readTime} min
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {post.viewCount}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Button
                        component={Link}
                        to={`/blog/${post.slug}`}
                        variant="text"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ mt: 2, p: 0, justifyContent: 'flex-start' }}
                      >
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      )}

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }} id="features-section">
        <Box
          ref={(el) => (observerRefs.current['features-header'] = el as HTMLDivElement | null)}
          sx={{
            textAlign: 'center',
            mb: 8,
            opacity: isVisible['features-header'] ? 1 : 0,
            transform: isVisible['features-header']
              ? 'translateY(0)'
              : 'translateY(30px)',
            transition: 'all 0.6s ease-out',
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Everything You Need for Better Health
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '700px', mx: 'auto' }}
          >
            Access comprehensive pharmacy services from the comfort of your home
          </Typography>
        </Box>

        <Box
          ref={(el) => (observerRefs.current['features'] = el as HTMLDivElement | null)}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 4,
            opacity: isVisible['features'] ? 1 : 0,
            transform: isVisible['features']
              ? 'translateY(0)'
              : 'translateY(30px)',
            transition: 'all 0.6s ease-out 0.2s',
          }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(8, 145, 178, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <IconComponent
                      sx={{ fontSize: 32, color: 'primary.main' }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>

      {/* Latest Blog Posts Grid */}
      {!latestLoading && latestPosts?.data && latestPosts.data.length > 0 && (
        <Box
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(6, 182, 212, 0.05)'
                : 'rgba(6, 182, 212, 0.08)',
            py: { xs: 8, md: 12 },
          }}
        >
          <Container maxWidth="lg">
            <Box
              ref={(el) => (observerRefs.current['latest-blog-header'] = el as HTMLDivElement | null)}
              sx={{
                textAlign: 'center',
                mb: 6,
                opacity: isVisible['latest-blog-header'] ? 1 : 0,
                transform: isVisible['latest-blog-header']
                  ? 'translateY(0)'
                  : 'translateY(30px)',
                transition: 'all 0.6s ease-out',
              }}
            >
              <Typography
                variant="h3"
                component="h2"
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Latest Health Articles
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                Discover the latest insights and tips for better health
              </Typography>
            </Box>

            <Box
              ref={(el) => (observerRefs.current['latest-blog'] = el as HTMLDivElement | null)}
              sx={{
                opacity: isVisible['latest-blog'] ? 1 : 0,
                transform: isVisible['latest-blog']
                  ? 'translateY(0)'
                  : 'translateY(30px)',
                transition: 'all 0.6s ease-out 0.2s',
              }}
            >
              <Grid container spacing={3}>
                {latestPosts.data.slice(0, 9).map((post: BlogPost) => (
                  <Grid item xs={12} sm={6} md={4} key={post._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(8, 145, 178, 0.1)',
                        },
                      }}
                    >
                      {post.featuredImage && (
                        <Box
                          component="img"
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt}
                          sx={{
                            width: '100%',
                            height: 160,
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={post.category.replace('_', ' ').toUpperCase()}
                            color={getCategoryColor(post.category)}
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}
                        >
                          {post.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2, lineHeight: 1.4 }}
                        >
                          {post.excerpt.substring(0, 100)}...
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 'auto',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(post.publishedAt)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {post.readTime} min
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          component={Link}
                          to={`/blog/${post.slug}`}
                          variant="text"
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          sx={{ mt: 1, p: 0, justifyContent: 'flex-start' }}
                        >
                          Read More
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Button
                component={Link}
                to="/blog"
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.5, px: 4, borderRadius: 3 }}
              >
                View All Articles
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box
          ref={(el) => (observerRefs.current['about'] = el as HTMLDivElement | null)}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 6,
            alignItems: 'center',
            opacity: isVisible['about'] ? 1 : 0,
            transform: isVisible['about']
              ? 'translateY(0)'
              : 'translateY(30px)',
            transition: 'all 0.6s ease-out',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontWeight: 600, mb: 4 }}
            >
              Why Choose Our Patient Portal?
            </Typography>
            <Box sx={{ mb: 4 }}>
              {[
                'Connect with your pharmacy anytime, anywhere',
                'Secure, HIPAA-compliant platform',
                'Easy-to-use interface designed for patients',
                'Real-time updates on your prescriptions',
                'Direct communication with your pharmacist',
                'Access to educational health resources',
              ].map((benefit, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2 }} />
                  <Typography variant="body1" color="text.primary">
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Button
              component={Link}
              to="/patient-portal/search"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.5, px: 4, borderRadius: 3 }}
            >
              Get Started Today
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box
              component="img"
              src="/images/patient-pharmacist-consultation.jpg"
              alt="Patient pharmacist consultation"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 4,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              }}
              onError={(e) => {
                // Fallback to a placeholder if image doesn't exist
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwTDMwMCAxMDBIMjAwTDI1MCAxNTBaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yNTAgMTUwTDIwMCAyMDBIMzAwTDI1MCAxNTBaIiBmaWxsPSIjOUI5QkEzIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkNvbnN1bHRhdGlvbjwvdGV4dD4KPHN2Zz4K';
              }}
            />
          </Box>
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Box
            ref={(el) => (observerRefs.current['cta'] = el as HTMLDivElement | null)}
            sx={{
              textAlign: 'center',
              opacity: isVisible['cta'] ? 1 : 0,
              transform: isVisible['cta']
                ? 'translateY(0)'
                : 'translateY(30px)',
              transition: 'all 0.6s ease-out',
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Ready to Take Control of Your Health?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}
            >
              Join thousands of patients who are already using our portal to manage
              their health more effectively.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
              }}
            >
              <Button
                component={Link}
                to="/patient-portal/search"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                Find My Pharmacy
              </Button>
              <Button
                component={Link}
                to="/patient-portal/login"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default PatientPortalLanding;