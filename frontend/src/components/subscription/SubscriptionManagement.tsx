import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  FormControlLabel,
  Switch,
  Container,
  Paper,
  Divider,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';
import { useCurrentSubscriptionQuery, useAvailablePlansQuery } from '../../queries/useSubscription';
import { subscriptionService } from '../../services/subscriptionService';

interface Plan {
  _id: string;
  name: string;
  priceNGN: number;
  tier: string;
  popularPlan: boolean;
  description: string;
  displayFeatures: string[];
  billingInterval: string;
}

const SubscriptionManagement: React.FC = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // Queries
  const { 
    data: currentSubscription, 
    isLoading: subscriptionLoading,
  } = useCurrentSubscriptionQuery();
  
  const { 
    data: plans = [], 
    isLoading: plansLoading 
  } = useAvailablePlansQuery(billingInterval);

  // Use plans directly from the query (already filtered by billing interval)
  const filteredPlans = plans;

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.subscription?.planId?._id === planId;
  };

  const getTrialDaysRemaining = () => {
    if (currentSubscription?.subscription?.status === 'trial' && currentSubscription?.subscription?.endDate) {
      const endDate = new Date(currentSubscription.subscription.endDate);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  const handleSubscribe = async (plan: Plan) => {
    if (isCurrentPlan(plan._id)) {
      addNotification({
        type: 'info',
        title: 'Already Subscribed',
        message: 'You are already subscribed to this plan',
        duration: 3000,
      });
      return;
    }

    setLoading(plan._id);
    try {
      const response = await subscriptionService.createCheckoutSession(
        plan._id, 
        billingInterval
      );

      if (response.success && response.data?.checkoutUrl) {
        // Redirect to Nomba checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error(response.message || 'Failed to create checkout session');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate subscription';
      addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number, interval: 'monthly' | 'yearly') => {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);

    if (interval === 'yearly') {
      const monthlyEquivalent = Math.round(price / 12);
      return `${formatted}/year (₦${monthlyEquivalent.toLocaleString()}/mo)`;
    }
    
    return `${formatted}/month`;
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <SecurityIcon color="primary" />;
      case 'pro':
        return <TrendingUpIcon color="secondary" />;
      case 'enterprise':
        return <GroupIcon color="success" />;
      default:
        return <StarIcon color="action" />;
    }
  };

  const getYearlySavings = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 10; // 2 months free
    const monthlySavings = (monthlyPrice * 12 - yearlyPrice) / 12;
    return Math.round(monthlySavings);
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
        <Typography variant="h6" align="center">
          Loading subscription plans...
        </Typography>
      </Container>
    );
  }

  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Subscription Plans
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Choose the perfect plan for your pharmacy needs
        </Typography>

        {/* Current Subscription Status */}
        {currentSubscription?.subscription && (
          <Alert 
            severity={currentSubscription.subscription.status === 'trial' ? 'info' : 'success'} 
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            <Typography variant="body1">
              {currentSubscription.subscription.status === 'trial' ? (
                <>
                  You are currently on a <strong>Free Trial</strong>
                  {trialDaysRemaining > 0 ? (
                    <> with <strong>{trialDaysRemaining} days remaining</strong></>
                  ) : (
                    <> that has <strong>expired</strong></>
                  )}
                </>
              ) : (
                <>
                  Current Plan: <strong>{currentSubscription.subscription.planId?.name || 'Unknown'}</strong>
                </>
              )}
            </Typography>
          </Alert>
        )}

        {/* Billing Toggle */}
        <Paper elevation={1} sx={{ display: 'inline-flex', p: 1, mb: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={billingInterval === 'yearly'}
                onChange={(e) => setBillingInterval(e.target.checked ? 'yearly' : 'monthly')}
                color="primary"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">
                  {billingInterval === 'monthly' ? 'Monthly' : 'Yearly'}
                </Typography>
                {billingInterval === 'yearly' && (
                  <Chip 
                    label="Save 17%" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                )}
              </Stack>
            }
          />
        </Paper>
      </Box>

      {/* Plans Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {filteredPlans.map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan._id}>
            <Card
              elevation={plan.popularPlan ? 8 : 2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.popularPlan ? 2 : 1,
                borderColor: plan.popularPlan ? 'primary.main' : 'divider',
                transform: plan.popularPlan ? 'scale(1.05)' : 'none',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: plan.popularPlan ? 'scale(1.07)' : 'scale(1.02)',
                  boxShadow: (theme) => theme.shadows[8],
                },
              }}
            >
              {plan.popularPlan && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label="Most Popular"
                    color="primary"
                    icon={<StarIcon />}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, pt: plan.popularPlan ? 4 : 2 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {getPlanIcon(plan.tier)}
                  </Box>
                  
                  <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>

                  {plan.tier === 'free_trial' ? (
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        Free
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        14-day trial
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {formatPrice(plan.priceNGN, billingInterval).split('/')[0]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </Typography>
                      {billingInterval === 'yearly' && (
                        <Typography variant="caption" color="success.main" fontWeight="bold">
                          Save ₦{getYearlySavings(plan.priceNGN).toLocaleString()}/month
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                <List dense sx={{ mb: 3 }}>
                  {plan.displayFeatures.slice(0, 6).map((feature, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontSize: '0.875rem'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant={plan.popularPlan ? 'contained' : 'outlined'}
                  color={plan.popularPlan ? 'primary' : 'inherit'}
                  fullWidth
                  size="large"
                  disabled={loading === plan._id || isCurrentPlan(plan._id)}
                  onClick={() => handleSubscribe(plan)}
                  sx={{ 
                    mt: 'auto',
                    fontWeight: 'bold',
                    py: 1.5,
                  }}
                >
                  {loading === plan._id ? (
                    'Processing...'
                  ) : isCurrentPlan(plan._id) ? (
                    'Current Plan'
                  ) : plan.tier === 'enterprise' ? (
                    'Contact Sales'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Information */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="h6" gutterBottom>
          All plans include
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Secure & Compliant</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SupportIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">24/7 Support</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">No Setup Fees</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SubscriptionManagement;
