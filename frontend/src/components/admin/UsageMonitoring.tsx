import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Select } from '@/components/ui/select';

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';

interface UsageData {
  period: string;
  users: number;
  activeUsers: number;
  subscriptions: number;
  activeSubscriptions: number;
  revenue: number;
  apiCalls: number;
  storageUsed: number;
}
interface UsageMetrics {
  currentPeriod: UsageData;
  previousPeriod: UsageData;
  growth: {
    users: number;
    activeUsers: number;
    subscriptions: number;
    revenue: number;
    apiCalls: number;
  };
}
const UsageMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>(
    'month'
  );
  const [error, setError] = useState<string | null>(null);
  const addNotification = useUIStore((state) => state.addNotification);
  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real implementation, this would call the adminService
      // For now, we'll mock the data structure
      const mockMetrics: UsageMetrics = {
        currentPeriod: {
          period: 'This Month',
          users: 1240,
          activeUsers: 980,
          subscriptions: 850,
          activeSubscriptions: 720,
          revenue: 45000,
          apiCalls: 125000,
          storageUsed: 245,
        },
        previousPeriod: {
          period: 'Last Month',
          users: 1120,
          activeUsers: 890,
          subscriptions: 780,
          activeSubscriptions: 650,
          revenue: 38000,
          apiCalls: 110000,
          storageUsed: 210,
        },
        growth: {
          users: 10.7,
          activeUsers: 10.1,
          subscriptions: 9.0,
          revenue: 18.4,
          apiCalls: 13.6,
        },
      };
      setUsageMetrics(mockMetrics);
    } catch (err) {
      setError('Failed to load usage data');
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load usage monitoring data'}
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadUsageData();
  }, [period]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN', }.format(amount);
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  const getGrowthIcon = (value: number) => {
    if (value > 0) {
      return (
        <TrendingUpIcon className="" />
      );
    } else if (value < 0) {
      return (
        <TrendingDownIcon className="" />
      );
    }
    return null;
  };
  const getGrowthColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };
  if (loading) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error" className="">
        {error}
      </Alert>
    );
  }
  return (
    <div>
      <div
        className=""
      >
        <div className="">
          <AnalyticsIcon className="" />
          <div  component="h1">
            Usage Monitoring & Analytics
          </div>
        </div>
        <div className="">
          <div size="small" className="">
            <Label>Period</Label>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </div>
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={loadUsageData}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Usage Metrics */}
      <div container spacing={3} className="">
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <div className="">
                <PeopleIcon className="" />
                <div  color="textSecondary">
                  Total Users
                </div>
              </div>
              <div  gutterBottom>
                {usageMetrics?.currentPeriod.users.toLocaleString() || '0'}
              </div>
              <div className="">
                {getGrowthIcon(usageMetrics?.growth.users || 0)}
                <div
                  
                  className=""
                >
                  {usageMetrics?.growth.users.toFixed(1) || '0'}%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs {usageMetrics?.previousPeriod.period}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <div className="">
                <PeopleIcon className="" />
                <div  color="textSecondary">
                  Active Users
                </div>
              </div>
              <div  gutterBottom>
                {usageMetrics?.currentPeriod.activeUsers.toLocaleString() ||
                  '0'}
              </div>
              <div className="">
                {getGrowthIcon(usageMetrics?.growth.activeUsers || 0)}
                <div
                  
                  className=""
                >
                  {usageMetrics?.growth.activeUsers.toFixed(1) || '0'}%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs {usageMetrics?.previousPeriod.period}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <div className="">
                <StorageIcon className="" />
                <div  color="textSecondary">
                  Subscriptions
                </div>
              </div>
              <div  gutterBottom>
                {usageMetrics?.currentPeriod.subscriptions.toLocaleString() ||
                  '0'}
              </div>
              <div className="">
                {getGrowthIcon(usageMetrics?.growth.subscriptions || 0)}
                <div
                  
                  className=""
                >
                  {usageMetrics?.growth.subscriptions.toFixed(1) || '0'}%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs {usageMetrics?.previousPeriod.period}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <div className="">
                <TimelineIcon className="" />
                <div  color="textSecondary">
                  Revenue
                </div>
              </div>
              <div  gutterBottom>
                {formatCurrency(usageMetrics?.currentPeriod.revenue || 0)}
              </div>
              <div className="">
                {getGrowthIcon(usageMetrics?.growth.revenue || 0)}
                <div
                  
                  className=""
                >
                  {usageMetrics?.growth.revenue.toFixed(1) || '0'}%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs {usageMetrics?.previousPeriod.period}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <div className="">
                <AnalyticsIcon className="" />
                <div  color="textSecondary">
                  API Calls
                </div>
              </div>
              <div  gutterBottom>
                {formatNumber(usageMetrics?.currentPeriod.apiCalls || 0)}
              </div>
              <div className="">
                {getGrowthIcon(usageMetrics?.growth.apiCalls || 0)}
                <div
                  
                  className=""
                >
                  {usageMetrics?.growth.apiCalls.toFixed(1) || '0'}%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs {usageMetrics?.previousPeriod.period}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Detailed Usage Table */}
      <div container spacing={3}>
        <div item xs={12}>
          <Card>
            <CardHeader
              title="Detailed Usage Statistics"
              subheader="Comprehensive breakdown of system usage"
            />
            <Separator />
            <CardContent>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.period}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.period}
                      </TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Total Users
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.users.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.users.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(usageMetrics?.growth.users || 0)}
                          <div
                            
                            className=""
                          >
                            {usageMetrics?.growth.users.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Active Users
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.activeUsers.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.activeUsers.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(usageMetrics?.growth.activeUsers || 0)}
                          <div
                            
                            className=""
                          >
                            {usageMetrics?.growth.activeUsers.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Subscriptions
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.subscriptions.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.subscriptions.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(
                            usageMetrics?.growth.subscriptions || 0
                          )}
                          <div
                            
                            className=""
                          >
                            {usageMetrics?.growth.subscriptions.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Active Subscriptions
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.activeSubscriptions.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.activeSubscriptions.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(
                            (((usageMetrics?.currentPeriod
                              .activeSubscriptions || 0) -
                              (usageMetrics?.previousPeriod
                                .activeSubscriptions || 0)) /
                              (usageMetrics?.previousPeriod
                                .activeSubscriptions || 1)) *
                              100
                          )}
                          <div
                            
                            className=""
                          >
                            {(
                              (((usageMetrics?.currentPeriod
                                .activeSubscriptions || 0) -
                                (usageMetrics?.previousPeriod
                                  .activeSubscriptions || 0)) /
                                (usageMetrics?.previousPeriod
                                  .activeSubscriptions || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Revenue
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          usageMetrics?.currentPeriod.revenue || 0
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          usageMetrics?.previousPeriod.revenue || 0
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(usageMetrics?.growth.revenue || 0)}
                          <div
                            
                            className=""
                          >
                            {usageMetrics?.growth.revenue.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        API Calls
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(
                          usageMetrics?.currentPeriod.apiCalls || 0
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(
                          usageMetrics?.previousPeriod.apiCalls || 0
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(usageMetrics?.growth.apiCalls || 0)}
                          <div
                            
                            className=""
                          >
                            {usageMetrics?.growth.apiCalls.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Storage Used (GB)
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.currentPeriod.storageUsed.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {usageMetrics?.previousPeriod.storageUsed.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <div
                          className=""
                        >
                          {getGrowthIcon(
                            (((usageMetrics?.currentPeriod.storageUsed || 0) -
                              (usageMetrics?.previousPeriod.storageUsed || 0)) /
                              (usageMetrics?.previousPeriod.storageUsed || 1)) *
                              100
                          )}
                          <div
                            
                            className=""
                          >
                            {(
                              (((usageMetrics?.currentPeriod.storageUsed || 0) -
                                (usageMetrics?.previousPeriod.storageUsed ||
                                  0)) /
                                (usageMetrics?.previousPeriod.storageUsed ||
                                  1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default UsageMonitoring;
