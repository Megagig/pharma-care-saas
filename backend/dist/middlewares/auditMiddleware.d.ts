import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
declare global {
    namespace Express {
        interface Request {
            auditData?: {
                action: string;
                details: Record<string, any>;
                complianceCategory: string;
                riskLevel?: 'low' | 'medium' | 'high' | 'critical';
                interventionId?: string;
                oldValues?: Record<string, any>;
                newValues?: Record<string, any>;
                changedFields?: string[];
            };
            originalBody?: any;
        }
    }
}
export declare const captureAuditData: (action: string, complianceCategory: string, riskLevel?: "low" | "medium" | "high" | "critical") => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const logAuditTrail: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditIntervention: (action: string) => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const createManualAuditLog: (req: AuthRequest, action: string, details: Record<string, any>, options?: {
    interventionId?: string;
    riskLevel?: "low" | "medium" | "high" | "critical";
    complianceCategory?: string;
}) => Promise<void>;
export declare const auditTimer: (action: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditMTRActivity: (activityType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditPatientAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditLogger: (action: string, complianceCategory?: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            auditStartTime?: number;
        }
    }
}
//# sourceMappingURL=auditMiddleware.d.ts.map