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
  IconButton,
  useMediaQuery,
  useTheme,
  Badge,
  Chip,
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

// Use imported icons with aliases
const AdminIcon = AdminPanelSettings;
const LicenseIcon = Assignment;
const SubscriptionIcon = SubscriptionsTwoTone;
import { useUIStore } from '../stores';
import useRBAC from '../hooks/useRBAC';
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

  const drawerWidth = sidebarOpen ? 280 : 64;

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
      badge: !subscriptionStatus.isActive ? 'Premium' : null,
    },
    {
      name: 'Clinical Notes',
      path: '/notes',
      icon: DescriptionIcon,
      show: hasFeature('clinical_notes'),
      badge:
        !subscriptionStatus.isActive ||
        (requiresLicense() && getLicenseStatus() !== 'approved')
          ? 'License Required'
          : null,
    },
    {
      name: 'Medications',
      path: '/medications',
      icon: MedicationIcon,
      show: hasFeature('medication_management'),
      badge: !subscriptionStatus.isActive ? 'Premium' : null,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: AssessmentIcon,
      show: hasFeature('basic_reports'),
      badge: !subscriptionStatus.isActive ? 'Pro' : null,
    },
    {
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: CreditCardIcon,
      show: true, // Always show for subscription management
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
      path: '/admin/feature-flags',
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

          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
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
                        item.badge === 'Premium' || item.badge === 'Pro'
                          ? '!'
                          : '•'
                      }
                      color={item.badge === 'Rejected' ? 'error' : 'warning'}
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
                        color={item.badge === 'Rejected' ? 'error' : 'warning'}
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
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'grey.200',
          transition: 'width 0.3s ease',
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
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ChevronLeftIcon
              sx={{
                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </IconButton>
        </Box>

        <Divider sx={{ mx: sidebarOpen ? 2 : 1 }} />
        {/* Main Navigation */}
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
              MAIN MENU
            </Typography>
          )}
          {renderNavItems(navItems)}
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
                bgcolor: subscriptionStatus.isActive
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
                {subscriptionStatus.tier.toUpperCase()} PLAN
              </Typography>
              {!subscriptionStatus.isActive && (
                <Typography
                  variant="caption"
                  display="block"
                  color="warning.dark"
                >
                  Subscription Expired
                </Typography>
              )}
              {subscriptionStatus.isActive &&
                subscriptionStatus.daysRemaining <= 7 && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="warning.dark"
                  >
                    {subscriptionStatus.daysRemaining} days left
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
