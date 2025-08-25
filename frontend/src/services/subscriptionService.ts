import api from './api';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  tier: 'free_trial' | 'basic' | 'pro' | 'enterprise';
  priceNGN: number;
  priceUSD: number;
  billingInterval: 'monthly' | 'yearly';
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
  tier: 'free_trial' | 'basic' | 'pro' | 'enterprise';
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
    const response = await api.get('/subscription-management/plans', {
      params: { billingInterval },
    });
    return response.data;
  },

  // Get current user's subscription
  async getCurrentSubscription() {
    const response = await api.get('/subscription-management/current');
    return response.data;
  },

  // Create Nomba checkout session
  async createCheckoutSession(
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) {
    const response = await api.post('/subscription-management/checkout', {
      planId,
      billingInterval,
    });
    return response.data;
  },

  // Verify payment after Nomba redirect
  async verifyPayment(paymentReference: string) {
    const response = await api.post(
      '/subscription-management/confirm-payment',
      {
        paymentReference,
      }
    );
    return response.data;
  },

  // Cancel subscription
  async cancelSubscription(reason?: string) {
    const response = await api.post('/subscription-management/cancel', {
      reason,
    });
    return response.data;
  },

  // Reactivate subscription
  async reactivateSubscription() {
    const response = await api.post('/subscription-management/reactivate');
    return response.data;
  },

  // Update subscription
  async updateSubscription(
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) {
    const response = await api.put('/subscription-management/update', {
      planId,
      billingInterval,
    });
    return response.data;
  },

  // Get billing history
  async getBillingHistory() {
    const response = await api.get('/subscription-management/billing-history');
    return response.data;
  },

  // Download invoice
  async downloadInvoice(invoiceId: string) {
    const response = await api.get(
      `/subscription-management/invoice/${invoiceId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  // Get usage metrics
  async getUsageMetrics() {
    const response = await api.get('/subscription-management/usage');
    return response.data;
  },

  // Check feature access
  async checkFeatureAccess(featureKey: string) {
    const response = await api.get(
      `/subscription-management/features/${featureKey}/check`
    );
    return response.data;
  },

  // Get subscription status
  async getSubscriptionStatus() {
    const response = await api.get('/subscription-management/status');
    return response.data;
  },

  // Update payment method
  async updatePaymentMethod() {
    const response = await api.post(
      '/subscription-management/payment-method/update'
    );
    return response.data;
  },

  // Get upcoming invoice
  async getUpcomingInvoice() {
    const response = await api.get('/subscription-management/upcoming-invoice');
    return response.data;
  },

  // Apply coupon
  async applyCoupon(couponCode: string) {
    const response = await api.post('/subscription-management/coupon/apply', {
      couponCode,
    });
    return response.data;
  },

  // Remove coupon
  async removeCoupon() {
    const response = await api.post('/subscription-management/coupon/remove');
    return response.data;
  },

  // Get plan comparison
  async getPlanComparison() {
    const response = await api.get('/subscription-management/plans/compare');
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
      '/subscription-management/custom-plan/request',
      requirements
    );
    return response.data;
  },

  // Get feature usage analytics
  async getFeatureUsageAnalytics(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    const response = await api.get(
      `/subscription-management/analytics/usage?period=${period}`
    );
    return response.data;
  },

  // Extend trial
  async extendTrial(days: number, reason: string) {
    const response = await api.post('/subscription-management/trial/extend', {
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
    const response = await api.post('/subscription-management/trial/convert', {
      planId,
      billingInterval,
    });
    return response.data;
  },
};
