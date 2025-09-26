import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const aiDiagnosticRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const externalApiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const labDataRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sanitizeClinicalData: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateClinicalData: (req: Request, res: Response, next: NextFunction) => void;
export declare const monitorSuspiciousPatterns: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateApiKeys: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDataEncryption: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const aiDiagnosticSecurityMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const externalApiSecurityMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const labDataSecurityMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
declare const _default: {
    aiDiagnosticRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    externalApiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    labDataRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    sanitizeClinicalData: (req: Request, res: Response, next: NextFunction) => void;
    validateClinicalData: (req: Request, res: Response, next: NextFunction) => void;
    monitorSuspiciousPatterns: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validateApiKeys: (req: Request, res: Response, next: NextFunction) => void;
    validateDataEncryption: (req: AuthRequest, res: Response, next: NextFunction) => void;
    aiDiagnosticSecurityMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    externalApiSecurityMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
    labDataSecurityMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
};
export default _default;
//# sourceMappingURL=securityMiddleware.d.ts.map