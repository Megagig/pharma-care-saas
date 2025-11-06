import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalPharmacy as LocalPharmacyIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  VerifiedUser as VerifiedUserIcon,
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import apiClient from '../../services/apiClient';
import Footer from '../../components/Footer';
import ThemeToggle from '../../components/common/ThemeToggle';

interface Workspace {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  logoUrl?: string;
  description?: string;
  hours?: string;
}

const WorkspaceSearchPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { label: 'Home', path: '/patient-access' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Blog', path: '/blog' },
  ];

  // Search workspaces
  useEffect(() => {
    const searchWorkspaces = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
        setWorkspaces([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get('/api/public/workspaces/search', {
          params: {
            query: debouncedSearchQuery,
          },
        });

        if (response.data.success) {
          setWorkspaces(response.data.data.workspaces || []);
        } else {
          setError(response.data.message || 'Failed to search workspaces');
        }
      } catch (err: any) {
        console.error('Workspace search error:', err);
        setError(
          err.response?.data?.message ||
          'Failed to search workspaces. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    searchWorkspaces();
  }, [debouncedSearchQuery]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    // Store the selected workspace in sessionStorage for the registration/login flow
    sessionStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    // Navigate to a page where user can choose to register or login
    navigate(`/patient-portal/workspace/${workspace.workspaceId}`);
  };

  const getWorkspaceInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' } = {
      pharmacy: 'primary',
      hospital: 'secondary',
      clinic: 'info',
      laboratory: 'success',
    };
    return colors[type.toLowerCase()] || 'default';
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
              PharmaCare
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
            <Button component={Link} to="/patient-access" color="inherit">
              Home
            </Button>
            <Button component={Link} to="/about" color="inherit">
              About
            </Button>
            <Button component={Link} to="/contact" color="inherit">
              Contact
            </Button>
            <Button component={Link} to="/blog" color="inherit">
              Blog
            </Button>
            <ThemeToggle size="sm" variant="button" />
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
                PharmaCare
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
                  component={Link}
                  to={item.path}
                  onClick={closeMobileMenu}
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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Back Button */}
        <Button
          component={Link}
          to="/patient-access"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 4 }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Find Your Pharmacy
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '700px', mx: 'auto', mb: 4 }}
          >
            Search for your pharmacy or healthcare workspace to create an account
            or sign in to your patient portal
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pharmacy name, location, or type (e.g., 'Lagos', 'HealthCare Pharmacy', 'Hospital')..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Search Prompt */}
        {!loading && !error && searchQuery.trim().length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LocalPharmacyIcon
              sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              Start typing to search for your pharmacy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter at least 2 characters to begin searching
            </Typography>
          </Box>
        )}

        {/* No Results */}
        {!loading &&
          !error &&
          searchQuery.trim().length >= 2 &&
          workspaces.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SearchIcon
                sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No pharmacies found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search query or check the spelling
              </Typography>
            </Box>
          )}

        {/* Results */}
        {!loading && !error && workspaces.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
            </Typography>

            <Grid container spacing={3}>
              {workspaces.map((workspace) => (
                <Grid item xs={12} md={6} key={workspace.id}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(8, 145, 178, 0.15)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleWorkspaceSelect(workspace)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {/* Logo */}
                          <Avatar
                            src={workspace.logoUrl}
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'primary.main',
                              fontSize: '1.5rem',
                            }}
                          >
                            {getWorkspaceInitial(workspace.name)}
                          </Avatar>

                          {/* Content */}
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, lineHeight: 1.3 }}
                              >
                                {workspace.name}
                              </Typography>
                              <Chip
                                label={workspace.type}
                                color={getTypeColor(workspace.type)}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>

                            {workspace.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                              >
                                {workspace.description}
                              </Typography>
                            )}

                            {/* Address */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <LocationOnIcon
                                sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {workspace.address}
                                {workspace.state && `, ${workspace.state}`}
                                {workspace.lga && ` (${workspace.lga})`}
                              </Typography>
                            </Box>

                            {/* Phone */}
                            {workspace.phone && (
                              <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                              >
                                <PhoneIcon
                                  sx={{ fontSize: 18, color: 'text.secondary' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {workspace.phone}
                                </Typography>
                              </Box>
                            )}

                            {/* Email */}
                            {workspace.email && (
                              <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                              >
                                <EmailIcon
                                  sx={{ fontSize: 18, color: 'text.secondary' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {workspace.email}
                                </Typography>
                              </Box>
                            )}

                            {/* Hours */}
                            {workspace.hours && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon
                                  sx={{ fontSize: 18, color: 'text.secondary' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {workspace.hours}
                                </Typography>
                              </Box>
                            )}

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<PersonAddIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Register
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<LoginIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Sign In
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default WorkspaceSearchPage;
