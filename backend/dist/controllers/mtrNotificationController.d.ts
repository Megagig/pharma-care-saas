import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        role: string;
        email: string;
    };
}
export declare const scheduleFollowUpReminder: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const sendCriticalAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkOverdueFollowUps: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateNotificationPreferences: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getNotificationPreferences: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getNotificationStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const processPendingReminders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const sendTestNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getFollowUpReminders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const cancelScheduledReminder: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkDrugInteractions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const notifyHighSeverityDTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=mtrNotificationController.d.ts.map