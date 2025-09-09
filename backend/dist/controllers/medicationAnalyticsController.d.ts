import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        [key: string]: any;
    };
}
export declare const getEnhancedAdherenceAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPrescriptionPatternAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMedicationInteractionAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMedicationCostAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDashboardAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=medicationAnalyticsController.d.ts.map