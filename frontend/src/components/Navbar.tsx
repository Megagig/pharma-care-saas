import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Brand/Logo */}
        <Box
          component={Link}
          to="/dashboard"
          sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: 'white', fontWeight: 'bold' }}
            >
              PC
            </Typography>
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PharmaCare
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Plan Badge */}
        <Chip
          label="Professional Plan"
          size="small"
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            mr: 2,
            fontSize: '0.75rem',
          }}
        />

        {/* Notifications */}
        <IconButton
          size="large"
          aria-label="show new notifications"
          color="inherit"
          onClick={handleNotificationMenuOpen}
          sx={{ color: 'text.primary', mr: 1 }}
        >
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Profile Menu */}
        <IconButton
          size="large"
          edge="end"
          aria-label="account of current user"
          aria-haspopup="true"
          onClick={handleProfileMenuOpen}
          color="inherit"
          sx={{ color: 'text.primary' }}
        >
          <Avatar
            alt={user?.firstName || 'User'}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
            }}
          >
            {user?.firstName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </IconButton>

        {/* Profile Dropdown Menu */}
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <MenuItem onClick={handleMenuClose}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            Profile Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Dropdown Menu */}
        <Menu
          id="notifications-menu"
          anchorEl={notificationAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 300,
              maxHeight: 400,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">
              New patient registration: John Doe
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">
              Prescription renewal reminder
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">
              System maintenance scheduled
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Typography variant="body2">Monthly report available</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
