import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/ExitToApp';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import ThemeToggle from './common/ThemeToggle';
import CommunicationNotificationBadge from './communication/CommunicationNotificationBadge';

/**
 * Main navigation bar component displayed at the top of the application
 * when users are logged in.
 */
const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { tier } = useSubscriptionStatus();
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const getSubscriptionChipColor = () => {
    switch (tier) {
      case 'enterprise':
        return 'error';
      case 'pro':
        return 'secondary';
      case 'basic':
        return 'primary';
      case 'free_trial':
      default:
        return 'default';
    }
  };

  if (!user) return null;

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, flexGrow: 1 }}
        >
          PharmaPilot
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {tier && (
            <Chip
              size="small"
              label={tier.replace('_', ' ').toUpperCase()}
              color={
                getSubscriptionChipColor() as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'error'
              }
            />
          )}

          {/* Theme Toggle */}
          <Box sx={{ mr: 1 }}>
            <ThemeToggle size="sm" />
          </Box>

          {/* Communication Hub Notification Badge */}
          <CommunicationNotificationBadge size="medium" showPreview={true} />

          <IconButton
            size="large"
            color="inherit"
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
          >
            {/* Use default icon for now */}
            <AccountCircleIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
            Profile
          </MenuItem>
          <MenuItem
            component={Link}
            to="/subscription-management"
            onClick={handleMenuClose}
          >
            Subscription
          </MenuItem>
          {user.role === 'super_admin' && (
            <MenuItem component={Link} to="/admin" onClick={handleMenuClose}>
              Admin Dashboard
            </MenuItem>
          )}
          <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">New patient registered</Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">Prescription renewal needed</Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">Subscription expires soon</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/notifications');
            }}
            sx={{ justifyContent: 'center', color: 'primary.main' }}
          >
            <Typography variant="body2">View all notifications</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
