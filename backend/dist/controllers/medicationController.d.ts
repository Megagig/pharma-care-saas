import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getMedications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMedication: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createMedication: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMedication: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteMedication: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientMedications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkInteractions: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=medicationController.d.ts.map