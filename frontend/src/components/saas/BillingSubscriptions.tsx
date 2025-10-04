import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useBillingData } from '../../hooks/useBillingData';

interface BillingAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  subscriptionsByStatus: Record<string, number>;
  revenueByPlan: Array<{ planName: string; revenue: number; count: number }>;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  customerName: string;
  customerEmail: string;
}

interface Subscription {
  _id: string;
  status: string;
  planName: string;
  unitAmount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingInterval: string;
  customerName: string;
  customerEmail: string;
}

interface RefundDialogProps {
  open: boolean;
  onClose: () => void;
  onRefund: (paymentReference: string, amount?: number, reason?: string) => void;
  invoice?: Invoice;
}

const RefundDialog: React.FC<RefundDialogProps> = ({ open, onClose, onRefund, invoice }) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    if (!invoice) return;
    
    setLoading(true);
    try {
      await onRefund(
        invoice.invoiceNumber, // Using invoice number as reference for now
        amount ? parseFloat(amount) : undefined,
        reason
      );
      onClose();
    } catch (error) {
      console.error('Refund failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Process Refund</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Invoice: {invoice?.invoiceNumber}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Original Amount: {invoice?.currency} {invoice?.total?.toLocaleString()}
          </Typography>
          
          <TextField
            fullWidth
            label="Refund Amount (optional)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helperText="Leave empty for full refund"
            sx={{ mt: 2, mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for refund..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleRefund} 
          variant="contained" 
          color="error"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Process Refund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BillingSubscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  
  const {
    analytics,
    invoices,
    subscriptions,
    loading,
    error,
    refreshData,
    processRefund
  } = useBillingData();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefundClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRefundDialogOpen(true);
  };

  const handleRefund = async (paymentReference: string, amount?: number, reason?: string) => {
    await processRefund(paymentReference, amount, reason);
    await refreshData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'active':
        return 'success';
      case 'pending':
      case 'trialing':
        return 'warning';
      case 'failed':
      case 'canceled':
      case 'past_due':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Billing & Subscriptions
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ ml: 1 }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MonetizationOnIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Monthly Recurring Revenue
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.monthlyRecurringRevenue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Annual Recurring Revenue
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.annualRecurringRevenue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Average Revenue Per User
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.averageRevenuePerUser)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AssessmentIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Churn Rate
                    </Typography>
                    <Typography variant="h5">
                      {analytics.churnRate.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Revenue Overview" />
          <Tab label="Invoices" />
          <Tab label="Subscriptions" />
          <Tab label="Payment Methods" />
        </Tabs>

        <CardContent>
          {/* Revenue Overview Tab */}
          {activeTab === 0 && analytics && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Subscription Status Distribution
                  </Typography>
                  <Box>
                    {Object.entries(analytics.subscriptionsByStatus).map(([status, count]) => (
                      <Box key={status} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={status} 
                            color={getStatusColor(status) as any}
                            size="small" 
                            sx={{ mr: 2, minWidth: 80 }}
                          />
                          <Typography>{count} subscriptions</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Revenue by Plan
                  </Typography>
                  <Box>
                    {analytics.revenueByPlan.map((plan) => (
                      <Box key={plan.planName} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <Typography>{plan.planName}</Typography>
                        <Box textAlign="right">
                          <Typography variant="body2" color="textSecondary">
                            {plan.count} subscribers
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatCurrency(plan.revenue)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Invoices Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Invoices
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices?.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{invoice.customerName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {invoice.customerEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={invoice.status} 
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <Tooltip title="View Invoice">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {invoice.status === 'paid' && (
                            <Tooltip title="Process Refund">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRefundClick(invoice)}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Active Subscriptions
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Current Period</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subscriptions?.map((subscription) => (
                      <TableRow key={subscription._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{subscription.customerName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {subscription.customerEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{subscription.planName}</TableCell>
                        <TableCell>
                          {formatCurrency(subscription.unitAmount, subscription.currency)}
                          <Typography variant="caption" display="block" color="textSecondary">
                            /{subscription.billingInterval}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={subscription.status} 
                            color={getStatusColor(subscription.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Payment Methods
              </Typography>
              <Alert severity="info">
                Payment method management will be available in the next update.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        onRefund={handleRefund}
        invoice={selectedInvoice}
      />
    </Box>
  );
};

export default BillingSubscriptions;