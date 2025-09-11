import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography, Container } from '@mui/material';
import SubscriptionManagement from '../components/subscription/SubscriptionManagement';
import BillingHistory from '../components/subscription/BillingHistory';
import PaymentMethodsManagement from '../components/subscription/PaymentMethodsManagement';
import SubscriptionAnalytics from '../components/subscription/SubscriptionAnalytics';
import FeatureGuard from '../components/FeatureGuard';
import ErrorBoundary from '../components/ErrorBoundary';

interface TabPanelProps {
   children?: React.ReactNode;
   index: number;
   value: number;
}

const TabPanel = (props: TabPanelProps) => {
   const { children, value, index, ...other } = props;

   return (
      <div
         role="tabpanel"
         hidden={value !== index}
         id={`subscription-tabpanel-${index}`}
         aria-labelledby={`subscription-tab-${index}`}
         {...other}
      >
         {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
   );
};

const Subscriptions: React.FC = () => {
   const [tabValue, setTabValue] = useState(0);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
   };

   return (
      <Container maxWidth="xl">
         <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
               Subscription Management
            </Typography>

            <Paper sx={{ width: '100%', mb: 4 }}>
               <Tabs
                  value={tabValue}
                  onChange={handleChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                  aria-label="subscription tabs"
               >
                  <Tab label="Plans" />
                  <Tab label="Billing History" />
                  <Tab label="Payment Methods" />
                  <Tab label="Analytics" />
               </Tabs>
            </Paper>

            <ErrorBoundary>
               <TabPanel value={tabValue} index={0}>
                  <SubscriptionManagement />
               </TabPanel>

               <TabPanel value={tabValue} index={1}>
                  <BillingHistory />
               </TabPanel>

               <TabPanel value={tabValue} index={2}>
                  <PaymentMethodsManagement />
               </TabPanel>

               <TabPanel value={tabValue} index={3}>
                  <FeatureGuard feature="advanced_analytics">
                     <SubscriptionAnalytics />
                  </FeatureGuard>
               </TabPanel>
            </ErrorBoundary>
         </Box>
      </Container>
   );
};

export default Subscriptions;
