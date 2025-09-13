import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const createFollowUp: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientFollowUps: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getFollowUpById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const completeFollowUp: (req: AuthRequest, res: Response) => Promise<void>;
export declare const rescheduleFollowUp: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOverdueFollowUps: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getFollowUpAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyFollowUps: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateFollowUpStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=followUpController.d.ts.map