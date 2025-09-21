import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const sanitizeMessageContent: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const sanitizeConversationData: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const sanitizeSearchQuery: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateFileUpload: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const preventNoSQLInjection: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const setCommunicationCSP: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateEmojiReaction: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateCommunicationInput: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    sanitizeMessageContent: (req: AuthRequest, res: Response, next: NextFunction) => void;
    sanitizeConversationData: (req: AuthRequest, res: Response, next: NextFunction) => void;
    sanitizeSearchQuery: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateFileUpload: (req: AuthRequest, res: Response, next: NextFunction) => void;
    preventNoSQLInjection: (req: AuthRequest, res: Response, next: NextFunction) => void;
    setCommunicationCSP: (req: Request, res: Response, next: NextFunction) => void;
    validateEmojiReaction: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateCommunicationInput: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=communicationSecurity.d.ts.map