import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const enhancedOrderCreationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const enhancedPDFAccessRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateSecurePDFToken: (orderId: string, userId: string, expiresIn?: number) => string;
export declare const validatePDFToken: (token: string) => {
    valid: boolean;
    payload?: any;
    error?: string;
};
export declare const validatePDFAccess: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const csrfProtection: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const generateCSRFToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const detectSuspiciousActivity: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const setSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    enhancedOrderCreationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    enhancedPDFAccessRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
    generateSecurePDFToken: (orderId: string, userId: string, expiresIn?: number) => string;
    validatePDFToken: (token: string) => {
        valid: boolean;
        payload?: any;
        error?: string;
    };
    validatePDFAccess: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    csrfProtection: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    generateCSRFToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
    detectSuspiciousActivity: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    setSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=manualLabSecurityMiddleware.d.ts.map