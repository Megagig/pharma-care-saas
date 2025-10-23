import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
// Import icons using default imports for MUI v5 compatibility
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import MedicationIcon from '@mui/icons-material/Medication';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FlagIcon from '@mui/icons-material/Flag';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Assignment from '@mui/icons-material/Assignment';
// Pharmacy module icons - using default imports
import Reviews from '@mui/icons-material/Reviews';
import MedicalServices from '@mui/icons-material/MedicalServices';
import Science from '@mui/icons-material/Science';
import Forum from '@mui/icons-material/Forum';
import MenuBook from '@mui/icons-material/MenuBook';
import Psychology from '@mui/icons-material/Psychology';
import Analytics from '@mui/icons-material/Analytics';
import SupervisorAccount from '@mui/icons-material/SupervisorAccount';

// Use imported icons with aliases
const AdminIcon = AdminPanelSettings;
const LicenseIcon = Assignment;
// Pharmacy module icon aliases
const ReviewsIcon = Reviews;
const MedicalServicesIcon = MedicalServices;
const ScienceIcon = Science;
const ForumIcon = Forum;
const MenuBookIcon = MenuBook;
const PsychologyIcon = Psychology;
const AnalyticsIcon = Analytics;
const SupervisorAccountIcon = SupervisorAccount;
import { useSidebarControls } from '../stores/sidebarHooks';
import { useRBAC } from '../hooks/useRBAC';
import { useAuth } from '../hooks/useAuth';
import { ConditionalRender } from './AccessControl';
import { useSubscriptionStatus } from '../hooks/useSubscription';

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarControls();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasFeature, hasRole, requiresLicense, getLicenseStatus } = useRBAC();
  const { user } = useAuth();
  const subscriptionStatus = useSubscriptionStatus();

  // Auto-close sidebar on mobile when route changes - using useCallback for stable reference
  const handleMobileClose = React.useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  React.useEffect(() => {
    handleMobileClose();
  }, [location.pathname, handleMobileClose]);

  const drawerWidth = sidebarOpen ? 280 : 56;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: DashboardIcon,
      show: true, // Always show dashboard
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: PeopleIcon,
      show: hasFeature('patient_management'),
      badge: !subscriptionStatus?.isActive ? 'Premium' : null,
    },
    {
      name: 'Clinical Notes',
      path: '/notes',
      icon: DescriptionIcon,
      show: hasFeature('clinical_notes'),
      badge:
        !subscriptionStatus?.isActive ||
          (requiresLicense() && getLicenseStatus() !== 'approved')
          ? 'License Required'
          : null,
    },
    {
      name: 'Medications',
      path: '/medications',
      icon: MedicationIcon,
      show: hasFeature('medication_management'),
      badge: !subscriptionStatus?.isActive ? 'Premium' : null,
    },
    {
      name: 'Reports & Analytics',
      path: '/reports-analytics',
      icon: AnalyticsIcon,
      show: hasFeature('basic_reports'),
    },
    {
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: CreditCardIcon,
      show: true, // Always show for subscription management
    },
  ];

  const pharmacyModules = [
    {
      name: 'Medication Therapy Review',
      path: '/pharmacy/medication-therapy',
      icon: ReviewsIcon,
      show: true,
    },
    {
      name: 'Clinical Interventions',
      path: '/pharmacy/clinical-interventions/dashboard',
      icon: MedicalServicesIcon,
      show: true,
    },
    {
      name: 'AI Diagnostics & Therapeutics',
      path: '/pharmacy/diagnostics',
      icon: ScienceIcon,
      show: true,
    },
    {
      name: 'Communication Hub',
      path: '/pharmacy/communication',
      icon: ForumIcon,
      show: true,
    },
    {
      name: 'Drug Information Center',
      path: '/pharmacy/drug-information',
      icon: MenuBookIcon,
      show: true,
    },
    {
      name: 'Clinical Decision Support',
      path: '/pharmacy/decision-support',
      icon: PsychologyIcon,
      show: true,
      badge: null, // Ensure no badge blocking
    },
  ];

  const adminItems = [
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: AdminIcon,
      show: hasRole('super_admin'),
    },
    {
      name: 'Audit Trail',
      path: '/super-admin/audit-trail',
      icon: AssessmentIcon,
      show: hasRole('super_admin'),
    },
    {
      name: 'Feature Management',
      path: '/admin/feature-management',
      icon: FlagIcon,
      show: hasRole('super_admin'),
    },
    {
      name: 'Saas Settings',
      path: '/saas-settings',
      icon: SettingsIcon,
      show: hasRole('super_admin'),
    },
    {
      name: 'User Management',
      path: '/user-management',
      icon: SupervisorAccountIcon,
      show: hasRole('super_admin'),
    },
  ];

  // Debug: Check Team Members visibility
  React.useEffect(() => {
    const shouldShow = hasRole('pharmacy_outlet');
    console.log('🔍 Team Members Visibility Check:', {
      userRole: user?.role,
      userObject: user,
      hasPharmacyOutletRole: shouldShow,
      willShowLink: shouldShow,
      hasRoleFunction: typeof hasRole,
    });
  }, [user?.role, hasRole, user]);

  const settingsItems = [
    {
      name: 'Team Members',
      path: '/workspace/team',
      icon: SupervisorAccountIcon,
      // Show for workspace owners (pharmacy_outlet role)
      show: hasRole('pharmacy_outlet'),
    },
    {
      name: 'License Verification',
      path: '/license',
      icon: LicenseIcon,
      show: requiresLicense(),
      badge:
        getLicenseStatus() === 'pending'
          ? 'Pending'
          : getLicenseStatus() === 'rejected'
            ? 'Rejected'
            : null,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      show: true,
    },
    {
      name: 'Help',
      path: '/help',
      icon: HelpIcon,
      show: true,
    },
  ];

  const renderNavItems = (items: typeof navItems) => (
    <List>
      {items
        .filter((item) => item.show)
        .map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;

          const listItemButton = (
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                minHeight: 48,
                borderRadius: 2,
                mx: 1,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: sidebarOpen ? 2 : 1,
                backgroundColor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'white' : 'text.primary',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive
                  ? '0 4px 12px rgba(25, 118, 210, 0.2)'
                  : 'none',
                '&:hover': {
                  backgroundColor: isActive
                    ? 'primary.dark'
                    : 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  bottom: 0,
                  left: 0,
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.5)'
                    : 'transparent',
                },
              }}
              selected={isActive}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'white' : 'text.secondary',
                  minWidth: sidebarOpen ? 40 : 0,
                  mr: sidebarOpen ? 2 : 0,
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <IconComponent
                  fontSize="small"
                  sx={{
                    filter: isActive
                      ? 'drop-shadow(0 0 2px rgba(255,255,255,0.6))'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              </ListItemIcon>
              {sidebarOpen && (
                <Box display="flex" alignItems="center" width="100%">
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      sx: {
                        transition: 'all 0.2s ease',
                        textShadow: isActive
                          ? '0 0 1px rgba(255,255,255,0.5)'
                          : 'none',
                      },
                    }}
                  />
                </Box>
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.8 }}>
              {!sidebarOpen ? (
                <Tooltip title={item.name} placement="right">
                  {listItemButton}
                </Tooltip>
              ) : (
                listItemButton
              )}
            </ListItem>
          );
        })}
    </List>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        position: 'relative',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'fixed',
          height: '100vh',
          backgroundColor: theme.palette.background.paper,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #1e293b 0%, #1a2332 100%)'
              : 'linear-gradient(180deg, rgba(245,247,250,1) 0%, rgba(255,255,255,1) 100%)',
          borderRight: `1px solid ${theme.palette.mode === 'dark'
            ? '#334155'
            : 'rgba(200, 210, 225, 0.5)'
            }`,
          transition: theme.transitions.create(
            ['width', 'margin', 'background', 'border-color'],
            {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }
          ),
          overflowX: 'hidden',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 0 20px rgba(0, 0, 0, 0.3)'
              : '0 0 20px rgba(0, 0, 0, 0.08)',
          zIndex: theme.zIndex.drawer,
        },
      }}
    >
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(148, 163, 184, 0.3)'
                : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(148, 163, 184, 0.5)'
                : 'rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        {/* Sidebar Header with Toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            p: sidebarOpen ? 2 : 1,
            minHeight: 64,
            position: 'relative',
          }}
        >
          {sidebarOpen && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background:
                    'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                }}
              >
                <MedicationIcon sx={{ color: '#fff', fontSize: '1.4rem' }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  background:
                    'linear-gradient(135deg, #1565c0 0%, #2196f3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 4px rgba(33, 150, 243, 0.1)',
                }}
              >
                PharmacyCopilot
              </Typography>
            </Box>
          )}

          {/* HIGHLY VISIBLE Toggle Button */}
          <Tooltip
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            placement="bottom"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: sidebarOpen ? 44 : 40,
                height: sidebarOpen ? 44 : 40,
                backgroundColor: '#1976d2', // Explicit blue color
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
                border: `3px solid #ffffff`,
                position: 'relative',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  transform: 'scale(1.1)',
                  boxShadow: '0 6px 24px rgba(25, 118, 210, 0.6)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                // Pulsing animation for maximum visibility
                '@keyframes visiblePulse': {
                  '0%': {
                    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
                    transform: 'scale(1)',
                  },
                  '50%': {
                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.8)',
                    transform: 'scale(1.05)',
                  },
                  '100%': {
                    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
                    transform: 'scale(1)',
                  },
                },
                animation: 'visiblePulse 2s ease-in-out infinite',
                transition: theme.transitions.create(
                  ['transform', 'box-shadow', 'background-color'],
                  {
                    duration: theme.transitions.duration.shorter,
                  }
                ),
                // Mobile adjustments
                [theme.breakpoints.down('sm')]: {
                  width: sidebarOpen ? 40 : 36,
                  height: sidebarOpen ? 40 : 36,
                },
              }}
              onClick={toggleSidebar}
            >
              <ChevronLeftIcon
                sx={{
                  transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: theme.transitions.create('transform', {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.standard,
                  }),
                  fontSize: sidebarOpen ? 28 : 24,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  [theme.breakpoints.down('sm')]: {
                    fontSize: sidebarOpen ? 24 : 20,
                  },
                }}
              />
            </Box>
          </Tooltip>
        </Box>

        <Divider
          sx={{
            mx: sidebarOpen ? 3 : 1.5,
            opacity: 0.6,
            borderColor: 'rgba(25, 118, 210, 0.12)',
            my: 1,
          }}
        />
        {/* Main Navigation */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                mb: 1.5,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textShadow: '0 0 1px rgba(25, 118, 210, 0.2)',
                  display: 'inline-block',
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  paddingBottom: '4px',
                }}
              >
                MAIN MENU
              </Typography>{' '}
              {/* Toggle Button next to MAIN MENU */}
              <Tooltip title="Collapse sidebar" placement="top">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    border: `2px solid ${theme.palette.primary.light}`,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    // Subtle pulse for visibility
                    '@keyframes menuTogglePulse': {
                      '0%': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      },
                      '50%': {
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.6)',
                      },
                      '100%': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      },
                    },
                    animation: 'menuTogglePulse 3s ease-in-out infinite',
                    transition: theme.transitions.create(
                      ['transform', 'box-shadow', 'background-color'],
                      {
                        duration: theme.transitions.duration.shorter,
                      }
                    ),
                  }}
                  onClick={toggleSidebar}
                >
                  <ChevronLeftIcon
                    sx={{
                      fontSize: 20,
                      color: theme.palette.common.white,
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Tooltip>
            </Box>
          )}

          {/* Toggle button for collapsed sidebar */}
          {!sidebarOpen && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Tooltip title="Expand sidebar" placement="right">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    border: `2px solid ${theme.palette.primary.light}`,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    // Strong pulse for collapsed state
                    '@keyframes collapsedTogglePulse': {
                      '0%': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                        transform: 'scale(1)',
                      },
                      '50%': {
                        boxShadow: '0 6px 20px rgba(25, 118, 210, 0.7)',
                        transform: 'scale(1.1)',
                      },
                      '100%': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                        transform: 'scale(1)',
                      },
                    },
                    animation: 'collapsedTogglePulse 2s ease-in-out infinite',
                    transition: theme.transitions.create(
                      ['transform', 'box-shadow', 'background-color'],
                      {
                        duration: theme.transitions.duration.shorter,
                      }
                    ),
                  }}
                  onClick={toggleSidebar}
                >
                  <ChevronLeftIcon
                    sx={{
                      fontSize: 22,
                      color: theme.palette.common.white,
                      fontWeight: 'bold',
                      transform: 'rotate(180deg)',
                    }}
                  />
                </Box>
              </Tooltip>
            </Box>
          )}

          {renderNavItems(navItems)}
        </Box>

        <Divider
          sx={{
            mx: sidebarOpen ? 3 : 1.5,
            opacity: 0.6,
            borderColor: 'rgba(25, 118, 210, 0.12)',
            my: 1,
          }}
        />

        {/* Pharmacy Tools Section */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Box sx={{ px: 3, mb: 1.5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textShadow: '0 0 1px rgba(25, 118, 210, 0.2)',
                  display: 'inline-block',
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  paddingBottom: '4px',
                }}
              >
                PHARMACY TOOLS
              </Typography>
            </Box>
          )}
          {renderNavItems(pharmacyModules)}
        </Box>

        <Divider
          sx={{
            mx: sidebarOpen ? 3 : 1.5,
            opacity: 0.6,
            borderColor: 'rgba(25, 118, 210, 0.12)',
            my: 1,
          }}
        />

        {/* Admin Section */}
        <ConditionalRender requiredRole="super_admin">
          <Box sx={{ pt: 2, pb: 2 }}>
            {sidebarOpen && (
              <Box sx={{ px: 3, mb: 1.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '0.12em',
                    textShadow: '0 0 1px rgba(25, 118, 210, 0.2)',
                    display: 'inline-block',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    paddingBottom: '4px',
                  }}
                >
                  ADMINISTRATION
                </Typography>
              </Box>
            )}
            {renderNavItems(adminItems)}
          </Box>
          <Divider
            sx={{
              mx: sidebarOpen ? 3 : 1.5,
              opacity: 0.6,
              borderColor: 'rgba(25, 118, 210, 0.12)',
              my: 1,
            }}
          />
        </ConditionalRender>

        {/* Settings & Help */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Box sx={{ px: 3, mb: 1.5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textShadow: '0 0 1px rgba(25, 118, 210, 0.2)',
                  display: 'inline-block',
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  paddingBottom: '4px',
                }}
              >
                ACCOUNT
              </Typography>
            </Box>
          )}
          {renderNavItems(settingsItems)}
        </Box>

        {/* Bottom Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Version Info and Subscription Status */}
        {sidebarOpen && (
          <Box sx={{ p: 3, mt: 'auto' }}>
            {/* Subscription Status */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: subscriptionStatus?.isActive
                  ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(39, 174, 96, 0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(241, 196, 15, 0.1) 0%, rgba(243, 156, 18, 0.2) 100%)',
                textAlign: 'center',
                mb: 2,
                border: '1px solid',
                borderColor: subscriptionStatus?.isActive
                  ? 'rgba(46, 204, 113, 0.3)'
                  : 'rgba(243, 156, 18, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography
                variant="caption"
                color={
                  subscriptionStatus?.isActive ? 'success.dark' : 'warning.dark'
                }
                fontWeight={700}
                sx={{ letterSpacing: '0.05em' }}
              >
                {subscriptionStatus?.tier?.toUpperCase() || 'FREE'} PLAN
              </Typography>
              {!subscriptionStatus?.isActive && (
                <Typography
                  variant="caption"
                  display="block"
                  color="warning.dark"
                  sx={{ mt: 0.5, fontWeight: 500 }}
                >
                  Subscription Expired
                </Typography>
              )}
              {subscriptionStatus?.isActive &&
                subscriptionStatus?.daysRemaining &&
                subscriptionStatus.daysRemaining <= 7 && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="warning.dark"
                    sx={{ mt: 0.5, fontWeight: 500 }}
                  >
                    {subscriptionStatus?.daysRemaining} days left
                  </Typography>
                )}
            </Box>

            {/* Version Info */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background:
                  'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.1) 100%)',
                textAlign: 'center',
                border: '1px solid rgba(25, 118, 210, 0.15)',
              }}
            >
              <Typography
                variant="caption"
                color="primary.dark"
                sx={{ fontWeight: 500, letterSpacing: '0.03em' }}
              >
                PharmacyCopilot v2.1.0
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
