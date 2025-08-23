import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'primary.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            P
          </Typography>
        </Box>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
          Loading PharmaCare...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we prepare your dashboard
        </Typography>
      </Box>
    );
  }

  if (!user) {
    // Redirect to login with the current path as state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
