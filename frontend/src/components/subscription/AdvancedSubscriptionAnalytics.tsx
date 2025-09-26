import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Select } from '@/components/ui/select';

import { Spinner } from '@/components/ui/spinner';

import { Progress } from '@/components/ui/progress';

import { Alert } from '@/components/ui/alert';

import { Tabs } from '@/components/ui/tabs';

import { Separator } from '@/components/ui/separator';
// Import icons with default imports
interface RevenueData {
  date: string;
  amount: number;
  subscriptions: number;
  churnRate: number;
}
interface SubscriptionData {
  tier: string;
  count: number;
  percentage: number;
  revenue: number;
  mrr: number;
  churnRate: number;
}
interface FeatureUsage {
  feature: string;
  usage: number;
  limit?: number;
  percentage: number;
}
interface AdvancedAnalytics {
  revenueTrend: RevenueData[];
  subscriptionDistribution: SubscriptionData[];
  featureUsage: FeatureUsage[];
  keyMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
    ltv: number;
    arpu: number;
  };
}
const AdvancedSubscriptionAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>(
    'month'
  );
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useUIStore((state) => state.addNotification);
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real implementation, this would call the subscriptionService
      // For now, we'll mock the data structure
      const mockAnalytics: AdvancedAnalytics = {
        revenueTrend: [
          {
            date: '2023-05-01',
            amount: 12500,
            subscriptions: 85,
            churnRate: 2.5,
          },
          {
            date: '2023-06-01',
            amount: 14200,
            subscriptions: 92,
            churnRate: 2.1,
          },
          {
            date: '2023-07-01',
            amount: 16800,
            subscriptions: 105,
            churnRate: 1.8,
          },
          {
            date: '2023-08-01',
            amount: 18900,
            subscriptions: 118,
            churnRate: 1.5,
          },
          {
            date: '2023-09-01',
            amount: 21500,
            subscriptions: 132,
            churnRate: 1.2,
          },
          {
            date: '2023-10-01',
            amount: 24800,
            subscriptions: 148,
            churnRate: 1.0,
          },
        ],
        subscriptionDistribution: [
          {
            tier: 'Free Trial',
            count: 120,
            percentage: 15,
            revenue: 0,
            mrr: 0,
            churnRate: 85,
          },
          {
            tier: 'Basic',
            count: 280,
            percentage: 35,
            revenue: 280000,
            mrr: 28000,
            churnRate: 8,
          },
          {
            tier: 'Pro',
            count: 250,
            percentage: 31,
            revenue: 375000,
            mrr: 37500,
            churnRate: 5,
          },
          {
            tier: 'Enterprise',
            count: 150,
            percentage: 19,
            revenue: 450000,
            mrr: 45000,
            churnRate: 2,
          },
        ],
        featureUsage: [
          {
            feature: 'Patient Management',
            usage: 95,
            limit: 100,
            percentage: 95,
          },
          {
            feature: 'Medication Tracking',
            usage: 87,
            limit: 100,
            percentage: 87,
          },
          { feature: 'Clinical Notes', usage: 72, limit: 100, percentage: 72 },
          { feature: 'ADR Module', usage: 45, limit: 100, percentage: 45 },
          { feature: 'Reports Export', usage: 68, limit: 100, percentage: 68 },
        ],
        keyMetrics: {
          mrr: 110500,
          arr: 1326000,
          churnRate: 4.1,
          ltv: 26800,
          arpu: 138,
        },
      };
      setAnalytics(mockAnalytics);
    } catch {
      setError('Failed to load analytics data');
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load advanced subscription analytics'}
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAnalyticsData();
  }, [period]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, }.format(amount);
  };
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return (
        <TrendingUpIcon className="" />
      );
    } else if (current < previous) {
      return (
        <TrendingDownIcon className="" />
      );
    }
    return null;
  };
  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'success.main';
    if (current < previous) return 'error.main';
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
            Advanced Subscription Analytics
          </div>
        </div>
        <div className="">
          <div size="small" className="">
            <Label>Period</Label>
            <Select
              value={period}
              label="Period"
              onChange={(e) =>
                setPeriod(
                  e.target.value as 'week' | 'month' | 'quarter' | 'year'
                )}
              }
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </div>
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={loadAnalyticsData}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Key Metrics */}
      <div container spacing={3} className="">
        <div >
          <Card>
            <CardContent>
              <div className="">
                <AttachMoneyIcon className="" />
                <div  color="textSecondary">
                  MRR
                </div>
              </div>
              <div  gutterBottom>
                {formatCurrency(analytics?.keyMetrics.mrr || 0)}
              </div>
              <div className="">
                {getTrendIcon(
                  analytics?.keyMetrics.mrr || 0,
                  (analytics?.keyMetrics.mrr || 0) * 0.95
                )}
                <div
                  
                  className=""
                >
                  +5.2%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs last period
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div className="">
                <AttachMoneyIcon className="" />
                <div  color="textSecondary">
                  ARR
                </div>
              </div>
              <div  gutterBottom>
                {formatCurrency(analytics?.keyMetrics.arr || 0)}
              </div>
              <div className="">
                {getTrendIcon(
                  analytics?.keyMetrics.arr || 0,
                  (analytics?.keyMetrics.arr || 0) * 0.92
                )}
                <div
                  
                  className=""
                >
                  +8.7%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs last period
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div className="">
                <PeopleIcon className="" />
                <div  color="textSecondary">
                  Churn Rate
                </div>
              </div>
              <div  gutterBottom>
                {(analytics?.keyMetrics.churnRate || 0).toFixed(1)}%
              </div>
              <div className="">
                {getTrendIcon(
                  analytics?.keyMetrics.churnRate || 0,
                  (analytics?.keyMetrics.churnRate || 0) * 1.2
                )}
                <div
                  
                  className=""
                >
                  -17.1%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  improvement
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div className="">
                <TimelineIcon className="" />
                <div  color="textSecondary">
                  LTV
                </div>
              </div>
              <div  gutterBottom>
                {formatCurrency(analytics?.keyMetrics.ltv || 0)}
              </div>
              <div className="">
                {getTrendIcon(
                  analytics?.keyMetrics.ltv || 0,
                  (analytics?.keyMetrics.ltv || 0) * 0.9
                )}
                <div
                  
                  className=""
                >
                  +11.1%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs last period
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div className="">
                <BarChartIcon className="" />
                <div  color="textSecondary">
                  ARPU
                </div>
              </div>
              <div  gutterBottom>
                {formatCurrency(analytics?.keyMetrics.arpu || 0)}
              </div>
              <div className="">
                {getTrendIcon(
                  analytics?.keyMetrics.arpu || 0,
                  (analytics?.keyMetrics.arpu || 0) * 0.95
                )}
                <div
                  
                  className=""
                >
                  +5.3%
                </div>
                <div
                  
                  color="textSecondary"
                  className=""
                >
                  vs last period
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Analytics Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="Revenue Trend" />
          <Tab icon={<PieChartIcon />} label="Subscription Distribution" />
          <Tab icon={<TimelineIcon />} label="Feature Usage" />
        </Tabs>
        <Separator />
        <CardContent>
          {activeTab === 0 && (
            <div>
              <div  gutterBottom>
                Revenue Trend
              </div>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Subscriptions</TableCell>
                      <TableCell align="right">Churn Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.revenueTrend.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {new Date(data.date).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric', }}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(data.amount)}
                        </TableCell>
                        <TableCell align="right">
                          {data.subscriptions}
                        </TableCell>
                        <TableCell align="right">{data.churnRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
          {activeTab === 1 && (
            <div>
              <div  gutterBottom>
                Subscription Distribution
              </div>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Plan Tier</TableCell>
                      <TableCell align="right">Subscriptions</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">MRR</TableCell>
                      <TableCell align="right">Churn Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.subscriptionDistribution.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          <div className="">
                            <div >{data.tier}</div>
                            {data.tier === 'Enterprise' && (
                              <Chip
                                label="Premium"
                                size="small"
                                color="primary"
                                
                                className=""
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell align="right">{data.count}</TableCell>
                        <TableCell align="right">{data.percentage}%</TableCell>
                        <TableCell align="right">
                          {formatCurrency(data.revenue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(data.mrr)}
                        </TableCell>
                        <TableCell align="right">{data.churnRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Subscription Distribution Visualization */}
              <div className="">
                <div  gutterBottom>
                  Distribution by Plan Tier
                </div>
                {analytics?.subscriptionDistribution.map((data, index) => (
                  <div key={index} className="">
                    <div
                      className=""
                    >
                      <div >{data.tier}</div>
                      <div >
                        {data.percentage}%
                      </div>
                    </div>
                    <Progress
                      
                      className=""
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 2 && (
            <div>
              <div  gutterBottom>
                Feature Usage
              </div>
              <TableContainer >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell align="right">Usage</TableCell>
                      <TableCell align="right">Limit</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.featureUsage.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {data.feature}
                        </TableCell>
                        <TableCell align="right">{data.usage}</TableCell>
                        <TableCell align="right">
                          {data.limit || 'Unlimited'}
                        </TableCell>
                        <TableCell align="right">
                          <div className="">
                            <div className="">
                              <Progress
                                
                                className=""
                              />
                            </div>
                            <div  className="">
                              {data.percentage}%
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Feature Usage Insights */}
              <div className="">
                <div  gutterBottom>
                  Usage Insights
                </div>
                <div container spacing={2}>
                  <div >
                    <div className="">
                      <div  gutterBottom>
                        High Usage Features
                      </div>
                      <div  color="textSecondary">
                        Patient Management and Medication Tracking are the most
                        utilized features, indicating strong core adoption.
                      </div>
                    </div>
                  </div>
                  <div >
                    <div className="">
                      <div  gutterBottom>
                        Underutilized Features
                      </div>
                      <div  color="textSecondary">
                        ADR Module has low adoption. Consider promoting this
                        feature to improve patient safety outcomes.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default AdvancedSubscriptionAnalytics;
