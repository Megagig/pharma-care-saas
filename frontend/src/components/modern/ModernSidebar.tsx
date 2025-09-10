import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Collapse,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  Assessment as AssessmentIcon,
  LocalPharmacy as PharmacyIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Help as HelpIcon,
  CreditCard as CreditCardIcon,
  Science as ScienceIcon,
  BarChart as BarChartIcon,
  Forum as ForumIcon,
  MenuBook as MenuBookIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useRBAC } from '../hooks/useRBAC';
import { useSidebarControls } from '../stores/sidebarHooks';
import { styled } from '@mui/system';

// Styled components for sidebar
const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  justifyContent: 'space-between',
}));

const SidebarFooter = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const ModernSidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarControls();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasFeature, hasRole } = useRBAC();

  // State for nested menu items
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    pharmacy: false,
    account: false,
  });

  const toggleNestedMenu = (menu: string) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu],
    });
  };

  // Handle mobile sidebar closing when navigating
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setSidebarOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Main menu items
  const mainMenuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      show: true, // Always show dashboard
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: <PeopleIcon />,
      show: hasFeature('patient_management'),
    },
    {
      name: 'Clinical Notes',
      path: '/notes',
      icon: <DescriptionIcon />,
      show: hasFeature('clinical_notes'),
    },
    {
      name: 'Medications',
      path: '/medications',
      icon: <MedicationIcon />,
      show: hasFeature('medications'),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <AssessmentIcon />,
      show: true,
    },
    {
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: <CreditCardIcon />,
      show: hasRole('admin') || hasRole('owner'),
    },
  ];

  // Pharmacy tools menu items
  const pharmacyToolsItems = [
    {
      name: 'Medication Therapy Review',
      path: '/pharmacy/mtr',
      icon: <MedicationIcon />,
      show: hasFeature('pharmacy_mtr'),
    },
    {
      name: 'Clinical Interventions',
      path: '/pharmacy/interventions',
      icon: <ScienceIcon />,
      show: hasFeature('clinical_interventions'),
    },
    {
      name: 'Lab Interpretations',
      path: '/pharmacy/labs',
      icon: <BarChartIcon />,
      show: hasFeature('lab_interpretations'),
    },
    {
      name: 'Drug Information Center',
      path: '/pharmacy/drug-info',
      icon: <MenuBookIcon />,
      show: hasFeature('drug_information'),
    },
    {
      name: 'Clinical Decision Support',
      path: '/pharmacy/cds',
      icon: <PsychologyIcon />,
      show: hasFeature('decision_support'),
    },
    {
      name: 'Reports & Analytics',
      path: '/pharmacy/reports',
      icon: <AnalyticsIcon />,
      show: hasFeature('pharmacy_analytics'),
    },
    {
      name: 'Communication Hub',
      path: '/pharmacy/communication',
      icon: <ForumIcon />,
      show: hasFeature('communication_hub'),
    },
  ];

  // Account menu items
  const accountMenuItems = [
    {
      name: 'SaaS Settings',
      path: '/settings/saas',
      icon: <TuneIcon />,
      show: hasRole('admin') || hasRole('owner'),
    },
    {
      name: 'User Management',
      path: '/settings/users',
      icon: <SupervisorAccountIcon />,
      show: hasRole('admin') || hasRole('owner'),
    },
    {
      name: 'Settings & Configuration',
      path: '/settings',
      icon: <SettingsIcon />,
      show: true,
    },
    {
      name: 'Subscription Management',
      path: '/settings/subscription',
      icon: <CreditCardIcon />,
      show: hasRole('admin') || hasRole('owner'),
    },
    {
      name: 'Help & Support',
      path: '/help',
      icon: <HelpIcon />,
      show: true,
    },
  ];

  interface SidebarItemProps {
    item: {
      name: string;
      path: string;
      icon: React.ReactNode;
      show: boolean;
    };
  }

  // Common list item component
  const SidebarItem = ({ item }: SidebarItemProps) => (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        to={item.path}
        selected={isActive(item.path)}
        sx={{
          my: 0.5,
          py: 1.5,
          borderRadius: 2,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'primary.contrastText',
            },
          },
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: isActive(item.path) ? 'inherit' : 'text.secondary',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {sidebarOpen && (
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 500,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  const SidebarCategoryHeader = ({
    title,
    onClick,
    open,
    icon,
  }: {
    title: string;
    onClick: () => void;
    open: boolean;
    icon: React.ReactNode;
  }) => (
    <ListItemButton
      onClick={onClick}
      sx={{
        py: 1.5,
        borderRadius: 2,
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
        {icon}
      </ListItemIcon>
      {sidebarOpen && (
        <>
          <ListItemText
            primary={title}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 600,
              color: 'text.primary',
            }}
          />
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </>
      )}
    </ListItemButton>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      sx={{
        width: sidebarOpen ? 280 : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? 280 : 72,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <SidebarHeader>
        {sidebarOpen ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src="/logo.png"
              alt="PharmaCare"
              variant="rounded"
              sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
            >
              <PharmacyIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              PharmaCare
            </Typography>
          </Box>
        ) : (
          <Avatar
            src="/logo.png"
            alt="PharmaCare"
            variant="rounded"
            sx={{ bgcolor: 'primary.main', width: 32, height: 32, mx: 'auto' }}
          >
            <PharmacyIcon fontSize="small" />
          </Avatar>
        )}
        {sidebarOpen && (
          <IconButton onClick={toggleSidebar} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </SidebarHeader>

      <Divider sx={{ my: 1 }} />

      {/* Main Menu Section */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="custom-scrollbar"
      >
        <List component="nav" dense sx={{ px: 2, pt: 1 }}>
          <ListItem
            disablePadding
            sx={{ display: 'block', mb: 1, mt: sidebarOpen ? 0 : 1 }}
          >
            {sidebarOpen && (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ pl: 2, fontSize: '0.75rem', fontWeight: 700 }}
              >
                Main Menu
              </Typography>
            )}
          </ListItem>

          {/* Main Menu Items */}
          {mainMenuItems
            .filter((item) => item.show)
            .map((item) => (
              <SidebarItem key={item.name} item={item} />
            ))}

          <Divider sx={{ my: 2 }} />

          {/* Pharmacy Tools Section */}
          <ListItem disablePadding sx={{ display: 'block', mb: 1 }}>
            {sidebarOpen && (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ pl: 2, fontSize: '0.75rem', fontWeight: 700 }}
              >
                Pharmacy Tools
              </Typography>
            )}
          </ListItem>

          {/* Pharmacy Tools Collapsible Menu */}
          <ListItem disablePadding>
            <SidebarCategoryHeader
              title="Pharmacy Tools"
              onClick={() => toggleNestedMenu('pharmacy')}
              open={openMenus.pharmacy}
              icon={<PharmacyIcon />}
            />
          </ListItem>

          <Collapse
            in={openMenus.pharmacy && sidebarOpen}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {pharmacyToolsItems
                .filter((item) => item.show)
                .map((item) => (
                  <ListItem
                    key={item.name}
                    disablePadding
                    sx={{ display: 'block', pl: 2 }}
                  >
                    <SidebarItem item={item} />
                  </ListItem>
                ))}
            </List>
          </Collapse>

          <Divider sx={{ my: 2 }} />

          {/* Account Section */}
          <ListItem disablePadding sx={{ display: 'block', mb: 1 }}>
            {sidebarOpen && (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ pl: 2, fontSize: '0.75rem', fontWeight: 700 }}
              >
                Account
              </Typography>
            )}
          </ListItem>

          {/* Account Collapsible Menu */}
          <ListItem disablePadding>
            <SidebarCategoryHeader
              title="Account"
              onClick={() => toggleNestedMenu('account')}
              open={openMenus.account}
              icon={<AccountCircleIcon />}
            />
          </ListItem>

          <Collapse
            in={openMenus.account && sidebarOpen}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {accountMenuItems
                .filter((item) => item.show)
                .map((item) => (
                  <ListItem
                    key={item.name}
                    disablePadding
                    sx={{ display: 'block', pl: 2 }}
                  >
                    <SidebarItem item={item} />
                  </ListItem>
                ))}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Sidebar Footer with toggle button for collapsed state */}
      {!sidebarOpen && (
        <SidebarFooter>
          <IconButton
            onClick={toggleSidebar}
            sx={{ mx: 'auto', display: 'block' }}
          >
            <ChevronLeftIcon sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </SidebarFooter>
      )}
    </Drawer>
  );
};

export default ModernSidebar;
