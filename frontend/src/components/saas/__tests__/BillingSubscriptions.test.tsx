import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BillingSubscriptions from '../BillingSubscriptions';
import { useBillingData } from '../../../hooks/useBillingData';

// Mock the custom hook
jest.mock('../../../hooks/useBillingData');

const mockUseBillingData = useBillingData as jest.MockedFunction<typeof useBillingData>;

const theme = createTheme();

const mockAnalytics = {
  totalRevenue: 1250000,
  monthlyRecurringRevenue: 104166,
  annualRecurringRevenue: 1250000,
  churnRate: 3.2,
  averageRevenuePerUser: 5208,
  lifetimeValue: 162750,
  subscriptionsByStatus: {
    active: 18,
    trialing: 5,
    past_due: 2,
    canceled: 1
  },
  revenueByPlan: [
    { planName: 'Basic', revenue: 180000, count: 12 },
    { planName: 'Pro', revenue: 450000, count: 9 },
    { planName: 'Enterprise', revenue: 620000, count: 5 }
  ]
};

const mockInvoices = [
  {
    _id: '1',
    invoiceNumber: 'INV-2024-001',
    status: 'paid',
    total: 15000,
    currency: 'NGN',
    dueDate: '2024-01-15',
    paidAt: '2024-01-14',
    customerName: 'Sunrise Pharmacy',
    customerEmail: 'admin@sunrisepharmacy.com'
  },
  {
    _id: '2',
    invoiceNumber: 'INV-2024-002',
    status: 'pending',
    total: 25000,
    currency: 'NGN',
    dueDate: '2024-02-15',
    customerName: 'City Medical Center',
    customerEmail: 'billing@citymedical.com'
  }
];

