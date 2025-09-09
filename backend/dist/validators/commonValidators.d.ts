import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        [key: string]: any;
    };
}
export declare const validatePatientId: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const validateDateRange: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=commonValidators.d.ts.map