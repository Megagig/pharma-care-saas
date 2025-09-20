import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthRequest } from '../types/auth';
export declare const conversationValidationSchema: Joi.ObjectSchema<any>;
export declare const messageValidationSchema: Joi.ObjectSchema<any>;
export declare const notificationValidationSchema: Joi.ObjectSchema<any>;
export declare const auditLogValidationSchema: Joi.ObjectSchema<any>;
export declare const validateConversation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateMessage: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateNotification: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateAuditLog: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateConversationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateMessageAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateFileUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateMessageRateLimit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    validateConversation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateMessage: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateNotification: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateAuditLog: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateConversationAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    validateMessageAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    validateFileUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateMessageRateLimit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=communicationValidation.d.ts.map