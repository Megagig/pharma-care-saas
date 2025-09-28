import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        [key: string]: any;
    };
}
export declare const createMedication: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMedicationsByPatient: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMedicationById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMedication: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const archiveMedication: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logAdherence: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAdherenceLogs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkInteractions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMedicationDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMedicationAdherenceTrends: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getRecentPatientsWithMedications: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=medicationManagementController.d.ts.map