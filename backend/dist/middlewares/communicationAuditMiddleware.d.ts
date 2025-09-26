import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
declare global {
    namespace Express {
        interface Request {
            communicationAuditData?: {
                action: string;
                targetType: 'conversation' | 'message' | 'user' | 'file' | 'notification';
                startTime: number;
                details: any;
            };
        }
    }
}
export declare const captureCommunicationAuditData: (action: string, targetType: "conversation" | "message" | "user" | "file" | "notification") => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const logCommunicationAuditTrail: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditMessage: (action: "message_sent" | "message_read" | "message_edited" | "message_deleted") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const auditConversation: (action: "conversation_created" | "conversation_updated" | "conversation_archived" | "participant_added" | "participant_removed") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const auditFile: (action: "file_uploaded" | "file_downloaded" | "file_deleted") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const auditSearch: (action: "conversation_search" | "message_search") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const auditNotification: (action: "notification_sent" | "notification_read") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const logCommunicationEvent: (req: AuthRequest, action: string, targetId: string, targetType: "conversation" | "message" | "user" | "file" | "notification", details?: any) => Promise<void>;
export declare const auditPatientCommunicationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditBulkOperation: (action: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditHighRiskOperation: (action: string, riskLevel?: "high" | "critical") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    captureCommunicationAuditData: (action: string, targetType: "conversation" | "message" | "user" | "file" | "notification") => (req: AuthRequest, res: Response, next: NextFunction) => void;
    logCommunicationAuditTrail: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    auditMessage: (action: "message_sent" | "message_read" | "message_edited" | "message_deleted") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    auditConversation: (action: "conversation_created" | "conversation_updated" | "conversation_archived" | "participant_added" | "participant_removed") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    auditFile: (action: "file_uploaded" | "file_downloaded" | "file_deleted") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    auditSearch: (action: "conversation_search" | "message_search") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    auditNotification: (action: "notification_sent" | "notification_read") => ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    logCommunicationEvent: (req: AuthRequest, action: string, targetId: string, targetType: "conversation" | "message" | "user" | "file" | "notification", details?: any) => Promise<void>;
    auditPatientCommunicationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    auditBulkOperation: (action: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    auditHighRiskOperation: (action: string, riskLevel?: "high" | "critical") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=communicationAuditMiddleware.d.ts.map