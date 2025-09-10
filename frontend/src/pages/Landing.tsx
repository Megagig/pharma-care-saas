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
  Rating,
  Avatar,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';

const Landing = () => {
  const theme = useTheme();
  const features = [
    {
      icon: PeopleIcon,
      title: 'Patient Management',
      description:
        'Comprehensive patient profiles with medical history, medications, and contact information.',
    },
    {
      icon: SecurityIcon,
      title: 'HIPAA Compliant',
      description:
        'Enterprise-grade security ensuring all patient data is protected and compliant.',
    },
    {
      icon: BarChartIcon,
      title: 'Clinical Analytics',
      description:
        'Advanced reporting and analytics to track patient outcomes and medication adherence.',
    },
    {
      icon: ScheduleIcon,
      title: 'Time Saving',
      description:
        'Streamline your workflow with automated documentation and smart reminders.',
    },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Clinical Pharmacist',
      content:
        'PharmaCare has transformed how I manage my patients. The clinical notes feature is incredibly detailed and saves me hours each week.',
      rating: 5,
      avatar: 'S',
    },
    {
      name: 'Michael Chen',
      role: 'Pharmacy Manager',
      content:
        'The medication interaction checks and adherence tracking have significantly improved our patient care quality.',
      rating: 5,
      avatar: 'M',
    },
  ];

  const benefits = [
    'Comprehensive patient medication profiles',
    'SOAP note clinical documentation',
    'Drug interaction and allergy checking',
    'Medication adherence monitoring',
    'Automated follow-up reminders',
    'Advanced reporting and analytics',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
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
              <Typography
                variant="h6"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                P
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              PharmaCare
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
            <Button component={Link} to="/login" color="inherit">
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
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
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
              Comprehensive{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                Pharmaceutical Care
              </Box>
              <br />
              Management Platform
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                color: 'text.secondary',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Empower your pharmacy practice with advanced patient management,
              clinical documentation, and medication therapy optimization tools
              designed specifically for pharmacists.
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
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.5, px: 4, borderRadius: 3 }}
              >
                Start Free Trial
              </Button>
              <Button
                component={Link}
                to="/demo"
                variant="outlined"
                size="large"
                sx={{ py: 1.5, px: 4, borderRadius: 3 }}
              >
                Watch Demo
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Everything You Need for Modern Pharmaceutical Care
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Our comprehensive platform provides all the tools pharmacists need
            to deliver exceptional patient care and optimize medication therapy
            outcomes.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 4,
          }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} sx={{ height: '100%', textAlign: 'center' }}>
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

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{ fontWeight: 600, mb: 4 }}
              >
                Streamline Your Clinical Workflow
              </Typography>
              <Box sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
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
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.5, px: 4, borderRadius: 3 }}
              >
                Get Started Today
              </Button>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Active Patients
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: 'primary.main', fontWeight: 700 }}
                    >
                      147
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'success.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Clinical Notes
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: 'success.main', fontWeight: 700 }}
                    >
                      523
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'warning.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Adherence Rate
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: 'warning.main', fontWeight: 700 }}
                    >
                      94.2%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Trusted by Healthcare Professionals
          </Typography>
          <Typography variant="h6" color="text.secondary">
            See what pharmacists are saying about PharmaCare
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 4,
          }}
        >
          {testimonials.map((testimonial, index) => (
            <Card key={index} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
                  "{testimonial.content}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {testimonial.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Ready to Transform Your Practice?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of pharmacists already using PharmaCare to improve
              patient outcomes
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
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Start Free Trial
              </Button>
              <Button
                component={Link}
                to="/contact"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'grey.300',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Contact Sales
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Landing;
