const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PaymentService {
  async makeRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  async getPayments() {
    return this.makeRequest('/payments');
  }

  async getPayment(paymentId) {
    return this.makeRequest(`/payments/${paymentId}`);
  }

  async createPayment(paymentData) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getSubscription() {
    return this.makeRequest('/subscriptions');
  }

  async updateSubscription(subscriptionData) {
    return this.makeRequest('/subscriptions', {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }

  async cancelSubscription() {
    return this.makeRequest('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  async renewSubscription() {
    return this.makeRequest('/subscriptions/renew', {
      method: 'POST',
    });
  }

  async getPlans() {
    return this.makeRequest('/subscriptions/plans');
  }

  // Stripe integration methods
  async createPaymentIntent(amount, currency = 'usd') {
    return this.makeRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  }

  async confirmPayment(paymentIntentId) {
    return this.makeRequest('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  async updatePaymentMethod(paymentMethodId) {
    return this.makeRequest('/payments/update-method', {
      method: 'PUT',
      body: JSON.stringify({ paymentMethodId }),
    });
  }
}

export const paymentService = new PaymentService();