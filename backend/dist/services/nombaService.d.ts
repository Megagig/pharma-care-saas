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
    verifyPayment(reference: string): Promise<NombaVerifyResponse>;
    refundPayment(reference: string, amount?: number): Promise<{
        success: boolean;
        message?: string;
    }>;
    verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean;
}
export declare const nombaService: NombaService;
export default NombaService;
//# sourceMappingURL=nombaService.d.ts.map