import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getAllAuditTrail: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInterventionAuditTrail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const exportAuditData: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getComplianceReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAuditStatistics: (req: Request, res: Response) => Promise<void>;
export declare const cleanupAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auditController.d.ts.map