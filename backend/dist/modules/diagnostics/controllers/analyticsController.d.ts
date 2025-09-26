import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDashboardSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getDashboardSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=analyticsController.d.ts.map