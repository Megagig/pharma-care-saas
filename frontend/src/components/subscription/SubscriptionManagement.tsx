import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../stores';
import { useSubscriptionStatus } from '../../hooks/useRBAC';
import LoadingSpinner from '../LoadingSpinner';

interface SubscriptionPlan {
  _id: string;
  name: string;
  priceNGN: number;
  billingInterval: string;
  tier: string;
  features: any;
  description: string;
  isActive: boolean;
}

interface Feature {
  key: string;
  name: string;
  description: string;
  metadata: {
    category: string;
    priority: string;
    tags: string[];
  };
}

interface CurrentSubscription {
  _id: string;
  planId: any;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
  canRenew: boolean;
}

const SubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { user } = useAuth();
  const addNotification = useUIStore(state => state.addNotification);
  const subscriptionStatus = useSubscriptionStatus();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/subscription-management/plans', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }),
        fetch('/api/subscription-management/current', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
      ]);
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data);
      }
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setCurrentSubscription(subscriptionData.data.subscription);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription data',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/subscription-management/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          planId: plan._id,
          billingInterval
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.data.sessionUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upgrade Failed',
        message: 'Failed to start upgrade process',
        duration: 5000
      });
    } finally {
      setProcessing(false);
      setUpgradeDialogOpen(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/subscription-management/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          reason: 'User requested cancellation'
        })
      });
      
      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. You will retain access until the end of your billing period.',
          duration: 5000
        });
        loadData();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: 'Failed to cancel subscription',
        duration: 5000
      });
    } finally {
      setProcessing(false);
      setCancelDialogOpen(false);
    }
  };

  const formatPrice = (price: number, interval: string) => {
    const yearlyPrice = interval === 'yearly' ? price * 10 : price * 12; // 2 months free for yearly
    const displayPrice = interval === 'yearly' ? yearlyPrice : price;
    return `₦${displayPrice.toLocaleString()}/${interval === 'yearly' ? 'year' : 'month'}`;
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = plan.features;
    return [
      { 
        name: 'Patients', 
        value: features.patientLimit || 'Unlimited',
        included: true
      },
      { 
        name: 'SMS Reminders', 
        value: features.reminderSmsMonthlyLimit || 'Unlimited',
        included: true
      },
      { 
        name: 'Reports Export', 
        value: features.reportsExport ? 'Yes' : 'No',
        included: features.reportsExport
      },
      { 
        name: 'Clinical Notes Export', 
        value: features.careNoteExport ? 'Yes' : 'No',
        included: features.careNoteExport
      },
      { 
        name: 'ADR Module', 
        value: features.adrModule ? 'Yes' : 'No',
        included: features.adrModule
      },
      { 
        name: 'Multi-User Support', 
        value: features.multiUserSupport ? 'Yes' : 'No',
        included: features.multiUserSupport
      },
      { 
        name: 'Team Size', 
        value: features.teamSize || '1',
        included: true
      },
      { 
        name: 'API Access', 
        value: features.apiAccess ? 'Yes' : 'No',
        included: features.apiAccess
      },
      { 
        name: 'Audit Logs', 
        value: features.auditLogs ? 'Yes' : 'No',
        included: features.auditLogs
      },
      { 
        name: 'Data Backup', 
        value: features.dataBackup ? 'Yes' : 'No',
        included: features.dataBackup
      }
    ];
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription?.tier === plan.tier;
  };

  const canUpgrade = (plan: SubscriptionPlan) => {
    const tierOrder = ['free_trial', 'basic', 'pro', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(subscriptionStatus.tier);
    const planTierIndex = tierOrder.indexOf(plan.tier);
    return planTierIndex > currentTierIndex;
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription plans..." />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>
      
      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Current Plan: {currentSubscription.planId?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: 
                  <Chip 
                    label={currentSubscription.status.toUpperCase()}
                    color={subscriptionStatus.isActive ? 'success' : 'warning'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {subscriptionStatus.isActive 
                    ? `Active until ${new Date(currentSubscription.endDate).toLocaleDateString()}`
                    : 'Subscription expired'
                  }
                </Typography>
                {subscriptionStatus.daysRemaining <= 7 && subscriptionStatus.daysRemaining > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Your subscription expires in {subscriptionStatus.daysRemaining} days.
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  {subscriptionStatus.isActive && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Billing Toggle */}
      <Box display="flex" justifyContent="center" mb={4}>
        <FormControlLabel
          control={
            <Switch
              checked={billingInterval === 'yearly'}
              onChange={(e) => setBillingInterval(e.target.checked ? 'yearly' : 'monthly')}
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>Annual Billing</Typography>
              <Chip label="Save 17%" color="success" size="small" />
            </Box>
          }
        />
      </Box>

      {/* Subscription Plans */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {plans.map((plan) => {
          const isPro = plan.tier === 'pro';
          const isCurrent = isCurrentPlan(plan);
          const canUpgradeToPlan = canUpgrade(plan);
          
          return (
            <Grid item xs={12} md={6} lg={3} key={plan._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isPro ? 2 : 1,
                  borderColor: isPro ? 'primary.main' : 'divider'
                }}
              >
                {isPro && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    MOST POPULAR
                  </Box>
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h5" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {formatPrice(plan.priceNGN, billingInterval)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </Box>
                  
                  <List dense>
                    {getPlanFeatures(plan).map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {feature.included ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <CloseIcon color="disabled" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.name}
                          secondary={feature.value}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                
                <Box p={2} pt={0}>
                  {isCurrent ? (
                    <Button fullWidth variant="outlined" disabled>
                      Current Plan
                    </Button>
                  ) : canUpgradeToPlan ? (
                    <Button 
                      fullWidth 
                      variant={isPro ? 'contained' : 'outlined'}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setUpgradeDialogOpen(true);
                      }}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button fullWidth variant="outlined" disabled>
                      Downgrade Not Available
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Feature Comparison Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Feature Comparison
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Feature</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan._id} align="center">
                      {plan.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  'Patient Records',
                  'SMS Reminders',
                  'Basic Reports',
                  'Advanced Analytics',
                  'Team Management',
                  'API Access',
                  'Priority Support'
                ].map((feature) => (
                  <TableRow key={feature}>
                    <TableCell>{feature}</TableCell>
                    {plans.map((plan) => {
                      const hasFeature = (() => {
                        switch (feature) {
                          case 'Patient Records': return true;
                          case 'SMS Reminders': return true;
                          case 'Basic Reports': return plan.features.reportsExport;
                          case 'Advanced Analytics': return plan.tier === 'pro' || plan.tier === 'enterprise';
                          case 'Team Management': return plan.features.multiUserSupport;
                          case 'API Access': return plan.features.apiAccess;
                          case 'Priority Support': return plan.tier === 'enterprise';
                          default: return false;
                        }
                      })();
                      
                      return (
                        <TableCell key={plan._id} align="center">
                          {hasFeature ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloseIcon color="disabled" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Plan Upgrade</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to upgrade to the <strong>{selectedPlan.name}</strong> plan.
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Price:</strong> {formatPrice(selectedPlan.priceNGN, billingInterval)}
                </Typography>
                <Typography variant="body2">
                  <strong>Billing:</strong> {billingInterval === 'yearly' ? 'Annual' : 'Monthly'}
                </Typography>
              </Alert>
              
              {billingInterval === 'yearly' && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  You'll save ₦{(selectedPlan.priceNGN * 2).toLocaleString()} with annual billing!
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedPlan && handleUpgrade(selectedPlan)}
            variant="contained"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel your subscription?
          </Typography>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You will retain access to your current plan until {currentSubscription && new Date(currentSubscription.endDate).toLocaleDateString()}.
              After that, your account will be downgraded to the free trial.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
          <Button 
            onClick={handleCancelSubscription}
            variant="contained"
            color="error"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;