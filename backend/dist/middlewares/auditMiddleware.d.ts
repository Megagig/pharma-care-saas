import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
interface AuditableRequest extends AuthRequest {
    auditData?: {
        action?: string;
        resourceType?: string;
        resourceId?: string;
        patientId?: string;
        reviewId?: string;
        oldValues?: any;
        newValues?: any;
        details?: any;
        complianceCategory?: string;
        riskLevel?: string;
    };
    startTime?: number;
}
export declare const auditTimer: (req: AuditableRequest, res: Response, next: NextFunction) => void;
export declare const auditLogger: (options?: {
    action?: string;
    resourceType?: string;
    complianceCategory?: string;
    riskLevel?: string;
    skipSuccessLog?: boolean;
}) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditMTRActivity: (action: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditPatientAccess: (action: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditHighRiskActivity: (action: string, resourceType: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const setAuditData: (req: AuditableRequest, data: Partial<AuditableRequest["auditData"]>) => void;
declare const _default: {
    auditTimer: (req: AuditableRequest, res: Response, next: NextFunction) => void;
    auditLogger: (options?: {
        action?: string;
        resourceType?: string;
        complianceCategory?: string;
        riskLevel?: string;
        skipSuccessLog?: boolean;
    }) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditMTRActivity: (action: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditPatientAccess: (action: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditHighRiskActivity: (action: string, resourceType: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    setAuditData: (req: AuditableRequest, data: Partial<AuditableRequest["auditData"]>) => void;
};
export default _default;
//# sourceMappingURL=auditMiddleware.d.ts.map