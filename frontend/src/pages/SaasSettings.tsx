import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { GridContainer, GridItem } from '../components/common/grid/GridSystem';
import { ConditionalRender as AccessControl } from '../components/AccessControl';
import FeatureFlagDemo from '../components/FeatureFlagDemo';
import FeatureGuard from '../components/FeatureGuard';
import FeatureToggle from '../components/FeatureToggle';
import AdminDashboard from '../components/admin/AdminDashboard';
import FeatureFlagManagement from '../components/admin/FeatureFlagManagement';
import { FixedGridItem as FixedGrid } from '../components/admin/FixedGrid';
import LicenseUpload from '../components/license/LicenseUpload';
import BillingHistory from '../components/subscription/BillingHistory';
import PaymentMethodsManagement from '../components/subscription/PaymentMethodsManagement';
import PlanCards from '../components/subscription/PlanCards';
import SubscriptionAnalytics from '../components/subscription/SubscriptionAnalytics';
import SubscriptionManagement from '../components/subscription/SubscriptionManagement';
import GridExample from '../components/common/grid/GridExample';

const SaasSettings: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Saas Settings
        </Typography>

        <GridContainer spacing={4}>
          <GridItem xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                Roles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <GridContainer spacing={3}>
                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Access Control
                      </Typography>
                      <AccessControl requiredRole="pharmacist">
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'success.light',
                            borderRadius: 1,
                          }}
                        >
                          <Typography>
                            Content visible to pharmacists
                          </Typography>
                        </Box>
                      </AccessControl>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Feature Guards
                      </Typography>
                      <FeatureGuard feature="advanced_analytics">
                        <Box
                          sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}
                        >
                          <Typography>
                            Advanced analytics feature enabled
                          </Typography>
                        </Box>
                      </FeatureGuard>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Feature Toggle
                      </Typography>
                      <FeatureToggle
                        featureKey="team_management"
                        label="Team Management"
                        description="Enable team management features"
                      />
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Feature Flag Demo
                      </Typography>
                      <FeatureFlagDemo
                        featureKey="advanced_reporting"
                        title="Advanced Reporting"
                        description="Access to detailed analytics and reports"
                      />
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>

          <GridItem xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                Admin Roles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <GridContainer spacing={3}>
                <GridItem xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Admin Dashboard Preview
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <AdminDashboard />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Feature Flag Management
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <FeatureFlagManagement />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Fixed Grid
                      </Typography>
                      <FixedGrid />
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>

          <GridItem xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                License Verification
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <GridContainer spacing={3}>
                <GridItem xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        License Upload
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <LicenseUpload />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>

          <GridItem xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                Subscriptions
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <GridContainer spacing={3}>
                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Plan Cards
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <PlanCards
                          plans={[
                            {
                              name: 'Basic',
                              price: '₦5,000',
                              description:
                                'Essential features for small pharmacies',
                              popular: false,
                              features: [
                                '10 patients',
                                '50 SMS/month',
                                'Basic reports',
                              ],
                              notIncluded: ['Team access', 'API integration'],
                            },
                            {
                              name: 'Pro',
                              price: '₦15,000',
                              description:
                                'Advanced features for growing practices',
                              popular: true,
                              features: [
                                '500 patients',
                                '200 SMS/month',
                                'Advanced analytics',
                              ],
                              notIncluded: ['API integration'],
                            },
                          ]}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Billing History
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <BillingHistory />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Payment Methods
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <PaymentMethodsManagement />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Subscription Analytics
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <SubscriptionAnalytics />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>

                <GridItem xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Subscription Management
                      </Typography>
                      <Box sx={{ height: '200px', overflow: 'hidden' }}>
                        <SubscriptionManagement />
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>

          <GridItem xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                Grid System
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <GridContainer spacing={3}>
                <GridItem xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Grid Example
                      </Typography>
                      <GridExample />
                    </CardContent>
                  </Card>
                </GridItem>
              </GridContainer>
            </Paper>
          </GridItem>
        </GridContainer>
      </Box>
    </Container>
  );
};

export default SaasSettings;
