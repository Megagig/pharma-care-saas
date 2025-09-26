import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getAllAuditTrail: (req: Request, res: Response) => Promise<void>;
export declare const getInterventionAuditTrail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const exportAuditData: (req: Request, res: Response) => Promise<void>;
export declare const getComplianceReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAuditStatistics: (req: Request, res: Response) => Promise<void>;
export declare const cleanupAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auditController.d.ts.map