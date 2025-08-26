interface PaystackCustomer {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, any>;
}
interface PaystackTransaction {
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
    channels?: string[];
    split_code?: string;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: 'account' | 'subaccount';
    plan?: string;
    quantity?: number;
    invoice_limit?: number;
    customer?: string;
}
interface PaystackVerificationData {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
        authorization_code: string;
        bin: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        channel: string;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
        reusable: boolean;
        signature: string;
        account_name: string | null;
    };
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string;
        customer_code: string;
        phone: string | null;
        metadata: Record<string, any>;
        risk_action: string;
        international_format_phone: string | null;
    };
    plan: any;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
}
interface ServiceResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    details?: any;
}
declare class PaystackService {
    private readonly baseUrl;
    private readonly secretKey;
    private readonly publicKey;
    private readonly webhookSecret;
    constructor();
    private getHeaders;
    isConfigured(): boolean;
    createCustomer(customerData: PaystackCustomer): Promise<ServiceResponse>;
    initializeTransaction(transactionData: PaystackTransaction): Promise<ServiceResponse>;
    verifyTransaction(reference: string): Promise<ServiceResponse<PaystackVerificationData>>;
    listTransactions(params?: {
        perPage?: number;
        page?: number;
        customer?: string;
        status?: string;
        from?: string;
        to?: string;
        amount?: number;
    }): Promise<ServiceResponse>;
    createPlan(planData: {
        name: string;
        amount: number;
        interval: 'monthly' | 'quarterly' | 'biannually' | 'annually';
        description?: string;
        currency?: string;
        invoice_limit?: number;
        send_invoices?: boolean;
        send_sms?: boolean;
    }): Promise<ServiceResponse>;
    createSubscription(subscriptionData: {
        customer: string;
        plan: string;
        authorization?: string;
        start_date?: string;
    }): Promise<ServiceResponse>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    handleWebhookEvent(event: any): Promise<ServiceResponse>;
    private handleChargeSuccess;
    private handleChargeFailed;
    private handleSubscriptionCreate;
    private handleSubscriptionDisable;
    private handleInvoiceCreate;
    private handleInvoicePaymentFailed;
    getPublicKey(): string;
    static convertToKobo(amountInNGN: number): number;
    static convertFromKobo(amountInKobo: number): number;
}
export declare const paystackService: PaystackService;
export { PaystackService };
//# sourceMappingURL=paystackService.d.ts.map