import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Flag as FlagIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
  Shield as ShieldIcon,
  Tune as TuneIcon,
  Timeline as MonitoringIcon,
  AttachMoney as PricingIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';
import PricingManagement from '../components/admin/PricingManagement';

const SaasSettings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isSuperAdmin } = useRBAC();
  const [activeTab, setActiveTab] = useState(0);
  const [systemStats] = useState({
    totalUsers: 1247,
    activeSubscriptions: 892,
    monthlyRevenue: 4250000,
    systemUptime: '99.8%',
    activeFeatureFlags: 12,
    pendingLicenses: 8,
  });

  // Access control - only super_admin can view this page
  if (!isSuperAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error" sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            This page is restricted to Super Admin users only. You need super
            admin permissions to access SaaS settings.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const settingsCategories = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: <DashboardIcon />,
      description: 'System metrics and health status',
    },
    {
      id: 'pricing',
      label: 'Pricing Management',
      icon: <PricingIcon />,
      description: 'Manage pricing plans and features',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <PeopleIcon />,
      description: 'Manage users, roles, and permissions',
    },
    {
      id: 'features',
      label: 'Feature Flags',
      icon: <FlagIcon />,
      description: 'Control feature availability',
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: <SecurityIcon />,
      description: 'Security policies and configurations',
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: <AssessmentIcon />,
      description: 'System analytics and reporting',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      description: 'System notifications and alerts',
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* System Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {systemStats.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Registered users
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Active Subscriptions</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {systemStats.activeSubscriptions.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Paid subscribers
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StorageIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Monthly Revenue</Typography>
            </Box>
            <Typography variant="h3" component="div">
              ₦{(systemStats.monthlyRevenue / 1000000).toFixed(1)}M
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              This month
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MonitoringIcon sx={{ mr: 1 }} />
              <Typography variant="h6">System Uptime</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {systemStats.systemUptime}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Quick Actions"
            avatar={<TuneIcon />}
            action={
              <Button variant="outlined" size="sm">
                View All Settings
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FlagIcon />}
                  component={RouterLink}
                  to="/feature-flags"
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                >
                  <Box sx={{ textAlign: 'left', ml: 1 }}>
                    <Typography variant="subtitle2">Feature Flags</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {systemStats.activeFeatureFlags} active flags
                    </Typography>
                  </Box>
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AdminIcon />}
                  component={RouterLink}
                  to="/admin"
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                >
                  <Box sx={{ textAlign: 'left', ml: 1 }}>
                    <Typography variant="subtitle2">Admin Dashboard</Typography>
                    <Typography variant="caption" color="textSecondary">
                      User & license management
                    </Typography>
                  </Box>
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    <Badge
                      badgeContent={systemStats.pendingLicenses}
                      color="error"
                    >
                      <ShieldIcon />
                    </Badge>
                  }
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                >
                  <Box sx={{ textAlign: 'left', ml: 1 }}>
                    <Typography variant="subtitle2">License Reviews</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {systemStats.pendingLicenses} pending reviews
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* System Health */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="System Health" avatar={<MonitoringIcon />} />
          <CardContent>
            <List>
              <ListItem>
                <ListItemText
                  primary="Database Performance"
                  secondary="Average response time: 45ms"
                />
                <ListItemSecondaryAction>
                  <Chip label="Excellent" color="success" size="sm" />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="API Response Time"
                  secondary="95th percentile: 120ms"
                />
                <ListItemSecondaryAction>
                  <Chip label="Good" color="info" size="sm" />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Memory Usage"
                  secondary="2.1GB / 8GB (26%)"
                />
                <ListItemSecondaryAction>
                  <LinearProgress
                    variant="determinate"
                    value={26}
                    sx={{ width: 60 }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activities */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Recent Activities"
            avatar={<NotificationsIcon />}
          />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Avatar
                    sx={{ bgcolor: 'success.main', width: 32, height: 32 }}
                  >
                    <PeopleIcon fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary="New user registered"
                  secondary="2 minutes ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Avatar
                    sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}
                  >
                    <FlagIcon fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary="Feature flag updated"
                  secondary="15 minutes ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                    <ShieldIcon fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary="License approved"
                  secondary="1 hour ago"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPlaceholderTab = (title: string) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          This section is under development. Advanced {title.toLowerCase()}{' '}
          features will be available soon.
        </Typography>
        <Button variant="outlined" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Typography color="textPrimary">SaaS Settings</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              <SuperAdminIcon sx={{ mr: 1, fontSize: 'inherit' }} />
              SaaS Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive system administration and configuration
            </Typography>
          </Box>

          <Chip
            icon={<SuperAdminIcon />}
            label="Super Admin Access"
            color="error"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
        >
          {settingsCategories.map((category) => (
            <Tab
              key={category.id}
              icon={category.icon}
              label={category.label}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && <PricingManagement />}
        {activeTab === 2 && renderPlaceholderTab('User Management')}
        {activeTab === 3 && renderPlaceholderTab('Feature Flags')}
        {activeTab === 4 && renderPlaceholderTab('Security Settings')}
        {activeTab === 5 && renderPlaceholderTab('Analytics & Reports')}
        {activeTab === 6 && renderPlaceholderTab('Notifications')}
      </Box>
    </Container>
  );
};

export default SaasSettings;
