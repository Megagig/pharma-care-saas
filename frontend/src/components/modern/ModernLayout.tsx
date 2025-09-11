import React, { useState, useEffect } from 'react';
import {
   Box,
   CssBaseline,
   Toolbar,
   useMediaQuery,
   useTheme,
} from '@mui/material';
import ModernSidebar from './ModernSidebar';
import ModernNavbar from './ModernNavbar';

interface ModernLayoutProps {
   children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
   const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

   useEffect(() => {
      setSidebarOpen(!isMobile);
   }, [isMobile]);

   const handleToggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
   };

   return (
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
         <CssBaseline />
         <ModernNavbar onToggleSidebar={handleToggleSidebar} />
         <ModernSidebar />
         <Box
            component="main"
            sx={{
               flexGrow: 1,
               p: 3,
               width: '100%',
               height: '100vh',
               overflow: 'auto',
               bgcolor: 'background.default',
               transition: theme.transitions.create('margin', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
               }),
            }}
         >
            <Toolbar /> {/* This adds spacing below the AppBar */}
            {children}
         </Box>
      </Box>
   );
};

export default ModernLayout;
