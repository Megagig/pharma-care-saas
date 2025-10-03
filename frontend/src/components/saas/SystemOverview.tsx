import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Badge,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  Timeline as MonitoringIcon,
  Notifications as NotificationsIcon,
  Flag as FlagIcon,
  AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon,
  Tune as TuneIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSystemMetrics, useSystemHealth, useRecentActivities } from '../../queries/useSaasSettings';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  gradient,
  subtitle,
  trend,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      case 'stable':
        return <StableIcon sx={{ fontSize: 16, color: 'grey.500' }} />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'inherit';
    
    switch (trend.direction) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      case 'stable':
        return 'grey.500';
      default:
        return 'inherit';
    }
  };

  return (
    <Card
      sx={{
        background: gradient,
        color: 'white',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getTrendIcon()}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: getTrendColor(),
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                }}
              >
                {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const SystemOverview: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useSystemMetrics();
  const { data: health, isLoading: healthLoading, error: healthError } = useSystemHealth();
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useRecentActivities();

  if (metricsError || healthError || activitiesError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Error Loading System Overview
        </Typography>
        <Typography variant="body2">
          There was an error loading the system overview data. Please try refreshing the page.
        </Typography>
      </Alert>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <PeopleIcon fontSize="small" />;
      case 'feature_flag_change':
        return <FlagIcon fontSize="small" />;
      case 'license_approval':
        return <ShieldIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration':
        return 'success.main';
      case 'feature_flag_change':
        return 'warning.main';
      case 'license_approval':
        return 'info.main';
      default:
        return 'primary.main';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Grid container spacing={3}>
      {/* System Metrics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        {metricsLoading ? (
          <Skeleton variant="rectangular" height={140} />
        ) : (
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers || 0}
            icon={<PeopleIcon />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            subtitle="Registered users"
            trend={{ direction: 'up', percentage: 12 }}
          />
        )}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {metricsLoading ? (
          <Skeleton variant="rectangular" height={140} />
        ) : (
          <MetricCard
            title="Active Subscriptions"
            value={metrics?.activeSubscriptions || 0}
            icon={<AssessmentIcon />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            subtitle="Paid subscribers"
            trend={{ direction: 'up', percentage: 8 }}
          />
        )}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {metricsLoading ? (
          <Skeleton variant="rectangular" height={140} />
        ) : (
          <MetricCard
            title="Monthly Revenue"
            value={`₦${((metrics?.monthlyRevenue || 0) / 1000000).toFixed(1)}M`}
            icon={<StorageIcon />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            subtitle="This month"
            trend={{ direction: 'up', percentage: 15 }}
          />
        )}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {metricsLoading ? (
          <Skeleton variant="rectangular" height={140} />
        ) : (
          <MetricCard
            title="System Uptime"
            value={metrics?.systemUptime || '0%'}
            icon={<MonitoringIcon />}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            subtitle="Last 30 days"
            trend={{ direction: 'stable', percentage: 0 }}
          />
        )}
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Quick Actions"
            avatar={<TuneIcon />}
            action={
              <Button variant="outlined" size="small">
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
                      {metrics?.activeFeatureFlags || 0} active flags
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
                      badgeContent={metrics?.pendingLicenses || 0}
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
                      {metrics?.pendingLicenses || 0} pending reviews
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
            {healthLoading ? (
              <Box>
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Skeleton height={60} />
              </Box>
            ) : (
              <List>
                <ListItem>
                  <ListItemText
                    primary="Database Performance"
                    secondary={`Average response time: ${health?.database?.value || 'N/A'}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={health?.database?.status || 'Unknown'} 
                      color={getHealthStatusColor(health?.database?.status || 'default') as any}
                      size="small" 
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="API Response Time"
                    secondary={`95th percentile: ${health?.api?.value || 'N/A'}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={health?.api?.status || 'Unknown'} 
                      color={getHealthStatusColor(health?.api?.status || 'default') as any}
                      size="small" 
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Memory Usage"
                    secondary={`Current usage: ${health?.memory?.value || 'N/A'}`}
                  />
                  <ListItemSecondaryAction>
                    <LinearProgress
                      variant="determinate"
                      value={typeof health?.memory?.value === 'number' ? health.memory.value : 0}
                      sx={{ width: 60 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            )}
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
            {activitiesLoading ? (
              <Box>
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Skeleton height={60} />
              </Box>
            ) : (
              <List>
                {activities?.slice(0, 3).map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      <Avatar
                        sx={{ 
                          bgcolor: getActivityColor(activity.type), 
                          width: 32, 
                          height: 32 
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={formatTimeAgo(activity.timestamp)}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText
                      primary="No recent activities"
                      secondary="System activities will appear here"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SystemOverview;