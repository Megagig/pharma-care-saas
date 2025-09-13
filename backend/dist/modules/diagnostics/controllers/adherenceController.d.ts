import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth';
export declare const createAdherenceTracking: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPatientAdherenceTracking: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addRefill: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateMedicationAdherence: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const assessPatientAdherence: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addIntervention: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateAdherenceReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPatientsWithPoorAdherence: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const acknowledgeAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const resolveAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adherenceController.d.ts.map