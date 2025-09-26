import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
export declare const auditPDFAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditResultEntry: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditStatusChange: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditTokenResolution: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const auditManualLabOperation: (operationType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const monitorCompliance: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=manualLabAuditMiddleware.d.ts.map