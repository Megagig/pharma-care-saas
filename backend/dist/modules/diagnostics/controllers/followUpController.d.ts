import { Response } from 'express';
export declare const createFollowUp: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPatientFollowUps: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getFollowUpById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const completeFollowUp: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const rescheduleFollowUp: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getOverdueFollowUps: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getFollowUpAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyFollowUps: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateFollowUpStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=followUpController.d.ts.map