import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
export declare const auditPDFAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditResultEntry: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditStatusChange: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditTokenResolution: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditManualLabOperation: (operationType: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const monitorCompliance: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    auditPDFAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
    auditResultEntry: (req: AuthRequest, res: Response, next: NextFunction) => void;
    auditStatusChange: (req: AuthRequest, res: Response, next: NextFunction) => void;
    auditTokenResolution: (req: AuthRequest, res: Response, next: NextFunction) => void;
    auditManualLabOperation: (operationType: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    monitorCompliance: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=manualLabAuditMiddleware.d.ts.map