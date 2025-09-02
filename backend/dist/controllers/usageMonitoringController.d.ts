import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getWorkspaceUsageStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsageAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsageAlerts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const recalculateUsageStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUsageComparison: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=usageMonitoringController.d.ts.map