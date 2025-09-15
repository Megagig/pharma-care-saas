import { Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        workplaceId: string;
        locationId?: string;
        role: string;
    };
}
export declare const createClinicalNoteFromDiagnostic: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addDiagnosticDataToMTR: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createMTRFromDiagnostic: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUnifiedPatientTimeline: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const crossReferenceWithExistingRecords: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getIntegrationOptions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=integrationController.d.ts.map