const mockSubscriptions = [
  {
    _id: '1',
    status: 'active',
    planName: 'Pro Plan',
    unitAmount: 25000,
    currency: 'NGN',
    currentPeriodStart: '2024-01-01',
    currentPeriodEnd: '2024-02-01',
    billingInterval: 'monthly',
    customerName: 'Sunrise Pharmacy',
    customerEmail: 'admin@sunrisepharmacy.com'
  },
  {
    _id: '2',
    status: 'trialing',
    planName: 'Enterprise Plan',
    unitAmount: 50000,
    currency: 'NGN',
    currentPeriodStart: '2024-01-15',
    currentPeriodEnd: '2024-01-29',
    billingInterval: 'monthly',
    customerName: 'City Medical Center',
    customerEmail: 'billing@citymedical.com'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('BillingSubscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseBillingData.mockReturnValue({
      analytics: null,
      invoices: null,
      subscriptions: null,
      loading: true,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseBillingData.mockReturnValue({
      analytics: null,
      invoices: null,
      subscriptions: null,
      loading: false,
      error: 'Failed to fetch data',
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });

  it('should render billing dashboard with analytics', () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Check header
    expect(screen.getByText('Billing & Subscriptions')).toBeInTheDocument();

    // Check analytics cards
    expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument();
    expect(screen.getByText('Annual Recurring Revenue')).toBeInTheDocument();
    expect(screen.getByText('Average Revenue Per User')).toBeInTheDocument();
    expect(screen.getByText('Churn Rate')).toBeInTheDocument();

    // Check formatted values
    expect(screen.getByText('₦104,166.00')).toBeInTheDocument(); // MRR
    expect(screen.getByText('₦1,250,000.00')).toBeInTheDocument(); // ARR
    expect(screen.getByText('3.2%')).toBeInTheDocument(); // Churn rate
  });

  it('should switch between tabs', async () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Initially on Revenue Overview tab
    expect(screen.getByText('Subscription Status Distribution')).toBeInTheDocument();

    // Click on Invoices tab
    fireEvent.click(screen.getByText('Invoices'));
    expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();

    // Click on Subscriptions tab
    fireEvent.click(screen.getByText('Subscriptions'));
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();

    // Click on Payment Methods tab
    fireEvent.click(screen.getByText('Payment Methods'));
    expect(screen.getByText('Payment method management will be available in the next update.')).toBeInTheDocument();
  });

  it('should display invoices correctly', () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Switch to invoices tab
    fireEvent.click(screen.getByText('Invoices'));

    // Check invoice data
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('City Medical Center')).toBeInTheDocument();
    expect(screen.getByText('₦15,000.00')).toBeInTheDocument();
    expect(screen.getByText('₦25,000.00')).toBeInTheDocument();

    // Check status chips
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should display subscriptions correctly', () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Switch to subscriptions tab
    fireEvent.click(screen.getByText('Subscriptions'));

    // Check subscription data
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Plan')).toBeInTheDocument();
    expect(screen.getByText('₦25,000.00')).toBeInTheDocument();
    expect(screen.getByText('₦50,000.00')).toBeInTheDocument();

    // Check billing intervals
    expect(screen.getAllByText('/monthly')).toHaveLength(2);

    // Check status chips
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('trialing')).toBeInTheDocument();
  });

  it('should handle refresh data', async () => {
    const mockRefreshData = jest.fn();
    
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: mockRefreshData,
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Find and click refresh button
    const refreshButton = screen.getByLabelText('Refresh Data');
    fireEvent.click(refreshButton);

    expect(mockRefreshData).toHaveBeenCalledTimes(1);
  });

  it('should open refund dialog for paid invoices', async () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Switch to invoices tab
    fireEvent.click(screen.getByText('Invoices'));

    // Find refund button for paid invoice (should be available for INV-2024-001)
    const refundButtons = screen.getAllByLabelText('Process Refund');
    expect(refundButtons).toHaveLength(1); // Only for paid invoices

    fireEvent.click(refundButtons[0]);

    // Check if refund dialog opens
    await waitFor(() => {
      expect(screen.getByText('Process Refund')).toBeInTheDocument();
      expect(screen.getByText('Invoice: INV-2024-001')).toBeInTheDocument();
    });
  });

  it('should process refund', async () => {
    const mockProcessRefund = jest.fn().mockResolvedValue(undefined);
    
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: mockProcessRefund
    });

    renderWithTheme(<BillingSubscriptions />);

    // Switch to invoices tab and open refund dialog
    fireEvent.click(screen.getByText('Invoices'));
    const refundButtons = screen.getAllByLabelText('Process Refund');
    fireEvent.click(refundButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Process Refund')).toBeInTheDocument();
    });

    // Fill in refund details
    const amountInput = screen.getByLabelText('Refund Amount (optional)');
    const reasonInput = screen.getByLabelText('Reason');
    
    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.change(reasonInput, { target: { value: 'Customer request' } });

    // Click process refund button
    const processButton = screen.getByRole('button', { name: 'Process Refund' });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(mockProcessRefund).toHaveBeenCalledWith('INV-2024-001', 5000, 'Customer request');
    });
  });

  it('should display revenue by plan correctly', () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Should be on Revenue Overview tab by default
    expect(screen.getByText('Revenue by Plan')).toBeInTheDocument();
    
    // Check plan data
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    
    // Check subscriber counts
    expect(screen.getByText('12 subscribers')).toBeInTheDocument();
    expect(screen.getByText('9 subscribers')).toBeInTheDocument();
    expect(screen.getByText('5 subscribers')).toBeInTheDocument();
  });

  it('should display subscription status distribution', () => {
    mockUseBillingData.mockReturnValue({
      analytics: mockAnalytics,
      invoices: mockInvoices,
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      refreshData: jest.fn(),
      processRefund: jest.fn()
    });

    renderWithTheme(<BillingSubscriptions />);

    // Should be on Revenue Overview tab by default
    expect(screen.getByText('Subscription Status Distribution')).toBeInTheDocument();
    
    // Check status counts
    expect(screen.getByText('18 subscriptions')).toBeInTheDocument(); // active
    expect(screen.getByText('5 subscriptions')).toBeInTheDocument(); // trialing
    expect(screen.getByText('2 subscriptions')).toBeInTheDocument(); // past_due
    expect(screen.getByText('1 subscriptions')).toBeInTheDocument(); // canceled
  });
});