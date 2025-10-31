import { Response, NextFunction } from "express";
import Joi from "joi";
import { AuthRequest } from "../types/auth";
export declare const conversationValidationSchema: Joi.ObjectSchema<any>;
export declare const messageValidationSchema: Joi.ObjectSchema<any>;
export declare const notificationValidationSchema: Joi.ObjectSchema<any>;
export declare const auditLogValidationSchema: Joi.ObjectSchema<any>;
export declare const validateConversation: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateMessage: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateNotification: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateAuditLog: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateConversationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateMessageAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateFileUpload: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateMessageRateLimit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=communicationValidation.d.ts.map