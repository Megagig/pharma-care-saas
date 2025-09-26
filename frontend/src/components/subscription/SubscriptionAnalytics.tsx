// Import our custom Grid components to fix type issues
import LoadingSpinner from '../LoadingSpinner';

import { Button, Card, CardContent, Progress, Alert, Separator } from '@/components/ui/button';

interface UsageMetrics {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  daysRemaining: number;
  features: string[];
  storageUsed: number;
  apiCalls: number;
  teamMembers: number;
}
interface CostOptimization {
  currentMonthlySpend: number;
  projectedAnnualSpend: number;
  savings: {
    yearlyVsMonthly: number;
    downgradeSavings: number;
  };
}
interface Subscription {
  id: string;
  planName: string;
  status: string;
  tier: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number;
  interval: string;
}
interface SubscriptionAnalytics {
  subscription: Subscription;
  usageMetrics: UsageMetrics;
  costOptimization: CostOptimization;
}
const SubscriptionAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const addNotification = useUIStore((state) => state.addNotification);
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentService.getSubscriptionAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription analytics',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN', }.format(amount);
  };
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'}
  };
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };
  const getRemainingDaysColor = (days: number) => {
    if (days <= 7) return 'error';
    if (days <= 30) return 'warning';
    return 'success';
  };
  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }
  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available. Please ensure you have an active
        subscription.
      </Alert>
    );
  }
  const { subscription, usageMetrics, costOptimization } = analytics;
  return (
    <div>
      <div direction="row" spacing={2} alignItems="center" className="">
        <AnalyticsIcon />
        <div >Subscription Analytics</div>
      </div>
      <divContainer spacing={3}>
        {/* Current Period Overview */}
        <divItem xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Current Billing Period
              </div>
              <divContainer spacing={3}>
                <divItem xs={12} md={4}>
                  <div>
                    <div  color="text.secondary">
                      Period
                    </div>
                    <div >
                      {formatDate(usageMetrics.currentPeriodStart)} -{' '}
                      {formatDate(usageMetrics.currentPeriodEnd)}
                    </div>
                  </div>
                </GridItem>
                <divItem xs={12} md={4}>
                  <div>
                    <div  color="text.secondary">
                      Days Remaining
                    </div>
                    <div direction="row" spacing={1} alignItems="center">
                      <div >
                        {usageMetrics.daysRemaining}
                      </div>
                      <Chip
                        label={
                          usageMetrics.daysRemaining <= 7
                            ? 'Ending Soon'
                            : 'Active'}
                        }
                        color={getRemainingDaysColor(
                          usageMetrics.daysRemaining}
                        )}
                        size="small"
                        icon={<ScheduleIcon />}
                      />
                    </div>
                  </div>
                </GridItem>
                <divItem xs={12} md={4}>
                  <div>
                    <div  color="text.secondary">
                      Current Plan
                    </div>
                    <div
                      
                      className=""
                    >
                      {subscription.tier.replace('_', ' ')}
                    </div>
                  </div>
                </GridItem>
              </GridContainer>
            </CardContent>
          </Card>
        </GridItem>
        {/* Usage Metrics */}
        <divItem xs={12} md={8}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Usage Metrics
              </div>
              <divContainer spacing={3}>
                {/* Storage Usage */}
                <divItem xs={12}>
                  <div className="">
                    <div
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      className=""
                    >
                      <div direction="row" spacing={1} alignItems="center">
                        <StorageIcon color="primary" />
                        <div >Storage Usage</div>
                      </div>
                      <div  color="text.secondary">
                        {usageMetrics.storageUsed} GB used
                      </div>
                    </div>
                    <Progress
                       // Assuming 10GB limit
                      color={getUsageColor(
                        getUsagePercentage(usageMetrics.storageUsed, 10)}
                      )}
                      className=""
                    />
                  </div>
                </GridItem>
                {/* API Calls */}
                <divItem xs={12}>
                  <div className="">
                    <div
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      className=""
                    >
                      <div direction="row" spacing={1} alignItems="center">
                        <ApiIcon color="primary" />
                        <div >
                          API Calls This Month
                        </div>
                      </div>
                      <div  color="text.secondary">
                        {usageMetrics.apiCalls.toLocaleString()} calls
                      </div>
                    </div>
                    <Progress
                       // Assuming 10k limit
                      color={getUsageColor(
                        getUsagePercentage(usageMetrics.apiCalls, 10000)}
                      )}
                      className=""
                    />
                  </div>
                </GridItem>
                {/* Team Members */}
                <divItem xs={12}>
                  <div>
                    <div
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <div direction="row" spacing={1} alignItems="center">
                        <PeopleIcon color="primary" />
                        <div >Team Members</div>
                      </div>
                      <div  color="text.secondary">
                        {usageMetrics.teamMembers} members
                      </div>
                    </div>
                  </div>
                </GridItem>
              </GridContainer>
            </CardContent>
          </Card>
        </GridItem>
        {/* Cost Overview */}
        <divItem xs={12} md={4}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Cost Overview
              </div>
              <div spacing={2}>
                <div>
                  <div  color="text.secondary">
                    Current Monthly Cost
                  </div>
                  <div  color="primary.main">
                    {formatCurrency(costOptimization.currentMonthlySpend)}
                  </div>
                </div>
                <Separator />
                <div>
                  <div  color="text.secondary">
                    Projected Annual Cost
                  </div>
                  <div >
                    {formatCurrency(costOptimization.projectedAnnualSpend)}
                  </div>
                </div>
                {costOptimization.savings.yearlyVsMonthly > 0 && (
                  <Alert severity="info" icon={<SavingsIcon />}>
                    <div >
                      Save{' '}
                      {formatCurrency(costOptimization.savings.yearlyVsMonthly)}{' '}
                      with annual billing
                    </div>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </GridItem>
        {/* Feature Usage */}
        <divItem xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Active Features
              </div>
              <List dense>
                {usageMetrics.features.map((feature, index) => (
                  <div key={index}>
                    <div>
                      <CheckCircleIcon color="success" />
                    </div>
                    <div
                      primary={feature
                        .replace(/_/g, ' ')}
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    />
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </GridItem>
        {/* Optimization Suggestions */}
        <divItem xs={12} md={6}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Optimization Suggestions
              </div>
              <div spacing={2}>
                {usageMetrics.daysRemaining <= 7 && (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    <div >
                      Your subscription renews in {usageMetrics.daysRemaining}{' '}
                      days. Consider switching to annual billing to save money.
                    </div>
                  </Alert>
                )}
                {getUsagePercentage(usageMetrics.storageUsed, 10) > 80 && (
                  <Alert severity="info">
                    <div >
                      You're using{' '}
                      {Math.round(
                        getUsagePercentage(usageMetrics.storageUsed, 10)
                      )}
                      % of your storage. Consider upgrading your plan if you
                      need more space.
                    </div>
                  </Alert>
                )}
                {costOptimization.savings.yearlyVsMonthly > 0 && (
                  <div
                    className=""
                  >
                    <div direction="row" spacing={1} alignItems="center">
                      <TrendingUpIcon />
                      <div>
                        <div >
                          Annual Billing Savings
                        </div>
                        <div >
                          Switch to annual billing and save{' '}
                          {formatCurrency(
                            costOptimization.savings.yearlyVsMonthly
                          )}{' '}
                          per year!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {usageMetrics.storageUsed < 2 &&
                  usageMetrics.apiCalls < 1000 && (
                    <div
                      className=""
                    >
                      <div direction="row" spacing={1} alignItems="center">
                        <TrendingDownIcon />
                        <div>
                          <div >
                            Consider Downgrading
                          </div>
                          <div >
                            Based on your usage, you might be able to save money
                            with a lower-tier plan.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </GridItem>
        {/* Quick Actions */}
        <divItem xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Quick Actions
              </div>
              <div direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  
                  startIcon={<AssessmentIcon />}
                  onClick={() =>
                    (window.location.href =
                      '/dashboard/subscription/billing-history')}
                  }
                >
                  View Billing History
                </Button>
                <Button
                  
                  startIcon={<TrendingUpIcon />}
                  onClick={() =>
                    (window.location.href = '/dashboard/subscription/plans')}
                  }
                >
                  Upgrade Plan
                </Button>
                <Button
                  
                  startIcon={<SavingsIcon />}
                  onClick={() =>
                    (window.location.href =
                      '/dashboard/subscription/payment-methods')}
                  }
                >
                  Manage Payment Methods
                </Button>
                {costOptimization.savings.yearlyVsMonthly > 0 && (
                  <Button
                    
                    startIcon={<StarIcon />}
                    color="success"
                  >
                    Switch to Annual Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
};
export default SubscriptionAnalytics;
