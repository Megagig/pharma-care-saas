import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
export declare const conversationValidationSchema: any;
export declare const messageValidationSchema: any;
export declare const notificationValidationSchema: any;
export declare const auditLogValidationSchema: any;
export declare const validateConversation: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMessage: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateNotification: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAuditLog: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateConversationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateMessageAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateFileUpload: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMessageRateLimit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=communicationValidation.d.ts.map