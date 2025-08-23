import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';

const Subscriptions = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Subscriptions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your subscription plan and billing information
          </Typography>
        </Box>
      </Box>

      <Card sx={{ textAlign: 'center', py: 8 }}>
        <CardContent>
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'warning.light',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CreditCardIcon sx={{ fontSize: 40, color: 'warning.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Subscription Management Coming Soon
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Plan management, billing history, payment methods, and subscription
            upgrade/downgrade features are in development.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="contained" component={Link} to="/dashboard">
              Back to Dashboard
            </Button>
            <Button variant="outlined" component={Link} to="/pricing">
              View Pricing
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Subscriptions;
