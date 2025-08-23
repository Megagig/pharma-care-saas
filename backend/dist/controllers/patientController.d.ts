import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getPatients: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchPatients: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=patientController.d.ts.map