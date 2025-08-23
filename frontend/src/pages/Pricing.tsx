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
  Grid,
  AppBar,
  Toolbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  Stars as StarsIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import Footer from '../components/Footer';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: '1,000',
      description: 'Perfect for individual pharmacists',
      popular: false,
      features: [
        'Up to 50 patients',
        '500 clinical notes',
        '2GB storage',
        'Basic reporting',
        'Email support',
        'HIPAA compliant',
      ],
      notIncluded: [
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
      ],
    },
    {
      name: 'Professional',
      price: '2,000',
      description: 'Ideal for growing practices',
      popular: true,
      features: [
        'Up to 200 patients',
        '2,000 clinical notes',
        '10GB storage',
        'Advanced reporting',
        'Priority email support',
        'HIPAA compliant',
        'Drug interaction alerts',
        'Medication adherence tracking',
      ],
      notIncluded: ['Custom integrations'],
    },
    {
      name: 'Enterprise',
      price: '5,000',
      description: 'For large pharmacy operations',
      popular: false,
      features: [
        'Unlimited patients',
        'Unlimited clinical notes',
        '100GB storage',
        'Advanced analytics',
        'Priority phone & email support',
        'HIPAA compliant',
        'Drug interaction alerts',
        'Medication adherence tracking',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
      ],
      notIncluded: [],
    },
  ];

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

        {/* Pricing Cards */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: plan.popular ? 2 : 1,
                  borderColor: plan.popular ? 'primary.main' : 'grey.200',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: plan.popular ? 'scale(1.05)' : 'scale(1.02)',
                    boxShadow: plan.popular ? 6 : 4,
                  },
                }}
              >
                {plan.popular && (
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
                          sx={{ fontSize: 32, color: 'warning.main', mr: 1 }}
                        />
                      ) : (
                        <BoltIcon
                          sx={{ fontSize: 32, color: 'primary.main', mr: 1 }}
                        />
                      )}
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      {plan.description}
                    </Typography>
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
                        ₦{plan.price}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        /month
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Billed monthly
                    </Typography>
                  </Box>

                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    size="large"
                    fullWidth
                    sx={{
                      mb: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {plan.popular ? 'Start Free Trial' : 'Get Started'}
                  </Button>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      What's included:
                    </Typography>
                    <List disablePadding>
                      {plan.features.map((feature, featureIndex) => (
                        <ListItem
                          key={featureIndex}
                          disablePadding
                          sx={{ py: 0.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon
                              sx={{ fontSize: 20, color: 'success.main' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                      {plan.notIncluded.map((feature, featureIndex) => (
                        <ListItem
                          key={featureIndex}
                          disablePadding
                          sx={{ py: 0.5, opacity: 0.6 }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CloseIcon
                              sx={{ fontSize: 20, color: 'text.disabled' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

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
