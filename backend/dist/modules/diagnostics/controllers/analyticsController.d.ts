import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getDashboardSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    getDiagnosticMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAIPerformanceMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPatientOutcomeMetrics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTrendAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getComparisonAnalysis: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    generateAnalyticsReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getDashboardSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=analyticsController.d.ts.map