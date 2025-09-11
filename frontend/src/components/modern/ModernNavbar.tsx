import React, { useState } from 'react';
import {
   AppBar,
   Toolbar,
   Typography,
   IconButton,
   Badge,
   Avatar,
   Box,
   Menu,
   MenuItem,
   Tooltip,
   useTheme,
   Button,
   Divider,
   Stack,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/ExitToApp';
import DashboardIcon from '@mui/icons-material/DashboardCustomize';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';
// import { useSubscriptionStatus } from '../../hooks/useSubscription';
import GlobalSearch from './GlobalSearch';

interface ModernNavbarProps {
   onToggleSidebar?: () => void;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ onToggleSidebar }) => {
   const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(
      null
   );
   const [notificationsAnchorEl, setNotificationsAnchorEl] =
      useState<null | HTMLElement>(null);
   const { user, logout } = useAuth();
   // Subscription status can be used for feature gating if needed
   // const subscriptionStatus = useSubscriptionStatus();
   const navigate = useNavigate();
   const theme = useTheme();

   const isProfileMenuOpen = Boolean(profileAnchorEl);
   const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

   // Mock notifications - in a real app, these would come from a store/API
   const notifications = [
      {
         id: 1,
         title: 'New Patient Registration',
         time: '5 minutes ago',
         read: false,
      },
      {
         id: 2,
         title: 'Medication Refill Request',
         time: '2 hours ago',
         read: false,
      },
      { id: 3, title: 'Appointment Reminder', time: 'Yesterday', read: true },
   ];
   const unreadCount = notifications.filter((n) => !n.read).length;

   const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setProfileAnchorEl(event.currentTarget);
   };

   const handleProfileMenuClose = () => {
      setProfileAnchorEl(null);
   };

   const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
      setNotificationsAnchorEl(event.currentTarget);
   };

   const handleNotificationsClose = () => {
      setNotificationsAnchorEl(null);
   };

   const handleLogout = async () => {
      handleProfileMenuClose();
      await logout();
      navigate('/login');
   };

   const profileMenuId = 'primary-profile-account-menu';
   const notificationsMenuId = 'primary-notifications-menu';

   const renderProfileMenu = (
      <Menu
         anchorEl={profileAnchorEl}
         id={profileMenuId}
         keepMounted
         open={isProfileMenuOpen}
         onClose={handleProfileMenuClose}
         transformOrigin={{ horizontal: 'right', vertical: 'top' }}
         anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
         PaperProps={{
            elevation: 3,
            sx: {
               width: 220,
               mt: 1,
               borderRadius: 2,
               overflow: 'visible',
               filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
               '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
               },
            },
         }}
      >
         <Box sx={{ p: 2, textAlign: 'center' }}>
            <Avatar
               sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 1,
                  bgcolor: 'primary.main',
               }}
            >
               {user?.firstName?.[0] || 'U'}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
               {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
               {user?.email}
            </Typography>
         </Box>

         <Divider />

         <MenuItem
            component={Link}
            to="/profile"
            onClick={handleProfileMenuClose}
         >
            <PersonIcon fontSize="small" sx={{ mr: 2 }} />
            Profile
         </MenuItem>

         <MenuItem
            component={Link}
            to="/dashboard"
            onClick={handleProfileMenuClose}
         >
            <DashboardIcon fontSize="small" sx={{ mr: 2 }} />
            Dashboard
         </MenuItem>

         <MenuItem
            component={Link}
            to="/settings"
            onClick={handleProfileMenuClose}
         >
            <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
            Settings
         </MenuItem>

         <Divider />

         <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
            Logout
         </MenuItem>
      </Menu>
   );

   const renderNotificationsMenu = (
      <Menu
         anchorEl={notificationsAnchorEl}
         id={notificationsMenuId}
         keepMounted
         open={isNotificationsMenuOpen}
         onClose={handleNotificationsClose}
         transformOrigin={{ horizontal: 'right', vertical: 'top' }}
         anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
         PaperProps={{
            elevation: 3,
            sx: {
               width: 320,
               maxHeight: 400,
               mt: 1,
               borderRadius: 2,
               overflow: 'auto',
            },
         }}
      >
         <Box
            sx={{
               p: 2,
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
            }}
         >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
               Notifications
            </Typography>
            <Button size="small" color="primary">
               Mark all as read
            </Button>
         </Box>

         <Divider />

         {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
               <Typography variant="body2" color="text.secondary">
                  No notifications
               </Typography>
            </Box>
         ) : (
            notifications.map((notification) => (
               <MenuItem
                  key={notification.id}
                  onClick={handleNotificationsClose}
                  sx={{
                     py: 1.5,
                     px: 2,
                     borderLeft: notification.read
                        ? 'none'
                        : `3px solid ${theme.palette.primary.main}`,
                     bgcolor: notification.read ? 'inherit' : 'action.hover',
                  }}
               >
                  <Stack
                     direction="column"
                     spacing={0.5}
                     sx={{ width: '100%' }}
                  >
                     <Typography
                        variant="body1"
                        sx={{ fontWeight: notification.read ? 400 : 600 }}
                     >
                        {notification.title}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                        {notification.time}
                     </Typography>
                  </Stack>
               </MenuItem>
            ))
         )}

         <Divider />

         <Box sx={{ p: 1 }}>
            <Button
               fullWidth
               color="primary"
               onClick={handleNotificationsClose}
            >
               View All Notifications
            </Button>
         </Box>
      </Menu>
   );

   return (
      <AppBar
         position="fixed"
         color="inherit"
         elevation={0}
         sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
         }}
      >
         <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left side of navbar */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               {/* Sidebar toggle button for mobile - only shown on mobile */}
               <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={onToggleSidebar}
                  sx={{ mr: 2, display: { sm: 'none' } }}
               >
                  <MenuIcon />
               </IconButton>

               <Typography
                  variant="h6"
                  component="div"
                  sx={{
                     display: { xs: 'none', sm: 'block' },
                     fontWeight: 700,
                     color: 'primary.main',
                     mr: 2,
                  }}
               >
                  PharmaCare
               </Typography>

               {/* Global Search */}
               <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 2 }}>
                  <GlobalSearch />
               </Box>
            </Box>

            {/* Right side of navbar */}
            <Box
               sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 2 },
               }}
            >
               {/* Mobile Search Button */}
               <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Tooltip title="Search">
                     <IconButton
                        color="inherit"
                        aria-label="search"
                        onClick={() => {
                           // Open modal search on mobile
                           const searchEvent = new CustomEvent(
                              'open-mobile-search'
                           );
                           window.dispatchEvent(searchEvent);
                        }}
                     >
                        <Badge color="secondary">
                           <SearchIcon />
                        </Badge>
                     </IconButton>
                  </Tooltip>
               </Box>

               {/* Theme Toggle */}
               <ThemeToggle size="sm" />

               {/* Notifications */}
               <Tooltip title="Notifications">
                  <IconButton
                     size="large"
                     aria-label={`show ${unreadCount} new notifications`}
                     color="inherit"
                     aria-controls={notificationsMenuId}
                     aria-haspopup="true"
                     onClick={handleNotificationsOpen}
                  >
                     <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                     </Badge>
                  </IconButton>
               </Tooltip>

               {/* Profile */}
               <Tooltip title="Account">
                  <IconButton
                     edge="end"
                     aria-label="account of current user"
                     aria-controls={profileMenuId}
                     aria-haspopup="true"
                     onClick={handleProfileMenuOpen}
                     color="inherit"
                     sx={{ ml: 1 }}
                  >
                     <Avatar
                        sx={{
                           width: 32,
                           height: 32,
                           bgcolor: 'primary.main',
                        }}
                     >
                        {user?.firstName?.[0] || 'U'}
                     </Avatar>
                  </IconButton>
               </Tooltip>
            </Box>
         </Toolbar>
         {renderProfileMenu}
         {renderNotificationsMenu}
      </AppBar>
   );
};

export default ModernNavbar;
