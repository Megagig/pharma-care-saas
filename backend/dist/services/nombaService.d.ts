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
interface NombaCustomerData {
    email: string;
    name: string;
    phone?: string;
    metadata?: Record<string, any>;
}
interface NombaCustomerResponse {
    success: boolean;
    data?: {
        customerId: string;
        email: string;
        name: string;
    };
    message?: string;
}
interface NombaSubscriptionData {
    customerId: string;
    planCode: string;
    amount: number;
    currency: string;
    startDate?: Date;
    metadata?: Record<string, any>;
}
interface NombaSubscriptionResponse {
    success: boolean;
    data?: {
        subscriptionId: string;
        subscriptionCode: string;
        status: string;
        nextPaymentDate: string;
    };
    message?: string;
}
declare class NombaService {
    private clientId;
    private privateKey;
    private accountId;
    private baseURL;
    private isConfigured;
    constructor();
    isNombaConfigured(): boolean;
    private generateSignature;
    private getHeaders;
    initiatePayment(paymentData: NombaPaymentData): Promise<NombaPaymentResponse>;
    createPaymentIntent(data: {
        amount: number;
        currency?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        reference: string;
        transactionId: string;
        paymentUrl?: string;
    }>;
    verifyPayment(reference: string): Promise<NombaVerifyResponse>;
    refundPayment(reference: string, amount?: number): Promise<{
        success: boolean;
        message?: string;
    }>;
    createCustomer(customerData: NombaCustomerData): Promise<NombaCustomerResponse>;
    createSubscription(subscriptionData: NombaSubscriptionData): Promise<NombaSubscriptionResponse>;
    cancelSubscription(subscriptionCode: string): Promise<{
        success: boolean;
        message?: string;
    }>;
    getSubscription(subscriptionCode: string): Promise<NombaSubscriptionResponse>;
    processInvoicePayment(customerId: string, amount: number, description: string, metadata?: Record<string, any>): Promise<NombaPaymentResponse>;
    verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean;
}
export declare const nombaService: NombaService;
export default NombaService;
//# sourceMappingURL=nombaService.d.ts.map