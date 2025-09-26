import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
interface SessionData {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
    deviceFingerprint?: string;
    location?: {
        country?: string;
        city?: string;
        timezone?: string;
    };
}
export declare const createUserSession: (userId: string, sessionId: string, req: Request) => SessionData;
export declare const validateUserSession: (userId: string, sessionId: string, req: Request) => {
    isValid: boolean;
    reason?: string;
    session?: SessionData;
};
export declare const validateSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const terminateSession: (userId: string, sessionId: string) => boolean;
export declare const terminateAllUserSessions: (userId: string) => number;
export declare const getUserActiveSessions: (userId: string) => SessionData[];
export declare const sessionManagementEndpoints: {
    getSessions: (req: AuthRequest, res: Response) => void;
    terminateSession: (req: AuthRequest, res: Response) => void;
    terminateAllOtherSessions: (req: AuthRequest, res: Response) => void;
};
export declare const enforceConcurrentSessionLimit: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    createUserSession: (userId: string, sessionId: string, req: Request) => SessionData;
    validateUserSession: (userId: string, sessionId: string, req: Request) => {
        isValid: boolean;
        reason?: string;
        session?: SessionData;
    };
    validateSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    terminateSession: (userId: string, sessionId: string) => boolean;
    terminateAllUserSessions: (userId: string) => number;
    getUserActiveSessions: (userId: string) => SessionData[];
    sessionManagementEndpoints: {
        getSessions: (req: AuthRequest, res: Response) => void;
        terminateSession: (req: AuthRequest, res: Response) => void;
        terminateAllOtherSessions: (req: AuthRequest, res: Response) => void;
    };
    enforceConcurrentSessionLimit: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=communicationSessionManagement.d.ts.map