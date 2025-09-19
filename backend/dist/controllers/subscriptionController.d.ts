import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
    subscription?: any;
}
export declare class SubscriptionController {
    getCurrentSubscription(req: AuthRequest, res: Response): Promise<any>;
    getAvailablePlans: (req: AuthRequest, res: Response) => Promise<any>;
    private getDisplayFeaturesFromConfig;
    private getDisplayFeatures;
    createCheckoutSession(req: AuthRequest, res: Response): Promise<any>;
    verifyPaymentByReference(req: Request, res: Response): Promise<any>;
    handleSuccessfulPayment(req: AuthRequest, res: Response): Promise<any>;
    cancelSubscription(req: AuthRequest, res: Response): Promise<any>;
    upgradeSubscription(req: AuthRequest, res: Response): Promise<any>;
    downgradeSubscription(req: AuthRequest, res: Response): Promise<any>;
    getSubscriptionStatus(req: AuthRequest, res: Response): Promise<any>;
    getSubscriptionAnalytics(req: AuthRequest, res: Response): Promise<any>;
    handleWebhook(req: Request, res: Response): Promise<any>;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handlePaystackPaymentSucceeded;
    private handlePaystackPaymentFailed;
    private handlePaystackSubscriptionCreated;
    private handlePaystackSubscriptionDisabled;
    private processSubscriptionActivation;
    getBillingHistory(req: AuthRequest, res: Response): Promise<any>;
    getUsageMetrics(req: AuthRequest, res: Response): Promise<any>;
}
export declare const subscriptionController: SubscriptionController;
export {};
//# sourceMappingURL=subscriptionController.d.ts.map