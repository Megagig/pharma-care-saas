import api from './api';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
  priceNGN: number;
  priceUSD: number;
  billingInterval: 'monthly' | 'yearly';
  isContactSales?: boolean;
  whatsappNumber?: string;
  features: {
    patientLimit: number | null;
    reminderSmsMonthlyLimit: number | null;
    reportsExport: boolean;
    careNoteExport: boolean;
    adrModule: boolean;
    multiUserSupport: boolean;
    teamSize: number | null;
    apiAccess: boolean;
    customIntegrations: boolean;
    prioritySupport: boolean;
    // New features for Pharmily and Network plans
    adrReporting: boolean;
    drugInteractionChecker: boolean;
    doseCalculator: boolean;
    multiLocationDashboard: boolean;
    sharedPatientRecords: boolean;
    groupAnalytics: boolean;
    cdss: boolean;
  };
  isActive: boolean;
  stripePriceId?: string;
  description: string;
  popularPlan: boolean;
}

export interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  status:
  | 'active'
  | 'inactive'
  | 'cancelled'
  | 'expired'
  | 'trial'
  | 'grace_period'
  | 'suspended';
  tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
  startDate: string;
  endDate: string;
  priceAtPurchase: number;
  autoRenew: boolean;
  trialEnd?: string;
  gracePeriodEnd?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  features: string[];
  customFeatures: string[];
  usageMetrics: {
    feature: string;
    count: number;
    lastUpdated: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
  planId: string;
  priceId: string;
}

export const subscriptionService = {
  // Get available plans
  async getPlans(billingInterval: 'monthly' | 'yearly' = 'monthly') {
    const response = await api.get('/subscription/plans', {
      params: { billingInterval },
    });
    return response.data;
  },

  // Get current user's subscription
  async getCurrentSubscription() {
    const response = await api.get('/subscription/current');
    return response.data;
  },

  // Create checkout session with Paystack
  async createCheckoutSession(
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) {
    try {
      const callbackUrl = `${window.location.origin}/subscription/success`;
      console.log('Creating checkout session with:', {
        planId,
        billingInterval,
        callbackUrl,
      });

      const response = await api.post('/subscription/checkout', {
        planId,
        billingInterval,
        callbackUrl,
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error creating checkout session:', {
        message: (error as Error).message,
        responseData: (error as { response?: { data?: unknown; status?: number } }).response?.data,
        status: (error as { response?: { data?: unknown; status?: number } }).response?.status,
      });

      return {
        success: false,
        message:
          error.response?.data?.message || 'Failed to create checkout session',
        error: error.message,
      };
    }
  },

  // Verify payment after Paystack redirect
  async verifyPayment(paymentReference: string) {
    try {
      const response = await api.get(
        `/subscription/verify?reference=${paymentReference}`
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to verify payment',
      };
    }
  },

  // Handle successful payment (for both simulation and real payments)
  async handleSuccessfulPayment(paymentReference: string) {
    const response = await api.post('/subscription/payment-success', {
      paymentReference,
    });
    return response.data;
  },

  // Cancel subscription
  async cancelSubscription(reason?: string) {
    const response = await api.post('/subscription/cancel', {
      reason,
    });
    return response.data;
  },

  // Reactivate subscription
  async reactivateSubscription() {
    const response = await api.post('/subscription/reactivate');
    return response.data;
  },

  // Update subscription
  async updateSubscription(
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) {
    const response = await api.put('/subscription/update', {
      planId,
      billingInterval,
    });
    return response.data;
  },

  // Get billing history
  async getBillingHistory() {
    const response = await api.get('/subscription/billing-history');
    return response.data;
  },

  // Download invoice
  async downloadInvoice(invoiceId: string) {
    const response = await api.get(`/subscription/invoice/${invoiceId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get usage metrics
  async getUsageMetrics() {
    const response = await api.get('/subscription/usage');
    return response.data;
  },

  // Check feature access
  async checkFeatureAccess(featureKey: string) {
    const response = await api.get(
      `/subscription/features/${featureKey}/check`
    );
    return response.data;
  },

  // Get subscription status
  async getSubscriptionStatus() {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  // Update payment method
  async updatePaymentMethod() {
    const response = await api.post('/subscription/payment-method/update');
    return response.data;
  },

  // Get upcoming invoice
  async getUpcomingInvoice() {
    const response = await api.get('/subscription/upcoming-invoice');
    return response.data;
  },

  // Apply coupon
  async applyCoupon(couponCode: string) {
    const response = await api.post('/subscription/coupon/apply', {
      couponCode,
    });
    return response.data;
  },

  // Remove coupon
  async removeCoupon() {
    const response = await api.post('/subscription/coupon/remove');
    return response.data;
  },

  // Get plan comparison
  async getPlanComparison() {
    const response = await api.get('/subscription/plans/compare');
    return response.data;
  },

  // Request custom plan
  async requestCustomPlan(requirements: {
    userCount: number;
    features: string[];
    businessSize: string;
    industry: string;
    contactInfo: {
      name: string;
      email: string;
      phone: string;
      company: string;
    };
    additionalRequirements?: string;
  }) {
    const response = await api.post(
      '/subscription/custom-plan/request',
      requirements
    );
    return response.data;
  },

  // Get feature usage analytics
  async getFeatureUsageAnalytics(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    const response = await api.get(
      `/subscription/analytics/usage?period=${period}`
    );
    return response.data;
  },

  // Extend trial
  async extendTrial(days: number, reason: string) {
    const response = await api.post('/subscription/trial/extend', {
      days,
      reason,
    });
    return response.data;
  },

  // Convert trial to paid
  async convertTrialToPaid(
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) {
    const response = await api.post('/subscription/trial/convert', {
      planId,
      billingInterval,
    });
    return response.data;
  },
};
