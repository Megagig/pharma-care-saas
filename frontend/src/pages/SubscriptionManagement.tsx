import React, { useState, useEffect } from 'react';

import LoadingSpinner from '../components/LoadingSpinner';

import axios from 'axios';

import { Button } from '@/components/ui/button';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Progress } from '@/components/ui/progress';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';
import { List, InfoIcon, CheckIcon, StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
  _id: string;
  name: string;
  code: string;
  tier: string;
  tierRank: number;
  priceNGN: number;
  billingInterval: 'monthly' | 'yearly';
  popularPlan: boolean;
  isContactSales: boolean;
  whatsappNumber?: string;
  description: string;
  displayFeatures: string[];
  limits: {
    patients: number | null;
    users: number | null;
    locations: number | null;
    storage: number | null;
    apiCalls: number | null;
    clinicalNotes: number | null;
    reminderSms: number | null;
  };
}
interface SubscriptionStatus {
  hasWorkspace: boolean;
  hasSubscription: boolean;
  status: string;
  tier?: string;
  accessLevel: 'basic' | 'limited' | 'full';
  isTrialActive?: boolean;
  daysRemaining?: number;
  endDate?: string;
  message?: string;
}
const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch subscription status
      const statusResponse = await axios.get('/api/subscriptions/status', {
        withCredentials: true, // Use httpOnly cookies for authentication
      });
      if (statusResponse.data.success) {
        setSubscriptionStatus(statusResponse.data.data);
      }
      // Fetch available plans
      const plansResponse = await axios.get(
        `/api/subscriptions/plans?billingInterval=${billingInterval}`,
        {
          withCredentials: true, // Use httpOnly cookies for authentication
        }
      );
      if (plansResponse.data.success) {
        setPlans(plansResponse.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      if (error.response?.status === 401) {
        // User not authenticated, redirect to login
        window.location.href = '/login';
        return;
      }
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  }, [billingInterval]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleUpgrade = async (plan: Plan) => {
    if (plan.isContactSales) {
      // Open WhatsApp for enterprise plans
      if (plan.whatsappNumber) {
        const message = encodeURIComponent(
          `Hi! I'm interested in the ${plan.name} plan. Can you provide more information about pricing and features?`
        );
        window.open(
          `https://wa.me/${plan.whatsappNumber.replace(
            '+',
            ''
          )}?text=${message}`,
          '_blank'
        );
      }
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        '/api/subscriptions/checkout',
        {
          planId: plan._id,
          billingInterval,
          callbackUrl: `${window.location.origin}/subscription/success`,
        },
        {
          withCredentials: true, // Use httpOnly cookies for authentication
        }
      );
      if (response.data.success && response.data.data?.authorization_url) {
        // Redirect to payment provider checkout
        window.location.href = response.data.data.authorization_url;
      } else {
        setError(response.data.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setError('Failed to start upgrade process');
    } finally {
      setLoading(false);
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'info';
      case 'active':
        return 'success';
      case 'expired':
      case 'no_subscription':
        return 'error';
      case 'no_workspace':
        return 'warning';
      default:
        return 'default';
    }
  };
  const getStatusText = (status: SubscriptionStatus) => {
    if (!status.hasWorkspace) {
      return 'No Workplace';
    }
    if (!status.hasSubscription) {
      return 'No Subscription';
    }
    if (status.isTrialActive) {
      return `Trial (${status.daysRemaining} days left)`;
    }
    return status.status.charAt(0).toUpperCase() + status.status.slice(1);
  };
  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <div maxWidth="xl" className="">
      {/* Header */}
      <div className="">
        <div component="h1" gutterBottom>
          Subscription Management
        </div>
        <div color="text.secondary">
          Manage your subscription and upgrade your plan to unlock more features
        </div>
      </div>
      {error && (
        <Alert severity="error" className="">
          {error}
        </Alert>
      )}
      {/* Current Status Card */}
      {subscriptionStatus && (
        <Card className="">
          <CardContent>
            <div
              className=""
            >
              <div className="">
                <div gutterBottom>
                  Current Status
                </div>
                <div
                  className=""
                >
                  <Chip
                    label={getStatusText(subscriptionStatus)}
                    color={
                      getStatusColor(subscriptionStatus.status) as
                      | 'success'
                      | 'warning'
                      | 'error'
                      | 'info'
                    }

                  />
                  {subscriptionStatus.tier && (
                    <Chip
                      label={
                        subscriptionStatus.tier.charAt(0).toUpperCase() +
                        subscriptionStatus.tier.slice(1)
                      }

                    />
                  )}
                </div>
                <div color="text.secondary">
                  {subscriptionStatus.message}
                </div>
              </div>
              {subscriptionStatus.isTrialActive && (
                <div className="">
                  <div gutterBottom>
                    Trial Progress
                  </div>
                  <div className="">
                    <Progress

                      className=""
                    />
                  </div>
                  <div color="text.secondary">
                    {subscriptionStatus.daysRemaining} days remaining in your
                    free trial
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* No Workspace Alert */}
      {subscriptionStatus && !subscriptionStatus.hasWorkspace && (
        <Alert severity="info" className="">
          <div gutterBottom>
            You need to create or join a workplace to access subscription
            features.
          </div>
          <div className="">
            <Button

              onClick={() => navigate('/dashboard')}
              className=""
            >
              Create Workplace
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Join Workplace
            </Button>
          </div>
        </Alert>
      )}
      {/* Billing Interval Toggle */}
      {subscriptionStatus?.hasWorkspace && (
        <div className="">
          <div className="">
            <Button
              variant={billingInterval === 'monthly' ? 'contained' : 'text'}
              onClick={() => setBillingInterval('monthly')}
              className=""
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === 'yearly' ? 'contained' : 'text'}
              onClick={() => setBillingInterval('yearly')}
              className=""
            >
              Yearly
              <Chip
                label="Save 17%"
                size="sm"
                color="success"
                className=""
              />
            </Button>
          </div>
        </div>
      )}
      {/* Plans Grid */}
      {subscriptionStatus?.hasWorkspace && (
        <div
          className=""
        >
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className=""
            >
              {plan.popularPlan && (
                <div
                  className=""
                >
                  <StarIcon fontSize="small" />
                  <div fontWeight="bold">
                    Most Popular
                  </div>
                </div>
              )}
              <CardContent className="">
                <div component="h2" gutterBottom>
                  {plan.name}
                </div>
                <div

                  color="text.secondary"
                  className=""
                >
                  {plan.description}
                </div>
                <div className="">
                  {plan.isContactSales ? (
                    <div component="div">
                      Custom
                    </div>
                  ) : (
                    <>
                      <div component="div">
                        {formatPrice(plan.priceNGN)}
                      </div>
                      <div color="text.secondary">
                        per{' '}
                        {plan.billingInterval === 'yearly' ? 'year' : 'month'}
                      </div>
                    </>
                  )}
                </div>
                <Separator className="" />
                <List dense>
                  {plan.displayFeatures.slice(0, 6).map((feature, index) => (
                    <div key={index} className="">
                      <div className="">
                        <CheckIcon color="success" fontSize="small" />
                      </div>
                      <div className="font-medium">
                        {feature}
                      </div>
                    </div>
                  ))}
                  {plan.displayFeatures.length > 6 && (
                    <div className="">
                      <div className="">
                        <InfoIcon color="info" fontSize="small" />
                      </div>
                      <div
                        primary={
                          <div

                            className=""
                          >}
                            +{plan.displayFeatures.length - 6} more features
                          </div>
                        }
                      />
                    </div>
                  )}
                </List>
              </CardContent>
              <div className="">
                {plan.isContactSales ? (
                  <Button
                    fullWidth

                    startIcon={<WhatsAppIcon />}
                    onClick={() => handleUpgrade(plan)}
                    className=""
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant={plan.popularPlan ? 'contained' : 'outlined'}
                    startIcon={<UpgradeIcon />}
                    onClick={() => handleUpgrade(plan)}
                    className=""
                  >
                    {subscriptionStatus?.tier === plan.tier
                      ? 'Current Plan'
                      : 'Upgrade'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Upgrade Confirmation Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      >
        <DialogTitle>Confirm Plan Upgrade</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <div>
              <div gutterBottom>
                You are about to upgrade to the{' '}
                <strong>{selectedPlan.name}</strong> plan.
              </div>
              <div color="text.secondary" className="">
                You will be charged {formatPrice(selectedPlan.priceNGN)}{' '}
                {selectedPlan.billingInterval === 'yearly'
                  ? 'annually'
                  : 'monthly'}
                .
              </div>
              <div color="text.secondary">
                Your new features will be available immediately after payment
                confirmation.
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
          <Button

            onClick={() => {
              if (selectedPlan) {
                handleUpgrade(selectedPlan);
                setSelectedPlan(null);
              }
            }
              setUpgradeDialogOpen(false);>
          Proceed to Payment
        </Button>
      </DialogActions>
    </Dialog>
    </div >
  );
};
export default SubscriptionManagement;
