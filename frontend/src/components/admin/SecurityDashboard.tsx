import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { useUIStore } from '../../stores';

interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'failed_login'
    | 'suspicious_activity'
    | 'data_access'
    | 'configuration_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user: string;
  ip: string;
  location: string;
  description: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  resolvedEvents: number;
  activeThreats: number;
}

const SecurityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [securityMetrics, setSecurityMetrics] =
    useState<SecurityMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addNotification = useUIStore((state) => state.addNotification);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be separate API calls
      // For now, we'll mock the data structure
      const mockMetrics: SecurityMetrics = {
        totalEvents: 124,
        criticalEvents: 3,
        warningEvents: 12,
        resolvedEvents: 89,
        activeThreats: 1,
      };

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'high',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'admin@example.com',
          ip: '192.168.1.100',
          location: 'Lagos, Nigeria',
          description: 'Multiple failed login attempts detected',
        },
        {
          id: '2',
          type: 'suspicious_activity',
          severity: 'critical',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'user@example.com',
          ip: '10.0.0.5',
          location: 'Unknown',
          description: 'Unusual data access pattern detected',
        },
        {
          id: '3',
          type: 'configuration_change',
          severity: 'medium',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'superadmin@example.com',
          ip: '192.168.1.50',
          location: 'Abuja, Nigeria',
          description: 'Security settings updated',
        },
      ];

      setSecurityMetrics(mockMetrics);
      setSecurityEvents(mockEvents);
    } catch (err) {
      setError('Failed to load security data');
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load security dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return <ErrorIcon />;
      case 'suspicious_activity':
        return <WarningIcon />;
      case 'configuration_change':
        return <InfoIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Security Dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSecurityData}
        >
          Refresh
        </Button>
      </Box>

      {/* Security Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {securityMetrics?.totalEvents || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {securityMetrics?.criticalEvents || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Critical Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {securityMetrics?.warningEvents || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {securityMetrics?.resolvedEvents || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {securityMetrics?.activeThreats || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Threats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Events */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Recent Security Events"
              subheader="Latest security activities and alerts"
            />
            <Divider />
            <CardContent>
              <List>
                {securityEvents.map((event) => (
                  <ListItem key={event.id} sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getEventTypeIcon(event.type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mr: 1 }}>
                            {event.description}
                          </Typography>
                          <Chip
                            label={event.severity}
                            size="small"
                            color={getSeverityColor(event.severity) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            User: {event.user} • IP: {event.ip} •{' '}
                            {event.location}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Security Status"
              subheader="Current system security posture"
            />
            <Divider />
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon
                  sx={{ fontSize: 60, color: 'success.main', mb: 1 }}
                />
                <Typography variant="h6" gutterBottom>
                  System Secure
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  No critical vulnerabilities detected
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Quick Actions"
              subheader="Security management tools"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" fullWidth>
                  View All Alerts
                </Button>
                <Button variant="outlined" fullWidth>
                  Security Settings
                </Button>
                <Button variant="outlined" fullWidth>
                  Audit Logs
                </Button>
                <Button variant="outlined" fullWidth color="error">
                  Emergency Lockdown
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityDashboard;
