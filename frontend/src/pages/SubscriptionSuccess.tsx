import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { subscriptionService } from '../services/subscriptionService';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get('reference');

  useEffect(() => {
    const handleSuccessfulPayment = async () => {
      if (!reference) {
        setError('No payment reference found');
        setProcessing(false);
        return;
      }

      try {
        // In development mode with simulated payments, directly mark as successful
        if (reference.startsWith('test_')) {
          console.log('🧪 Processing simulated payment success');
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setProcessing(false);
          return;
        }

        // In production, process the real payment
        const response = await subscriptionService.handleSuccessfulPayment(
          reference
        );

        if (response.success) {
          console.log('✅ Subscription activated successfully');
        } else {
          setError(response.message || 'Failed to activate subscription');
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        console.error('❌ Error processing payment:', error);
        setError(errorMessage);
      } finally {
        setProcessing(false);
      }
    };

    handleSuccessfulPayment();
  }, [reference]);

  if (processing) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Processing Your Subscription
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we activate your subscription...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">Subscription Activation Failed</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/subscription-management')}
              sx={{ mr: 2 }}
            >
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => navigate('/contact')}>
              Contact Support
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 3 }} />

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          color="success.main"
        >
          Subscription Activated!
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Welcome to PharmaCare
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Your subscription has been successfully activated. You now have access
          to all the features in your selected plan.
        </Typography>

        {reference && (
          <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Payment Reference: {reference}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/subscription-management')}
          >
            Manage Subscription
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubscriptionSuccess;
