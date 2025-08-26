import { Request, Response } from 'express';
interface CustomRequest extends Request {
    user?: {
        _id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
    };
}
declare class SubscriptionController {
    getSubscriptionAnalytics(req: CustomRequest, res: Response): Promise<Response>;
    checkout(req: CustomRequest, res: Response): Promise<Response>;
    verifyPayment(req: CustomRequest, res: Response): Promise<Response>;
}
export declare const subscriptionController: SubscriptionController;
export {};
//# sourceMappingURL=subscriptionManagementController.d.ts.map