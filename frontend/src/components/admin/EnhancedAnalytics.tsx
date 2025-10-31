import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getSystemAnalytics } from '../../services/rbacService';

interface AnalyticsData {
  period: string;
  userAnalytics: {
    total: number;
    active: number;
    new: number;
    byRole: Array<{ _id: string; count: number }>;
    byStatus: Array<{ _id: string; count: number }>;
    growth: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
    }>;
  };
  roleAnalytics: {
    total: number;
    active: number;
    assignments: number;
    byCategory: Array<{ _id: string; count: number }>;
  };
  permissionAnalytics: {
    total: number;
    active: number;
    byCategory: Array<{ _id: string; count: number }>;
    byRiskLevel: Array<{ _id: string; count: number }>;
  };
  activityAnalytics: {
    total: number;
    byAction: Array<{ _id: string; count: number }>;
    byUser: Array<{ _id: string; count: number }>;
    daily: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
    }>;
  };
}

// Color schemes
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const STATUS_COLORS: Record<string, string> = {
  active: '#00C49F',
  pending: '#FFBB28',
  suspended: '#FF8042',
  inactive: '#8884D8',
};

const EnhancedAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSystemAnalytics(period);
      if (response.success) {
        setAnalytics(response.data as AnalyticsData);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Format growth data for line chart
  const formatGrowthData = () => {
    if (!analytics?.userAnalytics.growth) return [];
    return analytics.userAnalytics.growth.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      users: item.count,
    }));
  };

  // Format activity data for line chart
  const formatActivityData = () => {
    if (!analytics?.activityAnalytics.daily) return [];
    return analytics.activityAnalytics.daily.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      activities: item.count,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error || 'No analytics data available'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Period Selector */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">System Analytics</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Period</InputLabel>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Time Period">
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
            <MenuItem value="1y">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{analytics.userAnalytics.total}</Typography>
              <Typography variant="body2" color="success.main">
                {analytics.userAnalytics.active} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                New Users
              </Typography>
              <Typography variant="h4">{analytics.userAnalytics.new}</Typography>
              <Typography variant="body2" color="textSecondary">
                In selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Roles
              </Typography>
              <Typography variant="h4">{analytics.roleAnalytics.total}</Typography>
              <Typography variant="body2" color="success.main">
                {analytics.roleAnalytics.active} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Activities
              </Typography>
              <Typography variant="h4">{analytics.activityAnalytics.total}</Typography>
              <Typography variant="body2" color="textSecondary">
                In selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatGrowthData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Trend Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatActivityData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activities" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Users by Role - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users by Role
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.userAnalytics.byRole}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.userAnalytics.byRole.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Users by Status - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.userAnalytics.byStatus}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.userAnalytics.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry._id] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 3 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top Activities - Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Activities
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.activityAnalytics.byAction.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions by Risk Level - Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permissions by Risk Level
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.permissionAnalytics.byRiskLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Assignments
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.roleAnalytics.assignments}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                New assignments in period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Permissions
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.permissionAnalytics.total}
              </Typography>
              <Typography variant="body2" color="success.main">
                {analytics.permissionAnalytics.active} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permission Categories
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.permissionAnalytics.byCategory.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedAnalytics;
