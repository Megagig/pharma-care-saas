import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
export declare const generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDashboardSummary: (req: AuthRequest, res: Response) => Promise<void>;
declare const _default: {
    getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<void>;
    getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<void>;
    getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<void>;
    getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
    getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
    getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
    generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<void>;
    getDashboardSummary: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=analyticsController.d.ts.map