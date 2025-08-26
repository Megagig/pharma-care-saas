import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export interface PatientAuthRequest extends AuthRequest {
    isAdmin?: boolean;
    canManage?: boolean;
    patientRole?: PatientManagementRole;
}
export type PatientManagementRole = 'owner' | 'pharmacist' | 'technician' | 'admin';
export type PatientManagementAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export declare const hasPatientManagementPermission: (userRole: string, action: PatientManagementAction, resource?: string) => boolean;
export declare const requirePatientPermission: (action: PatientManagementAction, resource?: string) => (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePatientRead: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePatientCreate: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePatientUpdate: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePatientDelete: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePatientManage: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requireClinicalAssessmentAccess: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const requireVitalsAccess: (req: PatientAuthRequest, res: Response, next: NextFunction) => void;
export declare const checkPharmacyAccess: (req: PatientAuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkPatientPlanLimits: (req: PatientAuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            patientRole?: PatientManagementRole;
            canManage?: boolean;
            isAdmin?: boolean;
        }
    }
}
//# sourceMappingURL=patientRBAC.d.ts.map