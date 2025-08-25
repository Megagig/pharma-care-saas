import crypto from 'crypto';
import axios from 'axios';
import { config } from 'dotenv';

config();

interface NombaPaymentData {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

interface NombaPaymentResponse {
  success: boolean;
  data?: {
    reference: string;
    checkoutUrl: string;
    accessCode: string;
  };
  message?: string;
}

interface NombaVerifyResponse {
  success: boolean;
  data?: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customerEmail: string;
    paidAt?: string;
    metadata?: Record<string, any>;
  };
  message?: string;
}

class NombaService {
  private clientId: string;
  private privateKey: string;
  private accountId: string;
  private baseURL: string = 'https://api.nomba.com/v1';

  constructor() {
    this.clientId = process.env.NOMBA_CLIENT_ID || '';
    this.privateKey = process.env.NOMBA_PRIVATE_KEY || '';
    this.accountId = process.env.NOMBA_ACCOUNT_ID || '';

    if (!this.clientId || !this.privateKey || !this.accountId) {
      throw new Error('Nomba API credentials are not properly configured');
    }
  }

  private generateSignature(payload: string, timestamp: string): string {
    const message = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', this.privateKey)
      .update(message)
      .digest('hex');
  }

  private getHeaders(payload?: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers: Record<string, string> = {
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

  async initiatePayment(
    paymentData: NombaPaymentData
  ): Promise<NombaPaymentResponse> {
    try {
      const payload = {
        amount: paymentData.amount * 100, // Convert to kobo
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

      const response = await axios.post(
        `${this.baseURL}/checkout/initialize`,
        payload,
        { headers }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          data: {
            reference: response.data.data.reference,
            checkoutUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
          },
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Payment initialization failed',
        };
      }
    } catch (error: any) {
      console.error(
        'Nomba payment initiation error:',
        error.response?.data || error.message
      );
      return {
        success: false,
        message:
          error.response?.data?.message || 'Payment initialization failed',
      };
    }
  }

  async verifyPayment(reference: string): Promise<NombaVerifyResponse> {
    try {
      const headers = this.getHeaders();

      const response = await axios.get(
        `${this.baseURL}/checkout/verify/${reference}`,
        { headers }
      );

      if (response.data.status === 'success') {
        const data = response.data.data;
        return {
          success: true,
          data: {
            reference: data.reference,
            amount: data.amount / 100, // Convert from kobo
            currency: data.currency,
            status: data.status,
            customerEmail: data.customer.email,
            paidAt: data.paid_at,
            metadata: data.metadata,
          },
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error(
        'Nomba payment verification error:',
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed',
      };
    }
  }

  async refundPayment(
    reference: string,
    amount?: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const payload = {
        transaction: reference,
        amount: amount ? amount * 100 : undefined, // Convert to kobo if specified
      };

      const payloadString = JSON.stringify(payload);
      const headers = this.getHeaders(payloadString);

      const response = await axios.post(`${this.baseURL}/refund`, payload, {
        headers,
      });

      return {
        success: response.data.status === 'success',
        message: response.data.message,
      };
    } catch (error: any) {
      console.error(
        'Nomba refund error:',
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Refund failed',
      };
    }
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const nombaService = new NombaService();
export default NombaService;
