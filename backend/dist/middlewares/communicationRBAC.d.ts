import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
interface CommunicationPermissions {
    canCreateConversation: boolean;
    canViewConversation: boolean;
    canUpdateConversation: boolean;
    canDeleteConversation: boolean;
    canSendMessage: boolean;
    canEditMessage: boolean;
    canDeleteMessage: boolean;
    canAddParticipant: boolean;
    canRemoveParticipant: boolean;
    canAccessPatientData: boolean;
    canViewAuditLogs: boolean;
    canManageFiles: boolean;
    canCreateThreads: boolean;
    canSearchMessages: boolean;
}
export declare const requireConversationAccess: (action: keyof CommunicationPermissions) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireMessageAccess: (action: keyof CommunicationPermissions) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePatientAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParticipantRoles: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireFileAccess: (action: "upload" | "download" | "delete") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const enforceConversationTypeRestrictions: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    requireConversationAccess: (action: keyof CommunicationPermissions) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireMessageAccess: (action: keyof CommunicationPermissions) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requirePatientAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validateParticipantRoles: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireFileAccess: (action: "upload" | "download" | "delete") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    enforceConversationTypeRestrictions: (req: AuthRequest, res: Response, next: NextFunction) => void;
    getUserCommunicationPermissions: (userRole: string, workplaceRole?: string, isConversationParticipant?: boolean, isMessageSender?: boolean) => CommunicationPermissions;
};
export default _default;
//# sourceMappingURL=communicationRBAC.d.ts.map