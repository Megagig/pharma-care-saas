import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getUnifiedReportData: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAvailableReports: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getReportSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const queueReportExport: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getExportJobStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPerformanceStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=reportsController.d.ts.map