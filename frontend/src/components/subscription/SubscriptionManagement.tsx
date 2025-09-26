import { useState } from 'react';
import { Button, Card, CardContent, Progress, Alert, Switch, Separator } from '@/components/ui/button';
import { useUIStore } from '@/stores';
import { useCurrentSubscriptionQuery, useAvailablePlansQuery } from '@/hooks/useSubscription';
import { subscriptionService } from '@/services/subscriptionService';
import { StarIcon, SecurityIcon, TrendingUpIcon, GroupIcon, SupportIcon, CheckCircleIcon } from '@/components/ui/icons';
import { FormControlLabel } from '@/components/ui/form-control';
import { Chip } from '@/components/ui/chip';
import { List } from '@/components/ui/list';
import { Typography } from '@/components/ui/typography';
import { Box, Grid, Stack } from '@/components/ui/layout';

const SubscriptionManagement: React.FC = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [loading, setLoading] = useState<string | null>(null);
  // Queries
  const { data: currentSubscription, isLoading: subscriptionLoading } =
    useCurrentSubscriptionQuery();
  const { data: plans = [], isLoading: plansLoading } =
    useAvailablePlansQuery(billingInterval);
  // Helper function to convert features object to display features array
  const getDisplayFeatures = (plan: SubscriptionPlan): string[] => {
    const features = [];
    if (plan.features.patientLimit) {
      if (plan.features.patientLimit === -1) {
        features.push('Unlimited patients');
      } else {
        features.push(`Up to ${plan.features.patientLimit} patients`);
      }
    } else {
      features.push('Unlimited patients');
    }
    if (plan.features.reminderSmsMonthlyLimit) {
      if (plan.features.reminderSmsMonthlyLimit === -1) {
        features.push('Unlimited SMS reminders');
      } else {
        features.push(
          `${plan.features.reminderSmsMonthlyLimit} SMS reminders/month`
        );
      }
    }
    if (plan.features.reportsExport) features.push('Export reports');
    if (plan.features.careNoteExport) features.push('Export care notes');
    if (plan.features.adrModule) features.push('ADR monitoring');
    if (plan.features.multiUserSupport) features.push('Multi-user support');
    if (plan.features.teamSize) {
      if (plan.features.teamSize === -1) {
        features.push('Unlimited team members');
      } else {
        features.push(`Up to ${plan.features.teamSize} team members`);
      }
    }
    if (plan.features.apiAccess) features.push('API access');
    if (plan.features.customIntegrations) features.push('Custom integrations');
    if (plan.features.prioritySupport) features.push('Priority support');
    // New features for Pharmily and Network tiers
    if (plan.features.adrReporting) features.push('ADR Reporting');
    if (plan.features.drugInteractionChecker)
      features.push('Drug Interaction Checker');
    if (plan.features.doseCalculator) features.push('Dose Calculator');
    if (plan.features.multiLocationDashboard)
      features.push('Multi-location Dashboard');
    if (plan.features.sharedPatientRecords)
      features.push('Shared Patient Records');
    if (plan.features.groupAnalytics) features.push('Group Analytics');
    if (plan.features.cdss) features.push('Clinical Decision Support System');
    return features;
  };
  // Use plans directly from the query (already filtered by billing interval)
  const tierOrder = [
    'free_trial',
    'basic',
    'pro',
    'pharmily',
    'network',
    'enterprise',
  ];
  const filteredPlans = plans.sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );
  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.subscription?.planId?._id === planId;
  };
  const getTrialDaysRemaining = () => {
    if (
      currentSubscription?.subscription?.status === 'trial' &&
      currentSubscription?.subscription?.endDate
    ) {
      const endDate = new Date(currentSubscription.subscription.endDate);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Handle Enterprise contact sales
    if (plan.isContactSales && plan.whatsappNumber) {
      const message = encodeURIComponent(
        `Hello! I'm interested in the ${plan.name} plan for my pharmacy. Could you please provide more details about pricing and features?`
      );
      const whatsappUrl = `https://wa.me/${plan.whatsappNumber.replace(
        /[^0-9]/g,
        ''
      )}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      return;
    }
    if (isCurrentPlan(plan._id)) {
      addNotification({
        type: 'info',
        title: 'Already Subscribed',
        message: 'You are already subscribed to this plan',
        duration: 3000
      });
      return;
    }
    setLoading(plan._id);
    try {
      const response = await subscriptionService.createCheckoutSession(
        plan._id,
        billingInterval
      );
      if (response.success && response.data?.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error(
          response.message || 'Failed to create checkout session'
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initiate subscription';
      addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(null);
    }
  };
  const formatPrice = (price: number, interval: 'monthly' | 'yearly') => {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
    if (interval === 'yearly') {
      const monthlyEquivalent = Math.round(price / 12);
      return `${formatted}/year (₦${monthlyEquivalent.toLocaleString()}/mo)`;
    }
    return `${formatted}/month`;
  };
  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free_trial':
        return <StarIcon color="action" />;
      case 'basic':
        return <SecurityIcon color="primary" />;
      case 'pro':
        return <TrendingUpIcon color="secondary" />;
      case 'pharmily':
        return <GroupIcon color="info" />;
      case 'network':
        return <SupportIcon color="warning" />;
      case 'enterprise':
        return <GroupIcon color="success" />;
      default:
        return <StarIcon color="action" />;
    }
  };
  const getYearlySavings = (monthlyPrice: number) => {
    // 25% discount calculation: Monthly × 12 × 0.75
    const yearlyPrice = monthlyPrice * 12 * 0.75;
    const actualYearlyCost = monthlyPrice * 12;
    const savings = actualYearlyCost - yearlyPrice;
    const savingsPercentage = (savings / actualYearlyCost) * 100;
    return Math.round(savingsPercentage);
  };
  if (subscriptionLoading || plansLoading) {
    return (
      <div className="max-w-lg">
        <div className="">
          <Progress className="" />
        </div>
        <div className="text-center">
          Loading subscription plans...
        </div>
      </div>
    );
  }
  const trialDaysRemaining = getTrialDaysRemaining();
  return (
    <div className="max-w-lg">
      <div className="">
        <h1 className="font-bold mb-2">
          Subscription Plans
        </h1>
        <div className="text-gray-600 mb-4">
          Choose the perfect plan for your pharmacy needs
        </div>
        {/* Current Subscription Status */}
        {currentSubscription?.subscription && (
          <Alert
            severity={
              currentSubscription.subscription.status === 'trial'
                ? 'info'
                : 'success'
            }
            className=""
          >
            <div>
              {currentSubscription.subscription.status === 'trial' ? (
                <>
                  You are currently on a <strong>Free Trial</strong>
                  {trialDaysRemaining > 0 ? (
                    <>
                      {' '}
                      with <strong>{trialDaysRemaining} days remaining</strong>
                    </>
                  ) : (
                    <>
                      {' '}
                      that has <strong>expired</strong>
                    </>
                  )}
                </>
              ) : (
                <>
                  Current Plan:{' '}
                  <strong>
                    {currentSubscription.subscription.planId?.name || 'Unknown'}
                  </strong>
                </>
              )}
            </div>
          </Alert>
        )}
        {/* Billing Toggle */}
        <div className="">
          <FormControlLabel
            control={
              <Switch
                checked={billingInterval === 'yearly'}
                onChange={(e) =>
                  setBillingInterval(e.target.checked ? 'yearly' : 'monthly')
                }
                color="primary"
              />
            }
            label=""
          />
          <div className="flex flex-row gap-1 items-center">
            <div>
              {billingInterval === 'monthly' ? 'Monthly' : 'Yearly'}
            </div>
            {billingInterval === 'yearly' && (
              <Chip
                label="Save 25%"
                size="small"
                color="success"
              />
            )}
          </div>
        </div>
      </div>
      {/* Plans Grid */}
      <div
        className="">
        {filteredPlans.map((plan) => (
          <div key={plan._id}>
            <Card
              elevation={plan.popularPlan ? 8 : 2}
              className="">
              {plan.popularPlan && (
                <div
                  className=""
                >
                  <Chip
                    label="Most Popular"
                    color="primary"
                    icon={<StarIcon />}
                    className=""
                  />
                </div>
              )}
              <CardContent className="">
                <div className="">
                  <div className="">{getPlanIcon(plan.tier)}</div>
                  <div

                    component="h2"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {plan.name}
                  </div>
                  <div

                    color="text.secondary"
                    className=""
                  >
                    {plan.description}
                  </div>
                  {plan.tier === 'free_trial' ? (
                    <div>
                      <div

                        fontWeight="bold"
                        color="primary.main"
                      >
                        Free
                      </div>
                      <div color="text.secondary">
                        14-day trial
                      </div>
                    </div>
                  ) : plan.isContactSales ? (
                    <div>
                      <div

                        fontWeight="bold"
                        color="primary.main"
                      >
                        Contact Sales
                      </div>
                      <div color="text.secondary">
                        Custom pricing
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div

                        fontWeight="bold"
                        color="primary.main"
                      >
                        {
                          formatPrice(plan.priceNGN, billingInterval).split(
                            '/'
                          )[0]
                        }
                      </div>
                      <div color="text.secondary">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </div>
                      {billingInterval === 'yearly' && (
                        <div

                          color="success.main"
                          fontWeight="bold"
                        >
                          Save ₦
                          {getYearlySavings(plan.priceNGN).toLocaleString()}
                          /month
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Separator className="" />
                <List dense className="">
                  {getDisplayFeatures(plan)
                    .slice(0, 6)
                    .map((feature, index) => (
                      <div key={index} disablePadding>
                        <div className="">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </div>
                        <div
                          primary={feature}

                        />
                      </div>
                    ))}
                </List>
                <Button
                  variant={plan.popularPlan ? 'contained' : 'outlined'}
                  color={plan.popularPlan ? 'primary' : 'inherit'}
                  fullWidth
                  size="large"
                  disabled={loading === plan._id || isCurrentPlan(plan._id)}
                  onClick={() => handleSubscribe(plan)}
                  className=""
                >
                  {loading === plan._id
                    ? 'Processing...'
                    : isCurrentPlan(plan._id)
                      ? 'Current Plan'
                      : plan.isContactSales
                        ? 'Contact Sales'
                        : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {/* Additional Information */}
      <div className="">
        <div gutterBottom>
          All plans include
        </div>
        <div
          className="">
          <div
            className=""
          >
            <SecurityIcon color="primary" className="" />
            <div >Secure & Compliant</div>
          </div>
          <div
            className=""
          >
            <SupportIcon color="primary" className="" />
            <div >24/7 Support</div>
          </div>
          <div
            className=""
          >
            <CheckCircleIcon color="primary" className="" />
            <div >No Setup Fees</div>
          </div>
        </div>
      </div>
    </div >
  );
};
export default SubscriptionManagement;
