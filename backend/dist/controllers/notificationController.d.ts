import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}
export declare const createNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markNotificationAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markMultipleAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const dismissNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUnreadCount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getNotificationPreferences: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateNotificationPreferences: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createConversationNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createPatientQueryNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getNotificationStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const processScheduledNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const retryFailedNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const sendTestNotification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const archiveOldNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteExpiredNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=notificationController.d.ts.map