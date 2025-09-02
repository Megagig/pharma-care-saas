import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const blockSuspiciousIPs: (req: Request, res: Response, next: NextFunction) => void;
export declare const monitorSuspiciousUsers: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const monitorSecurityEvents: (eventType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const adaptiveRateLimit: (baseLimit: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const detectAnomalies: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const monitorPermissionChanges: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const monitorDataAccess: (resourceType: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    blockSuspiciousIPs: (req: Request, res: Response, next: NextFunction) => void;
    monitorSuspiciousUsers: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateSession: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    monitorSecurityEvents: (eventType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    adaptiveRateLimit: (baseLimit: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    detectAnomalies: (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorPermissionChanges: (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorDataAccess: (resourceType: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=securityMonitoring.d.ts.map