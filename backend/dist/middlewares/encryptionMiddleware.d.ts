import { Request, Response, NextFunction } from 'express';
interface EncryptionRequest extends Request {
    encryptionContext?: {
        keyId: string;
        requiresEncryption: boolean;
        patientId?: string;
        conversationId?: string;
    };
}
export declare const encryptMessageContent: (req: EncryptionRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const decryptMessageContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateEncryptionCompliance: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleEncryptionError: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=encryptionMiddleware.d.ts.map