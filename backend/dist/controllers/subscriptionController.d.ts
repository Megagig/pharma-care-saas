import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getPlans: (req: Request, res: Response) => Promise<void>;
export declare const getSubscription: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateSubscription: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelSubscription: (req: AuthRequest, res: Response) => Promise<void>;
export declare const renewSubscription: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=subscriptionController.d.ts.map