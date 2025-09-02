import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        licenseStatus?: string;
    };
}
export declare const handleValidationErrors: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const validateMedicationHistory: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const validateTherapyPlan: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const validateMTRAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const validateMTRBusinessLogic: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const mtrValidationMiddleware: {
    handleValidationErrors: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    validateMTRAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    validateMTRBusinessLogic: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    validateMedicationHistory: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    validateTherapyPlan: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=mtrValidation.d.ts.map