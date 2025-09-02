import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref'); // Paystack also uses this parameter

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentRef = reference || trxref;

      if (!paymentRef) {
        setError('No payment reference found');
        setLoading(false);
        return;
      }

      try {
        // First verify the payment with Paystack (this doesn't require auth)
        const verifyResponse = await fetch(
          `/api/subscriptions/verify-payment?reference=${paymentRef}`
        );
        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
          setError(verifyData.message || 'Payment verification failed');
          setLoading(false);
          return;
        }

        // Then process the subscription activation (this requires auth)
        const activateResponse = await fetch('/api/subscriptions/success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentReference: paymentRef,
          }),
        });

        const activateData = await activateResponse.json();

        if (activateData.success) {
          setSuccess(true);
          setSubscriptionData(activateData.data);
        } else {
          setError(activateData.message || 'Failed to activate subscription');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('An error occurred while processing your payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference, trxref]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewSubscription = () => {
    navigate('/subscription-management');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Processing Your Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your payment and activate your
              subscription...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Payment Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/subscription-management')}
                sx={{ mr: 2 }}
              >
                Try Again
              </Button>
              <Button variant="outlined" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription has been activated successfully. You now have
              access to all premium features.
            </Typography>

            {subscriptionData && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>
                    Subscription Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ReceiptIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Plan"
                        secondary={subscriptionData.planName || 'Premium Plan'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Status" secondary="Active" />
                    </ListItem>
                    {subscriptionData.endDate && (
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Valid Until"
                          secondary={new Date(
                            subscriptionData.endDate
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </>
            )}

            <Box
              sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}
            >
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </Button>
              <Button variant="outlined" onClick={handleViewSubscription}>
                Manage Subscription
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return null;
};

export default SubscriptionSuccess;
