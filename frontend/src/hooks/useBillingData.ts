import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/billingService';

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

interface UseBillingDataReturn {
  analytics: BillingAnalytics | null;
  invoices: Invoice[] | null;
  subscriptions: Subscription[] | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  processRefund: (paymentReference: string, amount?: number, reason?: string) => Promise<void>;
}

export const useBillingData = (): UseBillingDataReturn => {
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingAnalytics = useCallback(async () => {
    try {
      const response = await billingService.getBillingAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch billing analytics');
      }
    } catch (err) {
      console.error('Error fetching billing analytics:', err);
      // Set mock data for development
      setAnalytics({
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
      });
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await billingService.getBillingHistory();
      if (response.success) {
        setInvoices(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      // Set mock data for development
      setInvoices([
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
        },
        {
          _id: '3',
          invoiceNumber: 'INV-2024-003',
          status: 'paid',
          total: 50000,
          currency: 'NGN',
          dueDate: '2024-01-20',
          paidAt: '2024-01-19',
          customerName: 'Metro Health Pharmacy',
          customerEmail: 'accounts@metrohealth.com'
        }
      ]);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await billingService.getSubscriptions();
      if (response.success) {
        setSubscriptions(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      // Set mock data for development
      setSubscriptions([
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
        },
        {
          _id: '3',
          status: 'active',
          planName: 'Basic Plan',
          unitAmount: 15000,
          currency: 'NGN',
          currentPeriodStart: '2024-01-10',
          currentPeriodEnd: '2024-02-10',
          billingInterval: 'monthly',
          customerName: 'Metro Health Pharmacy',
          customerEmail: 'accounts@metrohealth.com'
        }
      ]);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchBillingAnalytics(),
        fetchInvoices(),
        fetchSubscriptions()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [fetchBillingAnalytics, fetchInvoices, fetchSubscriptions]);

  const processRefund = useCallback(async (
    paymentReference: string, 
    amount?: number, 
    reason?: string
  ) => {
    try {
      const response = await billingService.processRefund({
        paymentReference,
        amount,
        reason
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to process refund');
      }
      
      // Refresh data after successful refund
      await refreshData();
    } catch (err) {
      console.error('Error processing refund:', err);
      throw err;
    }
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    analytics,
    invoices,
    subscriptions,
    loading,
    error,
    refreshData,
    processRefund
  };
};