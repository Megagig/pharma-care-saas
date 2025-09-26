import { Request, Response, NextFunction } from 'express';
import { ClinicalInterventionError } from '../utils/clinicalInterventionErrors';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        workplaceId: string;
    };
}
export declare const clinicalInterventionErrorHandler: (error: Error | ClinicalInterventionError, req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const errorLoggingMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const asyncErrorHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimitErrorHandler: (req: Request, res: Response, next: NextFunction, options: {
    windowMs: number;
    max: number;
}) => void;
export declare const formatValidationErrors: (errors: any[]) => any[];
declare const _default: {
    clinicalInterventionErrorHandler: (error: Error | ClinicalInterventionError, req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    errorLoggingMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    asyncErrorHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    rateLimitErrorHandler: (req: Request, res: Response, next: NextFunction, options: {
        windowMs: number;
        max: number;
    }) => void;
    formatValidationErrors: (errors: any[]) => any[];
};
export default _default;
//# sourceMappingURL=clinicalInterventionErrorHandler.d.ts.map