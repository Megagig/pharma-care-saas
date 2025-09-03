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
  Badge,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  Assessment as AssessmentIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
// Import icons that require default imports
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Assignment from '@mui/icons-material/Assignment';
import SubscriptionsTwoTone from '@mui/icons-material/SubscriptionsTwoTone';
// Pharmacy module icons - using default imports
import Reviews from '@mui/icons-material/Reviews';
import MedicalServices from '@mui/icons-material/MedicalServices';
import Science from '@mui/icons-material/Science';
import Forum from '@mui/icons-material/Forum';
import MenuBook from '@mui/icons-material/MenuBook';
import Psychology from '@mui/icons-material/Psychology';
import Analytics from '@mui/icons-material/Analytics';
import SupervisorAccount from '@mui/icons-material/SupervisorAccount';
import Tune from '@mui/icons-material/Tune';

// Use imported icons with aliases
const AdminIcon = AdminPanelSettings;
const LicenseIcon = Assignment;
const SubscriptionIcon = SubscriptionsTwoTone;
// Pharmacy module icon aliases
const ReviewsIcon = Reviews;
const MedicalServicesIcon = MedicalServices;
const ScienceIcon = Science;
const ForumIcon = Forum;
const MenuBookIcon = MenuBook;
const PsychologyIcon = Psychology;
const AnalyticsIcon = Analytics;
const SupervisorAccountIcon = SupervisorAccount;
const TuneIcon = Tune;
import { useUIStore } from '../stores';
import { useRBAC } from '../hooks/useRBAC';
import { ConditionalRender } from './AccessControl';
import { useSubscriptionStatus } from '../hooks/useSubscription';

const Sidebar = () => {
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  // Removed unused variable: setSidebarOpen
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasFeature, hasRole, requiresLicense, getLicenseStatus } = useRBAC();
  const subscriptionStatus = useSubscriptionStatus();

  // Auto-close sidebar on mobile when route changes - using useCallback for stable reference
  const handleMobileClose = React.useCallback(() => {
    if (isMobile) {
      useUIStore.getState().setSidebarOpen(false);
    }
  }, [isMobile]);

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
      name: 'Reports',
      path: '/reports',
      icon: AssessmentIcon,
      show: hasFeature('basic_reports'),
      badge: !subscriptionStatus?.isActive ? 'Pro' : null,
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
      badge: 'Coming Soon',
    },
    {
      name: 'Clinical Interventions',
      path: '/pharmacy/clinical-interventions',
      icon: MedicalServicesIcon,
      show: true,
    },
    {
      name: 'Lab Result Integration',
      path: '/pharmacy/lab-integration',
      icon: ScienceIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'Communication Hub',
      path: '/pharmacy/communication',
      icon: ForumIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'Drug Information Center',
      path: '/pharmacy/drug-information',
      icon: MenuBookIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'Clinical Decision Support',
      path: '/pharmacy/decision-support',
      icon: PsychologyIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'Reports & Analytics',
      path: '/pharmacy/reports',
      icon: AnalyticsIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'User Management',
      path: '/pharmacy/user-management',
      icon: SupervisorAccountIcon,
      show: true,
      badge: 'Coming Soon',
    },
    {
      name: 'Settings & Config',
      path: '/pharmacy/settings',
      icon: TuneIcon,
      show: true,
      badge: 'Coming Soon',
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
      name: 'Feature Flags',
      path: '/feature-flags',
      icon: SettingsIcon,
      show: hasRole('super_admin') && hasFeature('feature_flag_management'),
    },
  ];

  const settingsItems = [
    {
      name: 'Saas Settings',
      path: '/saas-settings',
      icon: SettingsIcon,
      show: true,
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
      name: 'Subscription Management',
      path: '/subscription-management',
      icon: SubscriptionIcon,
      show: true,
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
                '&:hover': {
                  backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
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
                }}
              >
                {item.badge ? (
                  <Badge
                    badgeContent={
                      item.badge === 'Premium' ||
                      item.badge === 'Pro' ||
                      item.badge === 'Coming Soon'
                        ? '!'
                        : '•'
                    }
                    color={
                      item.badge === 'Rejected'
                        ? 'error'
                        : item.badge === 'Coming Soon'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    <IconComponent fontSize="small" />
                  </Badge>
                ) : (
                  <IconComponent fontSize="small" />
                )}
              </ListItemIcon>
              {sidebarOpen && (
                <Box display="flex" alignItems="center" width="100%">
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={
                        item.badge === 'Rejected'
                          ? 'error'
                          : item.badge === 'Coming Soon'
                          ? 'info'
                          : 'warning'
                      }
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        ml: 1,
                      }}
                    />
                  )}
                </Box>
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
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
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          overflowX: 'hidden',
          boxShadow: theme.shadows[3],
          zIndex: theme.zIndex.drawer,
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
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
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              PharmaCare
            </Typography>
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

        <Divider sx={{ mx: sidebarOpen ? 2 : 1 }} />
        {/* Main Navigation */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                mb: 1,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                }}
              >
                MAIN MENU
              </Typography>

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

        <Divider sx={{ mx: sidebarOpen ? 2 : 1 }} />

        {/* Pharmacy Tools Section */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Typography
              variant="overline"
              sx={{
                px: 3,
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
              }}
            >
              PHARMACY TOOLS
            </Typography>
          )}
          {renderNavItems(pharmacyModules)}
        </Box>

        <Divider sx={{ mx: sidebarOpen ? 2 : 1 }} />

        {/* Admin Section */}
        <ConditionalRender requiredRole="super_admin">
          <Box sx={{ pt: 2, pb: 2 }}>
            {sidebarOpen && (
              <Typography
                variant="overline"
                sx={{
                  px: 3,
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                }}
              >
                ADMINISTRATION
              </Typography>
            )}
            {renderNavItems(adminItems)}
          </Box>
          <Divider sx={{ mx: sidebarOpen ? 2 : 1 }} />
        </ConditionalRender>

        {/* Settings & Help */}
        <Box sx={{ pt: 2, pb: 2 }}>
          {sidebarOpen && (
            <Typography
              variant="overline"
              sx={{
                px: 3,
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
              }}
            >
              ACCOUNT
            </Typography>
          )}
          {renderNavItems(settingsItems)}
        </Box>

        {/* Bottom Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Version Info and Subscription Status */}
        {sidebarOpen && (
          <Box sx={{ p: 2, mt: 'auto' }}>
            {/* Subscription Status */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: subscriptionStatus?.isActive
                  ? 'success.light'
                  : 'warning.light',
                textAlign: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.primary"
                fontWeight={600}
              >
                {subscriptionStatus?.tier?.toUpperCase() || 'FREE'} PLAN
              </Typography>
              {!subscriptionStatus?.isActive && (
                <Typography
                  variant="caption"
                  display="block"
                  color="warning.dark"
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
                  >
                    {subscriptionStatus?.daysRemaining} days left
                  </Typography>
                )}
            </Box>

            {/* Version Info */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.50',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                PharmaCare v2.1.0
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
