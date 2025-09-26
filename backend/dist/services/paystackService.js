"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackService = exports.paystackService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class PaystackService {
    constructor() {
        this.baseUrl = 'https://api.paystack.co';
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
        this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
        this.webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || '';
        console.log('Paystack Service initialized with: ', {
            secretKeyExists: !!this.secretKey,
            publicKeyExists: !!this.publicKey,
            webhookSecretExists: !!this.webhookSecret,
            secretKeyFirstChars: this.secretKey
                ? this.secretKey.substring(0, 5) + '...'
                : 'none',
            publicKeyFirstChars: this.publicKey
                ? this.publicKey.substring(0, 5) + '...'
                : 'none',
        });
        if (!this.secretKey) {
            console.warn('Paystack secret key not found in environment variables');
        }
    }
    getHeaders() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }
    isConfigured() {
        return Boolean(this.secretKey && this.publicKey);
    }
    async createCustomer(customerData) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/customer`, customerData, { headers: this.getHeaders() });
            return {
                success: response.data.status,
                message: response.data.message,
                data: response.data.data,
            };
        }
        catch (error) {
            console.error('Error creating Paystack customer:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create customer',
                error: error.message,
            };
        }
    }
    async initializeTransaction(transactionData) {
        try {
            console.log('Paystack configuration status:', {
                isConfigured: this.isConfigured(),
                hasSecretKey: !!this.secretKey,
                hasPublicKey: !!this.publicKey,
            });
            if (!transactionData.reference) {
                transactionData.reference = `ps_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(7)}`;
            }
            console.log('Initializing Paystack transaction with:', {
                email: transactionData.email,
                amount: transactionData.amount,
                callback_url: transactionData.callback_url,
                reference: transactionData.reference,
            });
            const response = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, transactionData, { headers: this.getHeaders() });
            if (response.data.status) {
                return {
                    success: true,
                    message: response.data.message,
                    data: {
                        authorization_url: response.data.data.authorization_url,
                        access_code: response.data.data.access_code,
                        reference: response.data.data.reference,
                    },
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.message,
                };
            }
        }
        catch (error) {
            console.error('Error initializing Paystack transaction:', {
                message: error.message,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                stack: error.stack,
            });
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to initialize transaction',
                error: error.message,
                details: error.response?.data,
            };
        }
    }
    async verifyTransaction(reference) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: this.getHeaders(),
            });
            return {
                success: response.data.status,
                message: response.data.message,
                data: response.data.data,
            };
        }
        catch (error) {
            console.error('Error verifying Paystack transaction:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify transaction',
                error: error.message,
            };
        }
    }
    async listTransactions(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined) {
                        queryParams.append(key, value.toString());
                    }
                });
            }
            const response = await axios_1.default.get(`${this.baseUrl}/transaction?${queryParams.toString()}`, { headers: this.getHeaders() });
            return {
                success: response.data.status,
                message: response.data.message,
                data: response.data.data,
            };
        }
        catch (error) {
            console.error('Error listing Paystack transactions:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to list transactions',
                error: error.message,
            };
        }
    }
    async createPlan(planData) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/plan`, {
                ...planData,
                currency: planData.currency || 'NGN',
            }, { headers: this.getHeaders() });
            return {
                success: response.data.status,
                message: response.data.message,
                data: response.data.data,
            };
        }
        catch (error) {
            console.error('Error creating Paystack plan:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create plan',
                error: error.message,
            };
        }
    }
    async createSubscription(subscriptionData) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/subscription`, subscriptionData, { headers: this.getHeaders() });
            return {
                success: response.data.status,
                message: response.data.message,
                data: response.data.data,
            };
        }
        catch (error) {
            console.error('Error creating Paystack subscription:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create subscription',
                error: error.message,
            };
        }
    }
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            console.error('Paystack webhook secret not configured');
            return false;
        }
        try {
            const hash = crypto_1.default
                .createHmac('sha512', this.webhookSecret)
                .update(payload, 'utf8')
                .digest('hex');
            return hash === signature;
        }
        catch (error) {
            console.error('Error verifying Paystack webhook signature:', error);
            return false;
        }
    }
    async handleWebhookEvent(event) {
        try {
            const { event: eventType, data } = event;
            console.log(`Processing Paystack webhook event: ${eventType}`);
            switch (eventType) {
                case 'charge.success':
                    return await this.handleChargeSuccess(data);
                case 'charge.failed':
                    return await this.handleChargeFailed(data);
                case 'subscription.create':
                    return await this.handleSubscriptionCreate(data);
                case 'subscription.disable':
                    return await this.handleSubscriptionDisable(data);
                case 'invoice.create':
                    return await this.handleInvoiceCreate(data);
                case 'invoice.payment_failed':
                    return await this.handleInvoicePaymentFailed(data);
                default:
                    console.log(`Unhandled Paystack webhook event: ${eventType}`);
                    return {
                        success: true,
                        message: `Event ${eventType} received but not handled`,
                    };
            }
        }
        catch (error) {
            console.error('Error handling Paystack webhook event:', error);
            return {
                success: false,
                message: 'Failed to handle webhook event',
                error: error.message,
            };
        }
    }
    async handleChargeSuccess(data) {
        console.log('Charge successful:', data.reference);
        return { success: true, message: 'Charge success event processed' };
    }
    async handleChargeFailed(data) {
        console.log('Charge failed:', data.reference);
        return { success: true, message: 'Charge failed event processed' };
    }
    async handleSubscriptionCreate(data) {
        console.log('Subscription created:', data);
        return { success: true, message: 'Subscription create event processed' };
    }
    async handleSubscriptionDisable(data) {
        console.log('Subscription disabled:', data);
        return { success: true, message: 'Subscription disable event processed' };
    }
    async handleInvoiceCreate(data) {
        console.log('Invoice created:', data);
        return { success: true, message: 'Invoice create event processed' };
    }
    async handleInvoicePaymentFailed(data) {
        console.log('Invoice payment failed:', data);
        return { success: true, message: 'Invoice payment failed event processed' };
    }
    getPublicKey() {
        return this.publicKey;
    }
    static convertToKobo(amountInNGN) {
        return Math.round(amountInNGN * 100);
    }
    static convertFromKobo(amountInKobo) {
        return amountInKobo / 100;
    }
}
exports.PaystackService = PaystackService;
exports.paystackService = new PaystackService();
//# sourceMappingURL=paystackService.js.map