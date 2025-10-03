import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const TenantManagement: React.FC = () => {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 8 }}>
        <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" color="textSecondary" gutterBottom>
          Tenant Management
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          This section is under development. Advanced tenant management features will be available soon.
        </Typography>
        <Button variant="outlined" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  );
};

export default TenantManagement;