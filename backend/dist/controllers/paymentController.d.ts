import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getPayments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPayment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPayment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const processWebhook: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=paymentController.d.ts.map