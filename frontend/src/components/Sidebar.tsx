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
} from '@mui/icons-material';

const drawerWidth = 280;

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { name: 'Patients', path: '/patients', icon: PeopleIcon },
    { name: 'Clinical Notes', path: '/notes', icon: DescriptionIcon },
    { name: 'Medications', path: '/medications', icon: MedicationIcon },
    { name: 'Reports', path: '/reports', icon: AssessmentIcon },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCardIcon },
  ];

  const settingsItems = [
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Help', path: '/help', icon: HelpIcon },
  ];

  const renderNavItems = (items: typeof navItems) => (
    <List>
      {items.map((item) => {
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
                  minWidth: 40,
                }}
              >
                <IconComponent fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
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
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Main Navigation */}
        <Box sx={{ pt: 3, pb: 2 }}>
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
          {renderNavItems(navItems)}
        </Box>

        <Divider sx={{ mx: 2 }} />

        {/* Settings & Help */}
        <Box sx={{ pt: 2, pb: 2 }}>
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
            SUPPORT
          </Typography>
          {renderNavItems(settingsItems)}
        </Box>

        {/* Bottom Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Version Info */}
        <Box sx={{ p: 2, mt: 'auto' }}>
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
      </Box>
    </Drawer>
  );
};

export default Sidebar;
