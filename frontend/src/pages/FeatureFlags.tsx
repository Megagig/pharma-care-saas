import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FeatureFlagManagement from '../components/admin/FeatureFlagManagement';

const FeatureFlagsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Feature Flag Management
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/admin" color="inherit">
            Admin
          </Link>
          <Typography color="textPrimary">Feature Flags</Typography>
        </Breadcrumbs>
      </Box>

      <FeatureFlagManagement />
    </Container>
  );
};

export default FeatureFlagsPage;
