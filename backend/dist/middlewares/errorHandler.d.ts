import { Request, Response, NextFunction } from 'express';
import { MTRError } from '../utils/mtrErrors';
interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    errors?: any;
}
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
declare const errorHandler: (err: CustomError | MTRError, req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map