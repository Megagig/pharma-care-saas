"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nombaService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class NombaService {
    constructor() {
        this.baseURL = 'https://api.nomba.com/v1';
        this.isConfigured = false;
        this.clientId = process.env.NOMBA_CLIENT_ID || '';
        this.privateKey = process.env.NOMBA_PRIVATE_KEY || '';
        this.accountId = process.env.NOMBA_ACCOUNT_ID || '';
        this.isConfigured = !!(this.clientId && this.privateKey && this.accountId);
        if (!this.isConfigured) {
            console.warn('Nomba API credentials are not properly configured. Payment functionality will be limited.');
        }
    }
    isNombaConfigured() {
        return this.isConfigured;
    }
    generateSignature(payload, timestamp) {
        const message = `${timestamp}.${payload}`;
        return crypto_1.default
            .createHmac('sha256', this.privateKey)
            .update(message)
            .digest('hex');
    }
    getHeaders(payload) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.clientId}`,
            'X-Nomba-Account-ID': this.accountId,
            'X-Nomba-Timestamp': timestamp,
        };
        if (payload) {
            headers['X-Nomba-Signature'] = this.generateSignature(payload, timestamp);
        }
        return headers;
    }
    async initiatePayment(paymentData) {
        try {
            const payload = {
                amount: paymentData.amount * 100,
                currency: paymentData.currency || 'NGN',
                customer: {
                    email: paymentData.customerEmail,
                    name: paymentData.customerName,
                },
                description: paymentData.description,
                callback_url: paymentData.callbackUrl,
                metadata: paymentData.metadata || {},
            };
            const payloadString = JSON.stringify(payload);
            const headers = this.getHeaders(payloadString);
            const response = await axios_1.default.post(`${this.baseURL}/checkout/initialize`, payload, { headers });
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        reference: response.data.data.reference,
                        checkoutUrl: response.data.data.authorization_url,
                        accessCode: response.data.data.access_code,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Payment initialization failed',
                };
            }
        }
        catch (error) {
            console.error('Nomba payment initiation error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Payment initialization failed',
            };
        }
    }
    async verifyPayment(reference) {
        try {
            const headers = this.getHeaders();
            const response = await axios_1.default.get(`${this.baseURL}/checkout/verify/${reference}`, { headers });
            if (response.data.status === 'success') {
                const data = response.data.data;
                return {
                    success: true,
                    data: {
                        reference: data.reference,
                        amount: data.amount / 100,
                        currency: data.currency,
                        status: data.status,
                        customerEmail: data.customer.email,
                        paidAt: data.paid_at,
                        metadata: data.metadata,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Payment verification failed',
                };
            }
        }
        catch (error) {
            console.error('Nomba payment verification error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Payment verification failed',
            };
        }
    }
    async refundPayment(reference, amount) {
        try {
            const payload = {
                transaction: reference,
                amount: amount ? amount * 100 : undefined,
            };
            const payloadString = JSON.stringify(payload);
            const headers = this.getHeaders(payloadString);
            const response = await axios_1.default.post(`${this.baseURL}/refund`, payload, {
                headers,
            });
            return {
                success: response.data.status === 'success',
                message: response.data.message,
            };
        }
        catch (error) {
            console.error('Nomba refund error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Refund failed',
            };
        }
    }
    async createCustomer(customerData) {
        try {
            const payload = {
                email: customerData.email,
                name: customerData.name,
                phone: customerData.phone,
                metadata: customerData.metadata || {},
            };
            const payloadString = JSON.stringify(payload);
            const headers = this.getHeaders(payloadString);
            const response = await axios_1.default.post(`${this.baseURL}/customers`, payload, { headers });
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        customerId: response.data.data.customer_code,
                        email: response.data.data.email,
                        name: response.data.data.name,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Customer creation failed',
                };
            }
        }
        catch (error) {
            console.error('Nomba customer creation error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Customer creation failed',
            };
        }
    }
    async createSubscription(subscriptionData) {
        try {
            const payload = {
                customer: subscriptionData.customerId,
                plan: subscriptionData.planCode,
                amount: subscriptionData.amount * 100,
                currency: subscriptionData.currency || 'NGN',
                start_date: subscriptionData.startDate?.toISOString(),
                metadata: subscriptionData.metadata || {},
            };
            const payloadString = JSON.stringify(payload);
            const headers = this.getHeaders(payloadString);
            const response = await axios_1.default.post(`${this.baseURL}/subscriptions`, payload, { headers });
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        subscriptionId: response.data.data.subscription_code,
                        subscriptionCode: response.data.data.subscription_code,
                        status: response.data.data.status,
                        nextPaymentDate: response.data.data.next_payment_date,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Subscription creation failed',
                };
            }
        }
        catch (error) {
            console.error('Nomba subscription creation error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Subscription creation failed',
            };
        }
    }
    async cancelSubscription(subscriptionCode) {
        try {
            const headers = this.getHeaders();
            const response = await axios_1.default.post(`${this.baseURL}/subscriptions/${subscriptionCode}/cancel`, {}, { headers });
            return {
                success: response.data.status === 'success',
                message: response.data.message,
            };
        }
        catch (error) {
            console.error('Nomba subscription cancellation error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Subscription cancellation failed',
            };
        }
    }
    async getSubscription(subscriptionCode) {
        try {
            const headers = this.getHeaders();
            const response = await axios_1.default.get(`${this.baseURL}/subscriptions/${subscriptionCode}`, { headers });
            if (response.data.status === 'success') {
                const data = response.data.data;
                return {
                    success: true,
                    data: {
                        subscriptionId: data.subscription_code,
                        subscriptionCode: data.subscription_code,
                        status: data.status,
                        nextPaymentDate: data.next_payment_date,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to fetch subscription',
                };
            }
        }
        catch (error) {
            console.error('Nomba subscription fetch error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch subscription',
            };
        }
    }
    async processInvoicePayment(customerId, amount, description, metadata) {
        try {
            const payload = {
                customer: customerId,
                amount: amount * 100,
                currency: 'NGN',
                description,
                metadata: metadata || {},
            };
            const payloadString = JSON.stringify(payload);
            const headers = this.getHeaders(payloadString);
            const response = await axios_1.default.post(`${this.baseURL}/charges`, payload, { headers });
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        reference: response.data.data.reference,
                        checkoutUrl: response.data.data.authorization_url,
                        accessCode: response.data.data.access_code,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message || 'Payment processing failed',
                };
            }
        }
        catch (error) {
            console.error('Nomba invoice payment error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Payment processing failed',
            };
        }
    }
    verifyWebhookSignature(payload, signature, timestamp) {
        const expectedSignature = this.generateSignature(payload, timestamp);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
}
exports.nombaService = new NombaService();
exports.default = NombaService;
//# sourceMappingURL=nombaService.js.map