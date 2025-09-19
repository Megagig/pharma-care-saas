import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const createRateLimiter: (options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    bypassSuperAdmin?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const createUserRateLimiter: (options: {
    windowMs: number;
    max: number;
    message?: string;
    bypassSuperAdmin?: boolean;
}) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const invitationRateLimiters: {
    createInvitation: import("express-rate-limit").RateLimitRequestHandler;
    createInvitationUser: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    validateInvitation: import("express-rate-limit").RateLimitRequestHandler;
    acceptInvitation: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const subscriptionRateLimiters: {
    subscriptionChange: import("express-rate-limit").RateLimitRequestHandler;
    subscriptionChangeUser: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    paymentAttempt: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const generalRateLimiters: {
    api: import("express-rate-limit").RateLimitRequestHandler;
    sensitive: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const abuseDetection: {
    invitationSpam: (req: AuthRequest, res: Response, next: NextFunction) => void;
    suspiciousLogin: (req: Request, res: Response, next: NextFunction) => void;
};
declare const _default: {
    createRateLimiter: (options: {
        windowMs: number;
        max: number;
        message?: string;
        skipSuccessfulRequests?: boolean;
        skipFailedRequests?: boolean;
        keyGenerator?: (req: Request) => string;
        bypassSuperAdmin?: boolean;
    }) => import("express-rate-limit").RateLimitRequestHandler;
    createUserRateLimiter: (options: {
        windowMs: number;
        max: number;
        message?: string;
        bypassSuperAdmin?: boolean;
    }) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    invitationRateLimiters: {
        createInvitation: import("express-rate-limit").RateLimitRequestHandler;
        createInvitationUser: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
        validateInvitation: import("express-rate-limit").RateLimitRequestHandler;
        acceptInvitation: import("express-rate-limit").RateLimitRequestHandler;
    };
    subscriptionRateLimiters: {
        subscriptionChange: import("express-rate-limit").RateLimitRequestHandler;
        subscriptionChangeUser: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
        paymentAttempt: import("express-rate-limit").RateLimitRequestHandler;
    };
    generalRateLimiters: {
        api: import("express-rate-limit").RateLimitRequestHandler;
        sensitive: import("express-rate-limit").RateLimitRequestHandler;
        auth: import("express-rate-limit").RateLimitRequestHandler;
    };
    abuseDetection: {
        invitationSpam: (req: AuthRequest, res: Response, next: NextFunction) => void;
        suspiciousLogin: (req: Request, res: Response, next: NextFunction) => void;
    };
};
export default _default;
//# sourceMappingURL=rateLimiting.d.ts.map