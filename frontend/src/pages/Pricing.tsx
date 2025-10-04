import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  AppBar,
  Toolbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';
import StarsIcon from '@mui/icons-material/Stars';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  useAvailablePlansQuery,
  useCreateCheckoutSessionMutation,
} from '../queries/useSubscription';

const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const {
    data: plans,
    isLoading,
    error,
  } = useAvailablePlansQuery(billingInterval);
  const createCheckoutSession = useCreateCheckoutSessionMutation();

  const handleSubscribe = (planId: string) => {
    createCheckoutSession.mutate({ planId, billingInterval });
  };

  const handleContactSales = (whatsappNumber?: string) => {
    if (whatsappNumber) {
      const message = encodeURIComponent(
        "Hello, I'm interested in the Enterprise plan. Please provide more information."
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    }
  };

  const handleBillingIntervalChange = (
    _event: React.MouseEvent<HTMLElement>,
    newInterval: 'monthly' | 'yearly'
  ) => {
    if (newInterval !== null) {
      setBillingInterval(newInterval);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                P
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              PharmaCare
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button component={Link} to="/" color="inherit">
              Home
            </Button>
            <Button component={Link} to="/about" color="inherit">
              About
            </Button>
            <Button component={Link} to="/contact" color="inherit">
              Contact
            </Button>
            <Button component={Link} to="/pricing" color="inherit">
              Pricing
            </Button>
            <ThemeToggle size="sm" variant="button" />
            <Button component={Link} to="/login" color="inherit">
              Sign In
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              sx={{ borderRadius: 3 }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: 'text.primary',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Choose the perfect plan for your pharmacy practice. Upgrade or
            downgrade at any time.
          </Typography>
          <Chip
            label="🎉 30-day free trial on all plans"
            sx={{
              bgcolor: 'success.light',
              color: 'success.dark',
              fontWeight: 600,
              py: 2,
              px: 1,
              height: 'auto',
            }}
          />
        </Box>

        {/* Billing Interval Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <ToggleButtonGroup
            value={billingInterval}
            exclusive
            onChange={handleBillingIntervalChange}
            aria-label="billing interval"
          >
            <ToggleButton value="monthly" aria-label="monthly billing">
              Monthly
            </ToggleButton>
            <ToggleButton value="yearly" aria-label="yearly billing">
              Yearly (Save 25%)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Pricing Cards */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error">
            Error fetching pricing plans. Please try again later.
          </Alert>
        )}
        {!isLoading && !error && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'center',
            }}
          >
            {(plans || []).map((plan, index) => (
            <Box
              key={plan._id || index}
              sx={{ flex: '1 1 300px', maxWidth: '400px' }}
            >
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: plan.metadata?.mostPopular ? 2 : 1,
                  borderColor: plan.metadata?.mostPopular
                    ? 'primary.main'
                    : 'grey.200',
                  transform: plan.metadata?.mostPopular
                    ? 'scale(1.05)'
                    : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: plan.metadata?.mostPopular
                      ? 'scale(1.05)'
                      : 'scale(1.02)',
                    boxShadow: plan.metadata?.mostPopular ? 6 : 4,
                  },
                }}
              >
                {plan.metadata?.mostPopular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 3,
                      py: 0.5,
                      borderRadius: '0 0 12px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <StarIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Most Popular
                    </Typography>
                  </Box>
                )}

                <CardContent
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {plan.name === 'Enterprise' ? (
                        <StarsIcon
                          sx={{
                            fontSize: 32,
                            color: 'warning.main',
                            mr: 1,
                          }}
                        />
                      ) : (
                        <BoltIcon
                          sx={{
                            fontSize: 32,
                            color: 'primary.main',
                            mr: 1,
                          }}
                        />
                      )}
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {plan.name || 'Plan'}
                      </Typography>
                    </Box>
                    {plan.isContactSales ? (
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, color: 'primary.main' }}
                      >
                        Contact Sales
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          ₦{(plan.priceNGN || 0).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          /{billingInterval === 'monthly' ? 'month' : 'year'}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Billed {billingInterval}
                    </Typography>
                  </Box>

                  {plan.isContactSales ? (
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        mb: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      onClick={() => handleContactSales(plan.whatsappNumber || '')}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      variant={
                        plan.metadata?.mostPopular ? 'contained' : 'outlined'
                      }
                      size="large"
                      fullWidth
                      sx={{
                        mb: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      onClick={() => handleSubscribe(plan._id || '')}
                      disabled={createCheckoutSession.isPending}
                    >
                      {createCheckoutSession.isPending
                        ? 'Processing...'
                        : plan.metadata?.mostPopular
                        ? 'Start Free Trial'
                        : 'Get Started'}
                    </Button>
                  )}

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      What's included:
                    </Typography>
                    <List disablePadding>
                      {(plan.displayedFeatures || []).map(
                        (feature: string, featureIndex: number) => (
                          <ListItem
                            key={featureIndex}
                            disablePadding
                            sx={{ py: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckIcon
                                sx={{
                                  fontSize: 20,
                                  color: 'success.main',
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
          </Box>
        )}

        {/* FAQ Section */}
        <Box sx={{ mt: 12 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 600, mb: 6, textAlign: 'center' }}
          >
            Frequently Asked Questions
          </Typography>
          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Can I change my plan later?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Yes! You can upgrade or downgrade your plan at any time from
                  your account settings. Changes take effect immediately, and
                  you'll be charged or refunded the prorated amount based on
                  your billing cycle. There are no penalties for changing plans.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  What happens during the free trial?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You get full access to all features for 30 days with no
                  restrictions. No credit card is required to start your trial.
                  After the trial period ends, you can choose to continue with a
                  paid plan or your account will be paused until you subscribe.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Is my data secure and HIPAA compliant?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Absolutely! All plans include enterprise-grade security with
                  end-to-end encryption, secure data centers, and full HIPAA
                  compliance. We undergo regular security audits and maintain
                  SOC 2 Type II certification to ensure your patient data is
                  always protected.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Do you offer discounts for annual plans?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Yes! Save 20% when you choose annual billing instead of
                  monthly. We also offer volume discounts for Enterprise plans
                  with multiple users. Contact our sales team to discuss custom
                  pricing for larger organizations.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  What payment methods do you accept?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  We accept all major Nigerian payment methods including bank
                  transfers, debit cards, and mobile money platforms like
                  Paystack and Flutterwave. International payments are also
                  supported through Visa and Mastercard.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Can I cancel my subscription anytime?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Yes, you can cancel your subscription at any time with no
                  cancellation fees or long-term contracts. Your access will
                  continue until the end of your current billing period, and you
                  can export your data before cancellation.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 12,
            textAlign: 'center',
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Ready to Transform Your Practice?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Join thousands of pharmacists already using PharmaCare to improve
            patient outcomes and streamline their workflow.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
            }}
          >
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{ py: 1.5, px: 4, borderRadius: 3 }}
            >
              Start Free Trial
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              size="large"
              sx={{ py: 1.5, px: 4, borderRadius: 3 }}
            >
              Contact Sales
            </Button>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Pricing;
