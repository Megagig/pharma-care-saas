import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const createAdherenceTracking: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientAdherenceTracking: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addRefill: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMedicationAdherence: (req: AuthRequest, res: Response) => Promise<void>;
export declare const assessPatientAdherence: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addIntervention: (req: AuthRequest, res: Response) => Promise<void>;
export declare const generateAdherenceReport: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientsWithPoorAdherence: (req: AuthRequest, res: Response) => Promise<void>;
export declare const acknowledgeAlert: (req: AuthRequest, res: Response) => Promise<void>;
export declare const resolveAlert: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adherenceController.d.ts.map