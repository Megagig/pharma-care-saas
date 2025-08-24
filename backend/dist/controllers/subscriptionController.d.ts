import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
    subscription?: any;
}
export declare class SubscriptionController {
    getCurrentSubscription(req: AuthRequest, res: Response): Promise<any>;
    getAvailablePlans(req: AuthRequest, res: Response): Promise<any>;
    createCheckoutSession(req: AuthRequest, res: Response): Promise<any>;
    handleSuccessfulPayment(req: AuthRequest, res: Response): Promise<any>;
    cancelSubscription(req: AuthRequest, res: Response): Promise<any>;
    handleWebhook(req: Request, res: Response): Promise<any>;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
}
export declare const subscriptionController: SubscriptionController;
export {};
//# sourceMappingURL=subscriptionController.d.ts.map