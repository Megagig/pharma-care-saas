import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
export declare const generateCSRFToken: (userId: string, sessionId?: string) => string;
export declare const validateCSRFToken: (userId: string, token: string, sessionId?: string) => boolean;
export declare const requireCSRFToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const provideCSRFToken: (req: AuthRequest, res: Response) => void;
export declare const doubleSubmitCSRF: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const setCSRFCookie: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateOrigin: (req: Request, res: Response, next: NextFunction) => void;
export declare const enforceSameSite: (req: Request, res: Response, next: NextFunction) => void;
export declare const comprehensiveCSRFProtection: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const lightweightCSRFProtection: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
declare const _default: {
    generateCSRFToken: (userId: string, sessionId?: string) => string;
    validateCSRFToken: (userId: string, token: string, sessionId?: string) => boolean;
    requireCSRFToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
    provideCSRFToken: (req: AuthRequest, res: Response) => void;
    doubleSubmitCSRF: (req: AuthRequest, res: Response, next: NextFunction) => void;
    setCSRFCookie: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateOrigin: (req: Request, res: Response, next: NextFunction) => void;
    enforceSameSite: (req: Request, res: Response, next: NextFunction) => void;
    comprehensiveCSRFProtection: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    lightweightCSRFProtection: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
};
export default _default;
//# sourceMappingURL=communicationCSRF.d.ts.map