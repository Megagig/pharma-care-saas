import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const createCommunicationRateLimiter: (options: {
    windowMs: number;
    limits: {
        pharmacist: number;
        doctor: number;
        patient: number;
        pharmacy_team: number;
        intern_pharmacist: number;
        default: number;
    };
    message?: string;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const messageRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const conversationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const fileUploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const searchRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createAdvancedUserRateLimit: (options: {
    windowMs: number;
    maxMessages: number;
    maxConversations: number;
    maxFileUploads: number;
    activityType: "message" | "conversation" | "file_upload";
}) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const burstProtection: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const adaptiveCommunicationRateLimit: (baseLimit: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const spamDetection: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    createCommunicationRateLimiter: (options: {
        windowMs: number;
        limits: {
            pharmacist: number;
            doctor: number;
            patient: number;
            pharmacy_team: number;
            intern_pharmacist: number;
            default: number;
        };
        message?: string;
        skipSuccessfulRequests?: boolean;
        keyGenerator?: (req: Request) => string;
    }) => import("express-rate-limit").RateLimitRequestHandler;
    messageRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    conversationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    fileUploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    searchRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    createAdvancedUserRateLimit: (options: {
        windowMs: number;
        maxMessages: number;
        maxConversations: number;
        maxFileUploads: number;
        activityType: "message" | "conversation" | "file_upload";
    }) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    burstProtection: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    adaptiveCommunicationRateLimit: (baseLimit: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    spamDetection: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=communicationRateLimiting.d.ts.map