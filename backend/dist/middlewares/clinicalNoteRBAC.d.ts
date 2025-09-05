import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const canCreateClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const canReadClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const canUpdateClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const canDeleteClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const canExportClinicalNotes: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const canAccessConfidentialNotes: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validatePatientAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBulkNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const enforceTenancyIsolation: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const canModifyNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            clinicalNote?: any;
            clinicalNotes?: any[];
            patient?: any;
            tenancyFilter?: any;
        }
    }
}
declare const _default: {
    canCreateClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    canReadClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    canUpdateClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    canDeleteClinicalNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    canExportClinicalNotes: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    canAccessConfidentialNotes: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validatePatientAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validateBulkNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    enforceTenancyIsolation: (req: AuthRequest, res: Response, next: NextFunction) => void;
    canModifyNote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    logNoteAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=clinicalNoteRBAC.d.ts.map